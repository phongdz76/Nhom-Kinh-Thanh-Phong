import "server-only";
import type { FormProtection } from "@/domain/form-protection";
import { requireVerifiedForm } from "@/backend/application/form-protection";
import { ApplicationError } from "@/backend/application/errors";

const runtime = globalThis as typeof globalThis & {
  formVerificationActive?: number;
};

function configuration() {
  const siteKey = process.env.TURNSTILE_SITE_KEY?.trim() || "";
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim() || "";
  const required =
    process.env.NODE_ENV === "production" || !!siteKey || !!secret;
  let hostname = "";
  try {
    hostname = new URL(process.env.SERVER_URL || "").hostname;
  } catch {
    // Missing origin cannot silently weaken hostname verification.
  }
  const ready =
    !required ||
    (!!hostname && /^[A-Za-z0-9_-]{10,100}$/.test(siteKey) && !!secret);
  return { required, ready, siteKey, secret, hostname };
}

export function formProtection(): FormProtection {
  const config = configuration();
  return {
    required: config.required,
    ready: config.ready,
    siteKey: config.required && config.ready ? config.siteKey : null,
  };
}

export async function verifyFormSubmission(token: string | undefined) {
  const config = configuration();
  if (!config.required) return;
  if (!config.ready)
    throw new ApplicationError(
      "unavailable",
      "Hiện chưa thể xác minh yêu cầu. Vui lòng liên hệ qua điện thoại.",
    );
  if (!token || token.length > 2048)
    throw new ApplicationError(
      "forbidden",
      "Vui lòng hoàn tất xác minh trước khi gửi yêu cầu.",
    );
  if ((runtime.formVerificationActive || 0) >= 8)
    throw new ApplicationError(
      "unavailable",
      "Đang có nhiều yêu cầu xác minh. Vui lòng thử lại sau.",
      5,
    );
  runtime.formVerificationActive = (runtime.formVerificationActive || 0) + 1;
  let reply: unknown;
  try {
    try {
      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: config.secret, response: token }),
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!response.ok) throw new Error("Verification unavailable");
      reply = await response.json();
    } catch {
      // Never log tokens, secrets, response bodies or customer details.
      throw new ApplicationError(
        "unavailable",
        "Chưa kết nối được dịch vụ xác minh. Vui lòng thử lại sau.",
      );
    }
    requireVerifiedForm(reply, config.hostname);
  } finally {
    runtime.formVerificationActive = (runtime.formVerificationActive || 1) - 1;
  }
}
