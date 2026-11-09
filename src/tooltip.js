/* global GHT_DESCRIPTIONS, GHT_INTERACTIVE_SELECTOR, ghtNormalize, ghtIsDenied, ghtIsAllowed */

const GHT_TIP_DELAY_MS = 400;
const GHT_TIP_MARGIN = 8;
const GHT_SKIP_LABEL_SELECTOR =
  ".ght-annot, .Counter, [class*='Counter'], [data-component='CounterLabel']";

let ghtTipEl = null;
let ghtHoverEl = null;
let ghtDelayTimer = null;
let ghtSuppressedTitleEl = null;

function ghtEnsureTipEl() {
  if (ghtTipEl && ghtTipEl.isConnected) return ghtTipEl;
  const el = document.createElement("div");
  el.className = "ght-tip";
  el.setAttribute("aria-hidden", "true");
  el.hidden = true;
  (document.body || document.documentElement).appendChild(el);
  ghtTipEl = el;
  return el;
}

function ghtClosestInteractive(node) {
  if (!node) return null;
  if (node.nodeType !== Node.ELEMENT_NODE) {
    node = node.parentElement;
  }
  if (!node || typeof node.closest !== "function") return null;
  const el = node.closest(GHT_INTERACTIVE_SELECTOR);
  if (!el) return null;
  if (el.classList.contains("ght-annot") || el.closest(".ght-annot")) return null;
  if (el.classList.contains("ght-tip")) return null;
  if (ghtIsDenied(el) || !ghtIsAllowed(el)) return null;
  return el;
}

function ghtHasGitHubTooltip(el) {
  if (el.closest(".tooltipped, [class*='tooltipped']")) return true;
  if (el.closest("[data-component='Tooltip']")) return true;
  if (el.hasAttribute("data-tooltip") || el.hasAttribute("data-tooltip-text")) {
    return true;
  }

  const describedby = el.getAttribute("aria-describedby");
  if (describedby) {
    for (const id of describedby.split(/\s+/)) {
      if (!id) continue;
      const descEl = document.getElementById(id);
      if (descEl && descEl.getAttribute("role") === "tooltip") return true;
    }
  }

  if (el.hasAttribute("data-ght-original-title")) {
    return Boolean(el.getAttribute("data-ght-original-title"));
  }
  const title = el.getAttribute("title");
  if (title && !el.hasAttribute("data-ght-aria")) return true;
  return false;
}

function ghtCollectLabelNodes(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(GHT_SKIP_LABEL_SELECTOR)) return NodeFilter.FILTER_REJECT;
      if (!ghtNormalize(node.textContent)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current);
    current = walker.nextNode();
  }
  return nodes;
}

function ghtLookupDescription(el) {
  const nodes = ghtCollectLabelNodes(el);
  const joined = ghtNormalize(nodes.map((node) => node.textContent).join(" "));
  if (joined && GHT_DESCRIPTIONS[joined]) return GHT_DESCRIPTIONS[joined];

  for (const node of nodes) {
    const key = ghtNormalize(node.textContent);
    if (GHT_DESCRIPTIONS[key]) return GHT_DESCRIPTIONS[key];
  }

  const aria = el.getAttribute("aria-label");
  if (aria) {
    const key = ghtNormalize(aria);
    if (GHT_DESCRIPTIONS[key]) return GHT_DESCRIPTIONS[key];
  }
  return "";
}

function ghtPositionTip(tip, anchor) {
  const rect = anchor.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const role = (anchor.getAttribute("role") || "").toLowerCase();
  const isMenuItem = role.indexOf("menuitem") === 0;
  let top;
  let left;

  if (isMenuItem) {
    left = rect.right + GHT_TIP_MARGIN;
    top = rect.top + (rect.height - tipRect.height) / 2;
    if (left + tipRect.width > window.innerWidth - GHT_TIP_MARGIN) {
      left = rect.left - tipRect.width - GHT_TIP_MARGIN;
    }
  } else {
    left = rect.left + (rect.width - tipRect.width) / 2;
    top = rect.top - tipRect.height - GHT_TIP_MARGIN;
    if (top < GHT_TIP_MARGIN) {
      top = rect.bottom + GHT_TIP_MARGIN;
    }
  }

  left = Math.max(
    GHT_TIP_MARGIN,
    Math.min(left, window.innerWidth - tipRect.width - GHT_TIP_MARGIN)
  );
  top = Math.max(
    GHT_TIP_MARGIN,
    Math.min(top, window.innerHeight - tipRect.height - GHT_TIP_MARGIN)
  );

  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

function ghtSuppressTitle(el) {
  ghtRestoreTitle();
  if (!el.hasAttribute("title")) return;
  el.setAttribute("data-ght-suppressed-title", el.getAttribute("title") || "");
  el.removeAttribute("title");
  ghtSuppressedTitleEl = el;
}

function ghtRestoreTitle() {
  if (!ghtSuppressedTitleEl) return;
  const saved = ghtSuppressedTitleEl.getAttribute("data-ght-suppressed-title");
  if (saved !== null) {
    ghtSuppressedTitleEl.setAttribute("title", saved);
    ghtSuppressedTitleEl.removeAttribute("data-ght-suppressed-title");
  }
  ghtSuppressedTitleEl = null;
}

function ghtClearDelay() {
  if (!ghtDelayTimer) return;
  clearTimeout(ghtDelayTimer);
  ghtDelayTimer = null;
}

function ghtHideTip() {
  ghtClearDelay();
  ghtRestoreTitle();
  ghtHoverEl = null;
  if (!ghtTipEl) return;
  ghtTipEl.hidden = true;
  ghtTipEl.textContent = "";
}

function ghtShowTip(el, desc) {
  const tip = ghtEnsureTipEl();
  tip.textContent = desc;
  tip.style.left = "0px";
  tip.style.top = "0px";
  tip.hidden = false;
  ghtPositionTip(tip, el);
  ghtSuppressTitle(el);
}

function ghtOnMouseOver(event) {
  const el = ghtClosestInteractive(event.target);
  const from = ghtClosestInteractive(event.relatedTarget);
  if (el && el === from) return;
  if (el === ghtHoverEl) return;

  ghtHideTip();
  if (!el) return;

  ghtHoverEl = el;
  if (ghtHasGitHubTooltip(el)) return;
  const desc = ghtLookupDescription(el);
  if (!desc) return;

  ghtDelayTimer = setTimeout(() => {
    ghtDelayTimer = null;
    if (ghtHoverEl === el && el.isConnected) {
      ghtShowTip(el, desc);
    }
  }, GHT_TIP_DELAY_MS);
}

function ghtOnMouseOut(event) {
  const el = ghtHoverEl;
  if (!el) return;
  const to = event.relatedTarget;
  if (to && (el === to || (to.nodeType === Node.ELEMENT_NODE && el.contains(to)))) {
    return;
  }
  if (ghtClosestInteractive(to) === el) return;
  ghtHideTip();
}

function ghtInitTooltips() {
  document.addEventListener("mouseover", ghtOnMouseOver);
  document.addEventListener("mouseout", ghtOnMouseOut);
  window.addEventListener("scroll", ghtHideTip, true);
  window.addEventListener("resize", ghtHideTip);
}
