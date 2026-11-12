"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const dictFile = require("./dictionary-file");
const { parseKeysBlock, formatKeysBlock } = require("./markers");
const { collectTrackedKeys, isTracked } = require("./dedupe");
const { translate, isHighConfidence } = require("./translate");
const { applyChanges } = require("./dictionary-file");

describe("dictionary file", () => {
  it("loads the real Japanese dictionary", () => {
    const map = dictFile.loadMap("dictionary");
    assert.equal(map["Pull requests"], "プルリクエスト");
    assert.equal(map.Settings, "設定");
    assert.notEqual(map.Settings, map.SETTINGS);
  });

  it("inserts and replaces entries without breaking object syntax", () => {
    const src = `var GHT_LOCALE_DICTIONARY = {
  // --- Global / header ---
  Dashboard: "ダッシュボード",
  "Pull requests": "プルリクエスト",
};
`;
    const replaced = dictFile.replaceEntry(src, "Dashboard", "概要");
    assert.match(replaced, /Dashboard: "概要"/);
    const added = dictFile.insertEntries(replaced, "Global / header", [
      { key: "Missing header label", value: "無いヘッダー" },
    ]);
    assert.match(added, /"Missing header label": "無いヘッダー"/);
    const context = {};
    require("node:vm").runInNewContext(`${added}\nthis.OUT = GHT_LOCALE_DICTIONARY;`, context);
    assert.equal(context.OUT.Dashboard, "概要");
    assert.equal(context.OUT["Missing header label"], "無いヘッダー");
    assert.equal(context.OUT["Pull requests"], "プルリクエスト");
  });

  it("applyChanges adds into a new section when needed", () => {
    const src = `var GHT_LOCALE_DICTIONARY = {
  Foo: "フー",
};
`;
    const next = applyChanges(src, {
      additions: [{ key: "Bar", value: "バー" }],
      sectionTitle: "Auto-collected",
    });
    assert.match(next, /\/\/ --- Auto-collected ---/);
    assert.match(next, /Bar: "バー"/);
  });
});

describe("markers and dedupe", () => {
  it("round-trips key blocks", () => {
    const block = formatKeysBlock(["Pull requests", "Don't"]);
    assert.deepEqual(parseKeysBlock(`hello\n${block}`), ["Pull requests", "Don't"]);
  });

  it("treats dictionary keys and open issues as already tracked", () => {
    const tracked = collectTrackedKeys({
      dictionary: { Settings: "設定" },
      issues: [
        {
          number: 3,
          title: "[未訳] Foo",
          labels: ["untranslated"],
          body: "### 英語の文言\n\nDefinitely missing translation\n",
        },
      ],
      pulls: [{ body: formatKeysBlock(["Another key"]) }],
    });
    assert.equal(isTracked("Settings", tracked), true);
    assert.equal(isTracked("Definitely missing translation", tracked), true);
    assert.equal(isTracked("Another key", tracked), true);
    assert.equal(isTracked("Brand new label", tracked), false);
  });
});

describe("translate", () => {
  it("reuses dictionary / CONTRIBUTING terms", () => {
    const dict = { Issues: "課題", Settings: "設定" };
    assert.equal(translate("Issues", dict).confidence, "exact");
    const patterned = translate("New Issues", dict);
    assert.equal(patterned.japanese, "新しい課題");
    assert.equal(isHighConfidence(patterned), true);
  });

  it("does not translate product names", () => {
    assert.equal(translate("GitHub Copilot", {}).skip, "product-name");
  });
});
