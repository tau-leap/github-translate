"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os");
const { collectorSource } = require("./collector-source");

function tryPlaywright() {
  const extra = [
    path.join(os.tmpdir(), "ght-playwright", "node_modules"),
    process.env.RUNNER_TEMP
      ? path.join(process.env.RUNNER_TEMP, "ght-playwright", "node_modules")
      : "",
  ].filter(Boolean);
  for (const dir of extra) {
    if (!module.paths.includes(dir)) module.paths.unshift(dir);
  }
  try {
    return require("playwright");
  } catch {
    return null;
  }
}

describe("collect fixture", () => {
  const playwright = tryPlaywright();

  it("uses extension allow/deny rules on sample HTML", { skip: !playwright }, async () => {
    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const file = path.join(__dirname, "..", "fixtures", "sample-github.html");
      await page.goto("file://" + file);
      const items = await page.evaluate((src) => {
        return new Function(`${src}\nreturn ghtCollectCandidates();`)();
      }, collectorSource());
      const texts = items.map((i) => i.text);
      assert.ok(texts.includes("Missing header label"));
      assert.ok(texts.includes("Definitely missing translation"));
      assert.ok(texts.includes("Pull requests"));
      assert.equal(texts.includes("User written README content must be ignored"), false);
      assert.equal(texts.includes("function skipMe() {}"), false);
      assert.equal(texts.includes("A user comment that must be ignored"), false);
    } finally {
      await browser.close();
    }
  });
});
