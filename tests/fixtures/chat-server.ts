import { createServer } from "node:http";
import {
  chatFramePolicy,
  createHostedChatFrame,
} from "../../src/backend/infrastructure/chat/tawk";

const parent = "http://127.0.0.1:3010";
// A separate loopback origin exercises the real production trust boundary.
createServer((request, response) => {
  if (new URL(request.url || "/", "http://127.0.0.1:3011").pathname !== "/") {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy": chatFramePolicy.replace(
      "frame-ancestors 'self'",
      `frame-ancestors ${parent}`,
    ),
    "X-Content-Type-Options": "nosniff",
  });
  response.end(createHostedChatFrame(parent));
}).listen(3011, "127.0.0.1");
