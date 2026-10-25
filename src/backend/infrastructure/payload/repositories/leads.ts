import { payloadActor } from "../actor";
import "server-only";
import { createLocalReq } from "payload";
import { cms } from "../client";
import { leadDTO } from "../mappers";
import { ApplicationError } from "@/backend/application/errors";
import type { LeadRepository } from "@/backend/application/ports";

export const leadRepository: LeadRepository = {
  async findByKey(key) {
    const payload = await cms();
    const doc = (
      await payload.find({
        collection: "leads",
        where: { idempotencyKey: { equals: key } },
        limit: 1,
        depth: 0,
      })
    ).docs[0];
    return doc ? { code: doc.code, requestHash: doc.requestHash } : null;
  },
  async createWithEventAndNotification(data) {
    const payload = await cms();
    const req = await createLocalReq({}, payload);
    const transaction = await payload.db.beginTransaction();
    if (!transaction)
      throw new ApplicationError(
        "unavailable",
        "Chưa thể lưu yêu cầu an toàn.",
      );
    req.transactionID = transaction;
    try {
      const lead = await payload.create({
        collection: "leads",
        req,
        overrideAccess: true,
        data,
      });
      await payload.create({
        collection: "lead-events",
        req,
        data: { lead: lead.id, event: "created", toStatus: "new" },
        overrideAccess: true,
      });
      await payload.jobs.queue({
        task: "notify-lead",
        input: { leadId: lead.id },
        req,
      });
      await payload.db.commitTransaction(transaction);
      return { code: lead.code };
    } catch (error) {
      await payload.db.rollbackTransaction(transaction);
      throw error;
    }
  },
  async list(user, page, limit) {
    const result = await (
      await cms()
    ).find({
      collection: "leads",
      page,
      limit,
      sort: "-createdAt",
      depth: 0,
      user: payloadActor(user),
      overrideAccess: false,
    });
    return {
      leads: result.docs.map(leadDTO),
      page: result.page,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
    };
  },
  async details(id, user) {
    const payload = await cms();
    const lead = await payload.findByID({
      collection: "leads",
      id,
      depth: 0,
      user: payloadActor(user),
      overrideAccess: false,
    });
    const events = await payload.find({
      collection: "lead-events",
      where: { lead: { equals: id } },
      sort: "-createdAt",
      limit: 100,
      depth: 0,
      user: payloadActor(user),
      overrideAccess: false,
    });
    return {
      lead: leadDTO(lead),
      events: events.docs.map((event) => ({
        event: event.event,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note,
        createdAt: event.createdAt,
      })),
    };
  },
  async updateWithEvent(id, values, user) {
    const payload = await cms();
    const req = await createLocalReq({ user: payloadActor(user) }, payload);
    const transaction = await payload.db.beginTransaction();
    if (!transaction)
      throw new ApplicationError("unavailable", "Chưa thể cập nhật yêu cầu.");
    req.transactionID = transaction;
    try {
      const previous = await payload.findByID({
        collection: "leads",
        id,
        depth: 0,
        req,
        overrideAccess: false,
      });
      const updated = await payload.update({
        collection: "leads",
        id,
        data: values,
        req,
        overrideAccess: false,
      });
      await payload.create({
        collection: "lead-events",
        req,
        overrideAccess: true,
        data: {
          lead: id,
          event: "updated",
          fromStatus: previous.status,
          toStatus: values.status,
          note: values.note,
          actor: user.id,
        },
      });
      await payload.db.commitTransaction(transaction);
      return leadDTO(updated);
    } catch (error) {
      await payload.db.rollbackTransaction(transaction);
      throw error;
    }
  },
};
