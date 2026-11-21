// tools/sok-matning/oppning.cjs
//
// Sökläget öppnas: tiden från fingret (touchstart) tills de populära varorna
// står i sidan och tills nästa bild har ritats, tidsstämplat i sidan. Långa
// uppgifter före och efter. Flera varv på nyladdad sida, medianen sist.
//
//   STRYP=4 VARV=8 node tools/sok-matning/oppning.cjs <bas>
//
// Mot www ingår nätet (sökindexet hämtas när fingret landar), mot ett lokalt
// bygge inte: jämför det som är blockerat, inte bara tiden till korten.
const { chromium } = require('playwright');
const BAS = process.argv[2] || 'http://localhost:3311';
const STRYP = Number(process.env.STRYP || 4);
const VARV = Number(process.env.VARV || 8);
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
(async () => {
  const b = await chromium.launch();
  const ut = { kort: [], bild: [], fore: [], efter: [], langstEfter: [] };
  for (let v = 0; v < VARV; v++) {
    const c = await b.newContext({ locale: 'sv-SE', viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await c.addInitScript(() => {
      try { localStorage.setItem('fp_cookie_consent', 'necessary'); } catch {}
      window.__lt = []; window.__m = {};
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ s: e.startTime, d: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch {}
      document.addEventListener('touchstart', (e) => { if (!window.__m.tryck && e.target && e.target.closest && e.target.closest('.hsearch-mobile')) window.__m.tryck = performance.now(); }, { capture: true, passive: true });
      const se = () => {
        if (window.__m.kort || !document.querySelector('.hsearch-mobile .sugg-kort')) return;
        window.__m.kort = performance.now();
        requestAnimationFrame(() => setTimeout(() => { window.__m.bild = performance.now(); }, 0));
      };
      new MutationObserver(se).observe(document, { childList: true, subtree: true });
    });
    const p = await c.newPage();
    const cdp = await c.newCDPSession(p);
    await p.goto(BAS + '/', { waitUntil: 'load', timeout: 120000 });
    await p.waitForTimeout(2500);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: STRYP });
    await p.waitForTimeout(300);
    await p.locator('.hsearch-mobile input[name="q"]').tap();
    await p.waitForFunction(() => window.__m.bild, null, { timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(3500);
    const { m, lt } = await p.evaluate(() => ({ m: window.__m, lt: window.__lt }));
    if (!m.tryck || !m.kort) { console.log(`varv ${v + 1}: ingen mätning`); await c.close(); continue; }
    const fore = lt.filter((x) => x.s >= m.tryck - 5 && x.s < m.kort);
    const efter = lt.filter((x) => x.s >= m.kort);
    const blk = (a) => Math.round(a.reduce((s, x) => s + Math.max(0, x.d - 50), 0));
    ut.kort.push(m.kort - m.tryck); ut.bild.push((m.bild || m.kort) - m.tryck); ut.fore.push(blk(fore)); ut.efter.push(blk(efter)); ut.langstEfter.push(Math.max(0, ...efter.map((x) => x.d)));
    console.log(`varv ${v + 1}: korten i sidan efter ${Math.round(m.kort - m.tryck)} ms, ritade efter ${Math.round((m.bild || m.kort) - m.tryck)} ms | före: ${fore.map((x) => Math.round(x.d)).join('+') || '–'} | efter: ${efter.map((x) => Math.round(x.d)).join('+') || '–'}`);
    await c.close();
  }
  console.log(`MEDIAN ${BAS}: korten i sidan ${Math.round(med(ut.kort))} ms, ritade ${Math.round(med(ut.bild))} ms efter fingret; blockerat före ${med(ut.fore)} ms, efter ${med(ut.efter)} ms; längsta uppgift efter ${Math.round(med(ut.langstEfter))} ms (störst ${Math.round(Math.max(...ut.langstEfter))} ms)`);
  await b.close();
})().catch((e) => { console.error(String(e).slice(0, 600)); process.exit(1); });
