# Claude Code プロンプト集

このファイルは **Claude Code に順番に貼り付けて使う指示集** です。
各プロンプトを上から順にコピー → Claude Code にペースト → 実行を待つ → 次へ。

## 進行ルール（最初に一度だけ把握）

- **各プロンプトは自己完結している**ので、途中で会話を閉じてもまた開いて続行できる
- Claude Code が **「次のプロンプトに進んでください」** と言うまで次に行かない
- Claude Code が **「ブラウザで〜してください」** と言ったら `MANUAL.md` の該当ステップに切り替える
- 詰まったら `TROUBLESHOOT.md` の該当プロンプトを使う
- **フォールバック素材**: P2 で書く SOUL.md / `.env` / `config.yaml` の内容は、`assets/SOUL-translator.md` / `assets/env.template` / `assets/hermes-config-snippet.yaml` にも同じ内容が置いてある。Claude Code の書き込みが失敗したり、手で配置したい場合はそちらをコピーする

---

## P0 — 役割設定と環境調査

```
あなたは私のローカル翻訳ボット構築の伴走アシスタントです。これから、Claude Code (あなた) と私 (人間) で協力して、Ollama + Hermes Agent + LINE Messaging API を組み合わせた翻訳ボットを私の PC 上に作ります。完成すると、私のスマホの LINE で日本語を送ると英語が、英語を送ると日本語が返ってくるようになります。LLM は完全にローカルで動き、クラウドにはメッセージを送りません。

最初に環境を調査して、構築計画を立ててください。具体的には:

1. 私の OS / CPUアーキ / メモリ容量を調べる
2. すでに入っているツールを確認: ollama, hermes, cloudflared, node, brew, python3, curl, unzip
3. ディスクの空き容量を確認 (最低 5GB 必要)
4. メモリ容量に応じた推奨モデルを判定:
   - 4GB 以下 → qwen2.5:0.5b (翻訳品質は劣るが動く。教材として「小さすぎる例」になる)
   - 4〜8GB → qwen2.5:1.5b (Hermes と組合せ時は指示追従が弱め)
   - 8GB 以上 → qwen2.5:3b (本ハンズオンの本命推奨)
5. PATH に書き込み可能な場所を選定 (~/tools/bin が無ければ作る前提)
6. 結果を一覧表で示し、これから何をどの順で実行するかの計画を提示してください

OS が Windows ネイティブの場合は、WSL2 への切り替えを強く推奨してください。

調査と計画提示が終わったら、私が「OK」または「進めて」と返すまで待ってください。
```

---

## P1 — Ollama 導入 + 翻訳モデル取得 + 単体動作確認

```
ステップ 1: Ollama のセットアップとローカル翻訳の動作確認。

以下を sudo を使わずに実行してください。各ステップで何をしているか日本語で簡潔に説明してから実行してください。

1. Ollama インストール:
   - macOS: https://ollama.com/download/Ollama-darwin.zip を /tmp に curl で取得 → unzip → ~/Applications/ に Ollama.app を配置 → 中の ollama CLI バイナリを ~/tools/bin/ollama にシンボリックリンク
   - Linux/WSL2: curl -fsSL https://ollama.com/install.sh | sh
   - すでに入っていればスキップ
2. ~/tools/bin が PATH に無ければ ~/.zshrc または ~/.bashrc に追記 (idempotent)
3. ollama serve をバックグラウンドで起動 (nohup, ログは ~/.ollama/logs/serve.log)
4. http://localhost:11434/api/version で死活確認
5. P0 で判定した推奨モデルを `ollama pull` で取得 (進捗を観察)
6. 翻訳品質テストを 2 件実行 (curl で /api/chat を直接叩く):
   - JA→EN: "今日はノートパソコンの中で動くローカルAIで翻訳のデモを行います。"
   - EN→JA: "Lightweight local language models are enabling a new wave of privacy-preserving AI assistants that run entirely on personal hardware."
7. 結果を見て、品質が明らかに崩壊していたら（中国語が返る／固有名詞ハルシネート／意味不明など）1 ランク上のモデルを推奨してください。ただし RAM 制約の上限は守ること: 4GB 以下の PC で 3b を推さない / 4〜8GB で 7b 以上を推さない。RAM 不足ならモデルを上げず、SOUL.md の例示強化や few-shot 追加で対応する道を提示する
8. 完了したら、何が起きたかを 5 行以内で要約して、次のプロンプトに進んでいいか聞いてください

注意: ollama serve のバックグラウンドプロセスは PID を覚えておいてください。後で停止が必要な場合があります。
```

