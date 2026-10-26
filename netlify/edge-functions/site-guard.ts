export default function siteGuard() {
  // Continue to Next.js. Netlify enforces the rule without an application DB.
}

export const config = {
  path: "/*",
  excludedPath: [
    "/api/*",
    "/_next/static/*",
    "/images/*",
    "/icon",
    "/favicon.ico",
  ],
  rateLimit: {
    windowLimit: 300,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
