# LINE プラットフォーム手動操作手順

このファイルは **人間が自分でブラウザを開いてクリックする** 部分の手順書です。
Claude Code には代行できません — LINE プラットフォームの仕様で、Provider/Channel の作成 API も Auto-reply の設定 API も公開されていないため。

「面倒な部分はここに集約してある」と思って、全 4 ステップを通すと終わります。

---

## ステップ A: 認証情報を 3 つ取る

所要 5〜10 分。LINE 公式アカウント (OA) を作って、3 つの値をコピーする。

### A-1. LINE 公式アカウントを開設

1. **https://www.linebiz.com/jp/entry/** を開く
2. 「アカウントの開設」 → 普段使っている LINE アカウントでログイン
3. アカウント情報を入力:
   - **名称**: `Translator` でも何でも (※「LINE」「公式」「bot」など使えないNG単語あり)
   - **業種**: 「個人 → 個人(その他)」で OK
   - **会社・事業者の所在地**: 個人なら自宅住所で OK
4. 「確認 → 完了」と進むと **LINE Official Account Manager (OAM)** にリダイレクトされる
5. URL は `https://manager.line.biz/account/@xxxxxx/` の形式になる (`@xxxxxx` が basic ID)

### A-2. Messaging API を有効化（ここで Channel Secret 取得）

OAM 画面で:

1. **右上の「⚙ 設定」** をクリック
2. 左メニュー → **Messaging API** をクリック
3. **「Messaging APIを利用する」** ボタンを押す
4. **プロバイダー選択**:
   - 既存のプロバイダーがあれば選択
   - 無ければ「新規作成」 → 任意の名前 (例: `your-name`、後で変更可)
5. **プライバシーポリシー & 利用規約のモーダル**: 両方とも空欄のまま **「OK」** をクリック (任意項目)
6. Messaging API が有効化される。同じ画面に以下が表示される:
   - **Channel ID** (整数。今回は使わないが控えてもよい)
   - **Channel secret** (32 桁の 16 進数文字列) → **「コピー」ボタン** でコピー

→ **これが `LINE_CHANNEL_SECRET`**。メモ帳などに一時保存。

### A-3. Channel access token と Your user ID を取る

OAM だけでは取れない。Developers Console に移動。

1. **https://developers.line.biz/console/** を開く (同じ LINE アカウントでログイン)
2. 自分のプロバイダー (A-2 で選択 or 作成したもの) をクリック
3. 一覧に **作成したチャネル名 (例: Translator)** が出ているのでクリック
4. **「チャネル基本設定」タブ** (デフォルトで開いてる) → ページを下にスクロール
5. **「あなたのユーザーID」** 欄にある **U で始まる 32 文字** をコピー

→ **これが `LINE_ALLOWED_USERS`**。

6. 同じチャネルページの **「Messaging API」タブ** をクリック
7. ページの一番下にある **「Channel access token」** 欄の **「Issue」(または「発行」) ボタン** をクリック
8. 発行された **長い base64 文字列** をコピー

→ **これが `LINE_CHANNEL_ACCESS_TOKEN`**。

### A-4. OAM 側で自動応答を OFF（API では切れない部分）

OAM の標準自動応答が ON のままだと、Hermes が返す前に「ありがとうございます！」みたいなテンプレが先に届いてしまう。**この設定だけは API が存在しない**ので、OAM で手動操作。

1. OAM (`https://manager.line.biz/account/@xxxxxx/`) に戻る
2. 左メニュー → **応答設定** をクリック (場所が変わってる場合は「設定 → 応答設定」の経路もある)
3. **「応答メッセージ」** → **「オフ」** に切り替え
4. **「あいさつメッセージ」** → **「オフ」** に切り替え

これでステップ A 完了。

### ⚠️ ステップ A の出力まとめ

以下 3 つを **自分のテキストエディタ (メモ帳・nano・VSCode 等) のメモ欄に一時保存**:

```
LINE_CHANNEL_SECRET=...32桁hex...
LINE_CHANNEL_ACCESS_TOKEN=...長いbase64...
LINE_ALLOWED_USERS=U...32文字...
```

> ℹ️ なお、`.env` には上記 3 つに加えて **`LINE_PORT=8646`** という固定値を書く必要があります (Hermes gateway が listen するポート番号)。これはシークレットではないので、Step 2 / P4 で 4 行まとめて書き込む形になります。受講者が事前に取得する必要があるのは上記 3 つだけ。

