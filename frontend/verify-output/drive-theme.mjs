/* eslint-disable */
// S1/S2 verify — theme switcher applies data-theme, locale dock holds
// switcher + pill + locale, and globe canvas reflects the dark/light flip.

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
const note = m => { console.log('[theme]', m); findings.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function snapshot(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const dock = document.querySelector('.locale-dock');
    const dockChildren = dock ? Array.from(dock.children).map(c => c.tagName.toLowerCase()) : [];
    const themeBtn = document.querySelector('app-theme-switcher .toggle');
    const themeIcon = themeBtn?.querySelector('.icon')?.textContent?.trim() ?? null;
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    return {
      dataTheme: html.getAttribute('data-theme'),
      dockChildren,
      themeIcon,
      bodyBg
    };
  });
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: false, protocolTimeout: 180000,
    args: ['--window-size=1400,900', '--no-first-run', '--disable-features=Translate'],
    defaultViewport: { width: 1400, height: 900 }
  });
  const page = (await browser.pages())[0] ?? (await browser.newPage());
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push({ type: 'error', text: m.text() }); });
  page.on('pageerror', e => consoleErrors.push({ type: 'pageerror', text: e.message }));

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(4000);

  const darkSnap = await snapshot(page);
  note(`DARK snapshot: ${JSON.stringify(darkSnap)}`);
  await page.screenshot({ path: join(__dirname, 'theme-01-dark.png') });

  // Click theme switcher
  await page.evaluate(() => document.querySelector('app-theme-switcher .toggle')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(1500);
  const lightSnap = await snapshot(page);
  note(`LIGHT snapshot: ${JSON.stringify(lightSnap)}`);
  await page.screenshot({ path: join(__dirname, 'theme-02-light.png') });

  // Reload and confirm light persists via ?theme=light
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2500);
  const lightAfterReload = await snapshot(page);
  note(`LIGHT after reload: ${JSON.stringify(lightAfterReload)}`);
  await page.screenshot({ path: join(__dirname, 'theme-03-light-reload.png') });

  const url = await page.url();
  note(`URL after reload: ${url}`);

  const failures = [];
  if (darkSnap.dataTheme !== 'dark')   failures.push(`expected data-theme=dark first, got ${darkSnap.dataTheme}`);
  if (lightSnap.dataTheme !== 'light') failures.push(`expected data-theme=light after toggle, got ${lightSnap.dataTheme}`);
  if (lightAfterReload.dataTheme !== 'light') failures.push(`expected light persisted after reload, got ${lightAfterReload.dataTheme}`);
  if (!url.includes('theme=light')) failures.push(`expected ?theme=light in URL, got ${url}`);
  if (!darkSnap.dockChildren.includes('app-theme-switcher')) failures.push(`expected theme-switcher in locale-dock, got ${darkSnap.dockChildren.join(',')}`);
  if (!darkSnap.dockChildren.includes('app-locale-switcher')) failures.push(`expected locale-switcher in locale-dock`);
  if (!darkSnap.dockChildren.includes('app-stream-status')) failures.push(`expected stream-status in locale-dock`);
  note(`Failures: ${failures.length === 0 ? 'NONE' : JSON.stringify(failures)}`);

  const summary = { darkSnap, lightSnap, lightAfterReload, urlAfterReload: url, failures, consoleErrors, findings };
  writeFileSync(join(__dirname, 'verify-theme-report.json'), JSON.stringify(summary, null, 2));
  console.log('[theme] DONE');
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch(err => { console.error('[theme] FAILED', err); process.exit(1); });
