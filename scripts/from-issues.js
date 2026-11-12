#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const { parseTranslationIssue } = require("./lib/parse-issue");
const { parseAutoPrNumber } = require("./lib/markers");
const { collectTrackedKeys, isTracked } = require("./lib/dedupe");
const dictFile = require("./lib/dictionary-file");
const { prepareEntry, applyPrepared, writeApplied } = require("./lib/apply-entries");
const github = require("./lib/github-api");
const gitPr = require("./lib/git-pr");
const { fromIssuesBody } = require("./lib/pr-body");

const BRANCH = "ght/auto-from-issues";
const MAX_DEFAULT = 40;

function parseArgs(argv) {
  const args = { dryRun: process.env.GHT_DRY_RUN === "true" || process.env.GHT_DRY_RUN === "1", max: Number(process.env.GHT_MAX_ENTRIES) || MAX_DEFAULT };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--max" && argv[i + 1]) args.max = Number(argv[++i]);
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function checkJs(file) {
  execFileSync("node", ["--check", file], { stdio: "pipe" });
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage: node scripts/from-issues.js [--dry-run] [--max N]

Open translation-report issues を読み、dictionary.js（必要なら descriptions.js）を
更新する Pull Request を 1 本にまとめます。不具合報告は無視します。`);
    return;
  }

  const dictionary = dictFile.loadMap("dictionary");
  const issues = await github.listOpenIssues();
  const pulls = await github.listOpenPulls();
  const ownPull = pulls.find((p) => p.head && p.head.ref === BRANCH);
  const tracked = collectTrackedKeys({
    dictionary,
    issues: [],
    pulls: pulls.filter((p) => !ownPull || p.number !== ownPull.number),
  });

  const prepared = [];
  const skipped = [];
  const issueNumbers = new Set();

  for (const issue of issues) {
    const parsed = parseTranslationIssue(issue);
    if (!parsed) continue;
    const linkedPr = parseAutoPrNumber(issue.body);
    if (linkedPr && pulls.some((p) => p.number === linkedPr)) {
      skipped.push({ issue: issue.number, reason: "already-has-open-pr" });
      continue;
    }

    let used = 0;
    for (const entry of parsed.entries) {
      if (parsed.kind === "untranslated" && isTracked(entry.english, tracked) && dictionary[entry.english]) {
        skipped.push({ issue: issue.number, english: entry.english, reason: "already-in-dictionary" });
        continue;
      }
      if (parsed.kind === "untranslated" && isTracked(entry.english, tracked) && !entry.japanese) {
        skipped.push({ issue: issue.number, english: entry.english, reason: "already-tracked" });
        continue;
      }
      const ready = prepareEntry(
        { ...entry, pageUrl: parsed.pageUrl, issueNumber: issue.number },
        dictionary,
        {
          kind: parsed.kind,
          requireHighConfidence: parsed.kind === "untranslated" && !entry.japanese,
        }
      );
      if (ready.skip) {
        skipped.push({ issue: issue.number, english: entry.english, reason: ready.skip });
        continue;
      }
      if (prepared.length >= args.max) break;
      prepared.push(ready);
      dictionary[ready.english] = ready.japanese;
      used++;
    }
    if (used) issueNumbers.add(issue.number);
    if (prepared.length >= args.max) break;
  }

  const summary = {
    prepared: prepared.length,
    skipped: skipped.length,
    issues: [...issueNumbers],
  };
  console.log(JSON.stringify({ ok: true, dryRun: args.dryRun, ...summary, sample: prepared.slice(0, 8) }, null, 2));

  if (!prepared.length) {
    console.log("更新する辞書エントリはありません。");
    return;
  }

  const applied = applyPrepared(prepared);
  if (args.dryRun) {
    console.log(`dry-run: dictionary +${applied.added.length} ~${applied.replaced.length} / descriptions ${applied.descChanged.length}`);
    return;
  }

  gitPr.checkoutBranch(BRANCH);
  writeApplied(applied);
  checkJs(dictFile.dictionaryPath("dictionary"));
  if (applied.descChanged.length) checkJs(dictFile.dictionaryPath("descriptions"));

  const paths = ["src/locales/ja/dictionary.js"];
  if (applied.descChanged.length) paths.push("src/locales/ja/descriptions.js");
  const committed = gitPr.commit("翻訳 Issue から日本語辞書を更新", paths);
  if (!committed) {
    console.log("ファイルに差分がありません。");
    return;
  }
  gitPr.pushForceLease(BRANCH);

  await github.ensureLabel("untranslated", "0E8A16", "未訳の報告");
  await github.ensureLabel("translation-fix", "1D76DB", "訳の修正提案");

  const body = fromIssuesBody({
    added: applied.added,
    replaced: applied.replaced,
    descChanged: applied.descChanged,
    issueNumbers: [...issueNumbers],
  });
  const title = `辞書: 翻訳 Issue から ${applied.added.length + applied.replaced.length} 件を反映`;
  let pull = await github.findOpenPullByHead(BRANCH);
  if (pull) {
    pull = await github.updatePull(pull.number, { title, body });
  } else {
    pull = await github.createPull({
      title,
      body,
      head: BRANCH,
      base: gitPr.defaultBaseBranch(),
    });
  }

  const { formatAutoPrMarker } = require("./lib/markers");
  for (const number of issueNumbers) {
    try {
      await github.commentOnIssue(
        number,
        `辞書の更新 Pull Request を作りました: #${pull.number}\n${formatAutoPrMarker(pull.number)}`
      );
    } catch (err) {
      console.warn(`Issue #${number} へのコメントに失敗: ${err.message}`);
    }
  }

  console.log(`PR: ${pull.html_url}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const fs = require("node:fs");
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## 翻訳 Issue → PR\n\n- PR: ${pull.html_url}\n- 追加 ${applied.added.length} / 修正 ${applied.replaced.length}\n`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
