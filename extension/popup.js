// Popup: hämtar extraherad produkt från content-scriptet, visar varianter med
// kryssrutor (variant-filter), och postar valda varianter till import-API:t.

// EU-warehouse-koder — EN sanningskälla i extension/eu-countries.js (laddas före
// detta skript i popup.html). Tidigare hade popupen bara 9 länder medan
// discover.js hade 27 → samma produkt (t.ex. SE/DK-lager) fick olika badge.
const EU_WAREHOUSE_CODES = globalThis.FP_EU.EU_CODES;

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
// Säljarstatus (Feature 6) — sätts av checkSupplierStatus efter extraktion.
// null = okänd/ej kontrollerad; annars { status, complaintRate, ... }.
let supplierStatus = null;

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

// AI-kvalitetsläge (raw/standard/premium) — persisteras separat och bakas in i
// featureFlags vid import. Default "standard" (samma som env-default i backend).
const QUALITY_HINTS = {
  raw: "Ingen AI — rå AliExpress-data, sparas som utkast för manuell polering. 0 kr.",
  standard: "Haiku: översättning, SEO, kategori & flikar. Sparas som utkast. ~0,11 kr.",
  premium: "Opus multi-pass + Sonnet bild-ranking. Publiceras direkt vid 9,5+. ~0,85 kr.",
};
let qualityMode = "standard";

async function loadFeatureFlags() {
  const stored = await chrome.storage.sync.get(["featureFlags", "qualityMode"]);
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

  // AI-kvalité-dropdown.
  const sel = document.getElementById("qualityMode");
  const hint = document.getElementById("qualityHint");
  qualityMode = ["raw", "standard", "premium"].includes(stored.qualityMode) ? stored.qualityMode : "standard";
  if (sel) {
    sel.value = qualityMode;
    if (hint) hint.textContent = QUALITY_HINTS[qualityMode] || "";
    sel.addEventListener("change", () => {
      qualityMode = sel.value;
      if (hint) hint.textContent = QUALITY_HINTS[qualityMode] || "";
      chrome.storage.sync.set({ qualityMode });
    });
  }
}

/** featureFlags + det valda kvalitetsläget, redo att skickas till backend. */
function flagsWithMode() {
  return { ...featureFlags, qualityMode };
}

// --- Marginal-tier (per-import-prisoverride) -----------------------------
// Dropdown: Standard (ingen override → backend använder default-tier),
// Premium (fast 2.5×) eller Custom (egen multiplier + floor/ceiling). Valet
// persisteras i chrome.storage.sync och bakas in i payloaden som pricingOverride.
let pricingTier = "standard"; // "standard" | "premium" | "custom"
const PREMIUM_MULTIPLIER = 2.5;

/**
 * Bygger pricingOverride-objektet utifrån valt tier, eller null för Standard
 * (då skickas inget fält → backend använder default-tiern, bakåtkompatibelt).
 */
function buildPricingOverride() {
  if (pricingTier === "premium") return { multiplier: PREMIUM_MULTIPLIER };
  if (pricingTier === "custom") {
    const mult = parseFloat(document.getElementById("ctMultiplier").value);
    const floor = parseFloat(document.getElementById("ctFloor").value);
    const ceiling = parseFloat(document.getElementById("ctCeiling").value);
    // Multiplier krävs (1–5). Saknas/ogiltig → fall tillbaka på premium-default
    // så vi aldrig skickar en trasig override.
    const multiplier = Number.isFinite(mult) ? Math.min(5, Math.max(1, mult)) : PREMIUM_MULTIPLIER;
    const override = { multiplier };
    if (Number.isFinite(floor) && floor > 0) override.floorSek = floor;
    if (Number.isFinite(ceiling) && ceiling > 0) override.ceilingSek = ceiling;
    return override;
  }
  return null; // standard
}

/** Visar/döljer Custom-formuläret beroende på valt tier. */
function toggleCustomTier() {
  const box = document.getElementById("customTier");
  if (box) box.hidden = pricingTier !== "custom";
}

/**
 * Läser default-prissättningen (GET /api/pricing-config) och visar den som hint
 * så Leonard ser utgångsläget (default-multiplikator / aktiva intervall-tiers).
 */
