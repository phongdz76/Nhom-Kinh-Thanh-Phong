import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import dotenv from "dotenv";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { objectStorage } from "../src/backend/infrastructure/storage/config";
import { backupKey, encryptBackup } from "./lib/backup-crypto";
import { verifyBackup } from "./lib/backup-manifest";
import { postgresCommand } from "./lib/postgres-command";

dotenv.config({
  path: [".env.backup.local", process.env.ENV_FILE || ".env.local", ".env"],
  quiet: true,
});
try {
  const key = backupKey(process.env.BACKUP_ENCRYPTION_KEY);
  if (process.argv[2] === "verify") {
    if (!process.argv[3])
      throw new Error("Specify the backup directory to verify.");
    const manifest = await verifyBackup(path.resolve(process.argv[3]), key);
    console.log(
      `Backup authentication and checksums passed: database and ${manifest.media.length} media objects.`,
    );
  } else {
    const storage = objectStorage(process.env);
    if (!storage)
      throw new Error(
        "Configure source object storage before creating a database + media backup.",
      );
    const destinationBucket = process.env.BACKUP_S3_BUCKET;
    if (
      destinationBucket &&
      (!process.env.BACKUP_S3_ENDPOINT?.startsWith("https://") ||
        !process.env.BACKUP_S3_ACCESS_KEY_ID ||
        !process.env.BACKUP_S3_SECRET_ACCESS_KEY ||
        !process.env.BACKUP_S3_REGION)
    )
      throw new Error(
        "Complete the independent BACKUP_S3_* configuration first.",
      );
    if (
      destinationBucket === storage.bucket &&
      process.env.BACKUP_S3_ENDPOINT === storage.endpoint
    )
      throw new Error(
        "Backups must use a separate private bucket, not the public website media bucket.",
      );
    const directory = path.resolve(
      "var/backups",
      `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`,
    );
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    console.log("Creating encrypted database snapshot...");
    const dump = postgresCommand(
      "pg_dump",
      process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL || "",
      ["--format=custom", "--no-owner", "--no-privileges"],
    );
    dump.child.stdin.end();
    let database;
    try {
      database = await encryptBackup(
        dump.child.stdout,
        path.join(directory, "database.pgdump.enc"),
        key,
      );
      await dump.complete;
    } catch (error) {
      dump.child.kill();
      throw error;
    }
    const source = new S3Client({
      endpoint: storage.endpoint,
      region: storage.region,
      forcePathStyle: true,
      maxAttempts: 3,
      credentials: {
        accessKeyId: storage.accessKeyId,
        secretAccessKey: storage.secretAccessKey,
      },
    });
    const manifest = {
      version: 1,
      createdAt: new Date().toISOString(),
      database: { file: "database.pgdump.enc", ...database },
      media: [] as {
        file: string;
        key: string;
        size: number;
        sha256: string;
      }[],
    };
    try {
      let continuation: string | undefined;
      do {
        const listing = await source.send(
          new ListObjectsV2Command({
            Bucket: storage.bucket,
            ContinuationToken: continuation,
          }),
        );
        for (const object of listing.Contents || []) {
          if (!object.Key) continue;
          if (manifest.media.length >= 10000)
            throw new Error("Backup has exceeded 10000 media objects.");
          const file = `${createHash("sha256").update(object.Key).digest("hex")}.media.enc`;
          const downloaded = await source.send(
            new GetObjectCommand({ Bucket: storage.bucket, Key: object.Key }),
          );
          if (!downloaded.Body)
            throw new Error(
              "An object could not be read. Backup remains incomplete.",
            );
          const content = await encryptBackup(
            downloaded.Body as AsyncIterable<Uint8Array>,
            path.join(directory, file),
            key,
          );
          manifest.media.push({ key: object.Key, file, ...content });
        }
        continuation = listing.IsTruncated
          ? listing.NextContinuationToken
          : undefined;
        if (listing.IsTruncated && !continuation)
          throw new Error("Incomplete storage listing.");
      } while (continuation);
    } finally {
      source.destroy();
    }
    await encryptBackup(
      Readable.from([Buffer.from(JSON.stringify(manifest))]),
      path.join(directory, "manifest.enc"),
      key,
    );
    await verifyBackup(directory, key);
    if (destinationBucket) {
      const remote = new S3Client({
        endpoint: process.env.BACKUP_S3_ENDPOINT,
        region: process.env.BACKUP_S3_REGION,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.BACKUP_S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.BACKUP_S3_SECRET_ACCESS_KEY!,
        },
      });
      try {
        // Upload the manifest last: its presence marks a complete encrypted set.
        const files = fs
          .readdirSync(directory)
          .filter((file) => file !== "manifest.enc")
          .concat("manifest.enc");
        for (const file of files)
          await remote.send(
            new PutObjectCommand({
              Bucket: destinationBucket,
              Key: `${path.basename(directory)}/${file}`,
              Body: fs.createReadStream(path.join(directory, file)),
              ContentType: "application/octet-stream",
            }),
          );
      } finally {
        remote.destroy();
      }
      console.log("Encrypted backup copied to the independent backup bucket.");
    }
    console.log(
      `Verified backup saved at ${path.relative(process.cwd(), directory)}. Keep the encryption key separately.`,
    );
  }
} catch {
  // Do not print SDK/CLI error objects: they may contain provider credentials.
  console.error(
    "Backup failed. Verify configuration, encryption key, PostgreSQL client/Docker and storage access. No complete backup is claimed.",
  );
  process.exitCode = 1;
}
