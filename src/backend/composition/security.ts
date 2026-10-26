import "server-only";
import { createRequestGuard } from "@/backend/application/request-security";
import { ApplicationError } from "@/backend/application/errors";
import { trustedClientIP } from "@/backend/infrastructure/security/client-ip";
import { rateLimit } from "@/backend/infrastructure/security/rate-limit";

const guard = createRequestGuard({ check: rateLimit });
export async function guardRequest(request: Request) {
  const netlify = process.env.NETLIFY === "true";
  const client = trustedClientIP(request.headers, netlify);
  if (netlify && !client)
    throw new ApplicationError(
      "unavailable",
      "Không xác minh được kết nối. Vui lòng thử lại sau.",
    );
  await guard(new URL(request.url).pathname, request.method, client);
}
