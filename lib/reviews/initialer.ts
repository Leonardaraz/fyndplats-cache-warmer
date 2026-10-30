// Reglerna för recensionernas initialer, och hur nya initialer väljs.
// Leonard 2026-10-30.
//
//   1. Aldrig bokstäverna Q, W, X, Y eller Z. (Y, X, Z, W: Leonard 2026-10-29,
//      Q lades till 2026-10-30.)
//   2. Aldrig två bokstäver i bokstavsordning: "A.B.", "L.M.", "U.V.".
//   3. Nya bokstäver slumpas ur A–V utan Q, och ibland Å eller Ö.
//   4. Inga två recensioner på samma produkt med samma initialer. (Leonard
//      2026-10-30: "är det möjligt att inte ha så många med samma initialer på
//      samma produkt?") Se "Unika initialer per produkt" längst ner.
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

/**
 * Initialer i den form butiken visar: "S." eller "S.K.". Allt annat ("Zara",
 * "Verifierad köpare") är ett namn eller en etikett och rörs inte av verktygen.
 */
export const FORM_INITIALER = /^\p{L}\.(\p{L}\.)?$/u;

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

// --- Unika initialer per produkt ------------------------------------------------
//
// Leonard 2026-10-30: "är det möjligt att inte ha så många med samma initialer på
// samma produkt?" Mätt samma dag (hela lagret, 37 190 rader): av de recensioner som
// syns i butiken delade 93 av 3 663 produkter initialer med en annan recension på
// samma produkt (107 rader); räknar man även de väntande var det 524 av 7 255
// produkter (570 rader). Ungefär dubbelt så många som ren slump ger, eftersom
// namnen i importen är ojämna ("A.R." fanns 96 gånger bland de synliga).
//
// Slumpen ger ungefär 510 olika par (23 bokstäver i kvadrat minus de 19 i
// bokstavsordning). Den största produkten hade 76 recensioner, så ett ledigt par
// finns alltid. En produkt med över 500 recensioner vore första gången det tog slut.
//
// En rads "plats" är NYCKELN `nyckelForInitialer`: bokstäverna i versaler med punkt
// efter varje, så "s.k." och "S.K." är samma plats. Avvisade recensioner syns aldrig
// och upptar ingen plats; väntande gör det, eftersom de blir synliga när de godkänns.

/** Nyckeln en rads initialer upptar på sin produkt ("s.k." → "S.K."). Tom när det inte finns några bokstäver. */
export function nyckelForInitialer(initials: string | undefined): string {
  return bokstaverIInitialer(initials)
    .map((b) => `${b}.`)
    .join("");
}

/**
 * Platsen en rad upptar på sin produkt, eller null när den inte upptar någon:
 * avvisade recensioner syns aldrig, och initialer i annan form än "S.K." är inget
 * som kan delas.
 *
 * ☠️ Planen (lib/reviews/slumpa-initialer.ts) och importen (lib/import/review-import.ts)
 * räknar platserna med den här funktionen. Då kan de inte bli oense om vad som är
 * upptaget, och en rad som importen släppt igenom är aldrig en dubblett i planen.
 */
export function platsPaProdukt(r: { initials?: string; status?: string }): string | null {
  if (r.status === "rejected") return null;
  const initialer = (r.initials ?? "").trim();
  return FORM_INITIALER.test(initialer) ? nyckelForInitialer(initialer) : null;
}

/** Platserna som en produkts rader redan upptar. */
export function upptagnaPlatser(rader: Iterable<{ initials?: string; status?: string }>): Set<string> {
  const ut = new Set<string>();
  for (const r of rader) {
    const plats = platsPaProdukt(r);
    if (plats) ut.add(plats);
  }
  return ut;
}

/** Bokstäverna ett nytt par dras ur: A–V utan Q, samt Å och Ö. */
const DRAGBARA_BOKSTAVER = [...SLUMPBOKSTAVER, "Å", "Ö"];

/**
 * Alla par slumpen kan ge, som nycklar, i fast ordning. Samma mängd som
 * `slumpaInitialer` drar ur: två dragbara bokstäver där den andra inte står direkt
 * efter den första. "A.A." räknas (samma bokstav två gånger är inte bokstavsordning).
 */
export const GILTIGA_PAR: readonly string[] = (() => {
  const ut: string[] = [];
  for (const a of DRAGBARA_BOKSTAVER) {
    for (const b of DRAGBARA_BOKSTAVER) {
      if (!iBokstavsordning(a, b)) ut.push(`${a}.${b}.`);
    }
  }
  return ut;
})();

/** Så många nya dragningar provas innan ett ledigt par väljs ur listan över lediga. */
const UNIKA_FORSOK = 64;

/**
 * Två slumpade bokstäver ur fröet, som inte redan är upptagna på produkten.
 * `upptagna` är nycklar ur `nyckelForInitialer`.
 *
 * Första försöket är exakt `slumpaInitialer(seed)`, så en rad utan krock får samma
 * initialer som förut. Ger det en krock provas `seed:1`, `seed:2` … Efter 64 försök
 * väljs ett par ur listan över de lediga (ett frö-styrt val), så funktionen hittar
 * ett par så länge något finns. Null när alla ~510 par är upptagna.
 *
 * Resultatet följer alltid reglerna 1–3: det är ett av `GILTIGA_PAR`.
 */
export function slumpaUnika(seed: string, upptagna: ReadonlySet<string>): string | null {
  for (let k = 0; k < UNIKA_FORSOK; k++) {
    const kandidat = slumpaInitialer(k === 0 ? seed : `${seed}:${k}`);
    if (!upptagna.has(kandidat)) return kandidat;
  }
  const lediga = GILTIGA_PAR.filter((par) => !upptagna.has(par));
  if (lediga.length === 0) return null;
  return lediga[Math.floor(generator(`${seed}:lediga`)() * lediga.length)];
}

/**
 * `rattaInitialer`, men resultatet får inte vara upptaget på produkten. Null när
 * initialerna redan är i sin ordning (som `rattaInitialer`).
 *
 * Är det rättade resultatet upptaget provas `seed:1`, `seed:2` … med samma metod
 * (en bevarad bokstav behålls alltså); hjälper inte det dras två helt nya
 * bokstäver. Finns inget ledigt par alls ges det första, regelrätta resultatet:
 * reglerna 1–3 går före unikheten.
 */
export function rattaInitialerUnika(
  initials: string | undefined,
  seed: string,
  upptagna: ReadonlySet<string>,
): string | null {
  const forsta = rattaInitialer(initials, seed);
  if (forsta === null) return null;
  if (!upptagna.has(nyckelForInitialer(forsta))) return forsta;
  for (let k = 1; k < UNIKA_FORSOK; k++) {
    const nya = rattaInitialer(initials, `${seed}:${k}`);
    if (nya !== null && !upptagna.has(nyckelForInitialer(nya))) return nya;
  }
  return slumpaUnika(seed, upptagna) ?? forsta;
}
