// lib/auction/seed.ts
//
// Fyndauktionens katalog-urval — ren logik (I/O bor i /api/cron/auction-seed).
//
// Hela katalogen är auktionsbar sedan −7 %-golvet infördes, men varje produkt
// måste kvala in:
//
//   • synlig + i lager (OUT_OF_STOCK exkluderas; PARTIALLY räknas som köpbar)
//   • ETT pris över alla varianter (motorn PATCH:ar samma pris på alla
//     varianter — produkter med prisspann skulle få fel pris)
//   • ingen befintlig rea (compareAtPrice satt — auktionen skulle skriva
//     över och sedan RADERA den vid dagens slut)
//   • känd landad kostnad (annars kan inget golv räknas)
//   • golvet ger minst 10 % rabatt — mindre är för trist för en auktion
//
// Köordningen: de 5 största rabatterna först (lanseringsdagens uppställning
// ska imponera), resten i deterministiskt blandad ordning (FNV-hash av
// productId) — ser slumpad ut men är stabil mellan omkörningar, och
// garanterar att inget upprepas förrän hela poolen gått varvet runt.

import { buildFloor, buildLadder, type AuctionDoc } from "./engine";

/** Minsta rabatt (golv vs. lista) för att en produkt ska vara auktionsvärd. */
export const MIN_AUCTION_DISCOUNT = 0.1;

export type SeedRejection =
  | "hidden"
  | "outOfStock"
  | "noPrice"
  | "variantPriceSpread"
  | "existingSale"
  | "noCost"
  | "thinMargin";

export interface SeedInput {
  productId: string;
  slug: string;
  name: string;
  visible: boolean;
  inStock: boolean;
  /** Lägsta/högsta variantpris (inkl. moms). Lika ⇒ enhetligt pris. */
  priceMin: number;
  priceMax: number;
  /** Har produkten redan ett överstruket jämförpris (pågående rea)? */
  hasCompareAt: boolean;
  /** Högsta landade kostnaden över varianterna (exkl. moms), null = okänd. */
  landedCostSek: number | null;
}

export type SeedCandidate = Pick<
  AuctionDoc,
  "productId" | "slug" | "name" | "listPrice" | "floorPrice" | "ladder" | "stepMinutes"
>;

export type SeedVerdict = { ok: true; doc: SeedCandidate } | { ok: false; reason: SeedRejection };

export function evaluateCandidate(p: SeedInput): SeedVerdict {
  if (!p.visible) return { ok: false, reason: "hidden" };
  if (!p.inStock) return { ok: false, reason: "outOfStock" };
  if (!Number.isFinite(p.priceMin) || p.priceMin <= 0) return { ok: false, reason: "noPrice" };
  if (p.priceMax !== p.priceMin) return { ok: false, reason: "variantPriceSpread" };
  if (p.hasCompareAt) return { ok: false, reason: "existingSale" };
  if (p.landedCostSek == null || p.landedCostSek <= 0) return { ok: false, reason: "noCost" };

  const listPrice = p.priceMin;
  const floorPrice = buildFloor(listPrice, p.landedCostSek);
  if (1 - floorPrice / listPrice < MIN_AUCTION_DISCOUNT) return { ok: false, reason: "thinMargin" };

  return {
    ok: true,
    doc: {
      productId: p.productId,
      slug: p.slug,
      name: p.name,
      listPrice,
      floorPrice,
      ladder: buildLadder(listPrice, floorPrice),
      stepMinutes: 60,
    },
  };
}

/** FNV-1a 32-bit — deterministisk "slump" för köordningen. */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function discountOf(doc: Pick<SeedCandidate, "listPrice" | "floorPrice">): number {
  return 1 - doc.floorPrice / doc.listPrice;
}

/**
 * Tilldelar queueOrder 1..N: de 5 största rabatterna först (lanseringsfemman),
 * resten i FNV-blandad ordning. Returnerar productId → queueOrder.
 */
export function assignQueueOrder(candidates: SeedCandidate[]): Map<string, number> {
  const byDiscount = [...candidates].sort(
    (a, b) => discountOf(b) - discountOf(a) || fnv1a(a.productId) - fnv1a(b.productId),
  );
  const launch = byDiscount.slice(0, 5);
  const rest = byDiscount.slice(5).sort((a, b) => fnv1a(a.productId) - fnv1a(b.productId));
  const order = new Map<string, number>();
  let q = 1;
  for (const c of [...launch, ...rest]) order.set(c.productId, q++);
  return order;
}
