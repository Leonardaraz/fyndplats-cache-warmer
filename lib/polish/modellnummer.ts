// MODELLNR  gatelibs etikettregel för VEVOR:s modellnummer, TECKEN FÖR TECKEN
//           (Leonard 2026-10-31: "ta bort det från oss så man inte kan söka
//           upp"). Numren har ingen gemensam form, så regeln fäller etiketten.
//           Vårt eget FP-nummer efter "Artikelnummer" och "Modell: Premium"
//           släpps. Testet jämför mot Python-originalet (lib/polish/skrivplan.test.ts).
//
// Regeln bor här i stället för i skrivplanen så att importen och
// specifikationsverktyget (lib/vevor) kan använda den utan att dra in
// skrivplanens Wix-moduler. Skrivplanen exporterar den vidare.
//
// ☠️ EN REGEL, INTE TVÅ. Det poleringens grind fäller ska importen och
// specifikationsverktyget ta bort (`radHarModellnummer`). Med två regler stod
// "Modell: <kod> <ord>" och "Artikelmodell Artikelmodellnummer: <kod>" kvar
// efter verktyget, som ändå räknade sidan som att byta: 21 sidor skrevs om
// varje körning utan att bli rätta (2026-11-01).
export const MODELLNR =
  /\b(?:[Aa]rtikelmodell(?:nummer)?|[Mm]odellnummer|[Mm]odellnr|[Pp]roduktmodell|[Aa]rtikelnr|[Il]tem modellnummer)\b|\bArtikelnummer\b(?!(?:[\s:]|<[^>]*>)*FP-)|\bModell\s*:(?:\s|<[^>]*>)*(?=[A-Z0-9.-]*\d)[A-Z0-9][A-Z0-9.-]{2,}\b/;

/**
 * Fäller poleringens regel raden "etikett: värde", som den står i fliken? En
 * etikett med kolon eller punkt sist ("Modellnummer:") läses utan dem.
 */
export function radHarModellnummer(etikett: string, varde: string): boolean {
  return MODELLNR.test(`${etikett.trim().replace(/[:.\s]+$/, "")}: ${varde.trim()}`);
}
