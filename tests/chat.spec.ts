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

// Local SDK fixture: no visitor messages or test credentials reach tawk.to.
const sdk = `
  const api = window.Tawk_API;
  const chat = document.createElement('section');
  chat.setAttribute('role', 'dialog');
  chat.setAttribute('aria-label', 'Test live chat');
  chat.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:9999;padding:24px;background:white;border:1px solid #ccc;';
  const close = document.createElement('button');
  close.textContent = 'Minimize test chat';
  close.onclick = () => api.onChatMinimized?.();
  chat.append(close);
  chat.hidden = true;
  document.body.append(chat);
  api.hideWidget = () => { chat.hidden = true; };
  api.showWidget = () => { chat.hidden = false; };
  api.maximize = () => { chat.hidden = false; };
  api.shutdown = () => { document.body.dataset.chatSuspended = 'true'; };
  api.start = () => { document.body.dataset.chatSuspended = 'false'; };
  queueMicrotask(() => { api.onBeforeLoad?.(); api.onLoad?.(); });
`;

test("owner configures chat; widget loads on demand once, survives public navigation and suspends in admin", async ({
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
    return route.fulfill({ contentType: "application/javascript", body: sdk });
  });
  await page.goto("/admin?tab=settings");
  const input = page.getByLabel("Chat trực tiếp tawk.to", { exact: true });
  await expect(input).toHaveValue(link);
  await input.fill("");
  await page.getByRole("button", { name: "Lưu thông tin" }).click();
  await expect(input).toHaveValue("");
  await page.getByRole("link", { name: "Trở về website" }).click();
  await expect(
    page.getByRole("link", { name: "Gửi form tư vấn", exact: true }),
  ).toHaveAttribute("href", "/quotation");
  expect(scripts).toBe(0);
  await page.goBack();
  await expect(input).toBeVisible();
  await input.fill(link);
  await page.getByRole("button", { name: "Lưu thông tin" }).click();
  await expect
    .poll(async () => {
      const state = await (await owner.get("/api/admin/state")).json();
      return state.settings.tawkDirectChatUrl;
    })
    .toBe(link);
  const invalid = await owner.patch("/api/admin/settings", {
    data: { ...previous, tawkDirectChatUrl: "https://evil.example/chat" },
  });
  expect(invalid.status()).toBe(400);
  await page.getByRole("link", { name: "Trở về website" }).click();
  const trigger = page.getByRole("button", {
    name: "Chat tư vấn",
    exact: true,
  });
  await expect(trigger).toBeVisible();
  expect(scripts).toBe(0);
  await trigger.click();
  const chat = page.getByRole("dialog", { name: "Test live chat" });
  await expect(chat).toBeVisible();
  expect(scripts).toBe(1);
  await page.getByRole("button", { name: "Minimize test chat" }).click();
  await expect(chat).toBeHidden();
  await trigger.click();
  await expect(chat).toBeVisible();
  expect(scripts).toBe(1);
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Giới thiệu" })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(chat).toBeVisible();
  await page.goBack();
  await page.goBack();
  await expect(input).toBeVisible();
  await expect(chat).toBeHidden();
  await expect(page.locator("body")).toHaveAttribute(
    "data-chat-suspended",
    "true",
  );
  await expect(page.locator(".floating-consult")).toHaveCount(0);
  await page.getByRole("link", { name: "Trở về website" }).click();
  await trigger.click();
  await expect(chat).toBeVisible();
  expect(scripts).toBe(1);
});

test("a slow widget never opens over admin and can be reopened after returning to the website", async ({
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
    await route.fulfill({ contentType: "application/javascript", body: sdk });
  });
  try {
    await page.goto("/admin?tab=settings");
    await page.getByRole("link", { name: "Trở về website" }).click();
    await page
      .getByRole("button", { name: "Chat tư vấn", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Đang mở chat" }),
    ).toBeDisabled();
    await page.goBack();
    await expect(
      page.getByLabel("Chat trực tiếp tawk.to", { exact: true }),
    ).toBeVisible();
    release();
    await expect(page.locator("body")).toHaveAttribute(
      "data-chat-suspended",
      "true",
    );
    const chat = page.getByRole("dialog", { name: "Test live chat" });
    await expect(chat).toBeHidden();
    await page.getByRole("link", { name: "Trở về website" }).click();
    await page
      .getByRole("button", { name: "Chat tư vấn", exact: true })
      .click();
    await expect(chat).toBeVisible();
  } finally {
    release();
  }
});

test("blocked widget offers direct chat and the consultation form on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 667 });
  await page.route("https://embed.tawk.to/**", (route) => route.abort());
  await page.goto("/contact");
  await page.getByRole("button", { name: "Chat tư vấn", exact: true }).click();
  const error = page.locator(".live-chat-error[role='alert']");
  await expect(error).toContainText("Chưa mở được khung chat");
  const direct = error.getByRole("link", { name: "Mở chat trực tiếp" });
  await expect(direct).toHaveAttribute("href", link);
  await expect(direct).toHaveAttribute("rel", "noopener noreferrer");
  await expect(
    error.getByRole("link", { name: "Gửi yêu cầu tư vấn" }),
  ).toHaveAttribute("href", "/quotation");
  expect(
    await error.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return (
        box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight
      );
    }),
  ).toBe(true);
  await page.getByRole("button", { name: "Đóng thông báo chat" }).click();
  await expect(error).toHaveCount(0);
});
