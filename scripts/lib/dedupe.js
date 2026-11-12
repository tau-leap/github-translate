"use strict";

const { parseKeysBlock } = require("./markers");
const { normalize, apostropheVariants } = require("./matching");
const { parseTranslationIssue } = require("./parse-issue");

function collectTrackedKeys({ dictionary, issues, pulls }) {
  const tracked = new Set();
  for (const key of Object.keys(dictionary || {})) {
    for (const v of apostropheVariants(key)) tracked.add(v);
  }
  for (const issue of issues || []) {
    for (const key of parseKeysBlock(issue.body)) {
      for (const v of apostropheVariants(normalize(key))) tracked.add(v);
    }
    const parsed = parseTranslationIssue(issue);
    if (parsed) {
      for (const entry of parsed.entries) {
        for (const v of apostropheVariants(entry.english)) tracked.add(v);
      }
    }
  }
  for (const pull of pulls || []) {
    for (const key of parseKeysBlock(pull.body)) {
      for (const v of apostropheVariants(normalize(key))) tracked.add(v);
    }
  }
  return tracked;
}

function isTracked(key, tracked) {
  const n = normalize(key);
  return apostropheVariants(n).some((v) => tracked.has(v));
}

function issueNumbersForKey(key, issues) {
  const variants = new Set(apostropheVariants(normalize(key)));
  const numbers = [];
  for (const issue of issues || []) {
    const keys = new Set(parseKeysBlock(issue.body).map(normalize));
    const parsed = parseTranslationIssue(issue);
    if (parsed) {
      for (const entry of parsed.entries) keys.add(entry.english);
    }
    for (const k of keys) {
      if (variants.has(k)) {
        numbers.push(issue.number);
        break;
      }
    }
  }
  return numbers;
}

module.exports = {
  collectTrackedKeys,
  isTracked,
  issueNumbersForKey,
};
