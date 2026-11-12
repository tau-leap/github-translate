"use strict";

const { isPlausibleUiString, normalize, isProductName, hasDigits } = require("./matching");
const { translate, isHighConfidence } = require("./translate");
const { sectionForUrl } = require("./sections");
const dictFile = require("./dictionary-file");

function prepareEntry(entry, dictionary, options) {
  const english = normalize(entry.english);
  const opts = options || {};
  if (!english) return { skip: "empty" };
  if (!isPlausibleUiString(english) && !opts.allowImplausible) {
    if (isProductName(english)) return { skip: "product-name", english };
    if (hasDigits(english)) return { skip: "digits", english };
    return { skip: "not-ui", english };
  }

  let japanese = normalize(entry.japanese || "");
  let confidence = japanese ? "provided" : "none";
  if (!japanese) {
    const result = translate(english, dictionary);
    if (result.skip) return { skip: result.skip, english };
    japanese = result.japanese;
    confidence = result.confidence;
  }

  const existing = dictionary[english];
  if (opts.kind === "untranslated" && existing) {
    return { skip: "already-in-dictionary", english, japanese: existing };
  }
  if (opts.kind === "translation-fix" && existing && existing === japanese) {
    return { skip: "already-applied", english, japanese };
  }
  if (!japanese) return { skip: "no-translation", english };

  const requireHigh = opts.requireHighConfidence && confidence !== "provided";
  if (requireHigh && !isHighConfidence({ japanese, confidence }) && confidence !== "medium") {
    return { skip: "low-confidence", english, japanese, confidence };
  }

  return {
    english,
    japanese,
    confidence,
    description: normalize(entry.description || ""),
    pageUrl: entry.pageUrl || "",
    issueNumber: entry.issueNumber || null,
  };
}

function groupBySection(prepared) {
  const groups = new Map();
  for (const item of prepared) {
    const section = sectionForUrl(item.pageUrl);
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(item);
  }
  return groups;
}

function applyPrepared(prepared) {
  const dictSource = dictFile.loadSource("dictionary");
  const descSource = dictFile.loadSource("descriptions");
  const dictionary = dictFile.loadMap("dictionary");
  const descriptions = dictFile.loadMap("descriptions");

  const bySection = groupBySection(prepared);
  let nextDict = dictSource;
  let nextDesc = descSource;
  const added = [];
  const replaced = [];
  const descChanged = [];

  for (const [section, items] of bySection) {
    const replacements = [];
    const additions = [];
    for (const item of items) {
      if (Object.prototype.hasOwnProperty.call(dictionary, item.english)) {
        replacements.push({ key: item.english, value: item.japanese });
        replaced.push(item);
      } else {
        additions.push({ key: item.english, value: item.japanese });
        added.push(item);
      }
      dictionary[item.english] = item.japanese;
    }
    nextDict = dictFile.applyChanges(nextDict, {
      replacements,
      additions,
      sectionTitle: section,
    });
  }

  for (const item of prepared) {
    if (!item.description) continue;
    if (descriptions[item.english] === item.description) continue;
    if (Object.prototype.hasOwnProperty.call(descriptions, item.english)) {
      nextDesc = dictFile.replaceEntry(nextDesc, item.english, item.description);
    } else {
      nextDesc = dictFile.insertEntries(
        nextDesc,
        sectionForUrl(item.pageUrl),
        [{ key: item.english, value: item.description }]
      );
    }
    descriptions[item.english] = item.description;
    descChanged.push(item);
  }

  return {
    dictionarySource: nextDict,
    descriptionsSource: nextDesc,
    added,
    replaced,
    descChanged,
  };
}

function writeApplied(applied) {
  dictFile.writeKind("dictionary", applied.dictionarySource);
  if (applied.descChanged.length) {
    dictFile.writeKind("descriptions", applied.descriptionsSource);
  }
}

module.exports = {
  prepareEntry,
  applyPrepared,
  writeApplied,
};
