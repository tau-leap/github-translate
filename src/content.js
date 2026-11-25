/* global ghtAnnotate, ghtClearAnnotations, ghtInitTooltips, ghtHideTip, ghtApplyLocale, ghtApplyAnnotStyle, ghtIsLocaleEnabled, GHT_LOCALE, GHT_STORAGE_KEY, GHT_DEFAULT_LOCALE, GHT_ANNOT_COLOR, GHT_ANNOT_COLOR_KEY, GHT_ANNOT_COLOR_DEFAULT, GHT_ANNOT_OPACITY, GHT_ANNOT_OPACITY_KEY, GHT_ANNOT_OPACITY_DEFAULT, GHT_MSG_REPORT_CONTEXT */

(function initGitHubTranslator() {
  const pending = new Set();
  let scheduled = false;
  let started = false;

  function flush() {
    scheduled = false;
    if (!ghtIsLocaleEnabled(GHT_LOCALE)) {
      pending.clear();
      return;
    }
    const roots = Array.from(pending);
    pending.clear();
    for (const root of roots) {
      if (root.nodeType === Node.TEXT_NODE) {
        if (root.isConnected) ghtAnnotate(root);
        continue;
      }
      if (root.nodeType === Node.ELEMENT_NODE && !root.isConnected) continue;
      ghtAnnotate(root);
    }
  }

  function queue(node) {
    if (!node || !ghtIsLocaleEnabled(GHT_LOCALE)) return;
    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("ght-annot")) {
      return;
    }
    pending.add(node);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(flush);
  }

  function observe() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains("ght-annot") || node.closest(".ght-annot")) {
              continue;
            }
            queue(node);
          } else if (node.nodeType === Node.TEXT_NODE) {
            queue(node);
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function applyLocale(locale) {
    ghtApplyLocale(locale);
    if (typeof ghtHideTip === "function") ghtHideTip();
    ghtClearAnnotations();
    if (ghtIsLocaleEnabled(GHT_LOCALE)) {
      ghtAnnotate(document.body || document.documentElement);
    }
  }

  function start() {
    if (started) return;
    started = true;

    chrome.storage.sync.get(
      {
        [GHT_STORAGE_KEY]: GHT_DEFAULT_LOCALE,
        [GHT_ANNOT_COLOR_KEY]: GHT_ANNOT_COLOR_DEFAULT,
        [GHT_ANNOT_OPACITY_KEY]: GHT_ANNOT_OPACITY_DEFAULT,
      },
      (result) => {
        ghtApplyAnnotStyle(result[GHT_ANNOT_COLOR_KEY], result[GHT_ANNOT_OPACITY_KEY]);
        applyLocale(result[GHT_STORAGE_KEY]);
        ghtInitTooltips();
        observe();
      }
    );

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync") return;
      if (changes[GHT_ANNOT_COLOR_KEY] || changes[GHT_ANNOT_OPACITY_KEY]) {
        const color = changes[GHT_ANNOT_COLOR_KEY]
          ? changes[GHT_ANNOT_COLOR_KEY].newValue
          : GHT_ANNOT_COLOR;
        const opacity = changes[GHT_ANNOT_OPACITY_KEY]
          ? changes[GHT_ANNOT_OPACITY_KEY].newValue
          : GHT_ANNOT_OPACITY;
        ghtApplyAnnotStyle(color, opacity);
      }
      if (changes[GHT_STORAGE_KEY]) {
        applyLocale(changes[GHT_STORAGE_KEY].newValue);
      }
    });
  }

  // リポジトリ配下なら /owner/repo を除いたパス（例: /settings）にする。
  // サイト共通ページはそのまま（例: /notifications）。owner/repo 名を Issue に載せないため。
  const GHT_SITE_PATH_ROOTS = new Set([
    "settings",
    "notifications",
    "issues",
    "pulls",
    "search",
    "marketplace",
    "sponsors",
    "orgs",
    "organizations",
    "account",
    "login",
    "logout",
    "signup",
    "sessions",
    "new",
    "topics",
    "collections",
    "explore",
    "features",
    "pricing",
    "about",
    "security",
    "customer-stories",
    "enterprise",
    "github-copilot",
    "codespaces",
    "copilot",
  ]);

  function reportPagePath() {
    const search = location.search || "";
    const match = location.pathname.match(/^\/([^/]+)\/([^/]+)(\/.*)?$/);
    if (match && !GHT_SITE_PATH_ROOTS.has(match[1])) {
      return (match[3] || "/") + search;
    }
    return (location.pathname || "/") + search;
  }

  // ポップアップの「未訳を報告」から、表示中のページパスと選択テキストを問い合わせる。
  // 値はポップアップに返すだけで、どこにも送信しない（Issue 画面を開くのはユーザー操作）。
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== GHT_MSG_REPORT_CONTEXT) return;
    const selection = window.getSelection ? String(window.getSelection() || "") : "";
    sendResponse({
      url: reportPagePath(),
      selection: selection.replace(/\s+/g, " ").trim().slice(0, 500),
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
