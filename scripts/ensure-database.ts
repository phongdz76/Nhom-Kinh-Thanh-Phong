import dotenv from "dotenv";
import pg from "pg";
import { spawnSync } from "node:child_process";

dotenv.config({
  path: process.env.ENV_FILE || [
    ".env.development.local",
    ".env.local",
    ".env.development",
    ".env",
  ],
  quiet: true,
});

async function ensureDatabase() {
  if (!process.env.DATABASE_URL)
    throw new Error("Missing DATABASE_URL. Run npm run setup first.");
  const address = new URL(process.env.DATABASE_URL);
  async function connect() {
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });
    try {
      await client.connect();
      await client.query("SELECT 1");
    } finally {
      await client.end().catch(() => {});
    }
  }
  try {
    await connect();
  } catch (error) {
    const localDocker =
      ["127.0.0.1", "localhost"].includes(address.hostname) &&
      address.port === "55432";
    const refused =
      error != null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ECONNREFUSED";
    if (!localDocker || !refused)
      throw new Error(
        "Cannot connect to PostgreSQL. Check DATABASE_URL and the database credentials.",
      );
    const docker = spawnSync("docker", ["info"], {
      stdio: "ignore",
      windowsHide: true,
      timeout: 10000,
    });
    if (docker.status !== 0)
      throw new Error(
        "Docker Desktop is not running. Open Docker Desktop, then run npm run dev again.",
      );
    console.log("Starting the local PostgreSQL container...");
    const result = spawnSync(
      "docker",
      ["compose", "up", "-d", "--wait", "--wait-timeout", "60", "db"],
      { stdio: "inherit", windowsHide: true },
    );
    if (result.status !== 0)
      throw new Error(
        "PostgreSQL could not start. Check docker compose logs db.",
      );
    await connect();
  }
  console.log(
    `PostgreSQL is ready at ${address.hostname}:${address.port || "5432"}.`,
  );
}

ensureDatabase().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Database startup failed.",
  );
  process.exitCode = 1;
});
