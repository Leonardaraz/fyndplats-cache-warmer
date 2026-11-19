// lib/sok-rankning.ts
//
// Rankningen av sökrutans förslag: träffarna, antalet, sökförslagen och den
// tomma rutans exempel. Flyttad hit ur lib/sok-index.ts 2026-11-19.
//
// ☠️ LADDAS VID AVSIKT, INTE MED SIDAN. Sökrutan ligger i sidhuvudet på varje
// sida, och den här modulen drar in hela sökmotorn (lib/search.ts: 18 kB
// minifierat, 7,6 kB gzip, mätt i bygget 2026-11-19). Sökrutan hämtar den med
// import() när pekaren eller fingret når rutan, samtidigt som sökindexet
// (components/searchbox.tsx, laddaMotor). Den som aldrig söker laddar den
// aldrig. Kontaktformulärets produktväljare importerar den som vanligt: den
// sidan söker alltid.

import { byggOrdforrad, kortOrd, markeringsord, matchaKategorier, normalize, rankaMedInfo, rankByName, sokforslagINamn, visaVarorFor, type Ordforrad } from "./search";
import type { SokTraff } from "./sok-index";

export { kortOrd, markeringsord, matchaKategorier, visaVarorFor };

// Namnen normaliseras en gång per hämtat index, inte vid varje tangent: 6 000
// namn tog 2–6 ms per tangent på en dator och runt 8 ms på en strypt telefon
// (mätt 2026-11-07), plus 6 000 nya strängar för skräpsamlaren varje gång.
const normNamn = new WeakMap<SokTraff[], string[]>();
function namnFor(idx: SokTraff[]): string[] {
  let namn = normNamn.get(idx);
  if (!namn) {
    namn = idx.map((h) => normalize(h.n));
    normNamn.set(idx, namn);
  }
  return namn;
}

/**
 * Förslagen för en sökning: de `antal` mest relevanta, slutsålda sist.
 *
 * ORDNINGEN ÄR VIKTIG: klipp på RELEVANS först, sänk slutsålda EFTERÅT.
 * Sänker man slutsålda före klippet kan en exakt namnträff som råkar vara
 * slut tryckas ut ur listan av svaga träffar som råkar finnas i lager — dvs.
 * söker man på varan man just sett hittar man den inte. Nu visas alltid de
 * mest relevanta; slutsålda bland dem hamnar längst ned. (sort är stabil i JS,
 * så relevansordningen består inom varje grupp.)
 */
export function rankaForslag(idx: SokTraff[], term: string, antal: number): SokTraff[] {
  return rankByName(idx, (h) => h.n, term, namnFor(idx))
    .slice(0, antal)
    .sort((a, b) => (a.o ? 1 : 0) - (b.o ? 1 : 0));
}

/**
 * Som rankaForslag, men säger också hur många varor som matchar, så att
 * knappen kan säga "Visa alla 89 resultat". `behall` gallrar träffarna FÖRE
 * klippet (priset i sökningen, lib/sok-pris.ts): annars kunde sju dyra varor
 * fylla listan fast det fanns billiga längre ner.
 *
 * `rattat` är sökningen med stavningen rättad, när träffarna gäller den
 * ("ellamin" → "elkamin", lib/search.ts): rutan säger då vilket ord den visar.
 * `liknande` är satt när inget namn har sökordet och träffarna bara ligger nära.
 */
export function rankaForslagMedAntal(
  idx: SokTraff[], term: string, antal: number, behall?: (h: SokTraff) => boolean,
): { traffar: SokTraff[]; totalt: number; rattat?: string; liknande?: true } {
  const utfall = rankaMedInfo(idx, (h) => h.n, term, namnFor(idx));
  const kvar = behall ? utfall.traffar.filter(behall) : utfall.traffar;
  return {
    traffar: kvar.slice(0, antal).sort((a, b) => (a.o ? 1 : 0) - (b.o ? 1 : 0)),
    totalt: kvar.length,
    ...(utfall.rattat && kvar.length > 0 ? { rattat: utfall.rattat } : {}),
    ...(utfall.liknande && kvar.length > 0 ? { liknande: true as const } : {}),
  };
}

// Katalogens ordförråd byggs en gång per hämtat index (lib/search.ts,
// byggOrdforrad): några millisekunder för 7 600 namn, sedan är varje förslag
// en genomgång av ett par tusen ord.
const ordforrad = new WeakMap<SokTraff[], Ordforrad>();
function ordforradFor(idx: SokTraff[]): Ordforrad {
  let f = ordforrad.get(idx);
  if (!f) {
    f = byggOrdforrad(idx.map((h) => h.n));
    ordforrad.set(idx, f);
  }
  return f;
}

/**
 * Sökningarna kunden är på väg att skriva ("sof" → soffa, soffbord). Förslag
 * på flera ord prövas mot namnen, så att de leder till varor (sokforslagINamn).
 */
export function sokforslagFor(idx: SokTraff[], skrivet: string, max: number): string[] {
  return sokforslagINamn(ordforradFor(idx), namnFor(idx), skrivet, max);
}

/** Vad man kan söka på, för den tomma rutan: katalogens vanligaste varuord. */
export function sokexempelFor(idx: SokTraff[], max: number): string[] {
  return ordforradFor(idx).exempel.slice(0, max);
}

/**
 * Bygg ordförrådet och de normaliserade namnen i förväg, när webbläsaren har
 * en ledig stund. Ordförrådet tar 30–50 ms på en dator (mätt 2026-11-19) och
 * flera gånger det på en telefon; görs det här hinner det oftast bli klart
 * mellan att pekaren når rutan och att första tangenten trycks. Hinner det
 * inte byggs det vid första användningen, som förut.
 */
export function varmUpp(idx: SokTraff[]): void {
  const gor = () => {
    ordforradFor(idx);
    if (!normNamn.get(idx)) normNamn.set(idx, idx.map((h) => normalize(h.n)));
  };
  const ledig = (globalThis as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ledig) ledig(gor, { timeout: 600 });
  else setTimeout(gor, 60);
}
