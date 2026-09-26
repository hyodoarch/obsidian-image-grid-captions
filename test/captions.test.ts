import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCaption, parseCaptionBlocks, parseGrid } from "../src/shared/parser";

for (const [source, text, headingLevel] of [
  ["## 店舗入口", "店舗入口", 2],
  ["### 材料と仕上げ", "材料と仕上げ", 3],
  ["##\t見出し", "見出し", 2],
  ["## **bold** <img src=x onerror=alert(1)>", "**bold** <img src=x onerror=alert(1)>", 2],
  ["\\## 文字として表示", "## 文字として表示", null],
  ["\\### 文字として表示", "### 文字として表示", null],
  ["", "", null], ["##", "##", null], ["### ", "### ", null],
  ["# H1", "# H1", null], ["#### H4", "#### H4", null],
  ["##空白なし", "##空白なし", null], ["本文 ## 記号", "本文 ## 記号", null],
] as const) {
  test(`caption prefix ${JSON.stringify(source)}`, () => {
    assert.deepEqual(parseCaption(source), { text, headingLevel });
  });
}

test("heading syntax is retained in the caption but omitted from accessible alt", () => {
  const { images } = parseGrid("columns: 4\r\n![[a.jpg| ## 店舗入口 ]]\r\n![[b.jpg|### 材料]]\r\n![[c.jpg|\\## そのまま]]\r\n![[d.jpg]]");
  assert.deepEqual(images.map(image => image.alt), ["店舗入口", "材料", "## そのまま", "d.jpg"]);
  assert.equal(images[0].caption, "## 店舗入口");
});

test("multiline captions combine H2, H3 and paragraphs without changing grid parameters", () => {
  const source = "columns: 2\r\n![[a.jpg|\r\n## 外観\r\n南側から見た建物です。\r\n軒を深くしました。\r\n\r\n### 材料\r\ncolumns: 4\r\n\r\n杉板張りです。\r\n]]\r\n![[b.jpg]]";
  const grid = parseGrid(source);
  assert.equal(grid.columns, 2);
  assert.deepEqual(parseCaptionBlocks(grid.images[0].caption), [
    { text: "外観", headingLevel: 2 },
    { text: "南側から見た建物です。\n軒を深くしました。", headingLevel: null },
    { text: "材料", headingLevel: 3 },
    { text: "columns: 4", headingLevel: null },
    { text: "杉板張りです。", headingLevel: null },
  ]);
  assert.equal(grid.images[0].alt, "外観 南側から見た建物です。 軒を深くしました。 材料 columns: 4 杉板張りです。");
  assert.equal(grid.images[1].caption, "");
});

test("supports an inline heading followed by a paragraph and inline closing brackets", () => {
  const grid = parseGrid("columns: 2\n![[a.jpg|## 外観\n説明文です。]]\n![[b.jpg|通常の説明]]");
  assert.equal(parseCaptionBlocks(grid.images[0].caption).length, 2);
});

for (const source of [
  "columns: 2\n![[a.jpg|\n## 閉じ忘れ",
  "columns: 2\n![[a.jpg|\n本文\n![[b.jpg]]",
  "columns: 2\n![[a.jpg\n]]\n![[b.jpg]]",
  "columns: 2\n![[a.jpg|\n本文|追加\n]]\n![[b.jpg]]",
]) test(`reject malformed multiline caption ${JSON.stringify(source)}`, () => assert.throws(() => parseGrid(source)));
