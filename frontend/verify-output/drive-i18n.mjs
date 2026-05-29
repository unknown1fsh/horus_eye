/* eslint-disable */
// Focused verify harness for the N1.14 i18n scaffold.
// 1) Loads in default TR locale, asserts "Katmanlar" + "Etik ve Yasal Bildirim"
// 2) Accepts disclaimer, clicks EN button, asserts the same UI flips to English
// 3) Reloads with ?lang=en, asserts persistence
// 4) Captures screenshots + console errors and writes verify-i18n-report.json

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

function note(msg) { console.log('[i18n]', msg); findings.push(msg); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function snapshotI18n(page) {
  return page.evaluate(() => {
    const layerPanelTitle = document.querySelector('app-layer-panel .title')?.textContent?.trim() ?? null;
    const layerRows = Array.from(document.querySelectorAll('app-layer-panel .layer-row .label'))
      .map(el => el.textContent?.trim());
    const opacityLabel = document.querySelector('app-layer-panel .opacity-label')?.textContent?.trim() ?? null;
    const resetBtn = document.querySelector('app-layer-panel .reset-btn')?.textContent?.trim() ?? null;
    const searchPlaceholder = document.querySelector('app-search-bar input')?.getAttribute('placeholder') ?? null;
    const disclaimerTitle = document.querySelector('app-disclaimer-modal h2')?.textContent?.trim() ?? null;
    const disclaimerBadge = document.querySelector('app-disclaimer-modal .badge')?.textContent?.trim() ?? null;
    const acceptBtn = document.querySelector('app-disclaimer-modal .accept')?.textContent?.trim() ?? null;
    const switcherButtons = Array.from(document.querySelectorAll('app-locale-switcher .locale-btn'))
      .map(b => ({ label: b.textContent?.trim(), active: b.classList.contains('active') }));
    return { layerPanelTitle, layerRows, opacityLabel, resetBtn, searchPlaceholder, disclaimerTitle, disclaimerBadge, acceptBtn, switcherButtons };
  });
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

  page.on('console', m => {
    if (m.type() === 'error') consoleErrors.push({ type: 'error', text: m.text() });
  });
  page.on('pageerror', e => consoleErrors.push({ type: 'pageerror', text: e.message }));

  note(`Loading ${URL} (fresh storage)…`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2500);

  const trSnap = await snapshotI18n(page);
  note(`TR snapshot: ${JSON.stringify(trSnap)}`);
  await page.screenshot({ path: join(__dirname, 'i18n-01-tr-default.png') });

  // Accept disclaimer (so the panel isn't covering layer-panel) only after we captured TR strings
  await page.evaluate(() => document.querySelector('app-disclaimer-modal .accept')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(800);

  // Click EN button
  const clickedEn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('app-locale-switcher .locale-btn'));
    const en = btns.find(b => b.textContent?.trim() === 'EN');
    if (!en) return false;
    en.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  });
  note(`Clicked EN button: ${clickedEn}`);
  await sleep(500);

  const enSnap = await snapshotI18n(page);
  note(`EN snapshot: ${JSON.stringify(enSnap)}`);
  await page.screenshot({ path: join(__dirname, 'i18n-02-en-after-toggle.png') });

  // Reload to verify ?lang= URL param + localStorage persistence
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2000);
  const url = await page.url();
  note(`URL after reload: ${url}`);

  const enReloadSnap = await snapshotI18n(page);
  note(`EN-after-reload snapshot: ${JSON.stringify(enReloadSnap)}`);
  await page.screenshot({ path: join(__dirname, 'i18n-03-en-after-reload.png') });

  // Assert critical TR labels in TR snapshot
  const expectations = {
    tr: {
      layerPanelTitle: 'Katmanlar',
      opacityLabel: 'Opasite',
      resetBtn: 'Varsayılana dön',
      disclaimerBadge: 'Etik ve Yasal Bildirim',
      acceptBtn: 'Kabul ediyorum, devam et'
    },
    en: {
      layerPanelTitle: 'Layers',
      opacityLabel: 'Opacity',
      resetBtn: 'Reset to defaults'
    }
  };
  const failures = [];
  for (const [k, v] of Object.entries(expectations.tr)) {
    if (trSnap[k] !== v) failures.push(`TR.${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(trSnap[k])}`);
  }
  for (const [k, v] of Object.entries(expectations.en)) {
    if (enSnap[k] !== v) failures.push(`EN.${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(enSnap[k])}`);
    if (enReloadSnap[k] !== v) failures.push(`EN-reload.${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(enReloadSnap[k])}`);
  }
  note(`Failures: ${failures.length === 0 ? 'NONE' : JSON.stringify(failures)}`);

  const summary = { trSnap, enSnap, enReloadSnap, urlAfterReload: url, failures, consoleErrors, findings };
  writeFileSync(join(__dirname, 'verify-i18n-report.json'), JSON.stringify(summary, null, 2));
  console.log('[i18n] DONE');
  console.log(JSON.stringify(summary, null, 2));

  await browser.close();
  process.exit(failures.length === 0 && consoleErrors.length === 0 ? 0 : 1);
}

main().catch(err => { console.error('[i18n] FAILED', err); process.exit(1); });
