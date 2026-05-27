# トラブルシューティング

エラーや想定外の挙動が起きたとき、症状に合うプロンプトを Claude Code にそのまま貼り付けてください。各プロンプトは Claude Code が自分で診断 → 修復するための指示になっています。

## 症状索引

- **Ollama 関連**: P-OLLAMA-1, P-OLLAMA-2
- **モデル品質**: P-MODEL-1, P-MODEL-2, P-MODEL-3
- **Hermes 設定**: P-HERMES-1, P-HERMES-2, P-CTX-1
- **LINE / Webhook**: P-WEBHOOK-1, P-WEBHOOK-2, P-LINE-1, P-LINE-2
- **Cloudflare Tunnel**: P-TUNNEL-1, P-TUNNEL-2
- **環境 / OS / RAM**: P-ENV-1, P-RAM-1, P-WIN-1
- **完全リセット**: P-PRESET-1

---

## Ollama

### P-OLLAMA-1: Ollama サーバが起動しない / ポートに繋がらない

```
Ollama サーバが反応しません。以下を順に診断してください:
1. ollama プロセスが動いているか (ps aux | grep ollama)
2. localhost:11434 が LISTEN しているか (lsof -i :11434)
3. ~/.ollama/logs/serve.log の直近のエラー
4. macOS の場合、Ollama.app が常駐サービスとしてバックグラウンド起動しているか
5. プロセスが死んでいたら nohup で再起動して死活確認

原因と修復方法を日本語で説明してから実行してください。
```

### P-OLLAMA-2: モデル pull が遅い / 途中で止まる

```
ollama pull が進まない/途中で止まっています。
1. ネットワーク確認: ping ollama.com および curl -I https://registry.ollama.ai
2. 部分ダウンロードが残っていれば ollama pull で resume されるはず
3. ディスク空き容量チェック
4. 別のミラーやチェックポイントが使えるか調査

ダウンロードに 10 分以上かかっているようなら、より小さいモデルで進める提案もしてください。
```

---

## モデル品質

### P-MODEL-1: 翻訳結果が崩壊している (中国語が返る、固有名詞ハルシネート、応答してしまう)

```
翻訳テストで品質が崩壊しました。具体的には:

[ここに実際の入力と出力を貼る — 例:
入力: "Hello, the weather is nice today."
期待: 日本語訳
実際: "你好，今天的天气真好。" (中国語が返る)
]

現在使っているモデルを ollama list で確認し、以下のどれが妥当か診断してください:

(a) SOUL.md の few-shot 例示を強化する (同じモデルで再挑戦)
(b) 1 ランク上のモデルに上げる (qwen2.5:0.5b → 1.5b → 3b)
(c) Hermes の platform_toolsets 設定が漏れていて、ツール呼び出しが暴走している
(d) その他

私の RAM 容量を踏まえて、現実的な選択肢を 1 つに絞ってから実行してください。
```

### P-MODEL-2: 3b でも翻訳がもたつく / Mac が固まる

```
qwen2.5:3b が私の環境では重すぎます (Mac が固まる/応答に 30 秒以上)。
1.5b に落としつつ、SOUL.md を 1.5b の指示追従力でも安定するように書き直してください。

具体的には:
- ~/.hermes/config.yaml の model.default を qwen2.5:1.5b に
- SOUL.md の例示をより具体的に、ルールをより短く明確に
- platform_toolsets が [] になっていることを再確認

書き換え後に CLI で 4 件の翻訳テストを実行し、結果を見せてください。
```

### P-MODEL-3: モデルを 0.5b に落としたい (デモで「小さすぎる例」を見せたい)

```
教材として「0.5b では翻訳が崩壊する」を実演したいです。

1. ~/.hermes/config.yaml の model.default を qwen2.5:0.5b に切り替え
2. Ollama 再ロードを促す (curl POST /api/generate with keep_alive=0)
3. CLI で JA→EN と EN→JA を 1 件ずつ実行して、どのように崩壊するか観察 (中国語が返る、英語が含まれる、固有名詞が変わる、など)
4. 元に戻すコマンドも提示

実行結果をスクショ用に整形して見せてください。
```

---

## Hermes Agent

### P-HERMES-1: hermes コマンドが SyntaxError や ModuleNotFoundError で起動しない

```
hermes コマンドを実行すると Python の SyntaxError が出ます (str | None の構文エラーなど)。

原因はおそらく、~/.hermes/hermes-agent/hermes (公式 launcher) が #!/usr/bin/env python3 で
システムの古い Python (3.9 以下) を拾ってしまっているせいです。

修復:
1. ~/.hermes/hermes-agent/venv/bin/hermes が存在することを確認
2. ~/tools/bin/hermes を venv/bin/hermes へのシンボリックリンクに張り直す
3. PATH 上で ~/tools/bin が古いシンボリックリンクより前に来ているか確認
4. hermes --version で 0.14 以上が出るか確認

実行してください。
```

