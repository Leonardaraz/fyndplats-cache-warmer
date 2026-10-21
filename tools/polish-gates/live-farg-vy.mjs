// live-farg-vy.mjs <slug> <ut.json>: mäter färgvyn genom att bara klicka färgaxeln (axel 0) — för sidor med två axlar,
// där live-bilder.mjs klickar storleken efter färgen och ibland landar i en annan färgs vy.
import fs from 'node:fs';
let chromium;
try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const [, , slug, utfil] = process.argv;
const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 1600 }, locale: 'sv-SE' })).newPage();
await p.goto(`https://www.fyndplats.se/produkt/${slug}?cb=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForSelector('.pdp', { timeout: 30000 });
await p.waitForTimeout(1500);
const idAv = (s) => { const m = decodeURIComponent(s || '').match(/\/media\/(b379ce_[0-9a-f]{32}~mv2\.[a-z0-9]+)/i); return m ? m[1] : null; };
const las = () => p.evaluate(() => [...document.querySelectorAll('.gtiles .gtile img')].map(i => [i.getAttribute('src'), i.getAttribute('data-src'), i.getAttribute('srcset')].filter(Boolean).join(' ')));
const sw = await p.evaluate(() => [...document.querySelectorAll('.pdp-axis')][0] ? [...document.querySelectorAll('.pdp-axis')][0].querySelectorAll('.varswatch') && [...[...document.querySelectorAll('.pdp-axis')][0].querySelectorAll('.varswatch')].map(s => s.getAttribute('aria-label')) : []);
const nyckel = await p.evaluate(() => document.querySelectorAll('.pdp-axis')[0]?.querySelector('.varhead-key')?.textContent?.trim() || 'Färg');
const kombos = [];
for (let n = 0; n < sw.length; n++) {
  await p.locator('.pdp-axis').nth(0).locator('.varswatch').nth(n).click({ force: true }).catch(() => {});
  await p.waitForTimeout(900);
  const ids = (await las()).map(idAv).filter(Boolean);
  const val = await p.evaluate(() => document.querySelector('.varhead-val')?.textContent?.trim());
  kombos.push({ val: `${nyckel}=${val}`, ids, pris: null });
}
const ut = { slug, vaxlare: '1 axel/axlar (färgklick)', kombos, unika: [...new Set(kombos.flatMap(k => k.ids))] };
fs.writeFileSync(utfil, JSON.stringify(ut));
console.log(slug, kombos.map(k => k.val + ':' + k.ids.length).join(' '));
await b.close();
