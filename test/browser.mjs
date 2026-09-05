import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const bundle = await build({ entryPoints: ["test/browser-entry.ts"], bundle: true, write: false, format: "iife", globalName: "GridTest" });
const css = await readFile("styles.css", "utf8");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
const errors = [];
page.on("pageerror", error => errors.push(String(error)));
await mkdir("test-results", { recursive: true });
let checked = 0;
try {
  await page.setContent(`<style>${css}</style><main id="host" style="width:800px"></main>`);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  for (const ratios of [[1.5, 1.5], [0.5, 1.5], [0.5, 1.5, 0.5], [0.5, 1, 1.5, 2]]) {
    for (const gap of [0, 4, 8, 20]) {
      await page.evaluate(({ ratios, gap }) => {
        window.cleanup?.();
        const sources = ratios.map((r, i) => {
          const canvas = document.createElement("canvas");
          canvas.width = r * 400; canvas.height = 400;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = ["#376b86", "#ad603e", "#477557", "#795a8c"][i];
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "white"; ctx.lineWidth = 12;
          ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
          ctx.fillStyle = "white"; ctx.font = "28px sans-serif";
          ctx.fillText(`${r}:1`, 24, 50);
          return canvas.toDataURL();
        });
        const source = `columns: ${ratios.length}\ngap: ${gap}\n` + ratios.map((_, i) => `![[image${i}.png|${i === 1 ? "長いキャプション。".repeat(14) : "外観"}]]`).join("\n");
        const row = GridTest.renderGrid(document.getElementById("host"), GridTest.parseGrid(source), sources);
        window.cleanup = GridTest.mountGrid(row);
      }, { ratios, gap });
      for (const width of [800, 320, 160, 1000]) {
        await page.locator("#host").evaluate((el, w) => { el.style.width = `${w}px`; }, width);
        await page.waitForFunction(({ width, gap }) => {
          const row = document.querySelector(".image-grid-captions");
          if (!row?.dataset.ready) return false;
          const images = [...row.querySelectorAll("img")];
          return Math.abs(images.reduce((a, img) => a + img.getBoundingClientRect().width, 0) + gap * (images.length - 1) - width) < 0.2;
        }, { width, gap });
        const boxes = await page.locator(".image-grid-captions__image").evaluateAll(imgs => imgs.map(img => {
          const b = img.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, fit: getComputedStyle(img).objectFit };
        }));
        boxes.forEach((b, i) => {
          assert.ok(Math.abs(b.h - boxes[0].h) < 0.1);
          assert.ok(Math.abs(b.w - b.h * ratios[i]) < 0.1);
          assert.equal(b.fit, "contain");
          assert.equal(b.y, boxes[0].y);
          if (i) assert.ok(Math.abs(b.x - boxes[i - 1].x - boxes[i - 1].w - gap) < 0.1);
        });
        checked++;
      }
    }
  }
  await page.locator("#host").evaluate(el => { el.style.width = "800px"; });
  await page.screenshot({ path: "test-results/light.png", fullPage: true });
  await page.addStyleTag({ content: "body { background: #191919; color: #e6e6e6; font-family: sans-serif; }" });
  await page.screenshot({ path: "test-results/dark.png", fullPage: true });
  await page.locator("#host").evaluate(el => { el.style.width = "10px"; });
  await page.waitForFunction(() => document.querySelector(".image-grid-captions__error")?.textContent.includes("too narrow"));
  await page.locator("#host").evaluate(el => { el.style.width = "800px"; });
  await page.waitForFunction(() => document.querySelector(".image-grid-captions__error").hidden);
  await page.evaluate(() => {
    window.cleanup();
    const source = "columns: 2\n![[missing.png]]\n![[missing2.png]]";
    window.cleanup = GridTest.mountGrid(GridTest.renderGrid(document.getElementById("host"), GridTest.parseGrid(source), ["data:image/png;base64,broken", "data:image/png;base64,broken"]));
  });
  await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent.includes("unreadable"));
  assert.equal(await page.locator("img").count(), 0);
  assert.deepEqual(errors, []);
  const report = { passed: true, layoutCases: checked, checks: ["equal height", "aspect ratio", "gap", "one row", "resize", "caption wrapping", "light/dark screenshots", "narrow width recovery", "broken image isolation"] };
  await writeFile("test-results/browser-report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
