import pg from "pg";

export async function cleanupRateLimits(databaseURL: string | undefined) {
  if (!databaseURL)
    throw new Error("DATABASE_URL is required for maintenance.");
  const pool = new pg.Pool({
    connectionString: databaseURL,
    max: 1,
    connectionTimeoutMillis: 3000,
    query_timeout: 5000,
    statement_timeout: 5000,
  });
  try {
    const result = await pool.query(`
      WITH expired AS (
        SELECT id FROM rate_limits
        WHERE reset_at < now() - interval '1 hour'
        ORDER BY reset_at LIMIT 1000
        FOR UPDATE SKIP LOCKED
      )
      DELETE FROM rate_limits USING expired
      WHERE rate_limits.id = expired.id
        AND rate_limits.reset_at < now() - interval '1 hour'
    `);
    return result.rowCount || 0;
  } finally {
    await pool.end();
  }
}
