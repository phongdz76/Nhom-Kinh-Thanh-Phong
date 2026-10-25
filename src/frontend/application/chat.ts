import { tawkChatLinkSchema } from "@/domain/schemas";
import type { ChatGateway } from "./ports";

export function createChatService(gateway: ChatGateway) {
  return {
    embed(directChatUrl: string) {
      return gateway.embed(tawkChatLinkSchema.parse(directChatUrl));
    },
  };
}
