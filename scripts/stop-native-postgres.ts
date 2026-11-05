import { stopNativeDatabase } from "./lib/native-postgres";
try {
  stopNativeDatabase();
  console.log("The project's native PostgreSQL has stopped.");
} catch {
  console.error(
    "Could not stop native PostgreSQL. Check var/postgres-native.log.",
  );
  process.exitCode = 1;
}
