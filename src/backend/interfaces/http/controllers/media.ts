import { media } from "@/backend/composition/services";
import { requireUser } from "@/backend/interfaces/http/auth";
import {
  HttpError,
  boundedBody,
  endpoint,
  json,
  sameOrigin,
} from "@/backend/interfaces/http/response";

export const uploadMedia = endpoint(async (request) => {
  sameOrigin(request);
  const user = await requireUser(request);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    throw new HttpError(415, "Yêu cầu tải ảnh không hợp lệ.");
  const bytes = await boundedBody(request, 8 * 1024 * 1024 + 131072);
  const form = await new Response(new Uint8Array(bytes), {
    headers: { "content-type": request.headers.get("content-type")! },
  }).formData();
  const file = form.get("file");
  const alt = String(form.get("alt") || "").trim();
  if (!(file instanceof File))
    throw new HttpError(400, "Chọn ảnh JPG, PNG hoặc WebP không quá 8 MB.");
  return json(await media.uploadImage(file, alt, user), 201);
});

export const getMedia = endpoint(async (_request, context) => {
  const result = await media.getMedia((await context.params).id);
  if ("redirect" in result) return Response.redirect(result.redirect);
  return new Response(new Uint8Array(result.data), {
    headers: {
      "Content-Type": result.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
