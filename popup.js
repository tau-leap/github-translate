/* global GHT_STORAGE_KEY, GHT_DEFAULT_LOCALE, GHT_LOCALE_OPTIONS, GHT_REPO_URL, GHT_MSG_REPORT_CONTEXT */

(function initPopup() {
  const select = document.getElementById("locale");
  if (!select) return;

  for (const option of GHT_LOCALE_OPTIONS) {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    select.appendChild(el);
  }

  chrome.storage.sync.get({ [GHT_STORAGE_KEY]: GHT_DEFAULT_LOCALE }, (result) => {
    const value = result[GHT_STORAGE_KEY];
    const allowed = GHT_LOCALE_OPTIONS.some((option) => option.value === value);
    select.value = allowed ? value : GHT_DEFAULT_LOCALE;
  });

  select.addEventListener("change", () => {
    chrome.storage.sync.set({ [GHT_STORAGE_KEY]: select.value });
  });
})();

(function initReport() {
  // 追加の権限は使わない:
  // - tabs.query の結果は tab.id のみ使う（url は tabs 権限なしでは読めない）
  // - ページ URL と選択テキストは github.com 上の content script から受け取る
  // - tabs.create は権限不要
  function getContext(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || tab.id == null) {
        callback({});
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: GHT_MSG_REPORT_CONTEXT }, (response) => {
        // github.com 以外のタブでは content script が無いのでエラーになる
        if (chrome.runtime.lastError || !response) {
          callback({});
          return;
        }
        callback(response);
      });
    });
  }

  function truncate(text, max) {
    const value = String(text || "");
    return value.length > max ? value.slice(0, max - 1) + "…" : value;
  }

  function openIssue(kind) {
    getContext((context) => {
      const pageUrl = context.url || "";
      const selection = context.selection || "";
      const params = new URLSearchParams();
      if (kind === "fix") {
        params.set("template", "translation-fix.yml");
        params.set("title", selection ? `[訳の修正] ${truncate(selection, 60)}` : "[訳の修正] ");
        if (pageUrl) params.set("page_url", pageUrl);
        if (selection) params.set("current", selection);
      } else {
        params.set("template", "untranslated.yml");
        params.set("title", selection ? `[未訳] ${truncate(selection, 60)}` : "[未訳] ");
        if (pageUrl) params.set("page_url", pageUrl);
        if (selection) params.set("english_text", selection);
      }
      chrome.tabs.create({ url: `${GHT_REPO_URL}/issues/new?${params.toString()}` });
      window.close();
    });
  }

  const untranslated = document.getElementById("report-untranslated");
  const fix = document.getElementById("report-fix");
  if (untranslated) untranslated.addEventListener("click", () => openIssue("untranslated"));
  if (fix) fix.addEventListener("click", () => openIssue("fix"));
})();
