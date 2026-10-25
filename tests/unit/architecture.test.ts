import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const root = process.cwd();
function checkFixture(files: Record<string, string>) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "thanhphong-architecture-"),
  );
  try {
    for (const [name, content] of Object.entries(files)) {
      const target = path.join(directory, "src", name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    return spawnSync(
      process.execPath,
      [
        path.join(root, "node_modules/tsx/dist/cli.mjs"),
        path.join(root, "scripts/check-architecture.ts"),
      ],
      { cwd: directory, encoding: "utf8" },
    );
  } finally {
    const resolved = path.resolve(directory);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("thanhphong-architecture-"));
    fs.rmSync(resolved, { recursive: true });
  }
}

test("architecture allows adapters to implement ports and composition to wire them", () => {
  const result = checkFixture({
    "domain/model.ts": "export type Model = { id: string };",
    "backend/application/port.ts":
      'import type { Model } from "@/domain/model"; export type Repository = { get(): Model };',
    "backend/infrastructure/repository.ts":
      'import type { Repository } from "../application/port"; export const repository: Repository = { get: () => ({ id: "id" }) };',
    "backend/composition/services.ts":
      'export { repository } from "../infrastructure/repository";',
    "backend/interfaces/http/controller.ts":
      'import { repository } from "@/backend/composition/services"; export const GET = () => Response.json(repository.get());',
    "app/api/[...path]/route.ts":
      'export { GET } from "@/backend/interfaces/http/controller";',
  });
  assert.equal(result.status, 0, result.stderr);
});
test("architecture rejects framework dependencies in domain and HTTP in views", () => {
  const result = checkFixture({
    "domain/model.ts":
      'import { useState } from "react"; export const state = useState;',
    "frontend/presentation/Bad.ts":
      'export const load = () => fetch("/api/public/site");',
    "backend/application/Bad.ts":
      'import { database } from "../infrastructure/database";',
    "backend/infrastructure/database.ts": "export const database = {};",
    "frontend/presentation/Legacy.jsx":
      "export default function Legacy() { return null; }",
    "app/page.tsx":
      "export default function Page() { return <main>View</main>; }",
    "app/api/redundant/route.ts": "export const runtime = 'nodejs';",
  });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /Core layers cannot depend on react/);
  assert.match(result.stderr, /inject a port instead/);
  assert.match(result.stderr, /Move HTTP requests/);
  assert.match(result.stderr, /Keep API paths/);
  assert.match(result.stderr, /must use .ts or .tsx/);
  assert.match(result.stderr, /App files must only declare or re-export/);
  assert.match(result.stderr, /keep one catch-all entry/);
});
