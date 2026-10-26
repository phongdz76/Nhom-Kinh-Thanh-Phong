import assert from "node:assert/strict";
import { test } from "node:test";
import { boundedBody, HttpError } from "../../src/backend/interfaces/http/body";

function request(body: ReadableStream<Uint8Array>, signal?: AbortSignal) {
  return new Request("https://example.test/form", {
    method: "POST",
    body,
    signal,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

test("actual streamed bytes are capped even without Content-Length", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(6));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    boundedBody(request(body), 5),
    (error: unknown) => error instanceof HttpError && error.status === 413,
  );
  assert.equal(cancelled, true);
});

test("stalled streams time out without waiting for a stuck underlying cancel", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    cancel() {
      cancelled = true;
      return new Promise<void>(() => {});
    },
  });
  await assert.rejects(
    boundedBody(request(body), 100, 10),
    (error: unknown) => error instanceof HttpError && error.status === 408,
  );
  assert.equal(cancelled, true);
});

test("request abort cancels the pending body read", async () => {
  const controller = new AbortController();
  const body = new ReadableStream<Uint8Array>();
  const reading = boundedBody(request(body, controller.signal), 100);
  controller.abort();
  await assert.rejects(
    reading,
    (error: unknown) => error instanceof HttpError && error.status === 408,
  );
});

test("packing streamed chunks preserves bytes across allocation boundaries", async () => {
  const parts = [
    new Uint8Array([1]),
    new Uint8Array(65536).fill(2),
    new Uint8Array([3, 4]),
  ];
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(part);
      controller.close();
    },
  });
  assert.deepEqual(
    await boundedBody(request(body), 70000),
    Buffer.concat(parts),
  );
});
