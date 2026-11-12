"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalize,
  hasDigits,
  isProductName,
  isPlausibleUiString,
  apostropheVariants,
} = require("./matching");

describe("normalize", () => {
  it("trims and collapses whitespace like the extension", () => {
    assert.equal(normalize("  Pull   requests\n"), "Pull requests");
  });
});

describe("dictionary rules", () => {
  it("rejects strings with digits", () => {
    assert.equal(hasDigits("16 repositories"), true);
    assert.equal(isPlausibleUiString("16 repositories"), false);
  });

  it("skips product names themselves", () => {
    assert.equal(isProductName("GitHub Copilot"), true);
    assert.equal(isProductName("MCP"), true);
    assert.equal(isProductName("AI"), true);
    assert.equal(isPlausibleUiString("GitHub Copilot"), false);
    assert.equal(isProductName("Copilot settings"), false);
  });

  it("treats straight and curly apostrophes as distinct keys", () => {
    const v = apostropheVariants("Don't");
    assert.ok(v.includes("Don't"));
    assert.ok(v.includes("Don’t"));
    assert.equal("Don't" === "Don’t", false);
  });

  it("is case-sensitive for plausibility of mixed UI labels", () => {
    assert.equal(isPlausibleUiString("Settings"), true);
    assert.equal(isPlausibleUiString("SETTINGS"), true);
  });

  it("skips user-content-like values", () => {
    assert.equal(isPlausibleUiString("README.md"), false);
    assert.equal(isPlausibleUiString("https://github.com/foo"), false);
    assert.equal(isPlausibleUiString("これは本文"), false);
  });
});
