import assert from "node:assert/strict";
import { test } from "node:test";
import { createEstimateService } from "../../src/backend/application/estimates";
import { createLeadService } from "../../src/backend/application/leads";
import { ApplicationError } from "../../src/backend/application/errors";
import type {
  EstimateRepository,
  LeadRepository,
} from "../../src/backend/application/ports";
import type { User } from "../../src/domain/models";
import { estimateSchema } from "../../src/domain/estimates";
import sample from "../../src/backend/infrastructure/documents/estimate-example.json";

const user: User = {
  id: "owner-id",
  name: "Owner",
  email: "owner@example.test",
  role: "owner",
};
test("estimate use cases reject stale writes before writing through their port", async () => {
  const document = estimateSchema.parse(sample.document);
  let writes = 0;
  const repository: EstimateRepository = {
    list: async () => ({ estimates: [], totalDocs: 0 }),
    get: async (id) => ({ id, updatedAt: "current-version", document }),
    findByCode: async () => [],
    save: async () => {
      writes++;
      throw new Error("Unexpected write");
    },
  };
  await assert.rejects(
    () =>
      createEstimateService(repository).saveEstimate(
        { document, updatedAt: "stale-version" },
        user,
        "00000000-0000-0000-0000-000000000000",
      ),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === "conflict",
  );
  assert.equal(writes, 0);
});
test("a racing lead submission recovers the existing code through the repository", async () => {
  let reads = 0;
  let writes = 0;
  const repository: LeadRepository = {
    findByKey: async () =>
      ++reads === 1
        ? null
        : { code: "TP-EXISTING", requestHash: "same-content" },
    createWithEventAndNotification: async () => {
      writes++;
      throw new Error("Duplicate idempotency key");
    },
    updateWithEvent: async () => {
      throw new Error("Unused");
    },
    details: async () => {
      throw new Error("Unused");
    },
    list: async () => {
      throw new Error("Unused");
    },
  };
  const service = createLeadService({
    repository,
    catalog: { findPublicProduct: async () => null },
    limiter: { check: async () => {} },
    hash: () => "same-content",
    newCode: () => "TP-NEW",
    now: () => "2026-10-24T13:00:00Z",
    notificationConfigured: false,
  });
  const result = await service.createLead(
    {
      name: "Khách thử",
      phone: "0901234567",
      type: "consultation",
      source: "/quotation",
      contactAcknowledged: true,
      privacyVersion: "2026-10-v1",
    },
    "00000000-0000-0000-0000-000000000000",
  );
  assert.deepEqual(result, { code: "TP-EXISTING", repeated: true });
  assert.equal(writes, 1);
});
