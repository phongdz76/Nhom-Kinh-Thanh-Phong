import assert from "node:assert/strict";
import { test } from "node:test";
import { settingsSchema } from "../../src/domain/schemas";
import { getMapLocation } from "../../src/frontend/presentation/shared/map-links";

const settings = {
  name: "Thanh Phong",
  tagline: "",
  phone: "",
  email: "",
  zalo: "",
  address: "387 Bình Thành",
  hours: "",
};
test("saved Google map pins survive settings validation and drive both map URLs", () => {
  const pin = {
    mapUrl: "https://maps.app.goo.gl/QzfkQhiJiynHnxKc9",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1s0x31752b993f3cafab%3A0xf7fe7de0fb0c3cdf",
  };
  const saved = settingsSchema.parse({ ...settings, ...pin });
  const location = getMapLocation(saved.address, saved)!;
  assert.equal(location.embedUrl, pin.mapEmbedUrl);
  assert.equal(location.searchUrl, pin.mapUrl);
});
test("map fields reject executable URLs, foreign domains and pasted iframe HTML", () => {
  for (const mapUrl of [
    "javascript:alert(1)",
    "https://maps.app.goo.gl.evil.example/location",
    "https://example.com/maps/",
  ]) {
    assert.equal(
      settingsSchema.safeParse({ ...settings, mapUrl }).success,
      false,
    );
  }
  for (const mapEmbedUrl of [
    "<iframe src='https://www.google.com/maps/embed?pb=x'></iframe>",
    "https://example.com/maps/embed?pb=x",
  ]) {
    assert.equal(
      settingsSchema.safeParse({ ...settings, mapEmbedUrl }).success,
      false,
    );
  }
});
