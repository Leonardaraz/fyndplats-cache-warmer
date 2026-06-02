// PDP hero-diagnostik — verifierar Leonards två buggar på riktig prod/preview:
//   Bug 1: hjältebilden laddar inte i tid (bara blur syns) + blur "pytteliten"
//   Bug 2: variant-byte → unmount → blur-blip → hopp (ingen crossfade)
//
// Kör: node tools/pdp-hero-diag.js <before|after> [baseUrl]
//   baseUrl default = https://www.fyndplats.se (faller tillbaka på vercel.app
//   om www trippar Vercel-checkpoint).
//
// För varje produkt:
//   • Mobil 375×812, 4G-throttling (Slow 4G-profil)
//   • Screenshot @ ~500ms efter navigation (laddar hero redan? eller bara blur?)
//   • Screenshot @ +2s (har hero målats?)
//   • LCP (Performance API) + LCP-elementets src
//   • Network: loggar hero-bildens request(ar) — status, storlek, timing
//   • Variant-byte: klick på pill 1→2, screenshots @ 0/200/500ms → blur-blip?
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TAG = process.argv[2] || 'before';
const BASE = (process.argv[3] || 'https://www.fyndplats.se').replace(/\/$/, '');
const OUT = path.join(__dirname, '..', 'outputs', 'pdp-hero-diag');
fs.mkdirSync(OUT, { recursive: true });

const slugs = ['1l-sportflaska-med-sugror-bpa-fri', 'dorrklocka-med-kamera-tradlos-videodorrklocka'];

// Slow 4G (samma siffror som DevTools "Slow 4G"): ~400 Kbps ner, 400ms RTT.
const THROTTLE = {
  offline: false,
  downloadThroughput: (400 * 1024) / 8,
  uploadThroughput: (400 * 1024) / 8,
  latency: 400,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const results = [];

  for (const slug of slugs) {
    const url = `${BASE}/produkt/${slug}`;
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true });

    // Network-logg: fånga alla wixstatic-bild-requests (hero + variant-thumbs).
    const net = [];
    page.on('response', (res) => {
      const u = res.url();
      if (u.includes('static.wixstatic.com') || u.includes('/_next/image')) {
        const h = res.headers();
        net.push({
          url: u.length > 140 ? u.slice(0, 140) + '…' : u,
          status: res.status(),
          type: h['content-type'] || '',
          len: h['content-length'] || '',
          cache: h['x-vercel-cache'] || h['cf-cache-status'] || '',
        });
      }
    });

    await page.evaluateOnNewDocument(() => {
      try { localStorage.setItem('fp_cookie_consent', 'all'); } catch (_) {}
      window.__lcp = 0; window.__lcpSrc = '';
      try {
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) {
            window.__lcp = e.startTime;
            window.__lcpSrc = (e.element && (e.element.currentSrc || e.element.src)) || e.url || '';
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (_) {}
    });

    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', THROTTLE);

    const metric = { slug, url, error: null };
    try {
      // Navigera men vänta INTE på networkidle — vi vill fånga tidiga frames.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      await sleep(500);
      await page.screenshot({ path: path.join(OUT, `${TAG}-${slug}-t500ms.png`) }).catch(() => {});
      const at500 = await heroState(page).catch((e) => ({ err: String(e.message || e) }));

      await sleep(2000);
      await page.screenshot({ path: path.join(OUT, `${TAG}-${slug}-t2s.png`) }).catch(() => {});
      const at2s = await heroState(page).catch((e) => ({ err: String(e.message || e) }));

      // Låt allt lugna sig, mät LCP.
      await sleep(1500);
      const perf = await page.evaluate(() => ({
        lcpMs: window.__lcp ? Math.round(window.__lcp) : null,
        lcpSrc: (window.__lcpSrc || '').slice(0, 120),
      }));

      // ── Variant-byte: klicka pill 2, fånga blur-blip ──────────────────────
      const variant = { pills: 0, blip: null, frames: [] };
      const pillCount = await page.evaluate(() => document.querySelectorAll('.varswatch').length);
      variant.pills = pillCount;
      if (pillCount >= 2) {
        // Scrolla hero till toppen så screenshotsen fångar samma yta.
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.evaluate(() => {
          const pills = document.querySelectorAll('.varswatch');
          const target = pills[1] || pills[0];
          target && target.click();
        });
        for (const t of [0, 200, 500]) {
          if (t) await sleep(t === 200 ? 200 : 300);
          const s = await heroState(page);
          variant.frames.push({ t, ...s });
          await page.screenshot({ path: path.join(OUT, `${TAG}-${slug}-variant-t${t}.png`) }).catch(() => {});
        }
        // blur-blip = någon frame där hero img saknar complete/naturalWidth.
        variant.blip = variant.frames.some((f) => !f.heroComplete || f.heroNaturalW === 0);
      }

      Object.assign(metric, { at500, at2s, ...perf, variant });
    } catch (e) {
      metric.error = String(e.message || e);
    }

    // Topp-clip för snabb visuell jämförelse.
    metric.net = net.slice(0, 25);
    results.push(metric);
    console.log(JSON.stringify(metric, null, 2));
    await page.close();
  }

  fs.writeFileSync(path.join(OUT, `${TAG}-metrics.json`), JSON.stringify(results, null, 2));
  await browser.close();
  console.log(`\n[done] ${TAG} → ${OUT}`);
})();

// Läser av hjältebildens faktiska tillstånd i DOM:en.
async function heroState(page) {
  return page.evaluate(() => {
    const round = (n) => (n == null ? null : Math.round(n * 100) / 100);
    const img = document.querySelector('.gallery .gmain img');
    if (!img) return { heroExists: false };
    const r = img.getBoundingClientRect();
    const cs = getComputedStyle(img);
    return {
      heroExists: true,
      heroComplete: img.complete,
      heroNaturalW: img.naturalWidth,
      heroCurrentSrc: (img.currentSrc || img.src || '').slice(0, 120),
      heroBoxW: round(r.width),
      heroBoxH: round(r.height),
      // background-image = blur-placeholderns data-URL (next/image). Längden
      // avslöjar om en äkta blur (lång base64) eller shimmer-svg används.
      bgImageLen: (cs.backgroundImage || '').length,
      bgSize: cs.backgroundSize,
    };
  });
}
