import fs from "node:fs";
import { randomBytes } from "node:crypto";

if (process.env.CI !== "true" || !process.env.GITHUB_ENV)
  throw new Error("This setup is only for an isolated GitHub Actions runner.");
if (fs.existsSync(".env.test.local"))
  throw new Error("Refusing to overwrite existing private test settings.");
const password = process.env.CI_DATABASE_PASSWORD;
if (!password || !/^[a-zA-Z0-9-]+$/.test(password))
  throw new Error("Missing CI database credentials.");
const env = {
  DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:55432/thanhphong_test`,
  PAYLOAD_SECRET: randomBytes(48).toString("hex"),
  SERVER_URL: "http://127.0.0.1:3010",
  OWNER_EMAIL: "owner@thanhphong.test",
  OWNER_PASSWORD: randomBytes(24).toString("hex"),
  EDITOR_PASSWORD: randomBytes(24).toString("hex"),
  MEDIA_DIR: "./var/test-media",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "2526",
  SMTP_FROM: "website@thanhphong.test",
  LEAD_NOTIFICATION_EMAIL: "owner@thanhphong.test",
  NEXT_DIST_DIR: ".next-verify",
  NEXT_TELEMETRY_DISABLED: "1",
};
for (const value of [
  password,
  env.PAYLOAD_SECRET,
  env.OWNER_PASSWORD,
  env.EDITOR_PASSWORD,
])
  console.log(`::add-mask::${value}`);
fs.writeFileSync(
  ".env.test.local",
  Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n") + "\n",
  { mode: 0o600 },
);
fs.appendFileSync(
  process.env.GITHUB_ENV,
  Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n") + "\n",
);
console.log(
  "Isolated test settings generated. Production credentials are not used.",
);
