/* global GHT_LOCALE_DESCRIPTIONS */
//
// ホバー時の機能説明（概念説明のみ）。
// 「〜を開く」などの操作説明は書かず、メニュー・タブ・機能が「何か」を説明する。
// 汎用ボタン（Save / Star 等）・フィルター・フォームラベルは載せない。
// 横並びの短い訳は dictionary.js を参照。
//
var GHT_LOCALE_DESCRIPTIONS = {
  // --- Global / header ---
  Dashboard: "フォロー中のリポジトリや自分の活動の概要",
  Feed: "フォロー中のリポジトリやユーザーの最新アクティビティ",
  Home: "GitHub のトップページ",
  "Pull requests": "コード変更のレビューと取り込みを行う機能",
  "Pull request": "コード変更のレビューと取り込みを行う機能",
  Issues: "バグ報告やタスクなど、作業項目を管理する機能",
  Codespaces:
    "クラウド上で VS Code ベースの開発環境を起動できるサービス",
  Copilot: "AI がコード補完やチャットで開発を支援する機能",
  Marketplace:
    "サードパーティ製アプリや Actions を探して導入する場所",
  Explore: "公開リポジトリや開発者を見つけるページ",
  Topics: "トピックタグでリポジトリを分類・探索する機能",
  Trending: "最近注目されている公開リポジトリの一覧",
  Collections: "テーマ別にまとめられたリポジトリのコレクション",
  Events: "GitHub 関連のイベントやミートアップの情報",
  Sponsors: "オープンソース開発者を支援するスポンサー機能",
  Settings: "アカウント・Organization・リポジトリの各種設定",
  Notifications: "リポジトリや課題に関する更新通知の一覧",
  "Your profile": "自分のプロフィールと公開情報",
  "Your repositories": "自分が所有するリポジトリの一覧",
  "Your projects": "自分が作成したプロジェクトの一覧",
  "Your stars": "Star したリポジトリの一覧",
  "Your gists": "自分が作成した gist の一覧",
  "Your organizations": "所属している Organization の一覧",
  "Your enterprises": "所属している Enterprise の一覧",
  "Your sponsors": "スポンサー設定と支援先の管理",
  "Your Copilot": "Copilot の利用状況と設定",
  "Your discussions": "自分が参加したディスカッションの一覧",
  "Your codespaces": "自分が作成した Codespaces の一覧",
  Upgrade: "有料プランへのアップグレード",
  "Try Enterprise": "大規模チーム向け GitHub Enterprise の体験",
  "Feature preview": "GitHub が試験提供中の新機能のプレビュー",
  "GitHub Docs": "GitHub の公式ドキュメント",
  "GitHub Support": "GitHub サポートへの問い合わせ窓口",
  "GitHub Community": "GitHub ユーザーコミュニティ",
  "Community discussions": "GitHub コミュニティでの議論フォーラム",
  Appearance: "ダークモードなど UI の見た目の設定",
  Docs: "GitHub の公式ドキュメント",
  Support: "GitHub サポートへの問い合わせ窓口",
  Blog: "GitHub 公式ブログ",
  About: "GitHub の会社概要とミッション",
  Pricing: "GitHub の料金プラン一覧",
  Enterprise: "大規模組織向け GitHub Enterprise の案内",
  Education: "学生・教員向け GitHub Education プログラム",
  Nonprofit: "非営利団体向け GitHub の支援プログラム",
  "Customer stories": "GitHub 導入事例の紹介",
  Resources: "GitHub に関する学習・参考リソース",
  Status: "GitHub サービスの稼働状況",

  // --- Repository tabs & features ---
  Code: "ソースコードとファイル構成を閲覧・編集する画面",
  Actions: "CI/CD ワークフローの定義と実行履歴",
  Projects: "課題や PR をカンバン等で計画・管理する機能",
  Wiki: "リポジトリ向けの共同編集可能なドキュメント",
  Insights: "アクセス数・貢献者・依存関係などの統計",
  Security: "脆弱性スキャン結果とセキュリティ設定",
  Releases: "バージョンごとのリリースと配布物の管理",
  Packages: "GitHub Packages で公開したパッケージの一覧",
  "GitHub Packages": "コードと一緒にパッケージをホスティングするサービス",
  "Linked artifacts": "ビルドからデプロイまでアーティファクトを追跡する機能",
  Deployments: "デプロイの実行履歴と状態",
  Environments: "デプロイ先の環境と保護ルール",
  Discussions: "Q&A やアイデア共有など、議論の場",
  Commits: "リポジトリのコミット履歴",
  Branches: "ブランチの一覧と管理",
  Tags: "リリース等に付けるタグの一覧",
  Contributors: "このリポジトリに貢献した開発者",
  Languages: "リポジトリで使われているプログラミング言語",
  "Activity overview": "リポジトリの活動状況の概要",
  Pulse: "指定期間中のコミットや PR などの活動サマリー",
  "Code frequency": "時系列でのコード追加・削除量のグラフ",
  Community: "コントリビューター構成や健全性の指標",
  Traffic: "クローン数やページ閲覧数などのアクセス統計",
  "Network graph": "Fork 関係を可視化したネットワーク図",
  "Dependency graph": "依存パッケージとその脆弱性の関係図",
  Dependabot:
    "依存パッケージの脆弱性を検知し更新 PR を出す機能",
  "Code scanning": "ソースコードの脆弱性を静的解析する機能",
  "Secret scanning": "コミット内のシークレット漏洩を検知する機能",
  Advisories: "既知の脆弱性に関するセキュリティアドバイザリ",
  "Security policy":
    "利用者が脆弱性を報告する手順を定義するポリシー",
  Malware: "リポジトリ内の悪意あるコードや依存関係を検知する機能",
  "Malware alerts": "マルウェアの可能性がある変更や依存関係の警告",
  Vulnerabilities: "依存関係やコードに存在する既知の脆弱性",
  "Dependabot alerts":
    "依存パッケージに脆弱性が見つかったときの通知",
  "Code quality findings": "コードベース内の品質問題を自動検出する機能",
  Reporting: "セキュリティや品質に関する報告・集計",
  Findings: "スキャンや解析で見つかった検出結果",
  "Branch protection rules":
    "ブランチへの直接 push やマージ条件を制限する従来型のルール",
  "Branch protection rule":
    "特定ブランチへの push やマージ条件を制限するルール",
  Checks: "CI や外部サービスによる自動チェック結果",
  "GitHub Pages": "リポジトリから静的サイトを公開する機能",

  // --- Issues & PR terms ---
  Labels: "課題や PR に付ける分類用のタグ",
  Milestones: "複数の課題をまとめる期限付きの目標",
  Milestone: "複数の課題をまとめる期限付きの目標",
  Assignees: "課題や PR の担当者",
  Reviews: "プルリクエストに対するレビューと承認",
  Reviewers: "プルリクエストのレビュー担当者",
  Conversation: "プルリクエスト上のコメントと議論",
  "Files changed": "プルリクエストで変更されたファイルの差分",

  // --- Actions sub-nav ---
  Workflows: "Actions で自動実行する処理の定義ファイル",
  Runs: "ワークフローの実行履歴と結果",
  Usage: "Actions の実行時間や消費量",
  Caches: "ワークフロー実行を高速化するキャッシュ",
  Artifacts: "ワークフローが生成した成果物",
  Attestations: "ビルド成果物の出所を証明するアテステーション",
  "Usage Metrics": "Actions の使用量に関するメトリクス",
  Jobs: "ワークフロー実行内の個別ジョブ",
  Runners: "ワークフローを実行するランナーマシン",
  "Actions Usage Metrics": "Actions の使用量に関するメトリクス",
  "Actions Performance Metrics": "Actions のパフォーマンスに関するメトリクス",

  // --- Projects ---
  Board: "カンバン形式で課題や PR を管理するビュー",
  Table: "表形式で課題や PR を一覧管理するビュー",
  Roadmap: "時系列で計画を可視化するロードマップビュー",
  Backlog: "未着手の課題や PR を集めたバックログ",
  "Issue types": "課題の種類（バグ・機能など）の定義",
  "Issue fields": "課題に追加するカスタムフィールド",
  Sandboxes: "安全な環境でコードを試すサンドボックス",
  "Cloud sandbox access": "Organization メンバーのクラウドサンドボックス利用権",

  // --- Discussions categories ---
  Categories: "ディスカッションのカテゴリ一覧",
  Announcements: "お知らせ用のディスカッションカテゴリ",
  Ideas: "機能提案やアイデアを共有するカテゴリ",
  Polls: "投票で意見を集めるカテゴリ",
  "Q&A": "質問と回答形式のカテゴリ",
  "Show and tell": "成果物やデモを共有するカテゴリ",

  // --- Settings: repository sidebar ---
  Access: "リポジトリへのアクセス権限の管理",
  Collaborators: "リポジトリへのアクセス権を持つユーザーとチーム",
  "Collaborators and teams": "コラボレーターとチームのアクセス管理",
  "Team and member roles": "チームとメンバーに付与する権限ロール",
  Moderators: "ディスカッション等を管理するモデレーター",
  "Code and automation": "ブランチ保護や Actions など自動化の設定",
  "Code, planning, and automation":
    "コード管理・計画・自動化に関する設定",
  "Custom properties": "リポジトリに付与するカスタムメタデータ",
  Webhooks: "リポジトリイベントを外部 URL に通知する仕組み",
  Pages: "GitHub Pages の公開設定",
  "Code security": "コードスキャンや Dependabot などのセキュリティ設定",
  "Secrets and variables": "Actions 等で使う機密情報と環境変数",
  Secrets: "Actions 等で使う機密情報",
  Variables: "Actions 等で使う環境変数",
  "Deploy keys": "デプロイ専用の SSH 公開鍵",
  Integrations: "外部サービスとの連携設定",
  "GitHub Apps": "リポジトリにインストールした GitHub アプリ",
  "Installed GitHub Apps": "このリポジトリにインストールされた GitHub アプリ",
  "Email notifications": "リポジトリイベントのメール通知設定",
  Features: "Issues や Wiki などリポジトリ機能の有効化",
  "Danger Zone": "削除や公開範囲変更など取り消しにくい操作",
  "Danger zone": "削除や公開範囲変更など取り消しにくい操作",
  Sponsorships: "リポジトリのスポンサーシップ設定",
  "Pull Requests": "プルリクエストに関するリポジトリ設定",
  Wikis: "Wiki 機能の有効化と設定",

  // --- Rulesets ---
  Rulesets:
    "ブランチ・タグ・push の操作をまとめて制御するルールの集合",
  Rules: "リポジトリに適用中のルールセットと保護ルールの一覧",
  "New branch ruleset":
    "特定ブランチへの push・削除・マージ条件などを制限するルールセット",
  "New tag ruleset":
    "タグの作成・削除・更新を制限するルールセット",
  "New push ruleset":
    "ファイルパスやサイズなど、push 内容そのものを制限するルールセット",
  "Push rules":
    "パス・拡張子・ファイルサイズなどで push を制限するルール",
  "Tag protection rules":
    "タグへの push や削除を制限する従来型のルール（ルールセットへの移行推奨）",
  "Rule Insights":
    "ルールセットの適用結果やバイパスの履歴を確認する画面",
  "Repository ruleset insights":
    "ルールセットがリポジトリに与える影響の分析",
  "Repository ruleset dashboard":
    "ルールセットの適用状況を一覧するダッシュボード",
  "Import/Export":
    "ルールセットを JSON で書き出し・取り込む機能",
  "Disable branch protection rules":
    "従来のブランチ保護を止め、ルールセットへ移行するための設定",

  // --- Settings: Actions ---
  "Actions permissions":
    "ワークフローが利用できる Actions / 再利用可能ワークフローの範囲",
  "Artifact and log retention":
    "ワークフローの成果物とログを何日保持するかの設定",
  "Fork pull request workflows":
    "Fork 由来の PR でワークフローをどう実行するかの設定",
  "Workflow permissions":
    "GITHUB_TOKEN に付与するデフォルト権限の設定",
  "Policies Preview": "Actions の実行ポリシー（プレビュー機能）",

  "Actions secrets": "GitHub Actions 用のシークレット",
  "Actions secrets and variables": "Actions ワークフロー用のシークレットと変数",
  "Actions variables": "GitHub Actions 用の環境変数",
  "Dependabot secrets": "Dependabot 用のシークレット",
  "Codespaces secrets": "Codespaces 用のシークレット",
  "Agents secrets and variables":
    "Copilot Agents が参照する機密情報と環境変数の管理",
  variables: "Agents 実行時に使う非機密の環境変数",
  Forking: "リポジトリの Fork を許可するかの設定",
  Archives: "ZIP 等のソースコードアーカイブの生成設定",
  "Prebuild configuration": "Codespaces 起動を高速化するプリビルド設定",

  // --- Settings: user sidebar ---
  "Public profile": "公開プロフィールの表示内容",
  Account: "アカウント情報とユーザー名の管理",
  Accessibility: "キーボード操作やコントラストなどの設定",
  "Billing and plans": "請求情報と利用プランの管理",
  "Plans and usage": "現在のプランと使用量",
  Emails: "アカウントに登録するメールアドレス",
  "Password and authentication": "パスワードと二要素認証の設定",
  Sessions: "ログイン中のセッションとデバイス",
  "SSH and GPG keys": "Git 操作やコミット署名用の鍵",
  Organizations: "所属 Organization の一覧と管理",
  "GitHub Mobile": "モバイルアプリの設定",
  Moderation: "ブロックや操作制限などモデレーション設定",
  "Blocked users": "ブロックしているユーザーの一覧",
  "Interaction limits": "コメント等の操作制限の設定",
  "Code review": "コードレビューの設定（個人または Copilot）",
  "Code review limits": "公開リポジトリの PR レビュー権限の制限",
  "Copilot Code review":
    "PR に Copilot をレビュアーとして追加する機能の設定",
  "Cloud agent": "タスクを委任できる Copilot クラウドエージェントの設定",
  "Copilot cloud agent":
    "タスクを委任できる Copilot クラウドエージェントの設定",
  "Internet access":
    "Copilot エージェントがアクセスできるネットワーク範囲の設定",
  "MCP servers":
    "Copilot が外部ツールと連携するための MCP サーバー設定",
  Planning: "課題の計画・エージェント提案などの設定",
  "Agent suggestions for issues":
    "受信した課題へのラベルや担当者などをエージェントが提案する機能",
  "OIDC configuration":
    "Actions の OIDC トークンに含めるクレームの設定",
  "Scheduled reminders": "定期的な通知リマインダーの設定",
  "Security log": "アカウントのセキュリティ関連イベントログ",
  "Sponsorship log": "スポンサーシップの取引ログ",
  "Developer settings": "OAuth アプリや PAT など開発者向け設定",
  Applications: "連携中のアプリケーション",
  "Fine-grained personal access tokens":
    "リポジトリ単位で権限を細かく指定できる PAT",
  "Personal access tokens": "API アクセス用の個人アクセストークン",
  "Tokens (classic)": "従来形式の個人アクセストークン",
  "OAuth Apps": "自分が登録した OAuth アプリケーション",
  "Notification settings": "通知の受け取り方の設定",

  // --- Profile / Organization navigation ---
  Profile: "ユーザーの公開プロフィールページ",
  Overview: "Organization またはユーザーの概要ページ",
  Repositories: "このユーザーまたは Organization のリポジトリ一覧",
  Stars: "Star したリポジトリの一覧",
  Gists: "自分が作成した gist の一覧",
  Organizations: "所属 Organization の一覧",
  Enterprises: "所属 Enterprise の一覧",
  "Copilot settings": "Copilot 機能の設定",
  More: "画面幅に収まらない Organization メニュー項目",
  Followers: "このユーザーをフォローしている人",
  Following: "このユーザーがフォローしている人",
  Activity: "コミットや PR などの最近の活動",
  Achievements: "GitHub 上で獲得した実績バッジ",

  // --- Notifications ---
  Inbox: "未読・既読の通知を管理する受信箱",
  Saved: "後で確認するために保存した通知",

  // --- Organization ---
  "Organization navigation": "Organization ページ間を移動するメインナビゲーション",
  People: "Organization のメンバーと外部コラボレーター",
  Teams: "Organization 内のチームと権限グループ",
  "Team visibility": "Organization メンバーにチームを表示するかどうか",
  Members: "Organization のメンバー一覧",
  "Outside collaborators": "Organization 外から招待したコラボレーター",
  "Pending collaborators": "招待を承認待ちの外部コラボレーター",
  Invitations: "Organization へのメンバー・コラボレーター招待",
  "Security managers": "セキュリティ管理者ロールを持つメンバー",
  "Security Managers": "セキュリティ管理者ロールを持つメンバー",
  Billing: "Organization の請求と利用プラン",
  "Third-party access": "外部アプリの Organization へのアクセス",
  "Third-party Access": "外部アプリの Organization へのアクセス",
  "OAuth app policy": "OAuth アプリの利用ポリシー",
  "Audit log": "Organization 内の操作履歴ログ",
  Policies: "Organization 全体のポリシー設定",
  "Verified domains": "Organization に紐づけた検証済みドメイン",
  "Role management": "Organization ロールと権限の管理",
  "Organization permissions": "Organization 全体に適用される権限設定",
  "Organization roles": "Organization 全体に適用されるロール",
  "Repository roles": "リポジトリ単位の権限ロール",
  Subscriptions: "Organization のサブスクリプションと契約",
  "Metered usage": "従量課金サービスの利用量",
  "GitHub Sponsors": "Organization としてのスポンサー活動",

  // --- Organization settings sidebar ---
  "Authentication security": "二要素認証や SAML SSO など認証の設定",
  "Verified and approved domains": "検証・承認済みドメインの管理",
  "Verified & approved domains": "検証・承認済みドメインの管理",
  Configurations: "セキュリティ分析の設定構成",
  "Global settings": "Organization 全体のセキュリティ設定",
  "Private registries": "プライベートコンテナレジストリの管理",
  "Runner groups": "Actions ランナーのグループ管理",
  "Hosted compute networking": "ホスト型ランナーのネットワーク設定",
  "Actions policies": "Organization 全体の Actions 利用ポリシー",
  OIDC: "Actions からクラウドへ安全に認証する OIDC 設定",

  // --- Copilot ---
  "Ask Copilot": "Copilot にコードや概念について質問する",
  "Open Copilot Chat": "Copilot とのチャット画面",
  "Chat with Copilot": "Copilot との対話型チャット",
  Immersive: "広い画面で Copilot を利用するモード",

  // --- Marketplace categories ---
  Apps: "GitHub にインストールできるアプリケーション",
  Models: "AI モデルの一覧と利用",
  Chat: "チャット連携機能",
  Editors: "エディタとの連携機能",
  Tools: "開発ツールの一覧",

  // --- Security & automation ---
  Agents: "AI エージェントによる自動化機能",
  "Security overview": "Organization や Enterprise のセキュリティ概要",
  "Code scanning alerts": "静的解析で検出されたコード上の脆弱性の警告",
  "Secret scanning alerts": "シークレット漏洩の可能性がある警告",
  "Advanced Security": "コードスキャン等を含む高度なセキュリティ機能",
  Automations: "課題や PR を自動処理するワークフロー",
  "Security and quality": "セキュリティと品質に関する自動化",

  // --- GitHub entity terms (nav context) ---
  Workflow: "Actions で定義された自動処理の単位",
  Run: "ワークフローの 1 回の実行",
  Job: "ワークフロー実行内の並列処理単位",
  Step: "ジョブ内の個別コマンドや処理",
  Release: "特定バージョンのソフトウェアリリース",

  // --- Gists ---
  "All gists": "公開・非公開を含む gist の一覧",

  // --- Insights / security / issues additions ---
  "Community standards": "README やライセンスなど推奨ファイルの整備状況",
  Network: "ブランチとフォークのコミット履歴を図示したグラフ",
  Dependents: "このリポジトリに依存している他のリポジトリやパッケージ",
  "Security advisories": "リポジトリの脆弱性情報を非公開で共有・公開する仕組み",
  "Sub-issues": "課題を親子関係で分割して管理する機能",
  Spaces: "Copilot に渡すコードや資料をまとめておく場所",
};
