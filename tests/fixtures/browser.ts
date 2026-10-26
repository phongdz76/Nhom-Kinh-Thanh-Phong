import { test as base } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";

export { expect } from "@playwright/test";

export async function mockFormChallenge(target: Page | BrowserContext) {
  await target.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js*",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `window.turnstile={
        ready:function(callback){callback()},
        render:function(element,options){
          queueMicrotask(function(){options.callback("offline-form-test-token")});
          return "offline-widget";
        },
        remove:function(){}
      };`,
      }),
  );
}

export const test = base.extend({
  page: async ({ page }, providePage) => {
    await mockFormChallenge(page);
    await providePage(page);
  },
});
