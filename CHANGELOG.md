# 0.3.0 (2026-09-29)

- Live Preview: per-image zoom/edit actions with native-style translucent background.
- Independent lightbox with keyboard navigation, zoom, pan, focus handling and teardown.
- Preserve shared rendering and Reading View behavior.

# Changelog

## 0.2.0 — 2026-09-26

- キャプション冒頭の `## ` / `### ` をH2/H3として表示。
- 複数行キャプションでH2/H3とPを併記し、空行で段落を分ける記法に対応。
- 見出し記号を除いた画像alt、エスケープによる記号の文字表示に対応。
- 通常キャプション・キャプションなし・HTMLの文字表示・列数維持を継続。
- Digital Gardenにも同じ解析と描画を反映。Quartz版は今回の変更対象外。

## 0.1.0 — 2026-09-05

- 専用コードブロック、columns/gapの厳密な解析とエラー表示。
- 異なる縦横比の画像を高さ一定・トリミングなしで1行表示。
- 各画像のプレーンテキストキャプションとalt。
- Obsidian公式リンク解決、Reading View、リサイズ時の再計算とクリーンアップ。
- Quartz版との共通ロジック、テスト、サンプル、MITライセンス。
