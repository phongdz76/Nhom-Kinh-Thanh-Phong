import dotenv from "dotenv";
import { cleanupRateLimits } from "./lib/rate-limit-maintenance";
dotenv.config({
  path: process.env.ENV_FILE || [".env.local", ".env"],
  quiet: true,
});
const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
const payload = await getPayload({ config });
try {
  try {
    await cleanupRateLimits(process.env.DATABASE_URL);
  } catch {
    console.error(
      "Counter cleanup failed; notification processing will continue.",
    );
  }
  if (!process.env.SMTP_HOST || !process.env.LEAD_NOTIFICATION_EMAIL) {
    console.log(
      "Email is not configured; queued notifications remain in PostgreSQL.",
    );
  } else {
    await payload.jobs.run({ limit: 20, sequential: true });
  }
} finally {
  await payload.destroy();
}
process.exit(0);
