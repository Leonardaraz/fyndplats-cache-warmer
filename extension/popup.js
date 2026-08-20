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
const $nameEdit = document.getElementById("nameEdit");
const $import = document.getElementById("import");
const $status = document.getElementById("status");

// --- Manuella variantnamn (rått värde → Leonards namn) -------------------
// Wix V3 key-låser choice.name när produkten skapas — variantnamn kan ALDRIG
// ändras i efterhand utan att mappningen (wixVariantId ↔ AE-SKU) går sönder.
// Därför är popupen enda tillfället att döpa dem. Kartan lever på modulnivå så
// ifyllda namn överlever en re-render (t.ex. DS-API-räddningen som byter ut
// variantlistan) och skickas som variantNameOverrides i import-payloaden.
// Tomt fält = auto-översättning (tabell → cache → Haiku) precis som förut.
let nameOverrides = {};
// Manuella AXELNAMN (rå axel → Leonards namn), t.ex. { Color: "Kulör" }.
// Samma lager 0-regler server-side som värdena; key-låses i Wix vid skapandet.
let axisNameEdits = {};
let nameEditOpen = false;

// Frakt-axlar ("Ships From" m.fl.) importeras inte som riktiga valaxlar och
// ska aldrig gå att döpa i sektionen (bug: tom "SHIPS FROM"-rad 2026-08-08).
const SHIP_AXIS_EDIT_RE = /ships?\s*from|ship\s*country|warehouse/i;

// Lagerkod (ISO-2) för en variant: explicit shipFrom-fält först, annars
// härledd ur variantens frakt-axel-VÄRDE ("Ships From": "Poland" → PL via
// FP_EU.NAME_TO_ISO). Flerlager-listningar bär ofta lagret bara som property
// (lasertag-fyndet 2026-08-09: alla rader visade "?" trots olika lager).
function variantShipCode(v) {
  const explicit = String((v && v.shipFrom) || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(explicit)) return explicit;
  if (explicit && globalThis.FP_EU.NAME_TO_ISO[explicit]) return globalThis.FP_EU.NAME_TO_ISO[explicit];
  for (const [axis, val] of Object.entries((v && v.options) || {})) {
    if (!SHIP_AXIS_EDIT_RE.test(axis)) continue;
    const raw = String(val || "").trim().toUpperCase();
    if (!raw) continue;
    if (/^[A-Z]{2}$/.test(raw)) return raw;
    if (globalThis.FP_EU.NAME_TO_ISO[raw]) return globalThis.FP_EU.NAME_TO_ISO[raw];
    for (const [name, iso] of Object.entries(globalThis.FP_EU.NAME_TO_ISO)) {
      if (raw.includes(name)) return iso;
    }
  }
  return "";
}

// EU-FÖRST-DEFAULT (Leonards regel 2026-08-09): finns minst en EU-lager-rad
// förbockas BARA EU-raderna — Kina/okänt kräver ett aktivt val. Körs EN gång
// per produkt (efter att variantlistan är slutgiltig) så användarens egna
// bockar aldrig skrivs över av en senare re-render.
let euDefaultApplied = false;
/** Returnerar ett statusmeddelande (eller null) — anroparen bakar in det i sin
 *  egen setStatus så EU-varningen inte skrivs över av senare statusrader. */
