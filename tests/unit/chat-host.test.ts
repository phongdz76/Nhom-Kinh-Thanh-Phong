import assert from "node:assert/strict";
import { test } from "node:test";
import { hostedChatOrigin } from "../../src/backend/infrastructure/chat/config";
import { tawkChatGateway } from "../../src/frontend/infrastructure/chat/tawk";

test("hosted chat requires a separate origin and strips no untrusted URL components", () => {
  const env = {
    SERVER_URL: "https://website.example.test",
    CHAT_FRAME_ORIGIN: "https://chat.example.test",
  };
  assert.equal(hostedChatOrigin(env), "https://chat.example.test");
  for (const value of [
    env.SERVER_URL,
    "https://chat.example.test/path",
    "https://chat.example.test/?parent=https://evil.test",
    "https://user:secret@chat.example.test",
    "http://chat.example.test",
    "javascript:alert(1)",
  ])
    assert.throws(() => hostedChatOrigin({ ...env, CHAT_FRAME_ORIGIN: value }));
  assert.equal(hostedChatOrigin({}), null);
  assert.equal(
    hostedChatOrigin({
      SERVER_URL: "http://127.0.0.1:3010",
      CHAT_FRAME_ORIGIN: "http://127.0.0.1:3011",
    }),
    "http://127.0.0.1:3011",
  );
});

test("production chat sends only the public widget identity to the static origin", () => {
  const link = "https://tawk.to/chat/0123456789abcdef01234567/1testwidget";
  const url = new URL(
    tawkChatGateway.embed(link, "https://chat.example.test").url,
  );
  assert.equal(url.origin, "https://chat.example.test");
  assert.equal(url.searchParams.get("link"), link);
  assert.deepEqual([...url.searchParams.keys()], ["link"]);
});
