export { securityProxy as proxy } from "@/backend/interfaces/http/security-proxy";

export const config = {
  matcher: [
    "/((?!api/|_next/|images/|favicon.ico|icon|robots.txt|sitemap.xml).*)",
  ],
};
