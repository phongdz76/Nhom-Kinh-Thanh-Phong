import fs from "node:fs";
import { open, lstat } from "node:fs/promises";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const magic = Buffer.from("TPBK1");
export function backupKey(value: string | undefined) {
  if (!value || !/^[A-Za-z0-9+/]{43}=$/.test(value))
    throw new Error(
      "BACKUP_ENCRYPTION_KEY must be a random 32-byte base64 key.",
    );
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("Invalid backup encryption key.");
  return key;
}

export async function encryptBackup(
  source: AsyncIterable<Uint8Array>,
  filename: string,
  key: Buffer,
) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const hash = createHash("sha256");
  let size = 0;
  async function* chunks() {
    yield Buffer.concat([magic, iv]);
    for await (const chunk of source) {
      size += chunk.length;
      hash.update(chunk);
      yield cipher.update(chunk);
    }
    yield cipher.final();
    yield cipher.getAuthTag();
  }
  try {
    await pipeline(
      Readable.from(chunks()),
      fs.createWriteStream(filename, { flags: "wx", mode: 0o600 }),
    );
    return { size, sha256: hash.digest("hex") };
  } catch (error) {
    // The caller owns a newly-created private run directory; leave incomplete
    // output without a manifest so it can never be mistaken for a valid backup.
    throw error;
  }
}

export async function decryptedBackup(filename: string, key: Buffer) {
  const stat = await lstat(filename);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 33)
    throw new Error("Invalid encrypted backup file.");
  const handle = await open(filename, "r");
  const header = Buffer.alloc(17),
    tag = Buffer.alloc(16);
  try {
    await handle.read(header, 0, 17, 0);
    await handle.read(tag, 0, 16, stat.size - 16);
  } finally {
    await handle.close();
  }
  if (!header.subarray(0, 5).equals(magic))
    throw new Error("Unsupported backup format.");
  const decipher = createDecipheriv("aes-256-gcm", key, header.subarray(5));
  decipher.setAuthTag(tag);
  return {
    source:
      stat.size === 33
        ? Readable.from([])
        : fs.createReadStream(filename, { start: 17, end: stat.size - 17 }),
    decipher,
  };
}

export async function readBackup(
  filename: string,
  key: Buffer,
  maximum = 10 * 1024 * 1024,
) {
  const { source, decipher } = await decryptedBackup(filename, key);
  const chunks: Buffer[] = [];
  let size = 0;
  await pipeline(source, decipher, async (stream) => {
    for await (const chunk of stream) {
      size += chunk.length;
      if (size > maximum) throw new Error("Backup manifest is too large.");
      chunks.push(chunk);
    }
  });
  return Buffer.concat(chunks);
}

export async function verifyBackupFile(
  filename: string,
  key: Buffer,
  expected: { size: number; sha256: string },
) {
  const { source, decipher } = await decryptedBackup(filename, key);
  const hash = createHash("sha256");
  let size = 0;
  await pipeline(source, decipher, async (stream) => {
    for await (const chunk of stream) {
      size += chunk.length;
      hash.update(chunk);
    }
  });
  if (size !== expected.size || hash.digest("hex") !== expected.sha256)
    throw new Error("Backup checksum does not match.");
}
