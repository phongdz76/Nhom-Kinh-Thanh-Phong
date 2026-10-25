import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import type { PublicSite } from "@/domain/models";
import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import dotenv from "dotenv";
import pg from "pg";

const env = dotenv.parse(fs.readFileSync(".env.test.local"));
const origin = "http://127.0.0.1:3010";
const run = Date.now().toString(36);

test("the shared API entry preserves HEAD, OPTIONS, method errors and unknown routes", async ({
  request,
}) => {
  expect((await request.get("/api/health")).status()).toBe(200);
  const head = await request.head("/api/health");
  expect(head.status()).toBe(200);
  expect(await head.body()).toHaveLength(0);
  const options = await request.fetch("/api/auth/login", { method: "OPTIONS" });
  expect(options.status()).toBe(204);
  expect(options.headers().allow).toContain("POST");
  expect(options.headers().allow).not.toContain("GET");
  const unsupported = await request.patch("/api/health");
  expect(unsupported.status()).toBe(405);
  expect(unsupported.headers().allow).toContain("HEAD");
  expect((await request.get("/api/no-such-endpoint")).status()).toBe(404);
});

const phone = () =>
  `09${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
let owner: APIRequestContext;
let editor: APIRequestContext;
let pool: pg.Pool;
const product = (extra = {}) => ({
  code: `T-${randomUUID().slice(0, 8)}`,
  name: `Mẫu cửa ${run}`,
  category: "doors",
  summary: "Sản phẩm kiểm thử backend.",
  subtitle: "Mẫu dùng trong kiểm thử",
  opening: "Mở quay",
  color: "Xám ghi",
  tag: "Kiểm thử",
  image: "/images/hero-house.jpg",
  images: ["/images/hero-house.jpg"],
  status: "draft",
  featured: false,
  ...extra,
});
const lead = (extra = {}) => ({
  name: `Khách kiểm thử ${run}`,
  phone: phone(),
  email: "",
  location: "Khu vực thử",
  message: "Yêu cầu dùng trong kiểm thử.",
  productId: "1",
  type: "quotation",
  source: "/quotation",
  contactAcknowledged: true,
  privacyVersion: "2026-10-v1",
  website: "",
  ...extra,
});

test.beforeAll(async ({ playwright }) => {
  pool = new pg.Pool({ connectionString: env.DATABASE_URL });
  owner = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  editor = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  expect(
    (
      await owner.post("/api/auth/login", {
        data: { email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await editor.post("/api/auth/login", {
        data: {
          email: "editor@thanhphong.test",
          password: env.EDITOR_PASSWORD,
        },
      })
    ).status(),
  ).toBe(200);
});
test.afterAll(async () => {
  await owner?.dispose();
  await editor?.dispose();
  await pool?.end();
});

test("authentication, role checks, CSRF, and private field projection", async ({
  request,
}) => {
  expect((await request.get("/api/admin/state")).status()).toBe(401);
  expect(
    (
      await request.post("/api/admin/products", {
        headers: { Origin: origin },
        data: product(),
      })
    ).status(),
  ).toBe(401);
  const state = await (await editor.get("/api/admin/state")).json();
  expect(state.leads).toEqual([]);
  expect(
    (await editor.patch("/api/admin/settings", { data: {} })).status(),
  ).toBe(403);
  expect((await editor.get("/api/admin/leads")).status()).toBe(403);
  expect(
    (
      await owner.post("/api/admin/products", {
        headers: { Origin: "https://untrusted.example" },
        data: product(),
      })
    ).status(),
  ).toBe(403);
  const publicData: PublicSite = await (
    await request.get("/api/public/site")
  ).json();
  expect(JSON.stringify(publicData)).not.toMatch(
    /password|requestHash|idempotencyKey|OWNER_PASSWORD|sessions/,
  );
  expect((publicData as Record<string, unknown>).leads).toBeUndefined();
});

test("product drafts are private, publishing and category visibility persist", async ({
  request,
}) => {
  const values = product();
  const created = await owner.post("/api/admin/products", { data: values });
  expect(created.status()).toBe(201);
  const saved = (await created.json()).product;
  expect((await request.get(`/api/public/products/${saved.id}`)).status()).toBe(
    404,
  );
  const published = await owner.patch(`/api/admin/products/${saved.id}`, {
    data: { ...saved, status: "published" },
  });
  expect(published.status()).toBe(200);
  const current = (await published.json()).product;
  expect((await request.get(`/api/public/products/${saved.id}`)).status()).toBe(
    200,
  );
  const stale = await owner.patch(`/api/admin/products/${saved.id}`, {
    data: { ...saved, status: "published" },
  });
  expect(stale.status()).toBe(409);
  const hidden = await owner.patch(`/api/admin/products/${saved.id}`, {
    data: { ...current, status: "draft" },
  });
  expect(hidden.status()).toBe(200);
  expect((await request.get(`/api/public/products/${saved.id}`)).status()).toBe(
    404,
  );
  expect((await request.get("/api/public/products?limit=10000")).status()).toBe(
    400,
  );
  expect(
    (await request.get("/api/public/products?q=cua%20nhom")).status(),
  ).toBe(200);
  const category = {
    key: `test-${run}`,
    name: "Test category",
    icon: "door",
    isActive: true,
    sortOrder: 99,
  };
  expect(
    (await owner.post("/api/admin/categories", { data: category })).status(),
  ).toBe(201);
  const visible = await owner.post("/api/admin/products", {
    data: product({ category: category.key, status: "published" }),
  });
  expect(visible.status()).toBe(201);
  const id = (await visible.json()).product.id;
  expect((await request.get(`/api/public/products/${id}`)).status()).toBe(200);
  expect(
    (
      await owner.post("/api/admin/categories", {
        data: { ...category, isActive: false },
      })
    ).status(),
  ).toBe(200);
  expect((await request.get(`/api/public/products/${id}`)).status()).toBe(404);
  const publicData = await (await request.get("/api/public/site")).json();
  expect(
    publicData.products.some((item: { id: string }) => item.id === id),
  ).toBe(false);
});

test("lead submission is durable and simultaneous retries create one lead and one job", async ({
  request,
}) => {
  const key = randomUUID(),
    data = lead();
  const options = { headers: { Origin: origin, "Idempotency-Key": key }, data };
  const responses = await Promise.all([
    request.post("/api/public/leads", options),
    request.post("/api/public/leads", options),
  ]);
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 201]);
  const codes = await Promise.all(
    responses.map(async (r) => (await r.json()).code),
  );
  expect(codes[0]).toBe(codes[1]);
  const rows = await pool.query(
    "SELECT id,code,status FROM leads WHERE idempotency_key=$1",
    [key],
  );
  expect(rows.rowCount).toBe(1);
  expect(rows.rows[0].status).toBe("new");
  const id = rows.rows[0].id;
  expect(
    Number(
      (
        await pool.query("SELECT count(*) FROM lead_events WHERE lead_id=$1", [
          id,
        ])
      ).rows[0].count,
    ),
  ).toBe(1);
  expect(
    Number(
      (
        await pool.query(
          "SELECT count(*) FROM payload_jobs WHERE input->>'leadId'=$1",
          [id],
        )
      ).rows[0].count,
    ),
  ).toBe(1);
  expect(
    (
      await request.post("/api/public/leads", {
        ...options,
        data: { ...data, message: "Changed content" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.post("/api/public/leads", {
        headers: { Origin: origin, "Idempotency-Key": randomUUID() },
        data: { ...lead(), status: "won" },
      })
    ).status(),
  ).toBe(400);
  const updated = await owner.patch(`/api/admin/leads/${id}`, {
    data: { status: "contacted", note: "Đã trao đổi nhu cầu." },
  });
  expect(updated.status()).toBe(200);
  const detail = await (await owner.get(`/api/admin/leads/${id}`)).json();
  expect(detail.events).toHaveLength(2);
  expect(detail.lead.status).toBe("contacted");
  expect((await request.get(`/api/admin/leads/${id}`)).status()).toBe(401);
});

test("queue insertion failure rolls back lead and history together", async ({
  request,
}) => {
  const key = randomUUID();
  await pool.query(`CREATE OR REPLACE FUNCTION test_fail_notification() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Test queue failure'; END $$;
    CREATE TRIGGER test_fail_notification BEFORE INSERT ON payload_jobs FOR EACH ROW EXECUTE FUNCTION test_fail_notification();`);
  try {
    const response = await request.post("/api/public/leads", {
      headers: { Origin: origin, "Idempotency-Key": key },
      data: lead(),
    });
    expect(response.status()).toBe(503);
    expect(
      (await pool.query("SELECT id FROM leads WHERE idempotency_key=$1", [key]))
        .rowCount,
    ).toBe(0);
  } finally {
    await pool.query(
      "DROP TRIGGER IF EXISTS test_fail_notification ON payload_jobs; DROP FUNCTION IF EXISTS test_fail_notification();",
    );
  }
});

test("authenticated uploads decode to WebP and reject disguised files", async ({
  request,
}) => {
  const response = await owner.post("/api/admin/media", {
    multipart: {
      alt: "Ảnh kiểm thử upload",
      file: {
        name: "bathroom.jpg",
        mimeType: "image/jpeg",
        buffer: fs.readFileSync("public/images/bathroom.jpg"),
      },
    },
  });
  expect(response.status()).toBe(201);
  const media = await response.json();
  const image = await request.get(media.url);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/webp");
  expect((await image.body()).byteLength).toBeGreaterThan(100);
  expect(
    (
      await owner.post("/api/admin/media", {
        multipart: {
          alt: "Invalid image",
          file: {
            name: "image.jpg",
            mimeType: "image/jpeg",
            buffer: Buffer.from("<svg><script>bad()</script></svg>"),
          },
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/admin/media", {
        headers: { Origin: origin },
        multipart: {
          alt: "No access",
          file: {
            name: "x.jpg",
            mimeType: "image/jpeg",
            buffer: Buffer.from("invalid"),
          },
        },
      })
    ).status(),
  ).toBe(401);
});

test("posts and projects are editable server content with unpublished records hidden", async ({
  request,
}) => {
  const slug = `post-${run}`;
  const data = {
    slug,
    title: `Bài viết ${run}`,
    category: "Kiểm thử",
    image: "/images/hero-house.jpg",
    intro: "Nội dung giới thiệu.",
    time: "2 phút đọc",
    sections: [
      { title: "Nội dung", text: "Nội dung được lưu trong PostgreSQL." },
    ],
    status: "draft",
  };
  expect(
    (await owner.post("/api/admin/content/posts", { data })).status(),
  ).toBe(201);
  let state: PublicSite = await (await request.get("/api/public/site")).json();
  expect(state.articles.some((item) => item.slug === slug)).toBe(false);
  expect(
    (
      await owner.post("/api/admin/content/posts", {
        data: { ...data, status: "published" },
      })
    ).status(),
  ).toBe(200);
  state = await (await request.get("/api/public/site")).json();
  expect(state.articles.some((item) => item.slug === slug)).toBe(true);
  const project = {
    slug: `project-${run}`,
    title: `Công trình ${run}`,
    category: "house",
    type: "Nhà phố",
    description: "Công trình dùng để kiểm thử.",
    image: "/images/hero-house.jpg",
    images: [],
    products: ["1"],
    status: "published",
  };
  expect(
    (
      await owner.post("/api/admin/content/projects", { data: project })
    ).status(),
  ).toBe(201);
  expect((await request.get(`/projects/${project.slug}`)).status()).toBe(200);
});

test("admin edits reach a separate anonymous browser and public form reaches admin", async ({
  browser,
}) => {
  const context = await browser.newContext({
    storageState: await owner.storageState(),
  });
  const page = await context.newPage();
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  publicPage.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${origin}/admin?tab=products`);
    await page
      .getByRole("button", { name: "Thêm sản phẩm", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Tên sản phẩm").fill(`Cửa E2E ${run}`);
    await dialog.getByLabel("Mã sản phẩm").fill(`E2E-${run}`);
    await dialog
      .getByLabel("Mô tả", { exact: false })
      .fill("Nội dung kiểm thử trên hai trình duyệt riêng.");
    await dialog.getByLabel("Trạng thái").selectOption("published");
    await dialog.getByRole("button", { name: "Lưu sản phẩm" }).click();
    await expect(dialog).not.toBeVisible();
    await publicPage.goto(`${origin}/products`);
    await publicPage
      .getByRole("textbox", { name: "Tìm kiếm sản phẩm" })
      .fill(`E2E-${run}`);
    await expect(publicPage.locator(".product-card")).toHaveCount(1);
    await publicPage
      .getByRole("link", { name: `Xem Cửa E2E ${run}`, exact: true })
      .click();
    await publicPage.getByRole("link", { name: "Nhận tư vấn mẫu này" }).click();
    await publicPage.getByLabel("Họ và tên").fill(`Khách E2E ${run}`);
    await publicPage.getByLabel("Số điện thoại").fill(phone());
    await publicPage.locator("input[type=checkbox]").check();
    await publicPage
      .getByRole("button", { name: "Gửi yêu cầu tư vấn" })
      .click();
    await expect(publicPage.locator(".form-success")).toContainText(
      "được lưu vào hệ thống",
    );
    await page.goto(`${origin}/admin?tab=leads`);
    await expect(page.locator(".admin-table")).toContainText(
      `Khách E2E ${run}`,
    );
    const row = page.locator("tr").filter({ hasText: `Khách E2E ${run}` });
    await row.getByRole("button", { name: "Chi tiết" }).click();
    await page.getByLabel("Trạng thái xử lý").selectOption("contacted");
    await page.getByRole("button", { name: "Lưu cập nhật" }).click();
    await page.reload();
    await expect(
      page.locator("tr").filter({ hasText: `Khách E2E ${run}` }),
    ).toContainText("Đã liên hệ");
    expect(await publicPage.evaluate(() => localStorage.length)).toBe(0);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await visitor.close();
  }
});

