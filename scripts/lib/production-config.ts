import { objectStorage } from "../../src/backend/infrastructure/storage/config";
import { hostedChatOrigin } from "../../src/backend/infrastructure/chat/config";

export function productionErrors(env: Record<string, string | undefined>) {
  const errors: string[] = [];
  const requireValue = (key: string) => {
    if (!env[key]?.trim()) errors.push(`${key} is required`);
  };
  for (const key of ["SERVER_URL", "DATABASE_URL", "PAYLOAD_SECRET"])
    requireValue(key);
  try {
    const origin = new URL(env.SERVER_URL || "");
    if (
      origin.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) ||
      origin.username ||
      origin.password ||
      origin.search ||
      origin.hash ||
      origin.pathname !== "/"
    )
      errors.push("SERVER_URL must be a public HTTPS origin");
  } catch {
    errors.push("SERVER_URL must be a valid HTTPS origin");
  }
  try {
    const db = new URL(env.DATABASE_URL || "");
    if (
      !["postgres:", "postgresql:"].includes(db.protocol) ||
      !db.password ||
      !["require", "verify-full"].includes(db.searchParams.get("sslmode") || "")
    )
      errors.push(
        "DATABASE_URL must use PostgreSQL with credentials and TLS (sslmode=require or verify-full)",
      );
  } catch {
    errors.push("DATABASE_URL must be a valid PostgreSQL URL");
  }
  if ((env.PAYLOAD_SECRET?.length || 0) < 48)
    errors.push(
      "PAYLOAD_SECRET must have at least 48 random characters in production",
    );
  try {
    if (!hostedChatOrigin(env)?.startsWith("https://"))
      errors.push(
        "CHAT_FRAME_ORIGIN must be a separate HTTPS origin for production chat.",
      );
  } catch (error) {
    errors.push((error as Error).message);
  }
  for (const key of ["TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"])
    requireValue(key);
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(env.TURNSTILE_SITE_KEY || ""))
    errors.push("TURNSTILE_SITE_KEY must be a valid Turnstile site key");
  if (env.TURNSTILE_SITE_KEY === "offline-test-site-key")
    errors.push("Offline test verification must not be used for deployment");
  if (
    [env.TURNSTILE_SITE_KEY, env.TURNSTILE_SECRET_KEY].some((value) =>
      /^[123]x0{10}/.test(value || ""),
    )
  )
    errors.push(
      "Use real Turnstile credentials instead of Cloudflare dummy keys",
    );
  try {
    if (!objectStorage(env))
      errors.push(
        "Object storage is required: configure S3_* for Supabase Storage and MEDIA_PUBLIC_URL.",
      );
  } catch (error) {
    errors.push((error as Error).message);
  }
  if (env.SMTP_HOST) {
    requireValue("SMTP_FROM");
    requireValue("LEAD_NOTIFICATION_EMAIL");
  }
  return errors;
}
