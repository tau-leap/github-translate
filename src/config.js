/* global GHT_LOCALE, GHT_DEFAULT_LOCALE, GHT_STORAGE_KEY, GHT_LOCALE_OPTIONS, GHT_ANNOT_COLOR, GHT_ANNOT_COLOR_KEY, GHT_ANNOT_COLOR_DEFAULT, GHT_ANNOT_COLOR_OPTIONS, GHT_ANNOT_OPACITY, GHT_ANNOT_OPACITY_KEY, GHT_ANNOT_OPACITY_DEFAULT, GHT_ANNOT_OPACITY_MIN, GHT_ANNOT_OPACITY_MAX, ghtFormatTitleSuffix, ghtIsLocaleEnabled, ghtNormalizeAnnotColor, ghtClampAnnotOpacity, ghtApplyAnnotStyle */

/** chrome.storage に保存する言語設定のキー */
var GHT_STORAGE_KEY = "ghtLocale";

/** chrome.storage に保存する注釈色のキー */
var GHT_ANNOT_COLOR_KEY = "ghtAnnotColor";

/** chrome.storage に保存する注釈の濃さ（opacity）のキー */
var GHT_ANNOT_OPACITY_KEY = "ghtAnnotOpacity";

/** 未設定時の言語（日本語） */
var GHT_DEFAULT_LOCALE = "ja";

/** 注釈色のデフォルト（パレット中央の黒系） */
var GHT_ANNOT_COLOR_DEFAULT = "#656d76";

/** 注釈の濃さのデフォルト（従来の見た目） */
var GHT_ANNOT_OPACITY_DEFAULT = 0.65;

/** 注釈の濃さの下限・上限 */
var GHT_ANNOT_OPACITY_MIN = 0.2;
var GHT_ANNOT_OPACITY_MAX = 1;

/** ポップアップで選べる言語（value は locales のコード、または off） */
var GHT_LOCALE_OPTIONS = [
  { value: "ja", label: "日本語" },
  { value: "off", label: "なし" },
];

/** ポップアップの注釈色パレット（中央のブラックがデフォルト） */
var GHT_ANNOT_COLOR_OPTIONS = [
  { value: "#0969da", label: "ブルー" },
  { value: "#1a7f37", label: "グリーン" },
  { value: "#9a6700", label: "アンバー" },
  { value: "#656d76", label: "ブラック" },
  { value: "#cf222e", label: "レッド" },
  { value: "#8250df", label: "パープル" },
  { value: "#bf3989", label: "ピンク" },
];

/** 実行中の言語コード（storage から上書きされる） */
var GHT_LOCALE = GHT_DEFAULT_LOCALE;

/** 実行中の注釈色（storage から上書きされる） */
var GHT_ANNOT_COLOR = GHT_ANNOT_COLOR_DEFAULT;

/** 実行中の注釈の濃さ（storage から上書きされる） */
var GHT_ANNOT_OPACITY = GHT_ANNOT_OPACITY_DEFAULT;

function ghtNormalizeAnnotColor(color) {
  var value = color == null ? GHT_ANNOT_COLOR : color;
  // 旧「継承」設定は中央の黒系に寄せる
  if (!value || value === "default") return GHT_ANNOT_COLOR_DEFAULT;
  var allowed = GHT_ANNOT_COLOR_OPTIONS.some(function (option) {
    return option.value === value;
  });
  return allowed ? value : GHT_ANNOT_COLOR_DEFAULT;
}

function ghtClampAnnotOpacity(opacity) {
  var value = Number(opacity);
  if (!Number.isFinite(value)) return GHT_ANNOT_OPACITY_DEFAULT;
  if (value < GHT_ANNOT_OPACITY_MIN) return GHT_ANNOT_OPACITY_MIN;
  if (value > GHT_ANNOT_OPACITY_MAX) return GHT_ANNOT_OPACITY_MAX;
  return Math.round(value * 100) / 100;
}

function ghtApplyAnnotStyle(color, opacity) {
  GHT_ANNOT_COLOR = ghtNormalizeAnnotColor(color == null ? GHT_ANNOT_COLOR : color);
  GHT_ANNOT_OPACITY = ghtClampAnnotOpacity(
    opacity == null ? GHT_ANNOT_OPACITY : opacity
  );

  var root = document.documentElement;
  if (!root || !root.style) return;

  root.style.setProperty("--ght-annot-opacity", String(GHT_ANNOT_OPACITY));
  root.style.setProperty("--ght-annot-color", GHT_ANNOT_COLOR);
}

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
