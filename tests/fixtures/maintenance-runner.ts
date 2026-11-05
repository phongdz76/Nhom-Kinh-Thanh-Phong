import dotenv from "dotenv";
dotenv.config({ path: ".env.test.local", override: true, quiet: true });
const database = new URL(process.env.DATABASE_URL!);
if (
  database.hostname !== "127.0.0.1" ||
  database.pathname !== "/thanhphong_test"
)
  throw new Error(
    "Maintenance fixture requires the isolated local test database.",
  );
const { runMaintenance } =
  await import("../../src/backend/composition/maintenance");
const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");
try {
  await runMaintenance();
  await runMaintenance();
  console.log("Scheduled maintenance supports repeated warm invocations.");
} finally {
  await (await getPayload({ config })).destroy();
}
process.exit(0);
