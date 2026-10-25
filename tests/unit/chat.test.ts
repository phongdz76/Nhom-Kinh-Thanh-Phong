import assert from "node:assert/strict";
import { test } from "node:test";
import { settingsSchema, tawkChatLinkSchema } from "../../src/domain/schemas";
import { createChatService } from "../../src/frontend/application/chat";

const link = "https://tawk.to/chat/0123456789abcdef01234567/1testwidget";

test("chat accepts only official direct links and validates before loading a script", async () => {
  const opened: string[] = [];
  const service = createChatService({
    async open(url) {
      opened.push(url);
    },
    hide() {},
  });
  await service.open(`  ${link}  `);
  await service.open(`${link}/`);
  assert.deepEqual(opened, [link, `${link}/`]);
  for (const unsafe of [
    "javascript:alert(1)",
    "https://tawk.to.evil.example/chat/0123456789abcdef01234567/widget",
    "https://tawk.to@evil.example/chat/0123456789abcdef01234567/widget",
    "http://tawk.to/chat/0123456789abcdef01234567/widget",
    "https://embed.tawk.to/0123456789abcdef01234567/widget",
    `${link}?script=anything`,
    `${link}#fragment`,
    `${link}/extra`,
    "<script src='https://embed.tawk.to/widget'></script>",
    "",
  ]) {
    assert.equal(tawkChatLinkSchema.safeParse(unsafe).success, false);
    assert.throws(() => service.open(unsafe));
  }
  assert.equal(opened.length, 2);
});

test("existing site settings keep chat disabled until a direct link is saved", () => {
  const settings = {
    name: "Thanh Phong",
    tagline: "",
    phone: "",
    email: "",
    zalo: "",
    address: "",
    hours: "",
  };
  assert.equal(settingsSchema.parse(settings).tawkDirectChatUrl, "");
  assert.equal(
    settingsSchema.parse({ ...settings, tawkDirectChatUrl: link })
      .tawkDirectChatUrl,
    link,
  );
});
