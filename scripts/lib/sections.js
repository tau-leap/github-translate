"use strict";

function pathnameOf(url) {
  if (!url) return "";
  try {
    return new URL(url).pathname;
  } catch {
    const m = String(url).match(/github\.com([^?]*)/);
    return m ? m[1] : String(url);
  }
}

function sectionForUrl(url) {
  const path = pathnameOf(url);
  if (!path || path === "/") return "Global / header";
  if (path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/session")) {
    return "Global / header";
  }
  if (path.startsWith("/settings/copilot")) return "Copilot / misc UI";
  if (path.startsWith("/settings") && /\/settings\/(profile|admin|appearance|security|notifications|emails|ssh|keys|applications|installations|blocked|repositories)?/.test(path)) {
    return "Settings: user";
  }
  if (path.startsWith("/settings")) return "Settings: user";
  if (path.startsWith("/pricing")) return "Pricing (github.com/pricing)";
  if (path.startsWith("/marketplace") || path.startsWith("/explore") || path.startsWith("/topics") || path.startsWith("/trending")) {
    return "Marketplace / explore leftovers";
  }
  if (path.startsWith("/features")) return "Logged-out global nav (github.com mega menu)";
  if (path.startsWith("/mcp")) return "MCP Registry (github.com/mcp)";
  if (path.startsWith("/notifications")) return "Notifications";
  if (path.startsWith("/pulls")) return "Pull requests inbox (github.com/pulls)";
  if (path.startsWith("/issues") && !/^\/[^/]+\/[^/]+\//.test(path)) return "Issues";
  if (path.startsWith("/codespaces")) return "Repository";
  if (path.startsWith("/new")) return "Repository";
  if (path.startsWith("/orgs/") || path.startsWith("/organizations/")) return "Organization";
  if (path.startsWith("/sponsors")) return "Global / header";
  if (/^\/[^/]+\/[^/]+\/wiki/.test(path)) return "Repository";
  if (/^\/[^/]+\/[^/]+\/issues/.test(path)) return "Issues";
  if (/^\/[^/]+\/[^/]+\/pull/.test(path)) return "Pull requests";
  if (/^\/[^/]+\/[^/]+\/actions/.test(path)) return "Actions";
  if (/^\/[^/]+\/[^/]+\/projects/.test(path)) return "Projects";
  if (/^\/[^/]+\/[^/]+\/discussions/.test(path)) return "Discussions";
  if (/^\/[^/]+\/[^/]+\/packages/.test(path)) return "Packages";
  if (/^\/[^/]+\/[^/]+\/security/.test(path)) return "Repository settings (sidebar & pages)";
  if (/^\/[^/]+\/[^/]+\/settings/.test(path)) return "Settings: repository";
  if (/^\/[^/]+\/[^/]+\/pulse|^\/[^/]+\/[^/]+\/graphs/.test(path)) {
    return "Insights / dependency graph sidebar";
  }
  if (/^\/[^/]+\/[^/]+/.test(path)) return "Repository";
  return "Auto-collected";
}

function areaFromPath(pathname) {
  const path = pathname || "/";
  if (path === "/") return "home";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/pricing")) return "pricing";
  if (path.startsWith("/marketplace")) return "marketplace";
  if (path.startsWith("/login") || path.startsWith("/signup")) return "login";
  if (path.startsWith("/features")) return "features";
  if (path.startsWith("/mcp")) return "mcp";
  if (path.startsWith("/explore") || path.startsWith("/topics") || path.startsWith("/trending")) {
    return "explore";
  }
  if (path.startsWith("/notifications")) return "notifications";
  if (path.startsWith("/pulls")) return "inbox-pulls";
  if (path.startsWith("/issues") && !/^\/[^/]+\/[^/]+\//.test(path)) return "inbox-issues";
  if (/^\/[^/]+\/[^/]+\/issues/.test(path)) return "repo-issues";
  if (/^\/[^/]+\/[^/]+\/pull/.test(path)) return "repo-pulls";
  if (/^\/[^/]+\/[^/]+\/actions/.test(path)) return "repo-actions";
  if (/^\/[^/]+\/[^/]+\/security/.test(path)) return "repo-security";
  if (/^\/[^/]+\/[^/]+\/settings/.test(path)) return "repo-settings";
  if (/^\/[^/]+\/[^/]+/.test(path)) return "repository";
  if (path.startsWith("/orgs/")) return "org";
  return "other";
}

function areaLabel(area) {
  const labels = {
    home: "ホーム / グローバルナビ",
    settings: "ユーザー設定",
    pricing: "料金ページ",
    marketplace: "マーケットプレイス",
    login: "ログイン / サインアップ",
    features: "機能紹介",
    mcp: "MCP Registry",
    explore: "Explore / Topics",
    notifications: "通知",
    "inbox-pulls": "PR 受信箱",
    "inbox-issues": "Issue 受信箱",
    "repo-issues": "リポジトリ Issues",
    "repo-pulls": "リポジトリ Pull requests",
    "repo-actions": "リポジトリ Actions",
    "repo-security": "リポジトリ Security",
    "repo-settings": "リポジトリ設定",
    repository: "リポジトリ",
    org: "Organization",
    other: "その他",
    all: "自動スキャン",
  };
  return labels[area] || area;
}

module.exports = {
  pathnameOf,
  sectionForUrl,
  areaFromPath,
  areaLabel,
};
