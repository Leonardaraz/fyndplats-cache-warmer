// Säljar-score per AliExpress-leverantör (Feature 6).
//
// Spårar över tid hur olika AliExpress-säljare presterar för Fyndplats så att vi
// kan undvika säljare som börjar bli dåliga (höga klagomål, långa leveranstider).
//
// Wix Data-kollektion: FyndplatsSuppliers (en rad per AE-säljar-id)
//   _id              — supplierId (AE seller/store-id)
//   supplierId       — samma som _id (för query:bar tydlighet)
//   supplierName     — butiksnamn
//   supplierStoreUrl — länk till AE-store
//   aeRating         — AE:s egen 1–5 score (senast skrapad)
//   aeFollowers      — antal followers på AE-store (senast skrapad)
//   positiveFeedbackPct — AE:s feedback-% (0–100, bug 2026-06-02)
//   yearsOnAE        — år sedan säljaren öppnade på AE (bug 2026-06-02)
//   topBrand         — true om AE "Top Brand"-badge syns (bug 2026-06-02)
//   productsImported — antal av deras produkter vi importerat
//   importCount      — alias för productsImported (bug 2026-06-02 specifikation)
//   firstImportedAt  — alias för firstSeenAt (bug 2026-06-02 specifikation)
//   lastImportedAt   — senaste gången vi importerade från säljaren (bug 2026-06-02)
//   productsSold     — antal sålda enheter till våra kunder
//   avgShipDays      — genomsnittlig leveranstid (löpande medel av våra orders)
//   shipDaysSamples  — antal orders avgShipDays bygger på (för löpande medel)
//   complaintCount   — antal returer/klagomål kopplade till säljaren
//   complaintRate    — % av sålda enheter som klagats på (härlett, persisteras)
//   firstSeenAt      — ISO, första gången vi importerade från säljaren
//   lastUpdatedAt    — ISO, senaste mutationen
//   status           — "good" | "warning" | "blocked" (auto-uppdaterat)
//
// Mönstret speglar lib/restock/store.ts: egna fetch-helpers, 404/"unknown
// collection" → tom/null (kollektionen ej skapad än), annars throw med body.
// Kollektionen auto-skapas vid första skrivningen om den saknas i Wix, men skapa
// den gärna manuellt via scripts/ensure-supplier-collection.mjs för index.

import { getStore } from "../store/factory";
import { audit } from "../audit";
import { classifySellerOrigin, type SellerOriginClass } from "../aliexpress/eu-countries";

const WIX_BASE = "https://www.wixapis.com";

const COL = process.env.WIX_DATA_COL_SUPPLIERS ?? "FyndplatsSuppliers";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

export type SupplierStatus = "good" | "warning" | "blocked";

/** Skrapad säljardata från extensionen (AliExpress-produktsidan). */
export interface ScrapedSupplier {
  /** AE seller/store-id — obligatoriskt; utan det kan vi inte spåra säljaren. */
  supplierId: string;
  supplierName?: string;
  supplierStoreUrl?: string;
  /** AE:s egen säljar-score, 1–5. */
  aeRating?: number;
  aeFollowers?: number;
  /** AE:s feedback-% (0–100). Bug 2026-06-02. */
  positiveFeedbackPct?: number;
  /** År säljaren funnits på AliExpress. Bug 2026-06-02. */
  yearsOnAE?: number;
  /** True om AE:s "Top Brand"-badge syns. Bug 2026-06-02. */
  topBrand?: boolean;
  /**
   * Säljarens REGISTRERINGSLAND (store-profilens "Location"/DSA business-info),
   * ISO-2 eller fritext. SKILD från produktens ship-from-warehouse. Tom = ej skrapad.
   */
  sellerCountry?: string;
}

