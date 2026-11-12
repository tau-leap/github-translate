"use strict";

const { normalize, isProductName } = require("./matching");

const TERMS = [
  ["Pull requests", "プルリクエスト"],
  ["Pull request", "プルリクエスト"],
  ["Issues", "課題"],
  ["Issue", "課題"],
  ["Actions", "アクション"],
  ["Watching", "ウォッチ中"],
  ["Watch", "ウォッチ"],
  ["Dependabot", "依存関係の自動更新"],
  ["Spaces", "スペース"],
  ["DevOps", "開発と運用の連携"],
  ["CI/CD", "継続的インテグレーション／デリバリー"],
  ["Write", "書き込み"],
  ["Blame", "責任者"],
  ["Repository", "リポジトリ"],
  ["Repositories", "リポジトリ"],
  ["Settings", "設定"],
  ["Dashboard", "ダッシュボード"],
  ["Notifications", "通知"],
  ["Discussions", "ディスカッション"],
  ["Projects", "プロジェクト"],
  ["Security", "セキュリティ"],
  ["Insights", "インサイト"],
  ["Marketplace", "マーケットプレイス"],
  ["Codespaces", "コードスペース"],
  ["Enterprise", "エンタープライズ"],
  ["Organizations", "組織"],
  ["Organization", "組織"],
];

const PATTERNS = [
  [/^New (.+)$/, (_, x) => `新しい${x}`],
  [/^Add (.+)$/, (_, x) => `${x}を追加`],
  [/^Create (.+)$/, (_, x) => `${x}を作成`],
  [/^Edit (.+)$/, (_, x) => `${x}を編集`],
  [/^Delete (.+)$/, (_, x) => `${x}を削除`],
  [/^Remove (.+)$/, (_, x) => `${x}を削除`],
  [/^View (.+)$/, (_, x) => `${x}を表示`],
  [/^Manage (.+)$/, (_, x) => `${x}を管理`],
  [/^Open (.+)$/, (_, x) => `${x}を開く`],
  [/^Save (.+)$/, (_, x) => `${x}を保存`],
  [/^Your (.+)$/, (_, x) => `自分の${x}`],
  [/^(.+) settings$/i, (_, x) => `${x}設定`],
  [/^(.+) Settings$/, (_, x) => `${x}設定`],
];

const KEPT = new Set([
  "GitHub",
  "Copilot",
  "MCP",
  "API",
  "JSON",
  "SSH",
  "PAT",
  "URL",
  "HTML",
  "CSS",
  "OK",
  "ID",
  "OIDC",
  "SSO",
  "SAML",
  "2FA",
  "PR",
  "README",
  "LICENSE",
  "Gist",
  "gist",
  "Star",
  "OK",
]);

function termTable(dictionary) {
  const map = new Map();
  for (const [en, ja] of TERMS) map.set(en, ja);
  for (const [en, ja] of Object.entries(dictionary || {})) {
    if (!en || en.length < 2) continue;
    if (!map.has(en)) map.set(en, ja);
  }
  return map;
}

function keysByLength(table) {
  return [...table.keys()].sort((a, b) => b.length - a.length);
}

function wordBoundaryEnd(text, end) {
  const next = text[end];
  return next === undefined || next === " " || /[^A-Za-z]/.test(next);
}

function greedyTranslate(text, table) {
  const keys = keysByLength(table);
  let i = 0;
  const parts = [];
  let covered = 0;
  const leftover = [];
  while (i < text.length) {
    if (text[i] === " ") {
      parts.push(" ");
      i++;
      continue;
    }
    let hit = null;
    for (const key of keys) {
      if (key.length < 2) continue;
      if (text.startsWith(key, i) && wordBoundaryEnd(text, i + key.length)) {
        hit = key;
        break;
      }
    }
    if (hit) {
      parts.push(table.get(hit));
      covered += hit.replace(/\s+/g, "").length;
      i += hit.length;
      continue;
    }
    const nextSpace = text.indexOf(" ", i);
    const chunk = nextSpace === -1 ? text.slice(i) : text.slice(i, nextSpace);
    parts.push(chunk);
    leftover.push(chunk);
    i += chunk.length;
  }
  const letters = text.replace(/\s+/g, "").length || 1;
  return {
    text: parts.join("").replace(/\s+/g, " ").trim(),
    coverage: covered / letters,
    leftover,
  };
}

function applyPatterns(text, table) {
  for (const [re, fn] of PATTERNS) {
    const m = text.match(re);
    if (!m) continue;
    const inner = m[1];
    const innerJa =
      table.get(inner) ||
      (isProductName(inner) || KEPT.has(inner) ? inner : null);
    if (!innerJa) continue;
    return { text: fn(text, innerJa), confidence: "high" };
  }
  return null;
}

function leftoverOk(tokens) {
  return tokens.every(
    (t) =>
      KEPT.has(t) ||
      isProductName(t) ||
      /^[A-Z]{2,5}$/.test(t) ||
      t.length <= 1
  );
}

function translate(english, dictionary) {
  const key = normalize(english);
  if (!key) return { japanese: "", confidence: "none" };
  if (isProductName(key)) return { japanese: "", confidence: "none", skip: "product-name" };
  const table = termTable(dictionary);
  if (table.has(key)) return { japanese: table.get(key), confidence: "exact" };

  const patterned = applyPatterns(key, table);
  if (patterned) return { japanese: patterned.text, confidence: patterned.confidence };

  const greedy = greedyTranslate(key, table);
  if (greedy.coverage >= 0.999) {
    return { japanese: greedy.text, confidence: "high" };
  }
  if (greedy.coverage >= 0.6 && leftoverOk(greedy.leftover)) {
    return { japanese: greedy.text, confidence: "high" };
  }
  if (greedy.coverage >= 0.8) {
    return { japanese: greedy.text, confidence: "medium" };
  }
  return { japanese: greedy.text, confidence: "low", leftover: greedy.leftover };
}

function isHighConfidence(result) {
  return Boolean(
    result && (result.confidence === "exact" || result.confidence === "high") && result.japanese
  );
}

module.exports = {
  translate,
  isHighConfidence,
  termTable,
};
