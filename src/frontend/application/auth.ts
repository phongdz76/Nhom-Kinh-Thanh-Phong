import { loginSchema } from "@/domain/schemas";
import type { AuthGateway } from "./ports";
export function createAuthService(gateway: AuthGateway) {
  return {
    login: (input: Parameters<AuthGateway["login"]>[0]) =>
      gateway.login(loginSchema.parse(input)),
    changePassword: (input: Parameters<AuthGateway["changePassword"]>[0]) =>
      gateway.changePassword(input),
  };
}
