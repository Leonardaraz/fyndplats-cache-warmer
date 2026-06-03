// Content-script: extraherar produktdata från en AliExpress item-sida.
//
// VIKTIGT (sköraste delen av hela systemet): AliExpress ändrar sin sidstruktur
// med jämna mellanrum. Strategin är därför LAGERVIS — vi försöker flera källor
// och backfillar saknade fält:
//   1. Inbäddad JSON (window.runParams.data + dess moduler) — bäst, ger pris/SKU
//   2. Andra window-globaler / inline-script (__INIT_DATA__, _dida_config_, ...)
//   3. JSON-LD (<script type="application/ld+json"> Product) — namn/bild/pris
//   4. <title>/OG-meta + renderad DOM (h1, pris-span, galleri-bilder, SKU-rutor)
//
// 2026-05-31 (uppdaterad): AliExpress nya PC-sida (pc-detail) renderas helt
// klient-sida via React. window.runParams är numera `null`, ingen produkt-JSON
// ligger inbäddad, och datat hämtas via XHR rakt in i React-state (ej åtkomligt).
// Därför är JSON-LD (lager 3) + DOM (lager 4) i praktiken huvudkällan:
//   - Pris: JSON-LD <Product> offers (lowPrice/price + priceCurrency, ISO) —
//     renaste källan; annars <title> ("196.11SEK 36% Off | …") och slutligen
//     pris-span [class*="price--currentPriceText"] (lokalformaterad "196,11 kr").
//   - Bild: galleri-img på *aliexpress-media.com* (NYTT värdnamn — gamla
//     alicdn-only-filtret slängde alla bilder → "saknar bild"-buggen).
//   - Variant: SKU-rutor i [class*="sku-item--property"] (Color/Size/Ships From);
//     varje värde-ruta bär attributet data-sku-col (juni 2026-layouten).
//
// VALUTA: costUsd MÅSTE vara i USD eftersom servern (lib/config.ts ->
// pricingConfigFromEnv + lib/import/pricing.ts) räknar costSek = costUsd *
// usdToSek (default 10.5) och därefter markup ×2.5 + moms. Sidan visar dock
// Leonards lokalvaluta (SEK). Vi konverterar därför till USD via UNITS_PER_USD
// nedan. SEK-kursen är medvetet satt = serverns default usdToSek (10.5, env
// USD_TO_SEK) så att det går "tur och retur" rent. Håll den i synk om kursen ändras.
//
// Endast ett giltigt pris (costUsd>0) gör extractionOk=true. Saknas pris/bild
// vägrar popupen importera (bug 2026-05-31: tom skrapning skapade 0,9 kr-
// spökprodukter med butikscopy).

// EU-warehouse-koder — EN sanningskälla i extension/eu-countries.js (laddas före
// detta skript i manifest.json content_scripts). Feeds KNOWN_SHIP_CODES nedan.
const EU_WAREHOUSE_CODES = globalThis.FP_EU.EU_CODES;

const SHIP_FROM_NAME_MAP = {
  // Engelska
  SPAIN: "ES", GERMANY: "DE", "CZECH REPUBLIC": "CZ", CZECHIA: "CZ",
  POLAND: "PL", FRANCE: "FR", ITALY: "IT", NETHERLANDS: "NL",
  BELGIUM: "BE", "UNITED KINGDOM": "GB", UK: "GB", CHINA: "CN",
  "UNITED STATES": "US", USA: "US", RUSSIA: "RU", TURKEY: "TR",
  MADRID: "ES", BERLIN: "DE", PARIS: "FR", AMSTERDAM: "NL",
  // Svenska (Leonards butik körs i svensk AE-locale → "Levereras från Polen")
  SPANIEN: "ES", TYSKLAND: "DE", TJECKIEN: "CZ", POLEN: "PL",
  FRANKRIKE: "FR", ITALIEN: "IT", NEDERLÄNDERNA: "NL", HOLLAND: "NL",
  BELGIEN: "BE", STORBRITANNIEN: "GB", KINA: "CN", RYSSLAND: "RU",
  TURKIET: "TR", "FÖRENTA STATERNA": "US",
};

// Valutakurser: enheter per 1 USD. SEK = serverns default usdToSek (USD_TO_SEK i
// lib/config.ts) — håll i synk. Övriga är ungefärliga marknadskurser (jan 2026);
// markupen (×2.5) ger gott om buffert. Okänd valuta → pris förkastas (hellre
// vägra än felprisa).
const UNITS_PER_USD = {
  USD: 1, SEK: 10.5, EUR: 0.92, GBP: 0.79, NOK: 10.8, DKK: 6.9,
  PLN: 4.0, CZK: 23, RUB: 95, TRY: 34, AUD: 1.52, CAD: 1.38,
  CNY: 7.2, CHF: 0.88, JPY: 150, BRL: 5.8, MXN: 18, INR: 85,
};

// Alla kända AliExpress bild-CDN-värdar (alicdn = gammalt, aliexpress-media/
// ae-pic = nytt). Bilder utanför dessa filtreras bort (logotyper m.m.).
const IMAGE_HOST_RE = /(alicdn\.com|aliexpress-media\.com|ae-pic)/i;

const SHIP_PROP_RE = /ship|skicka|fra[kc]t|country|land|warehouse|lager/i;

function normalizeShipFrom(raw) {
  if (!raw) return "";
  const s = String(raw).trim().toUpperCase();
  if (!s) return "";
  if (/^[A-Z]{2}$/.test(s)) return s;
  if (SHIP_FROM_NAME_MAP[s]) return SHIP_FROM_NAME_MAP[s];
  for (const [name, code] of Object.entries(SHIP_FROM_NAME_MAP)) {
    if (s.includes(name)) return code;
  }
  return s;
}

// Konverterar ett belopp i given valutakod till USD. Returnerar 0 (= ogiltigt)
// om valutan är okänd eller beloppet inte är positivt.
function toUsd(val, code) {
  const units = UNITS_PER_USD[String(code || "").toUpperCase()];
  if (!units || !(val > 0)) return 0;
  return val / units;
}

// Tolkar ett tal ur en sträng som kan vara lokalformaterad: "196,11 kr",
// "1.299,00", "1,299.00", "196.11". Sista skiljetecknet antas vara decimal.
function parseNumeric(str) {
  if (str == null) return NaN;
  let s = String(str).replace(/[^\d.,]/g, "");
  if (!s) return NaN;
  const hasComma = s.indexOf(",") >= 0;
  const hasDot = s.indexOf(".") >= 0;
  if (hasComma && hasDot) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hasComma) {
    // Endast komma: decimal om 1–2 siffror efter, annars tusentalsavgränsare.
    s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  }
  return parseFloat(s);
}

// Gissar valutakod ur en prissträng. ISO-kod (SEK/USD/EUR) prioriteras; annars
// symbol. "kr" är tvetydigt (SEK/NOK/DKK) men Leonards butik kör SEK.
function detectCurrency(txt) {
  const s = String(txt || "");
  const iso = s.match(/\b([A-Z]{3})\b/);
  if (iso && UNITS_PER_USD[iso[1]]) return iso[1];
  if (/US\s*\$|\bUSD\b/.test(s)) return "USD";
  if (/€|\bEUR\b/.test(s)) return "EUR";
  if (/£|\bGBP\b/.test(s)) return "GBP";
  if (/zł|\bPLN\b/i.test(s)) return "PLN";
  if (/₽|\bRUB\b/.test(s)) return "RUB";
  if (/\bkr\b/i.test(s)) return "SEK";
  if (/\$/.test(s)) return "USD";
  return "";
}

// Normaliserar en AliExpress-bild-URL: lägger på protokoll och strippar ALLA
// kända storleks-/format-suffix så vi alltid får full-res-källan.
//
// AE serverar samma asset i många storlekar via olika URL-patterns:
//   1. Suffix EFTER extension: "….png_220x220q75.jpg_.avif" — det vanligaste
//      thumb-mönstret. Plockas bort via regel #1.
//   2. Suffix FÖRE extension: "….abc_220x220.jpg" / "….abc_50x50.webp" —
//      thumbnail-/swatch-storlek inbäddad i filnamnet. Bug 2026-06-02:
//      tidigare strippades inte detta → 220×220-thumbs och 48×48-ikoner föll
//      igenom till Wix-galleriet. Plockas bort via regel #2.
//   3. Dubbla extensioner: "….jpg.webp" — formatkonvertering. Regel #3.
// Full-res är samma URL utan suffix (AE faller tillbaka till originalet).
function cleanImageUrl(u) {
  if (!u) return "";
  let s = String(u).trim();
  if (s.startsWith("//")) s = "https:" + s;
  // 1. Suffix EFTER extension: ".jpg_220x220q75.jpg_.avif" / ".png_640x640.png" → ".jpg" / ".png".
  s = s.replace(/(\.(?:jpg|jpeg|png|webp|gif|avif|bmp))_[^/]*$/i, "$1");
  // 2. Suffix FÖRE extension: "abc_220x220.jpg" / "abc_50x50q75.webp" → "abc.jpg" / "abc.webp".
  //    Matchar 2–4-siffriga storlekar (NxN, ev. följt av qN) precis före filändelsen.
  s = s.replace(/_\d{2,4}x\d{2,4}(?:q\d{1,3})?(?=\.(?:jpg|jpeg|png|webp|gif|avif|bmp)$)/i, "");
  // 3. Dubbel-extension efter dedup ("….jpg.webp" / "….png.webp") — behåll bara
  //    den första extensionen (AE serverar originalet).
  s = s.replace(/(\.(?:jpg|jpeg|png|webp|gif|avif|bmp))\.(?:jpg|jpeg|png|webp|gif|avif|bmp)$/i, "$1");
  return s;
}

