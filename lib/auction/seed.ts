// lib/auction/seed.ts
//
// Fyndauktionens katalog-urval — ren logik (I/O bor i /api/cron/auction-seed).
//
// Hela katalogen är auktionsbar sedan −7 %-golvet infördes. Sedan per-variant-
// stegarna kom kan även produkter med PRISSPANN (olika pris per variant, t.ex.
// 13- vs 32-delars destillationssats) auktioneras korrekt: varje variant faller
// från sitt eget ordinariepris till sitt eget golv. En produkt kvalar in om:
//
//   • synlig + i lager (OUT_OF_STOCK exkluderas; PARTIALLY räknas som köpbar)
//   • ingen befintlig rea (compareAtPrice satt — auktionen skulle skriva över
//     och sedan RADERA den vid dagens slut)
//   • VARJE variant har känd landad kostnad (annars kan inget golv räknas)
//   • VISNINGSPRISET (billigaste varianten — det auktionskortet visar) faller
//     ≥10 % till sitt golv. Att någon DYR variant faller räcker inte: 13 juli
//     hade solpanelen −70 % på stora panelen men platt billigaste variant →
//     kortet stod stilla på listpris hela dagen med "Lägsta pris!" från kl 07.
//
// Köordningen: de 5 största rabatterna först (lanseringsdagens uppställning ska
// imponera — rankas på produktens BÄSTA variantrabatt), resten i deterministiskt
// blandad ordning (FNV-hash av productId) — ser slumpad ut men är stabil mellan
// omkörningar, och garanterar att inget upprepas förrän hela poolen gått varvet.
//
// MOMS PÅ INKÖP: de lagrade inköpspriserna (FyndplatsMappings.landedCostSek)
// kommer från import när köpen gjordes som privatperson — AliExpress-priset är
// INKL. moms. Som momsregistrerat företag med B2B-köp är momsen aldrig en
// verklig kostnad: EU-säljare fakturerar utan moms (omvänd skattskyldighet),
// och importmoms på Kina-köp är avdragsgill. Den VERKLIGA kostnaden är därför
// NETTOPRISET. Golvet räknas ur nettokostnaden — se netSupplierCost().

import { buildVariantTracks, minTrack, type AuctionVariantTrack } from "./engine";

/** Minsta rabatt (bästa variants golv vs. dess lista) för auktionsvärdhet. */
export const MIN_AUCTION_DISCOUNT = 0.1;

// ☠️ DEFINITIONEN BOR I lib/import/pricing.ts — den här filen ÄRVER den.
//
// Talet fanns tidigare här, och `computeProfit` i pricing.ts hade sin egen
// (felaktiga) uppfattning om samma sak: den momsade av intäkten men inte
// kostnaden. Auktionens golvbud räknade alltså rätt medan lönsamhetsöversikten
// visade förlust på samma produkt (bäddsoffan `efaa0c7b`, 2026-08-29: −4 % mot
// verkliga +16,8 %). Två vägar, ett tal, olika svar.
//
// Re-exporten är avsiktlig: `lib/aosom/to-product.ts` och `lib/aosom/sync.ts`
// importerar SUPPLIER_VAT_RATE härifrån och behöver inte veta att den flyttat.
// Riktningen är den rätta — moms på inköp är ett prisbegrepp, inte ett
// auktionsbegrepp, och pricing.ts importerar ingenting från auction/.
import { SUPPLIER_VAT_RATE, netSupplierCost } from "../import/pricing";
export { SUPPLIER_VAT_RATE, netSupplierCost };

export type SeedRejection = "hidden" | "outOfStock" | "noVariants" | "existingSale" | "noCost" | "thinMargin";

export interface SeedVariantInput {
  wixVariantId: string;
  /** Ordinariepris inkl. moms (LIVE-priset i katalogen). */
  listPrice: number;
  /** Landad kostnad INKL. moms (som lagrad) — konverteras till netto internt. */
  landedCostSek: number | null;
}

