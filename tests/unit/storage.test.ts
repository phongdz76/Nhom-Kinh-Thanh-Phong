import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mediaURL,
  objectStorage,
} from "../../src/backend/infrastructure/storage/config";

export const supabaseStorage = {
  S3_ENDPOINT: "https://fixture.storage.supabase.co/storage/v1/s3",
  S3_REGION: "ap-southeast-1",
  S3_BUCKET: "website-media",
  S3_ACCESS_KEY_ID: "fixture-access",
  S3_SECRET_ACCESS_KEY: "fixture-secret",
  MEDIA_PUBLIC_URL:
    "https://fixture.supabase.co/storage/v1/object/public/website-media/",
};

test("Supabase keeps S3 credentials server-side and uses a public bucket URL for readers", () => {
  const storage = objectStorage(supabaseStorage)!;
  assert.equal(storage.region, "ap-southeast-1");
  assert.equal(storage.endpoint, supabaseStorage.S3_ENDPOINT);
  assert.equal(storage.bucket, "website-media");
  assert.equal(
    mediaURL(storage, "ảnh thử.webp"),
    "https://fixture.supabase.co/storage/v1/object/public/website-media/%E1%BA%A3nh%20th%E1%BB%AD.webp",
  );
  assert.equal(mediaURL(storage, "a.webp").includes("fixture-secret"), false);
});

test("local media remains available without cloud credentials; partial and mixed storage fail closed", () => {
  assert.equal(objectStorage({}), null);
  for (const key of Object.keys(supabaseStorage)) {
    assert.throws(
      () => objectStorage({ ...supabaseStorage, [key]: undefined }),
      /Missing/,
    );
  }
  assert.throws(
    () => objectStorage({ ...supabaseStorage, R2_BUCKET: "legacy" }),
    /not both/,
  );
  for (const value of [
    "http://example.test",
    "https://access:secret@example.test",
    "https://example.test/?secret=fixture",
    "https://example.test/#secret",
  ]) {
    assert.throws(
      () => objectStorage({ ...supabaseStorage, S3_ENDPOINT: value }),
      /HTTPS/,
    );
    assert.throws(
      () => objectStorage({ ...supabaseStorage, MEDIA_PUBLIC_URL: value }),
      /HTTPS/,
    );
  }
});

test("existing R2 deployments retain their endpoint, region and media URLs", () => {
  const storage = objectStorage({
    R2_ENDPOINT: "https://fixture.r2.cloudflarestorage.com",
    R2_BUCKET: "media",
    R2_ACCESS_KEY_ID: "fixture-access",
    R2_SECRET_ACCESS_KEY: "fixture-secret",
    MEDIA_PUBLIC_URL: "https://images.example.test",
  })!;
  assert.equal(storage.region, "auto");
  assert.equal(
    mediaURL(storage, "a.webp"),
    "https://images.example.test/a.webp",
  );
});
