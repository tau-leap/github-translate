/* 拡張の selectors.js / annotate.js と同じスコープで評価される収集関数。
   Playwright の page.evaluate 内 new Function() から呼ばれる。 */
/* global ghtCollectTargets, ghtNormalize, ghtShouldSkipTextNode, ghtIsDenied, ghtIsAllowed, GHT_SKIP_TAGS, GHT_DENY_SELECTOR */

function ghtCollectFromRoot(root, out, seen) {
  if (!root || typeof ghtCollectTargets !== "function") return;
  const targets = ghtCollectTargets(root);
  for (const el of targets) {
    if (!el) continue;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (typeof ghtNormalize !== "function" || !ghtNormalize(node.textContent)) {
          return NodeFilter.FILTER_REJECT;
        }
        const parent = node.parentElement;
        if (!parent || (GHT_SKIP_TAGS && GHT_SKIP_TAGS.has(parent.tagName))) {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.classList && parent.classList.contains("ght-annot")) {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.closest && typeof GHT_DENY_SELECTOR === "string" && parent.closest(GHT_DENY_SELECTOR)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let current = walker.nextNode();
    while (current) {
      if (typeof ghtShouldSkipTextNode !== "function" || !ghtShouldSkipTextNode(current)) {
        const text = ghtNormalize(current.textContent);
        if (text && !seen.has("t:" + text)) {
          seen.add("t:" + text);
          const parent = current.parentElement;
          out.push({
            text,
            source: "text",
            tag: parent ? parent.tagName : "",
            role: parent && parent.getAttribute ? parent.getAttribute("role") || "" : "",
          });
        }
      }
      current = walker.nextNode();
    }

    if (el.hasAttribute && el.hasAttribute("aria-label")) {
      if (
        (typeof ghtIsDenied !== "function" || !ghtIsDenied(el)) &&
        (typeof ghtIsAllowed !== "function" || ghtIsAllowed(el))
      ) {
        const text = ghtNormalize(el.getAttribute("aria-label"));
        if (text && !seen.has("a:" + text)) {
          seen.add("a:" + text);
          out.push({
            text,
            source: "aria-label",
            tag: el.tagName || "",
            role: el.getAttribute("role") || "",
          });
        }
      }
    }
  }
}

function ghtCollectCandidates() {
  const out = [];
  const seen = new Set();
  const root = document.body || document.documentElement;
  ghtCollectFromRoot(root, out, seen);
  if (root && root.querySelectorAll) {
    for (const el of root.querySelectorAll("*")) {
      if (!el.shadowRoot) continue;
      if (typeof ghtIsDenied === "function" && ghtIsDenied(el)) continue;
      ghtCollectFromRoot(el.shadowRoot, out, seen);
    }
  }
  return out;
}
