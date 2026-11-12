"use strict";

function repoSlug() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  return "tau-leap/github-translate";
}

function token() {
  return process.env.GHT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";
}

function apiBase() {
  return (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "");
}

async function request(method, path, body) {
  const t = token();
  if (!t && method !== "GET") {
    const err = new Error("GITHUB_TOKEN または GHT_GITHUB_TOKEN がありません");
    err.code = "NO_TOKEN";
    throw err;
  }
  const url = path.startsWith("http") ? path : `${apiBase()}${path}`;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "github-translate-automation",
    ...(body ? { "Content-Type": "application/json" } : {}),
  };
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
  }
  if (!res.ok) {
    const err = new Error(
      `GitHub API ${res.status} ${method} ${path}: ${json && json.message ? json.message : text}`
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function requestPages(path) {
  const out = [];
  let page = 1;
  while (page <= 10) {
    const sep = path.includes("?") ? "&" : "?";
    const chunk = await request("GET", `${path}${sep}per_page=100&page=${page}`);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    out.push(...chunk);
    if (chunk.length < 100) break;
    page++;
  }
  return out;
}

function issuesPath() {
  return `/repos/${repoSlug()}/issues`;
}

function pullsPath() {
  return `/repos/${repoSlug()}/pulls`;
}

async function listOpenIssues() {
  const items = await requestPages(`${issuesPath()}?state=open`);
  return items.filter((i) => !i.pull_request);
}

async function listOpenPulls() {
  return requestPages(`${pullsPath()}?state=open`);
}

async function createIssue({ title, body, labels }) {
  return request("POST", issuesPath(), { title, body, labels });
}

async function updateIssue(number, fields) {
  return request("PATCH", `${issuesPath()}/${number}`, fields);
}

async function commentOnIssue(number, body) {
  return request("POST", `${issuesPath()}/${number}/comments`, { body });
}

async function createPull({ title, head, base, body }) {
  return request("POST", pullsPath(), { title, head, base: base || "main", body });
}

async function updatePull(number, fields) {
  return request("PATCH", `${pullsPath()}/${number}`, fields);
}

async function findOpenPullByHead(branch) {
  const owner = repoSlug().split("/")[0];
  const items = await request(
    "GET",
    `${pullsPath()}?state=open&head=${encodeURIComponent(`${owner}:${branch}`)}`
  );
  return Array.isArray(items) && items[0] ? items[0] : null;
}

async function ensureLabel(name, color, description) {
  try {
    await request("GET", `/repos/${repoSlug()}/labels/${encodeURIComponent(name)}`);
    return;
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  try {
    await request("POST", `/repos/${repoSlug()}/labels`, { name, color, description });
  } catch (err) {
    if (err.status !== 422) throw err;
  }
}

module.exports = {
  repoSlug,
  token,
  request,
  listOpenIssues,
  listOpenPulls,
  createIssue,
  updateIssue,
  commentOnIssue,
  createPull,
  updatePull,
  findOpenPullByHead,
  ensureLabel,
};
