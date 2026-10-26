import { isIP } from "node:net";

export function trustedClientIP(headers: Headers, netlify: boolean) {
  if (!netlify) return null;
  // Netlify's ingress supplies this header. X-Forwarded-For and CF-Connecting-IP
  // can be supplied by callers and are deliberately never used as fallbacks.
  const value = headers.get("x-nf-client-connection-ip")?.trim();
  if (!value || !isIP(value)) return null;
  if (value.toLowerCase().startsWith("::ffff:") && isIP(value.slice(7)) === 4)
    return value.slice(7);
  return isIP(value) === 6
    ? new URL(`http://[${value}]/`).hostname.slice(1, -1)
    : value;
}
