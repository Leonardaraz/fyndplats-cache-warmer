// lib/sok-rankning.ts
//
// Rankningen av sökrutans förslag: träffarna, antalet, sökförslagen och den
// tomma rutans exempel. Flyttad hit ur lib/sok-index.ts 2026-11-19.
//
// ☠️ LADDAS VID AVSIKT, INTE MED SIDAN. Sökrutan ligger i sidhuvudet på varje
// sida, och den här modulen drar in hela sökmotorn (lib/search.ts: 18 kB
// minifierat och 7,6 kB gzip på morgonen 2026-11-19, 27,6 kB och 10,7 kB
// efter kvällens genomgång, mätt i bygget). Sökrutan hämtar den med
// import() när pekaren eller fingret når rutan, samtidigt som sökindexet
// (components/searchbox.tsx, laddaMotor). Den som aldrig söker laddar den
// aldrig. Kontaktformulärets produktväljare importerar den som vanligt: den
// sidan söker alltid.

import { byggOrdforrad, byggOrdforradSteg, forberedKatalogSteg, kortOrd, markeraTraffar, markeringsord, matchaKategorier, normalize, rankaMedInfo, rankByName, sokforslagINamn, visaVarorFor, type Kategoridata, type Ordforrad } from "./search";
import { sokExempelHamtade, sokKategorierHamtade, type SokTraff } from "./sok-index";
import { kopbaraForst } from "./sok-ordning";

export { kortOrd, markeraTraffar, markeringsord, matchaKategorier, visaVarorFor };

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
 * Kategorierna för sökningen: tabellen som kom med indexet, och radens `k`.
 * Undefined för ett index utan tabell (sökningen söker då bara i namnen).
 */
function kategoridata(): Kategoridata<SokTraff> | undefined {
  const kat = sokKategorierHamtade();
  return kat.length > 0 ? { kat, av: radensKategorier } : undefined;
}
const radensKategorier = (h: SokTraff) => h.k;

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
 * Sökrutans förslag: resultatsidans första `antal` varor, och hur många som
 * matchar, så att knappen kan säga "Visa alla 89 resultat".
 *
 * ☠️ SAMMA ORDNING SOM RESULTATSIDAN (2026-11-20, lib/sok-ordning.ts). Det
 * köpbara läggs först bland ALLA träffar och sedan klipps listan, precis som
 * sidan gör. Förr klipptes de mest relevanta först och de slutsålda sänktes
 * bland dem (som i rankaForslag ovan), och då visade rutan varor som sidan
 * hade längst ner: "bil" skilde sig från plats 10 på www. En slutsåld vara
 * syns här när de köpbara träffarna är färre än `antal`.
 *
 * `behall` gallrar träffarna FÖRE klippet (priset i sökningen, lib/sok-pris.ts):
 * annars kunde sju dyra varor fylla listan fast det fanns billiga längre ner.
 *
 * `rattat` är sökningen med stavningen rättad, när träffarna gäller den
 * ("ellamin" → "elkamin", lib/search.ts): rutan säger då vilket ord den visar.
 * `liknande` är satt när inget namn har sökordet och träffarna bara ligger nära.
 */
export function rankaForslagMedAntal(
  idx: SokTraff[], term: string, antal: number, behall?: (h: SokTraff) => boolean,
): { traffar: SokTraff[]; totalt: number; rattat?: string; liknande?: true } {
  const utfall = rankaMedInfo(idx, (h) => h.n, term, namnFor(idx), kategoridata());
  const kvar = kopbaraForst(behall ? utfall.traffar.filter(behall) : utfall.traffar, (h) => h.o === 1);
  return {
    traffar: kvar.slice(0, antal),
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

/**
 * Vad man kan söka på, för den tomma rutan: katalogens vanligaste varuord.
 *
 * ☠️ INDEXET BÄR DEM FÄRDIGA (2026-11-20, app/api/search-index/route.ts). Förr
 * byggdes hela ordförrådet här, i samma uppgift som de populära varorna
 * ritades: den största uppgiften när sökläget öppnades. Utan färdiga exempel
 * (ett äldre index, eller ett utan kategoritabell) räknas de som förut.
 */
export function sokexempelFor(idx: SokTraff[], max: number): string[] {
  const fardiga = sokExempelHamtade();
  return (fardiga.length > 0 ? fardiga : ordforradFor(idx).exempel).slice(0, max);
}

/**
 * Bygg ordförrådet, de normaliserade namnen och sökningens ordbok i förväg,
 * när webbläsaren har en ledig stund. Ordförrådet tar runt 50 ms på en dator
 * och resten runt 60 ms (mätt 2026-11-20 på 7 886 varor), flera gånger det på
 * en telefon; görs det här hinner det oftast bli klart mellan att pekaren når
 * rutan och att första tangenten trycks. Hinner det inte byggs det vid första
 * användningen, som förut.
 *
 * ☠️ ETT STEG PER LEDIG STUND (2026-11-20). Allt i en uppgift höll skärmen
 * låst i upp till 390 ms på en strypt telefon, och tangenten som trycktes
 * under tiden fick vänta. Nu lämnas turen tillbaka mellan stegen (namnen,
 * ordförrådet i fem omgångar och de sex i forberedKatalogSteg), så att en
 * tangent hinner emellan. Söker kunden innan ordförrådet är klart byggs det i
 * ett stycke då (ordforradFor), och stegens arbete kastas.
 */
const uppvarmda = new WeakSet<SokTraff[]>();
export function varmUpp(idx: SokTraff[]): void {
  // Rutan ber om uppvärmning varje gång pekaren eller fingret når den.
  if (uppvarmda.has(idx)) return;
  uppvarmda.add(idx);
  let steg: (() => void)[] | null = null;
  const ledig = (globalThis as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  const vanta = (forst: boolean) => {
    if (ledig) ledig(nasta, { timeout: forst ? 600 : 300 });
    else setTimeout(nasta, 60);
  };
  const nasta = () => {
    // Stegen skapas först här, i den lediga stunden. Motorns egna steg läggs
    // till sist, när namnen är normaliserade.
    steg ??= [
      () => { namnFor(idx); },
      ...(ordforrad.has(idx) ? [] : byggOrdforradSteg(idx.map((h) => h.n), (f) => { if (!ordforrad.has(idx)) ordforrad.set(idx, f); })),
      () => { steg?.push(...forberedKatalogSteg(idx, namnFor(idx), kategoridata())); },
    ];
    steg.shift()?.();
    if (steg.length > 0) vanta(false);
  };
  vanta(true);
}
