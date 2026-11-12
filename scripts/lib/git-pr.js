"use strict";

const { execFileSync } = require("node:child_process");
const { repoRoot } = require("./dictionary-file");

function git(args, opts = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    cwd: repoRoot(),
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  }).trim();
}

function configureBotIdentity() {
  if (process.env.GITHUB_ACTIONS !== "true") return;
  git(["config", "user.name", "github-actions[bot]"]);
  git(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
}

function hasChanges(paths) {
  const args = ["status", "--porcelain", "--"];
  if (paths && paths.length) args.push(...paths);
  return git(args).length > 0;
}

function checkoutBranch(branch) {
  git(["checkout", "-B", branch]);
}

function commit(message, paths) {
  configureBotIdentity();
  const addArgs = ["add", "--"];
  addArgs.push(...(paths && paths.length ? paths : ["."]));
  git(addArgs);
  if (!hasChanges(paths)) return false;
  git(["commit", "-m", message]);
  return true;
}

function pushForceLease(branch) {
  try {
    git(["push", "-u", "origin", branch, "--force-with-lease"]);
  } catch (err) {
    const msg = String(err.stderr || err.message || err);
    if (/without existing object|src refspec|does not exist/i.test(msg)) {
      git(["push", "-u", "origin", branch]);
      return;
    }
    throw err;
  }
}

function defaultBaseBranch() {
  return process.env.GHT_BASE_BRANCH || process.env.GITHUB_BASE_REF || "main";
}

module.exports = {
  git,
  configureBotIdentity,
  hasChanges,
  checkoutBranch,
  commit,
  pushForceLease,
  defaultBaseBranch,
};
