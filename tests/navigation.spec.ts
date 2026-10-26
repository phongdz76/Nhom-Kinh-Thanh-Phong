import { test, expect } from "./fixtures/browser";
import type { Page, Locator } from "@playwright/test";
import assert from "node:assert/strict";
import sharp from "sharp";

declare global {
  interface Window {
    __logoScrollPositions: number[];
    __recordLogoScroll: boolean;
  }
}

test("home tab uses the business name and the logo icon", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Nhôm kính Thanh Phong");
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute("href", /^\/icon/);
  const iconPath = await icon.getAttribute("href");
  assert.ok(iconPath, "The icon must have a URL");
  const response = await page.request.get(iconPath);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  const metadata = await sharp(await response.body()).metadata();
  expect(metadata.width).toBe(64);
  expect(metadata.height).toBe(64);
});

async function expectSmoothHomeScroll(page: Page, logo: Locator) {
  const visible = await logo.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.top >= 0 && bounds.bottom <= window.innerHeight;
  });
  if (!visible) await logo.scrollIntoViewIfNeeded();
  const start = await page.evaluate(() => {
    window.__logoScrollPositions = [];
    window.__recordLogoScroll = true;
    function record() {
      window.__logoScrollPositions.push(window.scrollY);
      if (window.__recordLogoScroll) requestAnimationFrame(record);
    }
    requestAnimationFrame(record);
    return window.scrollY;
  });
  expect(start).toBeGreaterThan(100);
  // Click the visible link directly; locator.click() scrolls sticky elements
  // again and can move the viewport before the actual pointer event.
  const bounds = await logo.boundingBox();
  assert.ok(bounds, "The navigation link must have visible bounds");
  await page.mouse.click(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await expect(page).toHaveURL(/:\d+\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const positions = await page.evaluate(() => {
    window.__recordLogoScroll = false;
    return window.__logoScrollPositions;
  });
  expect(
    positions.some((position) => position > 0 && position < start),
    `Expected animated scrolling from ${start}; recorded positions: ${positions.join(", ")}`,
  ).toBe(true);
  if (await logo.count()) await expect(logo).toHaveCSS("outline-style", "none");
  await expect(page.locator(".hero h1")).toBeInViewport();
}

test("logos smoothly scroll home without a URL fragment, including repeated clicks and navigation from other pages", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/");
    const logo = page.locator(".site-header .brand").locator("..");
    for (let repeat = 0; repeat < 2; repeat++) {
      await page.evaluate(() =>
        window.scrollTo({ top: 1200, behavior: "instant" }),
      );
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeGreaterThan(100);
      await expectSmoothHomeScroll(page, logo);
    }
    await page.goto("/about");
    await page.evaluate(() =>
      window.scrollTo({ top: 700, behavior: "instant" }),
    );
    await expectSmoothHomeScroll(page, logo);
    await page.evaluate(() =>
      window.scrollTo({ top: 1300, behavior: "instant" }),
    );
    await expectSmoothHomeScroll(page, logo);
    await expectSmoothHomeScroll(page, page.locator(".footer-brand a"));
    await page.goto("/#top");
    await page.evaluate(() =>
      window.scrollTo({ top: 1200, behavior: "instant" }),
    );
    await expectSmoothHomeScroll(page, logo);
  }
});

test("home menu links scroll to the hero from the current page and other routes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 720 });
    for (const route of ["/", "/about"]) {
      await page.goto(route);
      if (width === 390) await page.locator(".mobile-menu-toggle").click();
      await page.evaluate(() =>
        window.scrollTo({ top: 700, behavior: "instant" }),
      );
      const home = page.locator(
        width === 390 ? '.mobile-nav a[href="/"]' : '.desktop-nav a[href="/"]',
      );
      await expectSmoothHomeScroll(page, home);
      if (width === 390)
        await expect(page.locator(".mobile-nav")).toHaveCount(0);
    }
  }
});

test("home logo keeps a visible keyboard focus indicator", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const logo = page.locator(".site-header .brand").locator("..");
  await expect(logo).toBeFocused();
  await expect(logo).toHaveCSS("outline-style", "solid");
  await page.evaluate(() =>
    window.scrollTo({ top: 1200, behavior: "instant" }),
  );
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/:\d+\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("logo scrolling respects reduced motion and works after leaving the admin layout", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/admin/login");
  await page
    .locator(".login-card a")
    .filter({ has: page.locator(".brand") })
    .click();
  await expect(page).toHaveURL(/:\d+\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() =>
    window.scrollTo({ top: 1200, behavior: "instant" }),
  );
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await page.locator(".site-header .brand").locator("..").click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("menu navigation opens cached pages at the heading on desktop and mobile", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/about");
    await page.evaluate(() =>
      window.scrollTo({ top: 600, behavior: "instant" }),
    );
    if (width === 390) await page.locator(".mobile-menu-toggle").click();
    const menu = width === 390 ? ".mobile-nav" : ".desktop-nav";
    await page.locator(`${menu} a[href="/contact"]`).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);

    await page.evaluate(() =>
      window.scrollTo({ top: 270, behavior: "instant" }),
    );
    if (width === 390) await page.locator(".mobile-menu-toggle").click();
    await page.locator(`${menu} a[href="/about"]`).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator(".page-heading h1")).toBeInViewport();

    // Selecting the active menu item after scrolling also returns to the title.
    await page.evaluate(() =>
      window.scrollTo({ top: 600, behavior: "instant" }),
    );
    if (width === 390) await page.locator(".mobile-menu-toggle").click();
    await page.locator(`${menu} a[href="/about"]`).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator(".page-heading h1")).toBeInViewport();
    if (width === 390) await expect(page.locator(".mobile-nav")).toHaveCount(0);
  }
});
