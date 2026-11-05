import path from "node:path";
import { z } from "zod";
import { readBackup, verifyBackupFile } from "./backup-crypto";

const checksum = z
  .object({
    size: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export const backupManifest = z
  .object({
    version: z.literal(1),
    createdAt: z.iso.datetime(),
    database: checksum.extend({ file: z.literal("database.pgdump.enc") }),
    media: z
      .array(
        checksum.extend({
          file: z.string().regex(/^[a-f0-9]{64}\.media\.enc$/),
          key: z.string().min(1).max(1024),
        }),
      )
      .max(10000),
  })
  .strict();

export async function verifyBackup(directory: string, key: Buffer) {
  const manifest = backupManifest.parse(
    JSON.parse(
      (await readBackup(path.join(directory, "manifest.enc"), key)).toString(
        "utf8",
      ),
    ),
  );
  const files = [manifest.database, ...manifest.media];
  if (
    new Set(files.map((file) => file.file)).size !== files.length ||
    new Set(manifest.media.map((file) => file.key)).size !==
      manifest.media.length
  )
    throw new Error("Duplicate backup manifest entries.");
  for (const file of files)
    await verifyBackupFile(path.join(directory, file.file), key, file);
  return manifest;
}
