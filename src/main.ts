import { MarkdownRenderChild, MarkdownView, Notice, Plugin, TFile, setIcon } from "obsidian";
import { attachControls } from "./controls";
import { LANGUAGE, parseGrid } from "./shared/parser";
import { mountGrid, renderGrid, showError } from "./shared/renderer";

export default class ImageGridCaptions extends Plugin {
  onload() {
    this.registerMarkdownCodeBlockProcessor(LANGUAGE, (source, element, context) => {
      try {
        const grid = parseGrid(source);
        const sources = grid.images.map(image => {
          const file = this.app.metadataCache.getFirstLinkpathDest(image.path, context.sourcePath);
          if (!(file instanceof TFile)) throw new Error(`Image not found: ${image.path}`);
          return this.app.vault.getResourcePath(file);
        });
        const row = renderGrid(element, grid, sources);
        const app = this.app;
        class GridChild extends MarkdownRenderChild {
          onload() {
            this.register(mountGrid(row));
            const install = () => {
              // Processors may finish before their host is attached to the editor.
              if (!row.isConnected) return false;
              if (!row.closest(".markdown-source-view")) return true;
              this.register(attachControls(row, setIcon, index => {
                const block = row.closest(".cm-embed-block");
                const native = block?.querySelector<HTMLElement>(".edit-block-button");
                const view = app.workspace.getLeavesOfType("markdown")
                  .map(leaf => leaf.view).find(view => view instanceof MarkdownView && view.containerEl.contains(row));
                if (!native || !(view instanceof MarkdownView)) { new Notice("編集ボタンを取得できません。ノートを開き直してください。"); return; }
                // Let Obsidian reveal the correct block, including duplicate blocks.
                native.click();
                const editor = view.editor;
                const selected = editor.getSelection();
                const lines = selected.split("\n");
                const starts = lines.map((line, lineIndex) => ({ line, lineIndex })).filter(item => /^\s*!\[\[/.test(item.line));
                const target = starts[index];
                if (!target || !selected.includes(source.trim())) return;
                const anchor = editor.getCursor("from");
                const ch = target.line.indexOf("![[") + 3;
                const from = { line: anchor.line + target.lineIndex, ch: ch + (target.lineIndex === 0 ? anchor.ch : 0) };
                editor.setSelection(from, { line: from.line, ch: from.ch + grid.images[index].path.length });
                editor.focus();
              }));
              return true;
            };
            if (!install()) {
              const observer = new MutationObserver(() => { if (install()) observer.disconnect(); });
              observer.observe(row.ownerDocument.body, { childList: true, subtree: true });
              this.register(() => observer.disconnect());
            }
          }
        }
        context.addChild(new GridChild(element));
      } catch (error) {
        showError(element, error);
      }
    });
  }
}
