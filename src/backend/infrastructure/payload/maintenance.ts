import pg from "pg";
import { getPayload } from "payload";
import config from "@payload-config";
import { notificationConfig } from "@/backend/infrastructure/notifications/config";

// A scheduled function is a separate process; do not import Next's server-only entry.
export async function runMaintenance() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    statement_timeout: 5000,
  });
  let payload: Awaited<ReturnType<typeof getPayload>> | undefined;
  await client.connect();
  try {
    const lock = await client.query(
      "SELECT pg_try_advisory_lock(192845, 1) AS acquired",
    );
    if (!lock.rows[0].acquired) return { skipped: "already_running" };
    try {
      const cleaned = await client.query(`WITH expired AS (
        SELECT id FROM rate_limits WHERE reset_at < now() - interval '1 hour'
        ORDER BY reset_at LIMIT 1000 FOR UPDATE SKIP LOCKED
      ) DELETE FROM rate_limits USING expired WHERE rate_limits.id = expired.id`);
      if (!notificationConfig(process.env))
        return {
          notifications: "not_configured",
          cleaned: cleaned.rowCount || 0,
        };
      payload = await getPayload({ config });
      await payload.jobs.run({ limit: 2, sequential: true });
      return { notifications: "processed", cleaned: cleaned.rowCount || 0 };
    } finally {
      await client.query("SELECT pg_advisory_unlock(192845, 1)");
    }
  } finally {
    // getPayload caches the instance across warm invocations. Its small pool
    // closes idle connections itself; destroying it would poison the next run.
    await client.end();
  }
}
