import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

test("Obsidian processor is scoped and resolves links with the source note", () => {
  let handler: (source: string, element: unknown, context: unknown) => void;
  const calls: string[][] = [];
  class Plugin {
    app = { metadataCache: { getFirstLinkpathDest: (path: string, source: string) => { calls.push([path, source]); return null; } } };
    registerMarkdownCodeBlockProcessor(language: string, callback: typeof handler) {
      assert.equal(language, "image-grid-captions"); handler = callback;
    }
  }
  const module = { exports: {} as { default: new () => { onload(): void } } };
  runInNewContext(readFileSync("main.js", "utf8"), { module, exports: module.exports, require: () => ({ Plugin, TFile: class {}, MarkdownRenderChild: class {} }) });
  new module.exports.default().onload();
  const element = { className: "", textContent: "", setAttribute() {} };
  handler!("columns: 2\n![[missing.jpg]]\n![[b.jpg]]", element, { sourcePath: "notes/page.md" });
  assert.deepEqual(calls, [["missing.jpg", "notes/page.md"]]);
  assert.equal(element.className, "image-grid-captions__error");
  assert.match(element.textContent, /Image not found: missing.jpg/);
});
