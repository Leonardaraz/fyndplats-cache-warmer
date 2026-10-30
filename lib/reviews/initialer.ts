// Reglerna för recensionernas initialer, och hur nya initialer väljs.
// Leonard 2026-10-30.
//
//   1. Aldrig bokstäverna Q, W, X, Y eller Z. (Y, X, Z, W: Leonard 2026-10-29,
//      Q lades till 2026-10-30.)
//   2. Aldrig två bokstäver i bokstavsordning: "A.B.", "L.M.", "U.V.".
//   3. Nya bokstäver slumpas ur A–V utan Q, och ibland Å eller Ö.
//
// ☠️ VARFÖR REGEL 2 FINNS. En recension utan läsbart namn (varenda Aosom-recension,
// och AE-rader med ett namn utan bokstäver) fick sina två bokstäver ur
// `hashLetter(id, 0)` och `hashLetter(id, 1)` i review-import.ts. Den hashen är
// h·31 + tecken, och de två fröna skiljer sig bara på sista tecknet ("#0" mot
// "#1"), så hashen för salt 1 är EXAKT ett mer än för salt 0. Den andra bokstaven
// blev därför ALLTID nästa bokstav efter den första: A.B., B.C., … W.X., Z.A.
// Provat på 200 000 slumpade id: 100 %. En produktsida full av "S.T.", "U.V." och
// "M.N." ser förfalskad ut, och det var precis vad Leonard såg på fåtöljen.
//
// ☠️ DE TVÅ BOKSTÄVERNA FÅR ALDRIG DRAS UR FRÖN SOM SKILJER SIG PÅ ETT TECKEN
// UTAN ATT BLANDAS. Här dras de ur EN seedad generator (FNV-1a → murmur3:s
// slutsteg → mulberry32), så att varje bokstav är en egen dragning.
//
// "Slumpmässig" är DETERMINISTISK: bokstäverna dras ur en generator som seedas med
// recensionens id. Torrkörningen visar då exakt vad en skarp körning skriver, en
// omkörning ger samma bokstäver, och samma recension får alltid samma initialer.

/** Bokstäverna som aldrig får finnas i initialerna. */
export const FORBJUDNA = ["Q", "W", "X", "Y", "Z"] as const;

/** Bokstäverna nya initialer slumpas bland: A–V utan Q. Å och Ö kommer ibland, se nedan. */
export const SLUMPBOKSTAVER = "ABCDEFGHIJKLMNOPRSTUV".split("");

/**
 * Andel av de nya bokstäverna som blir Å respektive Ö (Leonard: "ibland"). Två
 * procent var ger Å eller Ö i ungefär var tolfte initialpar, ungefär som i
 * svenska namn.
 */
export const ANDEL_A_RING = 0.02;
export const ANDEL_O_UMLAUT = 0.02;

/** Det svenska alfabetet. "I bokstavsordning" betyder grannar i den här raden. */
const ALFABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ"];

const versal = (b: string) => b.toLocaleUpperCase("sv-SE");

/** Är bokstaven en av de förbjudna? Skiftläget spelar ingen roll. */
export function arForbjuden(b: string): boolean {
  return (FORBJUDNA as readonly string[]).includes(versal(b));
}

/**
 * Står `b` direkt efter `a` i alfabetet? ("A","B"), ("L","M") och ("Y","Z") är
 * det; ("B","A"), ("A","A") och ("Z","A") är det inte. Z–A räknas inte som
 * bokstavsordning, men "Z.A." har ändå en förbjuden bokstav.
 */
export function iBokstavsordning(a: string, b: string): boolean {
  const i = ALFABET.indexOf(versal(a));
  return i >= 0 && ALFABET[i + 1] === versal(b);
}

/** Bokstäverna i initialerna, versaler, utan punkter: "s.k." blir ["S", "K"]. */
export function bokstaverIInitialer(initials: string | undefined): string[] {
  return [...(initials ?? "")].filter((c) => /\p{L}/u.test(c)).map(versal);
}

