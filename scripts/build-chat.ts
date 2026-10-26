import fs from "node:fs";
import path from "node:path";
import {
  chatFramePolicy,
  createHostedChatFrame,
} from "../src/backend/infrastructure/chat/tawk";

const parent = new URL(process.env.SERVER_URL || "");
if (parent.protocol !== "https:" || parent.origin !== process.env.SERVER_URL)
  throw new Error(
    "Set SERVER_URL to the website's HTTPS origin before building the static chat host.",
  );
const directory = path.resolve("out-chat");
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(
  path.join(directory, "index.html"),
  createHostedChatFrame(parent.origin),
);
const policy = chatFramePolicy.replace(
  "frame-ancestors 'self'",
  `frame-ancestors ${parent.origin}`,
);
fs.writeFileSync(
  path.join(directory, "_headers"),
  `/*
  Content-Security-Policy: ${policy}
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Cache-Control: no-store
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
`,
);
console.log(
  "Static chat host prepared in out-chat/. No credentials are included.",
);
