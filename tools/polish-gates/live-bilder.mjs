// Mäter vad en kund ser på en publicerad produktsida, med hela fil-id:n. Skriver ingenting i Wix.
//
//   node tools/polish-gates/live-bilder.mjs <slug> <ut.json>
//
// Samma väljare och samma klick som live-galleri.mjs, men för varje kombination skrivs galleriets Wix fil-id:n i ordning
// (`b379ce_<32 hex>~mv2.<ext>`) i stället för platsnummer. Utfilen är underlaget för att välja fler bilder till en färg:
// vilka bilder ser kunden i varje färg, och vilka av leverantörens bilder sitter redan på sidan (hashjämförelse mot de
// nedladdade filerna). ☠️ Butikens cache fylls på var femte minut efter en ändring; mät inte direkt efter en skrivning.
//
//   { slug, vaxlare: "1 axel/axlar" | "N kort" | "ingen", kombos: [{ val, ids: [...], pris }], unika: [...] }
import fs from 'node:fs';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs'));
}

const [, , slug, utfil] = process.argv;
if (!slug || !utfil) {
  console.error('användning: node live-bilder.mjs <slug> <ut.json>');
  process.exit(2);
}
const idAv = (s) => {
  const m = decodeURIComponent(s || '').match(/\/media\/(b379ce_[0-9a-f]{32}~mv2\.[a-z0-9]+)/i) || decodeURIComponent(s || '').match(/\/media\/([^/\s]+)/);
  return m ? m[1] : null;
};
const citera = (s) => s.replace(/"/g, '\\"');

const webblasare = await chromium.launch({ args: ['--no-sandbox'] });
const sida = await (await webblasare.newContext({ viewport: { width: 1280, height: 1600 }, locale: 'sv-SE' })).newPage();
await sida.goto(`https://www.fyndplats.se/produkt/${slug}?cb=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
await sida.waitForSelector('.pdp', { timeout: 30000 });
await sida.waitForTimeout(1500);

async function las() {
  return await sida.evaluate(() => {
    const src = (i) => [i.getAttribute('src'), i.getAttribute('data-src'), i.getAttribute('srcset')].filter(Boolean).join(' ');
    return {
      axlar: (document.querySelector('.pdp-axis')
        ? [...document.querySelectorAll('.pdp-axis')]
        : [...document.querySelectorAll('.pdp-variants')].filter((v) => v.querySelector('.varswatches'))
      ).map((ax) => ({
        nyckel: ax.querySelector('.varhead-key')?.textContent?.trim(),
        val: ax.querySelector('.varhead-val')?.textContent?.trim(),
        sw: [...ax.querySelectorAll('.varswatch')].map((s) => ({ l: s.getAttribute('aria-label'), na: s.classList.contains('na') })),
      })),
      kort: [...document.querySelectorAll('.varcard')].map((c) => ({ l: c.getAttribute('aria-label') })),
      galleri: [...document.querySelectorAll('.gtiles .gtile img')].map(src),
      kortVal: document.querySelector('.varhead-val')?.textContent?.trim() || '',
      pris: document.querySelector('.pdp-price')?.textContent?.trim()?.slice(0, 40) || null,
    };
  });
}
const ids = (t) => t.galleri.map(idAv).filter(Boolean);

const start = await las();
const axSel = (await sida.locator('.pdp-axis').count()) > 0 ? '.pdp-axis' : '.pdp-variants';
const kombos = [];
const ut = { slug, vaxlare: start.axlar.length ? `${start.axlar.length} axel/axlar` : start.kort.length ? `${start.kort.length} kort` : 'ingen', kombos };
if (!start.axlar.length && !start.kort.length) {
  kombos.push({ val: '', ids: ids(start), pris: start.pris });
} else if (start.kort.length) {
  for (const k of start.kort) {
    await sida.locator(`.varcard[aria-label="${citera(k.l)}"]`).first().click({ force: true }).catch(() => {});
    await sida.waitForTimeout(600);
    const nu = await las();
    kombos.push({ val: k.l, ids: ids(nu), pris: nu.pris });
  }
} else if (start.axlar.length === 1) {
  for (const s of start.axlar[0].sw) {
    await sida.locator(axSel).nth(0).locator(`.varswatch[aria-label="${citera(s.l)}"]`).first().click({ force: true }).catch(() => {});
    await sida.waitForTimeout(500);
    const nu = await las();
    kombos.push({ val: `${nu.axlar[0].nyckel || ''}=${nu.axlar[0].val}`, ids: ids(nu), pris: nu.pris });
  }
} else {
  for (const a of start.axlar[0].sw) {
    await sida.locator(axSel).nth(0).locator(`.varswatch[aria-label="${citera(a.l)}"]`).first().click({ force: true }).catch(() => {});
    await sida.waitForTimeout(400);
    const nu = await las();
    for (const s of nu.axlar[1].sw) {
      if (s.na) {
        kombos.push({ val: `${a.l} × ${s.l}`, ids: [], pris: null, finnsInte: true });
        continue;
      }
      await sida.locator(axSel).nth(1).locator(`.varswatch[aria-label="${citera(s.l)}"]`).first().click({ force: true }).catch(() => {});
      await sida.waitForTimeout(500);
      const nu2 = await las();
      kombos.push({ val: `${a.l} × ${s.l}`, ids: ids(nu2), pris: nu2.pris });
    }
  }
}
ut.unika = [...new Set(kombos.flatMap((k) => k.ids))];
fs.writeFileSync(utfil, JSON.stringify(ut));
console.log(slug, ut.vaxlare, 'kombinationer', kombos.length, 'unika bilder', ut.unika.length, 'minsta vy', Math.min(...kombos.filter((k) => !k.finnsInte).map((k) => k.ids.length)));
await webblasare.close();
