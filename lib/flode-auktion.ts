// lib/flode-auktion.ts
//
// PRODUKTFLÖDENA UTESLUTER FYNDAUKTIONENS VAROR (2026-11-04).
//
// Under auktionsdagen sjunker priset varje timme, och kl 19 går det tillbaka
// till ordinarie. Flödena (Google, Meta, PriceRunner och, via Google-flödet,
// Prisjakt) hämtas av tjänsterna några gånger om dagen. Ett flöde hämtat
// under dagen visar alltså auktionspriset kvar efter 19, när sidan står på
// ordinarie pris igen: ett högre pris på sidan än i annonsen, den farliga
// riktningen för Merchant Center. Med tio fynd om dagen, och 50–100 under
// Black Week, blir det många varor. En vara med levande eller schemalagd
// auktion står därför inte i flödena; den kommer tillbaka dagen efter.
//
// Fail-open: kan motorn inte läsas blir mängden tom och flödena som förut.
import { hämtaAuktionsrader } from "./auction-motor";

/** Produkt-id med en levande eller schemalagd auktion. */
export async function auktionensProdukter(): Promise<Set<string>> {
  const rader = await hämtaAuktionsrader("live", {}, { sida: "flode" });
  return new Set(rader.map((r) => r.productId).filter((id): id is string => typeof id === "string" && id.length > 0));
}
