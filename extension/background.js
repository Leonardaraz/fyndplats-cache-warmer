// Service worker: tar emot importförfrågan från popupen och postar den till
// import-API:t med den hemliga token. Begär host-permission för API-origin vid behov.

async function getConfig() {
  // apiBase synkas (ej känsligt); API-token läses bara från lokal lagring så den
  // aldrig hamnar i Googles moln-synk. Fallback till ev. gammal sync-token för
  // bakåtkompatibilitet tills options-sidan migrerat den (se options.js).
  const { apiBase, apiToken: syncToken } = await chrome.storage.sync.get(["apiBase", "apiToken"]);
  const { apiToken: localToken } = await chrome.storage.local.get(["apiToken"]);
  return { apiBase, apiToken: localToken || syncToken };
}

async function ensureHostPermission(apiBase) {
  const origin = new URL(apiBase).origin + "/*";
  const has = await chrome.permissions.contains({ origins: [origin] });
  if (has) return true;
  return chrome.permissions.request({ origins: [origin] });
}

async function importProduct(product, featureFlags) {
  const { apiBase, apiToken } = await getConfig();
  if (!apiBase || !apiToken) {
    return { ok: false, error: "Konfigurera API-URL och token i tilläggets inställningar." };
  }

  try {
    await ensureHostPermission(apiBase);
  } catch (_) {
    // request måste ibland ske från en användargest; fortsätt och låt fetch försöka.
  }

  // Skicka bara fält som API:t förväntar sig (utan _warnings).
  const payload = {
    supplierProductId: product.supplierProductId,
    sourceUrl: product.sourceUrl,
    rawTitle: product.rawTitle,
    rawDescription: product.rawDescription || "",
    // Full HTML-beskrivning från AE:s Product Description-sektion (renad).
    // Skickas bara när skrapan faktiskt fick HTML — annars använder backend
    // rawDescription. Bug 2026-06-02.
    ...(typeof product.descriptionHtml === "string" && product.descriptionHtml.length
      ? { descriptionHtml: product.descriptionHtml }
      : {}),
    imageUrls: product.imageUrls || [],
    // Aggregerade warehouse-koder för EU-filterringen (t.ex. ["ES","CN"]).
    // Tom = okänd — API:t hanterar det som UNKNOWN i Wix-metadatat.
    shipsFrom: Array.isArray(product.shipsFrom) ? product.shipsFrom : [],
    // Lagerstatus från skrapan. Bara explicit false = OOS; annars i lager.
    ...(typeof product.inStock === "boolean" ? { inStock: product.inStock } : {}),
    // Säljardata (Feature 6 — säljar-score). Skickas bara när skrapan kunde
    // identifiera säljaren (supplierId ifyllt), annars utelämnas fältet.
    ...(product.supplier && product.supplier.supplierId
      ? { supplier: product.supplier }
      : {}),
    variants: product.variants.map((v) => ({
      supplierVariantId: v.supplierVariantId,
      options: v.options || {},
      costUsd: Number(v.costUsd) || 0,
      stock: v.stock,
      shipFrom: v.shipFrom || "",
      included: Boolean(v.included),
    })),
    ...(product.optionColorCodes ? { optionColorCodes: product.optionColorCodes } : {}),
    // Per-färg bild-URL:er { [axel]: { [val]: "https://…alicdn.jpg" } }. Backaren
    // laddar upp dem och kopplar dem till rätt optionsval (Wix linkedMedia) så
    // huvudbilden byts när kunden väljer t.ex. "Blå". Skickas bara när skrapan
    // faktiskt hittade swatch-bilder (annars utelämnas fältet helt).
    ...(product.swatchImages && Object.keys(product.swatchImages).length
      ? { swatchImages: product.swatchImages }
      : {}),
    // Strukturerad produktinfo för de tabbade PDP-sektionerna (Tekniska
    // specifikationer / Vanliga frågor / Användning och skötsel). Skickas bara
    // när skrapan faktiskt hittade något så att tomma fält inte når servern.
    ...(product.specifications && Object.keys(product.specifications).length
      ? { specifications: product.specifications }
      : {}),
    ...(Array.isArray(product.features) && product.features.length
      ? { features: product.features }
      : {}),
    ...(Array.isArray(product.packageContents) && product.packageContents.length
      ? { packageContents: product.packageContents }
      : {}),
    // AI-funktionsväljare från popupen. Saknas = backend kör allt (default på).
    ...(featureFlags ? { featureFlags } : {}),
    // Per-import-prisoverride (Marginal-tier-dropdownen → Premium/Custom). Skickas
    // bara när Leonard valt något annat än "Standard" — annars utelämnas fältet och
    // backend använder default-tiern (bakåtkompatibelt).
    ...(product.pricingOverride && typeof product.pricingOverride.multiplier === "number"
      ? { pricingOverride: product.pricingOverride }
      : {}),
    // Manuella variantnamn { rått värde → Leonards namn } från popupens
    // "✏️ Variantnamn"-sektion (eller agent-lägets variantNames). Vinner över
    // hela översättningskedjan server-side; namnet key-låses i Wix vid skapandet.
    ...(product.variantNameOverrides && Object.keys(product.variantNameOverrides).length
      ? { variantNameOverrides: product.variantNameOverrides }
      : {}),
    // Manuella AXELNAMN ({ "Color": "Kulör" }) — samma lager 0 server-side.
    ...(product.axisNameOverrides && Object.keys(product.axisNameOverrides).length
      ? { axisNameOverrides: product.axisNameOverrides }
      : {}),
    // Medveten dubblett-kringgång (popupens "Importera ändå" / agentens force):
    // låter serverns hårda supplierProductId-spärr (PR #369) kliva åt sidan.
    // Skickas BARA vid uttryckligt val; server utan spärren ignorerar fältet.
    ...(product.allowDuplicate === true ? { allowDuplicate: true } : {}),
    // Skrapade AliExpress-recensioner (social proof). Sparas som `pending` i
    // FyndplatsImportedReviews och översätts för hand i /admin/reviews (ingen
    // översättningstjänst sedan 2026-08-19). Skickas bara när
    // skrapan faktiskt hittade recensioner (annars utelämnas fältet helt).
    ...(Array.isArray(product.reviewsToImport) && product.reviewsToImport.length
      ? { reviewsToImport: product.reviewsToImport }
      : {}),
  };

  // AbortController-timeout (2026-06-10): en stallad /api/import-uppkoppling som
  // accepteras men aldrig svarar hängde tidigare för evigt (ingen signal) och
  // frös bulk-kön. 90 s ceiling — en riktig rå-import tar sekunder; en hängning
  // är oändlig. Avbrottet → catch → { ok:false } → kön går vidare.
  const ctrl = new AbortController();
  const importTimer = setTimeout(() => ctrl.abort(), 90000);
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-fyndplats-token": apiToken },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || data.error || `HTTP ${res.status}` };
    return { ok: true, result: data.result };
  } catch (err) {
    return { ok: false, error: ctrl.signal.aborted ? "Tidsgräns mot /api/import (90 s)" : String(err) };
  } finally {
    clearTimeout(importTimer);
  }
}

