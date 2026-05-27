# assets/

教材本編から参照される補助ファイル。

| ファイル | 用途 |
|---|---|
| `SOUL-translator.md` | 翻訳エージェントの人格ファイル（`~/.hermes/SOUL.md` に配置するもの）。`PROMPTS.md` の P2 内にも同じ内容が埋め込まれているが、Claude Code を使わずに手で配置したい人向けの抽出版 |
| `env.template` | `~/.hermes/.env` に追記するブロックのテンプレート。プレースホルダ付き |
| `hermes-config-snippet.yaml` | `~/.hermes/config.yaml` の変更が必要な箇所だけを抽出した参考用スニペット |
| `screenshots/` | LINE Developers Console / OA Manager の操作スクリーンショットの置き場。教材を改善するときに講師・寄稿者が画像を追加 |

これらは「Claude Code が失敗したときの手動フォールバック」「教材改良のための参照」として用意してあります。通常のハンズオン進行では `PROMPTS.md` をなぞるだけで全て自動配置されるので触らなくて OK。
