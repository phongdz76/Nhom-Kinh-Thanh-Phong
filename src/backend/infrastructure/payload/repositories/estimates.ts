import { payloadActor } from "../actor";
import "server-only";
import { cms } from "../client";
import type { EstimateRepository } from "@/backend/application/ports";
import { estimateSummaryDTO, storedEstimateDTO } from "../mappers";
export const estimateRepository: EstimateRepository = {
  async list(user) {
    const payload = await cms();
    const result = await payload.find({
      collection: "estimates",
      limit: 200,
      sort: "-updatedAt",
      depth: 0,
      user: payloadActor(user),
      overrideAccess: false,
      select: {
        code: true,
        customerName: true,
        projectAddress: true,
        total: true,
        updatedAt: true,
      },
    });
    return {
      estimates: result.docs.map((doc) => estimateSummaryDTO.parse(doc)),
      totalDocs: result.totalDocs,
    };
  },
  async get(id, user) {
    return storedEstimateDTO.parse(
      await (
        await cms()
      ).findByID({
        collection: "estimates",
        id,
        user: payloadActor(user),
        overrideAccess: false,
        depth: 0,
      }),
    );
  },
  async findByCode(code, user) {
    return (
      await (
        await cms()
      ).find({
        collection: "estimates",
        where: { code: { equals: code } },
        limit: 1,
        user: payloadActor(user),
        overrideAccess: false,
      })
    ).docs.map((doc) => ({ id: String(doc.id) }));
  },
  async save(document, total, user, id) {
    const payload = await cms();
    const data = {
      code: document.code,
      customerName: document.customerName,
      projectAddress: document.projectAddress,
      total,
      document,
    };
    const result = id
      ? await payload.update({
          collection: "estimates",
          id,
          data,
          user: payloadActor(user),
          overrideAccess: false,
        })
      : await payload.create({
          collection: "estimates",
          data,
          user: payloadActor(user),
          overrideAccess: false,
        });
    return storedEstimateDTO.parse(result);
  },
};
