#!/usr/bin/env bash
# Chrome Web Store 提出用 ZIP を作る（packaging.sh を実行）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
if [[ -x "$ROOT/packaging.sh" ]]; then
  exec "$ROOT/packaging.sh" "$@"
fi
if [[ -f "$ROOT/packaging.sh" ]]; then
  exec bash "$ROOT/packaging.sh" "$@"
fi
echo "error: packaging.sh が見つかりません" >&2
exit 1
