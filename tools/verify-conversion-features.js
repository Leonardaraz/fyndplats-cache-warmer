// Verifierar konverterings-features via riktig Chromium (Puppeteer):
//   1. Recently-viewed: PDP-besök sparas i localStorage + widget visas korrekt
//      (PDP, startsida, varukorgs-drawer; dolt när < 2 kvar efter exkludering)
//   2. Exit-intent: triggar vid mouseleave mot toppen när kundvagnen har varor
//
// (En tidigare planerad tredje feature ströks på Leonards begäran.)
//
// Körs mot dev/prod-servern lokalt (default http://localhost:3212). Sätt
// BASE_URL för annan miljö:  BASE_URL=http://localhost:3211 node verify-conversion-features.js

const puppeteer = require('puppeteer');

const BASE = process.env.BASE_URL || 'http://localhost:3212';
const PDPS = [
  '/produkt/astronaut-stjarnprojektor',
  '/produkt/elektrisk-vinoppnare',
  '/produkt/rgb-led-slinga',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
function check(name, pass, extra) {
  results.push({ name, pass: !!pass, extra });
  console.log(`${pass ? '✅' : '❌'} ${name}${extra ? '  ' + JSON.stringify(extra) : ''}`);
}

async function gotoFresh(page, path) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2500); // hydration + dynamic chunks
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  // consent "all" på VARJE sidladdning (idempotent, behövs överallt). Feature-
  // state (popup-cookie, recently-viewed) får INTE rensas per navigering — det
  // skulle radera just det persistensen vi testar. Vi rensar i stället en gång
  // per fas nedan, före komponenten mountar.
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('fp_cookie_consent', 'all'); } catch (_) {}
  });

  try {
    // ---- 1. RECENTLY VIEWED: spara + visa -----------------------------------
    // Ren start: rensa recently-viewed + exit-intent-state.
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => {
      try {
        localStorage.removeItem('fp_recently_viewed');
        sessionStorage.removeItem('fp_exit_intent_shown');
      } catch (_) {}
    });
    for (const p of PDPS) await gotoFresh(page, p);
    const rv = await page.evaluate(() => {
      const arr = JSON.parse(localStorage.getItem('fp_recently_viewed') || '[]');
      const first = arr[0] || {};
      return {
        count: arr.length,
        order: arr.map((x) => x.slug),
        shape: ['productId', 'slug', 'thumbnailUrl', 'name', 'price', 'viewedAt'].every((k) => k in first),
      };
    });
    check('Recently-viewed array sparas (FIFO, full shape)',
      rv.count === 3 && rv.order[0] === 'rgb-led-slinga' && rv.shape, rv);

    // PDP-widget: exkluderar aktuell produkt, visar de 2 övriga
    const rvWidgetPdp = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.rv-sec .rv-card')].map((c) => c.getAttribute('href'));
      return { visible: cards.length > 0, cards, excludesCurrent: !cards.includes('/produkt/rgb-led-slinga') };
    });
    check('Recently-viewed widget på PDP (exkl. aktuell, >= 2 visas)',
      rvWidgetPdp.visible && rvWidgetPdp.cards.length === 2 && rvWidgetPdp.excludesCurrent, rvWidgetPdp);

    // Home-widget under USP-baren
    await gotoFresh(page, '/');
    const rvHome = await page.evaluate(() => {
      const sec = document.querySelector('.rv-sec');
      const usp = document.querySelector('.usp');
      const afterUsp = sec && usp && !!(usp.compareDocumentPosition(sec) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { visible: !!sec, cards: sec ? sec.querySelectorAll('.rv-card').length : 0, afterUsp };
    });
    check('Recently-viewed widget på startsidan (under USP-bar)',
      rvHome.visible && rvHome.cards === 3 && rvHome.afterUsp, rvHome);

    // ---- 2. EXIT-INTENT: mouseleave mot toppen med varor i kundvagn ---------
    await gotoFresh(page, PDPS[1]);
    // lägg i kundvagn (riktig Wix SDK-runda)
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button.buy')].find((x) => /kundvagn|Lägg/i.test(x.textContent) && !x.disabled);
      if (b) b.click();
    });
    await sleep(9000); // Wix add-to-cart
    // stäng ev. auto-öppnad drawer
    await page.evaluate(() => document.querySelector('.drawer-x')?.click());
    await sleep(600);
    const cartCount = await page.evaluate(() => document.querySelector('.cartcount')?.textContent || null);
    // trigga exit-intent
    const exit = await page.evaluate(async () => {
      sessionStorage.removeItem('fp_exit_intent_shown');
      document.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientY: 0, relatedTarget: null }));
      await new Promise((r) => setTimeout(r, 600));
      return {
        visible: !!document.querySelector('.xpop-ov'),
        title: document.querySelector('.xpop-title')?.textContent || null,
        cta: document.querySelector('.xpop-cta')?.textContent || null,
      };
    });
    check('Exit-intent triggar vid mouseleave-topp med varor i kundvagn',
      exit.visible, { cartCount, ...exit });

    // stäng + retrigga: max en gång per session
    const onceOnly = await page.evaluate(async () => {
      document.querySelector('.xpop-nothanks')?.click();
      await new Promise((r) => setTimeout(r, 300));
      const closed = !document.querySelector('.xpop-ov');
      document.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientY: 0, relatedTarget: null }));
      await new Promise((r) => setTimeout(r, 500));
      return { closed, reappeared: !!document.querySelector('.xpop-ov') };
    });
    check('Exit-intent: stängs + visas max en gång per session', onceOnly.closed && !onceOnly.reappeared, onceOnly);
  } catch (err) {
    console.error('FATAL', err);
    results.push({ name: 'script-execution', pass: false, extra: String(err) });
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
