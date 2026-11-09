/* global GHT_DICTIONARY, GHT_ALLOW_SELECTOR, GHT_DENY_SELECTOR, GHT_SETTINGS_PATH_PATTERN, GHT_SETTINGS_CONTENT_SELECTOR, GHT_REPO_TAB_PATH_PATTERN, GHT_REPO_TAB_CONTENT_SELECTOR, ghtFormatTitleSuffix */

const GHT_SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
  "CODE",
  "PRE",
  "KBD",
  "SAMP",
  "SVG",
  "MATH",
]);

function ghtNormalize(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function ghtIsDenied(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  return Boolean(el.closest(GHT_DENY_SELECTOR));
}

function ghtIsSettingsPage() {
  return GHT_SETTINGS_PATH_PATTERN.test(window.location.pathname);
}

function ghtIsSettingsContent(el) {
  return ghtIsSettingsPage() && Boolean(el.closest(GHT_SETTINGS_CONTENT_SELECTOR));
}

function ghtIsRepoTabPage() {
  return GHT_REPO_TAB_PATH_PATTERN.test(window.location.pathname);
}

function ghtIsRepoTabContent(el) {
  return ghtIsRepoTabPage() && Boolean(el.closest(GHT_REPO_TAB_CONTENT_SELECTOR));
}

function ghtIsAllowed(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  if (ghtIsDenied(el)) return false;
  if (el.closest(GHT_ALLOW_SELECTOR)) return true;
  return ghtIsSettingsContent(el) || ghtIsRepoTabContent(el);
}

function ghtFindTruncateContainer(el) {
  let node = el;
  while (node && node.nodeType === Node.ELEMENT_NODE) {
    if (
      node.matches(
        "[class*='Truncate'], .css-truncate, .css-truncate-target, .text-overflow"
      )
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function ghtHasNearbyAnnotation(textNode) {
  const truncate = ghtFindTruncateContainer(textNode);
  if (truncate) {
    const next = truncate.nextElementSibling;
    if (next && next.classList.contains("ght-annot")) return true;
  }

  const next = textNode.nextSibling;
  if (
    next &&
    next.nodeType === Node.ELEMENT_NODE &&
    next.classList.contains("ght-annot")
  ) {
    return true;
  }
  return false;
}

function ghtShouldSkipTextNode(textNode) {
  const parent = textNode.parentElement;
  if (!parent) return true;
  if (GHT_SKIP_TAGS.has(parent.tagName)) return true;
  if (parent.classList.contains("ght-annot")) return true;
  if (parent.isContentEditable) return true;
  if (!ghtIsAllowed(parent)) return true;
  if (ghtHasNearbyAnnotation(textNode)) return true;
  return false;
}

function ghtInsertAnnotation(textNode, translation) {
  const span = document.createElement("span");
  span.className = "ght-annot";
  span.setAttribute("aria-hidden", "true");
  span.setAttribute("data-ght-annot", "");
  span.textContent = translation;

  const truncate = ghtFindTruncateContainer(textNode);
  if (truncate) {
    truncate.insertAdjacentElement("afterend", span);
    return;
  }

  textNode.parentElement.insertBefore(span, textNode.nextSibling);
}

function ghtAnnotateTextNode(textNode) {
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
  const key = ghtNormalize(textNode.textContent);
  if (!key) return;
  const translation = GHT_DICTIONARY[key];
  if (!translation) return;
  if (ghtShouldSkipTextNode(textNode)) return;
  ghtInsertAnnotation(textNode, translation);
}

function ghtAnnotateAria(el) {
  if (!el.hasAttribute("aria-label")) return;
  if (el.hasAttribute("data-ght-aria")) return;
  const key = ghtNormalize(el.getAttribute("aria-label"));
  const translation = GHT_DICTIONARY[key];
  if (!translation) return;
  if (ghtIsDenied(el) || !ghtIsAllowed(el)) return;

  if (el.querySelector(":scope > .ght-annot")) return;

  if (!el.hasAttribute("data-ght-original-title")) {
    el.setAttribute("data-ght-original-title", el.getAttribute("title") || "");
  }

  const currentTitle = el.getAttribute("title");
  if (!currentTitle) {
    el.setAttribute("title", translation);
  } else if (currentTitle !== translation && !currentTitle.includes(translation)) {
    el.setAttribute("title", ghtFormatTitleSuffix(currentTitle, translation));
  }
  el.setAttribute("data-ght-aria", "");
}

function ghtWalkText(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!ghtNormalize(node.textContent)) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || GHT_SKIP_TAGS.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent.classList.contains("ght-annot")) return NodeFilter.FILTER_REJECT;
      if (parent.closest && parent.closest(GHT_DENY_SELECTOR)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }
  for (const node of nodes) {
    ghtAnnotateTextNode(node);
  }
}

function ghtCollectTargets(root) {
  const targets = [];
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return targets;
  }
  if (root.nodeType === Node.ELEMENT_NODE) {
    if (root.matches(GHT_ALLOW_SELECTOR) && !ghtIsDenied(root)) {
      targets.push(root);
    } else if (
      ghtIsSettingsPage() &&
      root.matches(GHT_SETTINGS_CONTENT_SELECTOR) &&
      !ghtIsDenied(root)
    ) {
      targets.push(root);
    } else if (
      ghtIsRepoTabPage() &&
      root.matches(GHT_REPO_TAB_CONTENT_SELECTOR) &&
      !ghtIsDenied(root)
    ) {
      targets.push(root);
    }
  }
  if (root.querySelectorAll) {
    for (const el of root.querySelectorAll(GHT_ALLOW_SELECTOR)) {
      if (!ghtIsDenied(el)) targets.push(el);
    }
    if (ghtIsSettingsPage()) {
      for (const el of root.querySelectorAll(GHT_SETTINGS_CONTENT_SELECTOR)) {
        if (!ghtIsDenied(el)) targets.push(el);
      }
    }
    if (ghtIsRepoTabPage()) {
      for (const el of root.querySelectorAll(GHT_REPO_TAB_CONTENT_SELECTOR)) {
        if (!ghtIsDenied(el)) targets.push(el);
      }
    }
  }
  return targets;
}

function ghtClearAnnotations() {
  for (const el of document.querySelectorAll(".ght-annot")) {
    el.remove();
  }
  for (const el of document.querySelectorAll("[data-ght-aria]")) {
    if (el.hasAttribute("data-ght-original-title")) {
      const original = el.getAttribute("data-ght-original-title");
      if (original) {
        el.setAttribute("title", original);
      } else {
        el.removeAttribute("title");
      }
      el.removeAttribute("data-ght-original-title");
    }
    el.removeAttribute("data-ght-aria");
  }
}

function ghtAnnotate(root) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    ghtAnnotateTextNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }
  if (root.nodeType === Node.ELEMENT_NODE) {
    if (root.classList.contains("ght-annot")) return;
    if (root.closest(GHT_DENY_SELECTOR) && !root.matches(GHT_ALLOW_SELECTOR)) {
      return;
    }
  }

  const targets = ghtCollectTargets(root);
  for (const el of targets) {
    ghtWalkText(el);
    ghtAnnotateAria(el);
  }
}
