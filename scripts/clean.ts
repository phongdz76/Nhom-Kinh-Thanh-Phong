import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const workspace = fs.realpathSync(process.cwd());
const generatedDirectories = [
  ".next-verify",
  "test-results",
  "playwright-report",
];
const generatedFiles = ["tsconfig.tsbuildinfo"];

// next-env.d.ts may currently reference a verification build. Ask Next to point
// it back to the dev output before removing those generated declarations.
const types = spawnSync(
  process.execPath,
  [path.join(workspace, "node_modules/next/dist/bin/next"), "typegen"],
  {
    env: { ...process.env, NEXT_DIST_DIR: ".next" },
    stdio: "inherit",
  },
);
if (types.status !== 0)
  throw new Error("Next type generation failed; verification files were kept.");

// Never traverse a link or touch the running dev output, media, env files,
// database files or installed packages. Every target is an explicit local path.
for (const name of [...generatedDirectories, ...generatedFiles]) {
  const target = path.resolve(workspace, name);
  if (path.dirname(target) !== workspace)
    throw new Error("Cleanup target is outside the workspace.");
  if (!fs.existsSync(target)) continue;
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink() || fs.realpathSync(target) !== target)
    throw new Error(`Refusing to clean a linked path: ${name}`);
  fs.rmSync(target, {
    recursive: generatedDirectories.includes(name),
    force: false,
  });
  console.log(`Removed ${name}`);
}
