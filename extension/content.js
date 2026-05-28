// Content-script: extraherar produktdata från en AliExpress item-sida.
//
// VIKTIGT (sköraste delen av hela systemet): AliExpress ändrar sin sidstruktur
// med jämna mellanrum. Vi läser i första hand från sidans inbäddade JSON
// (window.runParams / __INIT_DATA__) och faller tillbaka på DOM. När import
// slutar fungera är det nästan alltid här selektorerna behöver uppdateras.

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
    _warnings: [],
  };

  if (data) {
    const titleModule = data.titleModule || {};
    const imageModule = data.imageModule || {};
    const priceModule = data.priceModule || {};
    const skuModule = data.skuModule || {};

    result.rawTitle = titleModule.subject || document.title || "";
    result.imageUrls = imageModule.imagePathList || [];

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
    result.variants = skuPriceList.map((sku, i) => ({
      supplierVariantId: String(sku.skuId || sku.skuIdStr || i),
      options: decodeSkuProps(sku.skuPropIds, props),
      costUsd: Number(
        (sku.skuVal && (sku.skuVal.actSkuCalPrice || sku.skuVal.skuCalPrice)) ||
          priceModule.minActivityAmount?.value ||
          priceModule.minAmount?.value ||
          0,
      ),
      stock: sku.skuVal ? Number(sku.skuVal.availQuantity || 0) : undefined,
      included: true,
    }));
  } else {
    result._warnings.push("Kunde inte läsa inbäddad data — föll tillbaka på DOM.");
    result.rawTitle = (document.querySelector("h1") || {}).textContent || document.title;
    result.imageUrls = [...document.querySelectorAll("img")]
      .map((img) => img.src)
      .filter((s) => /alicdn\.com/.test(s))
      .slice(0, 8);
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
