/* eslint-disable */
// Drives http://localhost:4200 in real Chrome via puppeteer-core, captures
// console errors, takes screenshots at 3 zoom levels, attempts a polygon
// click and a search, and reports a JSON verdict.

import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(__dirname, { recursive: true });

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:4200/';

const findings = [];
const consoleErrors = [];
const networkFailures = [];
const lodFetches = [];

function note(msg) {
  console.log('[verify]', msg);
  findings.push(msg);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    protocolTimeout: 180000,
    args: ['--window-size=1400,900', '--no-first-run', '--disable-features=Translate'],
    defaultViewport: { width: 1400, height: 900 }
  });
  const page = (await browser.pages())[0] ?? (await browser.newPage());

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push({ type: 'pageerror', text: err.message });
  });
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('countries-') && url.endsWith('.geojson')) {
      lodFetches.push({ url, status: resp.status() });
    }
    if (!resp.ok() && (url.startsWith('http://localhost:') || url.includes('/api/'))) {
      networkFailures.push({ url, status: resp.status() });
    }
  });

  note(`Navigating to ${URL}`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Fresh storage so layer defaults apply deterministically
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2500);

  // Check that canvas exists
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { found: false };
    return {
      found: true,
      width: canvas.width,
      height: canvas.height,
      ctxOk: !!canvas.getContext
    };
  });
  note(`Canvas: ${JSON.stringify(canvasInfo)}`);

  // Default-zoom screenshot
  await sleep(2500); // let textures + 110m geojson load
  await page.screenshot({ path: join(__dirname, '01-default-zoom.png') });
  note('Screenshot 01-default-zoom.png');

  // Toggle camera + wildfire layers ON at default zoom (earthquakes default ON)
  const toggleResult = await page.evaluate((labels) => {
    const rows = Array.from(document.querySelectorAll('app-layer-panel .layer-row'));
    const found = {};
    for (const label of labels) {
      const row = rows.find(r => new RegExp(label).test(r.textContent || ''));
      if (!row) { found[label] = false; continue; }
      const btn = row.querySelector('button.row-toggle');
      btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      found[label] = true;
    }
    return found;
  }, ['Canlı Kameralar', 'Orman Yangınları', 'Tropikal Fırtınalar', 'Uçaklar', 'Jeopolitik Olaylar']);
  note(`Layer toggles (early): ${JSON.stringify(toggleResult)}`);
  await sleep(8000); // let EONET + USGS + OpenSky + GDELT + ISS complete
  await page.screenshot({ path: join(__dirname, '01b-cameras-at-default.png') });
  note('Screenshot 01b-cameras-at-default.png');

  const layerState = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('app-layer-panel .layer-row'));
    return rows.map(r => {
      const text = r.textContent?.trim() ?? '';
      const m = text.match(/(.+?)Opasite/);
      const label = m ? m[1].trim() : text.slice(0, 30);
      const count = r.querySelector('.meta.count')?.textContent?.trim() ?? null;
      const err = r.querySelector('.meta.error')?.textContent?.trim() ?? null;
      return { label, count, error: err };
    });
  });
  note(`All layer states: ${JSON.stringify(layerState)}`);

  // Zoom-in: send 8 wheel ticks centered on the canvas
  const center = { x: 700, y: 450 };
  for (let i = 0; i < 8; i++) {
    await page.mouse.move(center.x, center.y);
    await page.mouse.wheel({ deltaY: -300 });
    await sleep(250);
  }
  await sleep(2500);
  await page.screenshot({ path: join(__dirname, '02-mid-zoom.png') });
  note('Screenshot 02-mid-zoom.png');

  // Closer zoom
  for (let i = 0; i < 8; i++) {
    await page.mouse.move(center.x, center.y);
    await page.mouse.wheel({ deltaY: -300 });
    await sleep(250);
  }
  await sleep(3500);
  await page.screenshot({ path: join(__dirname, '03-close-zoom.png') });
  note('Screenshot 03-close-zoom.png');

  // Try clicking on the canvas center — at close zoom the visible polygon should
  // emit a country select.
  await page.mouse.click(center.x, center.y);
  await sleep(1200);
  const panelAfterClick = await page.evaluate(() => {
    const panel = document.querySelector('app-country-info-panel .panel, .panel');
    return panel ? {
      present: true,
      name: panel.querySelector('.country-name')?.textContent ?? null
    } : { present: false };
  });
  note(`Panel after click: ${JSON.stringify(panelAfterClick)}`);
  await page.screenshot({ path: join(__dirname, '04-click-result.png') });

  // Toggle camera layer ON via the layer panel
  const cameraInfo = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('app-layer-panel .layer-row'));
    const row = rows.find(r => /Canlı Kameralar/.test(r.textContent || ''));
    if (!row) return { rowFound: false, rowsSeen: rows.length };
    const btn = row.querySelector('button.row-toggle');
    btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return { rowFound: true, rowsSeen: rows.length };
  });
  note(`Camera layer toggle: ${JSON.stringify(cameraInfo)}`);
  await sleep(1500);
  await page.screenshot({ path: join(__dirname, '07-cameras-on.png') });
  note('Screenshot 07-cameras-on.png');

  // Inspect camera layer state from the DOM (count badge)
  const cameraState = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('app-layer-panel .layer-row'));
    const row = rows.find(r => /Canlı Kameralar/.test(r.textContent || ''));
    if (!row) return null;
    const countEl = row.querySelector('.meta.count');
    return { count: countEl?.textContent?.trim() ?? null, text: row.textContent?.trim() ?? null };
  });
  note(`Camera layer state: ${JSON.stringify(cameraState)}`);

  // Search test — type into the visible input
  const inputHandle = await page.$('input');
  if (inputHandle) {
    await inputHandle.click({ clickCount: 3 });
    await inputHandle.type('Türkiye', { delay: 80 });
    await sleep(1500);
    await page.screenshot({ path: join(__dirname, '05-search-typed.png') });
    note('Screenshot 05-search-typed.png');

    // Click first result option (li or div with role=option)
    const firstResult = await page.$('[role="option"], .result-item, ul li');
    if (firstResult) {
      await firstResult.click();
      await sleep(2500);
      await page.screenshot({ path: join(__dirname, '06-search-selected.png') });
      note('Screenshot 06-search-selected.png');
    } else {
      note('Search: no result element matched selectors');
    }
  } else {
    note('Search input not found');
  }

  const summary = {
    canvas: canvasInfo,
    consoleErrors,
    networkFailures,
    lodFetches,
    findings,
    panelAfterClick
  };
  writeFileSync(join(__dirname, 'verify-report.json'), JSON.stringify(summary, null, 2));
  console.log('[verify] DONE');
  console.log(JSON.stringify(summary, null, 2));

  await browser.close();
}

main().catch(err => {
  console.error('[verify] FAILED', err);
  process.exit(1);
});
