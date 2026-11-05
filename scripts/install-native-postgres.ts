import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { nativeInstalled } from "./lib/native-postgres";

// Pinned binary archive; no npm lifecycle scripts or system service installation.
const archiveURL =
  "https://registry.npmjs.org/@embedded-postgres/windows-x64/-/windows-x64-18.6.0-beta.19.tgz";
const integrity =
  "fp8d8f+6WfJQftX0D+l1vUTLPwCN5hlhV/g/KI5zDBwHURmta6ph3/kJeEOVirtbczO/pKQlqM4cELB2c7Sp7Q==";
try {
  if (process.platform !== "win32" || process.arch !== "x64")
    throw new Error(
      "This installer is for Windows x64 only. Other systems can use Docker PostgreSQL.",
    );
  if (nativeInstalled()) {
    console.log("Native PostgreSQL tools are already installed.");
  } else {
    const root = path.resolve("var/tools/postgres");
    fs.mkdirSync(root, { recursive: true });
    if (fs.readdirSync(root).length)
      throw new Error(
        "Tool directory is not empty; inspect it before retrying installation.",
      );
    console.log("Downloading pinned PostgreSQL tools for this project only...");
    const response = await fetch(archiveURL, {
      signal: AbortSignal.timeout(180000),
    });
    if (!response.ok)
      throw new Error("PostgreSQL tools could not be downloaded.");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (createHash("sha512").update(bytes).digest("base64") !== integrity)
      throw new Error("PostgreSQL archive integrity check failed.");
    const archive = path.join(root, "postgres.tgz");
    fs.writeFileSync(archive, bytes, { flag: "wx" });
    const entries = execFileSync("tar", ["-tzf", archive], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    })
      .trim()
      .split(/\r?\n/);
    if (
      entries.some(
        (entry) =>
          !entry.startsWith("package/") ||
          entry.includes("\\") ||
          entry.split("/").includes(".."),
      )
    )
      throw new Error("Unsafe archive entry rejected.");
    execFileSync("tar", ["-xzf", archive, "-C", root], {
      windowsHide: true,
      timeout: 120000,
      stdio: "pipe",
    });
    fs.unlinkSync(archive);
    console.log(
      "Native PostgreSQL tools installed. Existing Docker data was not modified.",
    );
  }
} catch (error) {
  console.error(
    error instanceof Error && !("cmd" in error)
      ? error.message
      : "Could not install native PostgreSQL tools.",
  );
  process.exitCode = 1;
}
