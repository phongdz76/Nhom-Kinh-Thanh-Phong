import { NextResponse, type NextRequest } from "next/server";
import { hostedChatOrigin } from "@/backend/composition/chat";

export function securityProxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const development = process.env.NODE_ENV === "development";
  const chatOrigin = hostedChatOrigin(process.env);
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self'${development ? " ws: wss:" : ""}`,
    `frame-src 'self'${chatOrigin ? ` ${chatOrigin}` : ""} https://www.google.com https://maps.google.com https://challenges.cloudflare.com`,
    "media-src 'self' blob:",
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
