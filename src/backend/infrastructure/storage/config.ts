type Environment = Record<string, string | undefined>;

export type ObjectStorage = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicURL: string;
};

// Supabase uses its S3 endpoint and project region. The public URL is the
// bucket's /storage/v1/object/public/<bucket> URL, not the S3 endpoint.
// Keep legacy R2 installations working while new deployments use S3_*.
export function objectStorage(env: Environment): ObjectStorage | null {
  const generic = [
    "S3_ENDPOINT",
    "S3_REGION",
    "S3_BUCKET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
  ];
  const legacy = [
    "R2_ENDPOINT",
    "R2_BUCKET",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
  ];
  const hasGeneric = generic.some((key) => env[key]?.trim());
  const hasLegacy = legacy.some((key) => env[key]?.trim());
  if (hasGeneric && hasLegacy)
    throw new Error("Choose S3_* or legacy R2_* storage variables, not both.");
  if (!hasGeneric && !hasLegacy && !env.MEDIA_PUBLIC_URL?.trim()) return null;
  const keys = [...(hasGeneric ? generic : legacy), "MEDIA_PUBLIC_URL"];
  const missing = keys.filter((key) => !env[key]?.trim());
  if (missing.length)
    throw new Error(
      `Missing object storage configuration: ${missing.join(", ")}`,
    );
  for (const key of [keys[0], "MEDIA_PUBLIC_URL"]) {
    let valid = false;
    try {
      const url = new URL(env[key]!);
      valid =
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash;
    } catch {
      // Report only variable names, never credentials or URL values.
    }
    if (!valid)
      throw new Error(
        `${key} must be an HTTPS URL without credentials, query or fragment.`,
      );
  }
  return {
    endpoint: env[hasGeneric ? "S3_ENDPOINT" : "R2_ENDPOINT"]!.trim(),
    region: hasGeneric ? env.S3_REGION!.trim() : "auto",
    bucket: env[hasGeneric ? "S3_BUCKET" : "R2_BUCKET"]!.trim(),
    accessKeyId:
      env[hasGeneric ? "S3_ACCESS_KEY_ID" : "R2_ACCESS_KEY_ID"]!.trim(),
    secretAccessKey:
      env[hasGeneric ? "S3_SECRET_ACCESS_KEY" : "R2_SECRET_ACCESS_KEY"]!.trim(),
    publicURL: env.MEDIA_PUBLIC_URL!.trim().replace(/\/$/, ""),
  };
}

export function mediaURL(storage: ObjectStorage, filename: string) {
  return `${storage.publicURL}/${encodeURIComponent(filename)}`;
}
