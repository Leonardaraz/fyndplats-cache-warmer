// lib/auction/framjbar.ts
//
// FÅR RADEN FRÄMJAS? Ren logik, inga sidoeffekter.
//
// ☠️ VARFÖR (2026-11-14). Seeden skrev ingenting 12–14/11, och köraderna bar
// priser från före Aosoms ikappkörning 11/11. Ticken främjade med radens pris,
// och i 7 av 30 fynd blev det överstrukna ordinarie priset högre än varans pris
// dagen före. Det är just det 30-dagarsspärren ska stoppa (7 a §
// prisinformationslagen, lib/auction/trettio-dagar.ts).
//
// Nu främjas en rad bara när startpriset för varje variant är exakt varans pris
// i Wix just då. En rad med ett annat pris står kvar i kön. Nästa natts seed
// uppdaterar priset och prövar raden mot spärren igen.
//
// Prissynken rör aldrig en främjad auktion (05-aosom-synken/09-levande-
// fyndauktion.md), så priset står still från främjandet till starten.

import type { AuctionDoc } from "./engine";

/**
 * Varans läge i Wix just nu. `priser` är Wix-variant-id → pris i kronor, och
 * null betyder att priserna inte gick att läsa.
 */
export type ProduktNu = { finns: false } | { finns: true; priser: ReadonlyMap<string, number> | null };

/** `ok` = främja. `borta` = produkten är raderad. De två andra: står kvar i kön. */
export type Framjbarhet = "ok" | "borta" | "pris_okant" | "pris_andrat";

const ore = (kr: number) => Math.round(kr * 100);

export function framjbar(a: Pick<AuctionDoc, "listPrice" | "variantPrices">, nu: ProduktNu): Framjbarhet {
  if (!nu.finns) return "borta";
  const priser = nu.priser;
  if (!priser || priser.size === 0) return "pris_okant";
  const spar = a.variantPrices ?? [];
  if (spar.length > 0) {
    for (const t of spar) {
      const p = priser.get(t.wixVariantId);
      // En variant som inte finns kvar har inget pris att jämföra: seeden tar den.
      if (p === undefined || !Number.isFinite(p) || ore(p) !== ore(t.listPrice)) return "pris_andrat";
    }
    return "ok";
  }
  // Enkel-pris-läget (äldre rader): hela produkten sätts till stegens pris, så
  // varje variant ska stå på listpriset.
  for (const p of priser.values()) {
    if (!Number.isFinite(p) || ore(p) !== ore(a.listPrice)) return "pris_andrat";
  }
  return "ok";
}
