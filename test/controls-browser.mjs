
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const bundle = await build({entryPoints:['test/browser-entry.ts'],bundle:true,write:false,format:'iife',globalName:'GridTest'});
const browser = await chromium.launch({channel:'msedge',headless:true});
try {
 const page = await browser.newPage({viewport:{width:1100,height:800}});
 await page.setContent('<style>'+await readFile('styles.css','utf8')+'</style><div class="markdown-source-view"><div class="cm-embed-block"><div class="embed-actions">native edit</div><main id="host" style="width:642px"></main></div></div>');
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.evaluate(()=>{
   const c=document.createElement('canvas'); c.width=600; c.height=400;
   const row=GridTest.renderGrid(document.querySelector('#host'),GridTest.parseGrid('columns: 2\n![[a.png]]\n![[b.png]]'),[c.toDataURL(),c.toDataURL()]);
   window.disposeLayout=GridTest.mountGrid(row);
   window.disposeControls=GridTest.attachControls(row,(el,name)=>el.textContent=name,i=>window.edited=i);
 });
 await page.waitForSelector('.image-grid-captions[data-ready]');
 assert.equal(await page.locator('.igc-image-actions button').count(),4);
 assert.equal(await page.locator('.cm-embed-block > .embed-actions').isVisible(),false);
 for (const width of [642,320]) {
  await page.locator('#host').evaluate((el,w)=>el.style.width=w+'px',width);
  await page.waitForFunction(w=>Math.abs(document.querySelector('.image-grid-captions__image').getBoundingClientRect().width-(w-8)/2)<1,width);
  // Use fixed icon-sized buttons, matching Obsidian's clickable-icon dimensions.
  await page.addStyleTag({content:'.clickable-icon {width:26px;height:26px;padding:2px;font-size:4px}'});
  for(let i=0;i<2;i++){
   const item=page.locator('.image-grid-captions__item').nth(i);
   await item.hover();
   const bounds=await item.evaluate(el=>{const a=el.querySelector('img').getBoundingClientRect(),b=el.querySelector('.igc-image-actions').getBoundingClientRect();return b.left>=a.left&&b.right<=a.right&&b.top>=a.top;});
   assert.equal(bounds,true);
   await item.locator('button').nth(1).click();assert.equal(await page.evaluate(()=>window.edited),i);
  }
 }
 const zoom=page.locator('.igc-image-actions button').nth(2);
 await page.locator('.image-grid-captions__item').nth(1).hover();await zoom.click();
 assert.equal(await page.locator('.igc-lightbox img').getAttribute('alt'),'b.png');
 await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('.igc-lightbox img').getAttribute('alt'),'a.png');
 await page.mouse.move(500,400);await page.mouse.wheel(0,-100);
 await page.waitForSelector('.igc-lightbox.is-zoomed');
 await page.mouse.move(500,400);await page.mouse.down();await page.mouse.move(540,420);await page.mouse.up();
 assert.match(await page.locator('.igc-lightbox img').getAttribute('style'),/translate\(40px, 20px\)/);
 await page.keyboard.press('Escape');assert.equal(await page.locator('.igc-lightbox').count(),0);
 await page.locator('.image-grid-captions__item').nth(0).hover();await page.locator('.igc-image-actions button').first().click();
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.closest('.igc-lightbox')!==null),true);
 await page.locator('.igc-lightbox__close').click();
 await page.locator('.image-grid-captions__item').nth(0).hover();await page.locator('.igc-image-actions button').first().click();
 await page.evaluate(()=>{window.disposeControls();window.disposeLayout()});
 assert.equal(await page.locator('.igc-lightbox,.igc-image-actions').count(),0);
 assert.equal(await page.locator('.cm-embed-block > .embed-actions').isVisible(),true);
 console.log('PASS controls: per-image actions, two widths, edit routing, zoom, pan, navigation, close, focus, cleanup');
} finally {await browser.close();}
