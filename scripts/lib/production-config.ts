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
  for (const key of [
    "R2_ENDPOINT",
    "R2_BUCKET",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "MEDIA_PUBLIC_URL",
  ])
    requireValue(key);
  for (const key of ["R2_ENDPOINT", "MEDIA_PUBLIC_URL"]) {
    try {
      if (new URL(env[key] || "").protocol !== "https:") throw new Error();
    } catch {
      errors.push(`${key} must use HTTPS`);
    }
  }
  if (env.SMTP_HOST) {
    requireValue("SMTP_FROM");
    requireValue("LEAD_NOTIFICATION_EMAIL");
  }
  return errors;
}
