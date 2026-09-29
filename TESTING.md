# 0.3.0 verification (2026-09-29)

Typecheck/build, 61 unit tests, 64 browser layout cases and controls browser tests passed. Controls tests cover two widths, per-image edit callbacks, zoom/pan, navigation, focus containment, close and cleanup. Native Obsidian editor reveal and desktop/mobile interaction remain unverified in the real app.

# 検証記録

## 2026-09-26：0.2.0公開前検証

- Windows / Node.js 24.18.0 / Microsoft Edge headless。
- `npm run check`：型検査・ビルド・61テスト成功。
- `npm run test:browser`：64レイアウトケース、H2/H3と段落、折り返し、HTMLの文字表示、見出しエスケープ、キャプションなしの検証成功。
- 配布ZIPは `python tools/build_zip.py` で生成し、ビルド済みmain.js・manifest.json・styles.cssを含める。
- Obsidian実アプリ・モバイル実機・Quartz版の今回の再検証は未実施。

以下のローカル開発版の記録は過去の作業履歴です。

## 2026-09-24：0.2.0ローカル開発版

- `npm run check`：型検査・ビルド・61テスト成功。
- `npm run test:browser`：既存64レイアウトケースと、H2/H3＋P、段落分割、キャプションなし、HTMLの文字表示、見出しエスケープ、800px/320pxの折り返しを確認。
- Digital Garden側：17ファイル433テスト成功。実際のMarkdown→link/taggify→画像最適化の変換を含む。
- Digital Garden生成ページ：1366px/390pxの画面幅で2/3/4列、同じ画像高さ、縦横比維持、キャプションの横溢れなし、拡大表示とEscでの終了を確認。
- Vaultの `.obsidian/plugins/image-grid-captions` にビルド済みファイルをコピーし、元ファイルとのハッシュ一致を確認。旧0.1.0は `release/backup-0.1.0-20260924/` に退避。
- 配布用ローカルZIP：`release/image-grid-captions-0.2.0-local.zip`。GitHubへは未公開。

今回もObsidian実アプリ・iOS/Android実機は未検証です。Obsidianでプラグインを再読み込みし、Vaultの `_メモ置場/Image Grid Captions 見出しと段落の確認.md` を閲覧モードで確認できます。

以下は旧版の記録です。

実施日: 2026-09-05 / Windows / Node.js 24.16.0 / Microsoft Edge headless。

- parser/layout: 40テスト。columns 2/3/4、gap 0/4/8/20、既定値、未知・重複パラメータ、不正値、画像数不一致、外部URL・拡張指定の拒否。
- Obsidian接続: ビルド済みmain.jsをAPIモックで読み込み、専用言語登録、sourcePath付きリンク解決、画像未検出時のブロックエラーを確認。
- ブラウザ: 4種類の縦横比構成 × 4種類のgap × 4種類の幅（160/320/800/1000）=64ケース。描画後の幅・高さ・隙間・上端位置を測定。
- キャプションの折り返し、Light/Dark描画、デコード不能画像、極小幅でのエラーと幅回復時の復帰を確認。
- Quartzの実プラグイン4種を組み合わせた変換結果と、Obsidian用rendererの画像寸法・altが4つの幅で一致。共通ソースとCSSの一致も確認。

`npm run check` で型検査・ビルド・単体テスト、`npm run test:browser` で描画検証を再実行できます。スクリーンショットは実行時に `test-results/` に出力します。

## 未確認範囲

Obsidian実アプリのReading View・Live Preview、iOS/Android実機、各サードパーティテーマ上の最終確認は未実施です。公式API接続はモック、描画は実ブラウザで検証しています。`examples/demo.md` を使って実Vaultで確認できます。

Quartzの比較は実プラグインによるunifiedパイプラインとブラウザ上の描画検証です。既存サイトへのインストール・サイト全体のビルド・公開は行っていません。
