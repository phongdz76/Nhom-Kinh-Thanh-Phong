import { test, expect } from "./fixtures/browser";
import type { Page } from "@playwright/test";
import type { Payload } from "payload";
import type { PublicSite } from "@/domain/models";
import fs from "node:fs";
import dotenv from "dotenv";
import { catalogProducts } from "./fixtures/catalog";

const prefix = `PG${Date.now().toString(36).toUpperCase()}`;
const products = catalogProducts(97, prefix);
const categoryKeys = [
  `page-doors-${prefix.toLowerCase()}`,
  `page-windows-${prefix.toLowerCase()}`,
];
let payload: Payload | undefined;

test.beforeAll(async () => {
  test.setTimeout(60000);
  const env = dotenv.parse(fs.readFileSync(".env.test.local"));
  const database = new URL(env.DATABASE_URL);
  if (
    database.pathname !== "/thanhphong_test" ||
    !["localhost", "127.0.0.1"].includes(database.hostname)
  )
    throw new Error(
      "Pagination fixtures require the dedicated local test database.",
    );
  Object.assign(process.env, env);
  const { getPayload } = await import("payload");
  const { default: config } = await import("@payload-config");
  payload = await getPayload({ config });
  const categoryIds: string[] = [];
  for (const [index, key] of categoryKeys.entries()) {
    const category = await payload.create({
      collection: "categories",
      overrideAccess: true,
      data: {
        key,
        name: `Phân trang ${index + 1} ${prefix}`,
        icon: "door",
        isActive: true,
        sortOrder: 100 + index,
      },
    });
    categoryIds.push(String(category.id));
  }
  for (let start = 0; start < products.length; start += 4) {
    await Promise.all(
      products.slice(start, start + 4).map(async (product) => {
        await payload!.create({
          collection: "products",
          overrideAccess: true,
          data: {
            publicId: product.id,
            code: product.code,
            name: product.name,
            category: categoryIds[product.category === "doors" ? 0 : 1],
            summary: product.summary,
            subtitle: product.subtitle,
            opening: product.opening,
            image: product.image,
            images: product.images.map((url) => ({ url })),
            featured: product.featured,
            _status: "published",
          },
        });
      }),
    );
  }
});

test.afterAll(async () => {
  if (!payload) return;
  try {
    await payload.delete({
      collection: "products",
      overrideAccess: true,
      where: { publicId: { in: products.map((product) => product.id) } },
    });
    await payload.delete({
      collection: "categories",
      overrideAccess: true,
      where: { key: { in: categoryKeys } },
    });
  } finally {
    await payload.destroy();
  }
});

async function openCatalog(
  page: Page,
  parameters: Record<string, string> = {},
) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const query = new URLSearchParams({ q: prefix, ...parameters });
  await page.goto(`/products?${query}`);
  await expect(
    page.locator(".catalog-grid .product-code").first(),
  ).toContainText(prefix);
}
const navigation = (page: Page) =>
  page.getByRole("navigation", { name: "Phân trang sản phẩm" });
const summary = (page: Page) => page.locator(".catalog-page-summary");
const firstCode = (page: Page) =>
  page.locator(".catalog-grid .product-code").first();
const parameter = (page: Page, name: string) =>
  new URL(page.url()).searchParams.get(name);

