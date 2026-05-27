# screenshots/

LINE Developers Console / Official Account Manager の操作スクリーンショット置き場。

## 推奨ファイル名

`MANUAL.md` のステップに対応させると参照しやすい:

```
a1-linebiz-entry.png           # ステップ A-1: LINE 公式アカウント開設フォーム
a2-oam-settings-menu.png       # ステップ A-2: OAM 設定メニュー
a2-messaging-api-enable.png    # ステップ A-2: Messaging API を利用するボタン
a2-provider-select.png         # ステップ A-2: プロバイダー選択モーダル
a2-channel-secret-display.png  # ステップ A-2: Channel secret 表示画面
a3-console-channel-list.png    # ステップ A-3: Developers Console チャネル一覧
a3-your-user-id.png            # ステップ A-3: Your user ID の位置
a3-issue-access-token.png      # ステップ A-3: Channel access token Issue ボタン
a4-response-settings-off.png   # ステップ A-4: 応答設定 OFF
b-use-webhook-toggle.png       # ステップ B: Use webhook トグル
c-qr-code.png                  # ステップ C: 友だち追加用 QR
d-line-chat-result.png         # ステップ D: 翻訳成功のスクショ
```

## 注意

- **個人情報（user ID、token、basic ID 等）はマスクしてから配置してください**
- LINE UI は時期によって変わるため、撮影日とバージョンを README に併記すると親切
- 画像形式は PNG または WebP 推奨（GitHub での表示が安定）

## 教材改善

スクリーンショットを追加・更新したら `MANUAL.md` の該当ステップから参照してください:

```markdown
1. 右上の「⚙ 設定」をクリック
   ![OAM settings menu](assets/screenshots/a2-oam-settings-menu.png)
```

---

このディレクトリが空でも教材は機能します（テキストのみで完結）。スクリーンショットは「あれば理解しやすい」程度の補助です。