// ======================================================================
//  Bulk-import: skrapa flera AliExpress-produkter via dolda flikar och
//  posta var och en till /api/import (samma path som en enskild import).
//
//  MV3-noter: vi kör produkterna SEKVENTIELLT (en dold flik i taget) för att
//  vara snälla mot AliExpress och slippa rate-limit/captcha. Status skickas
//  löpande till ursprungsfliken via BULK_PROGRESS och slutresultatet via
//  BULK_DONE — vi förlitar oss inte på sendResponse, som inte garanterat
//  överlever ett flerminuters jobb om service-workern pausas.
// ======================================================================

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function sendToTab(tabId, payload) {
  try {
    chrome.tabs.sendMessage(tabId, payload, () => void chrome.runtime.lastError);
  } catch (_) {}
}

// Väntar tills en flik når status "complete" (eller timeout).
function waitForTabComplete(tabId, timeoutMs = 30000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      chrome.tabs.onUpdated.removeListener(listener);
      clearTimeout(timer);
      resolve(ok);
    };
    const listener = (id, info) => {
      if (id === tabId && info.status === "complete") finish(true);
    };
    chrome.tabs.onUpdated.addListener(listener);
    // Om fliken redan är klar.
    chrome.tabs.get(tabId, (t) => {
      if (chrome.runtime.lastError) return;
      if (t && t.status === "complete") finish(true);
    });
    const timer = setTimeout(() => finish(false), timeoutMs);
  });
}

