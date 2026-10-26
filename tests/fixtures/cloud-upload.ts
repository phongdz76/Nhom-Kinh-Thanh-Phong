import { expect } from "@playwright/test";
import { mock } from "node:test";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import sharp from "sharp";
import { S3 } from "@aws-sdk/client-s3";
import type { PutObjectCommandInput } from "@aws-sdk/client-s3";
import { getPayload } from "payload";

async function checkStorage() {
  const fixture = dotenv.parse(fs.readFileSync(".env.test.local"));
  const database = new URL(fixture.DATABASE_URL);
  if (
    database.pathname !== "/thanhphong_test" ||
    database.hostname !== "127.0.0.1"
  )
    throw new Error("Cloud storage tests require the dedicated test database.");
  const cloud = {
    ...fixture,
    S3_ENDPOINT: "https://fixture.storage.supabase.co/storage/v1/s3",
    S3_REGION: "ap-southeast-1",
    S3_BUCKET: "storage-integration-fixture",
    S3_ACCESS_KEY_ID: "fixture-access",
    S3_SECRET_ACCESS_KEY: "fixture-secret",
    MEDIA_PUBLIC_URL:
      "https://fixture.supabase.co/storage/v1/object/public/storage-integration-fixture",
  };
  const previous = Object.fromEntries(
    Object.keys(cloud).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, cloud);
  const writes: PutObjectCommandInput[] = [];
  const regions: string[] = [];
  // Intercept the S3 transport; credentials and images never leave this process.
  const upload = mock.method(
    S3.prototype,
    "putObject",
    async function (this: S3, input: PutObjectCommandInput) {
      regions.push(await this.config.region());
      const endpoint = await this.config.endpoint?.();
      expect(endpoint?.hostname).toBe("fixture.storage.supabase.co");
      expect(endpoint?.path).toBe("/storage/v1/s3");
      writes.push(input);
      return { $metadata: {}, ETag: "fixture" };
    },
  );
  const remove = mock.method(S3.prototype, "deleteObject", async () => ({
    $metadata: {},
  }));
  let payload: Awaited<ReturnType<typeof getPayload>> | undefined;
  let id: string | undefined;
  try {
    const { default: config } =
      await import("../../src/backend/infrastructure/payload/config/payload.config");
    payload = await getPayload({ config });
    const owner = (
      await payload.find({
        collection: "users",
        where: { email: { equals: fixture.OWNER_EMAIL } },
        limit: 1,
      })
    ).docs[0];
    expect(owner).toBeTruthy();
    const data = await sharp({
      create: { width: 2, height: 2, channels: 3, background: "#ffffff" },
    })
      .webp()
      .toBuffer();
    const filename = `${randomUUID()}.webp`;
    const media = await payload.create({
      collection: "media",
      user: { ...owner, collection: "users" },
      overrideAccess: false,
      data: { alt: "Cloud integration fixture" },
      file: { name: filename, data, size: data.length, mimetype: "image/webp" },
    });
    id = String(media.id);
    expect(writes).toHaveLength(1);
    expect(regions).toEqual([cloud.S3_REGION]);
    expect(writes[0].Bucket).toBe(cloud.S3_BUCKET);
    expect(writes[0].Key).toBe(filename);
    expect(writes[0].ContentType).toBe("image/webp");
    expect(writes[0].ACL).toBeUndefined();
    expect(String(media.url)).toBe(`${cloud.MEDIA_PUBLIC_URL}/${filename}`);
    expect(
      (await config).collections.find(
        (collection) => collection.slug === "media",
      )?.upload,
    ).toMatchObject({ disableLocalStorage: true });
  } finally {
    if (payload && id)
      await payload.delete({ collection: "media", id, overrideAccess: true });
    await payload?.destroy();
    upload.mock.restore();
    remove.mock.restore();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

await checkStorage();
process.exit(0);
