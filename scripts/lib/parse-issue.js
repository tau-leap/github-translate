"use strict";

const { normalize } = require("./matching");

const UNTRANSLATED_TITLES = /^\[未訳\]/;
const FIX_TITLES = /^\[訳の修正\]/;
const BUG_TITLES = /^\[不具合\]/;

function headingBody(markdown, heading) {
  const src = String(markdown || "").replace(/\r\n/g, "\n");
  const re = new RegExp(
    `(?:^|\\n)#{1,6}\\s*${escapeRegExp(heading)}\\s*\\n([\\s\\S]*?)(?=\\n#{1,6}\\s+|$)`
  );
  const m = src.match(re);
  if (!m) return "";
  return stripNoResponse(stripFence(m[1].trim()));
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripFence(text) {
  return String(text || "")
    .replace(/^```[a-zA-Z0-9]*\n([\s\S]*?)\n```$/m, "$1")
    .trim();
}

function stripNoResponse(text) {
  const t = String(text || "").trim();
  if (!t || t === "_No response_" || t === "None" || t === "なし") return "";
  return t;
}

function splitLines(text) {
  return String(text || "")
    .split(/\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

function parseArrowLine(line) {
  const m = String(line || "").match(/^(.*?)\s*(?:→|->|=>|➜)\s*(.*)$/);
  if (!m) return null;
  const left = normalize(m[1]);
  const right = normalize(m[2]);
  if (!left || !right) return null;
  return { english: left, japanese: right };
}

function classifyIssue(issue) {
  const labels = (issue.labels || []).map((l) => (typeof l === "string" ? l : l.name));
  const title = String(issue.title || "");
  if (labels.includes("bug") || BUG_TITLES.test(title)) return null;
  if (labels.includes("untranslated") || UNTRANSLATED_TITLES.test(title)) {
    return "untranslated";
  }
  if (labels.includes("translation-fix") || FIX_TITLES.test(title)) {
    return "translation-fix";
  }
  return null;
}

function parseUntranslated(issue) {
  const body = issue.body || "";
  const pageUrl = headingBody(body, "ページ URL") || headingBody(body, "ページ URL（任意）");
  const englishRaw = headingBody(body, "英語の文言");
  const suggestedRaw = headingBody(body, "訳の案（任意）") || headingBody(body, "訳の案");
  const descriptionRaw = headingBody(body, "機能説明");

  const englishLines = splitLines(englishRaw).map(normalize).filter(Boolean);
  const suggestedLines = splitLines(suggestedRaw);
  const entries = [];

  if (englishLines.length === 0) {
    const fromTitle = String(issue.title || "").replace(UNTRANSLATED_TITLES, "").trim();
    if (fromTitle && !fromTitle.includes("自動スキャン")) {
      englishLines.push(normalize(fromTitle));
    }
  }

  const arrowSuggested = suggestedLines.map(parseArrowLine).filter(Boolean);
  if (arrowSuggested.length) {
    const byEn = new Map(arrowSuggested.map((x) => [x.english, x.japanese]));
    for (const en of englishLines.length ? englishLines : arrowSuggested.map((x) => x.english)) {
      entries.push({
        english: en,
        japanese: byEn.get(en) || "",
        description: "",
      });
    }
  } else if (englishLines.length && suggestedLines.length === englishLines.length) {
    for (let i = 0; i < englishLines.length; i++) {
      entries.push({
        english: englishLines[i],
        japanese: normalize(suggestedLines[i]),
        description: "",
      });
    }
  } else {
    const onlyJa = suggestedLines.length === 1 ? normalize(suggestedLines[0]) : "";
    for (const en of englishLines) {
      entries.push({
        english: en,
        japanese: englishLines.length === 1 ? onlyJa : "",
        description: "",
      });
    }
  }

  if (descriptionRaw && entries.length === 1) {
    entries[0].description = normalize(descriptionRaw);
  }

  return {
    kind: "untranslated",
    pageUrl: normalize(pageUrl),
    entries: entries.filter((e) => e.english),
  };
}

function parseTranslationFix(issue) {
  const body = issue.body || "";
  const pageUrl = headingBody(body, "ページ URL（任意）") || headingBody(body, "ページ URL");
  const currentLines = splitLines(headingBody(body, "今の表示"));
  const proposedLines = splitLines(headingBody(body, "提案する訳"));
  const descriptionRaw = headingBody(body, "機能説明");

  const currentParsed = currentLines.map(parseArrowLine);
  const proposedParsed = proposedLines.map(parseArrowLine);
  const entries = [];

  if (proposedParsed.some(Boolean)) {
    for (let i = 0; i < proposedLines.length; i++) {
      const prop = proposedParsed[i];
      const cur = currentParsed[i];
      if (prop) {
        entries.push({
          english: prop.english,
          japanese: prop.japanese,
          description: "",
          previousJapanese: cur ? cur.japanese : "",
        });
      } else if (cur && proposedLines[i]) {
        entries.push({
          english: cur.english,
          japanese: normalize(proposedLines[i]),
          description: "",
          previousJapanese: cur.japanese,
        });
      }
    }
  } else if (currentParsed.some(Boolean) && proposedLines.length) {
    for (let i = 0; i < currentLines.length; i++) {
      const cur = currentParsed[i];
      if (!cur) continue;
      const ja =
        proposedLines.length === currentLines.length
          ? normalize(proposedLines[i])
          : proposedLines.length === 1
            ? normalize(proposedLines[0])
            : "";
      if (!ja) continue;
      entries.push({
        english: cur.english,
        japanese: ja,
        description: "",
        previousJapanese: cur.japanese,
      });
    }
  }

  if (descriptionRaw && entries.length === 1) {
    entries[0].description = normalize(descriptionRaw);
  }

  return {
    kind: "translation-fix",
    pageUrl: normalize(pageUrl),
    entries: entries.filter((e) => e.english && e.japanese),
  };
}

function parseTranslationIssue(issue) {
  if (issue.pull_request) return null;
  const kind = classifyIssue(issue);
  if (!kind) return null;
  const parsed = kind === "untranslated" ? parseUntranslated(issue) : parseTranslationFix(issue);
  parsed.issue = issue;
  parsed.number = issue.number;
  parsed.title = issue.title;
  return parsed;
}

module.exports = {
  headingBody,
  parseArrowLine,
  classifyIssue,
  parseTranslationIssue,
  UNTRANSLATED_TITLES,
  FIX_TITLES,
};