function applyEuFirstDefaults() {
  if (euDefaultApplied || !product || !Array.isArray(product.variants)) return null;
  const codes = product.variants.map((v) => variantShipCode(v));
  if (!codes.some((c) => c && EU_WAREHOUSE_CODES.has(c))) return null; // inga EU-rader → rör inget
  euDefaultApplied = true;
  let unchecked = 0;
  product.variants.forEach((v, i) => {
    const isEu = codes[i] && EU_WAREHOUSE_CODES.has(codes[i]);
    if (!isEu && v.included) {
      v.included = false;
      unchecked++;
    }
  });
  if (unchecked === 0) return null;
  return (
    `EU-först: ${unchecked} rad(er) från Kina/okänt lager avbockade automatiskt. ` +
    "Bocka i dem manuellt om du verkligen vill importera icke-EU-lager."
  );
}

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
    // FRI marginal (Leonards beslut 2026-08-06) — gamla taket 5× är borta.
    // Kvar finns bara feltrycks-vakter: under 0.1 eller över 50 är aldrig en
    // avsedd multiplikator (t.ex. "105" i stället för "1,05"). Saknas/ogiltig
    // → premium-default så vi aldrig skickar en trasig override.
    const multiplier = Number.isFinite(mult) ? Math.min(50, Math.max(0.1, mult)) : PREMIUM_MULTIPLIER;
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
    // Sedan 2026-08-06: multiplikatorn ger SLUTPRISET direkt — ingen moms
    // läggs på ovanpå (inköpspriset är redan inkl. moms på EU-lagret).
    hint.textContent = `Din default: ${r.defaultMultiplier}× på inköp = slutpris (ingen moms ovanpå)${tiers}.`;
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
    // Bild-färgsampling är bara meningsfull om vi faktiskt fick produktdata.
    if (product.extractionOk) {
      // DOM-fallback-varianter (dom-/idx-id) bär sidans synliga pris på ALLA
      // varianter — hämta riktiga per-SKU-priser så listan visar sanningen.
      const needsDsRefresh = product.variants.some((v) =>
        /^(dom-|idx-)/.test(String(v.supplierVariantId || "")),
      );
      // EU-först appliceras när variantlistan är SLUTGILTIG: direkt här om
      // ingen DS-uppfräschning väntar, annars inne i refresh-flödet (som byter
      // ut listan) så användarens bockar aldrig nollas av en senare re-render.
      const euMsg = needsDsRefresh ? null : applyEuFirstDefaults();
      render();
      if (euMsg) setStatus(euMsg, "warn");
      sampleColors();
      checkSupplierStatus();
      if (needsDsRefresh) {
        void refreshVariantPricesViaDsApi();
      }
    } else {
      render();
      // Skrapan misslyckades (nya PC-sidan saknar ofta inbäddad SKU-JSON och
      // byter pris-markup mellan A/B-varianter) → försök API-räddningen.
      void rescueViaDsApi();
    }
  });
}

// Räddningsväg när skrapan inte fick ut komplett produktdata: hämta det
// auktoritativa svaret via backendens /api/aliexpress/product (officiella
// DS-API:t — per-SKU-pris i USD, lagersaldo, lagerland). Skrapade fält behålls
// där de finns (DOM:ens bilder/beskrivning/recensioner är rikare än API:ts);
// API:t är facit för varianter/pris/lager.
async function rescueViaDsApi() {
  const id = String((product && product.supplierProductId) || "");
  // content.js sätter ett syntetiskt Date.now()-id när URL:en inte matchar
  // /item/<id>.html — då finns inget att slå upp.
  if (!/^\d{6,}$/.test(id)) return;
  setStatus("Sidan kunde inte läsas — hämtar produktdata via AliExpress-API…", "warn");
  const res = await sendMessageAsync({ type: "DS_PRODUCT", productId: id });
  const ds = res && res.ok && res.data;
  const dsVariants = (ds && Array.isArray(ds.variants) ? ds.variants : []).filter(
    (v) => Number(v.costUsd) > 0,
  );
  if (!dsVariants.length) {
    const why = (res && res.error) || (ds ? "API:t gav inga priser" : "tomt svar");
    setStatus(
      `AliExpress-sidan kunde inte läsas, och API-uppslaget misslyckades (${why}).\n` +
        'Försök ladda om sidan, eller använd "Öppna orderläge" för manuell inmatning.',
      "err",
    );
    return;
  }
  product.variants = dsVariants;
  if (!product.rawTitle && ds.rawTitle) product.rawTitle = ds.rawTitle;
  if (!product.rawDescription && ds.rawDescription) product.rawDescription = ds.rawDescription;
  if ((!product.imageUrls || !product.imageUrls.length) && Array.isArray(ds.imageUrls)) {
    product.imageUrls = ds.imageUrls;
  }
  if (Array.isArray(ds.shipsFrom) && ds.shipsFrom.length) {
    product.shipsFrom = [...new Set([...(product.shipsFrom || []), ...ds.shipsFrom])].sort();
  }
  const stocks = dsVariants.map((v) => v.stock).filter((s) => typeof s === "number");
  if (stocks.length) product.inStock = stocks.some((s) => s > 0);
  product.quality = {
    hasTitle: !!product.rawTitle,
    hasImages: (product.imageUrls || []).length > 0,
    hasPrice: true,
    hasRealVariants: dsVariants.length > 1,
  };
  product.extractionOk = product.quality.hasTitle && product.quality.hasImages;
  // Skrapans "saknar pris"-varning är åtgärdad; rendera om med API-datan.
  product._warnings = [];
  const euMsg = applyEuFirstDefaults();
  render();
  if (product.extractionOk) {
    setStatus(
      "Priser & lager hämtade via AliExpress-API:t (sidan kunde inte skrapas). " +
        "Kontrollera varianterna som vanligt före import." +
        (euMsg ? `\n${euMsg}` : ""),
      euMsg ? "warn" : "ok",
    );
    sampleColors();
    checkSupplierStatus();
  } else {
    const missing = [];
    if (!product.quality.hasTitle) missing.push("titel");
    if (!product.quality.hasImages) missing.push("bild");
    setStatus(
      `API:t gav priser men produktdata saknas fortfarande (${missing.join(", ")}).\n` +
        'Använd "Öppna orderläge" för manuell inmatning.',
      "err",
    );
  }
}

