import { test, expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import dotenv from "dotenv";
import sharp from "sharp";
import jsQR from "jsqr";
import QRCode from "qrcode";

const env = dotenv.parse(fs.readFileSync(".env.test.local"));
const origin = "http://127.0.0.1:3010";
const zalo = "https://zalo.me/0931429277";

async function login(page: Page) {
  const response = await page.request.post(`${origin}/api/auth/login`, {
    headers: { Origin: origin },
    data: { email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD },
  });
  expect(response.status()).toBe(200);
}

async function decodeImage(locator: Locator) {
  await expect
    .poll(() =>
      locator.evaluate(
        (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
      ),
    )
    .toBe(true);
  const screenshot = await locator.screenshot();
  const { data, info } = await sharp(screenshot)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  expect(code, "The displayed QR must remain scannable").toBeTruthy();
  assert.ok(code, "The QR code could not be decoded");
  return code.data;
}

test("login password visibility preserves its value and does not submit the form", async ({
  page,
}) => {
  await page.goto("/admin/login");
  const input = page.getByLabel("Mật khẩu", { exact: true });
  await input.fill("only-testing-visibility");
  await expect(input).toHaveAttribute("type", "password");
  await page
    .getByRole("button", { name: "Hiện mật khẩu", exact: true })
    .click();
  await expect(input).toHaveAttribute("type", "text");
  await expect(input).toHaveValue("only-testing-visibility");
  await page.getByRole("button", { name: "Ẩn mật khẩu", exact: true }).click();
  await expect(input).toHaveAttribute("type", "password");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("short screens can scroll the sidebar and mobile navigation reaches password settings", async ({
  page,
}) => {
  await login(page);
  await page.setViewportSize({ width: 1280, height: 560 });
  await page.goto("/admin?tab=security");
  await expect(
    page.getByRole("heading", { name: "Đổi mật khẩu quản trị" }),
  ).toBeVisible();
  const sidebar = page.locator(".admin-sidebar");
  await sidebar.hover();
  await page.mouse.wheel(0, 1800);
  await expect
    .poll(() => sidebar.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await expect(
    sidebar.getByRole("button", { name: "Đăng xuất", exact: true }),
  ).toBeInViewport();
  const current = page.getByLabel("Mật khẩu hiện tại", { exact: true });
  await current.fill("visibility-only");
  await page
    .getByRole("button", { name: "Hiện mật khẩu hiện tại", exact: true })
    .click();
  await expect(current).toHaveAttribute("type", "text");
  await page
    .getByRole("button", { name: "Ẩn mật khẩu hiện tại", exact: true })
    .click();
  await expect(current).toHaveAttribute("type", "password");
  const next = page.getByLabel("Mật khẩu mới", { exact: true });
  await page
    .getByRole("button", { name: "Hiện mật khẩu mới", exact: true })
    .click();
  await expect(next).toHaveAttribute("type", "text");
  await expect(current).toHaveAttribute("type", "password");

  await page.setViewportSize({ width: 390, height: 480 });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Mở menu quản trị" }).click();
  await sidebar.getByRole("button", { name: "Mật khẩu & bảo mật" }).click();
  await expect(
    page.getByRole("heading", { name: "Đổi mật khẩu quản trị" }),
  ).toBeVisible();
  await expect(page.locator(".sidebar-backdrop")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Đổi mật khẩu", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "Đổi mật khẩu", exact: true }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Zalo settings persist, original and generated QR codes scan, and visitors can open and close the dialog", async ({
  page,
  browser,
}) => {
  await login(page);
  const stateResponse = await page.request.get(`${origin}/api/admin/state`, {
    headers: { Origin: origin },
  });
  expect(stateResponse.status()).toBe(200);
  const { settings } = await stateResponse.json();
  const visitor = await browser.newContext({
    viewport: { width: 390, height: 667 },
  });
  const publicPage = await visitor.newPage();
  const errors: string[] = [];
  publicPage.on("pageerror", (error) => errors.push(error.message));
  try {
    const saved = await page.request.patch(`${origin}/api/admin/settings`, {
      headers: { Origin: origin },
      data: { ...settings, zalo, zaloQr: "/images/zalo-contact-qr.svg" },
    });
    expect(saved.status()).toBe(200);
    await page.goto("/admin?tab=settings");
    await expect(page.getByLabel("Liên kết Zalo", { exact: true })).toHaveValue(
      zalo,
    );
    await publicPage.goto("/");
    const trigger = publicPage.locator(".floating-zalo");
    const bounds = await trigger.boundingBox();
    assert.ok(bounds, "The Zalo trigger must have visible bounds");
    expect(bounds.width).toBe(bounds.height);
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    await expect(trigger).toHaveAccessibleName("Mở mã QR Zalo");
    expect(
      await trigger.evaluate(
        (el) => getComputedStyle(el, "::before").animationName,
      ),
    ).toBe("zalo-wave");
    await publicPage.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await trigger.evaluate(
        (el) => getComputedStyle(el, "::before").animationName,
      ),
    ).toBe("none");
    await publicPage.emulateMedia({ reducedMotion: "no-preference" });
    await trigger.click();
    const dialog = publicPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: "Nhắn tin qua Zalo" }),
    ).toHaveAttribute("href", zalo);
    expect(await decodeImage(dialog.locator(".zalo-qr-image"))).toBe(
      "https://zaloapp.com/qr/p/prjbrcpy5vvt",
    );
    expect(
      await dialog.evaluate(
        (el) => el.getBoundingClientRect().right <= innerWidth,
      ),
    ).toBe(true);
    await publicPage.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(
      await publicPage.evaluate(() => document.body.style.overflow),
    ).not.toBe("hidden");
    await trigger.click();
    await publicPage.getByRole("button", { name: "Đóng mã QR Zalo" }).click();
    await expect(dialog).toHaveCount(0);

    // Upload a QR through the same settings control used by the owner.
    const qr = await QRCode.toBuffer(zalo, { width: 320, margin: 4 });
    await page
      .getByLabel("Ảnh QR Zalo (không bắt buộc)")
      .setInputFiles({ name: "zalo.png", mimeType: "image/png", buffer: qr });
    await expect(page.locator(".zalo-settings-preview img")).toHaveAttribute(
      "src",
      /^\/api\/media\//,
    );
    const uploadSrc = await page
      .locator(".zalo-settings-preview img")
      .getAttribute("src");
    assert.ok(uploadSrc, "The uploaded image must have a source");
    await page
      .getByRole("button", { name: "Lưu thông tin", exact: true })
      .click();
    await expect(page.locator(".toast[role='status']")).toContainText(
      "Đã cập nhật",
    );
    await page.reload();
    await expect(page.locator(".zalo-settings-preview img")).toHaveAttribute(
      "src",
      uploadSrc,
    );
    await publicPage.reload();
    await trigger.click();
    expect(await decodeImage(dialog.locator(".zalo-qr-image"))).toBe(zalo);
    await publicPage.keyboard.press("Escape");

    await page.getByRole("button", { name: "Gỡ ảnh QR đã chọn" }).click();
    await expect(page.locator(".zalo-settings-preview img")).toHaveAttribute(
      "src",
      /^data:image\/png/,
    );
    await page
      .getByRole("button", { name: "Lưu thông tin", exact: true })
      .click();
    await expect(page.locator(".toast[role='status']")).toContainText(
      "Đã cập nhật",
    );
    await publicPage.reload();
    await trigger.click();
    await expect(dialog.locator("img")).toHaveAttribute(
      "src",
      /^data:image\/png/,
    );
    expect(await decodeImage(dialog.locator(".zalo-qr-image"))).toBe(zalo);
    expect(errors).toEqual([]);
  } finally {
    const restored = await page.request.patch(`${origin}/api/admin/settings`, {
      headers: { Origin: origin },
      data: settings,
    });
    expect(restored.status()).toBe(200);
    await visitor.close();
  }
});