// Be content.js (på /item/-sidan) om produktdata. Försöker flera gånger eftersom
// AliExpress PC-sida renderas klient-sida och JSON-LD/DOM kan dröja.
// TIMEOUT (2026-06-10): om content-scriptet aldrig svarar (captcha/interstitial
// → ingen injektion, eller service-workern pausas mid-message) sätts varken
// callbacken eller lastError → Promisen löste ALDRIG → hela bulk-kön frös på
// "Skrapar…". Racet mot en timeout → resolve(null) → retry-loopen fortsätter och
// faller till sist på "Sidan svarade inte" i stället för att hänga för evigt.
// 12 s (audit N6): content.js:s EXTRACT_PRODUCT väntar själv på enrichDescription
// (bunden till 10 s) före sendResponse — timeouten måste överstiga den, annars
// kastas fungerande-men-långsamma försök bort i onödan.
//
// 18 s (audit 2026-08-18): EXTRACT_PRODUCT kör numera fpPrepareForScrape FÖRE
// extract — scrollsvepet som monterar lazy-laddade specar, bundet till 6 s.
// Värsta fallet är alltså 6 + 10 s och 12 s hade kastat bort varje sådan
// körning som "Sidan svarade inte". Efterföljande försök på samma flik är
// billiga (content.js kör bara ett snabbt svep när sidhöjden är oförändrad),
// så taket träffar i praktiken bara det första försöket.
function requestExtract(tabId, timeoutMs = 18000) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (v) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(v);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    try {
      chrome.tabs.sendMessage(tabId, { type: "EXTRACT_PRODUCT" }, (res) => {
        if (chrome.runtime.lastError) return finish(null);
        finish(res);
      });
    } catch (_) {
      finish(null);
    }
  });
}

/**
 * True när skrapan byggde varianterna ur DOM:en i stället för riktig SKU-data.
 *
 * `dom-N` sätts bara av DOM-fallbacken (content.js), och den fallbacken kan
 * inte läsa per-variant-priser: AliExpress renderar bara den VALDA variantens
 * pris, så alla varianter får sidans baspris. Datat är alltså känt fel för
 * alla utom en variant.
 *
 * `idx-N` räknas MEDVETET INTE. Den kommer från den inbäddade SKU-vägen, där
 * varje variant har sitt EGET pris — bara id:t saknades. Att byta ut den
 * listan mot DS hade kastat korrekt data.
 */
function harDomVarianter(product) {
  return (product && Array.isArray(product.variants) ? product.variants : []).some((v) =>
    /^dom-/.test(String((v && v.supplierVariantId) || "")),
  );
}

/**
 * Hämtar variantfacit från DS-API:t och ersätter skrapans lista.
 *
 * Bakgrund (Leonards rapport 2026-08-20): agent- och bulk-importer gav alla
 * varianter samma inköpspris. Räddningen fanns redan här, men var gatad på
 * `!product.extractionOk` — och extractionOk är `titel && bilder && pris`,
 * den bryr sig inte om varianterna. En DOM-fallback med titel, bild och ett
 * pris räknades alltså som "bra data" och fick passera med sex identiska
 * priser. Popupen räddades av att den kallar samma API vid inläsning
 * (refreshVariantPricesViaDsApi); agent- och bulk-vägen gjorde det aldrig.
 *
 * PRECISERING (audit 2026-08-20): agent-/bulk-vägen var ändå inte försvarslös.
 * Servern har kört `reconcileVariantsWithDs` sedan #372, och den utlöses på
 * VILKET syntetiskt id som helst. De sex identiska priserna betyder alltså inte
 * att ingen avstämning gjordes — de betyder att den AVBRÖT (för osäker
 * värdematchning) eller att DS-uppslaget FÖLL. Den här räddningen ersätter inte
 * serverns; den ger den bättre indata (riktiga skuId → id-matchning i stället
 * för värdesignatur, som är just det som avbryter). Grundorsaken till att
 * signaturmatchningen sprack är åtgärdad separat: SHIP_AXIS_RE hade tre kopior
 * som drivit isär, så frakt-axeln ströks på ena sidan men inte på den andra.
 *
 * Verifierat på sidan 2026-08-20: window.runParams är tomt, skuPriceList finns
 * inte i HTML:en — det finns ingenting att vänta in. DS är enda källan.
 *
 * Best-effort: misslyckas uppslaget behålls skrapans data, och serverns
 * prisspärr (lib/import/price-trust.ts) hindrar ändå publicering.
 */