/**
 * Pris-verifiering när skrapan föll på DOM-fallbacken (dom-/idx-varianter):
 * sidan visar bara den VALDA variantens pris, så alla varianter fick samma
 * costUsd — dyrare varianter skulle underprisas rejält. Hämta per-SKU-facit
 * via DS-API:t och ersätt variantlistan INNAN Leonard hinner bocka/importera.
 * Servern gör samma avstämning vid import (fail-open där med), men här ser
 * Leonard dessutom rätt priser i listan när han väljer marginal.
 * Best-effort: misslyckas uppslaget behålls DOM-varianterna + skrapans varning.
 */
async function refreshVariantPricesViaDsApi() {
  const id = String((product && product.supplierProductId) || "");
  if (!/^\d{6,}$/.test(id)) return;
  const res = await sendMessageAsync({ type: "DS_PRODUCT", productId: id });
  const ds = res && res.ok && res.data;
  const dsVariants = (ds && Array.isArray(ds.variants) ? ds.variants : []).filter(
    (v) => Number(v.costUsd) > 0,
  );
  if (!dsVariants.length) {
    // Listan förblir skrapans — den är nu slutgiltig → EU-först får köra.
    const euMsg = applyEuFirstDefaults();
    render();
    setStatus(
      "OBS: kunde inte verifiera per-variant-priserna via AliExpress-API:t — " +
        "alla varianter visar sidans baspris. Kontrollera priserna extra noga." +
        (euMsg ? `\n${euMsg}` : ""),
      "warn",
    );
    return;
  }
  // API:t är facit för varianter/pris/lager; skrapans media/copy behålls.
  product.variants = dsVariants;
  // ...men INTE variantbildkartan. Den är nycklad på skrapans optionsvärden och
  // matchar ingenting när listan byts mot DS:s värden. Kvarlämnad är den värre
  // än tom: serverns backfill kräver en HELT tom karta för att kicka in
  // (needsSwatchBackfill, lib/import/variant-images.ts), så en stale karta ger
  // noll kopplade variantbilder OCH ~25 s Wix-försök att koppla värden som inte
  // finns. Tömd får servern bygga om den rätt ur DS per-SKU-bilderna.
  product.swatchImages = {};
  product.optionColorCodes = {};
  const euMsg = applyEuFirstDefaults();
  if (Array.isArray(ds.shipsFrom) && ds.shipsFrom.length) {
    product.shipsFrom = [...new Set([...(product.shipsFrom || []), ...ds.shipsFrom])].sort();
  }
  const stocks = dsVariants.map((v) => v.stock).filter((s) => typeof s === "number");
  if (stocks.length) product.inStock = stocks.some((s) => s > 0);
  // DOM-varningen om baspris är åtgärdad — rensa så den inte skrämmer i onödan.
  product._warnings = (product._warnings || []).filter((w) => !/baspriset/.test(w));
  render();
  setStatus(
    "Per-variant-priser & lager hämtade via AliExpress-API:t." + (euMsg ? `\n${euMsg}` : ""),
    euMsg ? "warn" : "ok",
  );
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
    // Tomma värden filtreras (flerlager-listningar utan visningsnamn gav
    // rader som bara hette "/ ($37.43)" — VATOS-lastbilen 2026-08-09).
    const optText =
      Object.values(v.options)
        .filter((x) => String(x || "").trim())
        .join(" / ") || (product.variants.length > 1 ? `Variant ${i + 1}` : "Standard");
    label.innerHTML = `${optText} <span class="cost">($${v.costUsd})</span>`;
    row.append(cb, label);
    // Per-variant EU/CN-badge (härledd ur shipFrom ELLER frakt-axelns värde).
    row.append(badgeForShipFrom(variantShipCode(v) || v.shipFrom));
    $variants.append(row);
  });

  renderNameEdit();

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

