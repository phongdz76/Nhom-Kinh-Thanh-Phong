import { createAuthService } from "@/frontend/application/auth";
import { createEstimateService } from "@/frontend/application/estimates";
import { createSiteService } from "@/frontend/application/site";
import {
  authApi,
  estimateApi,
  siteApi,
} from "@/frontend/infrastructure/http/gateways";
export const authService = createAuthService(authApi);
export const estimateService = createEstimateService(estimateApi);
export const siteService = createSiteService(siteApi);