async function dsRescueVariants(product) {
  const id = String((product && product.supplierProductId) || "");
  if (!/^\d{6,}$/.test(id)) return { product, bytt: false };

  let ds = null;
  try {
    const r = await apiCall(`/api/aliexpress/product?id=${encodeURIComponent(id)}`, { method: "GET" });
    ds = r && r.ok && r.data;
  } catch {
    return { product, bytt: false };
  }
  const dsVariants = (ds && Array.isArray(ds.variants) ? ds.variants : []).filter(
    (v) => Number(v.costUsd) > 0,
  );
  if (!dsVariants.length) return { product, bytt: false };

  const ut = { ...product, variants: dsVariants };
  if (!ut.rawTitle && ds.rawTitle) ut.rawTitle = ds.rawTitle;
  if (!ut.rawDescription && ds.rawDescription) ut.rawDescription = ds.rawDescription;
  if ((!ut.imageUrls || !ut.imageUrls.length) && Array.isArray(ds.imageUrls)) {
    ut.imageUrls = ds.imageUrls;
  }
  if (Array.isArray(ds.shipsFrom) && ds.shipsFrom.length) {
    ut.shipsFrom = [...new Set([...(ut.shipsFrom || []), ...ds.shipsFrom])].sort();
  }
  const stocks = dsVariants.map((v) => v.stock).filter((s) => typeof s === "number");
  if (stocks.length) ut.inStock = stocks.some((s) => s > 0);

  // VARIANTBILDKARTAN MÅSTE TÖMMAS I SAMMA ANDETAG — men inte byggas om här.
  //
  // swatchImages är nycklad på SKRAPANS optionsvärden. Byter vi variantlistan
  // mot DS:s värden matchar den gamla kartan ingenting, och den är ändå inte
  // tom — så serverns backfill hoppar över den (needsSwatchBackfill kräver HELT
  // tom karta, lib/import/variant-images.ts). Resultatet blir noll kopplade
  // variantbilder OCH ~25 s Wix-försök att koppla värden som inte finns.
  //
  // Att bygga om kartan HÄR vore fel: DS:s `imageUrl` är per SKU, inte per
  // värde. En Color × Size-produkt skulle få varje storlek kopplad till ett
  // godtyckligt färgfoto. Servern gör redan jobbet rätt i
  // buildSwatchImagesFromDs (lib/import/from-url.ts) med fyra grindar som
  // saknas här: en bild per värde, minst två DISTINKTA bilder, färgaxeln
  // föredragen vid flera kandidater, och cleanAliCdnUrl på URL:en.
  //
  // Tom karta = backfillen kickar in = rätt bilder. Låt servern äga det.
  ut.swatchImages = {};
  // Färgprickarna är nycklade på de gamla värdena och används inte i butiken —
  // lämna dem inte kvar som skräp som ändå aldrig matchar.
  ut.optionColorCodes = {};
  // DOM-varningen om baspris är åtgärdad.
  ut._warnings = (ut._warnings || []).filter((w) => !/baspriset/.test(w));
  ut.extractionOk = Boolean(ut.rawTitle && (ut.imageUrls || []).length);
  return { product: ut, bytt: true };
}

async function scrapeAndImport(item, featureFlags, pricingOverride) {
  let tab;
  try {
    tab = await chrome.tabs.create({ url: item.url, active: false });
  } catch (err) {
    return { id: item.id, ok: false, error: "Kunde inte öppna flik: " + String(err) };
  }
  const tabId = tab.id;
  try {
    // Total skrap-budget (2026-06-10): en död/captcha-spärrad flik ska hoppas
    // över på ~45 s, inte ~2 min. Både fliklast (≤25 s) och extract-loopen bryts
    // mot deadlinen så en seg sida aldrig stjäl hela kötiden.
    //
    // 55 s (audit 2026-08-18): det FÖRSTA extract-försöket bär nu utfällnings-
    // svepet (upp till 6 s). Med 45 s rymdes bara ett försök efter en långsam
    // fliklast, och en sida som behövde ett andra försök föll på "Sidan svarade
    // inte" trots att den var fullt läsbar. Taket för en död flik höjs alltså
    // med 10 s för att inte tappa fungerande sidor.
    const SCRAPE_DEADLINE_MS = 55000;
    const scrapeStart = Date.now();
    const budgetLeft = () => SCRAPE_DEADLINE_MS - (Date.now() - scrapeStart);
    await waitForTabComplete(tabId, Math.min(25000, Math.max(1, budgetLeft())));
    // Ge React-sidan tid att rendera JSON-LD + DOM, sedan skrapa med upprepning.
    let product = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      if (budgetLeft() <= 0) break; // skrap-budget slut (före paus) → ge upp
      await delay(attempt === 0 ? 2000 : 1800);
      if (budgetLeft() <= 0) break; // ...och EFTER pausen, så vi aldrig startar en
      const res = await requestExtract(tabId); //  dyr 12 s-extract utanför budgeten
      if (res && res.ok && res.product) {
        product = res.product;
        if (product.extractionOk) break; // bra data — sluta försöka
      }
    }
    if (!product) {
      return { id: item.id, ok: false, error: "Sidan svarade inte (content-scriptet kunde inte läsas)." };
    }
    if (!product.extractionOk) {
      const q = product.quality || {};
      const miss = [];
      if (!q.hasTitle) miss.push("titel");
      if (!q.hasImages) miss.push("bild");
      if (!q.hasPrice) miss.push("pris");
      return { id: item.id, ok: false, error: `Otillräcklig produktdata (saknar: ${miss.join(", ") || "data"}).` };
    }
    // Bulk-prissättning (2026-06-10): stämpla Leonards förvalda Marginal-tier på
    // den färskt skrapade produkten så importProduct skickar pricingOverride —
    // tidigare läste bulk-vägen aldrig tiern → backend föll på default-2.5× trots
    // att popupen sparat t.ex. 1.2 (egen "custom"-tier).
    if (pricingOverride && typeof pricingOverride.multiplier === "number") {
      product.pricingOverride = pricingOverride;
    }
    // Samma DS-räddning som agent-vägen: bulk-fliken har ingen popup som
    // hämtar per-SKU-priser, så utan den här raden importeras DOM-byggda
    // varianter med sidans baspris på allihop.
    if (harDomVarianter(product)) {
      const r = await dsRescueVariants(product);
      product = r.product;
    }
    const imp = await importProduct(product, featureFlags);
    if (!imp.ok) return { id: item.id, ok: false, error: imp.error };
    return {
      id: item.id,
      ok: true,
      wixProductId: imp.result && imp.result.wixProductId,
      stockQuantity: imp.result && imp.result.stockQuantity,
    };
  } catch (err) {
    return { id: item.id, ok: false, error: String(err) };
  } finally {
    try {
      await chrome.tabs.remove(tabId);
    } catch (_) {}
  }
}

