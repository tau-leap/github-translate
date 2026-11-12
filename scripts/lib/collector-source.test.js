"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { collectorSource } = require("./collector-source");

describe("collectorSource", () => {
  it("bundles the extension selectors and annotate helpers", () => {
    const src = collectorSource();
    assert.match(src, /GHT_ALLOW_SELECTOR/);
    assert.match(src, /GHT_DENY_SELECTOR/);
    assert.match(src, /function ghtNormalize/);
    assert.match(src, /function ghtIsAllowed/);
    assert.match(src, /function ghtCollectCandidates/);
    assert.match(src, /\.markdown-body/);
    assert.match(src, /\.comment-body/);
  });
});