### P-HERMES-2: hermes gateway が起動するがすぐ落ちる

```
hermes gateway run を起動しても数秒で落ちます。~/.hermes/logs/gateway.log の直近 50 行を
表示して、原因を特定してください。

考えられる原因:
- LINE 認証情報の形式不正
- Ollama 接続失敗 (localhost:11434 不到達)
- ポート 8646 がすでに使われている
- launchd 既存プロセスとのバッティング

特定したら対処してください。
```

### P-CTX-1: "context window 32K is below minimum 64K" エラー

```
Hermes 起動で以下のエラーが出ます:

ValueError: Model qwen2.5:1.5b has a context window of 32,768 tokens,
which is below the minimum 64,000 required by Hermes Agent.

これは qwen2.5 系の native context が 32K しかなく、Hermes が 64K を要求するためです。
Ollama 側に num_ctx=65536 を渡して RoPE 拡張で対処します。

~/.hermes/config.yaml の model セクションに以下を追加してください (既存ならスキップ):

  context_length: 65536
  ollama_num_ctx: 65536

その後、Ollama にロード済みモデルを一旦アンロード (keep_alive=0) して、
新しい num_ctx でロードし直す curl コマンドを実行。
再度 hermes 起動でエラーが消えることを確認してください。
```

---

## LINE / Webhook

### P-WEBHOOK-1: webhook test が 404 / 503 を返す

```
curl POST /v2/bot/channel/webhook/test の結果が success: false です。
詳細を見て原因を特定してください:

1. Hermes gateway が起動しているか (ps aux | grep hermes)
2. localhost:8646/line/webhook に GET したら 405 が返るか (これは正常)
3. cloudflared tunnel URL が現在のものと一致しているか
   - ~/.cloudflared/logs/tunnel.log から現在の trycloudflare.com URL を抽出
   - .env の LINE_PUBLIC_URL と一致してるか
   - LINE Developers Console の Webhook URL と一致してるか (API で取得して比較)
4. 不一致があれば、Console 側の URL を最新値で再登録 (API 経由でも可)

順に診断してください。
```

### P-WEBHOOK-2: webhook test は成功するが、LINE から送ると無反応

```
LINE から bot にメッセージを送っても何も返ってきません。
~/.hermes/logs/gateway.log を tail で監視しながら、私がもう一度メッセージを送ります。

1. メッセージ送信時に gateway.log に行が増えるかを観察
2. 行が増える → 署名検証エラーや allowed_users 不一致を疑う
3. 行が増えない → cloudflared がトンネルしてない / Use webhook が OFF を疑う

特に LINE_ALLOWED_USERS の値が、私の実際の userId と一致しているかを優先的に確認。
GET /v2/bot/info で bot 自身の userId は分かるが、私 (発信側) の userId は webhook event
の source.userId に入っているので、ログ内のそれと .env を比較してください。
```

### P-LINE-1: bot が「ありがとうございます」のような定型文を返す (Hermes ではない)

```
bot からの返信が翻訳結果ではなく、「ありがとうございます」「メッセージありがとうございます」
のような LINE 標準テンプレが返ります。

原因: OAM の「応答メッセージ」または「あいさつメッセージ」が ON のままになっている。
これは API では切れないので、私がブラウザで OAM を開いて手動 OFF します。

私が開くべき URL を生成してください (basic ID は .env か /v2/bot/info から取得)。
OFF にする手順を MANUAL.md の A-4 へ案内してください。
```

### P-LINE-2: bot が複数回同じ返信を返す / 返信が遅延して大量に届く

```
bot からの返信が二重に届きます/遅れて 5 通くらい届きます。

考えられる原因:
1. Hermes gateway のプロセスが複数起動している (pkill -f "hermes gateway" → 1 つだけ起動)
2. cloudflared tunnel が複数走っている (pkill -f cloudflared → 1 つだけ起動)
3. LINE 側の retry がストックされている

順に確認・対処してください。
```

---

## Cloudflare Tunnel

### P-TUNNEL-1: cloudflared が QUIC 接続失敗 (会社/学校ファイアウォール)

```
~/.cloudflared/logs/tunnel.log に QUIC connection failed のエラーが出ています。
原因はネットワーク側で UDP がブロックされている可能性が高いです。

対処:
1. cloudflared tunnel --url http://localhost:8646 --protocol http2 で再起動
2. それでもダメなら ngrok や localtunnel を提案
3. ngrok のインストールと使い方を案内 (要アカウント / トークン)

実行してください。
```

### P-TUNNEL-2: trycloudflare.com URL が再起動で変わってしまう

