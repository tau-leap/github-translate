#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { collectorSource } = require("./lib/collector-source");
const { isPlausibleUiString, normalize } = require("./lib/matching");
const { areaFromPath, pathnameOf } = require("./lib/sections");
const dictFile = require("./lib/dictionary-file");
const { collectTrackedKeys, isTracked } = require("./lib/dedupe");
const { parseScanArea, formatAutoPrMarker } = require("./lib/markers");
const { prepareEntry, applyPrepared, writeApplied } = require("./lib/apply-entries");
const github = require("./lib/github-api");
const gitPr = require("./lib/git-pr");
const { scanIssueBody, scanPullBody } = require("./lib/pr-body");

const BRANCH = "ght/auto-scan";
const ISSUE_TITLE = "[未訳] 自動スキャン";
const AUTH_PATHS = /^\/(settings|notifications|pulls|issues|new|codespaces)(\/|$)/;

function parseArgs(argv) {
  const args = {
    dryRun: process.env.GHT_DRY_RUN === "true" || process.env.GHT_DRY_RUN === "1",
    urls: [],
    maxPages: Number(process.env.GHT_MAX_PAGES) || 0,
    noPr: false,
    noIssue: false,
    html: "",
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--url" && argv[i + 1]) args.urls.push(argv[++i]);
    else if (a === "--max-pages" && argv[i + 1]) args.maxPages = Number(argv[++i]);
    else if (a === "--no-pr") args.noPr = true;
    else if (a === "--no-issue") args.noIssue = true;
    else if (a === "--html" && argv[i + 1]) args.html = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function readUrlList() {
  const file = process.env.GHT_SCAN_URLS_FILE || path.join(__dirname, "scan-urls.txt");
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function storageStatePath() {
  const raw = process.env.GHT_PLAYWRIGHT_STORAGE_STATE;
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    const dest = path.join(os.tmpdir(), "ght-playwright-storage-state.json");
    fs.writeFileSync(dest, trimmed);
    return dest;
  }
  if (fs.existsSync(trimmed)) return trimmed;
  return "";
}

function hasAuth() {
  return Boolean(storageStatePath());
}

function needsAuth(url) {
  const p = pathnameOf(url);
  return AUTH_PATHS.test(p);
}

function redirectedToLogin(requested, finalUrl) {
  let finalPath = "/";
  try {
    finalPath = new URL(finalUrl).pathname;
  } catch {
    return false;
  }
  if (finalPath.startsWith("/login") || finalPath.startsWith("/session")) {
    const req = pathnameOf(requested);
    return !req.startsWith("/login") && !req.startsWith("/signup");
  }
  return false;
}

function loadPlaywright() {
  const extra = [
    path.join(os.tmpdir(), "ght-playwright", "node_modules"),
    process.env.RUNNER_TEMP
      ? path.join(process.env.RUNNER_TEMP, "ght-playwright", "node_modules")
      : "",
  ].filter(Boolean);
  for (const dir of extra) {
    if (!module.paths.includes(dir)) module.paths.unshift(dir);
  }
  try {
    return require("playwright");
  } catch {
    const err = new Error(
      "Playwright がありません。CI ではワークフローがインストールします。ローカルでは:\n  mkdir -p /tmp/ght-playwright && cd /tmp/ght-playwright && npm init -y && npm install playwright && npx playwright install chromium"
    );
    err.code = "NO_PLAYWRIGHT";
    throw err;
  }
}

async function collectPage(page, source, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("header, [role='banner'], nav, body", { timeout: 15000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));
  const title = await page.title();
  if (/just a moment|unusual traffic|rate limit|unverified/i.test(title)) {
    return { blocked: true, title, items: [] };
  }
  const items = await page.evaluate((src) => {
    return new Function(`${src}\nreturn ghtCollectCandidates();`)();
  }, source);
  return { blocked: false, title, items: items || [], finalUrl: page.url() };
}

function checkJs(file) {
  execFileSync("node", ["--check", file], { stdio: "pipe" });
}

function findTrackingIssue(issues) {
  return (
    issues.find((i) => String(i.title || "").startsWith(ISSUE_TITLE)) ||
    issues.find((i) => parseScanArea(i.body)) ||
    null
  );
}

function isScanTrackingIssue(issue) {
  return Boolean(
    issue &&
      (String(issue.title || "").startsWith(ISSUE_TITLE) || parseScanArea(issue.body))
  );
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage: node scripts/scan-pages.js [--dry-run] [--url URL] [--html file.html] [--no-pr] [--no-issue]

拡張機能と同じセレクタ／除外ルールで github.com をスキャンし、
辞書に無い UI 文言の Issue と（確度の高い訳があれば）PR を作ります。`);
    return;
  }

  const dictionary = dictFile.loadMap("dictionary");
  let issues = [];
  let pulls = [];
  try {
    issues = await github.listOpenIssues();
    pulls = await github.listOpenPulls();
  } catch (err) {
    console.warn(`GitHub API を読めませんでした（${err.message}）。辞書との重複だけを見ます。`);
  }
  const ownPull = pulls.find((p) => p.head && p.head.ref === BRANCH);
  const tracking = findTrackingIssue(issues);
  const tracked = collectTrackedKeys({
    dictionary,
    issues: issues.filter((i) => !isScanTrackingIssue(i)),
    pulls: pulls.filter((p) => !ownPull || p.number !== ownPull.number),
  });

  const source = collectorSource();
  const playwright = loadPlaywright();
  const state = storageStatePath();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "en-US",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    ...(state ? { storageState: state } : {}),
  });
  const page = await context.newPage();

  const urls = args.html
    ? ["file://" + path.resolve(args.html)]
    : args.urls.length
      ? args.urls
      : readUrlList();
  const limited = args.maxPages > 0 ? urls.slice(0, args.maxPages) : urls;

  const found = [];
  const skippedPages = [];
  try {
    for (const url of limited) {
      if (!args.html && needsAuth(url) && !hasAuth()) {
        skippedPages.push({ url, reason: "needs-auth" });
        continue;
      }
      try {
        const result = await collectPage(page, source, url);
        if (result.blocked) {
          skippedPages.push({ url, reason: "blocked", title: result.title });
          continue;
        }
        if (!args.html && redirectedToLogin(url, result.finalUrl)) {
          skippedPages.push({ url, reason: "login-redirect" });
          continue;
        }
        const pageUrl = args.html ? url : result.finalUrl || url;
        for (const item of result.items) {
          const text = normalize(item.text);
          if (!isPlausibleUiString(text)) continue;
          if (isTracked(text, tracked) && dictionary[text]) continue;
          found.push({
            english: text,
            source: item.source,
            tag: item.tag,
            role: item.role,
            pageUrl,
            area: areaFromPath(pathnameOf(pageUrl)),
          });
        }
      } catch (err) {
        skippedPages.push({ url, reason: "error", message: err.message });
      }
    }
  } finally {
    await browser.close();
  }

  const unique = [];
  const seen = new Set();
  for (const item of found) {
    if (seen.has(item.english)) continue;
    seen.add(item.english);
    unique.push(item);
  }

  const missing = unique.filter((item) => !dictionary[item.english]);
  const reportItems = missing.filter((item) => !isTracked(item.english, tracked));

  const urlGroups = new Map();
  for (const item of reportItems) {
    if (!urlGroups.has(item.pageUrl)) urlGroups.set(item.pageUrl, []);
    urlGroups.get(item.pageUrl).push(item.english);
  }

  const maxEntries = Number(process.env.GHT_MAX_ENTRIES) || 40;
  const prepared = [];
  for (const item of reportItems) {
    if (prepared.length >= maxEntries) break;
    const ready = prepareEntry(
      { english: item.english, japanese: "", pageUrl: item.pageUrl },
      dictionary,
      { kind: "untranslated", requireHighConfidence: true }
    );
    if (ready.skip) continue;
    prepared.push(ready);
    dictionary[ready.english] = ready.japanese;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun: args.dryRun,
        pages: limited.length,
        skippedPages,
        found: unique.length,
        missing: missing.length,
        report: reportItems.length,
        prCandidates: prepared.length,
        sample: reportItems.slice(0, 12).map((i) => i.english),
      },
      null,
      2
    )
  );

  if (args.dryRun) {
    return;
  }

  if (!reportItems.length && !prepared.length) {
    console.log("新しい未訳はありません。");
    return;
  }

  await github.ensureLabel("untranslated", "0E8A16", "未訳の報告");
  await github.ensureLabel("auto-translation", "BFDADC", "自動化が作った翻訳 Issue / PR");

  let issue = tracking;
  if (!args.noIssue && reportItems.length) {
    const body = scanIssueBody({
      urlGroups,
      keys: reportItems.map((i) => i.english),
      area: "all",
    });
    const title = `${ISSUE_TITLE}: ${reportItems.length} 件`;
    if (issue) {
      issue = await github.updateIssue(issue.number, { title, body, labels: ["untranslated", "auto-translation"] });
    } else {
      issue = await github.createIssue({
        title,
        body,
        labels: ["untranslated", "auto-translation"],
      });
    }
    console.log(`Issue: ${issue.html_url}`);
  }

  if (args.noPr || !prepared.length) {
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## UI スキャン\n\n- 未訳 ${reportItems.length} 件\n- Issue: ${issue ? issue.html_url : "なし"}\n- PR: 確度の高い訳が無いため未作成\n`
      );
    }
    return;
  }

  gitPr.checkoutBranch(BRANCH);
  const applied = applyPrepared(prepared);
  writeApplied(applied);
  checkJs(dictFile.dictionaryPath("dictionary"));
  const committed = gitPr.commit("スキャンで見つかった未訳 UI を辞書に追加", [
    "src/locales/ja/dictionary.js",
  ]);
  if (!committed) {
    console.log("辞書ファイルに差分がありません。");
    return;
  }
  gitPr.pushForceLease(BRANCH);

  const body = scanPullBody({
    added: applied.added,
    issueNumber: issue && issue.number,
    urls: [...urlGroups.keys()],
  });
  const title = `辞書: UI スキャンから ${applied.added.length} 件を追加`;
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

  if (issue) {
    try {
      await github.commentOnIssue(
        issue.number,
        `スキャン結果の辞書 PR: #${pull.number}\n${formatAutoPrMarker(pull.number)}`
      );
    } catch (err) {
      console.warn(`Issue #${issue.number} へのコメントに失敗: ${err.message}`);
    }
  }

  console.log(`PR: ${pull.html_url}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## UI スキャン\n\n- 未訳 ${reportItems.length} 件\n- Issue: ${issue ? issue.html_url : "なし"}\n- PR: ${pull.html_url}\n`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
