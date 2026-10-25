import "server-only";
import { randomBytes } from "node:crypto";
import { createCatalogService } from "@/backend/application/catalog";
import { createEstimateService } from "@/backend/application/estimates";
import { createLeadService } from "@/backend/application/leads";
import { createAuthService } from "@/backend/application/auth";
import { createMediaService } from "@/backend/application/media";
import { catalogRepository } from "@/backend/infrastructure/payload/repositories/catalog";
import { estimateRepository } from "@/backend/infrastructure/payload/repositories/estimates";
import { leadRepository } from "@/backend/infrastructure/payload/repositories/leads";
import { authRepository } from "@/backend/infrastructure/payload/repositories/auth";
import { mediaRepository } from "@/backend/infrastructure/payload/repositories/media";
import { rateLimit } from "@/backend/infrastructure/security/rate-limit";
import { hash } from "@/backend/infrastructure/security/hash";

const limiter = { check: rateLimit };
export const catalog = createCatalogService(catalogRepository);
export const estimates = createEstimateService(estimateRepository);
export const auth = createAuthService(authRepository, limiter);
export const media = createMediaService(mediaRepository);
export const leads = createLeadService({
  repository: leadRepository,
  catalog: catalogRepository,
  limiter,
  hash,
  newCode: () =>
    `TP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(4).toString("hex").toUpperCase()}`,
  now: () => new Date().toISOString(),
  notificationConfigured: Boolean(
    process.env.SMTP_HOST && process.env.LEAD_NOTIFICATION_EMAIL,
  ),
});
export const {
  publicSite,
  findPublicProduct,
  findPublicContent,
  adminState,
  saveProduct,
  saveCategory,
  saveSettings,
  saveContent,
} = catalog;
export const { getEstimate, saveEstimate, listEstimates } = estimates;
export const { createLead, updateLead, leadDetails, listLeads } = leads;
export { checkHealth } from "@/backend/infrastructure/payload/health";
