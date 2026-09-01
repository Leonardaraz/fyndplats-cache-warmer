// Steg 6: radera drift-datan ur Wix Data — det som faktiskt frigör 4 000-taket.
//
// ☠️ DET HÄR ÄR DEN ENDA OÅTERKALLELIGA OPERATIONEN I HELA MIGRATIONEN.
// Kopieringen kunde köras om, växlingen är en env-variabel, verifieringen
// skriver ingenting. Den här raderar rader som inte finns någon annanstans än
// i Postgres efteråt. Varje spärr nedan finns för att en felaktig körning inte
// ska gå att ångra.
//
// FEM EGENSKAPER SOM INTE SKA TAS BORT
//
// 1. ☠️ VARJE RAD SLÅS UPP I POSTGRES INNAN DEN RADERAS. Inte radantal, inte
//    ett stickprov — varje id. Saknas en enda rad i kopian avbryts sidan och
//    ingenting raderas ur den. Kopieringens verifiering jämför tio rader per
//    tabell; det duger för att upptäcka en trasig kopia, men inte för att
//    auktorisera en radering av 15 000 rader.
//
// 2. ☠️ SPÄRRLISTAN ÄR EGEN, INTE HÄRLEDD UR ATT_KOPIERA. Tre kollektioner
//    läses DIREKT av butiken (recensioner, auktioner, redirects) och flyttade
//    aldrig. Att bara lita på "vi loopar över kopielistan" hade betytt att en
//    framtida rad i den listan tyst vidgar blast-radien till en kollektion
//    butiken behöver. Listan här är ett andra lås som måste öppnas medvetet.
//
// 3. ☠️ RADERING SKER PÅ EXPLICIT ID-LISTA, ALDRIG PÅ FILTER. Ett filter som
//    matchar bredare än avsett är exakt det fel som inte går att ta tillbaka.
//
// 4. ☠️ VI LÄSER ALLTID FRÅN OFFSET 0. Radering KRYMPER kollektionen, så en
//    offset-markör hoppar över precis så många rader som nyss raderades — samma
//    fälla som media-cleanup gick i (se CLAUDE.md: "markören är en OFFSET").
//    Nästa sida flyttar sig till offset 0 av sig själv, så loopen konvergerar.
//
// 5. Torrkörning är default. Utan dryRun=false läses och verifieras allt, men
//    ingenting raderas — samma hållning som resten av husets rutter.

import { ATT_KOPIERA, LLM_SAMLINGAR } from "@/lib/db/tabeller";

/** Kollektioner som ALDRIG får röras, oavsett vad kopielistan säger.
 *  De tre första läses direkt av butiksrepot; flyttas de måste butiken byggas
 *  om, och de frigör inte de rader som binder. Tokenraden står här för att en
 *  raderad token inte går att läsa tillbaka — vägen tillbaka är ny OAuth för
 *  hand, samma återvändsgränd som de 30 dygnen utan förnyelse 2026-08-29. */
export const ALDRIG_RADERA = [
  "FyndplatsImportedReviews",
  "FyndplatsAuctions",
  "FyndplatsRedirects",
  "FyndplatsAliExpressTokens",
  "FyndplatsAppConfig",
  "FyndplatsPricingConfig",
] as const;

export function fårRaderas(kollektion: string): boolean {
  if ((ALDRIG_RADERA as readonly string[]).includes(kollektion)) return false;
  const tillåtna = [
    ...ATT_KOPIERA.map((s) => s.kollektion),
    ...LLM_SAMLINGAR,
  ];
  return tillåtna.includes(kollektion);
}

export type SidBeslut =
  | { sort: "radera"; ids: string[] }
  | { sort: "avbryt"; saknade: string[]; av: number };

/**
 * Avgör om en läst Wix-sida får raderas.
 *
 * @param wixIds  id:n som lästes ur Wix
 * @param iKopian id:n som faktiskt finns i Postgres (uppslagna, inte antagna)
 *
 * ☠️ Saknas något id i kopian raderas INGENTING ur sidan — inte ens de rader
 * som råkar finnas. En delvis raderad sida är svårare att upptäcka och laga än
 * en orörd, och den som läser rapporten ska se hela problemet på en gång.
 */
export function beslutaSida(wixIds: string[], iKopian: Set<string>): SidBeslut {
  const saknade = wixIds.filter((id) => !iKopian.has(id));
  if (saknade.length > 0) return { sort: "avbryt", saknade, av: wixIds.length };
  return { sort: "radera", ids: wixIds };
}
