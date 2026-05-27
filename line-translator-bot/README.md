# LINE Translator Bot — ハンズオン教材

**Claude Code を主役に**、ローカル LLM (Ollama) と Hermes Agent と LINE Messaging API を組み合わせて、自分の PC で動く翻訳ボットを 1 時間で作るハンズオン教材です。

> 千葉工業大学「Web3/AI 概論」の授業向けに開発。他の授業や個人学習に再利用可能（ライセンス: CC BY-NC-SA 4.0）。

---

## 🚀 まず最初に — これを Claude Code に貼って始める

新しい Claude Code 会話を開いて、以下の **1 行プロンプト** をそのまま貼り付けてください。あとは伴走で進みます。

```
https://github.com/web3ai-gairon/pub-docs の line-translator-bot/ ディレクトリの教材を使って、ローカル翻訳 LINE Bot を一緒に作りたいです。リポジトリを clone して、line-translator-bot/README.md を読んで全体像を把握してから、私の OS / メモリ / 既存ツールを調査して、最初の構築計画を提示してください。その後は line-translator-bot/PROMPTS.md の P0 → P1 → P2 → P3 → P4 → P5 の順に伴走してください。LINE 認証情報の取得 (MANUAL.md ステップ A) で手動が必要な部分は私に案内してください。シークレット (LINE Channel secret / access token) は AI チャットに貼らない方針で進めます。
```

> 💡 **ブラウザで見たい場合**: `pub-docs/line-translator-bot/index.html` をダブルクリックすれば、Step 1/2 のハブ画面 (GUI 版) が開きます。Claude Code 経由でも HTML 経由でも、たどり着く先は同じです。

---

## 完成イメージ

スマホの LINE で:

- 日本語を送る → **英語が返る**
- 英語を送る → **日本語が返る**
- 翻訳は手元の PC で動く LLM が処理する（クラウド送信ゼロ）
- LINE は無料、Cloudflare Tunnel は無料、Ollama は無料、Hermes は無料

→ **Claude Code のサブスク代以外、完全無料**。

---

## 所要時間

| パート | 時間 |
|---|---|
| LINE Console 手動作業（ブラウザのみ） | 5〜10 分 |
| Claude Code がやってくれるセットアップ | 15〜25 分（インストール DL 時間込み） |
| 動作確認 & トラブル対処バッファ | 10〜30 分 |
| **合計** | **30〜60 分** |

---

## 動作確認済み環境

- **macOS 26.4 (Apple Silicon, arm64)** — 本教材の主な検証環境
- メモリ容量に応じて自動的にモデルが選ばれる:
  - **8GB 以上** → `qwen2.5:3b` (本ハンズオン推奨)
  - **4〜8GB** → `qwen2.5:1.5b`
  - **4GB 以下** → `qwen2.5:0.5b` (教材的に「崩壊例」として使える)
- Claude Code (公式 CLI)
- ネットワーク: 通常のインターネット接続（社内ファイアウォール環境では QUIC が通らない場合あり）

### Windows の場合

**WSL2 (Ubuntu) 上で実行を強く推奨**。Hermes ネイティブ Windows 版は早期ベータで一部機能制限あり。WSL2 内では Mac と同一手順がそのまま通る。

WSL2 未導入の人は、PowerShell を管理者で開いて:
```powershell
wsl --install
```
を実行 → Ubuntu が立ち上がる → 以後 Ubuntu の中で作業。

### Linux

Ubuntu/Debian/Fedora/Arch などで動作する想定。インストール時に `sudo apt` などを要求される場合あり。

---

## 進め方

### 推奨ルート（HTML をクリックしながら）

1. **`index.html` をダブルクリックでブラウザで開く** — 全体ハブ画面が出ます
2. **「Step 1 — ローカル AI を作る」** カードをクリック → 表示されたプロンプトをコピーして Claude Code に貼る → 対話で進める
3. **「Step 2 — LINE と繋げる」** カードをクリック → ブラウザで LINE 認証情報を取得 → プロンプトを Claude Code に貼る
4. 完成後、**「カスタマイズ」** カードから派生 Bot のレシピへ
5. 途中で「なぜ Hermes なの？ OpenClaw / NanoClaw との違いは？」と気になったら、**「ちなみに解説 — フレームワーク比較」** (`compare.html`) を参照

### 文書だけで進めたい場合

HTML が使えない / 苦手 / GitHub の閲覧上で進めたい場合は、`.md` ファイル直接でも完結します:
1. `MANUAL.md` のステップA を先に終わらせる（LINE 認証情報 3 つ取得、5〜10 分）
2. `PROMPTS.md` の P0 から順に Claude Code に貼る
3. 動かなくなったら `TROUBLESHOOT.md` から症状に合うプロンプトを投げる