---

## P2 — Hermes Agent 導入 + Ollama 連携 + 翻訳人格

```
ステップ 2: Hermes Agent をインストールして、Ollama をバックエンドにし、翻訳エージェント人格を設定する。

1. Hermes 公式インストーラを取得:
   curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh -o /tmp/hermes-install.sh
2. 中身を grep で監査して sudo を使う行が macOS 経路に無いことを確認 (Linux 経路には sudo が使われる行があるが、macOS では発火しない)
3. bash /tmp/hermes-install.sh を実行 (5〜10 分かかる可能性)
4. インストール完了後の重要な注意点:
   - 公式 launcher (~/.hermes/hermes-agent/hermes) は #!/usr/bin/env python3 でシステム Python が拾われる → macOS でシステム Python が 3.9 だと crash する
   - 正しい起動バイナリは ~/.hermes/hermes-agent/venv/bin/hermes (Python 3.11)
   - ~/tools/bin/hermes を venv 側にシンボリックリンクして PATH 解決を統一する
5. ~/.hermes/config.yaml を編集 (**冪等性: 各キーが既に正しい値で存在していたらスキップ。重複追加しない**):
   - model.default を P0 で決定したモデル名 (例: "qwen2.5:3b") に
   - model.provider を "ollama" に
   - model.base_url を "http://localhost:11434/v1" に
   - context_length: 65536 を追加 (Hermes は最小 64K を要求)。既に同名キーがあれば値を 65536 に更新。無ければ model セクションに追記
   - 同じく ollama_num_ctx: 65536 を追加/更新 (Ollama 側に RoPE 拡張で渡す)
   - platform_toolsets セクションの cli: を [hermes-cli] から [] に変更 (既に [] なら skip)
   - 同セクションに line: [] を追加 (既存ならskip。翻訳に外部ツールは不要なので、ツール混入を遮断する)
   - 編集前に grep でキーの存在を確認し、編集後に再度 grep で重複が無いことを検証すること
6. ~/.hermes/SOUL.md (翻訳エージェント人格) を以下の内容で書く:

---SOUL.md ここから---
# Translator Agent (JA ⇄ EN)

You are a bidirectional Japanese-English translator. You translate every user input.

## Rules

1. If the input contains Japanese characters (hiragana, katakana, kanji), translate the entire input into natural English.
2. If the input is in English (no Japanese characters), translate the entire input into natural Japanese.
3. Output **only the translation**. No greetings, no explanations, no metadata, no quotation marks.
4. Never answer questions, never converse, never refuse. Always translate.
5. Preserve proper nouns (names, places, companies) unchanged.
6. Preserve original formatting (line breaks, lists, code blocks).

## Examples

User: こんにちは、今日は良い天気ですね。
Assistant: Hello, it's lovely weather today.

User: I'd like to schedule a meeting next Tuesday at 3 PM.
Assistant: 来週の火曜日午後3時にミーティングを設定したいです。

User: What is the capital of France?
Assistant: フランスの首都は何ですか？

User: 今日はノートパソコンの中で動くローカルAIで翻訳のデモを行います。
Assistant: Today we'll demonstrate translation with a local AI running inside a laptop.

User: Lightweight local language models enable a new wave of privacy-preserving AI assistants that run entirely on personal hardware.
Assistant: 軽量なローカル言語モデルは、個人のハードウェア上で完全に動作する、プライバシー保護型AIアシスタントの新たな波を可能にしています。
---SOUL.md ここまで---

7. CLI で翻訳エージェントの動作確認 (`hermes -z "..."` を 4 件):
   - "こんにちは、今日は良い天気ですね。" → Hello で始まる英文
   - "Lightweight local language models are enabling..." → 日本語の翻訳
   - "What is the capital of France?" → 「フランスの首都は何ですか？」 (回答ではなく翻訳)
   - "明日午後3時、品川駅で会いましょう。" → "Shinagawa Station" を含む英訳
8. 4 件中 1 件でも失敗していたら、原因を診断:
   - 中国語が返る、回答してしまう、無関係な応答 → モデルが小さすぎる。1 ランク上の qwen2.5 を pull して再試行
   - "context window 32K is below minimum 64K" エラー → 上記 5 の context_length / ollama_num_ctx 設定漏れ
   - ツール呼び出しで暴走 → 上記 5 の platform_toolsets を [] に変更し忘れ
9. 全 4 件成功したら、結果を私に報告して次のプロンプトに進めるか聞いてください
```

