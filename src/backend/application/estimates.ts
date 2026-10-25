import { z } from "zod";
import { calculateEstimate, estimateSchema } from "@/domain/estimates";
import type { User } from "@/domain/models";
import type { EstimateRepository } from "./ports";
import { ApplicationError } from "./errors";

const saveSchema = z
  .object({ document: estimateSchema, updatedAt: z.string().optional() })
  .strict();
export function createEstimateService(repository: EstimateRepository) {
  async function getEstimate(id: string, user: User) {
    if (!/^[a-f0-9-]{36}$/.test(id))
      throw new ApplicationError("notFound", "Không tìm thấy báo giá.");
    const record = await repository.get(id, user);
    const document = estimateSchema.parse(record.document);
    return {
      id: record.id,
      updatedAt: record.updatedAt,
      document,
      calculation: calculateEstimate(document),
    };
  }
  return {
    getEstimate,
    listEstimates: (user: User) => repository.list(user),
    async saveEstimate(input: unknown, user: User, id?: string) {
      const { document, updatedAt } = saveSchema.parse(input);
      if (id) {
        const existing = await getEstimate(id, user);
        if (!updatedAt || updatedAt !== existing.updatedAt)
          throw new ApplicationError(
            "conflict",
            "Báo giá đã thay đổi. Mở lại bản đã lưu trước khi cập nhật.",
          );
      }
      const duplicate = await repository.findByCode(document.code, user);
      if (duplicate.some((record) => record.id !== id))
        throw new ApplicationError(
          "conflict",
          "Mã báo giá đã được dùng. Hãy đổi mã báo giá.",
        );
      const calculation = calculateEstimate(document);
      const record = await repository.save(
        document,
        calculation.total,
        user,
        id,
      );
      return {
        id: record.id,
        updatedAt: record.updatedAt,
        document: estimateSchema.parse(record.document),
        calculation,
      };
    },
  };
}