/** En rad i FyndplatsSuppliers. */
export interface SupplierRecord {
  supplierId: string;
  supplierName: string;
  supplierStoreUrl: string;
  aeRating: number | null;
  aeFollowers: number | null;
  // Bug 2026-06-02: utökade AE-metadata för riskbedömning.
  positiveFeedbackPct: number | null;
  yearsOnAE: number | null;
  topBrand: boolean;
  /** Säljarens registreringsland (ISO-2), senast skrapad. "" = okänt. */
  sellerCountry: string;
  /** EU_SELLER (ES/IT/FR/…) | NON_EU_SELLER (CN/RU/TR/…) | UNKNOWN. Härlett ur sellerCountry. */
  sellerCountryClass: SellerOriginClass;
  productsImported: number;
  productsSold: number;
  avgShipDays: number;
  shipDaysSamples: number;
  complaintCount: number;
  complaintRate: number;
  firstSeenAt: string;
  lastUpdatedAt: string;
  // Bug 2026-06-02 specifikations-alias (samma värden, separat namn).
  firstImportedAt: string;
  lastImportedAt: string;
  importCount: number;
  status: SupplierStatus;
}

// =====================================================================
// Rena (testbara) hjälpfunktioner — ingen Wix-åtkomst.
// =====================================================================

/**
 * Klagomålsprocent = andel sålda enheter som lett till ett klagomål/retur.
 * 0 sålda → 0 % (vi kan inte beräkna en rate utan försäljning; en säljare utan
 * sälj ska inte flaggas som dålig). Avrundas till 2 decimaler.
 */
export function computeComplaintRate(complaintCount: number, productsSold: number): number {
  if (!(productsSold > 0)) return 0;
  const rate = (complaintCount / productsSold) * 100;
  return Math.round((rate + Number.EPSILON) * 100) / 100;
}

/**
 * Säljar-status enligt heuristiken:
 *   complaintRate > 10%                      → blocked
 *   complaintRate > 5%                       → warning
 *   complaintRate ≤ 5% och avgShipDays > 30  → warning
 *   annars                                   → good
 */
export function computeSupplierStatus(input: {
  complaintRate: number;
  avgShipDays: number;
}): SupplierStatus {
  const { complaintRate, avgShipDays } = input;
  if (complaintRate > 10) return "blocked";
  if (complaintRate > 5) return "warning";
  if (avgShipDays > 30) return "warning";
  return "good";
}

/**
 * Uppdaterar ett löpande medel med ett nytt sampel. Returnerar nya medlet +
 * sampelantalet. Ren funktion (för avgShipDays).
 */
export function updateRunningAverage(
  currentAvg: number,
  currentSamples: number,
  newValue: number,
): { avg: number; samples: number } {
  const samples = currentSamples + 1;
  const avg = (currentAvg * currentSamples + newValue) / samples;
  return { avg: Math.round((avg + Number.EPSILON) * 100) / 100, samples };
}

// =====================================================================
// Wix Data-helpers (samma mönster som lib/restock/store.ts).
// =====================================================================

async function saveRow(id: string, data: object): Promise<void> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COL,
      dataItem: { id, dataCollectionId: COL, data: { _id: id, ...data } },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data save ${COL} (${res.status}): ${text.slice(0, 300)}`);
  }
}

async function getRow(id: string): Promise<SupplierRecord | null> {
  const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(COL)}`;
  const res = await fetch(url, { method: "GET", headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
      return null;
    }
    throw new Error(`Wix Data get ${COL} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItem?: { data?: SupplierRecord } };
  return body.dataItem?.data ?? null;
}

async function queryRows(limit = 1000): Promise<SupplierRecord[]> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COL,
      query: { filter: {}, sort: [{ fieldName: "lastUpdatedAt", order: "DESC" }], paging: { limit } },
    }),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text();
    if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
      return [];
    }
    throw new Error(`Wix Data query ${COL} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItems?: { data?: SupplierRecord }[] };
  return (body.dataItems ?? []).map((d) => d.data).filter((d): d is SupplierRecord => Boolean(d));
}