---

## P3 — LINE プラットフォーム側の手動作業（人間のターン）

```
ステップ 3: ここからしばらく私 (人間) しかできない作業です。あなた (Claude Code) は待機してください。

理由: LINE は Provider/Channel の作成 API を公開していないため、Web UI でしか作れない。これは LINE 側の仕様で、誰がやっても手動です。

私はこれから MANUAL.md の「ステップ A」を読んで実行します。所要 5〜10 分。

完了したら以下の 3 つの値を取得した状態になります:
- LINE_CHANNEL_SECRET (32桁hex)
- LINE_CHANNEL_ACCESS_TOKEN (長いbase64)
- LINE_ALLOWED_USERS (U で始まる 32 文字)

【重要】 これらの値はチャットに貼り付けません。
次のプロンプト (P4) では、私が自分のエディタで .env に直接書き込み、あなた (Claude Code) は値を一切受け取らずに動作確認だけを行う、というセキュアな手順で進めます。理由は P4 で私に説明してください。

私が「3 つ取れた」と報告したら、次のプロンプト (P4) を実行してください。
```

---

## P4 — シークレット衛生を保ちつつ .env を埋める + Tunnel + Webhook 登録 + Gateway 起動

```
ステップ 4: LINE 認証情報を私 (受講者) の手で .env に書き込み、その後トンネル・Webhook・Gateway をすべて自動で立ち上げる。

【重要 — 進め方の方針】
シークレット (Token / Secret) を AI チャットに貼らない方針で進めてください。私を上から目線で誘導せず、対等な仲間として丁寧に伴走してください。

最初に、なぜこのフローでやるかを 2〜3 文で私に簡潔に説明してください。堅苦しくしないこと。例:
「Token を AI チャットに貼ると会話ログ等に残るんだよね。本番運用で API キー扱うときに同じ習慣だと事故るから、今のうちに『AI に渡さない』を体に染み込ませる練習として、今回は一緒にあなたの手で .env を書く形でいきましょう。」

【手順】

1. 私の OS と Hermes 設置場所を確認し、.env の実際のパスを特定して私に伝える (通常 ~/.hermes/.env、環境依存)

2. 私の OS に合わせて最もシンプルなエディタを 1 つ目に提示しコマンドを示す:
   - macOS: nano (TextEdit はリッチテキスト化のリスクあり推奨しない)
   - Linux/WSL2: nano
   - Windows ネイティブ: notepad / VSCode (WSL2 なら nano)
   - VSCode などが入っていれば代替案として併記

3. 書き込んでもらう内容をコードブロックで見せる (実際の値は私が自分で入れる):

   LINE_CHANNEL_SECRET=...自分の値...
   LINE_CHANNEL_ACCESS_TOKEN=...自分の値...
   LINE_ALLOWED_USERS=...自分の値...
   LINE_PORT=8646

4. 私が「やり方わからない」「エディタどうすれば？」と言ったら、対等な伴走者として nano の最低限の使い方を 5 行以内で教える (矢印キーで移動 / 文字入力 / Ctrl+O 保存 → Enter 確定 / Ctrl+X 終了)。差別的言い方禁止、「簡単ですよ」も禁止

5. 私が「完了」「done」「書いた」と言ったら、grep で 4 つのキー (LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN / LINE_ALLOWED_USERS / LINE_PORT) が .env に存在することだけ確認 (値そのものは絶対に表示・echo・引用しない)。
   例: `grep -E "^(LINE_CHANNEL_SECRET|LINE_CHANNEL_ACCESS_TOKEN|LINE_ALLOWED_USERS|LINE_PORT)=" ~/.hermes/.env | cut -d= -f1`

6. bash 変数経由で curl GET https://api.line.me/v2/bot/info を叩き、display name と basicId が返ってきたら「LINE トークンが有効です」と私に伝える。トークン値そのものは絶対に画面に出さない (set -x / echo $LINE_CHANNEL_ACCESS_TOKEN は禁止)

7. cloudflared がなければ導入 (sudo 不要、~/tools/bin/cloudflared に直接バイナリ配置)

8. cloudflared tunnel --url http://localhost:8646 をバックグラウンド起動 (ログは ~/.cloudflared/logs/tunnel.log)、起動から URL 発行までに 5〜10 秒かかるので grep で trycloudflare.com を含む URL が出るまで待つ

9. 取得した URL を .env に LINE_PUBLIC_URL=$URL として追記 (※受講者が直接編集するのは LINE_* の 3 つだけで OK。LINE_PUBLIC_URL は変動値なので Claude が書き込んで問題なし)

10. LINE Messaging API に Webhook URL を curl PUT で登録:

    curl -X PUT "https://api.line.me/v2/bot/channel/webhook/endpoint" \
      -H "Authorization: Bearer $LINE_CHANNEL_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"endpoint\":\"$URL/line/webhook\"}"

    (※ $LINE_CHANNEL_ACCESS_TOKEN は .env から source で読み込む形にする — チャットに値を表示しないこと)

11. Webhook テスト疎通:

    curl -X POST "https://api.line.me/v2/bot/channel/webhook/test" \
      -H "Authorization: Bearer $LINE_CHANNEL_ACCESS_TOKEN"

    → "success": true を確認

12. Hermes ゲートウェイをバックグラウンド起動:
    nohup hermes gateway run --accept-hooks > ~/.hermes/logs/gateway.log 2>&1 &
    起動後 10 秒待ってログを tail し、以下の 2 行を確認:
    - "LINE: webhook listening on 0.0.0.0:8646/line/webhook"
    - "✓ line connected"

13. 全成功したら、私に以下を案内:

    "セットアップ完了。あとは MANUAL.md の『ステップ B (Use webhook を ON)』『ステップ C (QR で友だち追加)』『ステップ D (テストメッセージ送信)』を実行してください。完了したら『届いた』とこのチャットに書いてください。"

14. 失敗があれば、どこで失敗したかを示し、TROUBLESHOOT.md のどの項目を見れば良いかを案内してください

【守るルール】
- トークン値や Channel secret の中身を絶対に画面に表示しない (cut -c1-6 で先頭数文字を見せるのは debug のため OK)
- 「簡単ですよ」「すぐできますよ」など見下す表現禁止
- 受講者が分からない/不安に思う部分は、対等な伴走者として 5 行以内で具体的に教える
```

