// Inläsning av Aosom-recensioner som hämtats i en WEBBLÄSARE — ren logik.
//
// VARFÖR DEN FINNS (2026-09-16). Svepet i review-run.ts kan inte hämta något:
// Aosom ligger bakom Akamai och avvisar allt som inte är en riktig webbläsare
// (403 även för curl med webbläsarrubriker, uppmätt 2026-09-16). Aosom har
// gett oss tillstånd att hämta och översätta recensionerna (Leonards mejl
// 2026-09-16), så vägen blev: hämta i Leonards Chrome (deras sök-API ger
// produktkoden per artikelnummer, produktsidans JSON-LD ger betyg, antal och
// upp till fem texter), och läs in resultatet här — nycklat på wixProductId.
//
// Samma lagring som svepet skulle ha gjort:
//   · texterna  → FyndplatsImportedReviews via importReviewsForProduct med
//                 `source: "aosom"` — husets filter (betyg ≥ 3, längd, spam,
//                 utlandsleverans, dubbletter) gäller oförändrat.
//   · aggregatet → mappningen (`aosomRating`, `aosomReviewCount`). ☠️ Aldrig
//                 uträknat ur texterna: JSON-LD bär högst fem av ibland
//                 åttiotalet och Aosoms urval lutar högt.
//
// ☠️ ÖVERSÄTTNINGEN FÅR FÖLJA MED, MEN GRANSKAS. En rad kan bära `sv`; den
// skrivs bara om raden ligger som `pending` (aldrig över något en människa
// redigerat) och bara om validateTranslation godkänner den — exakt samma
// grind som /admin/reviews. Underkända rader ligger kvar i kön, räknade.
//
// ☠️ INGA NAMN. Nyttolasten bär inte recensentens namn — initialer härleds
// ur radens hash som för alla importerade rader. Och inga artikelnummer:
// raderna nycklas på wixProductId, så nyttolasten kan ligga i en publik gren.

import type { ProductMappingRecord } from "../store";
import type { StoredReview } from "../store/reviews";
import { ensureReviewId, type AERReview, type ReviewImportResult } from "../import/review-import";
import { validateTranslation } from "../reviews/translate";

/** Rader per anrop — varje rad kostar upp till ~15 skrivningar mot Wix Data. */
export const MAX_RADER_PER_ANROP = 60;
/** Längre texter än så är inte recensioner utan uppsatser; husets tak är 1 200. */
const MAX_TEXT = 2000;

export interface InlasRecension {
  rating: number;
  text: string;
  /** Svensk översättning, valfri. Skrivs bara via granskningen. */
  sv?: string;
}

export interface InlasRad {
  wixProductId: string;
  rating?: number;
  reviewCount?: number;
  reviews: InlasRecension[];
}

export interface Tolkning {
  rader: InlasRad[];
  fel: string[];
}

