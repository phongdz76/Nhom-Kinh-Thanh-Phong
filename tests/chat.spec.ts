import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import type { Settings } from "@/domain/models";
import fs from "node:fs";
import dotenv from "dotenv";

const origin = "http://127.0.0.1:3010";
const link = "https://tawk.to/chat/0123456789abcdef01234567/1testwidget";
let owner: APIRequestContext;
let previous: Settings | undefined;

test.describe.configure({ mode: "serial" });
test.beforeAll(async ({ playwright }) => {
  const env = dotenv.parse(fs.readFileSync(".env.test.local"));
  owner = await playwright.request.newContext({
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
  previous = (await (await owner.get("/api/admin/state")).json()).settings;
  expect(
    (
      await owner.patch("/api/admin/settings", {
        data: { ...previous, tawkDirectChatUrl: link },
      })
    ).status(),
  ).toBe(200);
});
test.afterAll(async () => {
  if (previous)
    expect(
      (await owner.patch("/api/admin/settings", { data: previous })).status(),
    ).toBe(200);
  await owner?.dispose();
});

// This script runs in the embedded frame. No test messages reach tawk.to.
const sdk = `
  const api=window.Tawk_API;
  const mount=document.getElementById(api.embedded);
  if(!mount)throw new Error('Missing embedded widget target');
  const input=document.createElement('textarea');
  input.setAttribute('aria-label','Test message');
  mount.append(input);
  const branding=document.createElement('p');
  branding.textContent='Powered by tawk.to';
  mount.append(branding);
  queueMicrotask(()=>api.onLoad());
`;

test("owner configures embedded chat; the inside close button preserves drafts without reloading the widget", async ({
  page,
  context,
}) => {
  test.setTimeout(60000);
  await context.addCookies((await owner.storageState()).cookies);
  let scripts = 0;
  await page.route("https://embed.tawk.to/**", (route) => {
    scripts++;
    expect(route.request().url()).toBe(
      "https://embed.tawk.to/0123456789abcdef01234567/1testwidget",
    );
    expect(route.request().frame().parentFrame()).not.toBeNull();
    return route.fulfill({ contentType: "application/javascript", body: sdk });
  });
  await page.goto("/admin?tab=settings");
  const input = page.getByLabel("Chat trực tiếp tawk.to", { exact: true });
  await expect(input).toHaveValue(link);
  await input.fill("");
  await page.getByRole("button", { name: "Lưu thông tin" }).click();
  await page.getByRole("link", { name: "Trở về website" }).click();
  await expect(
    page.getByRole("link", { name: "Gửi form tư vấn", exact: true }),
  ).toHaveAttribute("href", "/quotation");
  await expect(page.locator(".floating-consult")).toHaveCount(0);
  expect(scripts).toBe(0);
  await page.goBack();
  await input.fill(link);
  await page.getByRole("button", { name: "Lưu thông tin" }).click();
  await expect
    .poll(
      async () =>
        (await (await owner.get("/api/admin/state")).json()).settings
          .tawkDirectChatUrl,
    )
    .toBe(link);
  expect(
    (
      await owner.patch("/api/admin/settings", {
        data: { ...previous, tawkDirectChatUrl: "https://evil.example/chat" },
      })
    ).status(),
  ).toBe(400);
  await page.getByRole("link", { name: "Trở về website" }).click();
  const trigger = page.getByRole("button", {
    name: "Chat tư vấn",
    exact: true,
  });
  await expect(trigger).toBeVisible();
  await expect(page.locator(".live-chat-frame")).toHaveCount(0);
  expect(scripts).toBe(0);
  await trigger.click();
  const chat = page.getByRole("dialog", { name: "Chat tư vấn", exact: true });
  await expect(chat).toBeVisible();
  await expect(chat.locator(".live-chat-body")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const embedded = page.frameLocator(".live-chat-frame");
  await expect(embedded.getByText("Powered by tawk.to")).toBeVisible();
  await embedded
    .getByRole("textbox", { name: "Test message" })
    .fill("Unsent draft");
  const close = chat.getByRole("button", { name: "Đóng chat tư vấn" });
  expect(
    await close.evaluate((element) => !!element.closest(".live-chat-header")),
  ).toBe(true);
  await close.click();
  await expect(chat).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(embedded.getByRole("textbox")).toHaveValue("Unsent draft");
  expect(scripts).toBe(1);
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Giới thiệu" })
    .click();
  await expect(chat).toBeVisible();
  await expect(embedded.getByRole("textbox")).toHaveValue("Unsent draft");
  await page.goBack();
  await page.goBack();
  await expect(input).toBeVisible();
  await expect(page.locator(".live-chat-frame")).toHaveCount(0);
  await expect(page.locator(".floating-consult")).toHaveCount(0);
  await page.getByRole("link", { name: "Trở về website" }).click();
  await trigger.click();
  await expect(chat.locator(".live-chat-body")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  expect(scripts).toBe(2);
  await page.getByRole("button", { name: "Đóng chat tư vấn" }).focus();
  await page.keyboard.press("Escape");
  await expect(chat).toBeHidden();
});

test("slow or forged readiness messages cannot open chat over admin", async ({
  page,
  context,
}) => {
  await context.addCookies((await owner.storageState()).cookies);
  let release = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("https://embed.tawk.to/**", async (route) => {
    await pending;
    await route
      .fulfill({ contentType: "application/javascript", body: sdk })
      .catch(() => {});
  });
  try {
    await page.goto("/admin?tab=settings");
    await page.getByRole("link", { name: "Trở về website" }).click();
    await page
      .getByRole("button", { name: "Chat tư vấn", exact: true })
      .click();
    const body = page.locator(".live-chat-body");
    await expect(body).toHaveAttribute("aria-busy", "true");
    await page.evaluate(() =>
      window.postMessage(
        { type: "thanhphong:chat:ready" },
        window.location.origin,
      ),
    );
    await expect(body).toHaveAttribute("aria-busy", "true");
    await page.goBack();
    await expect(
      page.getByLabel("Chat trực tiếp tawk.to", { exact: true }),
    ).toBeVisible();
    release();
    await expect(page.locator(".live-chat-panel")).toHaveCount(0);
    await page.getByRole("link", { name: "Trở về website" }).click();
    await page
      .getByRole("button", { name: "Chat tư vấn", exact: true })
      .click();
    await expect(page.locator(".live-chat-body")).toHaveAttribute(
      "aria-busy",
      "false",
    );
  } finally {
    release();
  }
});

test("blocked chat remains closable inside a panel that fits small mobile screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.route("https://embed.tawk.to/**", (route) => route.abort());
  await page.goto("/contact");
  await page.getByRole("button", { name: "Chat tư vấn", exact: true }).click();
  const chat = page.getByRole("dialog", { name: "Chat tư vấn", exact: true });
  await expect(chat.getByRole("alert")).toContainText(
    "Chưa kết nối được khung chat",
  );
  await expect(
    chat.getByRole("link", { name: "Gửi yêu cầu tư vấn" }),
  ).toHaveAttribute("href", "/quotation");
  expect(
    await chat.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return (
        box.left >= 0 &&
        box.right <= innerWidth &&
        box.top >= 0 &&
        box.bottom <= innerHeight
      );
    }),
  ).toBe(true);
  const close = chat.getByRole("button", { name: "Đóng chat tư vấn" });
  await expect(close).toBeVisible();
  await close.click();
  await expect(chat).toBeHidden();
});
