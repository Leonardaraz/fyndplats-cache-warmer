// Content-script: extraherar produktdata från en AliExpress item-sida.
//
// VIKTIGT (sköraste delen av hela systemet): AliExpress ändrar sin sidstruktur
// med jämna mellanrum. Vi läser i första hand från sidans inbäddade JSON
// (window.runParams / __INIT_DATA__) och faller tillbaka på DOM. När import
// slutar fungera är det nästan alltid här selektorerna behöver uppdateras.

// EU-warehouse countries (held i sync med lib/aliexpress/eu-countries.ts).
// Dupliceras här eftersom content-scripts inte kan importera från lib/.
const EU_WAREHOUSE_CODES = new Set([
  "ES", "DE", "CZ", "PL", "FR", "IT", "NL", "BE", "GB",
]);

// Mappar fritext-warehouse → ISO-kod. Subset av lib/aliexpress/eu-countries.ts;
// håll dem synkade när nya warehouses dyker upp.
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

function isEuWarehouse(code) {
  return Boolean(code) && EU_WAREHOUSE_CODES.has(String(code).toUpperCase());
}

function readEmbeddedData() {
  // AliExpress lägger historiskt produktdata i window.runParams.data.
  try {
    const w = window;
    if (w.runParams && w.runParams.data) return w.runParams.data;
  } catch (_) {}

  // Fallback: leta efter ett inline-script med en stor JSON-blob.
  for (const s of document.scripts) {
    const t = s.textContent || "";
    const m = t.match(/window\.runParams\s*=\s*({[\s\S]*?});/);
    if (m) {
      try {
        return JSON.parse(m[1]).data;
      } catch (_) {}
    }
  }
  return null;
}

function extract() {
  const data = readEmbeddedData();
  const supplierProductId =
    (location.pathname.match(/item\/(\d+)\.html/) || [])[1] || String(Date.now());

  // Bygg ett resultat med fallbacks så popupen alltid får något att visa.
  const result = {
    supplierProductId,
    sourceUrl: location.href,
    rawTitle: "",
    rawDescription: "",
    imageUrls: [],
    variants: [],
    // { [optionName]: { [choiceName]: swatchImageUrl } } för options med bild (färg).
    swatchImages: {},
    // Aggregerade shipFrom-koder från alla varianter, t.ex. ["CN", "ES"].
    // Tom = okänd (varken sidan eller embedded data avslöjar warehouse).
    shipsFrom: [],
    _warnings: [],
  };

  if (data) {
    const titleModule = data.titleModule || {};
    const imageModule = data.imageModule || {};
    const priceModule = data.priceModule || {};
    const skuModule = data.skuModule || {};

    result.rawTitle = titleModule.subject || document.title || "";
    result.imageUrls = imageModule.imagePathList || [];

    // Beskrivning: AliExpress lägger den fulla HTML-beskrivningen bakom en
    // separat URL (descriptionModule.descriptionUrl), men specsModule.props
    // (attribut-tabellen) finns inline och ger SEO-generatorn riktig produkt-
    // data att utgå från. Utan detta blev rawDescription ALLTID tom → LLM:en
    // hittade på butikscopy (bug 2026-05-31).
    const specsModule = data.specsModule || {};
    const specProps = specsModule.props || [];
    const specLines = specProps
      .map((p) => {
        const name = p.attrName || p.name;
        const val = p.attrValue || p.value;
        return name && val ? `${name}: ${val}` : "";
      })
      .filter(Boolean);
    result.rawDescription = specLines.join("\n");

    const skuPriceList = skuModule.skuPriceList || [];
    const props = skuModule.productSKUPropertyList || [];

    // Fånga bild per val för options som har swatch-bilder (typiskt färg).
    for (const prop of props) {
      const optionName = prop.skuPropertyName || String(prop.skuPropertyId);
      const values = prop.skuPropertyValues || [];
      const withImg = values.filter((v) => v.skuPropertyImagePath);
      if (withImg.length === 0) continue;
      result.swatchImages[optionName] = {};
      for (const v of withImg) {
        const choiceName = v.propertyValueDisplayName || v.propertyValueName;
        result.swatchImages[optionName][choiceName] = v.skuPropertyImagePath;
      }
    }
    // Page-level default shipFrom (gäller alla varianter om inget annat står).
    // Vi kollar flera kända ställen — AliExpress flyttar runt fältet ibland.
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
      // Variant-level shipFrom kan ligga i flera ställen beroende på
      // marknad/version — försök allt vi sett, fall tillbaka på page-default.
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

    // Aggregera unika shipFrom-koder för produkten (för UI och Wix-metadata).
    const codes = new Set();
    for (const v of result.variants) {
      if (v.shipFrom) codes.add(v.shipFrom);
    }
    if (defaultShipFrom) codes.add(defaultShipFrom);
    result.shipsFrom = [...codes].sort();
  } else {
    result._warnings.push("Kunde inte läsa inbäddad data — föll tillbaka på DOM.");
    result.rawTitle = (document.querySelector("h1") || {}).textContent || document.title;
    result.imageUrls = [...document.querySelectorAll("img")]
      .map((img) => img.src)
      .filter((s) => /alicdn\.com/.test(s))
      .slice(0, 8);
    // DOM-fallback för beskrivning: meta description är den mest stabila källan.
    const metaDesc = document.querySelector('meta[name="description"]');
    result.rawDescription = (metaDesc && metaDesc.getAttribute("content")) || "";
  }

  if (result.variants.length === 0) {
    result._warnings.push("Inga varianter hittades — produkten importeras som enkel produkt.");
    result.variants = [
      { supplierVariantId: "default", options: {}, costUsd: 0, included: true },
    ];
  }
  return result;
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