// True om URL:en uttryckligen pekar på en ikon-/microthumb-storlek
// (≤120×120) — t.ex. en 48×48-favicon eller en swatch-färgruta som råkade
// hamna i galleriet. Används som extra filter EFTER cleanImageUrl (eftersom
// cleanImageUrl strippar storleks-suffix; det här fångar URL:er där storleken
// låg i filnamnet på ett sätt vi inte ville normalisera bort, eller som
// kvarstår efter strippningen). Bug 2026-06-02: en 48×48-ikon hamnade som
// galleribild i Wix på prod 1005010492587553.
function isTinyImageUrl(u) {
  return /[_/-](?:36|40|48|50|56|60|64|72|80|96|100|120)x(?:36|40|48|50|56|60|64|72|80|96|100|120)\b/i.test(String(u || ""));
}

// --- Bild-extraktion (lager 4, DOM) --------------------------------------
// Bug 2026-05-31: tidigare fångades bara ~3 bilder. AE har många fler källor:
// huvud-slider, thumbnails, zoom/magnifier-versioner och färg-swatch-bilder.
// Vi samlar från alla och låter CDN-filtret + dedup i extract() städa.
//
// Ordning = prioritet: huvudgalleri (hero + thumbs) först, färg-swatchar sist
// (de är giltiga produktbilder men mindre representativa som hero).
const GALLERY_IMG_SELECTORS = [
  '[class*="slider--item"] img',
  '[class*="slider--img"] img',
  '[class*="image-view"] img',
  '[class*="magnifier"] img',
];
// "sku-item--image" matchar både gamla "sku-item--imageWrap" och nya
// "sku-item--image" (substring), så swatch-bilder fångas oavsett layout.
const SWATCH_IMG_SELECTORS = ['[class*="sku-item--image"] img'];

function collectImgSrc(selectors, out) {
  for (const sel of selectors) {
    for (const img of document.querySelectorAll(sel)) {
      // AE lazy-laddar — riktiga full-res-URL:en ligger ofta i data-src/srcset.
      const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
      if (src) out.push(src);
      const srcset = img.getAttribute("srcset") || "";
      if (srcset) {
        // Sista kandidaten i srcset är störst.
        const last = srcset.split(",").pop();
        const url = last && last.trim().split(/\s+/)[0];
        if (url) out.push(url);
      }
    }
  }
}

// Samlar galleri- + swatch-bilder ur DOM (hero/thumbs först, swatchar sist).
function collectDomImages() {
  const out = [];
  collectImgSrc(GALLERY_IMG_SELECTORS, out);
  collectImgSrc(SWATCH_IMG_SELECTORS, out);
  return out;
}

// --- Lagerstatus (bug 2026-05-31) ----------------------------------------
// AE-produkter visas annars som "Slut i lager" i Wix för att vi aldrig läste
// lagerstatus. Default-antagande: I LAGER (AE-produkter säljer aktivt). Bara en
// stark OOS-signal sätter false.
function detectInStock() {
  // Köpknapp-/action-området är mest tillförlitligt; falla tillbaka på body.
  const actionEl =
    document.querySelector('[class*="product-action"], [class*="pdp-info-right"], [class*="buy"]') ||
    document.body;
  const txt = (actionEl && (actionEl.innerText || actionEl.textContent)) || "";
  // Stark OOS-signal nära köp-ytan.
  if (/\b(out of stock|sold out|no longer available|inte tillgänglig|slutsåld|slut i lager)\b/i.test(txt)) {
    return false;
  }
  // "X available" / "X st kvar" → uttryckligen i lager.
  if (/\d+\s*(available|in stock|st\b|kvar)/i.test(txt)) return true;
  // Default: i lager (bättre default än OOS).
  return true;
}

