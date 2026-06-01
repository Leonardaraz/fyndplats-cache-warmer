// Variant pre-trim (Feature 3, 2026-06-02).
//
// Vissa AliExpress-produkter har 30–40+ varianter (alla färger × storlekar).
// Det ger en plottrig PDP och tunga Wix-create-payloads. trimVariants() väljer ut
// topp N (default 8) varianter för en renare produktsida — DETERMINISTISKT, inga
// AI-anrop ($0).
//
// Rangordning (mest värd överst):
//   1. salesCount (om NÅGON variant har sälj-data > 0) — bestsellers vinner.
//   2. annars availQuantity/stock desc — mest i lager vinner.
//   3. distinkt variantbild ger en liten bonus (visuell skillnad är värd att visa).
//
// Garantier:
//   • Stänger aldrig ut en hel färg: minst 1 variant per "huvudfärg" behålls så
//     länge det finns kvar slots (annars behålls de bäst rankade färgerna först).
//   • Returnerar ALLTID minst 1 variant (en produkt utan varianter går inte att sälja).
//   • <= maxCount inkommande varianter → ingen trim (kept = allt, removed = []).

/** Minsta variant-form trimVariants behöver. Pipelinens AliExpressVariant uppfyller den. */
export interface TrimmableVariant {
  supplierVariantId: string;
  /** Råa/översatta optionsvärden, t.ex. { "Färg": "Röd", "Storlek": "M" }. */
  options: Record<string, string>;
  /** Lagersaldo (AliExpress availQuantity) om känt. */
  stock?: number;
  /** Antal sålda om leverantören exponerar det. Saknas hos de flesta skrapor. */
  salesCount?: number;
  /** Per-variant bild-URL om känd (för "samma som default"-checken). */
  image?: string;
}

export interface TrimResult<T extends TrimmableVariant> {
  kept: T[];
  removed: T[];
  /** Människoläsbar sammanfattning för audit/admin, t.ex. "8 av 34 behållna (sales: 0 → stock-rank)". */
  summary: string;
}

/** Axelnamn (case-insensitivt) som tolkas som "färg" — på svenska + engelska. */
const COLOR_AXIS_NAMES = new Set(["färg", "farg", "color", "colour", "couleur"]);

/** Hittar färgaxelns nyckel i en variants options, eller null om ingen färgaxel finns. */
function colorAxisKey(variants: TrimmableVariant[]): string | null {
  const keys = new Set<string>();
  for (const v of variants) for (const k of Object.keys(v.options)) keys.add(k);
  for (const k of keys) {
    if (COLOR_AXIS_NAMES.has(k.trim().toLowerCase())) return k;
  }
  return null;
}

/** Färgvärdet för en variant (för gruppering). Saknas färgaxel → alla i samma grupp (""). */
function colorOf(v: TrimmableVariant, axisKey: string | null): string {
  if (!axisKey) return "";
  return (v.options[axisKey] ?? "").trim().toLowerCase();
}

/**
 * Poäng per variant. Högre = behålls hellre. salesMode styr om vi rankar på
 * sälj-data (när minst en variant har det) eller på lagersaldo.
 */
function scoreVariant(v: TrimmableVariant, salesMode: boolean, defaultImage: string): number {
  const base = salesMode ? Number(v.salesCount ?? 0) : Number(v.stock ?? 0);
  // Liten bonus för en distinkt variantbild (≠ default/tom) — "ingen visuell
  // skillnad" ska väljas bort först. Bonusen är bråkdel av en enhet så den bara
  // bryter likalägen, aldrig vänder en tydlig sälj-/lager-skillnad.
  const img = (v.image ?? "").trim();
  const distinct = img && img !== defaultImage ? 0.5 : 0;
  return base + distinct;
}

/**
 * Trimmar en variantuppsättning till topp `maxCount`. Rena funktion — muterar inte
 * indata. Bevarar inbördes ordning inom kept/removed efter rangordningen.
 */
export function trimVariants<T extends TrimmableVariant>(
  variants: T[],
  maxCount = 8,
): TrimResult<T> {
  const max = Math.max(1, Math.trunc(maxCount));
  if (variants.length <= max) {
    return {
      kept: [...variants],
      removed: [],
      summary: `${variants.length} varianter (≤ ${max}) — ingen trim behövdes.`,
    };
  }

  const salesMode = variants.some((v) => Number(v.salesCount ?? 0) > 0);
  const defaultImage = (variants[0]?.image ?? "").trim();
  const axisKey = colorAxisKey(variants);

  // Stabil index för deterministiska likalägen (originalordning vinner).
  const indexed = variants.map((v, i) => ({
    v,
    i,
    color: colorOf(v, axisKey),
    score: scoreVariant(v, salesMode, defaultImage),
  }));

  // Rangordning: poäng desc → stock desc → originalordning.
  const byRank = [...indexed].sort(
    (a, b) =>
      b.score - a.score ||
      Number(b.v.stock ?? 0) - Number(a.v.stock ?? 0) ||
      a.i - b.i,
  );

  // Fas 1: garantera färgtäckning. Plocka bästa varianten per färggrupp.
  const bestPerColor = new Map<string, (typeof indexed)[number]>();
  for (const entry of byRank) {
    if (!bestPerColor.has(entry.color)) bestPerColor.set(entry.color, entry);
  }
  // Representanterna i rangordning (bästa färgen först).
  const representatives = [...bestPerColor.values()].sort(
    (a, b) => b.score - a.score || a.i - b.i,
  );

  const keptIdx = new Set<number>();
  // Behåll en representant per färg tills slots tar slut (bäst rankade färger först).
  for (const r of representatives) {
    if (keptIdx.size >= max) break;
    keptIdx.add(r.i);
  }
  // Fyll resterande slots med näst bästa varianter (oavsett färg).
  for (const entry of byRank) {
    if (keptIdx.size >= max) break;
    keptIdx.add(entry.i);
  }

  const kept = variants.filter((_, i) => keptIdx.has(i));
  const removed = variants.filter((_, i) => !keptIdx.has(i));

  const rankBasis = salesMode ? "sales-rank" : "stock-rank (sales: 0)";
  const colorNote = axisKey ? `, ${bestPerColor.size} färg(er) täckta` : "";
  return {
    kept,
    removed,
    summary: `${kept.length} av ${variants.length} behållna (${rankBasis}${colorNote}), ${removed.length} dolda.`,
  };
}

/** Är variant-trim påslagen? Default ON. Stäng av med IMPORT_VARIANT_TRIM=false. */
export function variantTrimEnabled(): boolean {
  return (process.env.IMPORT_VARIANT_TRIM ?? "true").toLowerCase() !== "false";
}

/** Maxantal varianter efter trim. Override: IMPORT_VARIANT_TRIM_MAX (default 8). */
export function variantTrimMax(): number {
  const n = Number(process.env.IMPORT_VARIANT_TRIM_MAX);
  return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : 8;
}
