import assert from "node:assert/strict";
import { test } from "node:test";
import { createRouter } from "../../src/backend/interfaces/http/routing";

test("literal routes take precedence over dynamic IDs regardless of declaration order", async () => {
  const router = createRouter([
    {
      path: "estimates/:id",
      methods: {
        GET: async (_request, context) => Response.json(await context.params),
      },
    },
    {
      path: "estimates/example",
      methods: { GET: async () => Response.json({ example: true }) },
    },
  ]);
  assert.deepEqual(
    await (
      await router(new Request("http://localhost/api/estimates/example"), [
        "estimates",
        "example",
      ])
    ).json(),
    { example: true },
  );
  assert.deepEqual(
    await (
      await router(new Request("http://localhost/api/estimates/a"), [
        "estimates",
        "a",
      ])
    ).json(),
    { id: "a" },
  );
});
test("OPTIONS and invalid methods expose only methods allowed for that endpoint", async () => {
  const router = createRouter([
    {
      path: "auth/login",
      methods: { POST: async () => Response.json({ ok: true }) },
    },
  ]);
  for (const [method, status] of [
    ["OPTIONS", 204],
    ["GET", 405],
    ["DELETE", 405],
  ] as const) {
    const response = await router(
      new Request("http://localhost/api/auth/login", { method }),
      ["auth", "login"],
    );
    assert.equal(response.status, status);
    assert.equal(response.headers.get("Allow"), "POST, OPTIONS");
  }
});
test("HEAD retains authentication status and headers while omitting the body", async () => {
  const router = createRouter([
    {
      path: "admin/state",
      methods: {
        GET: async () =>
          Response.json(
            { error: "Login required" },
            { status: 401, headers: { "Cache-Control": "no-store" } },
          ),
      },
    },
  ]);
  const response = await router(
    new Request("http://localhost/api/admin/state", { method: "HEAD" }),
    ["admin", "state"],
  );
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(await response.text(), "");
});
test("dispatch preserves request bodies, cookies, and already decoded dynamic segments", async () => {
  const request = new Request("http://localhost/api/items/a%2Fb", {
    method: "POST",
    headers: { Cookie: "session=test", "Content-Type": "application/json" },
    body: JSON.stringify({ value: 1 }),
  });
  const router = createRouter([
    {
      path: "items/:id",
      methods: {
        POST: async (received, context) => {
          assert.equal(received, request);
          assert.equal(received.headers.get("Cookie"), "session=test");
          return Response.json(
            { ...(await context.params), ...(await received.json()) },
            { status: 201 },
          );
        },
      },
    },
  ]);
  const response = await router(request, ["items", "a/b"]);
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id: "a/b", value: 1 });
  assert.equal(
    (await router(new Request("http://localhost/api/unknown"), ["unknown"]))
      .status,
    404,
  );
});