// Läser Leonards förvalda Marginal-tier (samma som popupen sparar i
// chrome.storage.sync) och bygger pricingOverride för HELA batchen. Speglar
// popupens buildPricingOverride: premium = fast 2.5×, custom = sparat objekt,
// standard = null (inget fält → backend default-tier). 2026-06-10.
const BULK_PREMIUM_MULTIPLIER = 2.5;
async function resolveBulkPricingOverride() {
  try {
    const { pricingTier, customTier } = await chrome.storage.sync.get(["pricingTier", "customTier"]);
    if (pricingTier === "premium") return { multiplier: BULK_PREMIUM_MULTIPLIER };
    if (pricingTier === "custom" && customTier && typeof customTier.multiplier === "number") {
      return customTier;
    }
  } catch (_) {}
  return null; // standard → backend använder default-tiern
}

// Rapporterar ett bulk-skrap-fel till backenden (audit-loggen) — fire-and-forget.
// Bakgrund (2026-06-11): 12/13 produkter föll i skrapfasen utan att något nådde
// servern → diagnos krävde Leonards skärmdump av modalen. Nu syns varje ✗ med
// exakt feltext i /admin-auditloggen i stället.
function reportImportFailure(item, error, pass) {
  try {
    void apiCall("/api/import-failure", {
      method: "POST",
      body: JSON.stringify({
        url: (item.url || "").slice(0, 500), // zod-cap 500 server-side (audit N3)
        title: (item.title || "").slice(0, 120),
        error: String(error || "okänt fel").slice(0, 300),
        pass,
      }),
    }).catch(() => {});
  } catch (_) {}
}

