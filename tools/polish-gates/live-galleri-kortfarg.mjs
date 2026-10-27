// Mäter vad en kund ser på en publicerad produktsida där FÄRGEN väljs med kort (`.varcard`) och storleken med knappar (`.varswatch` i en `.pdp-axis`):
// galleriets sex första tecken per fil-id för varje kombination, ett klick på färgen och sedan ett på storleken, som kunden gör. Skriver ingenting i butiken.
//
//   node tools/polish-gates/live-galleri-kortfarg.mjs <slug>
//
// Varför ett eget skript (2026-10-24, bokhyllan 79ab08fe): live-galleri.mjs klickar färgrutor och knappar, och live-galleri-kort.mjs kräver kort på BÅDA axlarna.
// Bokhyllan har färgen som kort och höjden som knappar, så ingen av dem läste båda axlarna. Utskriften har samma form som live-galleri.mjs (`KOMBO ... {"val":…,"galleri":…}`),
// så verifiera-live.py läser den.
//
// <slug> är sidans adress efter /produkt/. Första raden är `KORT [...] | storleksaxel <namn>`, och live-alla-kombinationer.sh väljer det här skriptet när den ser den.
//
// ☠️ Butikens cache fylls på var femte minut efter en ändring i Wix (cron `uppdatera-andrade`). Kontrollera `age` på sidan innan du litar på en rad.
// ☠️ En kombination som inte finns (`.na`, "finns inte i …") skrivs som "finns inte" och klickas inte. Ett klick som inte byter galleri väntar en gång till innan raden skrivs.
// ☠️ Skriptet förutsätter att färgen är kort och att den första axeln med knappar är storleken. Kraschar det på `reading 'sw'` är båda axlarna kort: använd live-galleri-kort.mjs.
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs'));
}
const slug = process.argv[2];
if (!slug) {
  console.error('användning: node live-galleri-kortfarg.mjs <slug>');
  process.exit(2);
}
const hex = (s) => {
  const m = decodeURIComponent(s || '').match(/b379ce_([0-9a-f]{32})/);
  return m ? m[1].slice(0, 6) : '?';
};
const citera = (s) => s.replace(/"/g, '\\"');
// Ett korts eller en knapps etikett kan få ett tillägg med det andra valet ("Beige – finns inte i 100 cm"): valet letas upp på namnet före " – ".
const bas = (l) => (l || '').replace(/ – .*$/, '').trim();
const webblasare = await chromium.launch({ args: ['--no-sandbox'] });
const sida = await (await webblasare.newContext({ viewport: { width: 1280, height: 1600 }, locale: 'sv-SE' })).newPage();
await sida.goto(`https://www.fyndplats.se/produkt/${slug}?cb=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
await sida.waitForSelector('.pdp', { timeout: 30000 });
await sida.waitForTimeout(1500);
const las = () =>
  sida.evaluate(() => {
    const src = (i) => [i.getAttribute('src'), i.getAttribute('data-src'), i.getAttribute('srcset')].filter(Boolean).join(' ');
    return {
      kort: [...document.querySelectorAll('.varcard')].map((c) => ({ l: c.getAttribute('aria-label'), akt: c.classList.contains('active') })),
      axlar: [...document.querySelectorAll('.pdp-axis')].map((ax) => ({
        nyckel: ax.querySelector('.varhead-key')?.textContent?.trim(),
        sw: [...ax.querySelectorAll('.varswatch')].map((s) => ({ l: s.getAttribute('aria-label'), na: s.classList.contains('na') })),
      })),
      galleri: [...document.querySelectorAll('.gtiles .gtile img')].map(src),
      pris: document.querySelector('.pdp-price')?.textContent?.trim()?.slice(0, 30) || null,
    };
  });
const start = await las();
const sAx = start.axlar.findIndex((a) => a.sw.length > 0);
console.log('KORT', JSON.stringify(start.kort.map((k) => k.l)), '| storleksaxel', sAx >= 0 ? start.axlar[sAx].nyckel : 'saknas');
let forra = '';
for (const k of start.kort) {
  await sida.locator(`.varcard[aria-label="${citera(k.l)}"]`).first().click({ force: true }).catch(() => {});
  await sida.waitForTimeout(700);
  const nu = await las();
  for (const s of nu.axlar[sAx].sw) {
    if (s.na) {
      console.log('KOMBO', k.l, '×', s.l, 'finns inte');
      continue;
    }
    await sida.evaluate(
      ([ax, n]) => {
        const sw = [...document.querySelectorAll('.pdp-axis')[ax].querySelectorAll('.varswatch')].find((x) => {
          const l = (x.getAttribute('aria-label') || '').trim();
          return l === n || l.startsWith(n + ' – ');
        });
        if (sw) sw.click();
      },
      [sAx, bas(s.l)],
    );
    await sida.waitForTimeout(700);
    let n2 = await las();
    if (n2.galleri.map(hex).join(',') === forra) {
      await sida.waitForTimeout(1200);
      n2 = await las();
    }
    forra = n2.galleri.map(hex).join(',');
    console.log(
      'KOMBO',
      k.l,
      '×',
      bas(s.l),
      JSON.stringify({
        val: (start.axlar.find((a) => a.sw.length === 0)?.nyckel || 'Färg') + '=' + k.l + ' | ' + start.axlar[sAx].nyckel + '=' + bas(s.l),
        galleri: forra,
        pris: n2.pris,
      }),
    );
  }
}
await webblasare.close();
