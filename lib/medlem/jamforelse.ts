// lib/medlem/jamforelse.ts
//
// Medlemsprisets jämförelse på produktsidan, som de stora kedjorna gör
// (Leonard 2026-11-05: "kolla hur andra stora sidor gör med liknande upplägg
// och härma", i stället för att fråga Konsumentverket). Elgiganten visar
// klubbpriset tillsammans med priset för den som inte är medlem och, när det
// är en sänkning, "Lägsta pris senaste 30 dagar innan prissänkningen".
//
// Reglerna är desamma som för rean (7 a § prisinformationslagen,
// lib/price-history.ts):
//   • Ett tidigare pris visas bara när det går att belägga: jämförpriset ur
//     produktens prishistorik, och bara när medlemspriset ligger under det.
//   • En procent måste räknas mot det tidigare priset. Nivåns procent räknas
//     mot listpriset, så den står bara kvar när det tidigare priset ÄR
//     listpriset. Annars visas beloppen utan procent.
//   • Prishistoriken gäller produktens lägsta variantpris (price-snapshot).
//     Har varianterna olika pris går det inte att belägga per variant, och då
//     visas ingen jämförelse.
//
// Ren modul utan importer: node --test laddar den direkt.

export interface Jamforelse {
  /** Det tidigare priset i öre, som visas med lagens uttryck framför. */
  tidigareOre?: number;
  /** Får nivåns procent stå i rutan? */
  visaProcent: boolean;
}

/**
 * Vad medlemsrutan får påstå om en variant. `tidigareOre` är jämförpriset ur
 * prishistoriken (jamforpris), eller null när inget går att belägga.
 */
export function jamforelseForMedlem(aOre: number, pOre: number, tidigareOre: number | null): Jamforelse {
  if (tidigareOre === null || !Number.isSafeInteger(tidigareOre) || !(pOre < tidigareOre)) {
    return { visaProcent: false };
  }
  return { tidigareOre, visaProcent: tidigareOre === aOre };
}

/** Har alla varianter samma pris? Bara då gäller produktens prishistorik varje variant. */
export function ettPris(aOren: readonly number[]): boolean {
  return aOren.length > 0 && aOren.every((a) => a === aOren[0]);
}
