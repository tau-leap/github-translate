/* global GHT_LOCALE, GHT_DEFAULT_LOCALE, GHT_STORAGE_KEY, GHT_LOCALE_OPTIONS, ghtFormatTitleSuffix, ghtIsLocaleEnabled */

/** chrome.storage に保存する言語設定のキー */
var GHT_STORAGE_KEY = "ghtLocale";

/** 未設定時の言語（日本語） */
var GHT_DEFAULT_LOCALE = "ja";

/** ポップアップで選べる言語（value は locales のコード、または off） */
var GHT_LOCALE_OPTIONS = [
  { value: "ja", label: "日本語" },
  { value: "off", label: "なし" },
];

/** 実行中の言語コード（storage から上書きされる） */
var GHT_LOCALE = GHT_DEFAULT_LOCALE;

function ghtIsLocaleEnabled(locale) {
  var code = locale == null ? GHT_LOCALE : locale;
  return Boolean(code) && code !== "off";
}

function ghtFormatTitleSuffix(original, translation) {
  if (GHT_LOCALE === "ja") {
    return `${original}（${translation}）`;
  }
  return `${original} (${translation})`;
}

/** ソースリポジトリ（未訳の報告・訳の修正提案の送り先） */
var GHT_REPO_URL = "https://github.com/tau-leap/github-translate";

/** popup → content script の問い合わせ種別 */
var GHT_MSG_REPORT_CONTEXT = "ght:report-context";
