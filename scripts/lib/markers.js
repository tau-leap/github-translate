"use strict";

const KEYS_BLOCK_RE = /<!--\s*ght-keys\s*\r?\n([\s\S]*?)-->/;
const SCAN_MARKER_RE = /<!--\s*ght-auto-scan(?::([^\s]+))?\s*-->/;
const FROM_ISSUES_MARKER = "<!-- ght-auto-from-issues -->";
const AUTO_PR_RE = /<!--\s*ght-auto-pr:(\d+)\s*-->/;
const AUTO_ISSUE_RE = /<!--\s*ght-auto-issue:(\d+)\s*-->/;

function formatKeysBlock(keys) {
  const unique = [...new Set(keys.filter(Boolean))];
  return `<!-- ght-keys\n${unique.join("\n")}\n-->`;
}

function parseKeysBlock(body) {
  const m = String(body || "").match(KEYS_BLOCK_RE);
  if (!m) return [];
  return m[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseScanArea(body) {
  const m = String(body || "").match(SCAN_MARKER_RE);
  return m ? (m[1] || "all").trim() : null;
}

function parseAutoPrNumber(body) {
  const m = String(body || "").match(AUTO_PR_RE);
  return m ? Number(m[1]) : null;
}

function formatScanMarker(area) {
  return area ? `<!-- ght-auto-scan:${area} -->` : "<!-- ght-auto-scan -->";
}

function formatAutoPrMarker(number) {
  return `<!-- ght-auto-pr:${number} -->`;
}

function formatAutoIssueMarker(number) {
  return `<!-- ght-auto-issue:${number} -->`;
}

function parseAutoIssueNumbers(body) {
  const out = [];
  const re = /<!--\s*ght-auto-issue:(\d+)\s*-->/g;
  let m;
  const text = String(body || "");
  while ((m = re.exec(text))) out.push(Number(m[1]));
  return out;
}

module.exports = {
  KEYS_BLOCK_RE,
  FROM_ISSUES_MARKER,
  formatKeysBlock,
  parseKeysBlock,
  parseScanArea,
  parseAutoPrNumber,
  formatScanMarker,
  formatAutoPrMarker,
  formatAutoIssueMarker,
  parseAutoIssueNumbers,
  AUTO_ISSUE_RE,
};
