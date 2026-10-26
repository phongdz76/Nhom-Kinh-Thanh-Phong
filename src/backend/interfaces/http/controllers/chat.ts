import { chatFramePolicy, createChatFrame } from "@/backend/composition/chat";
import { endpoint } from "@/backend/interfaces/http/response";

export const getChatFrame = endpoint(
  async (request) =>
    new Response(
      createChatFrame(new URL(request.url).searchParams.get("link") || ""),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Security-Policy": chatFramePolicy,
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN",
        },
      },
    ),
);
