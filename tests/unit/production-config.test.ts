import assert from "node:assert/strict";
import { test } from "node:test";
import { productionErrors } from "../../scripts/lib/production-config";

const configured = {
  SERVER_URL: "https://example.test",
  DATABASE_URL: "postgresql://fixture:fixture@db.test/catalog?sslmode=require",
  PAYLOAD_SECRET: "p".repeat(64),
  R2_ENDPOINT: "https://storage.example.test",
  R2_BUCKET: "fixture",
  R2_ACCESS_KEY_ID: "fixture-access",
  R2_SECRET_ACCESS_KEY: "fixture-storage-secret",
  MEDIA_PUBLIC_URL: "https://images.example.test",
  TURNSTILE_SITE_KEY: "production-fixture-site-key",
  TURNSTILE_SECRET_KEY: "fixture-verification-secret",
};

test("production configuration requires both verification keys and rejects offline/dummy keys", () => {
  assert.deepEqual(productionErrors(configured), []);
  const missing = productionErrors({
    ...configured,
    TURNSTILE_SITE_KEY: undefined,
    TURNSTILE_SECRET_KEY: undefined,
  });
  assert.ok(missing.some((error) => error.includes("TURNSTILE_SITE_KEY")));
  assert.ok(missing.some((error) => error.includes("TURNSTILE_SECRET_KEY")));
  assert.ok(
    productionErrors({
      ...configured,
      TURNSTILE_SITE_KEY: "offline-test-site-key",
    }).some((error) => error.includes("Offline test")),
  );
  assert.ok(
    productionErrors({
      ...configured,
      TURNSTILE_SECRET_KEY: `1x${"0".repeat(29)}AA`,
    }).some((error) => error.includes("dummy keys")),
  );
});