async function runBulkImport(items, featureFlags, originTabId, explicitPricingOverride) {
  // Bulk-barens marginalfält (2026-08-06) VINNER när det är ifyllt — det är
  // ett uttryckligt per-omgång-val. Tomt fält → sparade Marginal-tiern
  // (popup-dropdownen via chrome.storage.sync) precis som förut.
  const pricingOverride =
    explicitPricingOverride && typeof explicitPricingOverride.multiplier === "number"
      ? explicitPricingOverride
      : await resolveBulkPricingOverride();
  // Hård per-produkt-watchdog: backstop för ett ev. framtida obundet await som
  // smiter förbi de inre timeouterna. 165 s (2026-06-10, audit): inre värsta-fall
  // för en FUNGERANDE import = skrap tills lyckad extract (≤~45 s) + 90 s import-
  // fetch ≈ 135 s (en MISSLYCKAD skrap, ≤~57 s, gör ingen import). 165 s ger
  // ≥25 s marginal → watchdogen kan ALDRIG döda en fungerande import (annars
  // falsk "✗ Misslyckades" + dubblett vid retry). Skippad produkt visas så ändå.
  const PER_PRODUCT_MS = 165000;
  // Paus mellan produkter: AliExpress bot-spärr triggas av många snabba
  // sid-laddningar i följd. Pass 2 kör extra långsamt (spärren är ofta färsk).
  const PACING_MS = 1500;
  const RETRY_PACING_MS = 8000;

  // MV3-SW-LIVSHÅLLANDE lång paus (audit B1): en ren delay() >30 s får service-
  // workern DÖDAD mitt i batchen — Chrome idle-terminerar efter 30 s utan
  // events/extension-API-anrop, och pending timers räknas INTE som aktivitet
  // (syns inte med DevTools öppet, som stänger av termineringen). Skiva därför
  // pausen i 20 s-bitar med ett API-anrop per bit (BULK_NOTICE via
  // tabs.sendMessage nollställer 30 s-idle-klockan) — nedräkningen är dessutom
  // bättre UX än en stum paus. Tillförlitligt på Chrome ≥110 (5-min-hårdtaket
  // borttaget där); en patologisk ~80-min all-fail-batch bör verifieras på
  // riktig enhet en gång. Värsta fall om det ändå dör: synlig död i modalen
  // (nedräkningen fryser) i stället för tyst frysning som förut.
  const keepalivePause = async (totalMs, label) => {
    const SLICE_MS = 20000;
    for (let left = totalMs; left > 0; left -= SLICE_MS) {
      sendToTab(originTabId, {
        type: "BULK_NOTICE",
        text: `${label} — fortsätter om ${Math.ceil(left / 1000)} s…`,
      });
      await delay(Math.min(SLICE_MS, left));
    }
    sendToTab(originTabId, { type: "BULK_NOTICE", text: "" });
  };

  const runOne = async (item, index, pass) => {
    sendToTab(originTabId, { type: "BULK_PROGRESS", id: item.id, index, state: "working" });
    const r = await Promise.race([
      scrapeAndImport(item, featureFlags, pricingOverride),
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ id: item.id, ok: false, error: "Tidsgräns – hoppade över produkten" }),
          PER_PRODUCT_MS,
        ),
      ),
    ]);
    sendToTab(originTabId, {
      type: "BULK_PROGRESS",
      id: item.id,
      index,
      state: r.ok ? "done" : "fail",
      wixProductId: r.wixProductId,
      error: r.error,
    });
    if (!r.ok) reportImportFailure(item, r.error, pass);
    return r;
  };

  // --- PASS 1 — med adaptiv backoff (2026-06-11: Leonards 13-batch gav 1 lyckad,
  // 12 raka skrap-fel = AE började servera spärr-/captcha-sidor till de dolda
  // flikarna; att plöja vidare i full takt förvärrar spärren). Efter 2 raka fel
  // pausas kön (90 s, dubblas upp till 6 min) och modalen visar varför. En
  // lyckad produkt nollställer trappan.
  const byId = new Map();
  let consecutiveFails = 0;
  let backoffMs = 90000;
  for (let i = 0; i < items.length; i++) {
    const r = await runOne(items[i], i, "pass1");
    byId.set(items[i].id, r);
    if (r.ok) {
      consecutiveFails = 0;
      backoffMs = 90000;
    } else {
      consecutiveFails++;
    }
    if (i < items.length - 1) {
      if (consecutiveFails >= 2) {
        await keepalivePause(backoffMs, `AliExpress bromsar (${consecutiveFails} fel i rad), pausar`);
        backoffMs = Math.min(backoffMs * 2, 360000);
      } else {
        await delay(PACING_MS);
      }
    }
  }

  // --- PASS 2 — automatisk andra chans för misslyckade. AE-spärrar är ofta
  // tillfälliga; några minuters vila + långsam takt räddar i regel resten av
  // batchen utan att Leonard behöver klicka "Försök igen" 12 gånger.
  //
  // SÄKERHETSFILTER (audit B2): "Tidsgräns…"-fel exkluderas — där kan importen
  // redan ha NÅTT servern (klient-abort dödar inte Vercel-anropet, och
  // /api/import saknar dubblettspärr) → automatisk omkörning skulle mynta en
  // dubblettprodukt i Wix. Rena skrap-fel ("Sidan svarade inte"/"Otillräcklig
  // produktdata"/"Kunde inte öppna flik") har aldrig lämnat webbläsaren och är
  // alltid säkra att köra om — de var 12/12 i incidenten 2026-06-11.
  // Enstaka-produkt-körningar (manuella "Försök igen") får inget pass 2 — de ÄR
  // redan ett omförsök (audit S1).
  const failed = items.filter((it) => {
    const r = byId.get(it.id);
    return r && !r.ok && !/^Tidsgräns/.test(r.error || "");
  });
  if (failed.length > 0 && items.length > 1) {
    await keepalivePause(120000, `Försök 2 för ${failed.length} misslyckade (AliExpress-spärrar är ofta tillfälliga)`);
    for (let j = 0; j < failed.length; j++) {
      const item = failed[j];
      const r2 = await runOne(item, items.indexOf(item), "pass2");
      byId.set(item.id, r2); // även pass 2-fel sparas → färskaste feltexten visas
      if (j < failed.length - 1) await delay(RETRY_PACING_MS);
    }
  }

  const results = items.map((it) => byId.get(it.id));
  sendToTab(originTabId, { type: "BULK_DONE", results });
  return results;
}

