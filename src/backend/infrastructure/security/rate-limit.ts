import "server-only";
import pg from "pg";
import { createHmac } from "node:crypto";
import { ApplicationError } from "@/backend/application/errors";
const globalPool = globalThis as typeof globalThis & { ratePool?: pg.Pool };
export async function rateLimit(
  scope: string,
  identifier: string,
  maximum: number,
  seconds: number,
) {
  globalPool.ratePool ||= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
  });
  const key = createHmac("sha256", process.env.PAYLOAD_SECRET!)
    .update(`${scope}:${identifier}`)
    .digest("hex");
  const result = await globalPool.ratePool.query(
    `INSERT INTO rate_limits (id, key, count, reset_at, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, 1, now() + $2 * interval '1 second', now(), now())
    ON CONFLICT (key) DO UPDATE SET count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= now() THEN now() + $2 * interval '1 second' ELSE rate_limits.reset_at END, updated_at = now()
    RETURNING count`,
    [key, seconds],
  );
  if (Number(result.rows[0].count) > maximum)
    throw new ApplicationError(
      "tooManyRequests",
      "Bạn đã gửi nhiều yêu cầu. Vui lòng thử lại sau.",
    );
}
