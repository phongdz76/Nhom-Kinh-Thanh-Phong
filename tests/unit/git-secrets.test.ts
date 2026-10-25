import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { test } from "node:test";

const root = process.cwd();
function fixture(
  run: (
    directory: string,
    git: (...args: string[]) => void,
    check: (history?: boolean) => ReturnType<typeof spawnSync>,
  ) => void,
) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "thanhphong-secret-guard-"),
  );
  const git = (...args: string[]) => {
    execFileSync("git", args, { cwd: directory, stdio: "pipe" });
  };
  const check = (history = false) =>
    spawnSync(
      process.execPath,
      [
        path.join(root, "node_modules/tsx/dist/cli.mjs"),
        path.join(root, "scripts/check-secrets.ts"),
        ...(history ? ["--history"] : []),
      ],
      { cwd: directory, encoding: "utf8" },
    );
  try {
    git("init", "--quiet");
    git("config", "user.name", "Secret Guard Test");
    git("config", "user.email", "test@example.invalid");
    git("config", "core.hooksPath", path.join(directory, ".git/hooks"));
    run(directory, git, check);
  } finally {
    assert.equal(
      path.dirname(path.resolve(directory)),
      path.resolve(os.tmpdir()),
    );
    assert.ok(path.basename(directory).startsWith("thanhphong-secret-guard-"));
    fs.rmSync(directory, { recursive: true });
  }
}

test("secret guard accepts ordinary staged code with private env kept local", () => {
  fixture((directory, git, check) => {
    fs.writeFileSync(
      path.join(directory, ".env"),
      `PAYLOAD_SECRET=${randomUUID()}\n`,
    );
    fs.writeFileSync(
      path.join(directory, "application.ts"),
      'export const name = "Thanh Phong";\n',
    );
    git("add", "--", "application.ts");
    const result = check();
    assert.equal(result.status, 0, result.stderr?.toString());
  });
});

test("secret guard rejects env examples even when force staged", () => {
  fixture((directory, git, check) => {
    fs.writeFileSync(path.join(directory, ".gitignore"), ".env*\n");
    fs.writeFileSync(
      path.join(directory, ".env.example"),
      "SERVER_URL=http://localhost:3000\n",
    );
    git("add", "-f", "--", ".env.example");
    const result = check();
    assert.equal(result.status, 1);
    assert.match(result.stderr?.toString() || "", /private file/);
  });
});

test("secret guard reads staged bytes and never echoes a leaked local secret", () => {
  fixture((directory, git, check) => {
    const secret = randomUUID() + randomUUID();
    fs.writeFileSync(
      path.join(directory, ".env"),
      `PAYLOAD_SECRET=${secret}\n`,
    );
    fs.writeFileSync(
      path.join(directory, "application.ts"),
      `export const value = "${secret}";\n`,
    );
    git("add", "--", "application.ts");
    fs.writeFileSync(
      path.join(directory, "application.ts"),
      'export const value = "safe";\n',
    );
    const result = check();
    assert.equal(result.status, 1);
    assert.match(result.stderr?.toString() || "", /local environment secret/);
    assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false);
  });
});

test("secret guard rejects credentials retained only in branch history", () => {
  fixture((directory, git, check) => {
    const secret = randomUUID() + randomUUID();
    fs.writeFileSync(
      path.join(directory, ".env"),
      `PAYLOAD_SECRET=${secret}\n`,
    );
    fs.writeFileSync(
      path.join(directory, "application.ts"),
      `export const value = "${secret}";\n`,
    );
    git("add", "--", "application.ts");
    git("commit", "--quiet", "-m", "fixture credential");
    fs.writeFileSync(
      path.join(directory, "application.ts"),
      'export const value = "safe";\n',
    );
    git("add", "--", "application.ts");
    git("commit", "--quiet", "-m", "fixture cleanup");
    const result = check(true);
    assert.equal(result.status, 1);
    assert.match(result.stderr?.toString() || "", /local environment secret/);
    assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false);
  });
});

test("secret guard detects credential tokens without a matching local env value", () => {
  fixture((directory, git, check) => {
    const token = "ghp_" + "A".repeat(36);
    fs.writeFileSync(
      path.join(directory, "application.ts"),
      `export const token = "${token}";\n`,
    );
    git("add", "--", "application.ts");
    const result = check();
    assert.equal(result.status, 1);
    assert.match(result.stderr?.toString() || "", /credential or private key/);
    assert.equal(`${result.stdout}${result.stderr}`.includes(token), false);
  });
});
