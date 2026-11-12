"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { repoRoot } = require("./dictionary-file");

function collectorSource() {
  const root = repoRoot();
  const selectors = fs.readFileSync(path.join(root, "src", "selectors.js"), "utf8");
  const annotate = fs.readFileSync(path.join(root, "src", "annotate.js"), "utf8");
  const collect = fs.readFileSync(path.join(root, "scripts", "collect-in-page.js"), "utf8");
  const stub = [
    "var GHT_DICTIONARY = {};",
    "function ghtFormatTitleSuffix(original, translation) {",
    "  return String(original || '');",
    "}",
  ].join("\n");
  return `${selectors}\n${stub}\n${annotate}\n${collect}\n`;
}

module.exports = { collectorSource };
