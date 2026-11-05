import assert from "node:assert/strict";
import { test } from "node:test";
import type { PublicSite } from "../../src/domain/models";
import {
  businessSchema,
  canIndexWebsite,
  pageMetadata,
  serializeSchema,
  websiteRobots,
  websiteSitemap,
} from "../../src/frontend/infrastructure/seo/metadata";
import { catalogProducts } from "../fixtures/catalog";

const production = {
  NODE_ENV: "production",
  CONTEXT: "production",
  SERVER_URL: "https://example.test",
};
test("SEO enables public production only, while local, preview and an explicit opt-out stay noindex", () => {
  assert.equal(canIndexWebsite(production), true);
  for (const env of [
    { ...production, NODE_ENV: "development" },
    { ...production, CONTEXT: "deploy-preview" },
    { ...production, SERVER_URL: "http://localhost:3000" },
    { ...production, SITE_INDEXING_ENABLED: "false" },
  ]) {
    assert.equal(canIndexWebsite(env), false);
    assert.deepEqual(websiteRobots(env).rules, {
      userAgent: "*",
      disallow: "/",
    });
  }
  const metadata = pageMetadata(
    production,
    "/products/TP-001",
    "Cửa nhôm",
    "Mô tả",
    "/images/hero-house.jpg",
  );
  assert.equal(
    metadata.alternates?.canonical,
    "https://example.test/products/TP-001",
  );
  assert.equal(metadata.description, "Mô tả");
  assert.ok(
    JSON.stringify(metadata.openGraph).includes(
      "https://example.test/images/hero-house.jpg",
    ),
  );
});

test("sitemap excludes draft content and private routes; local sitemap does not expose URLs", () => {
  const site = {
    products: [
      ...catalogProducts(1),
      { ...catalogProducts(1)[0], id: "draft", status: "draft" },
    ],
    articles: [],
    projects: [],
  } as unknown as PublicSite;
  const urls = websiteSitemap(production, site).map((item) => item.url);
  assert.ok(urls.includes("https://example.test/products/PAGE-001"));
  assert.ok(urls.every((url) => !/draft|admin|api/.test(url)));
  assert.deepEqual(
    websiteSitemap({ ...production, CONTEXT: "deploy-preview" }, site),
    [],
  );
});

test("business schema does not invent contact data for demo content and JSON-LD escapes markup", () => {
  const settings = {
    name: "Thanh Phong",
    tagline: "Nhôm kính",
    isDemo: true,
    phone: "0900000000",
    address: "Địa chỉ mẫu",
  } as PublicSite["settings"];
  const schema = businessSchema(production, settings)!;
  assert.equal(schema["@type"], "Organization");
  assert.equal(schema.telephone, undefined);
  assert.equal(schema.address, undefined);
  assert.equal(
    businessSchema(production, { ...settings, isDemo: false })!["@type"],
    "HomeAndConstructionBusiness",
  );
  const serialized = serializeSchema({
    text: "</script><script>alert(1)</script>",
  });
  assert.ok(!serialized.includes("<"));
  assert.equal(
    JSON.parse(serialized).text,
    "</script><script>alert(1)</script>",
  );
});
