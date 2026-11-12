"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { normalize } = require("./matching");

function repoRoot() {
  return path.resolve(__dirname, "..", "..");
}

function dictionaryPath(kind) {
  const file = kind === "descriptions" ? "descriptions.js" : "dictionary.js";
  return path.join(repoRoot(), "src", "locales", "ja", file);
}

function loadSource(kind) {
  return fs.readFileSync(dictionaryPath(kind), "utf8");
}

function loadMap(kind) {
  const source = loadSource(kind);
  const globalName =
    kind === "descriptions" ? "GHT_LOCALE_DESCRIPTIONS" : "GHT_LOCALE_DICTIONARY";
  const context = {};
  vm.runInNewContext(`${source}\nthis.OUT = ${globalName};`, context);
  const out = {};
  for (const [key, value] of Object.entries(context.OUT || {})) {
    out[key] = value;
  }
  return out;
}

function isIdentifierKey(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}

function formatKey(key) {
  return isIdentifierKey(key) ? key : JSON.stringify(key);
}

function formatValue(value) {
  return JSON.stringify(value);
}

function formatEntry(key, value) {
  const k = formatKey(key);
  const v = formatValue(value);
  const line = `  ${k}: ${v},`;
  if (line.length <= 100) return line;
  return `  ${k}:\n    ${v},`;
}

function formatEntries(entries) {
  return entries.map((e) => formatEntry(e.key, e.value)).join("\n");
}

function keyStartPattern(key) {
  const k = formatKey(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^(\\s*)${k}:\\s*`, "m");
}

function consumeStringLiteral(source, from) {
  let i = from;
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] !== '"' && source[i] !== "'") return null;
  const quote = source[i];
  i++;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === quote) {
      i++;
      while (i < source.length && /\s/.test(source[i])) i++;
      if (source[i] === ",") i++;
      return i;
    }
    i++;
  }
  return null;
}

function findEntryRange(source, key) {
  const re = keyStartPattern(key);
  const m = re.exec(source);
  if (!m) return null;
  const start = m.index;
  const afterColon = m.index + m[0].length;
  const end = consumeStringLiteral(source, afterColon);
  if (end == null) return null;
  let trail = end;
  if (source[trail] === "\n") trail++;
  return { start, end: trail };
}

function replaceEntry(source, key, value) {
  const range = findEntryRange(source, key);
  if (!range) return source;
  return source.slice(0, range.start) + formatEntry(key, value) + "\n" + source.slice(range.end);
}

function hasSection(source, sectionTitle) {
  return source.includes(`// --- ${sectionTitle} ---`);
}

function insertEntries(source, sectionTitle, entries) {
  if (!entries.length) return source;
  const block = formatEntries(entries) + "\n";
  const header = `// --- ${sectionTitle} ---`;
  const idx = source.indexOf(header);
  if (idx === -1) {
    const end = source.lastIndexOf("};");
    if (end === -1) throw new Error("辞書ファイルの末尾 }; が見つかりません");
    const prefix = source.slice(0, end).replace(/\s*$/, "\n\n  ");
    return `${prefix}${header}\n${block}${source.slice(end)}`;
  }
  const afterHeaderNl = source.indexOf("\n", idx);
  const from = afterHeaderNl === -1 ? idx + header.length : afterHeaderNl + 1;
  const next = source.indexOf("\n  // --- ", from);
  const endObj = source.lastIndexOf("};");
  const insertAt = next !== -1 && next < endObj ? next : endObj;
  const before = source.slice(0, insertAt).replace(/\s*$/, "\n");
  return before + block + source.slice(insertAt);
}

function applyChanges(source, { replacements, additions, sectionTitle }) {
  let next = source;
  for (const { key, value } of replacements || []) {
    if (findEntryRange(next, key)) next = replaceEntry(next, key, value);
    else {
      additions = additions || [];
      additions.push({ key, value });
    }
  }
  if (additions && additions.length) {
    next = insertEntries(next, sectionTitle || "Auto-collected", additions);
  }
  return next;
}

function writeKind(kind, source) {
  fs.writeFileSync(dictionaryPath(kind), source);
}

function keysOf(map) {
  return new Set(Object.keys(map).map(normalize));
}

module.exports = {
  repoRoot,
  dictionaryPath,
  loadSource,
  loadMap,
  formatEntry,
  formatEntries,
  findEntryRange,
  replaceEntry,
  insertEntries,
  applyChanges,
  writeKind,
  keysOf,
  hasSection,
  isIdentifierKey,
};