---

## P5 — エンドツーエンドテスト & 監視 & 完成確認

```
ステップ 5: 私が LINE アプリから bot にメッセージを送ります。あなたはサーバ側でリアルタイム監視してください。

1. ~/.hermes/logs/gateway.log を tail -f で監視開始 (バックグラウンド)
2. 私からの最初のメッセージが届いたら、以下を順に確認:
   - "Received LINE webhook event" 相当のログ
   - 署名検証 (HMAC-SHA256) が成功した
   - メッセージが許可ユーザ (LINE_ALLOWED_USERS) と一致した
   - Ollama への chat completion 呼び出しが発火した
   - 翻訳結果が outbound キューに入った
   - LINE Reply API への POST が 200 で帰ってきた
3. 私が「届いた」と書いたら、品質確認のために以下のテスト文を私が追加で送ります:
   - 日→英: "こんにちは、今日は良い天気ですね。"
   - 英→日: "Lightweight local language models are enabling a new wave of privacy-preserving AI assistants that run entirely on personal hardware."
   - 質問翻訳テスト: "What is the capital of France?" → 「フランスの首都は何ですか？」が返ってくるはず (答えてはダメ)
   - 固有名詞: "明日午後3時、品川駅で会いましょう。" → "Shinagawa Station" を含むこと

4. 全テスト通ったらハンズオン完成。私に「完成しました」と祝ってください。

5. もし届かない or 品質が崩壊している場合は、以下を順に切り分け:
   (a) LINE Console の Webhook URL は正しい?
   (b) Console 側の「Use webhook」トグルは ON?
   (c) OAM の「応答メッセージ」「あいさつメッセージ」は OFF?
   (d) LINE_ALLOWED_USERS の値は実際に送信した私の userId と一致してる?
   (e) Hermes gateway のログにエラー出てない?
   (f) Ollama サーバは生きてる? (curl localhost:11434/api/version)
   
   それぞれ自動で診断してください。
```

