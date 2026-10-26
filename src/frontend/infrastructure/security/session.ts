import type { SessionEvents } from "@/frontend/application/ports";

const channelName = "thanhphong:session";

// Only an invalidation signal crosses tabs. Tokens and customer data never do.
export const sessionEvents: SessionEvents = {
  publish() {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(channelName);
    channel.postMessage("changed");
    channel.close();
  },
  subscribe(listener) {
    if (typeof BroadcastChannel === "undefined") return () => {};
    const channel = new BroadcastChannel(channelName);
    channel.onmessage = (event) => {
      if (event.data === "changed") listener();
    };
    return () => channel.close();
  },
};