---

## 🛡 シークレット衛生 — このハンズオンの方針

LINE のトークン・シークレットを **Claude Code (AI チャット) に貼り付けない** 方針で進めます。代わりに、`.env` ファイルへの書き込みは受講者自身が自分の手で行い、Claude Code は値を一切受け取らずに動作確認だけを行う、というセキュアな手順を採用しています (Step 2 / PROMPTS.md の P4)。

理由：本番運用で API キーを扱うとき、AI チャットにシークレットを貼る習慣があると会話ログ・スクショ・転送先に残って事故ります。今回の翻訳 Bot は被害低いですが、**「AI に渡さない」を体に染み込ませる練習** として最初から徹底します。

---

## ファイル構成

### 受講者がじかに開く（HTML — メイン）

| ファイル | 役割 |
|---|---|
| **`index.html`** | **入口**。ダブルクリックで開く。全体ハブ画面 |
| `step1.html` | ローカル AI 構築の手順とプロンプト |
| `step2.html` | LINE 連携の手順とプロンプト |
| `customize.html` | 完成後の派生 Bot レシピ集 |
| `compare.html` | ちなみに解説 — OpenClaw / NanoClaw / Hermes 比較 |

### 文書版（Claude Code が読む & HTML から参照）

| ファイル | 役割 |
|---|---|
| `README.md` | このファイル（全体マップ） |
| `PROMPTS.md` | 詳細な runbook (HTML 内のプロンプトの根拠) |
| `MANUAL.md` | LINE Console 等の手動操作詳細 |
| `TROUBLESHOOT.md` | エラー時の診断プロンプト集 |

### 配布者向け

| ファイル | 役割 |
|---|---|
| `INSTRUCTOR.md` | 他の授業・組織で転用する人向けガイド |
| `DISTRIBUTION.md` | GitHub / ZIP / Notion 等で配布する手順 |

### サポートファイル

| ファイル | 役割 |
|---|---|
| `LICENSE` | CC BY-NC-SA 4.0 ライセンス本文 |
| `.gitignore` | Git でコミットしてはいけないものリスト |
| `style.css` / `app.js` | HTML 用スタイル・スクリプト (依存ゼロ) |
| `assets/SOUL-translator.md` | 翻訳人格ファイルの抽出版（手動配置用フォールバック） |
| `assets/env.template` | `.env` の追記内容テンプレート |
| `assets/hermes-config-snippet.yaml` | Hermes 設定変更箇所の抜粋 |
| `assets/screenshots/` | LINE UI スクリーンショット置き場（配布者が追加） |

---

## 中断・再開

途中で中断したり、別の日にやり直したりするのもOK。Claude Code は冪等（idempotent）に設計されている — 同じプロンプトを再実行しても、すでに済んでいる作業はスキップする。

完全リセットしたい場合は `TROUBLESHOOT.md` の **P-PRESET-1** プロンプトを使う。

---

## 本ハンズオンで触れる技術スタック

```
[ ノート PC (Mac / Win+WSL2 / Linux) ]
  ├─ Claude Code           ← 開発・設定オペレータ（あなたの相棒）
  ├─ Ollama                ← ローカル LLM 実行環境
  │    └─ qwen2.5:3b (推奨) / 1.5b / 0.5b
  ├─ Hermes Agent          ← AI エージェントのオーケストレータ
  │    └─ plugins/platforms/line  (公式 LINE アダプタ同梱)
  └─ cloudflared           ← 公開 HTTPS トンネル (無料・URL自動発行)
                 ↕
        LINE Messaging API (Developer Free Plan)
                 ↕
              スマホの LINE
```

---

## ライセンス・再配布

本教材は **CC BY-NC-SA 4.0** ライセンスで提供されます（非営利・継承条件付き）。詳細は `LICENSE` を参照。

サードパーティ素材は各々のライセンスに従う:

- Ollama: MIT
- Hermes Agent: MIT
- qwen2.5 (重み): Apache 2.0
- LINE Messaging API: LINE 利用規約

## 配布方法・転用

- 受講者に配る場合: `DISTRIBUTION.md` を参照
- 他の授業・組織で転用する場合: `INSTRUCTOR.md` を参照

---

## サポート

- 授業中に詰まったら、隣の人・受講グループ・講師に相談
- バグや改善提案は配布元の Issue / メール / Notion 等で（配布形態による）
