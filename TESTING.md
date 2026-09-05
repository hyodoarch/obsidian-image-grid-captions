# 検証記録

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