export interface SeedInput {
  productId: string;
  slug: string;
  name: string;
  visible: boolean;
  inStock: boolean;
  /** Har produkten redan ett överstruket jämförpris (pågående rea)? */
  hasCompareAt: boolean;
  variants: SeedVariantInput[];
}

export interface SeedCandidate {
  productId: string;
  slug: string;
  name: string;
  /** Visningsspår (element-vis min över varianttrackarna). */
  listPrice: number;
  floorPrice: number;
  ladder: number[];
  variantPrices: AuctionVariantTrack[];
  stepMinutes: number;
}

export type SeedVerdict = { ok: true; doc: SeedCandidate } | { ok: false; reason: SeedRejection };

export function evaluateCandidate(p: SeedInput): SeedVerdict {
  if (!p.visible) return { ok: false, reason: "hidden" };
  if (!p.inStock) return { ok: false, reason: "outOfStock" };
  if (p.hasCompareAt) return { ok: false, reason: "existingSale" };

  const priced = p.variants.filter((v) => v.listPrice > 0);
  if (priced.length === 0) return { ok: false, reason: "noVariants" };
  // KRAV: varje prissatt variant måste ha en kostnad — annars kan vi inte
  // garantera dess golv, och en okänd-kostnads-variant får aldrig auktioneras.
  if (priced.some((v) => v.landedCostSek == null || v.landedCostSek <= 0)) return { ok: false, reason: "noCost" };

  // Golvet räknas ur NETTOkostnaden (momsen bärs aldrig, se filhuvudet).
  const tracks = buildVariantTracks(
    priced.map((v) => ({ wixVariantId: v.wixVariantId, listPrice: v.listPrice, landedCostSek: netSupplierCost(v.landedCostSek!) })),
  );
  // Grinden går på VISNINGSSTEGEN (min per steg över trackarna) — det är den
  // kortets pris följer. En bäst-variant-grind räckte inte (se filhuvudet).
  const top = minTrack(tracks);
  if (discountOf(top) < MIN_AUCTION_DISCOUNT) return { ok: false, reason: "thinMargin" };
  return {
    ok: true,
    doc: {
      productId: p.productId,
      slug: p.slug,
      name: p.name,
      listPrice: top.listPrice,
      floorPrice: top.floorPrice,
      ladder: top.ladder,
      variantPrices: tracks,
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

/** Visningsrabatt (från-priset): 1 − minFloor/minList. */
export function discountOf(doc: Pick<SeedCandidate, "listPrice" | "floorPrice">): number {
  return 1 - doc.floorPrice / doc.listPrice;
}

/** Bästa variantrabatt — headline-siffran som lanseringsfemman rankas på. */
export function headlineDiscount(doc: {
  variantPrices?: AuctionVariantTrack[];
  listPrice?: number;
  floorPrice?: number;
}): number {
  if (doc.variantPrices?.length) return Math.max(...doc.variantPrices.map((t) => 1 - t.floorPrice / t.listPrice));
  if (doc.listPrice && doc.floorPrice) return 1 - doc.floorPrice / doc.listPrice; // legacy enkel-pris-doc
  return 0;
}

/**
 * Tilldelar queueOrder 1..N: de 5 största (headline-)rabatterna först
 * (lanseringsfemman), resten i FNV-blandad ordning. productId → queueOrder.
 */
export function assignQueueOrder(candidates: SeedCandidate[]): Map<string, number> {
  const byDiscount = [...candidates].sort(
    (a, b) => headlineDiscount(b) - headlineDiscount(a) || fnv1a(a.productId) - fnv1a(b.productId),
  );
  const launch = byDiscount.slice(0, 5);
  const rest = byDiscount.slice(5).sort((a, b) => fnv1a(a.productId) - fnv1a(b.productId));
  const order = new Map<string, number>();
  let q = 1;
  for (const c of [...launch, ...rest]) order.set(c.productId, q++);
  return order;
}
