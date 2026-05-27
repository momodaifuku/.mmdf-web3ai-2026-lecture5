# 配布の仕方

この教材を他の人（受講者・読者・参加者）に届ける方法のガイド。
講師・配布者の参考用。受講者本人は読まなくてもよい。

---

## 原版の場所

本教材の正本は **`web3ai-gairon/pub-docs` リポジトリの `line-translator-bot/` ディレクトリ** にあります:

- URL: `https://github.com/web3ai-gairon/pub-docs`
- パス: `line-translator-bot/`

受講者に渡すときは、上記 URL とディレクトリ名を伝えれば OK。README.md トップの「Claude Code 1 行プロンプト」をコピペするだけで始められる設計になっています。

---

## 推奨配布チャネル

| チャネル | 向いてる用途 | 手順 |
|---|---|---|
| **このリポジトリのまま共有** | 千葉工大 Web3/AI 概論受講者・一般公開 | URL を伝えるだけ。受講者は git clone or Code → Download ZIP |
| **GitHub Fork (自分の授業用)** | 自分の組織で改変版を配布 | 下記「GitHub Fork 配布」を参照 |
| **Notion / Confluence** | 既存ナレッジベース内に配置 | `.md` を Notion にインポート、画像は直接アップ |
| **ZIP メール / Slack 投稿** | 短期イベント、Wi-Fi 不安定環境 | `line-translator-bot/` ごと圧縮 |
| **LMS (Moodle / Google Classroom)** | 大学・スクール環境 | ZIP もしくはリンク添付 |

**最も汎用性が高いのは GitHub Public repo**。理由:
- 受講者がいつでも最新版を pull できる
- 改善提案を PR で受け取れる
- 検索エンジンで発見可能（教材普及）
- 無料、無期限

---

## GitHub Fork 配布の手順（自分の授業用に改変したい場合）

### 1. 配布前チェックリスト

- [ ] `.env` などの秘密情報がコミットされていないか確認
  ```bash
  git status
  grep -rE "LINE_CHANNEL_(SECRET|ACCESS_TOKEN)=" . --exclude-dir=.git
  ```
  → 何も見つからなければ OK。出てきたら即削除＋ローテーション
- [ ] `LICENSE` ファイルがあるか確認（CC BY-NC-SA 4.0）
- [ ] `.gitignore` に `.env`, `*.log`, `.DS_Store` 等が含まれているか
- [ ] `MANUAL.md` のスクリーンショットが必要なら追加（任意）

### 2. リポジトリ切り出し

`line-translator-bot/` ディレクトリだけを別リポジトリとして切り出して、自分の組織で運用する例:

```bash
# 原版から切り出してコピー
cp -R pub-docs/line-translator-bot /path/to/my-translator-bot
cd /path/to/my-translator-bot

# 自前リポジトリとして初期化
git init
git add .
git status            # commitされないものリストを確認
git commit -m "Initial release: LINE Translator Bot (forked from web3ai-gairon/pub-docs)"

# GitHub に新しい public repo を作って push
git remote add origin git@github.com:<your-username>/my-translator-bot.git
git branch -M main
git push -u origin main
```

その後、README.md トップの「Claude Code 1 行プロンプト」内の URL を自分のリポジトリ URL に置換することを忘れずに。

### 3. README 上部にバッジ・スクショ追加（任意）

トップに完成動画/GIF を貼るとクリック率が上がる。`assets/screenshots/` にスクリーンショットを置いて README から参照。

### 4. リポジトリ説明文（GitHub の About 欄）

短いほど良い。例:

> Ollama + Hermes + LINE で作るローカル翻訳ボットのハンズオン。Claude Code が伴走。Mac/Win/Linux 対応。約60分。

### 5. 共有 URL

受講者には GitHub の URL を共有:

```
https://github.com/<your-username>/my-translator-bot
```

受講者は git clone するか、Code → Download ZIP で取得。

---

## ZIP 配布の手順（GitHub 使わない場合）

```bash
cd /path/to/pub-docs
zip -r line-translator-bot.zip line-translator-bot/ \
  -x "*.DS_Store" "*.git*"

# サイズ確認
ls -lh line-translator-bot.zip
```

これをメール添付・Slack 投稿・Google Drive 共有など。

---

## Notion 配布の手順

1. Notion 上に新しいページを作成
2. 各 `.md` ファイルを Notion の「Import → Markdown」で取り込み
3. ページのリンクを共有

注意:
- Notion のコードブロック扱いが完璧ではないので、長いコマンドはレイアウト崩れチェックが必要
- スクリーンショットは別途貼り直しが必要
- 編集権限は「Read only」にして共有

---

## 配布後の更新

### マイナー更新（typo 修正など）

- GitHub なら push でOK、受講者は `git pull` または再ダウンロード
- ZIP/Notion は再配布が必要

### バージョン管理（任意）

CHANGELOG.md を追加してバージョンを切る方法もある:

```
## v1.0.0 (2026-05-27)
- 初版リリース

## v1.1.0 (2026-XX-XX)
- LINE UI 変更に追従して MANUAL.md を更新
- TROUBLESHOOT.md に P-WIN-2 を追加
```

---

## 受講者側の取得手順（受講者に伝える内容）

**最短ルート (推奨)** — Claude Code に下記 1 行を貼るだけ:

```
https://github.com/web3ai-gairon/pub-docs の line-translator-bot/ ディレクトリの教材を使って、ローカル翻訳 LINE Bot を一緒に作りたいです。リポジトリを clone して、line-translator-bot/README.md を読んで全体像を把握してから、私の OS / メモリ / 既存ツールを調査して、最初の構築計画を提示してください。その後は line-translator-bot/PROMPTS.md の P0 → P1 → P2 → P3 → P4 → P5 の順に伴走してください。LINE 認証情報の取得 (MANUAL.md ステップ A) で手動が必要な部分は私に案内してください。シークレット (LINE Channel secret / access token) は AI チャットに貼らない方針で進めます。
```

**従来ルート (手動で進めたい人向け)**:

```markdown
# このハンズオンを始めるには

## 1. 教材を入手

git clone https://github.com/web3ai-gairon/pub-docs.git
cd pub-docs/line-translator-bot

（または ZIP をダウンロードして line-translator-bot/ を取り出す）

## 2. Claude Code を開く

VSCode 拡張 / CLI / Web 版 のいずれか。clone したディレクトリ (`pub-docs/line-translator-bot/`) で開くのが理想。

## 3. README.md を読む

所要時間と前提を確認。

## 4. MANUAL.md のステップ A を実行（5〜10分）

ブラウザで LINE Developers Console / OA Manager を操作。

## 5. PROMPTS.md の P0 から順に Claude Code に貼り付け

あとは Claude Code が伴走してくれます。
```

これを Slack/Discord/メール で送る。

---

## ライセンス上の配慮

CC BY-NC-SA 4.0 で配布する場合、転載・改変は自由だが、

- **クレジット (Attribution)**: 元のリポジトリ・著者へのリンクを保つ
- **非商用 (NonCommercial)**: 有料セミナーや商用サービスへの組み込みは別途許諾要
- **継承 (ShareAlike)**: 改変版も同じ CC BY-NC-SA 4.0 で公開

これらは `LICENSE` ファイルに書いてあるので、配布物に LICENSE を必ず同梱する。

---

## トラブル時の連絡先

授業や配布形態によって異なる。配布前に README.md の「サポート」セクションを自分の連絡経路に書き換えるとよい。
