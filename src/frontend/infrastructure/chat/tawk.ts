import type { ChatGateway } from "@/frontend/application/ports";
import { API_PATHS } from "@/frontend/infrastructure/http/api-paths";

export const tawkChatGateway: ChatGateway = {
  embed(link) {
    // A fetched document has its own CSP. Vendor-created frames must not inherit
    // the website's strict nonce policy through srcdoc.
    return { url: API_PATHS.public.chatFrame(link) };
  },
};
