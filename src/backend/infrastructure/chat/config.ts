type Environment = Record<string, string | undefined>;
const loopback = (url: URL) =>
  ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

export function hostedChatOrigin(env: Environment): string | null {
  if (!env.CHAT_FRAME_ORIGIN?.trim()) return null;
  let origin: URL;
  let parent: URL;
  try {
    origin = new URL(env.CHAT_FRAME_ORIGIN.trim());
    parent = new URL(env.SERVER_URL || "");
  } catch {
    throw new Error("CHAT_FRAME_ORIGIN and SERVER_URL must be valid origins.");
  }
  if (
    origin.origin === parent.origin ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== "/" ||
    (origin.protocol !== "https:" &&
      !(
        origin.protocol === "http:" &&
        parent.protocol === "http:" &&
        loopback(origin) &&
        loopback(parent)
      ))
  )
    throw new Error(
      "CHAT_FRAME_ORIGIN must be a separate HTTPS origin (HTTP is only allowed between loopback test servers).",
    );
  return origin.origin;
}