function loadPricingHint() {
  const hint = document.getElementById("pricingHint");
  if (!hint) return;
  chrome.runtime.sendMessage({ type: "PRICING_CONFIG" }, (res) => {
    if (chrome.runtime.lastError || !res || !res.ok || !res.data || !res.data.rules) {
      hint.textContent = "Kunde inte hämta default-tier (importen använder din sparade default).";
      return;
    }
    const r = res.data.rules;
    const tiers = r.tiersEnabled && Array.isArray(r.tiers) && r.tiers.length
      ? `, intervall-tiers PÅ (${r.tiers.length} steg)`
      : "";
    hint.textContent = `Din default: ${r.defaultMultiplier}× på inköp, ${r.vatRatePercent}% moms${tiers}.`;
  });
}

async function loadPricingTier() {
  const sel = document.getElementById("pricingTier");
  if (!sel) return;
  const stored = await chrome.storage.sync.get(["pricingTier", "customTier"]);
  pricingTier = ["standard", "premium", "custom"].includes(stored.pricingTier) ? stored.pricingTier : "standard";
  sel.value = pricingTier;
  // Återställ ev. sparade Custom-värden.
  const c = stored.customTier || {};
  if (Number.isFinite(c.multiplier)) document.getElementById("ctMultiplier").value = c.multiplier;
  if (Number.isFinite(c.floorSek)) document.getElementById("ctFloor").value = c.floorSek;
  if (Number.isFinite(c.ceilingSek)) document.getElementById("ctCeiling").value = c.ceilingSek;
  toggleCustomTier();

  sel.addEventListener("change", () => {
    pricingTier = sel.value;
    toggleCustomTier();
    chrome.storage.sync.set({ pricingTier });
  });
  // Spara Custom-värdena medan Leonard skriver så de finns kvar nästa gång.
  for (const id of ["ctMultiplier", "ctFloor", "ctCeiling"]) {
    const inp = document.getElementById(id);
    if (!inp) continue;
    inp.addEventListener("change", () => {
      const ov = buildPricingOverride() || {};
      chrome.storage.sync.set({ customTier: ov });
    });
  }

  loadPricingHint();
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
    if (product.extractionOk) {
      sampleColors();
      checkSupplierStatus();
    }
  });
}

// Hämtar säljarens score/status (Feature 6) och visar en varning före import:
//   blocked → röd varning + kräver bekräftelse vid import
//   warning → gul toast (överväg annan leverantör)
//   good/okänd → ingen varning
function checkSupplierStatus() {
  const supplierId = product && product.supplier && product.supplier.supplierId;
  if (!supplierId) return;
  chrome.runtime.sendMessage({ type: "SUPPLIER_STATUS", supplierId }, (res) => {
    if (chrome.runtime.lastError || !res || !res.ok || !res.data) return;
    const d = res.data;
    supplierStatus = d;
    if (!d.known) return; // ingen historik → ingen varning
    const rate = typeof d.complaintRate === "number" ? d.complaintRate : 0;
    if (d.status === "blocked") {
      setStatus(
        `⚠️ Den här säljaren har hög klagomålsprocent (${rate}%) på dina tidigare imports. ` +
          "Du kan importera ändå — du får bekräfta vid klick.",
        "err",
      );
    } else if (d.status === "warning") {
      const why = rate > 5 ? `klagomål ${rate}%` : `leveranstid ${d.avgShipDays} dgr`;
      setStatus(`Säljarens prestanda är medel (${why}) — överväg alternativ leverantör.`, "warn");
    }
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

// --- Pre-import-check: dubblett (Feature 1) + konkurrentpris (Feature 2) ------

function sendMessageAsync(payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (res) => {
      if (chrome.runtime.lastError) return resolve(null);
      resolve(res);
    });
  });
}

/**
 * Kör dubblett- + konkurrentpris-check och visar en bekräftelse-modal.
 * Returnerar Promise<boolean>: true = fortsätt importen, false = avbryt.
 * Fail-open: om backend inte svarar (offline/timeout) tillåter vi import.
 */
