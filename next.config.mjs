import { withPayload } from "@payloadcms/next/withPayload";
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Public build context also keeps preview Lambdas noindex at runtime.
  env: { SITE_DEPLOY_CONTEXT: process.env.CONTEXT || "" },
  ...(process.env.NEXT_BUILD_CPUS === "2" ? { experimental: { cpus: 2 } } : {}),
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'",
          },
          ...(process.env.SERVER_URL?.startsWith("https://")
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
        ],
      },
    ];
  },
  // Isolate verification builds from an already running development server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: [
    "payload",
    "@payloadcms/db-postgres",
    "@payloadcms/storage-s3",
    "sharp",
    "pg",
    "exceljs",
    "docx",
  ],
};

export default withPayload(nextConfig);
