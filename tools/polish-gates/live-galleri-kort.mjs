// Mäter vad en kund ser på en publicerad produktsida där VARJE axel är kort (`.varcard`), alltså två optioner med kort i stället för
// färgrutor: galleriet för varje kombination, ett klick per axel. Skriver ingenting.
//
//   node tools/polish-gates/live-galleri-kort.mjs <slug> [galleri-id.json]
//
// Varför ett eget skript (2026-10-23, hundbädden c3d1fa41): `live-galleri.mjs` klickar korten ett i taget och kallar varje kort ett "val".
// På en sida med två kortaxlar byter ett klick på en storlek aldrig färg, så raderna för storlekarna visade den färg som klickats sist och
// såg ut som att storleken inte ändrade något. Här läses axlarna var för sig (`.pdp-axis` med `.varcards`), och varje kombination klickas
// som färg först och storlek sedan, som kunden gör.
//
// <slug> är sidans adress efter /produkt/. galleri-id.json är valfri: Wix-fil-id:n i galleriets ordning (som för live-galleri.mjs), då visas
// bilderna som #1, #2 … annars som de sex första tecknen i fil-id:t.
//
// ☠️ Butikens cache fylls på var femte minut efter en ändring (cron `uppdatera-andrade`). Kontrollera `age` på sidan innan du litar på en rad.
// ☠️ Ett kort kan vara en kombination som inte finns (`.na`, "finns inte i …"). Den raden skrivs som "finns inte" och klickas inte.
import fs from 'node:fs';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs'));
}

const [, , slug, idFil] = process.argv;
if (!slug) {
  console.error('användning: node live-galleri-kort.mjs <slug> [galleri-id.json]');
  process.exit(2);
}
const lista = idFil ? JSON.parse(fs.readFileSync(idFil, 'utf8')) : [];
const pos = (s) => {
  const m = decodeURIComponent(s || '').match(/b379ce_([0-9a-f]{32})/);
  if (!m) return null;
  const i = lista.findIndex((f) => f.startsWith(m[1]));
  return i >= 0 ? '#' + (i + 1) : m[1].slice(0, 6);
};
// Ett korts etikett kan få ett tillägg med det andra valet ("Brun och svart – finns inte i 107 cm"): valet letas upp på namnet före " – ".
const bas = (l) => (l || '').replace(/ – .*$/, '').trim();

const webblasare = await chromium.launch({ args: ['--no-sandbox'] });
const sida = await (await webblasare.newContext({ viewport: { width: 1280, height: 1600 }, locale: 'sv-SE' })).newPage();
await sida.goto(`https://www.fyndplats.se/produkt/${slug}?cb=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
await sida.waitForSelector('.pdp', { timeout: 30000 });
await sida.waitForTimeout(1500);

async function las() {
  return await sida.evaluate(() => {
    const src = (i) => [i.getAttribute('src'), i.getAttribute('data-src'), i.getAttribute('srcset')].filter(Boolean).join(' ');
    return {
      axlar: [...document.querySelectorAll('.pdp-axis')].map((ax) => ({
        nyckel: ax.querySelector('.varhead-key')?.textContent?.trim() || null,
        val: ax.querySelector('.varhead-val')?.textContent?.trim() || null,
        kort: [...ax.querySelectorAll('.varcard')].map((c) => ({
          l: c.getAttribute('aria-label'),
          akt: c.classList.contains('active'),
          na: c.classList.contains('na') || c.getAttribute('aria-disabled') === 'true',
          pris: c.querySelector('.varcard-price')?.textContent?.trim() || '',
        })),
      })),
      galleri: [...document.querySelectorAll('.gtiles .gtile img')].map(src),
      pris: document.querySelector('.pdp-price')?.textContent?.trim()?.slice(0, 40) || null,
    };
  });
}

const valj = (axel, namn) =>
  sida.evaluate(
    ([ax, n]) => {
      const el = document.querySelectorAll('.pdp-axis')[ax];
      const kort = [...(el?.querySelectorAll('.varcard') || [])].find((c) => {
        const l = (c.getAttribute('aria-label') || '').trim();
        return l === n || l.startsWith(n + ' – ');
      });
      if (!kort) return false;
      kort.click();
      return true;
    },
    [axel, namn],
  );

const start = await las();
const kortAxlar = start.axlar.filter((a) => a.kort.length > 0);
console.log('VÄLJARE', kortAxlar.length, 'kortaxlar:', kortAxlar.map((a) => `${a.nyckel || '?'} (${a.kort.map((k) => bas(k.l)).join(' | ')})`).join(' ; '));
if (kortAxlar.length !== 2 || start.axlar.length !== 2) {
  console.log('☠️ skriptet gäller sidor med exakt två kortaxlar; använd live-galleri.mjs för andra former');
  await webblasare.close();
  process.exit(2);
}
let forra = '';
for (const a of start.axlar[0].kort) {
  if (!(await valj(0, bas(a.l)))) console.log('KOMBO', bas(a.l), '– hittade inte kortet');
  await sida.waitForTimeout(600);
  const nu = await las();
  for (const s of nu.axlar[1].kort) {
    if (s.na) {
      console.log('KOMBO', bas(a.l), '×', bas(s.l), 'finns inte');
      continue;
    }
    if (!(await valj(1, bas(s.l)))) console.log('KOMBO', bas(a.l), '×', bas(s.l), '– hittade inte kortet');
    await sida.waitForTimeout(700);
    let nu2 = await las();
    // Galleriet kan släpa efter valet: samma lista som förra kombinationen får en andra läsning.
    if (nu2.galleri.map(pos).join(',') === forra) {
      await sida.waitForTimeout(1200);
      nu2 = await las();
    }
    forra = nu2.galleri.map(pos).join(',');
    console.log('KOMBO', bas(a.l), '×', bas(s.l), JSON.stringify({ val: nu2.axlar.map((x) => `${x.nyckel}=${x.val}`).join(' | '), galleri: forra, pris: nu2.pris }));
  }
}
await webblasare.close();
