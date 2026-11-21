// lib/sok-sidor.ts
//
// Sökningar som namnger en av butikens egna SIDOR, inte en vara.
//
// ☠️ "rea" GAV FEM JULGIRLANGER (2026-11-21): ordet står i början av
// "REAlistiska barrgrenar". "rean", "fyndauktion" och "auktion" gav noll
// träffar, fast butiken har en sida för var och en. Den som skriver så letar
// efter sidan, och söksidan skickar dit (app/sok/page.tsx), som den gör med
// en ensam prisgräns ("under 500", lib/sok-pris.ts).
//
// Bara HELA sökningen räknas: "rea soffa" och "auktion klocka" är sökningar på
// varor och rankas som förut (där är "rea" ett fyllnadsord, lib/search.ts).
// Rean har en sida bara när butiken har reavaror: annars är sidan tom, och
// menyerna döljer länken av samma skäl (hasSale i lib/sidhuvud-data.ts).
//
// Orden är de som namnger sidan. "black friday" och "black week" är INTE med:
// vilken sida de ska leda till är ett beslut om kampanjen, inte om sökningen.
//
// LÖVMODUL: inga importer, så att `node --test` kan ladda den.

const REA = new Set(["rea", "rean", "reor", "reavaror", "rea varor", "på rea"]);
// "fyndaktion" är felstavningen som skrivs oftast: ett tappat u.
const AUKTION = new Set([
  "fyndauktion", "fyndauktionen", "fynd auktion", "fyndaktion", "fyndaktionen",
  "auktion", "auktionen", "auktioner", "dagens fynd",
]);

/** Sidan som sökningen namnger ("/rea", "/fyndauktion"), annars null. */
export function sidaForSokning(sokning: string, harRea: boolean): string | null {
  const hel = (sokning || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (AUKTION.has(hel)) return "/fyndauktion";
  if (harRea && REA.has(hel)) return "/rea";
  return null;
}