```
cloudflared を再起動するたびに URL が変わるので、LINE 側の Webhook URL を毎回貼り替えるのが面倒です。

恒久対応:
1. Cloudflare アカウントを作って (無料)
2. cloudflared tunnel login で認証
3. cloudflared tunnel create translator-bot で named tunnel 作成
4. ~/.cloudflared/config.yml で localhost:8646 にマッピング
5. cloudflared tunnel route dns translator-bot translator.example.com (自分の Cloudflare 管理ドメインが必要)

ドメインを持っていない場合は ngrok の有料プランで固定 URL を取るのが代替案。

私の状況に応じて最適な道筋を 1 つ提案してください。
```

---

## 環境 / OS / RAM

### P-ENV-1: 環境チェックをやり直したい (途中から参加 / 別の PC でやり直し)

```
セットアップを途中から再開します。現在の私の環境を一通り調査して、
P0 と同じ環境レポートを出してから、すでに済んでいるステップと
まだのステップを判定してください。

ステップ判定基準:
- P1 完了: ~/tools/bin/ollama が動き、qwen2.5 系モデルが ollama list に出る
- P2 完了: ~/tools/bin/hermes が動き、~/.hermes/SOUL.md に translator 内容が入っている
- P3 完了: ~/.hermes/.env に LINE_CHANNEL_SECRET 等が書かれている
- P4 完了: hermes gateway が起動中で、LINE: webhook listening のログが出ている
- P5 完了: 実機からのテスト翻訳が届いた (これは私の自己申告)

判定結果を表で示して、続きのプロンプト番号を案内してください。
```

### P-RAM-1: メモリが足りない / システム全体が遅くなる

```
qwen2.5:3b を動かすと Mac/PC 全体が遅くなります。私のメモリ容量を確認した上で、
以下を提案してください:

(a) qwen2.5:1.5b へ縮小 (推奨)
(b) Ollama の OLLAMA_KEEP_ALIVE を短くしてメモリを早めに解放
(c) qwen2.5:0.5b に落として教材的に「小さすぎる例」として運用
(d) Ollama を一旦停止して、demo 直前に起動するスクリプト化

私の RAM の数値を見て (a) (b) (c) のうち最適なものを 1 つだけ実行してください。
```

### P-WIN-1: Windows ネイティブで動かしたい (WSL2 を使いたくない)

```
Hermes ネイティブ Windows 版を試したいです。これは早期ベータで一部機能制限あり (Dashboard の embedded terminal が使えない等) ですが、CLI 動作と LINE 連携には支障ないはずです。

PowerShell を管理者で開いてインストール:

iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)

その後、Mac 版と同じ ~/.hermes/.env と ~/.hermes/config.yaml の編集を Windows パス対応で実行してください。Ollama も Windows ネイティブ版があるので併用可能。

ただし、もし途中で詰まったら WSL2 への切り替えを正直に提案してください (ベータ版固有のバグである可能性が高いため)。
```

---

## 完全リセット

### P-PRESET-1: すべてやり直したい (環境をゼロから作り直す)

```
セットアップを最初からやり直したいです。以下を順に削除・停止してください:

1. 全プロセス停止:
   - pkill -f "hermes gateway"
   - pkill -f cloudflared
   - (Ollama は残してOK)

2. Hermes アンインストール:
   - hermes uninstall (もしくは ~/.hermes/ を rm -rf。注意: .env のバックアップ推奨)

3. cloudflared バイナリ削除: rm ~/tools/bin/cloudflared (Ollama と Hermes は残す前提)

4. ローテーション推奨 (情報漏洩防止):
   - LINE Developers Console で Channel access token を Reissue
   - 同じく Channel secret を Update
   - これは私が手動でやります。あなたは案内だけ。

5. Ollama のモデルを一部削除して容量を空けたい場合:
   - ollama rm qwen2.5:0.5b
   - ollama rm qwen2.5:1.5b
   などを提案 (3b は残す前提)

実行前に、これから何を消すかを表で示し、私の承認を待ってください。
削除しないものは明示的に「残します」と書いてください。
```

---

## 困ったら直接 Claude Code に投げて良いプロンプト

定型のプロンプトに該当しない問題は、以下のフォーマットで Claude Code に投げる:

```
[症状を 1 行で]

期待していた挙動: [何が起きるはずだったか]
実際の挙動: [何が起きたか]
ログの該当箇所:
[gateway.log や tunnel.log の関連 5〜20 行]

これまでに試したこと:
- ...

このハンズオン教材の文脈で、次に何を試すべきか診断して実行してください。
```

Claude Code は ~/.hermes/logs/, ~/.cloudflared/logs/, ~/.ollama/logs/ を自由に読めるので、ログを貼らなくても "そっち見て" で済む場合も多い。