/**
 * Bygger en komplett (omstatusberäknad) rad från en bas + patchar. complaintRate
 * och status räknas alltid om från de slutgiltiga räknarna så de aldrig kan bli
 * inkonsekventa med complaintCount/productsSold/avgShipDays.
 */
function reconcile(base: SupplierRecord): SupplierRecord {
  const complaintRate = computeComplaintRate(base.complaintCount, base.productsSold);
  const status = computeSupplierStatus({ complaintRate, avgShipDays: base.avgShipDays });
  return { ...base, complaintRate, status };
}

function emptyRecord(supplierId: string, now: string): SupplierRecord {
  return {
    supplierId,
    supplierName: "",
    supplierStoreUrl: "",
    aeRating: null,
    aeFollowers: null,
    positiveFeedbackPct: null,
    yearsOnAE: null,
    topBrand: false,
    sellerCountry: "",
    sellerCountryClass: "UNKNOWN",
    productsImported: 0,
    productsSold: 0,
    avgShipDays: 0,
    shipDaysSamples: 0,
    complaintCount: 0,
    complaintRate: 0,
    firstSeenAt: now,
    lastUpdatedAt: now,
    firstImportedAt: now,
    lastImportedAt: now,
    importCount: 0,
    status: "good",
  };
}

export class SupplierStore {
  /**
   * Upsertar säljaren vid import och länkar produkten. Ökar productsImported och
   * uppdaterar de senast skrapade AE-fälten (namn/rating/followers). Returnerar
   * den sparade raden, eller null om supplierData saknar supplierId (kan ej spåras).
   */
  async recordImport(
    supplier: ScrapedSupplier,
    productWixId: string,
  ): Promise<SupplierRecord | null> {
    const supplierId = (supplier.supplierId ?? "").trim();
    if (!supplierId) return null;
    const now = new Date().toISOString();
    const existing = await getRow(supplierId);
    const base = existing ?? emptyRecord(supplierId, now);

    const updated = reconcile({
      ...base,
      supplierName: supplier.supplierName?.trim() || base.supplierName,
      supplierStoreUrl: supplier.supplierStoreUrl?.trim() || base.supplierStoreUrl,
      aeRating: typeof supplier.aeRating === "number" && supplier.aeRating > 0 ? supplier.aeRating : base.aeRating,
      aeFollowers:
        typeof supplier.aeFollowers === "number" && supplier.aeFollowers >= 0
          ? supplier.aeFollowers
          : base.aeFollowers,
      // Bug 2026-06-02: utökade AE-metadata. Bara skriv om vi fick ett "äkta"
      // värde (skrapan returnerar 0/false som default när fältet saknades).
      positiveFeedbackPct:
        typeof supplier.positiveFeedbackPct === "number" && supplier.positiveFeedbackPct > 0
          ? supplier.positiveFeedbackPct
          : base.positiveFeedbackPct,
      yearsOnAE:
        typeof supplier.yearsOnAE === "number" && supplier.yearsOnAE > 0
          ? supplier.yearsOnAE
          : base.yearsOnAE,
      topBrand: supplier.topBrand === true ? true : base.topBrand,
      // Säljarland: skriv bara om vi faktiskt skrapade ett land den här gången —
      // annars behåll tidigare känt värde (en tom scrape ska inte nolla landet).
      sellerCountry: (supplier.sellerCountry ?? "").trim() || base.sellerCountry,
      sellerCountryClass: (supplier.sellerCountry ?? "").trim()
        ? classifySellerOrigin(supplier.sellerCountry)
        : base.sellerCountryClass,
      productsImported: base.productsImported + 1,
      importCount: base.importCount + 1,
      lastUpdatedAt: now,
      lastImportedAt: now,
    });
    await saveRow(supplierId, updated);
    await audit("supplier-import", supplierId, `produkt ${productWixId} (totalt ${updated.productsImported})`);
    return updated;
  }

