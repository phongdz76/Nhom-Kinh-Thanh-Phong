import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import dotenv from "dotenv";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();
function git(args: string[], input?: string) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      input,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    throw new Error("Git content could not be read for the secret check.");
  }
}
const secrets = new Set<string>();
const privateName =
  /(?:SECRET|PASS(?:WORD)?|TOKEN|PRIVATE.?KEY|API.?KEY|ACCESS.?KEY|DATABASE_URL)/i;

function remember(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    if (!privateName.test(key) || !value || value.length < 8) continue;
    secrets.add(value);
    if (/DATABASE_URL/i.test(key)) {
      try {
        const password = new URL(value).password;
        if (password.length >= 8) {
          secrets.add(password);
          secrets.add(decodeURIComponent(password));
        }
      } catch {
        // A non-URL secret is still checked as a literal value.
      }
    }
  }
}
remember(process.env);
for (const name of fs.readdirSync(root)) {
  const filename = path.join(root, name);
  if (name.startsWith(".env") && fs.lstatSync(filename).isFile())
    remember(dotenv.parse(fs.readFileSync(filename)));
}

const forbiddenPath = (name: string) =>
  /(?:^|\/)\.env[^/]*(?:$|\/)/i.test(name) ||
  /\.(?:pem|p12|pfx|key)$/i.test(name) ||
  /(?:^|\/)(?:id_rsa|id_ed25519)$/.test(name);
const tokenPatterns = [
  /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
];
const violations = new Set<string>();
function inspect(name: string, content: Buffer) {
  if (forbiddenPath(name)) violations.add(`${name}: private file`);
  if ([...secrets].some((secret) => content.includes(Buffer.from(secret))))
    violations.add(`${name}: contains a local environment secret`);
  if (tokenPatterns.some((pattern) => pattern.test(content.toString("utf8"))))
    violations.add(`${name}: contains a credential or private key`);
}

function inspectObjects(items: { name: string; object: string }[]) {
  if (!items.length) return 0;
  const output = git(
    ["cat-file", "--batch"],
    items.map((item) => item.object).join("\n") + "\n",
  );
  let offset = 0;
  let blobs = 0;
  for (const item of items) {
    const end = output.indexOf(10, offset);
    if (end < 0) throw new Error("Incomplete Git object response.");
    const [, kind, length] = output
      .subarray(offset, end)
      .toString("utf8")
      .split(" ");
    const size = Number(length);
    if (
      !Number.isSafeInteger(size) ||
      size < 0 ||
      end + size + 1 >= output.length
    )
      throw new Error("Invalid Git object response.");
    if (kind === "blob") {
      inspect(item.name, output.subarray(end + 1, end + size + 1));
      blobs++;
    }
    offset = end + size + 2;
  }
  return blobs;
}

const staged = git([
  "diff",
  "--cached",
  "--name-only",
  "--diff-filter=ACMR",
  "-z",
])
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
const index = new Map(
  git(["ls-files", "--stage", "-z"])
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((entry) => {
      const tab = entry.indexOf("\t");
      const [, object] = entry.slice(0, tab).split(" ");
      return [entry.slice(tab + 1), object];
    }),
);
inspectObjects(
  staged.map((name) => {
    const object = index.get(name);
    if (!object) throw new Error("A staged file could not be inspected.");
    return { name, object };
  }),
);

let historyBlobs = 0;
if (process.argv.includes("--history")) {
  // Scan publishable refs; private editor checkpoint refs are not branches.
  const paths = git([
    "log",
    "--branches",
    "--remotes",
    "--tags",
    "--format=",
    "--name-only",
    "-z",
  ])
    .toString("utf8")
    .split(/[\0\n]/)
    .filter(Boolean);
  for (const name of paths)
    if (forbiddenPath(name)) violations.add(`${name}: private file in history`);
  const items = git([
    "rev-list",
    "--objects",
    "--branches",
    "--remotes",
    "--tags",
  ])
    .toString("utf8")
    .trim()
    .split("\n")
    .flatMap((line) => {
      const space = line.indexOf(" ");
      return space < 0
        ? []
        : [{ object: line.slice(0, space), name: line.slice(space + 1) }];
    });
  historyBlobs = inspectObjects(items);
}

if (violations.size) {
  // Report locations only. Never print the matching content or secret value.
  console.error([...violations].join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Secret check passed: ${staged.length} staged files${historyBlobs ? ` and ${historyBlobs} history blobs` : ""}.`,
  );
}
