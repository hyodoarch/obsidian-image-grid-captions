import { MarkdownRenderChild, Plugin, TFile } from "obsidian";
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
        class GridChild extends MarkdownRenderChild {
          onload() { this.register(mountGrid(row)); }
        }
        context.addChild(new GridChild(element));
      } catch (error) {
        showError(element, error);
      }
    });
  }
}
