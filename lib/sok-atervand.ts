// Bakåt till sökläget (Leonard 2026-11-25).
//
// "Om jag skriver i sökfältet på något och trycker på produkten och sen backar
// borde jag komma tillbaka till där jag var sist i sökfältet inte helt annan
// plats." Mätt på www samma dag i telefonstorlek: "dörr" i sökläget, listan
// rullad 420 px, ett tryck på en vara och bakåt gav sidan som låg UNDER
// sökläget (en golvlampa), utan sökläge och med tomt fält.
//
// Mobilens sökläge täcker skärmen men är ingen egen sida: det är ett läge i
// sökrutan, och historiken visste ingenting om det. Nu skriver sökrutan ett
// märke i historikpostens eget tillstånd (history.state) när kunden lämnar
// sökläget för en vara, en kategori eller resultatsidan: ordet i fältet och hur
// långt listan var rullad. Ett steg i historiken som landar på en post med
// märket öppnar sökläget igen, med samma ord och på samma plats
// (components/searchbox.tsx).
//
// VARFÖR history.state OCH INTE sessionStorage MED ADRESSEN. Märket ska höra
// till POSTEN, inte till adressen: samma adress kan stå i historiken flera
// gånger, och bara den post kunden lämnade genom sökläget ska öppna det.
// Webbläsaren sparar tillståndet med posten, också över en hel sidladdning.
//
// ☠️ Next skriver om postens tillstånd när sidan byts (HistoryUpdater i
// app-router) och tar då bara med sina egna nycklar. Märket skrivs därför i
// trycket, på posten man står på, omedelbart före sidbytet: Next lägger sedan
// en NY post för den nya sidan och rör inte den gamla. När kunden kommer
// tillbaka med bakåt behåller Next det som står i tillståndet
// (preserveCustomHistoryState gäller ett steg i historiken).

/** Nyckeln i history.state. */
export const SOKMARKE = "__fpSok";
/** Ett märke äldre än så öppnar inte sökläget. Samma gräns som listans läge (lib/sidminne.ts). */
export const SOKMARKE_MAX_MS = 30 * 60_000;
/** Längre än så är ingen sökning någon skrivit för hand. */
const LANGSTA_ORD = 200;

export type Sokmarke = {
  /** Texten i sökfältet, som den stod. Tom när listan visade populära produkter. */
  q: string;
  /** Hur långt listan i sökläget var rullad. */
  y: number;
  t: number;
};

type Tillstand = Record<string, unknown>;
const somTillstand = (s: unknown): Tillstand => (s && typeof s === "object" && !Array.isArray(s) ? (s as Tillstand) : {});

/** Postens tillstånd med märket satt. Allt annat i tillståndet följer med. */
export function medSokmarke(state: unknown, m: Sokmarke): Tillstand {
  return { ...somTillstand(state), [SOKMARKE]: { q: m.q.slice(0, LANGSTA_ORD), y: Math.max(0, Math.round(m.y)), t: m.t } };
}

/** Postens tillstånd utan märket, eller null när det inte finns något märke att ta bort. */
export function utanSokmarke(state: unknown): Tillstand | null {
  const s = somTillstand(state);
  if (!(SOKMARKE in s)) return null;
  const ut = { ...s };
  delete ut[SOKMARKE];
  return ut;
}

/** Märket i en historikposts tillstånd, eller null: inget märke, fel form eller för gammalt. */
export function lasSokmarke(state: unknown, nu: number): Sokmarke | null {
  const m = somTillstand(state)[SOKMARKE] as Partial<Sokmarke> | undefined;
  if (!m || typeof m !== "object") return null;
  if (typeof m.q !== "string" || m.q.length > LANGSTA_ORD) return null;
  if (typeof m.y !== "number" || !(m.y >= 0) || !Number.isFinite(m.y)) return null;
  if (typeof m.t !== "number" || nu < m.t || nu - m.t > SOKMARKE_MAX_MS) return null;
  return { q: m.q, y: m.y, t: m.t };
}