// --- Ship-from ur DOM (bug 2026-06-01) -----------------------------------
// På nya PC-sidan är fraktlandet inte en SKU-grupp utan en "Levereras från:
// Polen"/"Ships from: China"-rad (ofta i ett [data-pl*="ship"]- eller
// shipping-block). Den gamla skrapan läste bara shipFrom ur inbäddad SKU-data /
// SKU-grupper → "Leverans: Okänt". Vi skannar därför även dedikerade
// shipping-block och body-texten och normaliserar lands-namn → ISO-2.
const SHIP_FROM_TEXT_RE =
  /(?:ships?\s*from|dispatch(?:ed)?\s*from|levereras?\s*fr[åa]n|skickas?\s*fr[åa]n|fraktas?\s*fr[åa]n)\s*[:：]?\s*([A-Za-zÅÄÖåäö][A-Za-zÅÄÖåäö .'-]{1,28})/i;

function detectShipFromDom() {
  const codes = new Set();
  const tryAdd = (raw) => {
    const code = normalizeShipFrom(String(raw || "").trim());
    if (code && /^[A-Z]{2}$/.test(code)) codes.add(code);
  };
  // a) Dedikerade shipping-/leverans-block.
  const blocks = document.querySelectorAll(
    '[data-pl*="ship" i], [class*="shipping"], [class*="dynamic-shipping"], ' +
      '[class*="ship-from"], [class*="shipFrom"], [class*="delivery"]',
  );
  for (const el of blocks) {
    const m = ((el.innerText || el.textContent) || "").match(SHIP_FROM_TEXT_RE);
    if (m) tryAdd(m[1]);
  }
  // b) Body-text-fallback (global skanning efter alla "från X"-omnämnanden).
  if (codes.size === 0) {
    const body = (document.body && document.body.innerText) || "";
    const re = new RegExp(SHIP_FROM_TEXT_RE.source, "gi");
    let m;
    while ((m = re.exec(body)) && codes.size < 5) tryAdd(m[1]);
  }
  return [...codes];
}

// --- Lager 1+2: inbäddad JSON --------------------------------------------

function readEmbeddedData() {
  // 1. window.runParams.data (klassiskt).
  try {
    const w = window;
    if (w.runParams && w.runParams.data) return w.runParams.data;
    // Vissa nyare bundlar lägger modulerna direkt på runParams.
    if (w.runParams && w.runParams.titleModule) return w.runParams;
  } catch (_) {}

  // 2. Andra kända window-globaler.
  try {
    const w = window;
    for (const key of ["__INIT_DATA__", "__INITIAL_STATE__", "_init_data_"]) {
      const g = w[key];
      if (!g) continue;
      // Datat kan ligga direkt eller under .data.
      if (g.titleModule || g.skuModule) return g;
      if (g.data && (g.data.titleModule || g.data.skuModule)) return g.data;
    }
  } catch (_) {}

  // 3. Inline-script: leta efter window.runParams = {...} eller liknande blob.
  for (const s of document.scripts) {
    const t = s.textContent || "";
    const m =
      t.match(/window\.runParams\s*=\s*({[\s\S]*?});/) ||
      t.match(/window\.__INIT_DATA__\s*=\s*({[\s\S]*?});/);
    if (m) {
      try {
        const parsed = JSON.parse(m[1]);
        return parsed.data || parsed;
      } catch (_) {}
    }
  }
  return null;
}

// --- Lager 3: JSON-LD ----------------------------------------------------

function readJsonLdProduct() {
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
    let parsed;
    try {
      parsed = JSON.parse(s.textContent || "");
    } catch (_) {
      continue;
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(parsed["@graph"] || [])];
    for (const node of nodes) {
      if (node && (node["@type"] === "Product" || node["@type"] === "product")) return node;
    }
  }
  return null;
}

// --- Lager 4: <title>/OG-meta + DOM ---------------------------------------

function metaContent(selector) {
  const el = document.querySelector(selector);
  return (el && el.getAttribute("content")) || "";
}

// Pris i USD från JSON-LD-offer (Product.offers). Hanterar både Offer (price)
// och AggregateOffer (lowPrice/highPrice). priceCurrency är ISO ("SEK") = renast.
function priceUsdFromJsonLd(ld) {
  if (!ld || !ld.offers) return 0;
  const offers = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
  if (!offers) return 0;
  const code = String(offers.priceCurrency || ld.priceCurrency || "").toUpperCase();
  // lowPrice = AliExpress "från"-pris (billigaste varianten) → konservativ baskostnad.
  const raw = offers.price || offers.lowPrice || offers.highPrice;
  return toUsd(parseNumeric(raw), code);
}

// Pris i USD från renderad sida. Försöker i tur och ordning: JSON-LD-offer,
// <title>/og-title ("196.11SEK …"), och slutligen pris-spannet i DOM.
function extractPriceUsd() {
  const fromText = (txt, currencyHint) => {
    const m = String(txt || "").match(/([\d][\d.,]*)\s*([A-Za-z]{3}|kr|US\s*\$|[$€£₽]|zł)?/);
    if (!m) return 0;
    const val = parseNumeric(m[1]);
    const code = (m[2] && /^[A-Za-z]{3}$/.test(m[2])) ? m[2] : detectCurrency(currencyHint || txt);
    return toUsd(val, code);
  };

  // A0. JSON-LD <Product> offers — standardiserat och tillförlitligt.
  const ldUsd = priceUsdFromJsonLd(readJsonLdProduct());
  if (ldUsd > 0) return ldUsd;

  // A. <title>: "196.11SEK 36% Off | …" (punkt-decimal + ISO-kod, renast).
  const tm = (document.title || "").match(/^\s*([\d.,]+)\s*([A-Za-z]{3})/);
  if (tm) {
    const usd = toUsd(parseNumeric(tm[1]), tm[2]);
    if (usd > 0) return usd;
  }

  // B. og:title / twitter:title (samma format).
  for (const sel of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    const c = metaContent(sel);
    const mm = c.match(/([\d.,]+)\s*([A-Za-z]{3})/);
    if (mm) {
      const usd = toUsd(parseNumeric(mm[1]), mm[2]);
      if (usd > 0) return usd;
    }
  }

  // C. Pris-span i DOM (lokalformaterat, ofta bara symbol "kr").
  const el =
    document.querySelector('[class*="price--currentPriceText"]') ||
    document.querySelector(".product-price-value") ||
    document.querySelector('[class*="product-price-value"]') ||
    document.querySelector('[class*="pdp-comp-price-current"]') ||
    document.querySelector('[class*="es--wrap"] [class*="price"]');
  if (el) {
    const usd = fromText(el.textContent, el.textContent);
    if (usd > 0) return usd;
  }
  return 0;
}

// Kända warehouse-koder — används för att gissa att en namnlös grupp egentligen
// är "Ships From" (annars skulle den bli en falsk variant-dimension).
const KNOWN_SHIP_CODES = new Set([...EU_WAREHOUSE_CODES, "CN", "US", "RU", "TR", "AU", "CA"]);

// Bug 2026-06-01: variantnamn visades som AliExpress-interna SKU-koder
// ("F202504221116183") istället för det läsbara färg-/modellnamnet ("Sverige
// Hemma Vuxen Gul"). Koden ligger i SKU-rutans text/data-sku-col, medan det
// riktiga namnet nästan alltid finns i bildens alt/title. Vi måste därför aktivt
// välja BORT koden och föredra det läsbara namnet.

// True om strängen ser ut som en intern SKU-/property-kod snarare än ett namn:
// ren sifferkod (ev. 1–2 bokstäver prefix, t.ex. "F2025…") eller en lång siffer-
// sekvens (>=8 i följd, t.ex. property-value-id "100014064").
function looksLikeSkuCode(s) {
  const t = String(s || "").replace(/\s+/g, "");
  if (!t) return true;
  if (/^[A-Za-z]{0,2}\d{6,}$/.test(t)) return true;
  if (/\d{8,}/.test(t)) return true;
  return false;
}

// Väljer det mest läsbara variantnamnet bland kandidater (bild-alt/title,
// aria-label, sub-span-text, box-text). Hoppar över interna koder. Faller tillbaka
// på första icke-tomma kandidaten om ALLA ser ut som koder (hellre något än inget).
function pickDisplayName(candidates) {
  const cleaned = (candidates || [])
    .map((c) => String(c || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return cleaned.find((c) => !looksLikeSkuCode(c)) || cleaned[0] || "";
}

// Läser en SKU-grupps namn (Color / Size / Ships From) robust. AE visar det som
// "Color: <valt värde>" men klassnamnen varierar mellan sidversioner, och SIZE-
// gruppens titel saknar ibland sku-item--title helt — då tappade den gamla koden
// hela storleks-axeln (bug 2026-06-01). Provar flera källor innan vi ger upp.
function readSkuGroupName(wrap, list) {
  const clean = (s) => (String(s || "").split(/[:：]/)[0] || "").replace(/\s+/g, " ").trim();
  const ok = (s) => s && s.length >= 1 && s.length <= 40;
  if (wrap) {
    // a) Dedikerat title-element (flera möjliga klassnamn).
    const titleEl = wrap.querySelector(
      '[class*="sku-item--title"], [class*="skuTitle"], [class*="--title"]',
    );
    let n = clean(titleEl && titleEl.textContent);
    if (ok(n)) return n;
    // b) aria-label på wrappen.
    n = clean(wrap.getAttribute && wrap.getAttribute("aria-label"));
    if (ok(n)) return n;
  }
  // c) Närmast föregående syskon till listan (en label-rad strax ovanför rutorna).
  let sib = list.previousElementSibling;
  for (let i = 0; sib && i < 3; i++, sib = sib.previousElementSibling) {
    if (
      sib.querySelector &&
      sib.querySelector('[class*="sku-item--skus"], [class*="sku-item--skuList"]')
    )
      break;
    const n = clean(sib.textContent);
    if (ok(n)) return n;
  }
  return "";
}

// Hämtar SKU-grupper ur DOM: [{name:"Color", values:[{label, image}]}, ...].
//
// Layout-historik (verifierad live 2026-06-01 mot en t-shirt med Color+Size):
// AE:s PC-sida renderar numera varje axel som [class*="sku-item--property"] med
// en titel [class*="sku-item--title"] och en värdelista [class*="sku-item--skus"]
// (det GAMLA klassnamnet var "sku-item--skuList" — det matchar INGET längre, så
// den tidigare koden som itererade på skuList hittade NOLL grupper och tappade
// hela Size-axeln, bug 2026-06-01). Bild-swatchar bytte också klass från
// "sku-item--imageWrap" till "sku-item--image". Den enda stabila kroken är
// attributet data-sku-col som sitter på VARJE värde-ruta (både färg-swatch och
// storleks-knapp), så vi itererar över property-containern och plockar dess
// data-sku-col-leaves. Klassbaserad fallback behålls om AE rullar tillbaka.
// En grupp med värden tappas ALDRIG bara för att titeln inte gick att läsa —
// då får den ett stabilt fallback-namn.
function extractDomSkuGroups() {
  // Axel-containern finns i både gammal och ny layout. Faller tillbaka på
  // skuList/skus-listans property om ingen property-container hittas.
  let props = [...document.querySelectorAll('[class*="sku-item--property"]')];
  if (!props.length) {
    props = [...document.querySelectorAll('[class*="sku-item--skus"], [class*="sku-item--skuList"]')]
      .map((l) => l.closest('[class*="sku-item--property"]') || l.parentElement)
      .filter(Boolean);
  }
  const groups = [];
  props.forEach((prop, idx) => {
    if (!prop) return;
    const list =
      prop.querySelector('[class*="sku-item--skus"]') ||
      prop.querySelector('[class*="sku-item--skuList"]') ||
      prop;
    let name = readSkuGroupName(prop, list);

    // Värde-rutor: data-sku-col sitter på varje leaf (text-box ELLER bild-swatch)
    // och är layout-stabil. Faller tillbaka på klassnamn (box=text, image/
    // imageWrap=swatch) om attributet saknas. Filtrera bort yttre element som
    // omsluter ett annat matchat element (en swatch inuti en box → dubbelräkning).
    let rawItems = [...prop.querySelectorAll("[data-sku-col]")];
    if (!rawItems.length) {
      rawItems = [
        ...prop.querySelectorAll(
          '[class*="sku-item--box"], [class*="sku-item--image"], [class*="sku-item--imageWrap"]',
        ),
      ];
    }
    const items = rawItems.filter(
      (it) => !rawItems.some((other) => other !== it && it.contains(other)),
    );

    const seen = new Set();
    const values = [];
    for (const it of items) {
      const img = it.querySelector("img");
      const subSpan = it.querySelector('[class*="skuText"], [class*="sku-item--text"]');
      // Kandidater i prioritetsordning: läsbar bild-alt/title > aria-label/title
      // > sub-span-text > box-text. pickDisplayName väljer bort interna SKU-koder
      // så det Wix-synliga namnet blir "Sverige Hemma Vuxen Gul", inte "F2025…".
      const label = pickDisplayName([
        img && img.getAttribute("alt"),
        img && img.getAttribute("title"),
        it.getAttribute && it.getAttribute("title"),
        it.getAttribute && it.getAttribute("aria-label"),
        subSpan && subSpan.textContent,
        it.textContent,
      ]);
      if (!label) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue; // deduppa (dubbelrenderade rutor)
      seen.add(key);
      values.push({ label, image: img ? cleanImageUrl(img.src) : "" });
    }
    if (!values.length) return;

    // Titel oläsbar → behåll axeln med ett vettigt fallback-namn istället för att
    // släppa den. Gissa "Ships From" om värdena ser ut som warehouse-koder,
    // annars "Färg" för rena bild-swatchgrupper, annars positionsnamn.
    if (!name) {
      const looksShip = values.every((v) => KNOWN_SHIP_CODES.has(normalizeShipFrom(v.label)));
      const allImg = values.every((v) => v.image);
      name = looksShip ? "Ships From" : allImg ? "Färg" : `Variant ${idx + 1}`;
    }
    groups.push({ name, values });
  });
  return groups;
}

function decodeSkuProps(skuPropIds, props) {
  // skuPropIds: "14:200004889;5:100014064" -> { Färg: "Röd", ... }
  const options = {};
  if (!skuPropIds) return options;
  for (const pair of String(skuPropIds).split(";")) {
    const [pid, vid] = pair.split(":");
    const prop = props.find((p) => String(p.skuPropertyId) === pid);
    if (!prop) continue;
    const value = (prop.skuPropertyValues || []).find((v) => String(v.propertyValueId) === vid);
    // Föredra det läsbara namnet; AE lägger ibland en intern kod i display-/name-
    // fältet → pickDisplayName väljer bort koden (bug 2026-06-01).
    options[prop.skuPropertyName || pid] = value
      ? pickDisplayName([value.propertyValueDisplayName, value.propertyValueName]) || vid
      : vid;
  }
  return options;
}

// --- Strukturerad produktinfo (data till de tabbade PDP-sektionerna) ------
// Tre fält som backaren översätter/berikar till svenska flikar:
//   specifications  → "Tekniska specifikationer"
//   features        → säljpunkter (vävs in i beskrivningen / FAQ-underlag)
//   packageContents → "Vad som ingår" (del av specifikationer)
// AE är klient-renderad (runParams=null) så DOM är huvudkälla; embedded
// specsModule (när den finns) är dock renast och hanteras i extract() nedan.

function cleanLabel(s) {
  return String(s || "").replace(/\s+/g, " ").trim().replace(/[:：]\s*$/, "");
}
function cleanValue(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

// Renar en HTML-sträng från oönskat innehåll (skript, stilar, attribut,
// AE-spårningspixlar) så vi kan persistera den som beskrivnings-HTML i Wix.
// Behåller bara säkra inline-element + grundläggande block för läsbarhet.
// Bug 2026-06-02: tidigare skickades bara meta-description-boilerplate;
// servern hade ingen riktig produkttext att fallback:a till i rå-läge.
function sanitizeDescriptionHtml(html, opts = {}) {
  const maxChars = opts.maxChars || 20000;
  if (!html) return "";
  let s = String(html);
  // Plocka bort script/style/iframe-block.
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  // Strippa alla on*-attribut och javascript:-URL:er (XSS-skydd).
  s = s.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "");
  s = s.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "");
  s = s.replace(/javascript:/gi, "");
  // Strippa AE:s data-* spårnings-attribut.
  s = s.replace(/\s+data-[a-z0-9_-]+\s*=\s*"[^"]*"/gi, "");
  s = s.replace(/\s+data-[a-z0-9_-]+\s*=\s*'[^']*'/gi, "");
  // Strippa AE:s spårnings-pixlar (1×1 img utan alt).
  s = s.replace(/<img[^>]*\s(?:width|height)\s*=\s*['"]?1['"]?[^>]*>/gi, "");
  // Trim whitespace.
  s = s.replace(/\s{3,}/g, " ").trim();
  if (s.length > maxChars) s = s.slice(0, maxChars);
  return s;
}

// Plockar ut Product Description-HTML från sidan. AE lagrar den på flera
// platser beroende på sidversion:
//   - Inbäddad i window.runParams.descriptionModule.descriptionUrl (URL till
//     en separat HTML — ej skrapbar utan extra fetch)
//   - I DOM under [class*="description--wrap"] / [id*="product-description"]
//   - I en <iframe> som lazy-laddas (ej åtkomlig utan extra arbete)
// Vi tar DOM-källan när den finns och faller tillbaka till sammanfattningar
// av features + specifications när den inte hittas.
function extractDescriptionHtml() {
  const SELECTORS = [
    '[data-pl="product-description"]',
    '[id*="product-description" i]',
    '#J-product-desc',
    '[class*="product-description"]',
    '[class*="productDescription"]',
    '[class*="description--wrap"]',
    '[class*="description-wrap"]',
    '[class*="description-content"]',
    '[class*="descriptionContent"]',
    '[id="dec-description"]',
  ];
  for (const sel of SELECTORS) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const html = el.innerHTML || "";
    if (html.length < 50) continue; // för lite för att vara den riktiga beskrivningen
    const cleaned = sanitizeDescriptionHtml(html);
    // Säkerställ att vi inte plockade ett tomt skal — kräver minst lite text.
    const text = el.innerText || el.textContent || "";
    if (text.replace(/\s+/g, "").length < 100) continue;
    return cleaned;
  }
  return "";
}

// Specifikationstabell → { [label]: value }. Försöker flera kända AE-strukturer:
// dl/dt/dd, två-cells-rader (li/tr med titel+värde), samt "Label: Value"-rader.
function extractSpecifications() {
  const specs = {};
  const add = (label, value) => {
    const l = cleanLabel(label);
    const v = cleanValue(value);
    // Filtrera bort skräp: label/värde måste vara rimligt korta och icke-tomma,
    // och värdet får inte vara identiskt med labeln (mis-parsade celler).
    if (!l || !v || l.length > 60 || v.length > 300 || l.toLowerCase() === v.toLowerCase()) return;
    if (!(l in specs)) specs[l] = v;
  };

  const containers = document.querySelectorAll(
    '[class*="specification"], [class*="product-specs"], [class*="productSpec"], ' +
      '[class*="prop-list"], [class*="product-prop"], [class*="extend-info"], ' +
      '[id*="specification" i], [data-pl*="specification" i], [class*="propertyList"], ' +
      '[class*="specs--list"], [class*="specsTable"]',
  );
  for (const c of containers) {
    // a) Definition lists.
    for (const dt of c.querySelectorAll("dt")) {
      if (dt.nextElementSibling) add(dt.textContent, dt.nextElementSibling.textContent);
    }
    // b) Rader med separata titel-/värde-celler.
    for (const row of c.querySelectorAll(
      'li, tr, [class*="prop-item"], [class*="specification-item"], [class*="property-item"], ' +
        '[class*="specs--item"], [class*="specsItem"]',
    )) {
      const key = row.querySelector(
        '[class*="prop-title"], [class*="propertyTitle"], [class*="title"], [class*="name"], [class*="key"], ' +
          '[class*="specs--title"], [class*="specsLabel"], dt, th',
      );
      const val = row.querySelector(
        '[class*="prop-value"], [class*="propertyValue"], [class*="value"], [class*="desc"], ' +
          '[class*="specs--value"], [class*="specsValue"], dd, td',
      );
      if (key && val && key !== val) {
        add(key.textContent, val.textContent);
        continue;
      }
      // c) "Label: Value" i en enda cell.
      const m = (row.textContent || "").match(/^\s*([^:：\n]{2,40})[:：]\s*(.+)$/);
      if (m) add(m[1], m[2]);
    }
  }
  return specs;
}

// Säljpunkter/funktioner → array av strängar. AE visar dem som "key-features"-
// listor, sales-bullets nära beskrivningen, ELLER som bullet points i
// Product Description-sektionen (vanligaste — bug 2026-06-02: tomt features-
// fält på rå-imports → ingen säljande text för cataloget).
function extractFeatures() {
  const out = [];
  const seen = new Set();
  const push = (s) => {
    const t = cleanValue(s);
    // Bullets är typ 3–160 tecken; filtrera bort rubriker/skräp.
    if (t.length < 3 || t.length > 200) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };
  // 1) Dedikerade bullet-/feature-containers (snabbast om de finns).
  const containers = document.querySelectorAll(
    '[class*="product-feature"], [class*="key-features"], [class*="keyFeatures"], ' +
      '[class*="sales-bullet"], [class*="bullet-point"], [class*="highlight"], ' +
      '[class*="feature--list"], [class*="featureList"], [class*="seo-points"]',
  );
  for (const c of containers) {
    const items = c.querySelectorAll("li");
    if (items.length) {
      for (const li of items) push(li.textContent);
    } else {
      push(c.textContent);
    }
    if (out.length >= 12) break;
  }
  // 2) Fallback: bullets från Product Description-sektionen (AE-säljare lägger
  //    ofta säljpunkter som <li> eller <p>-rader där). Tar bara korta rader så
  //    själva beskrivningstexten inte hamnar i features.
  if (out.length < 5) {
    const descSel = [
      '[data-pl="product-description"]',
      '[id*="product-description" i]',
      '#J-product-desc',
      '[class*="product-description"]',
      '[class*="description--wrap"]',
    ];
    for (const sel of descSel) {
      const el = document.querySelector(sel);
      if (!el) continue;
      for (const li of el.querySelectorAll("li")) push(li.textContent);
      if (out.length >= 8) break;
      // Korta <p>-rader som ser ut som bullets (börjar med • eller -).
      for (const p of el.querySelectorAll("p")) {
        const t = (p.textContent || "").trim();
        if (/^[•\-*·✓✔★]/u.test(t) && t.length < 160) push(t.replace(/^[•\-*·✓✔★]\s*/u, ""));
      }
      if (out.length >= 12) break;
    }
  }
  return out.slice(0, 12);
}

// "What's in the box" / "Package includes" → array, t.ex. ["1 x Kabel", ...].
// Källor: dedikerade DOM-block ELLER en mening i beskrivningstexten.
function extractPackageContents() {
  const out = [];
  const seen = new Set();
  const push = (s) => {
    let t = cleanValue(s).replace(/^[•\-*·]\s*/, "");
    if (t.length < 2 || t.length > 160) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  const PKG_RE = /package\s*(includes|contents|list)|what'?s\s+in\s+the\s+box|in\s+the\s+box|package\s+included/i;

  // 1. Dedikerat DOM-block vars rubrik nämner paketinnehåll.
  for (const el of document.querySelectorAll("h1,h2,h3,h4,strong,b,p,div,span")) {
    const txt = el.textContent || "";
    if (txt.length < 200 && PKG_RE.test(txt)) {
      // Leta listposter i samma eller nästkommande element.
      const scope = el.closest("section, div, li, td") || el.parentElement || el;
      const lis = scope.querySelectorAll("li");
      if (lis.length) {
        for (const li of lis) push(li.textContent);
      }
      if (out.length) return out.slice(0, 20);
    }
  }

  // 2. Fallback: parsa beskrivningstexten efter en "Package includes:"-mening.
  const bodyText = (document.body && document.body.innerText) || "";
  const m = bodyText.match(new RegExp(`(?:${PKG_RE.source})\\s*[:：]?\\s*([\\s\\S]{0,400})`, "i"));
  if (m && m[1]) {
    // Dela på "N x ...", radbrytningar, semikolon eller bullets.
    const parts = m[1]
      .split(/\n|;|·|•|(?=\d+\s*[x×*]\s)/i)
      .map((s) => s.trim())
      .filter((s) => /\d+\s*[x×*]\s*\S|^\d+\s+\S/i.test(s) || /^[A-Za-zÅÄÖåäö]/.test(s));
    for (const p of parts.slice(0, 12)) push(p);
  }
  return out.slice(0, 20);
}

// --- Recensioner (social proof) ------------------------------------------
// Skrapar AliExpress-recensioner från produktsidan så att Fyndplats-produkten
// får recensioner från dag 1. GRATIS — översättningen sker server-side via DeepL
// (ingen Anthropic-användning). Skrapan är best-effort: AE renderar recensioner
// klient-sida och lazy-laddar dem, så vi tar det som finns i DOM:en just nu.
//
// Filtrering/rankning sker server-side (lib/import/review-import.ts); här gör vi
// en lätt förfiltrering + topp-15-kapning så payloaden hålls liten.

const REVIEW_MIN_LEN = 50;
const REVIEW_MAX_LEN = 300;
const REVIEW_MAX = 15;

// Försök läsa stjärnbetyg (1–5) ur ett recensions-element. AE använder oftast en
// bredd-baserad stjärnbar (style="width: 80%") eller N ifyllda stjärn-spans.
function reviewRating(el) {
  // 1. Bredd-baserad stjärnbar.
  const bar = el.querySelector('[class*="star"] [style*="width"], [style*="width"][class*="star"]');
  if (bar && bar.style && bar.style.width) {
    const pct = parseFloat(bar.style.width);
    if (Number.isFinite(pct) && pct > 0) return Math.max(1, Math.min(5, Math.round(pct / 20)));
  }
  // 2. Antal ifyllda stjärnor.
  const filled = el.querySelectorAll('[class*="star--filled"], [class*="star-active"], [class*="icon-star"]');
  if (filled.length >= 1 && filled.length <= 5) return filled.length;
  // 3. Numeriskt betyg i text ("5.0", "4,5").
  const m = (el.textContent || "").match(/\b([1-5])([.,]\d)?\s*(?:\/\s*5|stars?|star|stjärn)/i);
  if (m) return Math.round(parseFloat(m[1] + (m[2] ? m[2].replace(",", ".") : "")));
  return 0;
}

function reviewText(el) {
  const node =
    el.querySelector('[class*="comment--content"], [class*="buyer-feedback"], [class*="feedback--content"], [class*="review-content"]') ||
    el;
  let txt = (node.textContent || "").replace(/\s+/g, " ").trim();
  // Klipp bort uppenbara metarader (datum/land/variant) om vi tog hela elementet.
  return txt;
}

function reviewCountry(el) {
  const c =
    el.querySelector('[class*="user-country"], [class*="country"], [class*="--country"]');
  if (c && c.textContent) return c.textContent.trim();
  // Flagg-bild med land i alt/title.
  const flag = el.querySelector('img[class*="flag"], img[alt][class*="country"]');
  if (flag) return (flag.getAttribute("alt") || flag.getAttribute("title") || "").trim();
  return "";
}

function reviewDate(el) {
  const d = el.querySelector('[class*="comment--date"], [class*="feedback--date"], [class*="review-date"], time');
  const raw = d ? (d.getAttribute("datetime") || d.textContent || "") : "";
  const s = raw.trim();
  if (!s) return "";
  const t = Date.parse(s);
  return Number.isNaN(t) ? "" : new Date(t).toISOString();
}

// Rått AE-användarnamn (ofta maskerat, t.ex. "M***a" eller "u****6543"). Servern
// LAGRAR det för bevis men VISAR bara initialer ("M.K.") — aldrig hela namnet.
function reviewAuthor(el) {
  const a = el.querySelector('[class*="user-name"], [class*="buyer-name"], [class*="--name"], [class*="comment--name"]');
  const txt = a && a.textContent ? a.textContent.trim() : "";
  return txt.slice(0, 60);
}

function reviewHasImage(el) {
  return Boolean(
    el.querySelector('[class*="comment--photo"] img, [class*="feedback--photo"] img, [class*="review-image"] img, [class*="thumbnail"] img'),
  );
}

// Hittar recensions-element via flera selektorer (AE byter klassnamn ofta).
function findReviewElements() {
  const SELECTORS = [
    '[data-pl="product-reviews"] [class*="comment--item"]',
    '[class*="comment--list"] [class*="comment--item"]',
    '[class*="feedback-item"]',
    '[class*="review-item"]',
    '[class*="comment-item"]',
  ];
  for (const sel of SELECTORS) {
    const els = document.querySelectorAll(sel);
    if (els.length) return [...els];
  }
  return [];
}

function scrapeReviews() {
  let els;
  try {
    els = findReviewElements();
  } catch (_) {
    return [];
  }
  const out = [];
  const seen = new Set();
  for (const el of els) {
    let r;
    try {
      const text = reviewText(el);
      if (!text || text.length < REVIEW_MIN_LEN || text.length > REVIEW_MAX_LEN) continue;
      const rating = reviewRating(el) || 5; // okänt → anta positiv (filtreras ändå server-side)
      if (rating < 3) continue;
      const key = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      r = {
        reviewIdAE: el.getAttribute("data-id") || el.id || "",
        rating,
        text,
        hasImage: reviewHasImage(el),
        customerName: reviewAuthor(el),
        customerCountry: reviewCountry(el),
        date: reviewDate(el),
      };
    } catch (_) {
      continue;
    }
    out.push(r);
    if (out.length >= REVIEW_MAX * 2) break; // ta lite extra; servern rankar/kapar
  }
  // Lätt rankning: foto + längd (servern gör den fullständiga rankningen).
  out.sort((a, b) => (Number(b.hasImage) - Number(a.hasImage)) || (b.text.length - a.text.length));
  return out.slice(0, REVIEW_MAX);
}

// --- Säljardata (Feature 6 — säljar-score) -------------------------------
// Skrapar AliExpress-säljaren från produktsidan: store-id (vår supplierId),
// butiksnamn, store-URL, AE:s egen säljar-score (1–5) och antal followers.
// supplierId är nyckeln — utan den kan servern inte spåra säljaren över tid.
// Källor i prioritetsordning: inbäddad storeModule/sellerModule (renast, men
// ofta null på nya PC-sidan) → store-länk (/store/{id}) → dedikerade DOM-element.

// Tolkar antal som kan vara "1.2k", "3,4 tn", "12 345" → heltal.
function parseCount(str) {
  const s = String(str || "").trim().toLowerCase().replace(/\s/g, "");
  const m = s.match(/([\d.,]+)\s*(k|m|tn|mn)?/);
  if (!m) return 0;
  let n = parseNumeric(m[1]);
  if (!(n > 0)) return 0;
  const suffix = m[2];
  if (suffix === "k" || suffix === "tn") n *= 1000;
  else if (suffix === "m" || suffix === "mn") n *= 1000000;
  return Math.round(n);
}

function extractSupplier(data) {
  const sup = {
    supplierId: "",
    supplierName: "",
    supplierStoreUrl: "",
    aeRating: 0,
    aeFollowers: 0,
    // Utökade säljarmetadata (bug 2026-06-02): säljarens positiva feedback-%,
    // år på AliExpress, och "Top Brand"-badge — alla används av säljar-score
    // (Feature 6) för att flagga riskabla säljare. Skickas bara när skrapade.
    positiveFeedbackPct: 0,
    yearsOnAE: 0,
    topBrand: false,
  };

  // 1) Inbäddad storeModule/sellerModule (klassisk runParams) — renaste källan.
  const storeModule = (data && (data.storeModule || data.sellerModule)) || null;
  if (storeModule) {
    if (storeModule.storeNum != null) sup.supplierId = String(storeModule.storeNum);
    else if (storeModule.sellerAdminSeq != null) sup.supplierId = String(storeModule.sellerAdminSeq);
    if (storeModule.storeName) sup.supplierName = String(storeModule.storeName).trim().slice(0, 80);
    if (storeModule.storeURL || storeModule.storeHomePage) {
      sup.supplierStoreUrl = cleanStoreUrl(storeModule.storeURL || storeModule.storeHomePage);
    }
    if (Number(storeModule.followingNumber) > 0) sup.aeFollowers = Math.round(Number(storeModule.followingNumber));
    // positiveRate är en feedback-% (0–100) → räkna om till en 1–5-score OCH
    // behåll rå %:en (positiveFeedbackPct) för säljar-score-heuristiken.
    const rate = Number(storeModule.positiveRate);
    if (rate > 0) {
      sup.aeRating = Math.round((rate / 20) * 10) / 10;
      sup.positiveFeedbackPct = Math.round(rate * 10) / 10;
    }
    // openTime / openDate / openYear — ISO eller år som tal. Räkna år sedan.
    const openRaw =
      storeModule.openTime ||
      storeModule.openDate ||
      storeModule.openYear ||
      storeModule.companyEstablishedTime;
    if (openRaw) {
      const yrs = yearsFromOpenDate(openRaw);
      if (yrs > 0) sup.yearsOnAE = yrs;
    }
    // Top Brand-flagga (varierar i fältnamn över AE-versioner).
    if (
      storeModule.isTopBrand === true ||
      storeModule.isTopRated === true ||
      storeModule.topBrand === true ||
      storeModule.topRatedSeller === true
    ) {
      sup.topBrand = true;
    }
  }

  // 2) Store-länk (/store/{id}) — id + URL + namn.
  if (!sup.supplierId || !sup.supplierStoreUrl) {
    const storeLink = document.querySelector(
      'a[href*="/store/"], a[href*="storeId="], a[href*="sellerAdminSeq="], ' +
        '[data-pl="store-name"] a, [class*="store-info"] a, [class*="storeName"] a',
    );
    if (storeLink) {
      const href = storeLink.getAttribute("href") || "";
      if (!sup.supplierStoreUrl && href) sup.supplierStoreUrl = cleanStoreUrl(href);
      const m =
        href.match(/\/store\/(\d+)/) ||
        href.match(/storeId=(\d+)/) ||
        href.match(/sellerAdminSeq=(\d+)/);
      if (m && !sup.supplierId) sup.supplierId = m[1];
      const name = (storeLink.textContent || "").trim();
      if (!sup.supplierName && name && name.length <= 80) sup.supplierName = name;
    }
  }

  // 3) Butiksnamn-fallback ur dedikerat element.
  if (!sup.supplierName) {
    const nameEl = document.querySelector(
      '[data-pl="store-name"], [class*="store-name"], [class*="storeName"], [class*="shop-name"]',
    );
    if (nameEl) sup.supplierName = (nameEl.textContent || "").trim().slice(0, 80);
  }

  // 4) Rating + followers + positivFeedback + år + topBrand ur store-/seller-block.
  const blocks = document.querySelectorAll(
    '[class*="store-info"], [class*="storeInfo"], [class*="seller"], [data-pl*="store"], [class*="shop-"]',
  );
  for (const el of blocks) {
    const txt = (el.innerText || el.textContent || "").slice(0, 800);
    if (!sup.aeRating) {
      // En 1–5-score med en decimal, t.ex. "4.8" (undvik %-tal och årtal).
      const r = txt.match(/\b([0-5](?:[.,]\d))\b(?!\s*%)/);
      if (r) sup.aeRating = parseNumeric(r[1]);
    }
    if (!sup.aeFollowers) {
      const f = txt.match(/([\d.,]+\s*[km]?)\s*(followers|följare|seguidores)/i);
      if (f) sup.aeFollowers = parseCount(f[1]);
    }
    if (!sup.positiveFeedbackPct) {
      // "98.4% Positive Feedback" / "Positivt omdöme 97,3 %".
      const p = txt.match(/(\d{1,3}(?:[.,]\d{1,2})?)\s*%\s*(positive|positivt|positive feedback|positiv)/i) ||
        txt.match(/(positive feedback|positivt omdöme)\s*[:：]?\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*%/i);
      if (p) {
        const val = parseNumeric(p[1] || p[2]);
        if (val > 0 && val <= 100) sup.positiveFeedbackPct = Math.round(val * 10) / 10;
      }
    }
    if (!sup.yearsOnAE) {
      // "Year on AliExpress: 5" / "5 år på AliExpress".
      const y = txt.match(/(\d{1,2})\s*(years?|år)\s*(?:on|på)?\s*aliexpress/i) ||
        txt.match(/aliexpress\s*(?:since|sedan)\s*(\d{4})/i);
      if (y) {
        let val = parseInt(y[1], 10);
        if (val > 1900) val = new Date().getFullYear() - val; // tolkat som öppningsår
        if (val > 0 && val < 30) sup.yearsOnAE = val;
      }
    }
    if (!sup.topBrand) {
      if (/\btop\s*brand\b|\btop\s*rated\b|\btoppsäljare\b|\btoppmärke\b/i.test(txt)) {
        sup.topBrand = true;
      }
    }
  }

  // 4b) Top Brand-badgar visas ofta som <img alt="Top Brand"> eller en separat
  // pixel-art-badge — leta över hela sidan om vi inte hittade flaggan i text.
  if (!sup.topBrand) {
    const badge = document.querySelector(
      'img[alt*="Top Brand" i], img[alt*="Top Rated" i], [class*="top-brand"], [class*="topBrand"], [class*="topRated"]',
    );
    if (badge) sup.topBrand = true;
  }

  return sup;
}

// Beräknar antal år sedan en öppningsdatum-sträng (ISO eller år).
function yearsFromOpenDate(raw) {
  if (!raw) return 0;
  const s = String(raw).trim();
  if (!s) return 0;
  // Bara år (4 siffror).
  if (/^\d{4}$/.test(s)) {
    return new Date().getFullYear() - parseInt(s, 10);
  }
  // ISO eller annat datum.
  const t = Date.parse(s);
  if (Number.isNaN(t)) {
    // Försök tolka "DD/MM/YYYY" eller "YYYY-MM".
    const m = s.match(/(\d{4})/);
    if (m) return new Date().getFullYear() - parseInt(m[1], 10);
    return 0;
  }
  const diffMs = Date.now() - t;
  const diffYrs = diffMs / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, Math.floor(diffYrs));
}

// Normaliserar en AE store-URL (protokoll + behåll bara path till storefronten).
function cleanStoreUrl(u) {
  let s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("//")) s = "https:" + s;
  else if (s.startsWith("/")) s = "https://www.aliexpress.com" + s;
  return s;
}

function extract() {
  const data = readEmbeddedData();
  const supplierProductId =
    (location.pathname.match(/item\/(\d+)\.html/) || [])[1] || String(Date.now());

  const result = {
    supplierProductId,
    sourceUrl: location.href,
    rawTitle: "",
    rawDescription: "",
    // Full HTML från AE:s Product Description-sektion (renad). Tom = bara
    // meta-description-boilerplate fanns att tillgå. Bug 2026-06-02: tunn
    // beskrivning på rå-imports → inget för servern att visa.
    descriptionHtml: "",
    imageUrls: [],
    variants: [],
    swatchImages: {},
    // Strukturerad produktinfo → tabbade PDP-sektioner (server översätter/berikar).
    specifications: {},
    features: [],
    packageContents: [],
    // Skrapade recensioner (social proof). Översätts server-side via DeepL.
    reviewsToImport: [],
    shipsFrom: [],
    // Säljardata (Feature 6). supplierId tom = säljaren kunde inte identifieras.
    // Utökade fält (bug 2026-06-02): positiveFeedbackPct, yearsOnAE, topBrand.
    supplier: {
      supplierId: "",
      supplierName: "",
      supplierStoreUrl: "",
      aeRating: 0,
      aeFollowers: 0,
      positiveFeedbackPct: 0,
      yearsOnAE: 0,
      topBrand: false,
    },
    // Lagerstatus — default i lager (sätts nedan via detectInStock + ev. SKU-saldo).
    inStock: true,
    _warnings: [],
    // Sätts nedan: om vi kunde extrahera användbar produktdata (titel + bild +
    // pris). Popupen vägrar importera när detta är false.
    extractionOk: false,
    quality: { hasTitle: false, hasImages: false, hasPrice: false, hasRealVariants: false },
  };

  // Spårar om varianterna kom från riktig SKU-data (inte den syntetiska default).
  let hasRealVariants = false;
  const shipCodes = new Set();

  if (data) {
    const titleModule = data.titleModule || {};
    const imageModule = data.imageModule || {};
    const priceModule = data.priceModule || {};
    const skuModule = data.skuModule || {};

    result.rawTitle = titleModule.subject || "";
    result.imageUrls = imageModule.imagePathList || [];

    // Beskrivning från specs-attributtabellen (finns inline; den fulla HTML-
    // beskrivningen ligger bakom en separat URL och hämtas inte här).
    const specsModule = data.specsModule || {};
    const specLines = (specsModule.props || [])
      .map((p) => {
        const name = p.attrName || p.name;
        const val = p.attrValue || p.value;
        // Embedded specs är renaste källan → fyll även den strukturerade mappen.
        if (name && val) {
          const l = cleanLabel(name);
          const v = cleanValue(val);
          if (l && v && !(l in result.specifications)) result.specifications[l] = v;
        }
        return name && val ? `${name}: ${val}` : "";
      })
      .filter(Boolean);
    result.rawDescription = specLines.join("\n");

    const skuPriceList = skuModule.skuPriceList || [];
    const props = skuModule.productSKUPropertyList || [];

    for (const prop of props) {
      const optionName = prop.skuPropertyName || String(prop.skuPropertyId);
      const withImg = (prop.skuPropertyValues || []).filter((v) => v.skuPropertyImagePath);
      if (withImg.length === 0) continue;
      result.swatchImages[optionName] = {};
      for (const v of withImg) {
        // Måste matcha samma läsbara namn som decodeSkuProps sätter på optionsvalet
        // (annars missar linkedMedia-kopplingen i pipelinen).
        const choiceName = pickDisplayName([v.propertyValueDisplayName, v.propertyValueName]);
        // Strippa thumbnail-suffix så Wix får full-res för per-färg-bildväxlingen
        // (bug 2026-06-02: linkedMedia satte 220×220-thumbs istället för original).
        if (choiceName) result.swatchImages[optionName][choiceName] = cleanImageUrl(v.skuPropertyImagePath);
      }
    }

    const shippingModule = data.shippingModule || {};
    const crossBorderModule = data.crossBorderModule || {};
    const defaultShipFromRaw =
      shippingModule.shipFromInfo?.shipFromCode ||
      shippingModule.shipFromInfo?.shipFrom ||
      shippingModule.shipFrom ||
      crossBorderModule.shipFromCountryCode ||
      crossBorderModule.shipFromCountry ||
      data.actionModule?.shipFrom ||
      "";
    const defaultShipFrom = normalizeShipFrom(defaultShipFromRaw);

    // --- v0.1.14 stock-sync (bug 2026-06-03) -----------------------------
    // Per-variant SKU-data ur skuPriceList[]: primär källa för riktig
    // supplierVariantId, per-variant stock + costUsd + options-mapping.
    // Tidigare versioner missade stock-fältet när AE:s skuVal-form varierade
    // (availQuantity kunde ligga på skuVal, direkt på sku, eller heta
    // inventory), och föll tillbaka på bakarens default-stock på 10 — Wix-
    // Mapping visade "10 i lager" för alla varianter oavsett vad AE sade.
    // Nu försöker vi alla kända fältplaceringar och bevarar 0 som legitim
    // OOS-signal, undefined ENBART när inget fält finns alls.
    result.variants = skuPriceList.map((sku, i) => {
      const variantShipRaw =
        sku.skuVal?.shipFromCode ||
        sku.skuVal?.shipFrom ||
        sku.shipFromCode ||
        sku.shipFrom ||
        defaultShipFromRaw;
      const variantShipFrom = normalizeShipFrom(variantShipRaw);

      // supplierVariantId — AE:s riktiga sku-ID. skuIdStr (sträng) är säkrast;
      // skuId som Number kan tappa precision för stora värden (12e15+).
      // Fallback till "idx-N" så bakarens stock-mapping inte kolliderar med
      // ett verkligt AE-skuId om en variant skulle sakna id. Bug 2026-06-03:
      // tidigare kunde råa `i` (index) bli supplierVariantId → bakaren
      // mappade fel SKU vid stock-syncen om AE returnerade skuPriceList
      // i varierande ordning mellan importer.
      const skuIdRaw =
        sku.skuIdStr ||
        sku.skuId ||
        (sku.skuVal && (sku.skuVal.skuIdStr || sku.skuVal.skuId)) ||
        "";
      const supplierVariantId = skuIdRaw ? String(skuIdRaw) : `idx-${i}`;

      // availQuantity — primärt på skuVal, men vissa AE-bundlar lägger det
      // direkt på sku eller använder "inventory"-namnet. Behåll undefined
      // ENBART om INGET fält finns alls; 0 bevaras som legitim OOS-signal.
      // Bug 2026-06-02 (kvarstår): tidigare `availQuantity || 0` gjorde
      // undefined → 0 → varianten markerades som OOS i Wix istället för att
      // få bakarens fallback-stock.
      let rawStock;
      if (sku.skuVal && Object.prototype.hasOwnProperty.call(sku.skuVal, "availQuantity")) {
        rawStock = sku.skuVal.availQuantity;
      } else if (Object.prototype.hasOwnProperty.call(sku, "availQuantity")) {
        rawStock = sku.availQuantity;
      } else if (sku.skuVal && Object.prototype.hasOwnProperty.call(sku.skuVal, "inventory")) {
        rawStock = sku.skuVal.inventory;
      } else if (Object.prototype.hasOwnProperty.call(sku, "inventory")) {
        rawStock = sku.inventory;
      } else {
        rawStock = undefined;
      }
      let stock;
      if (typeof rawStock === "number" && Number.isFinite(rawStock) && rawStock >= 0) {
        stock = rawStock;
      } else if (typeof rawStock === "string" && /^\d+$/.test(rawStock)) {
        stock = parseInt(rawStock, 10);
      } else {
        stock = undefined;
      }

      // costUsd — actSkuCalPrice = aktuellt rabattpris, skuCalPrice = ordinarie.
      // Vissa AE-bundlar lägger pris-fältet direkt på sku istället för
      // sku.skuVal. Faller tillbaka på priceModule:s min-amount om SKU saknar
      // pris helt (sällsynt — då är varianten inte säljbar och kommer
      // filtreras vidare i pipelinen).
      const costUsd = Number(
        (sku.skuVal && (sku.skuVal.actSkuCalPrice || sku.skuVal.skuCalPrice)) ||
          sku.actSkuCalPrice ||
          sku.skuCalPrice ||
          priceModule.minActivityAmount?.value ||
          priceModule.minAmount?.value ||
          0,
      );

      // options-mapping — decodeSkuProps översätter sku.skuPropIds
      // ("14:200…;5:100…") → läsbara namn ({Färg:"Röd", Storlek:"M"}).
      // skuAttr är ett alternativfält i vissa AE-versioner.
      const options = decodeSkuProps(sku.skuPropIds || sku.skuAttr || "", props);

      return {
        supplierVariantId,
        options,
        costUsd,
        stock,
        shipFrom: variantShipFrom || defaultShipFrom || "",
        included: true,
      };
    });
    hasRealVariants = result.variants.length > 0;

    for (const v of result.variants) if (v.shipFrom) shipCodes.add(v.shipFrom);
    if (defaultShipFrom) shipCodes.add(defaultShipFrom);
  } else {
    result._warnings.push("Kunde inte läsa inbäddad data — föll tillbaka på JSON-LD/DOM.");
  }

  // --- Backfill från JSON-LD (lager 3) -----------------------------------
  const ld = readJsonLdProduct();
  if (ld) {
    if (!result.rawTitle && ld.name) result.rawTitle = String(ld.name);
    if (!result.rawDescription && ld.description) result.rawDescription = String(ld.description);
    if (result.imageUrls.length === 0 && ld.image) {
      const imgs = Array.isArray(ld.image) ? ld.image : [ld.image];
      result.imageUrls = imgs.map(String).filter(Boolean).slice(0, 8);
    }
  }

  // --- Backfill från <title>/OG-meta + DOM (lager 4) ---------------------
  if (!result.rawTitle) {
    result.rawTitle =
      metaContent('meta[property="og:title"]') ||
      (document.querySelector("h1") || {}).textContent ||
      "";
  }
  // Bug 2026-05-31: hämta ALLTID galleri- + swatch-bilder ur DOM och slå ihop med
  // det inbäddad data/JSON-LD gav (tidigare togs DOM-bilder bara när listan var
  // tom → vi fastnade på ~3 bilder). CDN-filtret + dedup nedan städar bort dubbletter
  // och icke-AE-bilder; målet är 6–12 bilder per produkt.
  {
    const domImgs = collectDomImages();
    if (domImgs.length) result.imageUrls = result.imageUrls.concat(domImgs);
    // OG-bild som komplement/fallback.
    const og = metaContent('meta[property="og:image"]');
    if (og) result.imageUrls.push(og);
    // Sista utväg om vi fortfarande står utan bilder: alla img på sidan (filtreras
    // på CDN nedan så bara AliExpress-bilder överlever).
    if (result.imageUrls.length === 0) {
      result.imageUrls = [...document.querySelectorAll("img")].map((img) => img.src);
    }
  }
  if (!result.rawDescription) {
    result.rawDescription = metaContent('meta[name="description"]');
  }
  result.rawTitle = (result.rawTitle || "").trim();

  // VIKTIGT: behåll bara AliExpress-CDN-bilder (alicdn ELLER aliexpress-media/
  // ae-pic). Annars smiter logotyper/3:e-parts-bilder med. Normalisera + deduppa.
  // Dubbel-dedup-pass: först rå-dedup (samma URL två gånger), sedan stripp av
  // storleks-/format-suffix, sedan dedup igen (en thumb + en full-res av samma
  // bild reduceras till en post). Filter bort ikon-/microthumb-URL:er
  // (≤120×120) som annars hamnar i galleriet — bug 2026-06-02: en 48×48-ikon
  // importerades som galleribild på prod 1005010492587553.
  {
    const seenRaw = new Set();
    const seenClean = new Set();
    result.imageUrls = (result.imageUrls || [])
      .filter((u) => u && (seenRaw.has(u) ? false : (seenRaw.add(u), true)))
      .map(cleanImageUrl)
      .filter((u) => u && IMAGE_HOST_RE.test(u))
      .filter((u) => !isTinyImageUrl(u))
      .filter((u) => (seenClean.has(u) ? false : (seenClean.add(u), true)))
      .slice(0, 12);
  }

  // --- Backfill strukturerad info från DOM -------------------------------
  // specsModule (embedded) är renast men finns sällan på nya PC-sidan → komplettera
  // alltid ur DOM. specifications backfillas bara om embedded inte gav något.
  if (Object.keys(result.specifications).length === 0) {
    result.specifications = extractSpecifications();
  } else {
    for (const [k, v] of Object.entries(extractSpecifications())) {
      if (!(k in result.specifications)) result.specifications[k] = v;
    }
  }
  result.features = extractFeatures();
  result.packageContents = extractPackageContents();
  // Full HTML-beskrivning från Product Description-sektionen (bug 2026-06-02).
  // Renad från skript/stilar/spårningspixlar. Tom = sektionen ej skrapbar
  // (lazy-laddad iframe eller separat URL); backend faller tillbaka till
  // rawDescription + specifications.
  result.descriptionHtml = extractDescriptionHtml();
  // Recensioner (best-effort — kräver att AE renderat recensions-sektionen).
  result.reviewsToImport = scrapeReviews();
  result.supplier = extractSupplier(data);

  // --- Variant-fallback från DOM (när inbäddad SKU-data saknas) -----------
  // Nya PC-sidan saknar inbäddad SKU-JSON. Bygg varianter ur SKU-rutorna.
  // OBS: AliExpress visar bara priset för den valda varianten i DOM, så alla
  // DOM-varianter får baspriset. Leonard varnas att kontrollera priserna.
  if (!hasRealVariants) {
    const baseUsd = extractPriceUsd();
    const groups = extractDomSkuGroups();

    for (const g of groups) {
      if (SHIP_PROP_RE.test(g.name)) {
        for (const v of g.values) {
          const code = normalizeShipFrom(v.label);
          if (code) shipCodes.add(code);
        }
        continue;
      }
      const withImg = g.values.filter((v) => v.image);
      if (withImg.length) {
        result.swatchImages[g.name] = result.swatchImages[g.name] || {};
        for (const v of withImg) result.swatchImages[g.name][v.label] = v.image;
      }
    }

    const optGroups = groups.filter((g) => !SHIP_PROP_RE.test(g.name));
    const defaultShip = [...shipCodes][0] || "";

    if (baseUsd > 0 && optGroups.length) {
      // Kartesisk produkt av alla optionsgrupper (taklagt till 60 varianter).
      let combos = [{}];
      for (const g of optGroups) {
        const next = [];
        for (const c of combos) {
          for (const v of g.values) {
            next.push({ ...c, [g.name]: v.label });
            if (next.length >= 60) break;
          }
          if (next.length >= 60) break;
        }
        combos = next;
      }
      result.variants = combos.map((opts, i) => ({
        supplierVariantId: "dom-" + i,
        options: opts,
        costUsd: baseUsd,
        shipFrom: defaultShip,
        included: true,
      }));
      hasRealVariants = result.variants.length > 0;
      result._warnings.push(
        "Varianter byggda ur DOM och satta till baspriset (AliExpress visar inte " +
          "per-variant-pris i DOM). Kontrollera priserna före publicering.",
      );
    } else if (baseUsd > 0) {
      // Enkel produkt utan varianter, men med giltigt pris.
      result.variants = [
        { supplierVariantId: "default", options: {}, costUsd: baseUsd, shipFrom: defaultShip, included: true },
      ];
    }
  }

  // Ship-from-koder ihopsamlade från data + SKU-grupper. Komplettera ALLTID med
  // dedikerade shipping-block/body-text (nya PC-sidan visar fraktlandet där, inte
  // som en SKU-grupp) så att "Leverans: Okänt" blir t.ex. "Polen" (bug 2026-06-01).
  for (const code of detectShipFromDom()) shipCodes.add(code);
  result.shipsFrom = [...shipCodes].sort();

  // Backfill per-variant shipFrom när hela produkten skickas från EXAKT ett lager
  // (vanligaste fallet) men varianterna saknade kod — så att per-variant-badgen i
  // popupen och EU-flaggan i pipelinen blir rätt.
  if (result.shipsFrom.length === 1) {
    for (const v of result.variants) if (!v.shipFrom) v.shipFrom = result.shipsFrom[0];
  }

  // Lagerstatus: börja med DOM-signalen (köp-knapp/text). Om inbäddad SKU-data
  // har explicita saldon väger de tyngst: alla 0 → OOS, något > 0 → i lager.
  result.inStock = detectInStock();
  if (hasRealVariants) {
    const stocks = result.variants
      .map((v) => v.stock)
      .filter((s) => typeof s === "number");
    if (stocks.length) {
      if (stocks.some((s) => s > 0)) result.inStock = true;
      else if (stocks.every((s) => s === 0)) result.inStock = false;
    }
  }

  // Syntetisk default-variant om inga hittades (saknar pris → räknas inte som
  // giltig prisinfo nedan, vilket gör att importen vägras).
  if (result.variants.length === 0) {
    result._warnings.push("Inga varianter eller pris hittades — produkten kan inte importeras.");
    result.variants = [{ supplierVariantId: "default", options: {}, costUsd: 0, included: true }];
  }

  // --- Kvalitetsbedömning ------------------------------------------------
  const titleOk = result.rawTitle.length >= 10 && !/fyndplats/i.test(result.rawTitle);
  const imagesOk = result.imageUrls.length >= 1;
  const priceOk = result.variants.some((v) => Number(v.costUsd) > 0);
  result.quality = {
    hasTitle: titleOk,
    hasImages: imagesOk,
    hasPrice: priceOk,
    hasRealVariants,
  };
  result.extractionOk = titleOk && imagesOk && priceOk;

  if (!result.extractionOk) {
    const missing = [];
    if (!titleOk) missing.push("titel");
    if (!imagesOk) missing.push("bild");
    if (!priceOk) missing.push("pris");
    result._warnings.push(`Otillräcklig produktdata (saknar: ${missing.join(", ")}).`);
  }

  return result;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "EXTRACT_PRODUCT") {
    try {
      sendResponse({ ok: true, product: extract() });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  }
  return true;
});
esult.variants = [{ supplierVariantId: "default", options: {}, costUsd: 0, included: true }];
  }

  // --- Kvalitetsbedömning ------------------------------------------------
  const titleOk = result.rawTitle.length >= 10 && !/fyndplats/i.test(result.rawTitle);
  const imagesOk = result.imageUrls.length >= 1;
  const priceOk = result.variants.some((v) => Number(v.costUsd) > 0);
  result.quality = {
    hasTitle: titleOk,
    hasImages: imagesOk,
    hasPrice: priceOk,
    hasRealVariants,
  };
  result.extractionOk = titleOk && imagesOk && priceOk;

  if (!result.extractionOk) {
    const missing = [];
    if (!titleOk) missing.push("titel");
    if (!imagesOk) missing.push("bild");
    if (!priceOk) missing.push("pris");
    result._warnings.push(`Otillräcklig produktdata (saknar: ${missing.join(", ")}).`);
  }

  return result;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "EXTRACT_PRODUCT") {
    try {
      sendResponse({ ok: true, product: extract() });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  }
  return true;
});
