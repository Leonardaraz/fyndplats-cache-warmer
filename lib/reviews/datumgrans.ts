// Datumgräns för recensioner — inga omdömen daterade före 2021 (2026-09-23).
//
// VARFÖR. Leonards beslut 2026-09-23: "Alla recensioner som är äldre än 2021
// måste bort." Butiken startade 2021, och Aosoms recensions-API ger omdömen
// ända från 2015 — i omgång 3 var 159 av 1 086 publicerade texter daterade
// 2015–2020. Ett omdöme som är äldre än butiken ser fel ut på produktsidan.
//
// Två vägar använder regeln, och båda läser den HÄRIFRÅN:
//   1. Husets filter (lib/import/review-import.ts) slänger dem vid inläsningen,
//      så de aldrig kommer in igen — oavsett källa (AliExpress, Aosom).
//   2. Städningen (/api/admin/recensioner-datumrensning) DÖLJER de som redan
//      ligger i lagret: status → "rejected". Inget raderas; en rad kan
//      återställas i /admin/reviews.
//
// ☠️ OKÄNT DATUM BEHÅLLS. En rad utan läsbart datum döljs inte: vi vet inte
// att den är gammal, och att gissa hade tagit bort äkta omdömen. Ett trasigt
// men läsbart datum ("0202-05-12", årtalet felskrivet) ÄR före gränsen och
// döljs — ett sådant datum kan inte visas ändå.

import type { StoredReview } from "../store/reviews";

/** Recensioner daterade före den här dagen visas inte och läses inte in. */
export const TIDIGASTE_RECENSIONSDATUM = "2021-01-01";

const ISO_DAG = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Datumdelen (YYYY-MM-DD) ur ett lagrat eller importerat datum.
 * `null` när datumet saknas eller inte går att läsa.
 */
export function datumdel(datum: string | undefined | null): string | null {
  const s = String(datum ?? "").trim();
  if (!s) return null;
  const m = ISO_DAG.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

/** Sant om omdömet är daterat före gränsen. Okänt datum → falskt (behålls). */
export function arForeDatumgransen(
  datum: string | undefined | null,
  grans: string = TIDIGASTE_RECENSIONSDATUM,
): boolean {
  const d = datumdel(datum);
  return d !== null && d < grans;
}

export interface Datumrensning {
  gräns: string;
  /** Alla rader i lagret. */
  granskade: number;
  /** Rader utan läsbart datum — behålls. */
  utanDatum: number;
  /** Rader daterade före gränsen, oavsett status. */
  föreGränsen: number;
  /** Redan dolda (`rejected`) — rörs inte. */
  redanDolda: number;
  /** Synliga eller väntande rader före gränsen — de som ska döljas. */
  attDölja: Array<{ productId: string; reviewIdAE: string }>;
  /** Antal produkter som har minst en rad att dölja. */
  produkter: number;
  /** Fördelning av raderna att dölja. */
  perStatus: Record<string, number>;
  perKälla: Record<string, number>;
  perÅr: Record<string, number>;
}

/**
 * Vilka rader ska döljas? Ren funktion — lagret läses och skrivs av rutten.
 *
 * Både synliga (`approved`/`edited`) och väntande (`pending`) rader döljs:
 * en väntande rad blir annars synlig så fort någon översätter den.
 */
export function planeraDatumrensning(
  rader: readonly StoredReview[],
  grans: string = TIDIGASTE_RECENSIONSDATUM,
): Datumrensning {
  if (!ISO_DAG.test(grans)) throw new Error(`Ogiltig datumgräns "${grans}" — ange YYYY-MM-DD`);
  const plan: Datumrensning = {
    gräns: grans,
    granskade: rader.length,
    utanDatum: 0,
    föreGränsen: 0,
    redanDolda: 0,
    attDölja: [],
    produkter: 0,
    perStatus: {},
    perKälla: {},
    perÅr: {},
  };
  const produkter = new Set<string>();
  const sedda = new Set<string>();
  for (const r of rader) {
    const d = datumdel(r.date);
    if (d === null) {
      plan.utanDatum++;
      continue;
    }
    if (d >= grans) continue;
    plan.föreGränsen++;
    const status = r.status ?? "pending";
    if (status === "rejected") {
      plan.redanDolda++;
      continue;
    }
    const nyckel = `${r.productId}\u0000${r.reviewIdAE}`;
    if (sedda.has(nyckel)) continue;
    sedda.add(nyckel);
    plan.attDölja.push({ productId: r.productId, reviewIdAE: r.reviewIdAE });
    produkter.add(r.productId);
    const källa = String(r.source ?? "").trim() || "okänd";
    plan.perStatus[status] = (plan.perStatus[status] ?? 0) + 1;
    plan.perKälla[källa] = (plan.perKälla[källa] ?? 0) + 1;
    const år = d.slice(0, 4);
    plan.perÅr[år] = (plan.perÅr[år] ?? 0) + 1;
  }
  plan.produkter = produkter.size;
  return plan;
}
