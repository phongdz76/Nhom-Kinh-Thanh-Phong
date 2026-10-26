import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import fs from "node:fs";
const env = dotenv.parse(fs.readFileSync(".env.test.local"));

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  use: { baseURL: "http://127.0.0.1:3010", trace: "retain-on-failure" },
  webServer: [
    {
      command: "npm run start -- --port 3010",
      url: "http://127.0.0.1:3010/api/health",
      reuseExistingServer: false,
      timeout: 60000,
      env: {
        ...env,
        NEXT_DIST_DIR: ".next-verify",
        CHAT_FRAME_ORIGIN: "http://127.0.0.1:3011",
        TURNSTILE_SITE_KEY: "offline-test-site-key",
        TURNSTILE_SECRET_KEY: env.PAYLOAD_SECRET,
        NODE_OPTIONS:
          "--import tsx --import ./tests/fixtures/turnstile-server.ts",
      },
    },
    {
      command: "node --import tsx tests/fixtures/chat-server.ts",
      url: "http://127.0.0.1:3011",
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