/**
 * Sektionen "✏️ Variantnamn i butiken": ett textfält per UNIKT rått optionsvärde
 * (grupperat per axel när produkten har flera). Det Leonard skriver blir
 * variantens permanenta namn i Wix — tomt fält = auto-översättning som vanligt.
 * Byggs om vid varje render (DS-räddningen kan byta variantlista); ifyllda namn
 * återfylls från nameOverrides så inget tappas.
 */
function renderNameEdit() {
  $nameEdit.innerHTML = "";
  if (!product || !Array.isArray(product.variants) || product.variants.length === 0) return;

  // Unika råvärden per axel, i först-sedd-ordning (samma som variantlistan).
  // Frakt-axlar och tomma värden hoppas över — de är inte döpbara valaxlar
  // (buggen 2026-08-08: en tom "SHIPS FROM"-rad renderades med namnfält).
  const valuesByAxis = new Map();
  for (const v of product.variants) {
    for (const [axis, val] of Object.entries(v.options || {})) {
      if (SHIP_AXIS_EDIT_RE.test(axis)) continue;
      if (!String(val || "").trim()) continue;
      if (!valuesByAxis.has(axis)) valuesByAxis.set(axis, []);
      const arr = valuesByAxis.get(axis);
      if (!arr.includes(val)) arr.push(val);
    }
  }
  if (valuesByAxis.size === 0) return; // enda-variant-produkt utan options

  const details = document.createElement("details");
  details.className = "name-edit";
  details.open = nameEditOpen;
  details.addEventListener("toggle", () => (nameEditOpen = details.open));
  const summary = document.createElement("summary");
  summary.textContent = "✏️ Variantnamn i butiken (valfritt)";
  details.append(summary);
  const hint = document.createElement("div");
  hint.className = "ne-hint";
  hint.textContent =
    "Namnet låses i Wix vid importen och kan inte ändras efteråt. " +
    "Tomt fält = automatisk svensk översättning.";
  details.append(hint);

  for (const [axis, values] of valuesByAxis) {
    // Axelrubriken är också redigerbar (Leonards begäran 2026-08-08): rå-namnet
    // till vänster, namnfält till höger — precis som värderaderna, alltid synlig
    // även för en-axel-produkter så "Color"/"Size" går att döpa om före importen.
    const axisRow = document.createElement("div");
    axisRow.className = "ne-row ne-axis-row";
    const axisLabel = document.createElement("span");
    axisLabel.className = "ne-raw ne-axis";
    axisLabel.textContent = axis;
    axisLabel.title = `Axelnamn: ${axis}`;
    const axisInput = document.createElement("input");
    axisInput.type = "text";
    axisInput.maxLength = 60;
    axisInput.placeholder = "axelnamn: auto";
    if (axisNameEdits[axis]) {
      axisInput.value = axisNameEdits[axis];
      axisInput.classList.add("ne-set");
    }
    axisInput.addEventListener("input", () => {
      const t = axisInput.value;
      if (t.trim()) axisNameEdits[axis] = t;
      else delete axisNameEdits[axis];
      axisInput.classList.toggle("ne-set", Boolean(t.trim()));
    });
    axisRow.append(axisLabel, axisInput);
    details.append(axisRow);
    for (const raw of values) {
      const row = document.createElement("div");
      row.className = "ne-row";
      const rawEl = document.createElement("span");
      rawEl.className = "ne-raw";
      rawEl.textContent = raw;
      rawEl.title = raw;
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 60;
      input.placeholder = "auto (svensk översättning)";
      if (nameOverrides[raw]) {
        input.value = nameOverrides[raw];
        input.classList.add("ne-set");
      }
      input.addEventListener("input", () => {
        const t = input.value;
        if (t.trim()) nameOverrides[raw] = t;
        else delete nameOverrides[raw];
        input.classList.toggle("ne-set", Boolean(t.trim()));
      });
      row.append(rawEl, input);
      details.append(row);
    }
  }
  $nameEdit.append(details);
}

