// lib/rea.ts
//
// PUNKT 16: /rea är en PERMANENT landningssida medan innehållet roterar.
//
// Före den här sidan fanns ingen adress för rean alls. Navigationens REA-knapp
// pekade på /alla-produkter?rea=1 — ett filter i en frågesträng, alltså något
// Google varken indexerar eller rankar. Den som sökte "fyndplats rea" hittade
// ingenting hos oss.
//
// INGEN IMPORT HÄR, MED FLIT. Modulen är beroendefri så att node-testköraren
// kan ladda den: allt som importerar ./products drar in Wix-SDK:n och går inte
// att ladda i provet. Samma mönster som lib/retur-frakt.ts och
// lib/seo/programmatic-select.ts. Produkten beskrivs därför strukturellt nedan
// i stället för att typen importeras.

/** Det minsta vi behöver veta om en produkt för att avgöra om den är ett fynd. */
export type ReaKandidat = {
  onSale?: boolean;
  inStock?: boolean;
};

/**
 * Varorna som får stå på /rea.
 *
 * ☠️ REGELN MÅSTE VARA IDENTISK med `hasSale` i components/site.tsx, som
 * avgör om REA-knappen visas i navigationen. Divergerar de leder knappen till
 * en tom sida — exakt det felet som en gång redan lagats, när knappen pekade
 * på /kategori/rea (en kategori som aldrig funnits) och 307:ade till /butik.
 * lib/rea.test.ts håller ihop dem.
 *
 * `inStock` krävs av samma skäl som i navigationen: en nedsatt slutsåld vara
 * är inget fynd, den är en besvikelse med prislapp.
 */
export function saleProducts<T extends ReaKandidat>(products: T[]): T[] {
  return products.filter((p) => !!p.onSale && !!p.inStock);
}

export const REA_TITLE = "REA – aktuella fynd & erbjudanden";

export const REA_H1 = "REA & aktuella fynd";

export const REA_META_DESC =
  "Alla nedsatta varor hos Fyndplats samlade på ett ställe – hem, kök, elektronik och fritid. Fri frakt över 499 kr, 30 dagars öppet köp och trygg betalning med Klarna.";

/**
 * Sidans egen brödtext. Två stycken, medvetet korta.
 *
 * VAD DEN INTE FÅR SÄGA: någonting om hur mycket du sparar, eller mot vilket
 * pris nedsättningen räknas. Den uppgiften mäts först från och med punkt 14 och
 * blir användbar efter 30 dagars historik. Ett löfte här hade varit ett
 * påstående vi ännu inte kan belägga — och det är hela anledningen till att
 * punkt 14 finns.
 */
export const REA_INTRO = [
  "Här samlar vi allt som är nedsatt hos oss just nu. Listan fylls automatiskt: så fort ett pris sänks dyker varan upp här, och när rean tar slut försvinner den igen. Du behöver alltså inte leta igenom sortimentet för att hitta fynden — de står redan samlade på den här sidan.",
  "Samma villkor gäller som på allt annat hos oss: fri frakt över 499 kr, 30 dagars öppet köp och trygg betalning med Klarna. Ett nedsatt pris betyder inte sämre köpvillkor.",
];

/** Ledet under rubriken. Tomt läge har en egen, ärlig lydelse. */
export function reaLede(antal: number): string {
  if (antal <= 0) {
    return "Just nu är inget nedsatt. Så fort vi sänker ett pris dyker varan upp här.";
  }
  if (antal === 1) {
    return "En vara är nedsatt just nu – samlad här tillsammans med allt annat som går ned i pris.";
  }
  return `${antal} varor är nedsatta just nu – hem, kök, elektronik och fritid, samlade på ett ställe.`;
}
