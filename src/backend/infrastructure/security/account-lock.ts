import pg from "pg";
import { ApplicationError } from "@/backend/application/errors";

const runtime = globalThis as typeof globalThis & { accountLockPool?: pg.Pool };

// Payload reads and rewrites the session array during login/logout. Serialize
// those operations per account across processes so a stale login cannot restore
// a revoked session. A transaction-scoped lock also works with pooled Postgres.
export async function withAccountLock<T>(
  email: string,
  operation: () => Promise<T>,
): Promise<T> {
  runtime.accountLockPool ||= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });
  const client = await runtime.accountLockPool.connect();
  let acquired = false;
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '6s'");
    await client.query("SET LOCAL idle_in_transaction_session_timeout = '30s'");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [`thanhphong:auth:${email.trim().toLowerCase()}`],
    );
    acquired = true;
    const result = await operation();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (!acquired)
      throw new ApplicationError(
        "unavailable",
        "Đang xử lý phiên đăng nhập. Vui lòng thử lại.",
        5,
      );
    throw error;
  } finally {
    client.release();
  }
}