/**
 * Samlar ihop de manuella namnen för payloaden — bara värden som faktiskt
 * förekommer i de VALDA varianterna skickas (avbockade varianters värden och
 * förlegade nycklar efter en DS-räddning filtreras bort), trimmade och cappade
 * till samma 60 tecken som API-schemat kräver.
 */
function collectNameOverrides(chosenVariants) {
  const chosenValues = new Set();
  for (const v of chosenVariants) {
    for (const val of Object.values(v.options || {})) chosenValues.add(val);
  }
  const out = {};
  for (const [raw, name] of Object.entries(nameOverrides)) {
    const t = String(name || "").trim().slice(0, 60);
    // raw ≤160: API-schemats nyckeltak — en override på ett extremt långt
    // råvärde ska hoppas över tyst, inte fälla HELA importen med 422.
    if (t && raw.length <= 160 && chosenValues.has(raw)) out[raw] = t;
  }
  return Object.keys(out).length ? out : null;
}

/** Samma insamling för AXELNAMN — bara axlar som förekommer i de valda
 *  varianterna, aldrig frakt-axlar, nyckeltak 80 (API-schemats gräns). */
function collectAxisOverrides(chosenVariants) {
  const chosenAxes = new Set();
  for (const v of chosenVariants) {
    for (const axis of Object.keys(v.options || {})) {
      if (!SHIP_AXIS_EDIT_RE.test(axis)) chosenAxes.add(axis);
    }
  }
  const out = {};
  for (const [axis, name] of Object.entries(axisNameEdits)) {
    const t = String(name || "").trim().slice(0, 60);
    if (t && axis.length <= 80 && chosenAxes.has(axis)) out[axis] = t;
  }
  return Object.keys(out).length ? out : null;
}

// --- Pre-import-check: dubblett (Feature 1) ----------------------------------

function sendMessageAsync(payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (res) => {
      if (chrome.runtime.lastError) return resolve(null);
      resolve(res);
    });
  });
}

/**
 * Kör dubblett-check och visar en bekräftelse-modal.
 * Returnerar Promise<boolean>: true = fortsätt importen, false = avbryt.
 * Fail-open: om backend inte svarar (offline/timeout) tillåter vi import.
 */
async function preImportCheck(p) {
  const firstImage = (p.imageUrls && p.imageUrls[0]) || "";
  const title = p.rawTitle || "";
  const aeId = p.supplierProductId || "";

  const dupRes = await sendMessageAsync({ type: "CHECK_DUPLICATE", title, imageUrl: firstImage, aeId });

  // apiCall-wrappern returnerar { ok, data } där data är route-svaret.
  const dup = dupRes && dupRes.ok && dupRes.data ? dupRes.data : null;
  const matches = (dup && Array.isArray(dup.matches) ? dup.matches : []);

  // Ingen dubblett → ingen modal, fortsätt direkt (och ingen kringgångs-flagga).
  if (matches.length === 0) {
    delete p.allowDuplicate;
    return true;
  }

  const proceed = await showPreImportModal(matches);
  // "Importera ändå" = MEDVETET val att importera trots dubblettvarning →
  // flaggan följer med payloaden så serverns hårda dubblett-spärr (409 på
  // samma supplierProductId, PR #369) också kliver åt sidan. Dagens server
  // utan spärren ignorerar okända fält — ofarligt tills den landar.
  if (proceed) p.allowDuplicate = true;
  else delete p.allowDuplicate;
  return proceed;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/** Renderar bekräftelse-modalen och löser till true/false vid knapptryck. */
function showPreImportModal(matches) {
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
  // Feature 1: dubblett-check FÖRE import. Visar en modal med ev. liknande
  // produkter. Importen fortsätter bara om Leonard klickar "Importera ändå".
  // Tom check (inga dubbletter) hoppar över modalen så normalflödet inte bromsas.
  setStatus("Kollar dubbletter…");
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

  // Manuella variantnamn (bara för de valda varianterna) → payloaden. Namnen
  // key-låses i Wix vid skapandet, så detta är enda stället de kan sättas.
  const names = collectNameOverrides(chosen);
  if (names) product.variantNameOverrides = names;
  else delete product.variantNameOverrides;
  const axisNames = collectAxisOverrides(chosen);
  if (axisNames) product.axisNameOverrides = axisNames;
  else delete product.axisNameOverrides;

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
