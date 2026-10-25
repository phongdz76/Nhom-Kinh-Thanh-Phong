import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import {
  ApiError,
  requestBlob,
  requestJSON,
} from "../../src/frontend/infrastructure/http/client";
import { API_PATHS } from "../../src/frontend/infrastructure/http/api-paths";

afterEach(() => mock.restoreAll());
test("uploads preserve multipart boundaries and idempotency headers", async () => {
  const body = new FormData();
  body.append("file", new Blob(["image"]), "image.webp");
  const fetch = mock.method(
    globalThis,
    "fetch",
    async (_url: string | URL | Request, options?: RequestInit) => {
      assert.equal(options?.body, body);
      assert.equal(options.credentials, "same-origin");
      const headers = new Headers(options.headers);
      assert.equal(headers.has("content-type"), false);
      assert.equal(headers.get("Idempotency-Key"), "submission-key");
      return Response.json({ id: "media" });
    },
  );
  assert.deepEqual(
    await requestJSON(API_PATHS.admin.media, {
      method: "POST",
      body,
      headers: { "Idempotency-Key": "submission-key" },
    }),
    { id: "media" },
  );
  assert.equal(fetch.mock.callCount(), 1);
});
test("JSON and export requests preserve server errors and HTTP status", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Phiên đã hết hạn" }, { status: 401 }),
  );
  for (const request of [
    () => requestJSON(API_PATHS.admin.state),
    () => requestBlob(API_PATHS.admin.estimateExport("id", "xlsx")),
  ]) {
    await assert.rejects(
      request,
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 401 &&
        error.message === "Phiên đã hết hạn",
    );
  }
});
test("proxy HTML errors still produce a usable error with status", async () => {
  mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>Unavailable</html>", { status: 503 }),
  );
  await assert.rejects(
    () => requestJSON(API_PATHS.public.site),
    (error: unknown) =>
      error instanceof ApiError &&
      error.status === 503 &&
      error.message.length > 0,
  );
});
test("dynamic API identifiers cannot escape a URL segment", () => {
  assert.equal(
    API_PATHS.admin.product("id/other?x=1"),
    "/api/admin/products/id%2Fother%3Fx%3D1",
  );
});
