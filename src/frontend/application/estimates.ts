import { estimateSchema, type Estimate } from "@/domain/estimates";
import type { EstimateGateway } from "./ports";
export function createEstimateService(gateway: EstimateGateway) {
  return {
    ...gateway,
    save(document: Estimate, saved: Parameters<EstimateGateway["save"]>[1]) {
      const parsed = estimateSchema.safeParse(document);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const prefix =
          issue.path[0] === "lines" && typeof issue.path[1] === "number"
            ? `Hạng mục ${issue.path[1] + 1}: `
            : "";
        throw new Error(prefix + issue.message);
      }
      return gateway.save(parsed.data, saved);
    },
  };
}
