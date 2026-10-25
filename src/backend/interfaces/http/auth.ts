import { headers } from "next/headers";
import { auth } from "@/backend/composition/services";
export const COOKIE = "thanhphong-token";
export async function session(requestHeaders?: Headers) {
  return auth.session(requestHeaders ?? (await headers()));
}
export function requireUser(request: Request, ownerOnly = false) {
  return auth.requireUser(request.headers, ownerOnly);
}
export function logout(request: Request) {
  return auth.logout(request.headers);
}
