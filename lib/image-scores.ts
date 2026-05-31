// lib/image-scores.ts
//
// Bildkvalitets-poäng som styr ordningen på startsida, kategoriernas första rad
// och "Veckans fynd". Poängen produceras offline av scripts/score-images.mjs
// (Claude Haiku 4.5 vision) och lever i TVÅ lager:
//
//   1. data/image-scores.json  — committad snapshot. DET här läser storefronten
//      vid render (noll latency, alltid tillgängligt — samma mönster som
//      data/variant-images.json). Driver all SORTERING.
//   2. Wix Data-collection FyndplatsImageScores — källa/persistens. Innehåller
//      dessutom merchant-flaggan `hidden` (Dölj från Veckans fynd) som togglas i
//      /admin/image-issues. Läses live (ISR-cachat) och läggs som overlay ovanpå
//      snapshoten så en toggle i produktion slår igenom utan ny deploy.
//
// Degraderar tyst: saknas Wix-token (lokal dev) eller collectionen → bara
// snapshoten används, inga produkter göms.

import scoresFile from "../data/image-scores.json";

export type ImageScoreRecord = {
  slug: string;
  name: string;
  mainImageScore: number;
  allImageScores: number[];
  flags: string[];
  reason: string;
  analyzedAt: string;
};

type ScoresFile = { generatedAt: string; model: string; count: number; scores: Record<string, ImageScoreRecord> };

const FILE = scoresFile as ScoresFile;
const SCORES: Record<string, ImageScoreRecord> = FILE.scores || {};

/** Tröskel för "topp-nivå": Veckans fynd kräver score > FEATURED_MIN_SCORE. */
export const FEATURED_MIN_SCORE = 75;
/** Score under detta = problembild (visas i /admin/image-issues). */
export const PROBLEM_MAX_SCORE = 50;
/** Neutral poäng för produkter som ännu inte hunnit poängsättas. */
export const DEFAULT_SCORE = 60;

export function imageScoreOf(productId: string): number {
  return SCORES[productId]?.mainImageScore ?? DEFAULT_SCORE;
}

export function imageRecordOf(productId: string): ImageScoreRecord | undefined {
  return SCORES[productId];
}

export function allScores(): Record<string, ImageScoreRecord> {
  return SCORES;
}

export function scoresMeta() {
  return { generatedAt: FILE.generatedAt, model: FILE.model, count: FILE.count };
}

// Svenska etiketter för flaggorna (admin-UI).
export const FLAG_LABELS: Record<string, string> = {
  watermark: "Vattenstämpel",
  badge: "Leverantörsbadge",
  chinese_text: "Kinesisk text",
  baked_text: "Inbränd text",
  typo: "Stavfel",
  collage: "Collage",
  busy_background: "Rörig bakgrund",
  blurry: "Suddig",
  amateur: "Amatörfoto",
};

export function flagLabel(flag: string): string {
  return FLAG_LABELS[flag] || flag;
}

/** Föreslagen åtgärd givet score — visas i /admin/image-issues. */
export function suggestedAction(score: number): string {
  if (score < 35) return "Dölj från Veckans fynd";
  if (score < PROBLEM_MAX_SCORE) return "Byt bild";
  return "OK som den är";
}

// ---------------------------------------------------------------------------
// Wix Data-overlay: live `hidden`-flaggor (merchant-styrt) + ev. nyare poäng.
// ---------------------------------------------------------------------------

const WIX_BASE = "https://www.wixapis.com";
const COL = "FyndplatsImageScores";

function wixDataHeaders(): Record<string, string> | null {
  const token = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) return null;
  return { "Content-Type": "application/json", Authorization: token, "wix-site-id": siteId };
}

type WixRow = { _id?: string; productId?: string; mainImageScore?: number; hidden?: boolean; flags?: string[] };

/**
 * Produkter som merchant har gömt från Veckans fynd (hidden=true i Wix Data).
 * ISR-cachat 10 min via fetch-revalidate. Returnerar tom mängd om token saknas
 * eller anropet failar — storefronten fortsätter fungera, inget göms av misstag.
 */
