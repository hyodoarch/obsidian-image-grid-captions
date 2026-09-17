# Image Grid Captions 0.1.0

縦横比が異なるローカル画像を、**高さを揃えて・切り取らずに1行表示**する Obsidian プラグインです。同じ記法を `quartz-image-grid-captions` でも利用できます。

## インストール

1. [GitHub Releases](https://github.com/hyodoarch/obsidian-image-grid-captions/releases/latest) の Assets から、最新版の `image-grid-captions-x.x.x.zip` をダウンロードします（v0.1.0 は `image-grid-captions-0.1.0.zip`）。
2. ZIPを展開します。
3. 展開された `image-grid-captions` フォルダを Vault の `.obsidian/plugins/` に配置します。フォルダ内に `main.js`、`manifest.json`、`styles.css` があることを確認してください。
4. Obsidianを再読み込みします。
5. 「設定 → コミュニティプラグイン → Image Grid Captions」を有効にします。

GitHubの「Code → Download ZIP」や Releases の「Source code (zip)」「Source code (tar.gz)」はソースコードであり、そのままインストールできる配布ZIPではありません。

ソースから作成する場合（Node.js 22以降）:

```sh
npm ci
npm run check
```

生成された `main.js` と `manifest.json`、`styles.css` を同じプラグインフォルダへコピーします。設定画面はありません。

## 使い方

````markdown
```image-grid-captions
columns: 3
gap: 8

![[images/portrait.png|外観]]
![[images/landscape.png|長い説明は画像の幅に合わせて折り返します。]]
![[images/portrait.png]]
```
````

- 正式な識別子は **`image-grid-captions` のみ**です。元仕様に混在していた `image-grid` は既存プラグインと競合させないため登録しません。
- `columns` は必須。`2`・`3`・`4` のいずれかで、画像数との一致が必要です。
- `gap` は省略時 `8`。単位なしの非負整数で、pxとして扱います。
- 画像は1行に1枚。`![[ファイル名]]` と `![[フォルダ/ファイル名|説明]]` が使えます。
- キャプションはプレーンテキストです。Markdown・HTML・幅・位置指定は解釈せず、追加の `|` はエラーにします。折り返しによる複数行表示に対応します。
- キャプションなしの場合、altは拡張子を含むファイル名です。
- 対象は png、jpg/jpeg、webp、gif、bmp、avif、svg。ブラウザが読み込める画像が必要です。GIF/SVG専用処理はありません。外部URL、動画、アンカー、絶対パスは対象外です。
- 不明・重複パラメータ、画像数不一致、解決できない画像は該当ブロックだけをエラー表示します。

`examples/` をVaultにコピーし、`examples/demo.md` をReading Viewで開くと、正常系とエラー系を確認できます。

## レイアウトと対応範囲

画像の `naturalWidth / naturalHeight` から `H = (W - gap × (n - 1)) / Σr` を計算します。`ResizeObserver` がペイン幅の変化を検出します。画像全体を表示し、狭い画面でも列数を変えません。文字色とフォントはテーマを継承します。

コンテナ幅が隙間の合計以下になる場合、正の画像幅と固定gapを両立できないため一時的にエラーを表示し、十分な幅に戻ると復帰します。gapはJavaScriptの安全な整数範囲まで受け付けます。

Reading View向けの公式コードブロックAPIを使用しています。Source Modeは変更しません。Live PreviewはObsidian標準のコードブロック描画に任せ、専用のエディタ拡張は提供しません。Node.js/Electron API、通信処理、telemetryをプラグインに含めず、`isDesktopOnly: false` です。

通常の `![[画像|説明]]` は処理対象外です。既存Image Captionsと併用できます。リンク解決には `getFirstLinkpathDest(path, sourcePath)` を使用します。

## 構成と検証

`src/shared/parser.ts` が解析、`layout.ts` が数式、`renderer.ts` がDOMとライフサイクル、`src/main.ts` がObsidian API接続を担当します。Quartz版にも同じ共通ファイルを同梱し、単独でビルドできる構成です。両方の共通コードを変更する際は同期し、Quartz側の結合テストで一致を確認してください。

```sh
npm run check
npm run test:browser
```

ブラウザ検証はインストール済みMicrosoft Edgeを非表示で使います。別OSでは `test/browser.mjs` のPlaywright起動設定を変更してください。検証結果と未確認範囲は [TESTING.md](TESTING.md) を参照してください。

公式APIの根拠: [Obsidian Markdown post processing](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Plugins/Editor/Markdown%20post%20processing.md)。
