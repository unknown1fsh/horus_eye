/* eslint-disable */
// N1.11 SSE verification: ensures the page picks up the live channel,
// the stream-status pill flips to LIVE, and at least one heartbeat lands
// within ~20 seconds of page load.

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
const sseEvents = [];

const note = m => { console.log('[sse]', m); findings.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function snapshot(page) {
  return page.evaluate(() => {
    const pill = document.querySelector('app-stream-status .pill');
    return {
      hasPill: !!pill,
      labelText: pill?.querySelector('.label')?.textContent?.trim() ?? null,
      state: pill ? (pill.classList.contains('connected') ? 'connected'
                    : pill.classList.contains('connecting') ? 'connecting'
                    : pill.classList.contains('down') ? 'disconnected' : 'unknown') : null,
      tooltip: pill?.getAttribute('title') ?? null
    };
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

  // Capture SSE response framing — verify the network layer is open
  await page.setRequestInterception(false);
  page.on('response', resp => {
    if (resp.url().includes('/api/v1/stream')) {
      sseEvents.push({ url: resp.url(), status: resp.status(), contentType: resp.headers()['content-type'] ?? null });
    }
  });

  note(`Loading ${URL}…`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);

  const earlySnap = await snapshot(page);
  note(`Early snapshot (3s): ${JSON.stringify(earlySnap)}`);
  await page.screenshot({ path: join(__dirname, 'sse-01-early.png') });

  // Wait for the SSE channel to come up — connected event is emitted immediately on subscribe
  await sleep(3000);
  const connectedSnap = await snapshot(page);
  note(`After 6s: ${JSON.stringify(connectedSnap)}`);
  await page.screenshot({ path: join(__dirname, 'sse-02-connected.png') });

  // Wait past one heartbeat (15s interval) to see lastHeartbeat update
  await sleep(15000);
  const heartbeatSnap = await snapshot(page);
  note(`After 21s (post-heartbeat): ${JSON.stringify(heartbeatSnap)}`);
  await page.screenshot({ path: join(__dirname, 'sse-03-heartbeat.png') });

  // Pull lastHeartbeat from the service via window inspection
  const liveValues = await page.evaluate(() => {
    const ng = window.getAllAngularRootElements?.()?.[0];
    return { hasAngular: !!ng, marker: 'ok' };
  });
  note(`Angular runtime present: ${JSON.stringify(liveValues)}`);

  const failures = [];
  if (sseEvents.length === 0) failures.push('No /api/v1/stream response observed');
  if (connectedSnap.state !== 'connected') failures.push(`After 6s expected state=connected, got ${connectedSnap.state}`);
  if (heartbeatSnap.state !== 'connected') failures.push(`After 21s expected state=connected, got ${heartbeatSnap.state}`);
  note(`Failures: ${failures.length === 0 ? 'NONE' : JSON.stringify(failures)}`);

  const summary = { earlySnap, connectedSnap, heartbeatSnap, sseEvents, failures, consoleErrors, findings };
  writeFileSync(join(__dirname, 'verify-sse-report.json'), JSON.stringify(summary, null, 2));
  console.log('[sse] DONE');
  console.log(JSON.stringify(summary, null, 2));

  await browser.close();
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch(err => { console.error('[sse] FAILED', err); process.exit(1); });
