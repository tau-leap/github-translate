"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parseTranslationIssue, classifyIssue } = require("./parse-issue");

describe("classifyIssue", () => {
  it("ignores bug reports", () => {
    assert.equal(classifyIssue({ title: "[不具合] 二重訳", labels: ["bug"] }), null);
    assert.equal(classifyIssue({ title: "random", labels: [] }), null);
  });

  it("accepts untranslated and translation-fix", () => {
    assert.equal(classifyIssue({ title: "[未訳] Foo", labels: [] }), "untranslated");
    assert.equal(
      classifyIssue({ title: "hello", labels: [{ name: "translation-fix" }] }),
      "translation-fix"
    );
  });
});

describe("parseTranslationIssue", () => {
  it("parses untranslated form fields and optional suggestion", () => {
    const parsed = parseTranslationIssue({
      number: 12,
      title: "[未訳] New pull request",
      labels: ["untranslated"],
      body: `### ページ URL

https://github.com/cli/cli/issues

### 英語の文言

New pull request
Close issue

### 訳の案（任意）

新しいプルリクエスト
課題を閉じる
`,
    });
    assert.equal(parsed.kind, "untranslated");
    assert.equal(parsed.pageUrl, "https://github.com/cli/cli/issues");
    assert.deepEqual(
      parsed.entries.map((e) => [e.english, e.japanese]),
      [
        ["New pull request", "新しいプルリクエスト"],
        ["Close issue", "課題を閉じる"],
      ]
    );
  });

  it("parses translation-fix arrows", () => {
    const parsed = parseTranslationIssue({
      number: 4,
      title: "[訳の修正] Blame",
      labels: ["translation-fix"],
      body: `### 今の表示

Blame → 責任者

### 提案する訳

Blame → 行ごとの変更履歴
`,
    });
    assert.equal(parsed.kind, "translation-fix");
    assert.equal(parsed.entries[0].english, "Blame");
    assert.equal(parsed.entries[0].japanese, "行ごとの変更履歴");
  });

  it("skips pull requests returned by the issues API", () => {
    assert.equal(
      parseTranslationIssue({
        title: "[未訳] x",
        labels: ["untranslated"],
        pull_request: { url: "https://api.github.com/repos/x/y/pulls/1" },
        body: "### 英語の文言\n\nHello",
      }),
      null
    );
  });

  it("treats _No response_ as empty suggestion", () => {
    const parsed = parseTranslationIssue({
      number: 1,
      title: "[未訳] Hello",
      labels: ["untranslated"],
      body: `### 英語の文言

Hello world

### 訳の案（任意）

_No response_
`,
    });
    assert.equal(parsed.entries[0].english, "Hello world");
    assert.equal(parsed.entries[0].japanese, "");
  });
});
