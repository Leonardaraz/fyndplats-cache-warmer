// Popup: hämtar extraherad produkt från content-scriptet, visar varianter med
// kryssrutor (variant-filter), och postar valda varianter till import-API:t.

// EU-warehouse codes — dupliceras från lib/aliexpress/eu-countries.ts.
// Håll synkad när listan ändras.
const EU_WAREHOUSE_CODES = new Set([
  "ES", "DE", "CZ", "PL", "FR", "IT", "NL", "BE", "GB",
]);

function badgeForShipFrom(code) {
  const span = document.createElement("span");
  span.className = "badge";
  if (!code) {
    span.classList.add("badge-unknown");
    span.textContent = "?";
    span.title = "Okänt warehouse";
    return span;
  }
  const up = String(code).toUpperCase();
  if (EU_WAREHOUSE_CODES.has(up)) {
    span.classList.add("badge-eu");
    span.textContent = `EU ${up}`;
    span.title = `EU-lager (${up}) — snabb leverans 3–7 dagar`;
  } else if (up === "CN") {
    span.classList.add("badge-cn");
    span.textContent = "Kina";
    span.title = "Kinesiskt lager — 2–3 veckors leverans";
  } else {
    span.classList.add("badge-cn");
    span.textContent = up;
    span.title = `Warehouse: ${up}`;
  }
  return span;
}

function summarizeShipsFrom(codes) {
  if (!codes || codes.length === 0) {
    // OBS: detta gäller LEVERANS/warehouse, inte lagersaldo. Tidigare stod här
    // "Lager: okänt" vilket lästes som att stocken var okänd (bug 2026-06-01).
    return { className: "badge-unknown", text: "Leverans: okänt", title: "Okänt warehouse — leveranstid oklar" };
  }
  const hasEu = codes.some((c) => EU_WAREHOUSE_CODES.has(String(c).toUpperCase()));
  const hasNonEu = codes.some((c) => !EU_WAREHOUSE_CODES.has(String(c).toUpperCase()));
  if (hasEu && !hasNonEu) {
    return {
      className: "badge-eu",
      text: `🇪🇺 EU-lager (${codes.join(", ")})`,
      title: "Snabb leverans — 3–7 dagar inom EU",
    };
  }
  if (hasEu && hasNonEu) {
    return {
      className: "badge-eu",
      text: `🇪🇺 Delvis EU (${codes.join(", ")})`,
      title: "Vissa varianter från EU — välj rätt variant för snabb leverans",
    };
  }
  return {
    className: "badge-cn",
    text: `🇨🇳 Kina (${codes.join(", ")})`,
    title: "Långsam leverans — 2–3 veckor från Kina",
  };
}

// Lager-badge utifrån skrapans inStock-flagga. Visar tydligt "I lager"/"Slut"
// redan före import (tidigare gav warehouse-badgen "Lager: okänt" vilket Leonard
// läste som att lagret var okänt — bug 2026-06-01). Efter import ersätts texten
// av det faktiska saldot från API-svaret.
function stockBadge(p) {
  const span = document.createElement("span");
  span.className = "summary-badge";
  if (p.inStock === false) {
    span.classList.add("badge-cn");
    span.textContent = "Slut i lager";
    span.title = "AliExpress-sidan signalerade slutsåld — importeras med 0 i lager.";
  } else {
    span.classList.add("badge-eu");
    span.textContent = "I lager";
    span.title =
      "Importeras som i lager — verkligt AliExpress-saldo per variant när det " +
      "kunde läsas, annars standard 10 st.";
  }
  return span;
}

let product = null;

const $title = document.getElementById("title");
const $variants = document.getElementById("variants");
const $import = document.getElementById("import");
const $status = document.getElementById("status");

// --- Feature toggles (persisteras i chrome.storage.sync) -----------------
// Alla PÅ som default för nya användare. Skickas i payloaden som featureFlags
// så backend kan hoppa över motsvarande Claude-steg och spara credits.
const FEATURE_KEYS = ["translate", "seo", "imageAnalysis", "autoCategorize"];
const DEFAULT_FLAGS = { translate: true, seo: true, imageAnalysis: true, autoCategorize: true };
let featureFlags = { ...DEFAULT_FLAGS };

async function loadFeatureFlags() {
  const stored = await chrome.storage.sync.get("featureFlags");
  featureFlags = { ...DEFAULT_FLAGS, ...(stored.featureFlags || {}) };
  for (const key of FEATURE_KEYS) {
    const cb = document.getElementById(`f-${key}`);
    if (!cb) continue;
    cb.checked = featureFlags[key] !== false;
    cb.addEventListener("change", () => {
      featureFlags[key] = cb.checked;
      chrome.storage.sync.set({ featureFlags });
    });
  }
}

function setStatus(text, cls) {
  $status.textContent = text;
  $status.className = cls || "";
}