export async function getHiddenFromFeatured(): Promise<Set<string>> {
  const h = wixDataHeaders();
  if (!h) return new Set();
  try {
    const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        dataCollectionId: COL,
        query: { filter: { hidden: true }, paging: { limit: 500 } },
      }),
      next: { revalidate: 600, tags: ["image-scores"] },
    });
    if (!res.ok) return new Set();
    const body = (await res.json()) as { dataItems?: { data?: WixRow }[] };
    const ids = (body.dataItems || [])
      .map((d) => d.data?._id || d.data?.productId)
      .filter((x): x is string => Boolean(x));
    return new Set(ids);
  } catch {
    return new Set();
  }
}

// ---------------------------------------------------------------------------
// Admin: läs live-rader (för /admin/image-issues) + toggla hidden. Endast
// server-side (route handlers) — kräver WIX_API_KEY. Kastar vid fel så admin-
// UI:t kan visa en tydlig felruta i stället för att tyst svälja.
// ---------------------------------------------------------------------------

export type WixScoreRow = { productId: string; mainImageScore: number; hidden: boolean; flags: string[]; slug?: string; name?: string };

function requireWixHeaders(): Record<string, string> {
  const h = wixDataHeaders();
  if (!h) throw new Error("WIX_API_KEY/WIX_SITE_ID saknas — kan inte nå Wix Data.");
  return h;
}

/** Alla rader i FyndplatsImageScores → Map<productId, rad>. Tom map om collection saknas. */
export async function getWixScoreRows(): Promise<Map<string, WixScoreRow>> {
  const h = wixDataHeaders();
  if (!h) return new Map();
  const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ dataCollectionId: COL, query: { paging: { limit: 1000 } } }),
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return new Map();
    throw new Error(`Wix Data query ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const body = (await res.json()) as { dataItems?: { data?: Record<string, unknown> }[] };
  const map = new Map<string, WixScoreRow>();
  for (const it of body.dataItems || []) {
    const d = it.data || {};
    const id = String(d._id || d.productId || "");
    if (!id) continue;
    map.set(id, {
      productId: id,
      mainImageScore: Number(d.mainImageScore) || 0,
      hidden: Boolean(d.hidden),
      flags: Array.isArray(d.flags) ? (d.flags as string[]) : [],
      slug: d.slug ? String(d.slug) : undefined,
      name: d.name ? String(d.name) : undefined,
    });
  }
  return map;
}

/** Toggla "Dölj från Veckans fynd". Read-modify-write så övriga fält bevaras. */
export async function setHidden(productId: string, hidden: boolean): Promise<void> {
  const h = requireWixHeaders();
  let data: Record<string, unknown> = { _id: productId, productId };
  try {
    const g = await fetch(
      `${WIX_BASE}/data/v2/items/${encodeURIComponent(productId)}?dataCollectionId=${COL}`,
      { method: "GET", headers: h, cache: "no-store" },
    );
    if (g.ok) {
      const b = (await g.json()) as { dataItem?: { data?: Record<string, unknown> } };
      if (b.dataItem?.data) data = b.dataItem.data;
    }
  } catch { /* ny rad */ }
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ dataCollectionId: COL, dataItem: { id: productId, dataCollectionId: COL, data: { ...data, hidden } } }),
  });
  if (!res.ok) throw new Error(`Wix Data save ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/** Skriv (upsert) en färsk poäng-rad. Bevarar ev. satt `hidden`. Används av admin-rerun. */
export async function upsertScoreRecord(rec: {
  productId: string; slug: string; name: string;
  mainImageScore: number; allImageScores: number[]; flags: string[]; reason: string; analyzedAt: string;
}): Promise<void> {
  const h = requireWixHeaders();
  let hidden = false;
  try {
    const g = await fetch(
      `${WIX_BASE}/data/v2/items/${encodeURIComponent(rec.productId)}?dataCollectionId=${COL}`,
      { method: "GET", headers: h, cache: "no-store" },
    );
    if (g.ok) { const b = await g.json(); hidden = Boolean(b?.dataItem?.data?.hidden); }
  } catch { /* ny rad */ }
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      dataCollectionId: COL,
      dataItem: { id: rec.productId, dataCollectionId: COL, data: { _id: rec.productId, ...rec, hidden } },
    }),
  });
  if (!res.ok) throw new Error(`Wix Data save ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
