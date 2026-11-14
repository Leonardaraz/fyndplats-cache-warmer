// lib/gpsr/aosom-pa-ae.ts
//
// AliExpress-sidor vars vara är en Aosom-vara, och som därför har Aosoms
// tillverkare i produktsäkerhetsfliken (Leonard 2026-11-11: "Fixa loungesetets
// tillverkaruppgift").
//
// VARFÖR LISTAN FINNS. `/api/gpsr` väljer väg efter mappningens leverantör
// (`mappingSupplier`). En äldre AliExpress-rad utan leverantörsfält och utan
// rad i Aosoms feed klassas som AliExpress, och rutten svarar då 404: butiken
// visar ingen flik, och en sida med ett eget `<h2>Produktsäkerhet</h2>` i
// texten får en flik utan tillverkare (`livegrind.py`: "fliken saknar
// tillverkaren"). Artikel 19 i (EU) 2023/988 kräver tillverkarens namn,
// adress och e-post på produktsidan.
//
// VARFÖR INTE LEVERANTÖREN I MAPPNINGEN. Att sätta `supplier: "aosom"` på
// raden hade dragit in sidan i Aosom-synken, och den behandlar en rad som
// saknas i feeden som slutsåld: saldot hade nollats på en vara som säljs via
// AliExpress. Beställningen går dessutom via AliExpress, inte i Aosoms klump
// (lib/aosom/bulk-order.ts). Leverantörsfältet beskriver var varan köps, och
// den här listan beskriver vem som är tillverkare. De två är inte samma sak.
//
// VAD SOM RÄKNAS. En sida står här bara när varan är Aosoms, och det är
// kontrollerat mot sidans egna bilder (Aosoms egna produktbilder och
// måttskisser som serveras från Aosoms bilddomän), inte mot namnet. Tillverkaren
// är då densamma för alla Aosom-märken: MH Handel GmbH, Hamburg
// (`AOSOM_ANSVARIG`). Märket (HOMCOM, Outsunny …) är okänt eftersom feeden inte
// har någon rad, och svaret har då `marke: null`, som butiken hanterar.
//
// Listan bär Wix-produkt-id och inget annat: aldrig Aosoms artikelnummer
// (repot är publikt). En sida läggs till först när varan har kontrollerats, och
// raden får en kommentar med vad den är.

/** Wix-produkt-id (gemener) för AliExpress-sidor vars vara är Aosoms. */
export const AOSOM_VARA_PA_AE_SIDA: ReadonlySet<string> = new Set([
  "58c5bc3a-d26e-4d42-8b42-1d2461397fc4", // Loungeset i rotting, 5 delar (FLAGGADE 310 och 323)
]);

/** Sant när sidans vara är en Aosom-vara trots att mappningen är en AliExpress-rad. */
export function arAosomVaraPaAeSida(wixProductId: string): boolean {
  return AOSOM_VARA_PA_AE_SIDA.has(wixProductId.toLowerCase());
}
