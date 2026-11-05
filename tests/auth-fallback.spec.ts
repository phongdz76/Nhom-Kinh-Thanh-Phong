import { test, expect } from "./fixtures/browser";

test("without JavaScript login submits secrets in a POST body, never the URL", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: "http://127.0.0.1:3010",
  });
  const page = await context.newPage();
  try {
    await page.goto("/admin/login");
    await expect(page.locator("form")).toHaveAttribute("method", "post");
    await page.getByLabel("Email", { exact: true }).fill("dummy@example.test");
    await page
      .getByLabel("Mật khẩu", { exact: true })
      .fill("dummy-never-a-real-password");
    const submission = page.waitForRequest(
      (request) => request.isNavigationRequest() && request.method() === "POST",
    );
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    const request = await submission;
    expect(request.url()).not.toContain("dummy");
    expect(request.postData()).toContain("dummy-never-a-real-password");
  } finally {
    await context.close();
  }
});

test("local and private pages stay noindex and have crawl configuration", async ({
  page,
  request,
}) => {
  await page.goto("/admin/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain("Disallow: /");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain("<loc>");
});
