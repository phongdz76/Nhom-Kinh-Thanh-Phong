import { z } from "zod";
import { CONSULTATION_ACTION } from "@/domain/form-protection";
import { ApplicationError } from "./errors";

const verification = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
});

export function requireVerifiedForm(reply: unknown, hostname: string) {
  const result = verification.safeParse(reply);
  if (
    !result.success ||
    !result.data.success ||
    result.data.hostname !== hostname ||
    result.data.action !== CONSULTATION_ACTION
  )
    throw new ApplicationError(
      "forbidden",
      "Xác minh chưa hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
    );
}
