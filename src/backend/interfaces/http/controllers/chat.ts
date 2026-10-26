import {
  chatFramePolicy,
  createChatFrame,
  hostedChatOrigin,
} from "@/backend/composition/chat";
import { tawkChatLinkSchema } from "@/domain/schemas";
import { endpoint, HttpError } from "@/backend/interfaces/http/response";

export const getChatFrame = endpoint(async (request) => {
  const link = tawkChatLinkSchema.parse(
    new URL(request.url).searchParams.get("link") || "",
  );
  const origin = hostedChatOrigin(process.env);
  if (origin) {
    const url = new URL(origin);
    url.searchParams.set("link", link);
    return new Response(null, {
      status: 307,
      headers: { Location: url.href, "Cache-Control": "no-store" },
    });
  }
  // The application-origin vendor document is for local development only.
  if (process.env.NODE_ENV === "production")
    throw new HttpError(
      503,
      "Chat chưa được cấu hình. Vui lòng dùng form tư vấn.",
    );
  return new Response(createChatFrame(link), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": chatFramePolicy,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
});
