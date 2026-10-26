import dotenv from "dotenv";
import { productionErrors } from "./lib/production-config";

dotenv.config({ path: [".env.local", ".env"], quiet: true });
const errors = productionErrors(process.env);
if (errors.length) {
  // Report names/requirements only; never log environment values.
  console.error(
    "Production configuration rejected:\n" +
      errors.map((error) => `- ${error}`).join("\n"),
  );
  process.exitCode = 1;
} else console.log("Production configuration passed. No secrets printed.");
