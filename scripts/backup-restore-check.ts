import path from "node:path";
import { randomBytes } from "node:crypto";
import { pipeline } from "node:stream/promises";
import dotenv from "dotenv";
import pg from "pg";
import { backupKey, decryptedBackup } from "./lib/backup-crypto";
import { verifyBackup } from "./lib/backup-manifest";
import { localDatabaseAddress } from "./lib/native-postgres";
import { postgresCommand } from "./lib/postgres-command";

dotenv.config({
  path: [".env.backup.local", process.env.ENV_FILE || ".env.local", ".env"],
  quiet: true,
});
try {
  if (!process.argv[2]) throw new Error("Specify a backup directory.");
  const directory = path.resolve(process.argv[2]);
  const key = backupKey(process.env.BACKUP_ENCRYPTION_KEY);
  const manifest = await verifyBackup(directory, key);
  // Never restore into production, the app database or a pre-existing database.
  const target = localDatabaseAddress(
    process.env.RESTORE_DATABASE_URL || process.env.DATABASE_URL || "",
  );
  target.pathname = "/postgres";
  const admin = new pg.Client({
    connectionString: target.href,
    connectionTimeoutMillis: 5000,
  });
  await admin.connect();
  const database = `thanhphong_restore_${randomBytes(8).toString("hex")}`;
  let created = false;
  try {
    await admin.query(`CREATE DATABASE "${database}"`);
    created = true;
    target.pathname = `/${database}`;
    const restore = postgresCommand("pg_restore", target.href, [
      "--dbname",
      database,
      "--no-owner",
      "--no-privileges",
      "--exit-on-error",
      "--single-transaction",
    ]);
    restore.child.stdout.resume();
    const { source, decipher } = await decryptedBackup(
      path.join(directory, manifest.database.file),
      key,
    );
    try {
      await pipeline(source, decipher, restore.child.stdin);
      await restore.complete;
    } catch (error) {
      restore.child.kill();
      throw error;
    }
    const client = new pg.Client({ connectionString: target.href });
    await client.connect();
    try {
      const tables = await client.query(
        "SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='public'",
      );
      if (!tables.rows[0].count) throw new Error("Restored database is empty.");
      const mediaExists = await client.query(
        "SELECT to_regclass('public.media') AS table_name",
      );
      if (mediaExists.rows[0].table_name) {
        const media = await client.query(
          "SELECT filename FROM media WHERE filename IS NOT NULL",
        );
        const keys = new Set(manifest.media.map((item) => item.key));
        if (media.rows.some((row) => !keys.has(row.filename)))
          throw new Error(
            "Backup is missing a file referenced by the restored database.",
          );
      }
      console.log(
        `Restore check passed: ${tables.rows[0].count} tables, authenticated media files and database references. Production was not modified.`,
      );
    } finally {
      await client.end();
    }
  } finally {
    if (created) {
      await admin.query(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()",
        [database],
      );
      await admin.query(`DROP DATABASE "${database}"`);
    }
    await admin.end();
  }
} catch {
  console.error(
    "Restore check failed. It requires a valid backup/key and an isolated local PostgreSQL on port 55432. Production restore is not allowed.",
  );
  process.exitCode = 1;
}
