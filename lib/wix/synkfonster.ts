// Aosoms synkfönster: när motorn själv skriver lager och priser mot Wix.
//
// Lagerkörningen (`20 */6`) och priskörningen (`20 3,9,15,21`) i vercel.json går tillsammans
// var tredje timme, 00, 03, 06 … 21 UTC, och startar :20. Läsningen av feeden, mappningarna och
// butikens priser före dem gör att Wix tar emot skrivningar redan från ungefär :12, och en körning
// kan hålla på till :29. Verktygen som skriver sida för sida och jämför lagret före och efter
// (kostnaden, variantbilderna, bildrundorna) tolkar en ändring av lagret som en avvikelse och
// stannar, så de väntar ut fönstret i stället för att krocka med synken.
//
// ☠️ Regeln stod förut bara i CLAUDE.md och i varje workflows egen bash-funktion. En regel man måste
// komma ihåg glöms bort (samma lärdom som `AliExpressProductId`), så rutter som skriver i stora
// mängder frågar den här modulen och vägrar skriva inne i fönstret eller så nära att en tidsbudget
// skulle löpa in i det.

/** Synkens timmar är de som går jämnt upp i det här talet (0, 3, 6 … 21). */
export const SYNK_TIMMAR_VAR = 3;
/** Första minuten av fönstret (inklusive). */
export const FONSTER_START_MIN = 12;
/** Första minuten EFTER fönstret: fönstret är :12:00 till och med :29:59. */
export const FONSTER_SLUT_MIN = 30;

const MS_PER_TIMME = 3_600_000;

function fonsterStart(dagStart: number, timme: number): number {
  return dagStart + timme * MS_PER_TIMME + FONSTER_START_MIN * 60_000;
}

function fonsterSlut(dagStart: number, timme: number): number {
  return dagStart + timme * MS_PER_TIMME + FONSTER_SLUT_MIN * 60_000;
}

function dagensStart(nu: Date): number {
  return Date.UTC(nu.getUTCFullYear(), nu.getUTCMonth(), nu.getUTCDate());
}

/** Sant när `nu` ligger inne i ett synkfönster. */
export function iSynkfonster(nu: Date): boolean {
  const dag = dagensStart(nu);
  const t = nu.getTime();
  const timme = nu.getUTCHours();
  if (timme % SYNK_TIMMAR_VAR !== 0) return false;
  return t >= fonsterStart(dag, timme) && t < fonsterSlut(dag, timme);
}

/** Starten av nästa fönster som börjar efter `nu` (ett fönster som pågår räknas inte). */
export function nastaFonsterStart(nu: Date): Date {
  const t = nu.getTime();
  let dag = dagensStart(nu);
  for (let d = 0; d < 2; d++, dag += 24 * MS_PER_TIMME) {
    for (let timme = 0; timme < 24; timme += SYNK_TIMMAR_VAR) {
      const start = fonsterStart(dag, timme);
      if (start > t) return new Date(start);
    }
  }
  // Onåbar: i dag eller i morgon finns alltid ett fönster.
  throw new Error("inget synkfönster hittades inom två dygn");
}

/** Slutet (första sekunden efter) av fönstret som pågår, annars av det som börjar härnäst. */
export function nastaFonsterSlut(nu: Date): Date {
  const dag = dagensStart(nu);
  const timme = nu.getUTCHours();
  if (iSynkfonster(nu)) return new Date(fonsterSlut(dag, timme));
  const start = nastaFonsterStart(nu);
  return new Date(start.getTime() + (FONSTER_SLUT_MIN - FONSTER_START_MIN) * 60_000);
}

/**
 * Hur många hela sekunder som finns att skriva i innan nästa fönster, minus en marginal. Noll när `nu`
 * ligger i ett fönster eller så nära att marginalen inte ryms.
 */
export function sekunderTillSkrivning(nu: Date, marginalSek: number): number {
  if (iSynkfonster(nu)) return 0;
  const kvar = Math.floor((nastaFonsterStart(nu).getTime() - nu.getTime()) / 1000) - marginalSek;
  return Math.max(0, kvar);
}
