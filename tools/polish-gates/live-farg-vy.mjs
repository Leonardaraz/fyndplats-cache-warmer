// live-farg-vy.mjs <slug> <ut.json>: mäter färgvyn genom att bara klicka färgaxeln — för sidor med två axlar,
// där live-bilder.mjs klickar storleken efter färgen och ibland landar i en annan färgs vy.
// Färgaxeln är den vars nyckel heter Färg (omgång 4: på skrivbordet `3b868848` är Storlek den första axeln och Färg den andra);
// finns ingen sådan används axel 0.
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
const axel = await p.evaluate(() => {
  const a = [...document.querySelectorAll('.pdp-axis')];
  const i = a.findIndex(x => /^f[äa]rg/i.test(x.querySelector('.varhead-key')?.textContent?.trim() || ''));
  return i < 0 ? 0 : i;
});
const sw = await p.evaluate((i) => [...(document.querySelectorAll('.pdp-axis')[i]?.querySelectorAll('.varswatch') || [])].map(s => s.getAttribute('aria-label')), axel);
const nyckel = await p.evaluate((i) => document.querySelectorAll('.pdp-axis')[i]?.querySelector('.varhead-key')?.textContent?.trim() || 'Färg', axel);
const kombos = [];
for (let n = 0; n < sw.length; n++) {
  await p.locator('.pdp-axis').nth(axel).locator('.varswatch').nth(n).click({ force: true }).catch(() => {});
  await p.waitForTimeout(900);
  const ids = (await las()).map(idAv).filter(Boolean);
  const val = await p.evaluate((i) => document.querySelectorAll('.pdp-axis')[i]?.querySelector('.varhead-val')?.textContent?.trim(), axel);
  kombos.push({ val: `${nyckel}=${val}`, ids, pris: null });
}
const ut = { slug, vaxlare: `färgklick på axel ${axel}`, kombos, unika: [...new Set(kombos.flatMap(k => k.ids))] };
fs.writeFileSync(utfil, JSON.stringify(ut));
console.log(slug, kombos.map(k => k.val + ':' + k.ids.length).join(' '));
await b.close();