// --- EU-lager-läge -------------------------------------------------------
// Global toggle (chrome.storage.sync.euOnly). När den ändras broadcastar vi
// EU_MODE_CHANGED till alla öppna AliExpress-flikar så filtret slår till/av
// direkt utan att Leonard behöver ladda om dem.
async function loadEuToggle() {
  const $eu = document.getElementById("euOnly");
  if (!$eu) return;
  const { euOnly } = await chrome.storage.sync.get("euOnly");
  $eu.checked = euOnly === true;
  $eu.addEventListener("change", async () => {
    const on = $eu.checked;
    await chrome.storage.sync.set({ euOnly: on });
    const tabs = await chrome.tabs.query({ url: ["https://*.aliexpress.com/*", "https://*.aliexpress.us/*"] });
    for (const t of tabs) {
      chrome.tabs.sendMessage(t.id, { type: "EU_MODE_CHANGED", euOnly: on }, () => void chrome.runtime.lastError);
    }
  });
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function load() {
  const tab = await activeTab();
  if (!tab || !/aliexpress\.(com|us)\/item\//.test(tab.url || "")) {
    $title.textContent = "Öppna en AliExpress produktsida först.";
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_PRODUCT" }, (res) => {
    if (chrome.runtime.lastError || !res || !res.ok) {
      $title.textContent = "Kunde inte läsa produkten (ladda om sidan).";
      $import.disabled = true;
      return;
    }
    product = res.product;
    render();
    // Bild-färgsampling är bara meningsfull om vi faktiskt fick produktdata.
    if (product.extractionOk) sampleColors();
  });
}

// Samplar färg från AliExpress swatch-bilder så färgvarianter blir färgbubblor i Wix.
function sampleColors() {
  if (!product.swatchImages || Object.keys(product.swatchImages).length === 0) return;
  chrome.runtime.sendMessage({ type: "SAMPLE_COLORS", swatchImages: product.swatchImages }, (res) => {
    if (res && res.ok && Object.keys(res.optionColorCodes).length) {
      product.optionColorCodes = res.optionColorCodes;
      const n = Object.values(res.optionColorCodes).reduce((a, c) => a + Object.keys(c).length, 0);
      setStatus(`${n} färgvarianter blir färgbubblor (samplade från bilden).`, "ok");
    }
  });
}

function render() {
  // Visa produkttitel + sammanfattnings-badge för warehouse-status.
  const summary = summarizeShipsFrom(product.shipsFrom || []);
  $title.textContent = "";
  const titleText = document.createElement("span");
  titleText.textContent = product.rawTitle || "(ingen titel)";
  $title.append(titleText);
  const summaryBadge = document.createElement("span");
  summaryBadge.className = `summary-badge ${summary.className}`;
  summaryBadge.textContent = summary.text;
  summaryBadge.title = summary.title;
  $title.append(summaryBadge);
  // Separat lager-badge (skild från warehouse/leverans-badgen ovan).
  $title.append(stockBadge(product));

  $variants.innerHTML = "";
  product.variants.forEach((v, i) => {
    const row = document.createElement("div");
    row.className = "variant";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = v.included;
    cb.id = `v${i}`;
    cb.addEventListener("change", () => (product.variants[i].included = cb.checked));
    const label = document.createElement("label");
    label.htmlFor = `v${i}`;
    const optText = Object.values(v.options).join(" / ") || "Standard";
    label.innerHTML = `${optText} <span class="cost">($${v.costUsd})</span>`;
    row.append(cb, label);
    // Per-variant EU/CN-badge
    row.append(badgeForShipFrom(v.shipFrom));
    $variants.append(row);
  });

  // Vägra import om skrapningen inte gav användbar produktdata. Hellre stoppa
  // här än att skapa en spökprodukt med 0,9 kr och butikscopy (bug 2026-05-31).
  if (!product.extractionOk) {
    $import.disabled = true;
    const q = product.quality || {};
    const missing = [];
    if (!q.hasTitle) missing.push("titel");
    if (!q.hasImages) missing.push("bild");
    if (!q.hasPrice) missing.push("pris");
    setStatus(
      `AliExpress-sidan kunde inte läsas (saknar: ${missing.join(", ") || "produktdata"}).\n` +
        "Försök ladda om sidan, eller använd \"Öppna orderläge\" för manuell inmatning.",
      "err",
    );
    return;
  }

  if (product._warnings && product._warnings.length) {
    setStatus(product._warnings.join("\n"), "warn");
  }
  $import.disabled = false;
}

$import.addEventListener("click", async () => {
  // Dubbelkolla: importera aldrig om extraktionen misslyckades.
  if (!product || !product.extractionOk) {
    setStatus("Kan inte importera — produktdatan kunde inte läsas.", "err");
    return;
  }
  const chosen = product.variants.filter((v) => v.included);
  if (chosen.length === 0) {
    setStatus("Välj minst en variant.", "err");
    return;
  }
  $import.disabled = true;
  setStatus("Importerar…");

  chrome.runtime.sendMessage({ type: "IMPORT_PRODUCT", product, featureFlags }, (res) => {
    if (chrome.runtime.lastError || !res) {
      setStatus("Fel: " + (chrome.runtime.lastError?.message || "okänt"), "err");
      $import.disabled = false;
      return;
    }
    if (res.ok) {
      // Visa det faktiska lagersaldot som backend satte (stockQuantity). Fallback
      // till skrapans inStock-flagga om svaret saknar fältet (äldre backend).
      const qty =
        res.result && typeof res.result.stockQuantity === "number"
          ? res.result.stockQuantity
          : null;
      const lager =
        qty !== null
          ? qty > 0
            ? `${qty} st i lager`
            : "0 — slut i lager"
          : product.inStock === false
            ? "slut i lager"
            : "i lager";
      setStatus(`Klart! Wix-produkt skapad (${res.result.wixProductId}). Lager: ${lager}.`, "ok");
    } else {
      setStatus("Import misslyckades: " + res.error, "err");
      $import.disabled = false;
    }
  });
});

document.getElementById("orders").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("orders.html") });
});

loadFeatureFlags();
loadEuToggle();
load();
