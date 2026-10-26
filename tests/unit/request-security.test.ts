import assert from "node:assert/strict";
import { test } from "node:test";
import { trustedClientIP } from "../../src/backend/infrastructure/security/client-ip";
import {
  createRequestGuard,
  requestLimit,
} from "../../src/backend/application/request-security";
import { ApplicationError } from "../../src/backend/application/errors";
import apiGuard from "../../netlify/edge-functions/api-guard";

test("IP identity never trusts arbitrary forwarding headers or an unverified platform", () => {
  const headers = new Headers({
    "x-forwarded-for": "198.51.100.1",
    "cf-connecting-ip": "198.51.100.2",
    "x-nf-client-connection-ip": "198.51.100.3",
  });
  assert.equal(trustedClientIP(headers, false), null);
  assert.equal(trustedClientIP(headers, true), "198.51.100.3");
  for (const spoofed of ["198.51.100.1, 198.51.100.2", "443", "garbage", ""]) {
    headers.set("x-nf-client-connection-ip", spoofed);
    assert.equal(trustedClientIP(headers, true), null);
  }
  headers.set("x-nf-client-connection-ip", "::ffff:198.51.100.3");
  assert.equal(trustedClientIP(headers, true), "198.51.100.3");
  headers.set("x-nf-client-connection-ip", "2001:0DB8:0:0::1");
  assert.equal(trustedClientIP(headers, true), "2001:db8::1");
});

test("request limits run before protected work and isolate IPs and sensitive operations", async () => {
  const counts = new Map<string, number>();
  const guard = createRequestGuard({
    async check(scope, id, max, seconds) {
      const key = `${scope}:${id}`;
      const count = (counts.get(key) || 0) + 1;
      counts.set(key, count);
      if (count > max)
        throw new ApplicationError("tooManyRequests", "Limited", seconds);
    },
  });
  for (let attempt = 0; attempt < 20; attempt++)
    await guard("/api/auth/login", "POST", "198.51.100.1");
  await assert.rejects(
    guard("/api/auth/login", "POST", "198.51.100.1"),
    (error) =>
      error instanceof ApplicationError &&
      error.code === "tooManyRequests" &&
      error.retryAfterSeconds === 900,
  );
  await guard("/api/auth/login", "POST", "198.51.100.2");
  await guard("/api/public/leads", "POST", "198.51.100.1");
  await guard("/api/public/site", "GET", "198.51.100.1");
  const size = counts.size;
  await guard("/api/auth/login", "POST", null);
  assert.equal(counts.size, size);
});

test("edge guard rejects oversized or malformed body sizes before reading the body", () => {
  for (const length of ["16385", "-1", "NaN", "999999999999999999999999"]) {
    const result = apiGuard(
      new Request("https://example.test/api/public/leads", {
        method: "POST",
        headers: { "Content-Length": length },
      }),
    );
    assert.equal(result?.status, 413);
  }
  assert.equal(
    apiGuard(new Request("https://example.test/api/public/site")),
    undefined,
  );
  assert.equal(
    apiGuard(
      new Request("https://example.test/api/admin/media", {
        method: "POST",
        headers: {
          "Content-Length": "8000000",
          Origin: "https://example.test",
          "Content-Type": "multipart/form-data; boundary=test",
        },
      }),
    ),
    undefined,
  );
  assert.equal(
    apiGuard(
      new Request("https://example.test/api/public/site", { method: "DELETE" }),
    )?.status,
    405,
  );
});

