import { test, expect } from "@playwright/test";

test("contact and footer maps follow the saved address without retaining an old location", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/public/site");
  expect(response.ok()).toBe(true);
  const site = await response.json();
  let address = "387 Bình Thành, Bình Tân, Hồ Chí Minh, Việt Nam";
  let mapUrl = "";
  let mapEmbedUrl = "";
  await page.route("https://maps.google.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body>Map fixture</body></html>",
    }),
  );
  await page.route("https://www.google.com/maps/embed?**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<html><body>Pinned map fixture</body></html>",
    }),
  );
  await page.route("**/api/public/site", (route) =>
    route.fulfill({
      json: {
        ...site,
        settings: { ...site.settings, address, mapUrl, mapEmbedUrl },
      },
    }),
  );
  await page.goto("/contact");

  async function refreshLocation() {
    await expect
      .poll(async () => {
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        return (await page.locator(".contact-map-info p").allTextContents())
          .join("")
          .trim();
      })
      .toBe(address);
    if (address) {
      const firstMap = page.locator(".contact-map-iframe-container iframe");
      if (mapEmbedUrl)
        await expect(firstMap).toHaveAttribute("src", mapEmbedUrl);
      else
        await expect
          .poll(async () => {
            await page.evaluate(() => window.dispatchEvent(new Event("focus")));
            const src = await firstMap.getAttribute("src");
            return src ? new URL(src).searchParams.get("q") : null;
          })
          .toBe(address);
    }
  }
  async function expectLocation(expected: string) {
    const maps = page.locator(
      ".contact-map-iframe-container iframe, .footer-map-embed iframe",
    );
    await expect(maps).toHaveCount(2);
    for (const map of await maps.all()) {
      const url = new URL((await map.getAttribute("src"))!);
      expect(url.searchParams.get("q")).toBe(expected);
      expect(url.searchParams.get("iwloc")).toBe("A");
    }
    const links = page.locator(
      ".contact-address-link, .contact-map-info a, .footer-contact-item[href*='google.com/maps']",
    );
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) {
      expect(
        new URL((await link.getAttribute("href"))!).searchParams.get("query"),
      ).toBe(expected);
    }
  }

  await refreshLocation();
  await expectLocation(address);

  // A later CMS update must move both maps and all links, with no hardcoded
  // ward/city appended from the old business address.
  address = "123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng";
  await refreshLocation();
  await expectLocation(address);

  // An explicit Google Maps share/embed pair must retain the exact selected
  // place instead of re-geocoding the human-readable address.
  address = "387 Bình Thành, Bình Tân, Hồ Chí Minh, Việt Nam";
  mapUrl = "https://maps.app.goo.gl/QzfkQhiJiynHnxKc9";
  mapEmbedUrl =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.9761078818133!2d106.58646267451768!3d10.813140158516527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752b993f3cafab%3A0xf7fe7de0fb0c3cdf!2zMzg3IELDrG5oIFRow6BuaCwgQsOsbmggVMOibiwgSOG7kyBDaMOtIE1pbmgsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1792897978779!5m2!1svi!2s";
  await refreshLocation();
  const pinnedMaps = page.locator(
    ".contact-map-iframe-container iframe, .footer-map-embed iframe",
  );
  await expect(pinnedMaps).toHaveCount(2);
  for (const map of await pinnedMaps.all())
    await expect(map).toHaveAttribute("src", mapEmbedUrl);
  const pinnedLinks = page.locator(
    ".contact-address-link, .contact-map-info a, .footer-contact-item[title='Mở Google Maps chỉ đường']",
  );
  await expect(pinnedLinks).toHaveCount(3);
  for (const link of await pinnedLinks.all())
    await expect(link).toHaveAttribute("href", mapUrl);

  address = "";
  await refreshLocation();
  await expect(
    page.locator(
      ".contact-map-iframe-container iframe, .footer-map-embed iframe",
    ),
  ).toHaveCount(0);
  await expect(
    page.locator("a[href*='google.com/maps'], a[href*='maps.app.goo.gl']"),
  ).toHaveCount(0);
});