  /**
   * Registrerar en såld enhet (kallas vid order). supplierId resolvas från
   * mappningen om den inte skickas med. shipDays uppdaterar löpande medel om angivet.
   */
  async recordOrder(
    productWixId: string,
    opts: { supplierId?: string; shipDays?: number; units?: number } = {},
  ): Promise<SupplierRecord | null> {
    const supplierId = (opts.supplierId ?? (await resolveSupplierId(productWixId)) ?? "").trim();
    if (!supplierId) return null;
    const now = new Date().toISOString();
    const base = (await getRow(supplierId)) ?? emptyRecord(supplierId, now);

    let avgShipDays = base.avgShipDays;
    let shipDaysSamples = base.shipDaysSamples;
    if (typeof opts.shipDays === "number" && opts.shipDays >= 0) {
      const r = updateRunningAverage(base.avgShipDays, base.shipDaysSamples, opts.shipDays);
      avgShipDays = r.avg;
      shipDaysSamples = r.samples;
    }
    const units = typeof opts.units === "number" && opts.units > 0 ? Math.trunc(opts.units) : 1;

    const updated = reconcile({
      ...base,
      productsSold: base.productsSold + units,
      avgShipDays,
      shipDaysSamples,
      lastUpdatedAt: now,
    });
    await saveRow(supplierId, updated);
    return updated;
  }

  /**
   * Registrerar ett klagomål/retur. supplierId resolvas från mappningen om det
   * inte skickas med. complaintRate + status räknas om.
   */
  async recordComplaint(
    productWixId: string,
    reason: string,
    opts: { supplierId?: string } = {},
  ): Promise<SupplierRecord | null> {
    const supplierId = (opts.supplierId ?? (await resolveSupplierId(productWixId)) ?? "").trim();
    if (!supplierId) return null;
    const now = new Date().toISOString();
    const base = (await getRow(supplierId)) ?? emptyRecord(supplierId, now);

    const updated = reconcile({
      ...base,
      complaintCount: base.complaintCount + 1,
      lastUpdatedAt: now,
    });
    await saveRow(supplierId, updated);
    await audit("supplier-complaint", supplierId, `${reason.slice(0, 120)} (produkt ${productWixId})`);
    return updated;
  }

  /** Nuvarande status + rad för en säljare. null = okänd säljare (ingen rad än). */
  async getStatus(supplierId: string): Promise<SupplierRecord | null> {
    const id = (supplierId ?? "").trim();
    if (!id) return null;
    return getRow(id);
  }

  /** Alla säljare (för admin-vy / queue-badge). */
  async listAll(limit = 1000): Promise<SupplierRecord[]> {
    return queryRows(limit);
  }
}

/** Slår upp en produkts supplierId via mappningen (för order-/klagomålsflöden). */
async function resolveSupplierId(productWixId: string): Promise<string | null> {
  try {
    const mapping = await getStore().getMappingByWixProductId(productWixId);
    return mapping?.supplierId ?? null;
  } catch {
    return null;
  }
}

let singleton: SupplierStore | null = null;
export function getSupplierStore(): SupplierStore {
  if (!singleton) singleton = new SupplierStore();
  return singleton;
}

// Bekväma fristående wrappers (matchar Feature 6-spec:ens funktionsnamn).
export function recordSupplierImport(
  supplier: ScrapedSupplier,
  productWixId: string,
): Promise<SupplierRecord | null> {
  return getSupplierStore().recordImport(supplier, productWixId);
}
export function recordOrder(
  productWixId: string,
  opts?: { supplierId?: string; shipDays?: number; units?: number },
): Promise<SupplierRecord | null> {
  return getSupplierStore().recordOrder(productWixId, opts);
}
export function recordComplaint(
  productWixId: string,
  reason: string,
  opts?: { supplierId?: string },
): Promise<SupplierRecord | null> {
  return getSupplierStore().recordComplaint(productWixId, reason, opts);
}
export function getSupplierStatus(supplierId: string): Promise<SupplierRecord | null> {
  return getSupplierStore().getStatus(supplierId);
}