test("encoded sensitive routes share their canonical rate-limit policy", () => {
  for (const [canonical, encoded, method] of [
    ["/api/auth/login", "/api/%61uth/%6cogin", "POST"],
    ["/api/public/leads", "/api/public/%6ceads", "POST"],
    ["/api/admin/media", "/api/admin/%6dedia", "POST"],
    [
      "/api/admin/estimates/id/export",
      "/api/admin/estimates/id/%65xport",
      "GET",
    ],
  ]) {
    assert.deepEqual(
      requestLimit(encoded, method),
      requestLimit(canonical, method),
    );
    assert.deepEqual(
      requestLimit(`${encoded}/`, method),
      requestLimit(canonical, method),
    );
  }
  for (const path of [
    "/api/auth%2flogin",
    "/api/auth/%256cogin",
    "/api/auth/%zz",
  ]) {
    assert.equal(requestLimit(path, "POST").scope, "http-api");
  }
});

test("alternating URL encodings cannot reset the login request counter", async () => {
  const counts = new Map<string, number>();
  const guard = createRequestGuard({
    async check(scope, id, maximum, seconds) {
      const key = `${scope}:${id}`;
      const count = (counts.get(key) || 0) + 1;
      counts.set(key, count);
      if (count > maximum)
        throw new ApplicationError("tooManyRequests", "Limited", seconds);
    },
  });
  const paths = ["/api/auth/login", "/api/auth/%6cogin", "/api/%61uth/login"];
  for (let attempt = 0; attempt < 20; attempt++)
    await guard(paths[attempt % paths.length], "POST", "198.51.100.1");
  await assert.rejects(
    guard("/api/%61uth/%6cogin", "POST", "198.51.100.1"),
    (error: unknown) =>
      error instanceof ApplicationError && error.code === "tooManyRequests",
  );
  assert.equal(counts.size, 1);
});

test("edge body limits preserve supported admin payloads and encoded route identities", () => {
  for (const [path, limit] of [
    ["/api/auth/login", 16384],
    ["/api/public/leads", 16384],
    ["/api/admin/media", 8 * 1024 * 1024 + 131072],
    ["/api/admin/%6dedia", 8 * 1024 * 1024 + 131072],
    ["/api/admin/content/posts", 350000],
    ["/api/admin/content/%70osts", 350000],
    ["/api/admin/content/projects", 64000],
    ["/api/admin/estimates", 65536],
    ["/api/admin/estimates/id", 65536],
  ] as const) {
    const request = (length: number) =>
      new Request(`https://example.test${path}`, {
        method: "POST",
        headers: {
          "Content-Length": String(length),
          Origin: "https://example.test",
          "Content-Type":
            path.includes("media") || path.includes("%6dedia")
              ? "multipart/form-data; boundary=test"
              : "application/json",
        },
      });
    assert.equal(apiGuard(request(limit)), undefined, path);
    assert.equal(apiGuard(request(limit + 1))?.status, 413, path);
  }
});

test("lead bursts are stopped independently of the longer per-client allowance", async () => {
  const counts = new Map<string, number>();
  const guard = createRequestGuard({
    async check(scope, id, maximum, seconds) {
      const key = `${scope}:${id}`;
      const count = (counts.get(key) || 0) + 1;
      counts.set(key, count);
      if (count > maximum)
        throw new ApplicationError("tooManyRequests", "Limited", seconds);
    },
  });
  for (let attempt = 0; attempt < 3; attempt++)
    await guard("/api/public/leads", "POST", "198.51.100.1");
  await assert.rejects(
    guard("/api/public/%6ceads", "POST", "198.51.100.1"),
    (error: unknown) =>
      error instanceof ApplicationError && error.retryAfterSeconds === 60,
  );
  await guard("/api/public/leads", "POST", "198.51.100.2");
});

test("edge rejects foreign origins and non-JSON content before application work", () => {
  const request = (origin: string, type: string) =>
    new Request("https://example.test/api/public/leads", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": type },
    });
  assert.equal(
    apiGuard(request("https://foreign.test", "application/json"))?.status,
    403,
  );
  assert.equal(
    apiGuard(request("https://example.test", "application/jsonp"))?.status,
    415,
  );
  assert.equal(
    apiGuard(
      request("https://example.test", "application/json; charset=utf-8"),
    ),
    undefined,
  );
});
