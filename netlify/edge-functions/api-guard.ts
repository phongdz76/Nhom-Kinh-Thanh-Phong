import { requestBodyLimit } from "../../src/backend/application/request-security";

// A native edge rule blocks excess requests before SSR/database work starts.
// These two rules fit Netlify Free's current two-rule allowance.
export default function apiGuard(request: Request) {
  const method = request.method.toUpperCase();
  const path = new URL(request.url).pathname;
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (!["GET", "HEAD", "POST", "PATCH", "OPTIONS"].includes(method))
    return new Response(null, { status: 405, headers });
  const limit = requestBodyLimit(path);
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit))
    return Response.json(
      { error: "Dữ liệu gửi lên quá lớn." },
      { status: 413, headers },
    );
  if (method === "POST" || method === "PATCH") {
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return Response.json(
        { error: "Nguồn gửi yêu cầu không hợp lệ." },
        { status: 403, headers },
      );
    const type = request.headers.get("content-type") || "";
    const accepted =
      limit > 1024 * 1024
        ? /^multipart\/form-data\s*;\s*boundary=/i.test(type)
        : /^application\/json(?:\s*;|$)/i.test(type);
    if (!accepted)
      return Response.json(
        { error: "Định dạng yêu cầu không hợp lệ." },
        { status: 415, headers },
      );
  }
}

export const config = {
  path: "/api/*",
  rateLimit: {
    windowLimit: 120,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
