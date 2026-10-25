import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
const envFile = fs.existsSync(".env.local")
  ? ".env.local"
  : fs.existsSync(".env")
    ? ".env"
    : ".env.local";
if (!fs.existsSync(envFile)) {
  const password = randomBytes(32).toString("hex");
  fs.writeFileSync(
    ".env.local",
    `POSTGRES_PASSWORD=${password}\nDATABASE_URL=postgresql://thanhphong:${password}@127.0.0.1:55432/thanhphong\nPAYLOAD_SECRET=${randomBytes(48).toString("hex")}\nSERVER_URL=http://localhost:3000\nOWNER_EMAIL=admin@thanhphong.local\nOWNER_PASSWORD=${randomBytes(24).toString("hex")}\nMEDIA_DIR=./var/media\n`,
    { mode: 0o600 },
  );
  console.log(
    "Created .env.local. Generated credentials are stored there and are not printed.",
  );
}
const docker = spawnSync(
  "docker",
  ["compose", "--env-file", envFile, "up", "-d", "--wait", "db"],
  { stdio: "inherit" },
);
if (docker.status !== 0) {
  console.error("Open Docker Desktop, then run setup again.");
  process.exit(1);
}
for (const action of ["migrate", "init"]) {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/database.ts", action],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(
  "Backend is ready. Start the website with npm run dev; sign in at /admin.",
);
