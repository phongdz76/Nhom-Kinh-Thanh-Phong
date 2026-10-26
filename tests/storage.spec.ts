import { test } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

test("the configured cloud adapter uploads WebP with the Supabase endpoint, region and public URL", async () => {
  // A fresh process prevents a local-storage Payload instance cached by another
  // spec from being reused for this cloud-storage configuration.
  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  for (const key of [
    "PATH",
    "SystemRoot",
    "WINDIR",
    "TEMP",
    "TMP",
    "USERPROFILE",
    "LOCALAPPDATA",
  ])
    if (process.env[key]) environment[key] = process.env[key]!;
  await promisify(execFile)(
    process.execPath,
    ["--import", "tsx", "tests/fixtures/cloud-upload.ts"],
    {
      env: environment,
      timeout: 25000,
    },
  );
});
