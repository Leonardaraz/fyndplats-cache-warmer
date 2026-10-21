// Mäter vad en kund ser på en publicerad produktsida: väljarens val och galleriet för varje
// kombination. Skriver ingenting.
//
//   node tools/polish-gates/live-galleri.mjs <slug> [galleri-id.json]
//
// <slug> är sidans adress efter /produkt/. galleri-id.json är valfri: en lista med
// Wix-fil-id:n i galleriets ordning (`media.itemsInfo.items[].id` ur produktens GET).
// Med den visas bilderna som #1, #2 … (plats i galleriet), annars som de sex första
// tecknen i fil-id:t.
//
// Tre väljare finns i butiken, och skriptet klickar alla:
//   .pdp-axis + .varswatch   en eller två axlar (storlek × färg), "finns inte" för en
//                            kombination som saknas
//   .pdp-variants + .varswatch  en enda axel utan .pdp-axis-omslag (strandparasollen,
//                            2026-10-21: skriptet svarade "ingen väljare" tills den lades till)
//   .varcard                 kort med miniatyr, för produkter med många val
//
// ☠️ Butikens cache fylls på var femte minut efter en ändring (cron `uppdatera-andrade`),
// så en mätning direkt efter en skrivning ser den gamla sidan. Kontrollera `age` på sidan
// (curl -I) eller vänta ut en cykel. Mät en kombination i taget: det är det kunden gör.
import fs from 'node:fs';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs'));
}

const [, , slug, idFil] = process.argv;
if (!slug) {
  console.error('användning: node live-galleri.mjs <slug> [galleri-id.json]');
  process.exit(2);
}
const lista = idFil ? JSON.parse(fs.readFileSync(idFil, 'utf8')) : [];
const pos = (s) => {
  const m = decodeURIComponent(s || '').match(/b379ce_([0-9a-f]{32})/);
  if (!m) return null;
  const i = lista.findIndex((f) => f.startsWith(m[1]));
  return i >= 0 ? '#' + (i + 1) : m[1].slice(0, 6);
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
        sw: [...ax.querySelectorAll('.varswatch')].map((s) => ({
          l: s.getAttribute('aria-label'),
          akt: s.classList.contains('active'),
          na: s.classList.contains('na'),
        })),
      })),
      kort: [...document.querySelectorAll('.varcard')].map((c) => ({
        l: c.getAttribute('aria-label'),
        akt: c.classList.contains('active'),
        bild: c.querySelector('img')?.getAttribute('src') || '',
        pris: c.querySelector('.varcard-price')?.textContent?.trim() || '',
      })),
      galleri: [...document.querySelectorAll('.gtiles .gtile img')].map(src),
      kortVal: document.querySelector('.varhead-val')?.textContent?.trim() || '',
      pris: document.querySelector('.pdp-price')?.textContent?.trim()?.slice(0, 40) || null,
    };
  });
}
const rad = (t, val) => ({ val, galleri: t.galleri.map(pos).join(','), pris: t.pris });

const start = await las();
const axSel = (await sida.locator('.pdp-axis').count()) > 0 ? '.pdp-axis' : '.pdp-variants';
const antalSynliga = start.axlar.length + (start.kort.length ? 1 : 0);
console.log('VÄLJARE', start.axlar.length ? `${start.axlar.length} axel/axlar` : start.kort.length ? `${start.kort.length} kort` : 'ingen');
if (!antalSynliga) {
  console.log('START', JSON.stringify(rad(start, '')));
} else if (start.kort.length) {
  console.log('KORT', JSON.stringify(start.kort.map((k) => `${k.l}${k.akt ? '*' : ''} [${pos(k.bild)}] ${k.pris}`)));
  for (const k of start.kort) {
    await sida.locator(`.varcard[aria-label="${citera(k.l)}"]`).first().click({ force: true }).catch(() => {});
    await sida.waitForTimeout(600);
    const nu = await las();
    console.log('VAL', k.l, JSON.stringify(rad(nu, nu.kortVal)));
  }
} else if (start.axlar.length === 1) {
  for (const s of start.axlar[0].sw) {
    await sida.locator(axSel).nth(0).locator(`.varswatch[aria-label="${citera(s.l)}"]`).first().click({ force: true }).catch(() => {});
    await sida.waitForTimeout(500);
    const nu = await las();
    console.log('VAL', s.l, JSON.stringify(rad(nu, nu.axlar[0].val)));
  }
} else {
  for (const a of start.axlar[0].sw) {
    await sida.locator(axSel).nth(0).locator(`.varswatch[aria-label="${citera(a.l)}"]`).first().click({ force: true }).catch(() => {});
    await sida.waitForTimeout(400);
    const nu = await las();
    for (const s of nu.axlar[1].sw) {
      if (s.na) {
        console.log('KOMBO', a.l, '×', s.l, 'finns inte');
        continue;
      }
      await sida.locator(axSel).nth(1).locator(`.varswatch[aria-label="${citera(s.l)}"]`).first().click({ force: true }).catch(() => {});
      await sida.waitForTimeout(500);
      const nu2 = await las();
      console.log('KOMBO', a.l, '×', s.l, JSON.stringify(rad(nu2, nu2.axlar.map((x) => `${x.nyckel}=${x.val}`).join(' | '))));
    }
  }
}
await webblasare.close();