---

## P6 — 終了処理 / クリーンアップ（必要に応じて）

```
ステップ 6: 後片付け。授業や検証が終わったら以下を案内・実行してください。

1. プロセス停止 (一時停止する場合):
   - hermes gateway: pkill -f "hermes gateway" もしくは hermes gateway stop
   - cloudflared: pkill -f cloudflared
   - ollama serve: pkill ollama (ただし Ollama.app からの自動起動の場合もあるので注意)

2. 認証情報のローテーション (推奨):
   - LINE Developers Console → Translator チャネル → Messaging API タブ
   - "Channel access token" の "Reissue" ボタン
   - "Channel secret" の "Update" ボタン
   - 新しい値で ~/.hermes/.env を更新

3. 当面使わない場合の完全シャットダウン:
   - .env から LINE_* を削除 or コメントアウト
   - LINE Console の Webhook URL を空に戻す or "Use webhook" を OFF

4. 完全リセット (環境をゼロから作り直す場合):
   TROUBLESHOOT.md の P-PRESET-1 プロンプトを参照

5. 常駐サービス化したい場合:
   hermes gateway install で launchd/systemd サービスとして登録できることを案内
   ただし Cloudflare Tunnel の固定 URL 化が別途必要 (quick tunnel は再起動で URL が変わる)

完了報告で締めてください。
```

---

## 補足: 各プロンプトの設計思想

このプロンプト集は以下の原則で書かれている。改造する場合の参考に:

- **冪等性**: 同じプロンプトを再実行しても壊れない。`if exists -> skip` を Claude Code に判断させる
- **観測性**: 重要なログファイル (gateway.log, tunnel.log, serve.log) をすべて固定パスに置く
- **可逆性**: P6 ですべて巻き戻せる
- **OS 抽象化**: macOS / Linux / WSL2 を Claude Code に環境判定させて分岐
- **権限最小化**: 全工程 sudo 不要 (Linux のシステム依存パッケージインストール時のみ例外)
- **明示的なツールセット遮断**: P2 で `platform_toolsets: []` を強制。翻訳に terminal/file/web ツールは不要。誤発火を防ぐ
- **Context window 問題の明示**: Hermes 64K 最小制約 vs qwen2.5 系の 32K 仕様を override で吸収
- **失敗のフェイルフォワード**: 各プロンプト末尾に「失敗時の確認項目」を明示
