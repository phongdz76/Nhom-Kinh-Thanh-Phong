import assert from "node:assert/strict";
import { test } from "node:test";
import { settingsSchema, tawkChatLinkSchema } from "../../src/domain/schemas";
import { createChatService } from "../../src/frontend/application/chat";

const link = "https://tawk.to/chat/0123456789abcdef01234567/1testwidget";

test("chat accepts only official direct links and validates before embedding a script", () => {
  const opened: string[] = [];
  const service = createChatService({
    embed(url) {
      opened.push(url);
      return { url: "embedded chat" };
    },
  });
  service.embed(`  ${link}  `);
  service.embed(`${link}/`);
  assert.deepEqual(opened, [link, `${link}/`]);
  for (const unsafe of [
    "javascript:alert(1)",
    "https://tawk.to.evil.example/chat/0123456789abcdef01234567/widget",
    "https://tawk.to@evil.example/chat/0123456789abcdef01234567/widget",
    "http://tawk.to/chat/0123456789abcdef01234567/widget",
    "https://embed.tawk.to/0123456789abcdef01234567/widget",
    `${link}?script=anything`,
    `${link}?layout=modern&script=anything`,
    `${link}?layout=modern&layout=modern`,
    `${link}?layout=modern#fragment`,
    `${link}#fragment`,
    `${link}/extra`,
    "<script src='https://embed.tawk.to/widget'></script>",
    "",
  ]) {
    assert.equal(tawkChatLinkSchema.safeParse(unsafe).success, false);
    assert.throws(() => service.embed(unsafe));
  }
  assert.equal(opened.length, 2);
});

test("copied modern direct-chat links keep the configured widget identity", () => {
  const modern = `${link}?layout=modern`;
  assert.equal(tawkChatLinkSchema.parse(modern), link);
  assert.equal(tawkChatLinkSchema.parse(`${link}/?layout=modern`), `${link}/`);
  const opened: string[] = [];
  const service = createChatService({
    embed(url) {
      opened.push(url);
      return { url };
    },
  });
  service.embed(modern);
  assert.deepEqual(opened, [link]);
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
  assert.equal(
    settingsSchema.parse({
      ...settings,
      tawkDirectChatUrl: `${link}?layout=modern`,
    }).tawkDirectChatUrl,
    link,
  );
});
