import type { RateLimiter } from "./ports";

function apiRoute(path: string) {
  const [root, prefix, ...encoded] = path.replace(/\/+$/, "").split("/");
  if (root !== "" || prefix !== "api") return null;
  try {
    // Next.js decodes catch-all segments once. Use the same identity for policy
    // selection, without treating an encoded slash as another route segment.
    const segments = encoded.map((segment) => decodeURIComponent(segment));
    if (segments.some((segment) => segment.includes("/"))) return null;
    return segments.join("/");
  } catch {
    return null;
  }
}

// These limits supplement account/phone limits and the hosting provider's edge rules.
export function requestLimit(path: string, method: string) {
  const route = apiRoute(path);
  if (method === "POST" && route === "auth/login")
    return { scope: "http-login", maximum: 20, seconds: 900 };
  if (method === "POST" && route === "public/leads")
    return { scope: "http-leads", maximum: 10, seconds: 900 };
  if (method === "GET" && route === "public/form-protection")
    return { scope: "http-form-config", maximum: 20, seconds: 60 };
  if (method === "POST" && route === "admin/media")
    return { scope: "http-upload", maximum: 15, seconds: 60 };
  if (route?.endsWith("/export"))
    return { scope: "http-export", maximum: 15, seconds: 60 };
  return { scope: "http-api", maximum: 180, seconds: 60 };
}

export function requestBodyLimit(path: string) {
  const route = apiRoute(path);
  if (route === "admin/media") return 8 * 1024 * 1024 + 131072;
  if (route === "admin/content/posts") return 350000;
  if (route === "admin/content/projects") return 64000;
  if (
    route === "admin/estimates" ||
    /^admin\/estimates\/[^/]+$/.test(route || "")
  )
    return 65536;
  return 16384;
}

export function createRequestGuard(limiter: RateLimiter) {
  return async (path: string, method: string, client: string | null) => {
    // Outside a verified ingress, forwarded headers cannot identify the client.
    // Account/global limits still apply; never accept a user-selected header.
    if (!client) return;
    const limit = requestLimit(path, method);
    await limiter.check(limit.scope, client, limit.maximum, limit.seconds);
    if (limit.scope === "http-leads")
      await limiter.check("http-leads-burst", client, 3, 60);
  };
}
