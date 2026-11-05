import assert from "node:assert/strict";
import { test } from "node:test";
import { notificationConfig } from "../../src/backend/infrastructure/notifications/config";

test("email configuration is optional, complete when enabled, and enforces TLS for remote SMTP", () => {
  assert.equal(notificationConfig({}), null);
  assert.throws(() => notificationConfig({ SMTP_HOST: "smtp.example.test" }));
  const settings = {
    SMTP_HOST: "smtp.example.test",
    SMTP_FROM: "website@example.test",
    LEAD_NOTIFICATION_EMAIL: "owner@example.test",
  };
  assert.equal(notificationConfig(settings)?.requireTLS, true);
  assert.equal(
    notificationConfig({ ...settings, SMTP_PORT: "465" })?.secure,
    true,
  );
  assert.equal(
    notificationConfig({
      ...settings,
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "2526",
    })?.requireTLS,
    false,
  );
  assert.throws(() =>
    notificationConfig({
      ...settings,
      SMTP_FROM: "owner@example.test\r\nBcc: attacker@example.test",
    }),
  );
  assert.throws(() => notificationConfig({ ...settings, SMTP_USER: "owner" }));
  assert.throws(() => notificationConfig({ ...settings, SMTP_PORT: "65536" }));
});
