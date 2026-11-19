// lib/sok-pris.ts
//
// PRISET I SÖKNINGEN (2026-11-19). "soffa under 2000" gav förut 692 träffar med
// "förvaring under sitsen" överst, och efter första sökbygget 137 soffor med
// beskedet att "2000" ströks. Kunden bad om soffor under 2 000 kr. Nu läses
// priset ur sökningen, sökorden rankas utan det, och träffarna visas inom
// priset, med ett besked och en knapp som visar alla.
//
// ☠️ ETT TAL EFTER "UNDER" ÄR INTE ALLTID ETT PRIS. "leksak under 3 år",
// "skrivbord under 120 cm" och "tv-bänk max 160" är ålder och mått. Reglerna:
//   1. Talet måste stå direkt efter ett prisord ("under", "max", "över" …).
//   2. Följs talet av en enhet (år, cm, kg, liter, personer …) är det inget pris.
//   3. Utan "kr" efter talet måste det vara minst 300: mått och vikter i
//      katalogen går upp mot 300, priserna börjar runt 200.
//   4. Blir inga sökord kvar ("under 500") är det ingen prisfråga: då finns
//      det inget att ranka.
//
// LÖVMODUL: inga importer, så att `node --test` kan ladda den och så att
// sökrutan, söksidan och den kalla vägen delar samma tolkning.

export type Prisfraga = {
  /** Sökorden utan prisdelen. Hela sökningen när inget pris hittades. */
  fraga: string;
  /** Högsta pris i kronor ("under 2000"). */
  max?: number;
  /** Lägsta pris i kronor ("över 5000"). */
  min?: number;
};

const TAK = "under|max|högst|billigare än|upp till|mindre än";
const GOLV = "över|minst|dyrare än|mer än";
const PRIS_RE = new RegExp(
  `(^|\\s)(${TAK}|${GOLV})\\s+(\\d{1,3}(?:[ \\u00a0.]\\d{3})+|\\d+)\\s*(kr|kronor|sek|:-)?(?=\\s|$)`,
  "i",
);
const TAK_RE = new RegExp(`^(?:${TAK})$`, "i");
/** Enheter som gör talet till ålder, mått, vikt eller antal. */
const ENHET = /^(?:år|åring|månader|mån|cm|mm|m|meter|kg|g|gram|liter|l|st|personer|pers|tum|w|watt|v|volt|delar|pack|pers\.|x|×|hk|mah)(?=\s|$)/i;
/** Under det här talet krävs "kr" för att det ska vara ett pris (regel 3). */
export const MINSTA_PRIS_UTAN_KR = 300;

export function tolkaPris(sokning: string): Prisfraga {
  const hel = (sokning || "").replace(/\s+/g, " ").trim();
  const m = PRIS_RE.exec(hel);
  if (!m) return { fraga: hel };
  const tal = Number(m[3].replace(/[  .]/g, ""));
  const medKr = Boolean(m[4]);
  const efter = hel.slice(m.index + m[0].length).trimStart();
  if (!Number.isFinite(tal) || tal <= 0) return { fraga: hel };
  if (!medKr && (tal < MINSTA_PRIS_UTAN_KR || ENHET.test(efter))) return { fraga: hel };
  const fraga = `${hel.slice(0, m.index)} ${efter}`.replace(/\s+/g, " ").trim();
  if (!fraga) return { fraga: hel };
  return TAK_RE.test(m[2]) ? { fraga, max: tal } : { fraga, min: tal };
}

/** Har sökningen ett pris? */
export const harPris = (p: { max?: number; min?: number }): boolean => p.max !== undefined || p.min !== undefined;

/**
 * Ligger priset inom frågan? "under 2000" tar med 2 000 kr jämnt: den som
 * skriver så menar sin budget, och en vara för 1 999 kr och en för 2 000 kr är
 * samma svar.
 */
export function inomPris(p: { max?: number; min?: number }, kr: number): boolean {
  if (!(kr > 0)) return false;
  if (p.max !== undefined && kr > p.max) return false;
  if (p.min !== undefined && kr < p.min) return false;
  return true;
}

/** Priset ur indexets pristext ("1 599 kr", "Från 659 kr"). 0 när det inte går att läsa. */
export function prisTal(text: string): number {
  return Number((text || "").replace(/[^\d]/g, "")) || 0;
}

/** Varans lägsta pris i en lista: från-priset när varan har flera. */
export function lagstaPris(p: { priceNum?: number; priceFromNum?: number; hasRange?: boolean }): number {
  return (p.hasRange && p.priceFromNum ? p.priceFromNum : p.priceNum) || 0;
}

/** "under 2 000 kr" eller "över 5 000 kr", för beskeden. */
export function prisText(p: { max?: number; min?: number }): string {
  const kr = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} kr`;
  if (p.max !== undefined) return `under ${kr(p.max)}`;
  if (p.min !== undefined) return `över ${kr(p.min)}`;
  return "";
}
