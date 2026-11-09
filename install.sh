#!/usr/bin/env bash
# Chrome 拡張のローカル読み込み手順（配布ZIPは ./release.sh）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
echo "Chrome で chrome://extensions を開き、デベロッパーモードを ON にして"
echo "「パッケージ化されていない拡張機能を読み込む」から次を選択してください:"
echo "  $ROOT"
echo
echo "ストア提出用 ZIP を作る場合: ./release.sh"
