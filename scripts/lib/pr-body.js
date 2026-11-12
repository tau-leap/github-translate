"use strict";

const { formatKeysBlock, FROM_ISSUES_MARKER, formatScanMarker, formatAutoIssueMarker } = require("./markers");

function checklist() {
  return `## 確認したこと

- [x] \`node --check\` が通る（変更した JS ファイルすべて）
- [x] 英語キーは画面の表示どおり（大文字・小文字、\`'\` と \`’\` の違いも含む）
- [ ] [CONTRIBUTING.md](CONTRIBUTING.md) の用語ルールに沿っている（自動草案のレビュー）
- [x] 既存のキーと重複していない
- [ ] （可能なら）拡張機能を読み込み直して、実際の画面で表示を確認した`;
}

function formatEntryList(items) {
  return items
    .map((item) => {
      const issue = item.issueNumber ? ` (#${item.issueNumber})` : "";
      return `- \`${item.english.replace(/`/g, "\\`")}\` → ${item.japanese}${issue}`;
    })
    .join("\n");
}

function fromIssuesBody({ added, replaced, descChanged, issueNumbers }) {
  const closes = [...new Set(issueNumbers)].map((n) => `Closes #${n}`).join("\n");
  const parts = [
    "## 変更内容",
    "",
    "翻訳レポート Issue から辞書を更新しました（自動化）。訳は提案があるものはそれを使い、ないものは既存辞書と用語ルールから草案を付けています。マージ前に用語を確認してください。",
    "",
  ];
  if (added.length) {
    parts.push("### 追加", "", formatEntryList(added), "");
  }
  if (replaced.length) {
    parts.push("### 修正", "", formatEntryList(replaced), "");
  }
  if (descChanged.length) {
    parts.push("### descriptions.js", "", formatEntryList(descChanged.map((d) => ({
      english: d.english,
      japanese: d.description,
      issueNumber: d.issueNumber,
    }))), "");
  }
  parts.push(checklist(), "", "## 関連 Issue", "", closes || "（なし）", "", FROM_ISSUES_MARKER, formatKeysBlock([...added, ...replaced].map((i) => i.english)));
  return parts.join("\n");
}

function scanIssueBody({ urlGroups, keys, area }) {
  const lines = [
    "定期スキャンで、拡張機能と同じセレクタ範囲から辞書に無い UI 文言を集めました。",
    "README・コメント・Issue / PR 本文・コード・ユーザー名は対象外です。",
    "",
    "### ページ URL",
    "",
    [...urlGroups.keys()].join("\n") || "（複数ページ）",
    "",
    "### 英語の文言",
    "",
  ];
  for (const [url, texts] of urlGroups) {
    lines.push(`#### ${url}`, "");
    for (const t of texts) lines.push(t);
    lines.push("");
  }
  lines.push(
    "### 訳の案（任意）",
    "",
    "_No response_",
    "",
    formatScanMarker(area || "all"),
    formatKeysBlock(keys)
  );
  return lines.join("\n");
}

function scanPullBody({ added, issueNumber, urls }) {
  const parts = [
    "## 変更内容",
    "",
    "github.com の定型 UI をスキャンし、辞書に無い文言のうち訳の確度が高いものを追加しました。自動化の草案なので、マージ前に用語ルールを確認してください。",
    "",
    urls && urls.length ? `スキャンしたページ例: ${urls.slice(0, 8).join(", ")}${urls.length > 8 ? " ほか" : ""}` : "",
    "",
    "### 追加",
    "",
    formatEntryList(added),
    "",
    checklist(),
    "",
    "## 関連 Issue",
    "",
    issueNumber ? `Closes #${issueNumber}` : "（Issue のみ、または未作成）",
    "",
    formatScanMarker("all"),
    issueNumber ? formatAutoIssueMarker(issueNumber) : "",
    formatKeysBlock(added.map((i) => i.english)),
  ];
  return parts.filter((p) => p !== "").join("\n");
}

module.exports = {
  fromIssuesBody,
  scanIssueBody,
  scanPullBody,
  formatEntryList,
  checklist,
};
