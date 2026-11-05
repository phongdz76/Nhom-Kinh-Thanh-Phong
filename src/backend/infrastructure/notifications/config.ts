type Environment = Record<string, string | undefined>;
export function notificationConfig(env: Environment) {
  const configured = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_FROM",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "LEAD_NOTIFICATION_EMAIL",
  ].some((key) => env[key]?.trim());
  if (!configured) return null;
  for (const key of ["SMTP_HOST", "SMTP_FROM", "LEAD_NOTIFICATION_EMAIL"]) {
    if (!env[key]?.trim() || /[\r\n]/.test(env[key]!))
      throw new Error(`${key} is required and must be a single line.`);
  }
  for (const key of ["SMTP_FROM", "LEAD_NOTIFICATION_EMAIL"]) {
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(env[key]!))
      throw new Error(`${key} must be an email address.`);
  }
  const port = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("SMTP_PORT must be between 1 and 65535.");
  if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD))
    throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together.");
  return {
    host: env.SMTP_HOST!,
    port,
    from: env.SMTP_FROM!,
    recipient: env.LEAD_NOTIFICATION_EMAIL!,
    secure: port === 465,
    requireTLS: !["127.0.0.1", "localhost", "::1"].includes(env.SMTP_HOST!),
  };
}
