/* global GHT_LOCALE_DICTIONARY, GHT_LOCALE_DESCRIPTIONS, GHT_DICTIONARY, GHT_DESCRIPTIONS, GHT_LOCALE, GHT_DEFAULT_LOCALE, ghtIsLocaleEnabled, ghtApplyLocale */

var GHT_LOCALES = {
  ja: {
    dictionary: typeof GHT_LOCALE_DICTIONARY !== "undefined" ? GHT_LOCALE_DICTIONARY : {},
    descriptions: typeof GHT_LOCALE_DESCRIPTIONS !== "undefined" ? GHT_LOCALE_DESCRIPTIONS : {},
  },
};

var GHT_DICTIONARY = {};
var GHT_DESCRIPTIONS = {};

function ghtApplyLocale(locale) {
  GHT_LOCALE = locale || GHT_DEFAULT_LOCALE;
  if (!ghtIsLocaleEnabled(GHT_LOCALE) || !GHT_LOCALES[GHT_LOCALE]) {
    GHT_DICTIONARY = {};
    GHT_DESCRIPTIONS = {};
    return;
  }
  var pack = GHT_LOCALES[GHT_LOCALE];
  GHT_DICTIONARY = pack.dictionary || {};
  GHT_DESCRIPTIONS = pack.descriptions || {};
}

ghtApplyLocale(GHT_DEFAULT_LOCALE);
