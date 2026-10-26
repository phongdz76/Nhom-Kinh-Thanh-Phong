import { test, expect } from "./fixtures/browser";
import type { APIRequestContext, Page } from "@playwright/test";
import fs from "node:fs";
import dotenv from "dotenv";
import pg from "pg";
import { randomUUID } from "node:crypto";

const env = dotenv.parse(fs.readFileSync(".env.test.local"));
const origin = "http://127.0.0.1:3010";
const privateLead = "PRIVATE-OWNER-SESSION-FIXTURE";
let pool: pg.Pool;

test.beforeAll(() => {
  const database = new URL(env.DATABASE_URL);
  if (
    database.pathname !== "/thanhphong_test" ||
    database.hostname !== "127.0.0.1"
  )
    throw new Error("Session tests require the dedicated local test database.");
  pool = new pg.Pool({ connectionString: env.DATABASE_URL });
});
test.beforeEach(async () => {
  await pool.query("DELETE FROM rate_limits");
});
test.afterEach(async () => {
  await pool.query(
    "DELETE FROM payload_jobs WHERE input->>'leadId' IN (SELECT id::text FROM leads WHERE name=$1)",
    [privateLead],
  );
  await pool.query(
    "DELETE FROM lead_events WHERE lead_id IN (SELECT id FROM leads WHERE name=$1)",
    [privateLead],
  );
  await pool.query("DELETE FROM leads WHERE name=$1", [privateLead]);
});
test.afterAll(async () => {
  await pool?.end();
});

async function login(client: APIRequestContext, editor = false) {
  const response = await client.post(`${origin}/api/auth/login`, {
    headers: { Origin: origin },
    data: editor
      ? { email: "editor@thanhphong.test", password: env.EDITOR_PASSWORD }
      : { email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD },
  });
  expect(response.status()).toBe(200);
}

async function ownerPage(page: Page) {
  await login(page.request);
  const created = await page.request.post(`${origin}/api/public/leads`, {
    headers: {
      Origin: origin,
      "X-Form-Token": "offline-form-test-token",
      "Idempotency-Key": randomUUID(),
    },
    data: {
      name: privateLead,
      phone: `09${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`,
      type: "consultation",
      source: "/quotation",
      contactAcknowledged: true,
      privacyVersion: "2026-10-v1",
      website: "",
    },
  });
  expect(created.status()).toBe(201);
  await page.goto("/admin?tab=leads");
  await expect(
    page.getByText(privateLead, { exact: true }).first(),
  ).toBeVisible();
  return (
    await page.request.get(`${origin}/api/admin/state`, {
      headers: { Origin: origin },
    })
  ).json();
}

test("logout clears every tab and browser back cannot restore private state", async ({
  page,
  context,
}) => {
  await ownerPage(page);
  const other = await context.newPage();
  await other.goto("/admin?tab=products");
  await expect(other.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(other).toHaveURL(/\/admin\/login$/);
  await page.goBack();
  await expect(page.getByText(privateLead, { exact: true })).toHaveCount(0);
  expect(
    (
      await page.request.get(`${origin}/api/admin/state`, {
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(401);
});

test("expired cookies discard a delayed owner response after a newer unauthorized refresh", async ({
  page,
  context,
}) => {
  const snapshot = await ownerPage(page);
  let release = () => {};
  let intercepted = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const waiting = new Promise<void>((resolve) => {
    intercepted = resolve;
  });
  let first = true;
  await page.route("**/api/admin/state", async (route) => {
    if (!first) return route.fallback();
    first = false;
    intercepted();
    await pending;
    await route.fulfill({ status: 200, json: snapshot }).catch(() => {});
  });
  try {
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await waiting;
    await context.clearCookies();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page).toHaveURL(/\/admin\/login$/);
    release();
    await expect(page.getByText(privateLead, { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Đăng nhập", exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
});

test("a changed account replaces the full admin snapshot and closes owner-only UI", async ({
  page,
}) => {
  await ownerPage(page);
  await login(page.request, true);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".admin-user")).toContainText(
    "editor@thanhphong.test",
  );
  await expect(
    page.getByRole("button", { name: "Cài đặt cơ sở", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Yêu cầu tư vấn", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(privateLead, { exact: true })).toHaveCount(0);
  expect(
    (
      await page.request.get(`${origin}/api/admin/leads`, {
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(403);
});

test("an unauthorized mutation clears the admin instead of retaining editable private data", async ({
  page,
  context,
}) => {
  await ownerPage(page);
  await page
    .getByRole("button", { name: "Cài đặt cơ sở", exact: true })
    .click();
  await context.clearCookies();
  await page
    .getByRole("button", { name: "Lưu thông tin", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.locator(".admin-app")).toHaveCount(0);
  await expect(page.getByText(privateLead, { exact: true })).toHaveCount(0);
});

test("concurrent login and logout cannot overwrite sessions or resurrect revoked cookies", async ({
  playwright,
}) => {
  const clients = await Promise.all(
    [0, 1, 2].map(() =>
      playwright.request.newContext({
        baseURL: origin,
        extraHTTPHeaders: { Origin: origin },
      }),
    ),
  );
  try {
    await Promise.all([login(clients[0]), login(clients[1])]);
    for (const client of clients.slice(0, 2))
      expect((await client.get("/api/admin/state")).status()).toBe(200);
    const cookies = await Promise.all(
      clients.slice(0, 2).map(async (client) => {
        const cookie = (await client.storageState()).cookies.find(
          (item) => item.name === "thanhphong-token",
        );
        expect(cookie).toBeTruthy();
        return `${cookie!.name}=${cookie!.value}`;
      }),
    );
    const results = await Promise.all([
      clients[0].post("/api/auth/logout", { data: {} }),
      clients[1].post("/api/auth/logout", { data: {} }),
      login(clients[2]),
    ]);
    expect(results[0]!.status()).toBe(200);
    expect(results[1]!.status()).toBe(200);
    for (const cookie of cookies)
      expect(
        (
          await clients[0].get("/api/admin/state", {
            headers: { Cookie: cookie },
          })
        ).status(),
      ).toBe(401);
    expect((await clients[2].get("/api/admin/state")).status()).toBe(200);
  } finally {
    await Promise.all(clients.map((client) => client.dispose()));
  }
});
