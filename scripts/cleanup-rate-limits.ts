import dotenv from "dotenv";
import { cleanupRateLimits } from "./lib/rate-limit-maintenance";

dotenv.config({
  path: process.env.ENV_FILE || [".env.local", ".env"],
  quiet: true,
});
try {
  const count = await cleanupRateLimits(process.env.DATABASE_URL);
  console.log(`Expired rate-limit counters removed: ${count}.`);
} catch {
  console.error(
    "Rate-limit maintenance failed. Check database access and migrations.",
  );
  process.exitCode = 1;
}
