import fs from "node:fs";
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import pg from "pg";
import { spawnSync } from "node:child_process";
dotenv.config({ path: [".env.local", ".env"], quiet: true });
const database = new URL(process.env.DATABASE_URL!);
if (
  !["127.0.0.1", "localhost"].includes(database.hostname) ||
  database.port !== "55432"
)
  throw new Error(
    "Test setup only accepts the local Docker PostgreSQL on port 55432.",
  );
const file = ".env.test.local";
if (!fs.existsSync(file)) {
  database.pathname = "/thanhphong_test";
  fs.writeFileSync(
    file,
    `DATABASE_URL=${database}\nPAYLOAD_SECRET=${randomBytes(48).toString("hex")}\nSERVER_URL=http://127.0.0.1:3010\nOWNER_EMAIL=owner@thanhphong.test\nOWNER_PASSWORD=${randomBytes(24).toString("hex")}\nEDITOR_PASSWORD=${randomBytes(24).toString("hex")}\nMEDIA_DIR=./var/test-media\nSMTP_HOST=127.0.0.1\nSMTP_PORT=2526\nSMTP_FROM=website@thanhphong.test\nLEAD_NOTIFICATION_EMAIL=owner@thanhphong.test\n`,
    { mode: 0o600 },
  );
}
const testEnv = dotenv.parse(fs.readFileSync(file));
const testDatabase = new URL(testEnv.DATABASE_URL);
if (
  testDatabase.pathname !== "/thanhphong_test" ||
  !["127.0.0.1", "localhost"].includes(testDatabase.hostname)
)
  throw new Error("Unexpected test database.");
database.pathname = "/postgres";
const client = new pg.Client({ connectionString: database.toString() });
await client.connect();
if (
  !(
    await client.query("SELECT 1 FROM pg_database WHERE datname=$1", [
      "thanhphong_test",
    ])
  ).rowCount
)
  await client.query("CREATE DATABASE thanhphong_test");
await client.end();
for (const action of ["migrate", "seed-demo"]) {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/database.ts", action],
    { stdio: "inherit", env: { ...process.env, ...testEnv, ENV_FILE: file } },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}
// Test accounts and throttles are scoped to the dedicated test database.
Object.assign(process.env, testEnv);
const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
const payload = await getPayload({ config });
try {
  const editor = (
    await payload.find({
      collection: "users",
      where: { email: { equals: "editor@thanhphong.test" } },
      limit: 1,
    })
  ).docs[0];
  if (!editor)
    await payload.create({
      collection: "users",
      data: {
        name: "Content editor",
        email: "editor@thanhphong.test",
        password: testEnv.EDITOR_PASSWORD,
        role: "editor",
        isActive: true,
      },
    });
  else
    await payload.update({
      collection: "users",
      id: editor.id,
      data: {
        password: testEnv.EDITOR_PASSWORD,
        sessions: [],
        loginAttempts: 0,
        lockUntil: null,
      },
      overrideAccess: true,
    });
  await payload.delete({
    collection: "rate-limits",
    where: {},
    overrideAccess: true,
  });
} finally {
  await payload.destroy();
}
console.log("Dedicated PostgreSQL test database is ready.");
process.exit(0);
