import { z } from "zod";
import { loginSchema } from "@/domain/schemas";
import type { User } from "@/domain/models";
import type { AuthRepository, RateLimiter } from "./ports";
import { ApplicationError } from "./errors";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z
      .string()
      .min(12, "Mật khẩu mới cần ít nhất 12 ký tự.")
      .max(200),
  })
  .strict();
export function createAuthService(
  repository: AuthRepository,
  limiter: RateLimiter,
) {
  return {
    session: (headers: Headers) => repository.session(headers),
    async requireUser(headers: Headers, ownerOnly = false) {
      const user = await repository.session(headers);
      if (!user)
        throw new ApplicationError(
          "unauthenticated",
          "Vui lòng đăng nhập để tiếp tục.",
        );
      if (
        !["owner", "editor"].includes(user.role) ||
        (ownerOnly && user.role !== "owner")
      )
        throw new ApplicationError(
          "forbidden",
          "Bạn không có quyền thực hiện thao tác này.",
        );
      return user;
    },
    async login(input: unknown) {
      const values = loginSchema.parse(input);
      await limiter.check("login-global", "all", 60, 60);
      await limiter.check("login-email", values.email.toLowerCase(), 10, 900);
      return repository.login(values.email.toLowerCase(), values.password);
    },
    async changePassword(input: unknown, user: User) {
      const values = passwordSchema.parse(input);
      await limiter.check("change-password", user.id, 5, 900);
      await repository.changePassword(
        user,
        values.currentPassword,
        values.newPassword,
      );
    },
    async logout(headers: Headers) {
      await repository.logout(headers, await repository.session(headers));
    },
  };
}
