#!/usr/bin/env bash
# 拡張機能を dist/ にビルドし、中身だけを ZIP パッケージ化する。
#
# 使い方:
#   ./packaging.sh
#   ./packaging.sh my-extension-1.0.0.zip
#   ./packaging.sh --skip-build my-extension-1.0.0.zip
#
# ZIP には manifest.json と実行に必要なファイルのみ含める。
# .git, node_modules, .DS_Store, README などは含めない。
# 言語の切替は拡張機能内の設定で行うため、パッケージは全ロケールを含める。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/dist"
SKIP_BUILD=false
OUTPUT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    *)
      if [ -n "$OUTPUT" ]; then
        echo "エラー: 出力 ZIP 名は 1 つだけ指定できます。" >&2
        exit 1
      fi
      OUTPUT="$1"
      shift
      ;;
  esac
done

read_version() {
  python3 -c "import json, sys; print(json.load(open(sys.argv[1]))['version'])" "$ROOT/manifest.json"
}

build_dist() {
  if [ ! -d "$ROOT/src/locales" ]; then
    echo "エラー: src/locales/ が見つかりません。" >&2
    exit 1
  fi

  echo "ビルド: $DIST"
  rm -rf "$DIST"
  mkdir -p "$DIST/icons" "$DIST/src"

  cp "$ROOT/manifest.json" "$DIST/"
  cp "$ROOT/popup.html" "$ROOT/popup.css" "$ROOT/popup.js" "$DIST/"
  cp "$ROOT/icons/"*.png "$DIST/icons/"
  cp "$ROOT/src/config.js" \
     "$ROOT/src/locale.js" \
     "$ROOT/src/selectors.js" \
     "$ROOT/src/annotate.js" \
     "$ROOT/src/tooltip.js" \
     "$ROOT/src/content.js" \
     "$ROOT/src/styles.css" \
     "$DIST/src/"
  cp -R "$ROOT/src/locales" "$DIST/src/"
}

create_zip() {
  local zip_path="$1"

  if [ ! -f "$DIST/manifest.json" ]; then
    echo "エラー: $DIST/manifest.json が見つかりません。先にビルドしてください。" >&2
    exit 1
  fi

  rm -f "$zip_path"
  mkdir -p "$(dirname "$zip_path")"

  # フォルダごとではなく、dist/ の中身だけを ZIP する
  (
    cd "$DIST"
    zip -r "$zip_path" . \
      -x "*.DS_Store" \
      -x "*/.DS_Store" \
      -x "__MACOSX/*"
  )

  echo "作成完了: $zip_path"
  echo "含まれるファイル:"
  unzip -l "$zip_path" | sed -n '4,$p' | sed '$d' | sed '$d'
}

VERSION="$(read_version)"

if [ -z "$OUTPUT" ]; then
  OUTPUT="$ROOT/github-translator-${VERSION}.zip"
elif [[ "$OUTPUT" != /* ]]; then
  OUTPUT="$ROOT/$OUTPUT"
fi

if [ "$SKIP_BUILD" = false ]; then
  build_dist
else
  echo "ビルドをスキップします（既存の $DIST を使用）"
fi

create_zip "$OUTPUT"
