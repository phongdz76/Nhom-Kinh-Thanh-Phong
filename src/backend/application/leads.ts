import { leadSchema, leadUpdateSchema } from "@/domain/schemas";
import type { User } from "@/domain/models";
import type { CatalogRepository, LeadRepository, RateLimiter } from "./ports";
import { ApplicationError } from "./errors";

export function createLeadService(deps: {
  repository: LeadRepository;
  catalog: Pick<CatalogRepository, "findPublicProduct">;
  limiter: RateLimiter;
  hash(value: unknown): string;
  newCode(): string;
  now(): string;
  notificationConfigured: boolean;
}) {
  const { repository, catalog, limiter } = deps;
  return {
    async createLead(input: unknown, key: string | null) {
      if (!key || !/^[a-f0-9-]{36}$/.test(key))
        throw new ApplicationError(
          "invalid",
          "Thiếu mã lần gửi hợp lệ. Vui lòng tải lại form.",
        );
      const values = leadSchema.parse(input);
      const phone = values.phone.startsWith("0")
        ? `+84${values.phone.slice(1)}`
        : values.phone;
      const requestHash = deps.hash({ ...values, phone });
      function repeated(previous: { code: string; requestHash: string }) {
        if (previous.requestHash !== requestHash)
          throw new ApplicationError(
            "conflict",
            "Mã gửi đã được dùng cho nội dung khác. Hãy tạo yêu cầu mới.",
          );
        return { code: previous.code, repeated: true };
      }
      const existing = await repository.findByKey(key);
      if (existing) return repeated(existing);
      await limiter.check("lead-global", "all", 60, 60);
      await limiter.check("lead-phone", phone, 5, 3600);
      const product = values.productId
        ? await catalog.findPublicProduct(values.productId)
        : null;
      if (values.productId && !product)
        throw new ApplicationError(
          "invalid",
          "Mẫu sản phẩm không còn được công bố. Vui lòng chọn mẫu khác.",
        );
      const { contactAcknowledged, website, ...fields } = values;
      try {
        const lead = await repository.createWithEventAndNotification({
          ...fields,
          phone,
          code: deps.newCode(),
          idempotencyKey: key,
          requestHash,
          productId: product?.id || "",
          productName: product?.name || "Tư vấn phương án",
          consentAt: deps.now(),
          status: "new",
          notificationState: deps.notificationConfigured
            ? "pending"
            : "not_configured",
        });
        return { code: lead.code, repeated: false };
      } catch (error) {
        const duplicate = await repository.findByKey(key);
        if (duplicate) return repeated(duplicate);
        throw error;
      }
    },
    updateLead: (id: string, input: unknown, user: User) =>
      repository.updateWithEvent(id, leadUpdateSchema.parse(input), user),
    leadDetails: (id: string, user: User) => repository.details(id, user),
    listLeads(user: User, page: number, limit: number) {
      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 200
      )
        throw new ApplicationError("invalid", "Phân trang không hợp lệ.");
      return repository.list(user, page, limit);
    },
  };
}
