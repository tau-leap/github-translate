/* global ghtAnnotate, ghtClearAnnotations, ghtInitTooltips, ghtHideTip, ghtApplyLocale, ghtIsLocaleEnabled, GHT_LOCALE, GHT_STORAGE_KEY, GHT_DEFAULT_LOCALE, GHT_MSG_REPORT_CONTEXT */

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

    chrome.storage.sync.get({ [GHT_STORAGE_KEY]: GHT_DEFAULT_LOCALE }, (result) => {
      applyLocale(result[GHT_STORAGE_KEY]);
      ghtInitTooltips();
      observe();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync" || !changes[GHT_STORAGE_KEY]) return;
      applyLocale(changes[GHT_STORAGE_KEY].newValue);
    });
  }

  // ポップアップの「未訳を報告」から、表示中のページ URL と選択テキストを問い合わせる。
  // 値はポップアップに返すだけで、どこにも送信しない（Issue 画面を開くのはユーザー操作）。
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.type !== GHT_MSG_REPORT_CONTEXT) return;
    const selection = window.getSelection ? String(window.getSelection() || "") : "";
    sendResponse({
      url: location.origin + location.pathname + location.search,
      selection: selection.replace(/\s+/g, " ").trim().slice(0, 500),
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