**🛡 シークレット衛生の注意**:
これらの値は **Claude Code (AI チャット) に貼り付けない方針** で進めます。理由は P4 で Claude が説明してくれます。
代わりに、Claude Code の指示に従って **自分の手で `~/.hermes/.env` に書き込む** 形になります。AI チャットに値が残らないので、会話ログ・スクショからの漏洩を防げます。

3 つ揃ったら Claude Code に **「3 つ取れた」とだけ伝えてください** (値は貼らない)。Claude Code が `.env` の編集を伴走してくれます。

---

## ステップ B: Webhook URL の Use webhook トグルを ON

Claude Code が API 経由で Webhook URL を登録してくれるが、**Console 側のトグルが OFF だと配信されない**。これだけは UI 操作が必要。

1. **https://developers.line.biz/console/** → プロバイダー → チャネル → **Messaging API タブ**
2. ページ中ほどの **Webhook settings** 欄を確認:
   - **Webhook URL** に Claude Code が登録した `https://xxxx.trycloudflare.com/line/webhook` が入っているはず
   - **「Verify」ボタン**を押す → "Success" が出れば疎通 OK
3. **「Use webhook」トグルを ON** に切り替え (これが本当に大事)

---

## ステップ C: bot を LINE 友だち追加

1. Developers Console → 同じチャネル → **Messaging API タブ**
2. ページ上の **「QR コード」** をスマホの LINE アプリの **友だち追加 → QR コード** で読み取り
3. 「追加」をタップ → トーク画面が開く

または、basic ID (`@xxxxxx` の形式) を LINE アプリの「友だち追加 → ID 検索」で入力 (LINE 側で ID 検索を許可してある必要あり)。

---

## ステップ D: テストメッセージを送る

スマホの LINE アプリから、開いた Translator bot のトーク画面に、以下を順に送ってみる:

| 入力 | 期待される返信 |
|---|---|
| `こんにちは、今日は良い天気ですね。` | "Hello..." で始まる自然な英訳 |
| `Lightweight local language models are enabling a new wave of privacy-preserving AI assistants that run entirely on personal hardware.` | 長文の自然な日本語訳 |
| `明日午後3時、品川駅で会いましょう。` | "Shinagawa Station" を含む英訳 |
| `What is the capital of France?` | 「フランスの首都は何ですか？」(答えではなく翻訳) |

数秒〜数十秒で返信が来る。最初のメッセージでは Hermes が "No home channel is set for Line." という案内メッセージを 1 度だけ表示する場合があるが無視で OK。

返信が来たら Claude Code に「届いた」と報告。

---

## トラブル系: 「もう一度同じものを取り直したい」

### Channel secret を再発行

Developers Console → チャネル → 基本設定 → **「Update」ボタン** で新しい値に。

### Channel access token を再発行

Developers Console → チャネル → Messaging API タブ → **「Reissue」ボタン**。
古い token は即座に無効化されるので注意。

### Your user ID は変わらない

LINE アカウントごとに固定。チャネル変えても同じ。

---

## 補足: OAM と Developers Console の関係

LINE が分かりにくい最大の原因。**設定項目によって作業場所が違う**。

| やりたいこと | 場所 |
|---|---|
| OA の作成・名前変更 | OAM |
| Messaging API の有効化 | OAM |
| プロバイダー選択 | OAM (有効化時) |
| **Channel secret** の取得 | OAM (有効化直後画面) または Developers Console |
| **Channel access token** の発行 | **Developers Console のみ** |
| **Your user ID** の確認 | **Developers Console のみ** |
| Webhook URL の登録 | API or Developers Console |
| **Use webhook** の ON/OFF | **Developers Console のみ** |
| **応答メッセージ / あいさつメッセージ** OFF | **OAM のみ** (API なし) |
| QR コード表示 | Developers Console (または OAM の「ホーム」) |
| 友だち追加 | スマホの LINE アプリ |

---

## 教材的補足

LINE がこういう設計になっている理由 (推測):

- **OA 作成と Messaging API は別レイヤ**: 一般ユーザの LINE 公式アカウントと、開発者向け Bot 開発が分離されている。OA 作成は誰でも、Messaging API 有効化は「やや踏み込んだ操作」
- **API 経由のチャネル作成は意図的に塞がれている**: 自動化された大量 bot 作成 (spam) を防ぐ目的と推測
- **応答設定 (Auto-reply / Greeting) が OAM 側にしかない**: これは「Messaging API を使わずに簡易自動応答だけ運用する非開発者ユーザ」のためのもの。開発者は OFF にして webhook で全制御するのが正攻法

この「**設定は手動・運用は全自動**」の構造を、授業で API 設計の観点から触れると教材として面白い。
