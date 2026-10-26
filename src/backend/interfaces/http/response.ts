import "server-only";
import { NextResponse } from "next/server";
import { ApplicationError, type ErrorCode } from "@/backend/application/errors";
import { errorStatus } from "@/domain/errors";
import { ZodError } from "zod";
import { guardRequest } from "@/backend/composition/security";
import { boundedBody, HttpError } from "./body";
export { boundedBody, HttpError } from "./body";

export function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configured = process.env.SERVER_URL;
  const allowedOrigin = configured
    ? new URL(configured).origin
    : new URL(request.url).origin;
  if (!origin || origin !== allowedOrigin)
    throw new HttpError(403, "Nguồn gửi yêu cầu không hợp lệ.");
}
export async function readJSON(request: Request, limit = 16384) {
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get("content-type") || "",
    )
  )
    throw new HttpError(415, "Yêu cầu cần định dạng JSON.");
  try {
    return JSON.parse((await boundedBody(request, limit)).toString("utf8"));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Nội dung JSON không hợp lệ.");
  }
}
export function endpoint(
  handler: (
    request: Request,
    context: { params: Promise<Record<string, string>> },
  ) => Promise<Response>,
) {
  return async (
    request: Request,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      await guardRequest(request);
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApplicationError) {
        const status: Record<ErrorCode, number> = {
          invalid: 400,
          unauthenticated: 401,
          forbidden: 403,
          notFound: 404,
          conflict: 409,
          tooManyRequests: 429,
          unavailable: 503,
        };
        const response = json({ error: error.message }, status[error.code]);
        if (error.code === "tooManyRequests" || error.retryAfterSeconds)
          response.headers.set(
            "Retry-After",
            String(error.retryAfterSeconds || 60),
          );
        return response;
      }
      if (error instanceof HttpError)
        return json({ error: error.message }, error.status);
      if (error instanceof ZodError)
        return json(
          { error: error.issues[0]?.message || "Dữ liệu không hợp lệ." },
          400,
        );
      if (errorStatus(error) === 403)
        return json(
          { error: "Bạn không có quyền thực hiện thao tác này." },
          403,
        );
      if (errorStatus(error) === 404)
        return json({ error: "Không tìm thấy nội dung." }, 404);
      if (
        (error instanceof Error ? error.name : undefined) === "ValidationError"
      )
        return json(
          { error: "Dữ liệu không hợp lệ hoặc mã đã được sử dụng." },
          400,
        );
      // Log a category only. Never emit contact payloads, credentials or database URLs.
      console.error(
        "Backend request failed:",
        (error instanceof Error ? error.name : undefined) || "UnknownError",
      );
      return json(
        { error: "Chưa thể xử lý yêu cầu. Vui lòng thử lại sau." },
        503,
      );
    }
  };
}
