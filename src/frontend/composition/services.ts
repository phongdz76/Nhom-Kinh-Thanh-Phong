import { createAuthService } from "@/frontend/application/auth";
import { createChatService } from "@/frontend/application/chat";
import { tawkChatGateway } from "@/frontend/infrastructure/chat/tawk";
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
export const chatService = createChatService(tawkChatGateway);
export { sessionEvents } from "@/frontend/infrastructure/security/session";
export { formChallengeGateway as formChallenge } from "@/frontend/infrastructure/security/turnstile";
