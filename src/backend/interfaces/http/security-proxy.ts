import { NextResponse, type NextRequest } from "next/server";

export function securityProxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const development = process.env.NODE_ENV === "development";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""} https://*.tawk.to`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com https://*.tawk.to",
    `connect-src 'self' https://*.tawk.to https://*.tawk.link wss://*.tawk.to${development ? " ws: wss:" : ""}`,
    "frame-src 'self' https://*.tawk.to https://www.google.com https://maps.google.com https://challenges.cloudflare.com",
    "media-src 'self' blob: https://*.tawk.to https://*.tawk.link",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(process.env.SERVER_URL?.startsWith("https://")
      ? ["upgrade-insecure-requests"]
      : []),
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("Content-Security-Policy", policy);
  headers.set("x-nonce", nonce);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  // HTML contains a per-response nonce and must never be shared by a CDN.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