test("pagination renders twelve cards, preserves every product, and scrolls without fetching a new listing", async ({
  page,
}) => {
  await openCatalog(page);
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(12);
  await expect(summary(page)).toContainText("1–12");
  await expect(summary(page)).toContainText("97");
  await expect(firstCode(page)).toContainText(`${prefix}-097`);
  await expect(
    navigation(page).getByLabel("Trang trước", { exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
  const firstIds = await page
    .locator(".catalog-grid .product-image")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")),
    );
  await page.evaluate(() => {
    Object.assign(window, { catalogDocumentMarker: "same-document" });
  });
  const listingRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.pathname === "/api/public/products" ||
      url.pathname === "/api/public/site"
    )
      listingRequests.push(url.pathname);
  });
  await navigation(page)
    .getByRole("link", { name: "Trang 2", exact: true })
    .click();
  await expect(summary(page)).toContainText("13–24");
  await expect(page.locator("#catalog-products")).toBeFocused();
  await expect
    .poll(() =>
      page
        .locator("#catalog-products")
        .evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeGreaterThan(80);
  await expect
    .poll(() =>
      page
        .locator("#catalog-products")
        .evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeLessThan(180);
  const secondIds = await page
    .locator(".catalog-grid .product-image")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")),
    );
  expect(secondIds.every((id) => !firstIds.includes(id))).toBe(true);
  expect(
    await page.evaluate(() => Reflect.get(window, "catalogDocumentMarker")),
  ).toBe("same-document");
  expect(listingRequests).toEqual([]);
  await navigation(page)
    .getByRole("link", { name: "Trang 9", exact: true })
    .click();
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(1);
  await expect(summary(page)).toContainText("97–97");
  await expect(
    navigation(page).getByLabel("Trang sau", { exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
});

test("direct links, reload and browser history restore page and all filters", async ({
  page,
}) => {
  await openCatalog(page, {
    sort: "name",
    page: "3",
    utm_source: "catalog-test",
  });
  await expect(firstCode(page)).toContainText(`${prefix}-025`);
  await page.reload();
  await expect(firstCode(page)).toContainText(`${prefix}-025`);
  await expect(page.getByLabel("Sắp xếp sản phẩm")).toHaveValue("name");
  await navigation(page)
    .getByRole("link", { name: "Trang trước", exact: true })
    .click();
  await expect(firstCode(page)).toContainText(`${prefix}-013`);
  expect(parameter(page, "utm_source")).toBe("catalog-test");
  await page.goBack();
  await expect(firstCode(page)).toContainText(`${prefix}-025`);
  await page.goForward();
  await expect(firstCode(page)).toContainText(`${prefix}-013`);
  expect(parameter(page, "q")).toBe(prefix);
  expect(parameter(page, "sort")).toBe("name");
});

test("category, opening, sorting and search reset pagination and clearing filters restores defaults", async ({
  page,
}) => {
  await openCatalog(page, { page: "5" });
  await page
    .locator(".catalog-categories button")
    .filter({ hasText: `Phân trang 1 ${prefix}` })
    .click();
  await expect(page.locator(".catalog-result strong")).toHaveText("73");
  expect(parameter(page, "page")).toBeNull();
  await navigation(page)
    .getByRole("link", { name: "Trang 2", exact: true })
    .click();
  await page.getByLabel("Lọc kiểu mở").selectOption("Mở quay");
  await expect(page.locator(".catalog-result strong")).toHaveText("24");
  expect(parameter(page, "page")).toBeNull();
  await navigation(page)
    .getByRole("link", { name: "Trang 2", exact: true })
    .click();
  await page.getByLabel("Sắp xếp sản phẩm").selectOption("name");
  await expect(firstCode(page)).toContainText(`${prefix}-003`);
  expect(parameter(page, "page")).toBeNull();
  await navigation(page)
    .getByRole("link", { name: "Trang 2", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Tìm kiếm sản phẩm", exact: true })
    .fill(`${prefix} don sang`);
  await expect(page.locator(".catalog-result strong")).toHaveText("8");
  await expect(navigation(page)).toHaveCount(0);
  expect(parameter(page, "page")).toBeNull();
  await page
    .getByRole("button", { name: "Xóa từ khóa tìm kiếm", exact: true })
    .click();
  expect(parameter(page, "q")).toBeNull();
  await expect(page.getByLabel("Lọc kiểu mở")).toHaveValue("Mở quay");
  await page
    .getByRole("textbox", { name: "Tìm kiếm sản phẩm", exact: true })
    .fill("no-match-pagination-fixture");
  await expect(summary(page)).toHaveText("Không có sản phẩm phù hợp");
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  for (const key of ["category", "q", "opening", "sort", "page"])
    expect(parameter(page, key)).toBeNull();
  await expect(page.getByLabel("Sắp xếp sản phẩm")).toHaveValue("featured");
  await expect(page.locator(".catalog-grid .product-card")).toHaveCount(12);
});

test("invalid URL pages are corrected and oversized pages resolve to the last page", async ({
  page,
}) => {
  for (const value of ["0", "-1", "abc", "1e2", "999"]) {
    await openCatalog(page, { page: value });
    await expect
      .poll(() => parameter(page, "page"))
      .toBe(value === "999" ? "9" : null);
    await expect(page.locator(".catalog-grid .product-card")).toHaveCount(
      value === "999" ? 1 : 12,
    );
  }
});

test("pagination is usable with keyboard at desktop, tablet and small mobile widths", async ({
  page,
}) => {
  for (const width of [1440, 1024, 768, 390, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await openCatalog(page, { page: "5" });
    const next = navigation(page).getByRole("link", {
      name: "Trang sau",
      exact: true,
    });
    await page.keyboard.press("Tab");
    await next.focus();
    await expect(next).toBeFocused();
    await expect(next).toHaveCSS("outline-offset", "-2px");
    await page.keyboard.press("Enter");
    await expect(summary(page)).toContainText("61–72");
    await expect(page.locator("#catalog-products")).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await navigation(page).evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= innerWidth;
      }),
    ).toBe(true);
  }
});

test("background product changes clamp the page and empty results hide pagination", async ({
  page,
}) => {
  await openCatalog(page, { page: "9" });
  let remaining = 24;
  const response = await page.request.get("/api/public/site");
  const site: PublicSite = await response.json();
  await page.route("**/api/public/site", async (route) => {
    const keep = new Set(
      products.slice(0, remaining).map((product) => product.id),
    );
    await route.fulfill({
      json: {
        ...site,
        products: site.products.filter(
          (product) => !product.id.startsWith(prefix) || keep.has(product.id),
        ),
      },
    });
  });
  async function refresh(total: string) {
    await expect
      .poll(async () => {
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        return page.locator(".catalog-result strong").textContent();
      })
      .toBe(total);
  }
  await refresh("24");
  await expect.poll(() => parameter(page, "page")).toBe("2");
  await expect(summary(page)).toContainText("13–24");
  remaining = 0;
  await refresh("0");
  await expect(navigation(page)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Xóa bộ lọc", exact: true }),
  ).toBeVisible();
  await expect.poll(() => parameter(page, "page")).toBeNull();
  await page.unrouteAll({ behavior: "wait" });
});
