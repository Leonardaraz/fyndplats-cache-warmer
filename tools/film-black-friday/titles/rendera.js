// Renderar filmens texter ruta for ruta till genomskinliga PNG-bilder (1080 x 1920).
//   node titles/rendera.js <utmapp> [variant=torsdag|fredag] [antal=100] [fran] [till]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const [utmapp, variant = 'torsdag', antal = '100', fran = '0', till = '749'] = process.argv.slice(2);
  fs.mkdirSync(utmapp, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const fil = 'file://' + path.resolve(__dirname, 'titlar.html') + `#variant=${variant}&antal=${antal}`;
  await page.goto(fil, { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.ready; });
  const laddade = await page.evaluate(() => Array.from(document.fonts).filter((f) => f.status === 'loaded').length);
  if (laddade < 2) { console.error('VARNING: typsnitten laddades inte'); process.exitCode = 2; }
  const t0 = Date.now();
  let tomma = 0;
  for (let f = parseInt(fran, 10); f <= parseInt(till, 10); f++) {
    await page.evaluate((t) => window.satt(t), f / 30);
    await page.screenshot({ path: path.join(utmapp, `t_${String(f).padStart(4, '0')}.png`), omitBackground: true });
  }
  await browser.close();
  console.log(`texter klara: ${variant}, ${antal} fynd, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
})();
