import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { randomBytes } from "node:crypto";
import {
  backupKey,
  encryptBackup,
  readBackup,
  verifyBackupFile,
} from "../../scripts/lib/backup-crypto";
import { backupManifest } from "../../scripts/lib/backup-manifest";
import { localDatabaseAddress } from "../../scripts/lib/native-postgres";

test("backup encrypts plaintext, authenticates data and rejects corruption and the wrong key", async () => {
  const root = path.resolve("tmp/backup-unit");
  await fs.mkdir(root, { recursive: true });
  const directory = await fs.mkdtemp(path.join(root, "run-"));
  const filename = path.join(directory, "database.enc");
  const key = backupKey(randomBytes(32).toString("base64"));
  const plaintext = Buffer.from("dummy-customer-content\n".repeat(100));
  const digest = await encryptBackup(Readable.from([plaintext]), filename, key);
  const encrypted = await fs.readFile(filename);
  try {
    assert.ok(!encrypted.includes(plaintext));
    assert.deepEqual(await readBackup(filename, key), plaintext);
    await verifyBackupFile(filename, key, digest);
    await assert.rejects(readBackup(filename, randomBytes(32)));
    await assert.rejects(
      verifyBackupFile(filename, key, { ...digest, size: digest.size + 1 }),
    );
    encrypted[20] ^= 1;
    await fs.writeFile(filename, encrypted);
    await assert.rejects(readBackup(filename, key));
    assert.throws(() => backupKey("short"));
  } finally {
    await fs.unlink(filename);
    await fs.rmdir(directory);
  }
});

test("empty media objects still have an authenticated backup", async () => {
  const root = path.resolve("tmp/backup-unit");
  await fs.mkdir(root, { recursive: true });
  const directory = await fs.mkdtemp(path.join(root, "empty-"));
  const filename = path.join(directory, "empty.enc");
  const key = randomBytes(32);
  try {
    const checksum = await encryptBackup(Readable.from([]), filename, key);
    assert.equal((await readBackup(filename, key)).length, 0);
    await verifyBackupFile(filename, key, checksum);
  } finally {
    await fs.unlink(filename);
    await fs.rmdir(directory);
  }
});

test("restore validation rejects remote databases and manifest file traversal", () => {
  assert.throws(() =>
    localDatabaseAddress(
      "postgresql://fixture:fixture@production.test:55432/catalog",
    ),
  );
  assert.throws(() =>
    localDatabaseAddress("postgresql://fixture:fixture@localhost:5432/catalog"),
  );
  const manifest = {
    version: 1,
    createdAt: new Date().toISOString(),
    database: { file: "../../secret", size: 1, sha256: "a".repeat(64) },
    media: [],
  };
  assert.equal(backupManifest.safeParse(manifest).success, false);
});