export interface Brist {
  /** De förbjudna bokstäverna som står i initialerna, i den ordning de står. */
  forbjudna: string[];
  /** Två bokstäver där den andra följer direkt efter den första. */
  bokstavsordning: boolean;
}

/** Vad som är fel med initialerna, eller null när de är i sin ordning. */
export function bristerIInitialer(initials: string | undefined): Brist | null {
  const b = bokstaverIInitialer(initials);
  const forbjudna = b.filter(arForbjuden);
  const bokstavsordning = b.length === 2 && iBokstavsordning(b[0], b[1]);
  return forbjudna.length > 0 || bokstavsordning ? { forbjudna, bokstavsordning } : null;
}

// --- Slumpen ------------------------------------------------------------------

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Murmur3:s slutsteg: en ändrad bit i fröet ändrar ungefär hälften av bitarna i svaret. */
function blanda(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** mulberry32: små heltalssteg, så strömmen är lika i alla Node-versioner. */
function generator(seed: string): () => number {
  let a = blanda(fnv1a(seed));
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slumpBokstav(slump: () => number): string {
  const u = slump();
  if (u < ANDEL_A_RING) return "Å";
  if (u < ANDEL_A_RING + ANDEL_O_UMLAUT) return "Ö";
  return SLUMPBOKSTAVER[Math.floor(slump() * SLUMPBOKSTAVER.length)];
}

/**
 * Dras en bokstav som `passar` godkänner. `passar` utesluter högst en bokstav,
 * så femtio dragningar räcker i praktiken; sedan tar den första godkända ur
 * listan, så att funktionen alltid blir klar.
 */
function dra(slump: () => number, passar: (b: string) => boolean): string {
  for (let i = 0; i < 50; i++) {
    const b = slumpBokstav(slump);
    if (passar(b)) return b;
  }
  return SLUMPBOKSTAVER.find(passar) ?? SLUMPBOKSTAVER[0];
}

/** Två slumpade bokstäver ur fröet: aldrig förbjudna, aldrig i bokstavsordning. */
export function slumpaInitialer(seed: string): string {
  const slump = generator(seed);
  const forsta = dra(slump, () => true);
  const andra = dra(slump, (b) => !iBokstavsordning(forsta, b));
  return `${forsta}.${andra}.`;
}

/**
 * Initialer med en given första bokstav (till exempel "U" ur ett maskerat namn
 * som "u****6543") och en slumpad andra, som inte följer direkt efter den första.
 */
export function slumpaAndra(forsta: string, seed: string): string {
  const f = versal(forsta);
  const andra = dra(generator(seed), (b) => !iBokstavsordning(f, b));
  return `${f}.${andra}.`;
}

/**
 * Rättar initialer som bryter mot reglerna. Null när de redan är i sin ordning.
 *
 *   - Bokstavsordning ("K.L."): båda bokstäverna är påhittade, så båda slumpas om.
 *   - Annars byts bara de förbjudna bokstäverna ("Z.K." → "R.K."); den andra behålls.
 *
 * Resultatet har aldrig en förbjuden bokstav och är aldrig i bokstavsordning, så
 * en rättad rad behöver aldrig rättas igen. `seed` ska vara stabil per recension.
 */
export function rattaInitialer(initials: string | undefined, seed: string): string | null {
  const brist = bristerIInitialer(initials);
  if (!brist) return null;
  const slump = generator(seed);
  if (brist.bokstavsordning) {
    const forsta = dra(slump, () => true);
    const andra = dra(slump, (b) => !iBokstavsordning(forsta, b));
    return `${forsta}.${andra}.`;
  }
  const ut = bokstaverIInitialer(initials);
  for (let i = 0; i < ut.length; i++) {
    if (!arForbjuden(ut[i])) continue;
    ut[i] = dra(slump, (b) => {
      // En ny första bokstav får inte följas av grannen, en ny andra inte följa sin.
      if (i === 0 && ut.length === 2) return !iBokstavsordning(b, ut[1]);
      if (i === 1) return !iBokstavsordning(ut[0], b);
      return true;
    });
  }
  return ut.map((b) => `${b}.`).join("");
}
