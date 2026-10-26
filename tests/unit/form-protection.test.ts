import assert from "node:assert/strict";
import { test } from "node:test";
import { requireVerifiedForm } from "../../src/backend/application/form-protection";
import { createLeadService } from "../../src/backend/application/leads";
import { ApplicationError } from "../../src/backend/application/errors";
import type { LeadRepository } from "../../src/backend/application/ports";

const input = {
  name: "Khách thử",
  phone: "0901234567",
  type: "consultation" as const,
  source: "/quotation",
  contactAcknowledged: true as const,
  privacyVersion: "2026-10-v1" as const,
};
const firstKey = "00000000-0000-0000-0000-000000000001";
const secondKey = "00000000-0000-0000-0000-000000000002";

function fixture(verified = true) {
  let writes = 0;
  let verifications = 0;
  const saved = new Map<string, { code: string; requestHash: string }>();
  const counts = new Map<string, number>();
  const unused = async (): Promise<never> => {
    throw new Error("Unused");
  };
  const repository: LeadRepository = {
    findByKey: async (key) => saved.get(key) || null,
    createWithEventAndNotification: async (values) => {
      writes++;
      saved.set(values.idempotencyKey, {
        code: values.code,
        requestHash: values.requestHash,
      });
      return { code: values.code };
    },
    updateWithEvent: unused,
    details: unused,
    list: unused,
  };
  const service = createLeadService({
    repository,
    catalog: { findPublicProduct: async () => null },
    limiter: {
      async check(scope, id, maximum) {
        const key = `${scope}:${id}`;
        const count = (counts.get(key) || 0) + 1;
        counts.set(key, count);
        if (count > maximum)
          throw new ApplicationError("tooManyRequests", "Limited");
      },
    },
    verifySubmission: async (token) => {
      verifications++;
      if (!verified || !token)
        throw new ApplicationError("forbidden", "Invalid challenge");
    },
    hash: (value) => JSON.stringify(value),
    newCode: () => "TP-DUMMY",
    now: () => "2026-10-26T00:00:00Z",
    notificationConfigured: false,
  });
  return {
    service,
    counts,
    writes: () => writes,
    verifications: () => verifications,
  };
}

test("a successful provider response must also bind the form action and hostname", () => {
  requireVerifiedForm(
    { success: true, hostname: "example.test", action: "consultation" },
    "example.test",
  );
  for (const reply of [
    null,
    { success: "true", hostname: "example.test", action: "consultation" },
    { success: false, hostname: "example.test", action: "consultation" },
    { success: true, hostname: "other.test", action: "consultation" },
    { success: true, hostname: "example.test", action: "login" },
    { success: true },
  ])
    assert.throws(
      () => requireVerifiedForm(reply, "example.test"),
      ApplicationError,
    );
});

test("failed verification and filled honeypots cannot create leads or burn phone quota", async () => {
  const denied = fixture(false);
  await assert.rejects(
    denied.service.createLead(input, firstKey, "invalid-token"),
  );
  assert.equal(denied.writes(), 0);
  assert.equal(denied.counts.has("lead-phone:+84901234567"), false);
  const trapped = fixture();
  await assert.rejects(
    trapped.service.createLead(
      { ...input, website: "bot.example" },
      firstKey,
      "token",
    ),
  );
  assert.equal(trapped.verifications(), 0);
  assert.equal(trapped.writes(), 0);
});

test("persisted retries survive single-use token expiry while fresh keys cannot duplicate content", async () => {
  const state = fixture();
  const created = await state.service.createLead(
    input,
    firstKey,
    "valid-token",
  );
  const retry = await state.service.createLead(input, firstKey);
  assert.equal(retry.code, created.code);
  assert.equal(retry.repeated, true);
  assert.equal(state.verifications(), 1);
  assert.equal(state.writes(), 1);
  await assert.rejects(
    state.service.createLead(
      { ...input, source: "/contact" },
      secondKey,
      "another-token",
    ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === "tooManyRequests",
  );
  assert.equal(state.writes(), 1);
});

test("nonexistent products cannot consume a customer's phone budget", async () => {
  const state = fixture();
  await assert.rejects(
    state.service.createLead(
      { ...input, productId: "absent" },
      firstKey,
      "valid-token",
    ),
  );
  assert.equal(state.counts.has("lead-phone:+84901234567"), false);
  assert.equal(state.writes(), 0);
});
