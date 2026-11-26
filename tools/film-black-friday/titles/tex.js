// Renderar textkort till PNG med Chromium, sa att typografin blir densamma som i butiken.
//   node titles/tex.js <spec.json> <utmapp>
// spec: [{ id, w, h, html, bakgrund? }]  (bakgrund utelamnad = genomskinlig)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FONTER = path.resolve(__dirname, '..', 'assets', 'fonts');
const GRUND_CSS = `
@font-face { font-family: 'Newsreader'; src: url('file://${FONTER}/Newsreader-VF.ttf'); font-weight: 200 800; font-style: normal; }
@font-face { font-family: 'Newsreader'; src: url('file://${FONTER}/Newsreader-Italic-VF.ttf'); font-weight: 200 800; font-style: italic; }
@font-face { font-family: 'Geist'; src: url('file://${FONTER}/Geist-VF.ttf'); font-weight: 100 900; font-style: normal; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: transparent; }
body { font-family: 'Geist', sans-serif; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; font-optical-sizing: auto; }
.serif { font-family: 'Newsreader', Georgia, serif; }
.kort { position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
`;

(async () => {
  const [specFil, utmapp] = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(specFil, 'utf8'));
  fs.mkdirSync(utmapp, { recursive: true });
  const browser = await chromium.launch();
  for (const k of spec) {
    const page = await browser.newPage({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: 1 });
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${GRUND_CSS}${k.css || ''}</style></head>
<body><div class="kort" style="width:${k.w}px;height:${k.h}px;${k.bakgrund ? 'background:' + k.bakgrund + ';' : ''}">${k.html}</div></body></html>`;
    const htmlFil = path.join(utmapp, '_' + k.id + '.html');
    fs.writeFileSync(htmlFil, html);
    await page.goto('file://' + path.resolve(htmlFil), { waitUntil: 'load' });
    await page.evaluate(async () => { await document.fonts.ready; });
    const laddade = await page.evaluate(() => Array.from(document.fonts).filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.style));
    if (!laddade.length) { console.error('VARNING: inga typsnitt laddade for', k.id); process.exitCode = 2; }
    await page.waitForTimeout(60);
    fs.unlinkSync(htmlFil);
    await page.screenshot({ path: path.join(utmapp, k.id + '.png'), omitBackground: !k.bakgrund });
    await page.close();
  }
  await browser.close();
  console.log('texturer:', spec.map((k) => k.id).join(', '));
})();
