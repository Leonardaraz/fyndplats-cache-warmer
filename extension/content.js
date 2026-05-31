// Content-script: extraherar produktdata från en AliExpress item-sida.
//
// VIKTIGT (sköraste delen av hela systemet): AliExpress ändrar sin sidstruktur
// med jämna mellanrum. Strategin är därför LAGERVIS — vi försöker flera källor
// och backfillar saknade fält:
//   1. Inbäddad JSON (window.runParams.data + dess moduler) — bäst, ger pris/SKU
//   2. Andra window-globaler / inline-script (__INIT_DATA__, _dida_config_, ...)
//   3. JSON-LD (<script type="application/ld+json"> Product) — namn/bild/beskrivning
//   4. OG-/meta-taggar + DOM (h1, og:image) — sista utväg för visning
//
// Endast lager 1 ger riktig inköpskostnad (costUsd). Saknas den kan vi inte
// prissätta produkten → extractionOk=false och popupen vägrar importera
// (bug 2026-05-31: tom skrapning skapade 0,9 kr-spökprodukter med butikscopy).

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

// --- Lager 4: OG/meta + DOM ----------------------------------------------

function metaContent(selector) {
  const el = document.querySelector(selector);
  return (el && el.getAttribute("content")) || "";
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

    const codes = new Set();
    for (const v of result.variants) if (v.shipFrom) codes.add(v.shipFrom);
    if (defaultShipFrom) codes.add(defaultShipFrom);
    result.shipsFrom = [...codes].sort();
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

  // --- Backfill från OG/meta + DOM (lager 4) -----------------------------
  if (!result.rawTitle) {
    result.rawTitle =
      metaContent('meta[property="og:title"]') ||
      (document.querySelector("h1") || {}).textContent ||
      "";
  }
  if (result.imageUrls.length === 0) {
    const og = metaContent('meta[property="og:image"]');
    if (og) result.imageUrls = [og];
    else {
      result.imageUrls = [...document.querySelectorAll("img")]
        .map((img) => img.src)
        .filter((s) => /alicdn\.com/.test(s))
        .slice(0, 8);
    }
  }
  if (!result.rawDescription) {
    result.rawDescription = metaContent('meta[name="description"]');
  }
  result.rawTitle = (result.rawTitle || "").trim();

  // VIKTIGT: filtrera bort bilder som INTE är AliExpress-CDN (alicdn). Annars
  // kan og:image/DOM-bilder från fel sida (t.ex. en logotyp) smita med.
  result.imageUrls = (result.imageUrls || []).filter((u) => /alicdn\.com/i.test(String(u)));

  // Syntetisk default-variant om inga riktiga hittades (enkel produkt). Denna
  // saknar pris (costUsd=0) → räknas inte som giltig prisinfo nedan.
  if (result.variants.length === 0) {
    result._warnings.push("Inga varianter hittades — produkten importeras som enkel produkt.");
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
