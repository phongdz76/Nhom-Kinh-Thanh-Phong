import { auth } from "@/backend/composition/services";
import {
  COOKIE,
  logout,
  requireUser,
  session,
} from "@/backend/interfaces/http/auth";
import {
  endpoint,
  json,
  readJSON,
  sameOrigin,
} from "@/backend/interfaces/http/response";

export const login = endpoint(async (request) => {
  sameOrigin(request);
  const result = await auth.login(await readJSON(request));
  const response = json({ user: result.user });
  response.cookies.set(COOKIE, result.token, {
    httpOnly: true,
    secure:
      process.env.SERVER_URL?.startsWith("https://") ||
      new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 28800,
  });
  return response;
});

export const logoutSession = endpoint(async (request) => {
  sameOrigin(request);
  await logout(request);
  const response = json({ ok: true });
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
});

export const changePassword = endpoint(async (request) => {
  sameOrigin(request);
  const user = await requireUser(request);
  await auth.changePassword(await readJSON(request), user);
  const response = json({ ok: true });
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
});

export const getSession = endpoint(async (request) => {
  const user = await session(request.headers);
  return json({ user });
});
