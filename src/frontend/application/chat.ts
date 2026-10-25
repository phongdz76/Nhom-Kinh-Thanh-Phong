import { tawkChatLinkSchema } from "@/domain/schemas";
import type { ChatGateway } from "./ports";

export function createChatService(gateway: ChatGateway) {
  return {
    open(directChatUrl: string) {
      return gateway.open(tawkChatLinkSchema.parse(directChatUrl));
    },
    hide: () => gateway.hide(),
  };
}
