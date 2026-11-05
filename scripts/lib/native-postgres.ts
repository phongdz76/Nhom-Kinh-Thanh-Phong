import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import pg from "pg";

export const nativeDirectory = path.resolve(
  "var/tools/postgres/package/native/bin",
);
const dataDirectory = path.resolve("var/postgres-native");
export function nativeBinary(name: string) {
  return path.join(
    process.env.LOCAL_PG_BIN || nativeDirectory,
    `${name}${process.platform === "win32" ? ".exe" : ""}`,
  );
}
export function nativeInstalled() {
  return fs.existsSync(nativeBinary("pg_ctl"));
}

export function localDatabaseAddress(value: string) {
  const url = new URL(value);
  if (
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.port !== "55432" ||
    !/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(decodeURIComponent(url.username)) ||
    !/^\/[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(decodeURIComponent(url.pathname)) ||
    !url.password
  )
    throw new Error(
      "Native PostgreSQL only supports the project's local database on port 55432.",
    );
  return url;
}

export async function startNativeDatabase(value: string) {
  const address = localDatabaseAddress(value);
  if (!nativeInstalled())
    throw new Error(
      "Install the local PostgreSQL tools with npm run db:install-native first.",
    );
  fs.mkdirSync(path.dirname(dataDirectory), { recursive: true });
  if (!fs.existsSync(path.join(dataDirectory, "PG_VERSION"))) {
    if (fs.existsSync(dataDirectory) && fs.readdirSync(dataDirectory).length)
      throw new Error(
        "Refusing to initialize a non-empty PostgreSQL directory.",
      );
    const passwordFile = path.resolve("var/.postgres-init-password");
    fs.writeFileSync(passwordFile, decodeURIComponent(address.password), {
      mode: 0o600,
      flag: "wx",
    });
    try {
      execFileSync(
        nativeBinary("initdb"),
        [
          "-D",
          dataDirectory,
          "-U",
          decodeURIComponent(address.username),
          "--pwfile",
          passwordFile,
          "--auth-local=scram-sha-256",
          "--auth-host=scram-sha-256",
          "--encoding=UTF8",
          "--locale=C",
        ],
        { windowsHide: true, stdio: "pipe", timeout: 60000 },
      );
      fs.appendFileSync(
        path.join(dataDirectory, "postgresql.conf"),
        "\nlisten_addresses = '127.0.0.1'\nport = 55432\nshared_buffers = '32MB'\nmax_connections = 60\nwork_mem = '2MB'\nmaintenance_work_mem = '32MB'\n",
      );
    } finally {
      fs.unlinkSync(passwordFile);
    }
  }
  execFileSync(
    nativeBinary("pg_ctl"),
    [
      "-D",
      dataDirectory,
      "-l",
      path.resolve("var/postgres-native.log"),
      "-w",
      "-t",
      "30",
      "start",
    ],
    { windowsHide: true, stdio: "ignore", timeout: 40000 },
  );
  const database = decodeURIComponent(address.pathname.slice(1));
  address.pathname = "/postgres";
  const client = new pg.Client({
    connectionString: address.href,
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  try {
    const exists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname=$1",
      [database],
    );
    if (!exists.rowCount) await client.query(`CREATE DATABASE "${database}"`);
    return { created: !exists.rowCount };
  } finally {
    await client.end();
  }
}

export function stopNativeDatabase() {
  if (!fs.existsSync(path.join(dataDirectory, "PG_VERSION"))) return;
  execFileSync(
    nativeBinary("pg_ctl"),
    ["-D", dataDirectory, "-w", "-t", "30", "-m", "fast", "stop"],
    { windowsHide: true, stdio: "ignore", timeout: 40000 },
  );
}
