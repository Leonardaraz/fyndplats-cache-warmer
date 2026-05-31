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
//   - Variant: SKU-rutor [class*="sku-item--skuList"] (Color/Size/Ships From).
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

const EU_WAREHOUSE_CODES = new Set([
  "ES", "DE", "CZ", "PL", "FR", "IT", "NL", "BE", "GB",
]);

const SHIP_FROM_NAME_MAP = {
  SPAIN: "ES", GERMANY: "DE", "CZECH REPUBLIC": "CZ", CZECHIA: "CZ",
  POLAND: "PL", FRANCE: "FR", ITALY: "IT", NETHERLANDS: "NL",
  BELGIUM: "BE", "UNITED KINGDOM": "GB", UK: "GB", CHINA: "CN",
  "UNITED STATES": "US", USA: "US", RUSSIA: "RU", TURKEY: "TR",
  MADRID: "ES", BERLIN: "DE", PARIS: "FR", AMSTERDAM: "NL",
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

// Normaliserar en AliExpress-bild-URL: lägger på protokoll och strippar
// storleks-/format-suffix ("….png_220x220q75.jpg_.avif" → "….png").
function cleanImageUrl(u) {
  if (!u) return "";
  let s = String(u).trim();
  if (s.startsWith("//")) s = "https:" + s;
  s = s.replace(/(\.(?:jpg|jpeg|png|webp|gif|avif|bmp))_[^/]*$/i, "$1");
  return s;
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

// Hämtar SKU-grupper ur DOM: [{name:"Color", values:[{label, image}]}, ...].
function extractDomSkuGroups() {
  const lists = [...document.querySelectorAll('[class*="sku-item--skuList"]')];
  const groups = [];
  for (const list of lists) {
    const wrap = list.closest('[class*="sku-item--property"]') || list.parentElement;
    const titleEl = wrap && wrap.querySelector('[class*="sku-item--title"]');
    const name = titleEl ? titleEl.textContent.split(":")[0].trim() : "";
    const items = [
      ...list.querySelectorAll('[class*="sku-item--box"], [class*="sku-item--imageWrap"]'),
    ];
    const values = items
      .map((it) => {
        const img = it.querySelector("img");
        let label = (
          it.querySelector('[class*="skuText"], [class*="sku-item--text"]') || it
        ).textContent.trim();
        if (!label && img) label = (img.alt || img.getAttribute("title") || "").trim();
        return { label: label || "", image: img ? cleanImageUrl(img.src) : "" };
      })
      .filter((v) => v.label);
    if (name && values.length) groups.push({ name, values });
  }
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
    options[prop.skuPropertyName || pid] = value ? value.propertyValueDisplayName || value.propertyValueName : vid;
  }
  return options;
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
    imageUrls: [],
    variants: [],
    swatchImages: {},
    shipsFrom: [],
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
        const choiceName = v.propertyValueDisplayName || v.propertyValueName;
        result.swatchImages[optionName][choiceName] = v.skuPropertyImagePath;
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

    result.variants = skuPriceList.map((sku, i) => {
      const variantShipRaw =
        sku.skuVal?.shipFromCode ||
        sku.skuVal?.shipFrom ||
        sku.shipFromCode ||
        sku.shipFrom ||
        defaultShipFromRaw;
      const variantShipFrom = normalizeShipFrom(variantShipRaw);
      return {
        supplierVariantId: String(sku.skuId || sku.skuIdStr || i),
        options: decodeSkuProps(sku.skuPropIds, props),
        costUsd: Number(
          (sku.skuVal && (sku.skuVal.actSkuCalPrice || sku.skuVal.skuCalPrice)) ||
            priceModule.minActivityAmount?.value ||
            priceModule.minAmount?.value ||
            0,
        ),
        stock: sku.skuVal ? Number(sku.skuVal.availQuantity || 0) : undefined,
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
  if (result.imageUrls.length === 0) {
    // Galleri-bilder (nya layouten: slider/image-view/magnifier på *-media.com).
    let imgs = [
      ...document.querySelectorAll(
        '[class*="slider--img"] img, [class*="image-view"] img, [class*="slider--item"] img, [class*="magnifier"] img',
      ),
    ].map((img) => img.src);
    // OG-bild som fallback.
    const og = metaContent('meta[property="og:image"]');
    if (og) imgs.push(og);
    // Sista utväg: alla img på sidan (filtreras på CDN nedan).
    if (imgs.length === 0) imgs = [...document.querySelectorAll("img")].map((img) => img.src);
    result.imageUrls = imgs;
  }
  if (!result.rawDescription) {
    result.rawDescription = metaContent('meta[name="description"]');
  }
  result.rawTitle = (result.rawTitle || "").trim();

  // VIKTIGT: behåll bara AliExpress-CDN-bilder (alicdn ELLER aliexpress-media/
  // ae-pic). Annars smiter logotyper/3:e-parts-bilder med. Normalisera + deduppa.
  {
    const seen = new Set();
    result.imageUrls = (result.imageUrls || [])
      .map(cleanImageUrl)
      .filter((u) => u && IMAGE_HOST_RE.test(u))
      .filter((u) => (seen.has(u) ? false : (seen.add(u), true)))
      .slice(0, 12);
  }

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

  // Ship-from-koder ihopsamlade från data + DOM.
  result.shipsFrom = [...shipCodes].sort();

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