async function preImportCheck(p) {
  const firstImage = (p.imageUrls && p.imageUrls[0]) || "";
  const title = p.rawTitle || "";
  const aeId = p.supplierProductId || "";

  const [dupRes, compRes] = await Promise.all([
    sendMessageAsync({ type: "CHECK_DUPLICATE", title, imageUrl: firstImage, aeId }),
    sendMessageAsync({ type: "COMPETITOR_PRICES", title }),
  ]);

  // apiCall-wrappern returnerar { ok, data } där data är route-svaret.
  const dup = dupRes && dupRes.ok && dupRes.data ? dupRes.data : null;
  const comp = compRes && compRes.ok && compRes.data ? compRes.data : null;

  const matches = (dup && Array.isArray(dup.matches) ? dup.matches : []);
  const prices = (comp && Array.isArray(comp.prices) ? comp.prices : []);
  const summary = comp && comp.summary ? comp.summary : null;

  // Ingen dubblett OCH ingen konkurrentdata → ingen modal, fortsätt direkt.
  if (matches.length === 0 && prices.length === 0) return true;

  return showPreImportModal(matches, prices, summary);
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/** Renderar bekräftelse-modalen och löser till true/false vid knapptryck. */
function showPreImportModal(matches, prices, summary) {
  return new Promise((resolve) => {
    const back = el("div", "fp-modal-backdrop");
    const modal = el("div", "fp-modal");
    modal.append(el("h2", null, "Innan import"));

    // --- Dubbletter ---
    if (matches.length > 0) {
      const strongest = matches[0];
      const heading =
        strongest.confidence > 0.9
          ? "⚠️ Liknande produkt finns REDAN i butiken"
          : "Möjlig dubblett i butiken";
      modal.append(el("h3", null, heading));
      for (const m of matches.slice(0, 5)) {
        const cls = m.confidence > 0.9 ? "fp-dup strong" : m.confidence >= 0.6 ? "fp-dup mild" : "fp-dup";
        const row = el("div", cls);
        row.append(el("span", "mt", m.matchType));
        const nameWrap = el("span");
        if (m.url) {
          const a = el("a", null, m.productName);
          a.href = m.url;
          a.target = "_blank";
          nameWrap.append(a);
        } else {
          nameWrap.textContent = m.productName;
        }
        nameWrap.append(el("span", "fp-muted", `  (${Math.round(m.confidence * 100)}%)`));
        row.append(nameWrap);
        modal.append(row);
      }
    }

    // --- Konkurrentpriser ---
    if (summary) {
      modal.append(el("h3", null, "Konkurrenter på svenska marknaden"));
      const rec = el("div", `fp-rec ${summary.signal || "none"}`, summary.message || "");
      modal.append(rec);
    }
    if (prices.length > 0) {
      const table = el("table", "fp-table");
      const thead = el("tr");
      thead.append(el("th", null, "Källa"), el("th", null, "Produkt"), el("th", null, "Pris"));
      table.append(thead);
      for (const p of prices.slice(0, 8)) {
        const tr = el("tr");
        tr.append(
          el("td", null, p.source),
          el("td", null, (p.title || "").slice(0, 30)),
          el("td", "fp-price", `${p.priceSek} kr`),
        );
        table.append(tr);
      }
      modal.append(table);
    }

    // --- Knappar ---
    const actions = el("div", "fp-actions");
    const cancel = el("button", "fp-cancel", "Avbryt");
    const proceed = el("button", "fp-proceed", "Importera ändå");
    cancel.addEventListener("click", () => {
      back.remove();
      resolve(false);
    });
    proceed.addEventListener("click", () => {
      back.remove();
      resolve(true);
    });
    actions.append(cancel, proceed);
    modal.append(actions);

    back.append(modal);
    document.body.append(back);
  });
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
  // Feature 6: blockerad säljare → kräv uttrycklig bekräftelse innan import.
  if (supplierStatus && supplierStatus.known && supplierStatus.status === "blocked") {
    const rate = typeof supplierStatus.complaintRate === "number" ? supplierStatus.complaintRate : 0;
    const ok = window.confirm(
      `⚠️ Den här säljaren har hög klagomålsprocent (${rate}%) på dina tidigare imports.\n\n` +
        "Importera ändå?",
    );
    if (!ok) {
      setStatus("Import avbruten — säljaren är blockerad.", "warn");
      return;
    }
  }
  // Feature 1 + 2: dubblett- och konkurrentpris-check FÖRE import. Visar en modal
  // med ev. liknande produkter + konkurrentpriser. Importen fortsätter bara om
  // Leonard klickar "Importera ändå". Tom check (inga dubbletter, ingen konkurrent-
  // data) hoppar över modalen så att normalflödet inte bromsas.
  setStatus("Kollar dubbletter & konkurrentpriser…");
  const proceed = await preImportCheck(product);
  if (!proceed) {
    setStatus("Import avbruten.", "warn");
    return;
  }

  $import.disabled = true;
  setStatus("Importerar…");

  // Baka in vald Marginal-tier som pricingOverride (null för Standard → backend
  // använder default-tiern). Sätts på produkten så background.js kan vidarebefordra.
  const override = buildPricingOverride();
  if (override) product.pricingOverride = override;
  else delete product.pricingOverride;

  chrome.runtime.sendMessage({ type: "IMPORT_PRODUCT", product, featureFlags: flagsWithMode() }, (res) => {
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
loadPricingTier();
load();
