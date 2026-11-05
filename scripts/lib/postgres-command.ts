import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { nativeBinary } from "./native-postgres";

export function postgresCommand(
  command: "pg_dump" | "pg_restore",
  connection: string,
  args: string[],
) {
  const address = new URL(connection);
  if (!["postgres:", "postgresql:"].includes(address.protocol))
    throw new Error("Expected a PostgreSQL connection.");
  const pgEnv = {
    PGHOST: address.hostname,
    PGPORT: address.port || "5432",
    PGUSER: decodeURIComponent(address.username),
    PGPASSWORD: decodeURIComponent(address.password),
    PGDATABASE: decodeURIComponent(address.pathname.slice(1)),
    PGSSLMODE: address.searchParams.get("sslmode") || "prefer",
    PGCONNECT_TIMEOUT: "10",
    PGOPTIONS: "-c statement_timeout=300000",
  };
  const native = nativeBinary(command);
  const binary =
    process.env[command === "pg_dump" ? "PG_DUMP_PATH" : "PG_RESTORE_PATH"] ||
    (fs.existsSync(native) ? native : command);
  const found = spawnSync(binary, ["--version"], {
    stdio: "pipe",
    windowsHide: true,
    timeout: 10000,
  });
  const child =
    found.status === 0
      ? spawn(binary, args, {
          env: { ...process.env, ...pgEnv },
          windowsHide: true,
          stdio: ["pipe", "pipe", "pipe"],
        })
      : spawn(
          "docker",
          [
            "run",
            "--rm",
            ...(process.platform === "win32" ? [] : ["--network=host"]),
            "-i",
            ...Object.keys(pgEnv).flatMap((key) => ["--env", key]),
            "postgres:18-alpine",
            command,
            ...args,
          ],
          {
            env: {
              ...process.env,
              ...pgEnv,
              ...(process.platform === "win32" &&
              ["127.0.0.1", "localhost"].includes(pgEnv.PGHOST)
                ? { PGHOST: "host.docker.internal" }
                : {}),
            },
            windowsHide: true,
            stdio: ["pipe", "pipe", "pipe"],
          },
        );
  // Drain stderr without retaining database URLs, credentials, SQL or customer data.
  child.stderr.resume();
  const complete = new Promise<void>((resolve, reject) => {
    child.once("error", () =>
      reject(
        new Error(
          `${command} could not start. Install PostgreSQL client tools or use Docker.`,
        ),
      ),
    );
    child.once("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `${command} failed. Check tool version, database access and network connectivity.`,
            ),
          ),
    );
  });
  // Avoid an unhandled rejection while a stream is still being consumed.
  void complete.catch(() => {});
  return { child, complete };
}