function tal(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Tolkar och normaliserar nyttolasten. Tolerant mot skräp i enskilda fält
 * (en text utan innehåll faller bort, ett betyg klipps till 1–5), strikt mot
 * fel form (saknat wixProductId, för många rader).
 */
export function tolkaInlasning(body: unknown): Tolkning {
  const fel: string[] = [];
  const rader: InlasRad[] = [];
  const rå = body && typeof body === "object" ? (body as { rader?: unknown }).rader : undefined;
  if (!Array.isArray(rå)) return { rader, fel: ["`rader` saknas eller är inte en lista"] };
  if (rå.length > MAX_RADER_PER_ANROP) {
    return { rader, fel: [`för många rader (${rå.length} > ${MAX_RADER_PER_ANROP}) — dela upp`] };
  }
  rå.forEach((r, i) => {
    if (!r || typeof r !== "object") {
      fel.push(`rad ${i}: inte ett objekt`);
      return;
    }
    const o = r as Record<string, unknown>;
    const wix = typeof o.wixProductId === "string" ? o.wixProductId.trim() : "";
    if (!wix) {
      fel.push(`rad ${i}: wixProductId saknas`);
      return;
    }
    const lista = Array.isArray(o.reviews) ? o.reviews : [];
    const reviews: InlasRecension[] = [];
    for (const x of lista) {
      if (!x || typeof x !== "object") continue;
      const xo = x as Record<string, unknown>;
      const text = typeof xo.text === "string" ? xo.text.trim().slice(0, MAX_TEXT) : "";
      if (!text) continue;
      const rating = Math.max(1, Math.min(5, Math.round(tal(xo.rating) ?? 0)));
      const sv = typeof xo.sv === "string" && xo.sv.trim() ? xo.sv.trim().slice(0, MAX_TEXT) : undefined;
      reviews.push({ rating, text, sv });
    }
    const rating = tal(o.rating);
    const reviewCount = tal(o.reviewCount);
    rader.push({
      wixProductId: wix,
      rating: rating !== undefined && rating > 0 && rating <= 5 ? rating : undefined,
      reviewCount: reviewCount !== undefined && reviewCount >= 0 ? Math.round(reviewCount) : undefined,
      reviews,
    });
  });
  return { rader, fel };
}

export interface InlasDeps {
  hittaMappning: (wixProductId: string) => ProductMappingRecord | undefined;
  importReviews: (productId: string, reviews: AERReview[]) => Promise<ReviewImportResult>;
  listByProduct: (productId: string) => Promise<StoredReview[]>;
  editText: (productId: string, reviewIdAE: string, svenska: string) => Promise<void>;
  saveMapping: (m: ProductMappingRecord) => Promise<void>;
  now: () => number;
  dryRun: boolean;
  /** Väggklocksbudget i ms från anropets början; överskriden → resten lämnas till nästa anrop. */
  tidsbudgetMs?: number;
  startMs?: number;
}

export interface InlasSummering {
  dryRun: boolean;
  rader: number;
  behandlade: number;
  /** Rader utan Aosom-mappning på det wix-id:t — hoppade. */
  okandProdukt: number;
  produkterMedText: number;
  texterInkomna: number;
  importerade: number;
  redanFanns: number;
  /** Texter husets filter sållade bort (betyg < 3, för kort, spam, utlandsleverans, dubblett). */
  bortfiltrerade: number;
  oversattningarInkomna: number;
  oversatta: number;
  /** Översättningar som underkändes av granskningen — raden ligger kvar i kön. */
  underkanda: number;
  underkandaSkal: Record<string, number>;
  /** Översättningar vars rad inte var `pending` (redan svensk, eller filtrerad bort). */
  oversattningUtanRad: number;
  stamplade: number;
  skrivfel: number;
  stoppadAv: "klart" | "tidsbudget";
  /** Index på första obehandlade raden när tidsbudgeten tog slut. */
  kvarFran: number | null;
}

export async function lasInRecensioner(rader: InlasRad[], deps: InlasDeps): Promise<InlasSummering> {
  const s: InlasSummering = {
    dryRun: deps.dryRun,
    rader: rader.length,
    behandlade: 0,
    okandProdukt: 0,
    produkterMedText: 0,
    texterInkomna: 0,
    importerade: 0,
    redanFanns: 0,
    bortfiltrerade: 0,
    oversattningarInkomna: 0,
    oversatta: 0,
    underkanda: 0,
    underkandaSkal: {},
    oversattningUtanRad: 0,
    stamplade: 0,
    skrivfel: 0,
    stoppadAv: "klart",
    kvarFran: null,
  };
  const start = deps.startMs ?? deps.now();
  const budget = deps.tidsbudgetMs ?? Infinity;

  for (let i = 0; i < rader.length; i++) {
    if (deps.now() - start > budget) {
      s.stoppadAv = "tidsbudget";
      s.kvarFran = i;
      break;
    }
    const rad = rader[i];
    const m = deps.hittaMappning(rad.wixProductId);
    if (!m || m.supplier !== "aosom") {
      s.okandProdukt++;
      continue;
    }
    s.behandlade++;
    s.texterInkomna += rad.reviews.length;
    s.oversattningarInkomna += rad.reviews.filter((r) => r.sv).length;
    if (rad.reviews.length > 0) s.produkterMedText++;

    if (deps.dryRun) {
      // Torrt: räkna vad som skulle försökas. Filtret körs inte utan lagring,
      // så `bortfiltrerade` går inte att veta här — samma som i svepet.
      s.importerade += rad.reviews.length;
      continue;
    }

    try {
      if (rad.reviews.length > 0) {
        const in_: AERReview[] = rad.reviews.map((r) => ({
          rating: r.rating,
          text: r.text,
          language: "de",
          hasImage: false,
        }));
        const res = await deps.importReviews(rad.wixProductId, in_);
        s.importerade += res.imported;
        s.redanFanns += res.skippedExisting;
        s.bortfiltrerade += Math.max(0, rad.reviews.length - res.imported - res.skippedExisting);

        // Översättningarna: bara på rader som ligger som `pending`.
        const medSv = rad.reviews.filter((r) => r.sv);
        if (medSv.length > 0) {
          const befintliga = await deps.listByProduct(rad.wixProductId);
          const perId = new Map(befintliga.map((r) => [r.reviewIdAE, r]));
          for (const r of medSv) {
            const id = ensureReviewId({ rating: r.rating, text: r.text });
            const lagrad = perId.get(id);
            if (!lagrad || lagrad.status !== "pending") {
              s.oversattningUtanRad++;
              continue;
            }
            const dom = validateTranslation(lagrad.textOriginal, r.sv!);
            if (!dom.ok) {
              s.underkanda++;
              const skal = dom.reason ?? "okänd";
              s.underkandaSkal[skal] = (s.underkandaSkal[skal] ?? 0) + 1;
              continue;
            }
            await deps.editText(rad.wixProductId, id, r.sv!);
            s.oversatta++;
          }
        }
      }
      await deps.saveMapping({
        ...m,
        ...(rad.rating !== undefined ? { aosomRating: rad.rating } : {}),
        ...(rad.reviewCount !== undefined ? { aosomReviewCount: rad.reviewCount } : {}),
        reviewsCheckedAt: new Date(deps.now()).toISOString(),
      });
      s.stamplade++;
    } catch {
      s.skrivfel++;
    }
  }
  return s;
}
