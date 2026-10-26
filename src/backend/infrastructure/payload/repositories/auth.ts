import { payloadActor } from "../actor";
import "server-only";
import { createLocalReq, logoutOperation } from "payload";
import { cms } from "../client";
import { userDTO } from "../mappers";
import { ApplicationError } from "@/backend/application/errors";
import type { AuthRepository } from "@/backend/application/ports";
import { withAccountLock } from "@/backend/infrastructure/security/account-lock";
export const authRepository: AuthRepository = {
  async session(headers) {
    const { user } = await (await cms()).auth({ headers });
    return user?.isActive ? userDTO(user) : null;
  },
  async login(email, password) {
    return withAccountLock(email, async () => {
      let result;
      try {
        result = await (
          await cms()
        ).login({ collection: "users", data: { email, password } });
      } catch {
        throw new ApplicationError(
          "unauthenticated",
          "Email hoặc mật khẩu không đúng, hoặc tài khoản đang tạm khóa.",
        );
      }
      if (
        !result.token ||
        !result.user?.isActive ||
        !["owner", "editor"].includes(result.user.role)
      )
        throw new ApplicationError(
          "unauthenticated",
          "Tài khoản không có quyền truy cập.",
        );
      return { token: result.token, user: userDTO(result.user) };
    });
  },
  async changePassword(user, currentPassword, newPassword) {
    return withAccountLock(user.email, async () => {
      const payload = await cms();
      try {
        await payload.login({
          collection: "users",
          data: { email: user.email, password: currentPassword },
        });
      } catch {
        throw new ApplicationError(
          "unauthenticated",
          "Mật khẩu hiện tại không đúng.",
        );
      }
      await payload.update({
        collection: "users",
        id: user.id,
        data: { password: newPassword },
        overrideAccess: true,
      });
      const req = await createLocalReq({ user: payloadActor(user) }, payload);
      await logoutOperation({
        collection: payload.collections.users,
        allSessions: true,
        req,
      });
    });
  },
  async logout(headers, user) {
    if (!user) return;
    return withAccountLock(user.email, async () => {
      const payload = await cms();
      // Payload needs the private _sid claim to revoke only this session. Keep
      // that transport-specific identity inside the adapter, outside the User DTO.
      const { user: sessionUser } = await payload.auth({ headers });
      if (!sessionUser?.isActive || String(sessionUser.id) !== user.id) return;
      const req = await createLocalReq({ user: sessionUser }, payload);
      req.headers = headers;
      await logoutOperation({ collection: payload.collections.users, req });
    });
  },
};