// Generisk autentiserad request mot API:t (för order-läget).
async function apiCall(path, options) {
  const { apiBase, apiToken } = await getConfig();
  if (!apiBase || !apiToken) {
    return { ok: false, error: "Konfigurera API-URL och token i inställningarna." };
  }
  try {
    await ensureHostPermission(apiBase);
  } catch (_) {}
  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", "x-fyndplats-token": apiToken, ...(options?.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || data.error || `HTTP ${res.status}` };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Samplar dominerande färg från en bild-URL via OffscreenCanvas (i service
// workern, så vi slipper canvas-tainting/CORS). Returnerar hex eller null.
async function sampleColor(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    // Skala ner till en liten yta och medelvärdesbilda pixlarna.
    const size = 16;
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue; // hoppa över transparenta pixlar
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
    if (n === 0) return null;
    const hex = (x) => Math.round(x / n).toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch (_) {
    return null;
  }
}

// Samplar färger för alla swatch-bilder och bygger { [option]: { [choice]: hex } }.
async function sampleSwatchColors(swatchImages) {
  const out = {};
  for (const [optionName, choices] of Object.entries(swatchImages || {})) {
    const codes = {};
    for (const [choiceName, url] of Object.entries(choices)) {
      const hex = await sampleColor(url);
      if (hex) codes[choiceName] = hex;
    }
    if (Object.keys(codes).length) out[optionName] = codes;
  }
  return { ok: true, optionColorCodes: out };
}

// Hämtar AE:s separata Product Description-HTML ("view more") cross-origin.
// AE laddar den rika beskrivningen lazy från en egen alicdn-URL. Content
// scripts blockeras av CORS i MV3, men service-workern har host_permissions
// för *.alicdn.com / *.aliexpress.com och kringgår det (samma mönster som
// sampleColor). Returnerar rå HTML — content.js renar den. Fail-open med
// timeout så en seg/blockerad fetch aldrig hänger importen.
async function fetchDescriptionHtml(url) {
  try {
    if (!url) return { ok: false };
    // F1: normalisera protokoll-relativ URL (//host/…) → https.
    let u = String(url).trim();
    if (u.startsWith("//")) u = "https:" + u;
    if (!/^https?:\/\//i.test(u)) return { ok: false };
    // F2 (säkerhet): URL:en kommer från sidan — hämta BARA från AliExpress/
    // alicdn (matchar host_permissions). Vägra godtyckliga värdar.
    let host = "";
    try {
      host = new URL(u).hostname;
    } catch (_) {
      return { ok: false };
    }
    if (!/(^|\.)(alicdn\.com|aliexpress\.com|aliexpress\.us)$/i.test(host)) {
      return { ok: false };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(u, { credentials: "omit", signal: controller.signal });
      if (!res.ok) return { ok: false };
      const html = await res.text();
      return { ok: true, html };
    } finally {
      clearTimeout(timer);
    }
  } catch (_) {
    return { ok: false };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return;
  switch (msg.type) {
    case "IMPORT_PRODUCT":
      importProduct(msg.product, msg.featureFlags).then(sendResponse);
      return true;
    case "AGENT_IMPORT":
      // Sidstyrd import (agent-läget, 2026-08-06). Samma importväg som popupen,
      // plus DS-API-räddningen när skrapan är ofullständig (nya PC-sidan) —
      // en agent kan inte klicka i popupen, så räddningen måste ske här.
      (async () => {
        try {
          let product = msg.product || {};
          // TVÅ SKÄL att hämta facit från DS, inte ett:
          //   1. skrapningen misslyckades (som förut), eller
          //   2. varianterna är DOM-byggda — då är priserna kända fel även om
          //      titel/bild/pris finns, och extractionOk säger inget om det.
          // Skäl 2 saknades, och det är hela buggen: agent-importer fick sex
          // varianter med sidans enda synliga pris.
          if (!product.extractionOk || harDomVarianter(product)) {
            const r = await dsRescueVariants(product);
            product = r.product;
          }
          if (!product.extractionOk) {
            sendResponse({ ok: false, error: "Produktdatan kunde inte läsas (varken skrap eller API-uppslag) — importen avbruten." });
            return;
          }
          // DUBBLETTGRIND (audit 2026-08-06): popupen visar en bekräftelse-modal
          // vid möjliga dubbletter — en agent har ingen modal, så grinden måste
          // sitta här. Stoppar med matchlistan; agenten kan medvetet gå förbi
          // med force: true. Fail-open: svarar dubblettkollen inte (nät/API)
          // blockeras inte importen — hellre en extra granskningsrad än en
          // agent som fastnar på en trasig sidokontroll.
          if (msg.force !== true) {
            try {
              const q = new URLSearchParams();
              if (product.rawTitle) q.set("title", product.rawTitle);
              if (Array.isArray(product.imageUrls) && product.imageUrls[0]) q.set("imageUrl", product.imageUrls[0]);
              if (product.supplierProductId) q.set("aeId", String(product.supplierProductId));
              const dup = await apiCall(`/api/check-duplicate?${q.toString()}`, { method: "GET" });
              const matches = dup && dup.ok && dup.data && Array.isArray(dup.data.matches) ? dup.data.matches : [];
              if (matches.length > 0) {
                const names = matches.slice(0, 3).map((m) => m.productName).filter(Boolean).join(", ");
                sendResponse({
                  ok: false,
                  error: `Möjlig dubblett i butiken: ${names || matches.length + " träffar"} — importen stoppad. Skicka force: true i FP_IMPORT om du vill importera ändå.`,
                  duplicates: matches,
                });
                return;
              }
            } catch (_) { /* rådgivande grind — fortsätt vid kontrollfel */ }
          }
          // force = agentens medvetna dubblett-kringgång: hoppar över grinden
          // ovan OCH flaggar payloaden så serverns hårda spärr (PR #369) också
          // släpper igenom. Utan force skickas ingen flagga.
          if (msg.force === true) product.allowDuplicate = true;
          sendResponse(await importProduct(product, msg.featureFlags));
        } catch (err) {
          sendResponse({ ok: false, error: String(err) });
        }
      })();
      return true;
    case "FETCH_DESCRIPTION":
      fetchDescriptionHtml(msg.url).then(sendResponse);
      return true;
    case "BULK_IMPORT": {
      // Acka direkt att kön startar; kör sedan i bakgrunden och rapportera via
      // flik-meddelanden (BULK_PROGRESS/BULK_DONE) till ursprungsfliken.
      const originTabId = _sender && _sender.tab && _sender.tab.id;
      const items = Array.isArray(msg.items) ? msg.items.filter((i) => i && /\/item\/\d+\.html/.test(i.url || "")) : [];
      if (!originTabId) {
        sendResponse({ ok: false, error: "Saknar ursprungsflik." });
        return true;
      }
      if (!items.length) {
        sendResponse({ ok: false, error: "Inga giltiga AliExpress-produkter att importera." });
        return true;
      }
      sendResponse({ ok: true, started: items.length });
      runBulkImport(items, msg.featureFlags, originTabId, msg.pricingOverride);
      return true;
    }
    case "SAMPLE_COLORS":
      sampleSwatchColors(msg.swatchImages).then(sendResponse);
      return true;
    case "SUPPLIER_STATUS":
      // Slår upp säljarens score/status före import (Feature 6).
      apiCall(`/api/supplier-status?supplierId=${encodeURIComponent(msg.supplierId)}`, {
        method: "GET",
      }).then(sendResponse);
      return true;
    case "DS_PRODUCT":
      // Räddningsväg (2026-08-04): nya AliExpress-PC-sidan saknar ofta inbäddad
      // SKU-JSON och byter pris-markup mellan A/B-varianter → skrapan får inget
      // pris. Backendens DS-API-uppslag är auktoritativt (per-SKU-pris i USD).
      apiCall(`/api/aliexpress/product?id=${encodeURIComponent(msg.productId)}`, {
        method: "GET",
      }).then(sendResponse);
      return true;
    case "CHECK_DUPLICATE": {
      // Dubblett-detektor (Feature 1) — kollar titel/bild/AE-id mot butiken.
      const q = new URLSearchParams();
      if (msg.title) q.set("title", msg.title);
      if (msg.imageUrl) q.set("imageUrl", msg.imageUrl);
      if (msg.aeId) q.set("aeId", msg.aeId);
      apiCall(`/api/check-duplicate?${q.toString()}`, { method: "GET" }).then(sendResponse);
      return true;
    }
    case "PRICING_CONFIG":
      // Aktuella prissättningsregler (default-multiplikator, tiers, moms) → visas
      // som hint i popupen så Leonard ser default-tiern innan han väljer override.
      apiCall("/api/pricing-config", { method: "GET" }).then(sendResponse);
      return true;
    case "FETCH_TASKS":
      apiCall("/api/tasks?status=pending", { method: "GET" }).then(sendResponse);
      return true;
    case "MARK_ORDERED":
      apiCall("/api/fulfillment/mark-ordered", {
        method: "POST",
        body: JSON.stringify({ taskId: msg.taskId }),
      }).then(sendResponse);
      return true;
    case "DISCOVER_EU":
      // "Alla EU" — söker via serverns AliExpress-API (ds.text.search) och
      // filtrerar EU-lager över ALLA länder i en lista. Kringgår AE-söksidans
      // begränsning (?shpf_co tar bara ett land i taget).
      apiCall("/api/aliexpress/discover", {
        method: "POST",
        body: JSON.stringify({
          query: msg.query,
          sortBy: msg.sortBy || "orders,desc",
          page: msg.page || 1,
          pageSize: 30,
          euOnly: true,
        }),
      }).then(sendResponse);
      return true;
    default:
      return;
  }
});