test("responsive layouts and menu underline removal remain correct", async ({
  browser,
}) => {
  const context = await browser.newContext({
    storageState: await owner.storageState(),
  });
  const page = await context.newPage();
  try {
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        "/",
        "/products",
        "/products/1",
        "/quotation",
        "/admin",
      ]) {
        await page.goto(origin + route);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${width} ${route}`,
        ).toBe(true);
      }
    }
    await page.goto(origin + "/");
    expect(
      await page
        .locator(".desktop-nav a.active")
        .evaluate((el) => getComputedStyle(el, "::after").content),
    ).toBe("none");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await expect(
      page.getByRole("navigation", { name: "Điều hướng trên điện thoại" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("notification worker delivers to a local SMTP fixture without external messages", async ({
  request,
}) => {
  const received: string[] = [];
  const server = createServer((socket) => {
    socket.setEncoding("utf8");
    socket.write("220 localhost test SMTP\r\n");
    let buffer = "",
      data = false,
      message = "";
    socket.on("data", (chunk) => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (data) {
          if (line === ".") {
            data = false;
            received.push(message);
            message = "";
            socket.write("250 accepted\r\n");
          } else message += line + "\n";
          continue;
        }
        if (/^EHLO|^HELO/.test(line)) socket.write("250 localhost\r\n");
        else if (/^MAIL|^RCPT|^RSET/.test(line)) socket.write("250 ok\r\n");
        else if (/^DATA/.test(line)) {
          data = true;
          socket.write("354 send data\r\n");
        } else if (/^QUIT/.test(line)) {
          socket.end("221 bye\r\n");
        } else socket.write("250 ok\r\n");
      }
    });
  });
  await new Promise<void>((resolve) =>
    server.listen(2526, "127.0.0.1", resolve),
  );
  try {
    const key = randomUUID();
    const created = await request.post("/api/public/leads", {
      headers: { Origin: origin, "Idempotency-Key": key },
      data: lead(),
    });
    expect(created.status()).toBe(201);
    await promisify(execFile)(
      process.execPath,
      ["--import", "tsx", "scripts/jobs.ts"],
      {
        env: { ...process.env, ...env, ENV_FILE: ".env.test.local" },
        timeout: 30000,
      },
    );
    const row = (
      await pool.query(
        "SELECT code,notification_state FROM leads WHERE idempotency_key=$1",
        [key],
      )
    ).rows[0];
    expect(row.notification_state).toBe("sent");
    expect(received.some((text) => text.includes(row.code))).toBe(true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("logout revokes the server session even when an old cookie is replayed", async ({
  playwright,
}) => {
  const client = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  const otherSession = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  try {
    const login = await client.post("/api/auth/login", {
      data: { email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD },
    });
    expect(login.status()).toBe(200);
    expect((await login.json()).token).toBeUndefined();
    expect(
      (
        await otherSession.post("/api/auth/login", {
          data: { email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD },
        })
      ).status(),
    ).toBe(200);
    const cookie = (await client.storageState()).cookies.find(
      (item) => item.name === "thanhphong-token",
    );
    assert.ok(cookie, "Login must return a session cookie");
    expect(cookie.httpOnly).toBe(true);
    expect((await client.post("/api/auth/logout", { data: {} })).status()).toBe(
      200,
    );
    expect(
      (
        await client.get("/api/admin/state", {
          headers: { Cookie: `${cookie.name}=${cookie.value}` },
        })
      ).status(),
    ).toBe(401);
    expect((await otherSession.get("/api/admin/state")).status()).toBe(200);
  } finally {
    await client.dispose();
    await otherSession.dispose();
  }
});

test("password change verifies the old password and revokes every session", async ({
  playwright,
}) => {
  const client = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin },
  });
  const email = "editor@thanhphong.test";
  const newPassword = randomUUID() + randomUUID();
  let changed = false;
  try {
    expect(
      (
        await client.post("/api/auth/login", {
          data: { email, password: env.EDITOR_PASSWORD },
        })
      ).status(),
    ).toBe(200);
    const cookie = (await client.storageState()).cookies.find(
      (item) => item.name === "thanhphong-token",
    );
    assert.ok(cookie, "Login must return a session cookie");
    expect(
      (
        await client.post("/api/auth/password", {
          data: { currentPassword: "incorrect-password", newPassword },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await client.post("/api/auth/password", {
          data: { currentPassword: env.EDITOR_PASSWORD, newPassword },
        })
      ).status(),
    ).toBe(200);
    changed = true;
    expect((await editor.get("/api/admin/state")).status()).toBe(401);
    expect(
      (
        await client.get("/api/admin/state", {
          headers: { Cookie: `${cookie.name}=${cookie.value}` },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await client.post("/api/auth/login", {
          data: { email, password: env.EDITOR_PASSWORD },
        })
      ).status(),
    ).toBe(401);
    expect(
      (
        await client.post("/api/auth/login", {
          data: { email, password: newPassword },
        })
      ).status(),
    ).toBe(200);
  } finally {
    if (changed) {
      await client.post("/api/auth/login", {
        data: { email, password: newPassword },
      });
      expect(
        (
          await client.post("/api/auth/password", {
            data: {
              currentPassword: newPassword,
              newPassword: env.EDITOR_PASSWORD,
            },
          })
        ).status(),
      ).toBe(200);
    }
    await client.dispose();
  }
});
