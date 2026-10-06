// AliExpress-kön töms — inga väntande AliExpress-recensioner (2026-10-06).
//
// VARFÖR. Leonards beslut 2026-10-06: "Kan du ta bort alla recensioner från
// aliexpress ... som ligger i admin portalen som behöver översättas o
// godkännas. Vi behöver dom inte." Butiken säljer numera nästan bara
// Aosom-varor, och de väntande AliExpress-raderna låg kvar i /admin/reviews
// och väntade på en översättning som aldrig skulle göras.
//
// Vad som berörs: rader med status `pending` vars källa är AliExpress (fältet
// `source` saknas eller är "aliexpress", samma regel som
// lib/reviews/image-restore.ts). Publicerade AliExpress-recensioner, Aosom-
// rader och butikens egna kundomdömen rörs inte.
//
// ☠️ DÖLJ, RADERA ALDRIG. Status → "rejected", samma som datumrensningen
// (lib/reviews/datumgrans.ts). En dold rad kan återställas i /admin/reviews,
// och den ligger kvar som dubblettspärr: en raderad rad hade köats igen nästa
// gång produktens AliExpress-recensioner hämtas.

import type { StoredReview } from "../store/reviews";

/** Sant för en importerad AliExpress-recension. */
export function arAliExpress(r: Pick<StoredReview, "source">): boolean {
  const s = String(r.source ?? "").trim();
  return s === "" || s === "aliexpress";
}

export interface AeKoRensning {
  /** Alla rader i lagret. */
  granskade: number;
  /** Väntande rader, oavsett källa. */
  vantande: number;
  /** Väntande rader per källa ("aliexpress" för rader utan källa). */
  vantandePerKalla: Record<string, number>;
  /** Väntande AliExpress-rader — de som ska döljas. */
  attDolja: StoredReview[];
  /** Antal produkter de sitter på. */
  produkter: number;
  /** Väntande AliExpress-rader som redan har svensk text (översatta men inte godkända). */
  medSvenskText: number;
}

export function planeraAeKoRensning(rader: readonly StoredReview[]): AeKoRensning {
  const plan: AeKoRensning = {
    granskade: rader.length,
    vantande: 0,
    vantandePerKalla: {},
    attDolja: [],
    produkter: 0,
    medSvenskText: 0,
  };
  const produkter = new Set<string>();
  for (const r of rader) {
    if (r.status !== "pending") continue;
    plan.vantande++;
    const kalla = arAliExpress(r) ? "aliexpress" : String(r.source).trim();
    plan.vantandePerKalla[kalla] = (plan.vantandePerKalla[kalla] ?? 0) + 1;
    if (kalla !== "aliexpress") continue;
    plan.attDolja.push(r);
    produkter.add(r.productId);
    const sv = String(r.textSwedish ?? "").trim();
    if (sv && sv !== String(r.textOriginal ?? "").trim()) plan.medSvenskText++;
  }
  plan.produkter = produkter.size;
  return plan;
}
