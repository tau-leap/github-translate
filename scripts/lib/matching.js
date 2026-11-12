"use strict";

/** 拡張の ghtNormalize と同じ（前後空白除去 + 連続空白を 1 つに） */
function normalize(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

/** CONTRIBUTING: 数字入りの文言は完全一致しないので対象外 */
function hasDigits(text) {
  return /\d/.test(text);
}

/** CONTRIBUTING: 製品名そのものには訳を付けない（部分を含む文言は残す） */
const PRODUCT_NAME_EXACT = new Set([
  "GitHub",
  "GitHub Copilot",
  "GitHub Copilot Chat",
  "GitHub Copilot CLI",
  "GitHub Skills",
  "MCP",
  "AI",
]);

function isProductName(text) {
  return PRODUCT_NAME_EXACT.has(text);
}

function isMostlyJapanese(text) {
  const jp = (text.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return jp > 0 && jp >= latin;
}

function apostropheVariants(text) {
  const set = new Set([text]);
  if (text.includes("'")) set.add(text.replace(/'/g, "’"));
  if (text.includes("’")) set.add(text.replace(/’/g, "'"));
  return [...set];
}

function isPlausibleUiString(text) {
  const key = normalize(text);
  if (!key) return false;
  if (key.length < 2) return false;
  if (hasDigits(key)) return false;
  if (isProductName(key)) return false;
  if (isMostlyJapanese(key)) return false;
  if (/^https?:\/\//i.test(key)) return false;
  if (/^[A-Fa-f]{7,}$/.test(key)) return false;
  if (/^[\W_]+$/u.test(key)) return false;
  if (/\.(js|ts|tsx|jsx|mjs|cjs|json|md|yml|yaml|css|html|svg|png|jpe?g|gif|webp|lock|map)$/i.test(key)) {
    return false;
  }
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key)) {
    return false;
  }
  return true;
}

const GENERIC_BUTTONS = new Set([
  "Save",
  "Cancel",
  "Close",
  "Delete",
  "Edit",
  "Submit",
  "Apply",
  "Confirm",
  "Back",
  "Next",
  "Done",
  "OK",
  "Yes",
  "No",
  "Star",
  "Watch",
  "Follow",
  "Subscribe",
  "Search",
  "Filter",
  "Reset",
  "Clear",
  "Add",
  "Remove",
  "Upload",
  "Download",
  "Copy",
  "Paste",
  "Continue",
  "Skip",
  "Retry",
  "Dismiss",
]);

function shouldWriteDescription(key, meta) {
  if (!key || key.length > 40) return false;
  if (GENERIC_BUTTONS.has(key)) return false;
  if (/[.!?]$/.test(key)) return false;
  if (/\*$/.test(key)) return false;
  const role = (meta && meta.role) || "";
  const tag = (meta && meta.tag) || "";
  if (["TAB", "NAV", "H1", "H2", "H3"].includes(tag)) return true;
  if (["tab", "menuitem", "navigation"].includes(role)) return true;
  return false;
}

module.exports = {
  normalize,
  hasDigits,
  isProductName,
  isMostlyJapanese,
  apostropheVariants,
  isPlausibleUiString,
  shouldWriteDescription,
  PRODUCT_NAME_EXACT,
  GENERIC_BUTTONS,
};
