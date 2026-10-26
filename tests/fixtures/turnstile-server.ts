// Loaded explicitly ONLY by Playwright's child server through NODE_OPTIONS.
// This mock covers application flows, not Cloudflare's single-use guarantees.
import { CONSULTATION_ACTION } from "../../src/domain/form-protection";

if (process.env.TURNSTILE_SITE_KEY !== "offline-test-site-key")
  throw new Error(
    "The offline verification fixture requires its dedicated test site key.",
  );

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input);
  if (url !== "https://challenges.cloudflare.com/turnstile/v0/siteverify")
    return originalFetch(input, init);
  const data = typeof init?.body === "string" ? JSON.parse(init.body) : {};
  const success = data.response === "offline-form-test-token";
  return Response.json({
    success,
    hostname: new URL(process.env.SERVER_URL!).hostname,
    action: CONSULTATION_ACTION,
  });
};
