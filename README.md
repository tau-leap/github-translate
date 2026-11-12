# GitHub Translate

github.com の UI ラベル（メニュー・ボタン・タブなど）の横に、  
小さな日本語の訳を並べて表示する Chrome 拡張です。

英語の表示はそのまま残すので、英語の UI に慣れながら使えます。  
README やコメント、Issue / PR 本文、コード、ユーザー名は翻訳しません。

**インストール:** [Chrome ウェブストア](https://chromewebstore.google.com/detail/github-translate/ignplaeoffkjaffgbhclflhmegllfipm)

## できること

- ヘッダー、リポジトリタブ、Issue / PR、Actions、Settings などの定型 UI に訳を並記
- GitHub 内の画面遷移後も、追加された UI に自動で訳を付ける
- メニュー・タブ・機能名などにホバーすると、その機能が「何か」を説明する吹き出しを表示  
  （GitHub 側にツールチップがあるときは出さない）
- ポップアップで翻訳言語を「日本語 / なし」から選択（ページ再読み込み不要）
- ポップアップの「未訳を報告」「訳の修正を提案」から、このリポジトリの Issue 作成画面を開ける
- 通信なし（翻訳 API は使いません。データの収集もしません）

## 翻訳されないもの

- 辞書に無い文言（GitHub 側のラベル変更を含む）
- 数字が入った文言（例: `16 repositories`）。辞書は完全一致のため
- ユーザーが書いたタイトル・本文・コメント
- ファイル名・コード・差分

## しくみ

翻訳 API や機械翻訳は使わず、拡張機能に同梱した辞書だけで動きます。

- **辞書（`src/locales/ja/dictionary.js`）**: 英語の文言をキー、日本語を値にしたオブジェクトです。  
  画面のテキスト（と `aria-label`）の前後の空白を除き、連続する空白を 1 つにまとめたうえで、  
  キーと **完全一致** したときだけ訳を横に付けます。部分一致や大文字・小文字の無視はしません。  
- **機能説明（`src/locales/ja/descriptions.js`）**: ホバー時の吹き出しに出す説明です。  
  メニューやタブが「何か」を説明する文体（操作手順は書かない）で、  
  サービス名・ナビ・タブ・設定セクションなどに限定します。  
- **対象範囲（`src/selectors.js`）**: どの要素に訳を付けるかを決めます。  
  リポジトリ内のページと設定ページは本文のテキストも対象、それ以外のページは  
  見出し・ナビ・ボタン・メニューだけが対象です。  

## 開発用に読み込む

1. このリポジトリを clone する
2. Chrome で `chrome://extensions` を開き、右上の「デベロッパー モード」を ON にする
3. 「パッケージ化されていない拡張機能を読み込む」から、  
このリポジトリのフォルダ（`manifest.json` がある場所）を選ぶ
4. 辞書などを編集したら、`chrome://extensions` で拡張機能の再読み込みボタンを押し、  
GitHub のページも再読み込みする

## 翻訳を追加・修正する

いちばん簡単なのは、拡張機能のポップアップの **「未訳を報告」** から Issue を作ることです。  
表示中のページ URL と、ページで選択していたテキストが入った状態で Issue 作成画面が開きます。  
（[Issue から直接報告](https://github.com/tau-leap/github-translate/issues/new/choose)することもできます）  

自分で辞書を直して Pull Request を送ってくれる場合は、`src/locales/ja/dictionary.js` に  
英語キーと訳を追加してください。  

注意点:  
- **完全一致**: キーは画面の表示どおりに書きます。前後の空白は無視されますが、  
それ以外は 1 文字でも違うと一致しません
- **アポストロフィ**: GitHub はまっすぐな `'` と曲がった `’` の両方を使います。  
画面と同じ方を使い、両方出る場合は両方のキーを入れます
- **大文字・小文字**: `Settings` と `SETTINGS` は別のキーです。  
大文字の見出しなどは、そのキーも追加します
- **製品名**: GitHub Copilot、GitHub Skills、MCP、AI などの製品名・固有名詞そのものには訳を付けません

用語の決まりと PR の流れは [CONTRIBUTING.md](CONTRIBUTING.md) にあります。

## 未訳を自動で Issue / PR にする

メンテナー向けです。GitHub Actions が定型 UI の未訳を拾い、翻訳レポート Issue から辞書の PR を作ります。  
**スケジュールはデフォルトブランチにワークフローが乗ったあと**に動きます。

### ワークフロー

| ワークフロー | 推奨スケジュール | 内容 |
|---|---|---|
| [翻訳 Issue から辞書 PR](.github/workflows/translation-from-issues.yml) | 毎日 12:00 JST（`0 3 * * *` UTC） | `untranslated` / `translation-fix` の Issue だけを読み、`dictionary.js`（必要なとき `descriptions.js`）をまとめて 1 本の PR にする。不具合報告は無視する |
| [GitHub UI をスキャンして未訳を収集](.github/workflows/translation-scan-pages.yml) | 毎週月曜 13:00 JST（`0 4 * * 1` UTC） | 拡張機能と同じセレクタ・除外ルールで github.com をスキャンし、未訳 Issue（必要なら辞書 PR）を更新する |

どちらも `workflow_dispatch` で手動実行できます。初回は **dry_run** を ON にして検出内容だけ確認してください。

ローカル:

```bash
node --test scripts/lib/*.test.js
node scripts/from-issues.js --dry-run
node scripts/scan-pages.js --dry-run --html scripts/fixtures/sample-github.html
```

スキャンを実ページに対して走らせる場合は Playwright が必要です。

```bash
mkdir -p /tmp/ght-playwright && cd /tmp/ght-playwright
npm init -y && npm install playwright && npx playwright install chromium
cd - && NODE_PATH=/tmp/ght-playwright/node_modules node scripts/scan-pages.js --dry-run --max-pages 3
```

### 必要な権限

リポジトリの **Settings → Actions → General**:

1. Actions を有効にする  
2. **Workflow permissions** を **Read and write permissions** にする  
3. **Allow GitHub Actions to create and approve pull requests** を ON にする  

`GITHUB_TOKEN` はこの権限があれば足ります（値を作る必要はありません）。

### 任意のシークレット

値は Settings → Secrets and variables → Actions に入れてください。このリポジトリのコードや Issue にトークンを書かないでください。

| 名前 | 用途 |
|---|---|
| `GHT_GITHUB_TOKEN` | 省略可。デフォルトの `GITHUB_TOKEN` では PR 作成が拒否されるとき、`repo` 権限のある PAT または GitHub App トークンを使う |
| `GHT_PLAYWRIGHT_STORAGE_STATE` | 省略可。ログイン後の画面（`/settings` や通知など）もスキャンしたいときの [Playwright `storageState`](https://playwright.dev/docs/auth) JSON。無いときは公開ページだけを対象にする |

スキャン対象 URL は `scripts/scan-urls.txt` です。辞書キー・オープン中の Issue / PR と重複する文言は作り直しません。自動 PR のブランチは `ght/auto-from-issues` と `ght/auto-scan` で、既存のオープン PR を更新します。

## 言語を追加する

翻訳データは `src/locales/<言語コード>/` に置きます。  
`dictionary.js`（横並びの短い訳）と `descriptions.js`（ホバー時の概念説明）の
2 ファイルが必要です。

1. `src/locales/<言語コード>/` を作成し、上記 2 ファイルを追加する
2. `src/locale.js` の `GHT_LOCALES` にその言語を登録する
3. `src/config.js` の `GHT_LOCALE_OPTIONS` に選択肢を追加する
4. `manifest.json` の `content_scripts` で当該ロケールの JS を読み込む

## リリース

Chrome ウェブストアへの公開はメンテナー（TauLeap）だけが行います。  
Pull Request がマージされても、ストア版に反映されるのは次のリリースのときです。

メンテナー向け: `./packaging.sh` を実行すると `dist/` を作り直し、  
`github-translator-<version>.zip` を作成します。  
言語切替は拡張機能内の設定で行うため、ZIP には利用可能な全ロケールを含めます。

## プライバシー

この拡張機能はデータを収集・送信しません。外部サーバーとの通信もありません。  
保存するのは選んだ翻訳言語の設定だけです（`chrome.storage.sync`）。  
「未訳を報告」は、押したときに github.com の Issue 作成画面を新しいタブで開くだけで、  
Issue を送信するかどうかはその画面で利用者が決めます。

## ライセンス

[MIT License](LICENSE) © 2026 TauLeap

フィードバック: [GitHub Issues](https://github.com/tau-leap/github-translate/issues/new/choose)  
問い合わせ: support@tauleap.com

---

## English

GitHub Translate is a Chrome extension that shows short Japanese labels next to  
github.com menus, buttons, and tabs. The English UI stays as-is. User content  
(READMEs, comments, issue/PR bodies, code, usernames) is never translated.

- **Install:** [Chrome Web Store](https://chromewebstore.google.com/detail/github-translate/ignplaeoffkjaffgbhclflhmegllfipm)
- **How it works:** a bundled dictionary (`src/locales/ja/dictionary.js`).  
UI text is whitespace-normalized and trimmed,   
then matched **exactly** against the dictionary keys. Hover descriptions live in `src/locales/ja/descriptions.js`.  
 No translation API, no network requests, no data collection.
- **Develop:** open `chrome://extensions`, turn on Developer mode, click "Load unpacked", and pick this folder.
- **Contribute:** use "未訳を報告" (report untranslated text) in the extension popup,  
open an [issue](https://github.com/tau-leap/github-translate/issues/new/choose),  
or send a PR that edits `dictionary.js`.  
Keys must match the on-screen text exactly  
 (straight `'` vs curly `’` and upper-case variants are separate keys).  
Product names such as GitHub Copilot or MCP are not translated. See [CONTRIBUTING.md](CONTRIBUTING.md) (Japanese).  
- **Maintainer automation:** GitHub Actions (cron + `workflow_dispatch`) turn translation issues into dictionary PRs and scan github.com for missing UI strings. Enable write permissions for Actions and allow Actions to open PRs. Optional secrets: `GHT_GITHUB_TOKEN`, `GHT_PLAYWRIGHT_STORAGE_STATE` (see the Japanese section above).  
- **Releases:** only the maintainer (TauLeap) publishes to the Chrome Web Store.
- **License:** [MIT](LICENSE)
