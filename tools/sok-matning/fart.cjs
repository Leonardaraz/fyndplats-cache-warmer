// tools/sok-matning/fart.cjs
//
// Sökfältets fart som en telefon upplever den: Chromium med strypt processor.
//
//   STRYP=4 node tools/sok-matning/fart.cjs <bas> [ord,ord,…]
//
// `bas` är butiken som mäts: https://www.fyndplats.se, eller ett lokalt bygge
// (npx next build && npx next start -p 3311 → http://localhost:3311).
// STRYP är hur många gånger långsammare processorn görs (4 liknar en äldre
// telefon), TAKT millisekunderna mellan tangenterna (110), och DIREKT=1 skriver
// utan att vänta på uppvärmningen.
//
// Mäter, i mobilens sökläge:
//   - öppningen: från trycket i fältet tills de populära varorna står där,
//   - långa uppgifter (över 50 ms) medan indexet läses in och värms upp,
//   - per tangent: hur länge tangenten väntar innan den behandlas, hur lång tid
//     det tar tills nästa bild ritas, och långa uppgifter,
//   - tiden från sista tangenten tills listan står still.
// Körningarna spretar: läs summan, och kör två gånger innan en siffra citeras.
const { chromium } = require('playwright');
const BAS = process.argv[2] || 'http://localhost:3311';
const ORD = (process.argv[3] || 'trägårdsmöbel,barnmobel,kontorsmöbler,soffa,uppresningsfåtölj,lapor,xtolar,hundförvaring,zzqqxx,svart tv-bänk').split(',');
const STRYP = Number(process.env.STRYP || 4);
const TAKT = Number(process.env.TAKT || 110); // ms mellan tangenterna
const DIREKT = process.env.DIREKT === '1'; // skriv direkt efter trycket, utan att vänta på uppvärmningen

(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ locale: 'sv-SE', viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await c.addInitScript(() => {
    try { localStorage.setItem('fp_cookie_consent', 'necessary'); } catch {}
    window.__lt = []; window.__ev = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ s: e.startTime, d: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch {}
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'keydown' || e.name === 'input' || e.name === 'keypress') window.__ev.push({ n: e.name, s: e.startTime, v: e.processingStart - e.startTime, d: e.duration, p: e.processingEnd - e.processingStart }); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch {}
  });
  const p = await c.newPage();
  const cdp = await c.newCDPSession(p);
  const tid = () => p.evaluate(() => performance.now());
  const langa = async (fran) => (await p.evaluate(() => window.__lt)).filter((x) => x.s >= fran);
  const summera = (lt) => ({ antal: lt.length, langst: Math.round(Math.max(0, ...lt.map((x) => x.d))), blockerat: Math.round(lt.reduce((s, x) => s + Math.max(0, x.d - 50), 0)) });
  const panel = () => p.evaluate(() => [...document.querySelectorAll('.hsearch-mobile .sugg-kort')].map((k) => k.getAttribute('href')).join('|') + '#' + (document.querySelector('.hsearch-mobile .sugg-empty')?.textContent || '') + '#' + (document.querySelector('.hsearch-mobile .sugg-alla-lank')?.textContent || ''));

  console.log(`${BAS}, processorn strypt ${STRYP} gånger, ${TAKT} ms mellan tangenterna${DIREKT ? ', skriver direkt efter trycket' : ''}`);
  const rader = [];
  let forsta = true;
  for (const q of ORD) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await p.goto(BAS + '/', { waitUntil: 'load', timeout: 120000 });
    await p.waitForTimeout(2500);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: STRYP });
    await p.waitForTimeout(300);
    const f = p.locator('.hsearch-mobile input[name="q"]');
    const t0 = await tid();
    await f.tap();
    if (!DIREKT) {
      await p.waitForFunction(() => document.querySelectorAll('.hsearch-mobile .sugg-kort').length > 0, null, { timeout: 60000 }).catch(() => {});
      const oppnad = (await tid()) - t0;
      await p.waitForTimeout(2500); // uppvärmningen i ledig tid
      if (forsta) {
        const lt = summera(await langa(t0));
        console.log(`öppningen: populära varor efter ${Math.round(oppnad)} ms; långa uppgifter medan indexet läses in och värms upp: ${lt.antal} st, längst ${lt.langst} ms, blockerat ${lt.blockerat} ms`);
        forsta = false;
      }
    }
    const t1 = await tid();
    await p.evaluate(() => { window.__ev.length = 0; });
    for (const ch of q) { await p.keyboard.type(ch); await p.waitForTimeout(TAKT); }
    const tSist = await tid();
    // Vänta tills listan stått still i 400 ms.
    let sist = '', stilla = 0, andrad = tSist;
    for (let v = 0; v < 200 && stilla < 8; v++) { await p.waitForTimeout(50); const nu = await panel(); if (nu === sist) stilla++; else { stilla = 0; sist = nu; andrad = await tid(); } }
    const ev = await p.evaluate(() => window.__ev);
    const lt = summera(await langa(t1));
    const maxVanta = Math.round(Math.max(0, ...ev.map((e) => e.v)));
    const maxBild = Math.round(Math.max(0, ...ev.map((e) => e.d)));
    const kort = await p.evaluate(() => document.querySelectorAll('.hsearch-mobile .sugg-kort').length);
    rader.push({ q, kort, maxVanta, maxBild, lt, klar: Math.round(Math.max(0, andrad - tSist)) });
    console.log(`  ${q.padEnd(18)} ${String(kort).padStart(2)} kort | tangenten väntar som längst ${String(maxVanta).padStart(4)} ms, till nästa bild som längst ${String(maxBild).padStart(4)} ms | långa uppgifter ${String(lt.antal).padStart(2)} st, längst ${String(lt.langst).padStart(4)} ms, blockerat ${String(lt.blockerat).padStart(4)} ms | listan klar ${String(Math.round(Math.max(0, andrad - tSist))).padStart(4)} ms efter sista tangenten`);
  }
  const s = (f) => rader.reduce((a, r) => a + f(r), 0);
  console.log(`SUMMA: blockerat ${s((r) => r.lt.blockerat)} ms, längsta uppgift ${Math.max(...rader.map((r) => r.lt.langst))} ms, längsta väntan för en tangent ${Math.max(...rader.map((r) => r.maxVanta))} ms, längst till nästa bild ${Math.max(...rader.map((r) => r.maxBild))} ms, listan klar i snitt ${Math.round(s((r) => r.klar) / rader.length)} ms efter sista tangenten`);
  await b.close();
})().catch((e) => { console.error(String(e).slice(0, 600)); process.exit(1); });
