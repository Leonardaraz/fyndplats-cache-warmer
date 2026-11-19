// lib/sok-senaste.ts
//
// SENASTE SÖKNINGAR (2026-11-19). Den som söker "hundbur", tittar på en vara
// och går tillbaka till rutan ska inte behöva skriva om ordet.
//
// ☠️ LAGRAS BARA MED KUNDENS JA. Sökhistorik i webbläsarens lagring är inte
// nödvändig för att butiken ska fungera, så den kräver samtycke (9 kap. 28 §
// lagen om elektronisk kommunikation). Listan ligger därför alltid i minnet,
// där den lever så länge sidbesöket varar, och sparas i localStorage bara när
// kakvalet är "all" (lib/consent.ts). Den som valt "bara nödvändiga" får
// senaste sökningar under besöket och ingenting sparat.
//
// LÖVMODUL: inga importer.

export const SENASTE_NYCKEL = "fp_sok_senaste";
export const SENASTE_MAX = 5;
const KORTAST = 2;
const LANGST = 60;
/** Samma nyckel och värde som lib/consent.ts (CONSENT_KEY, "all"). */
const SAMTYCKE_NYCKEL = "fp_cookie_consent";

/** Listan med en ny sökning först. Samma ord (oavsett versaler) står en gång. */
export function medSokning(lista: readonly string[], sokning: string): string[] {
  const t = (sokning || "").replace(/\s+/g, " ").trim();
  if (t.length < KORTAST || t.length > LANGST) return [...lista];
  const nyckel = t.toLowerCase();
  return [t, ...lista.filter((x) => x.toLowerCase() !== nyckel)].slice(0, SENASTE_MAX);
}

/** Det som går att lita på ur lagringen: en lista med rimliga strängar. */
export function tolkaSparade(ratt: string | null): string[] {
  if (!ratt) return [];
  try {
    const d: unknown = JSON.parse(ratt);
    if (!Array.isArray(d)) return [];
    return d.filter((x): x is string => typeof x === "string" && x.trim().length >= KORTAST && x.length <= LANGST).slice(0, SENASTE_MAX);
  } catch {
    return [];
  }
}

let minne: string[] | null = null;

const farSpara = (): boolean => {
  try {
    return window.localStorage.getItem(SAMTYCKE_NYCKEL) === "all";
  } catch {
    return false;
  }
};

/** Senaste sökningarna, nyast först. */
export function senasteSokningar(): string[] {
  if (minne) return minne;
  let sparade: string[] = [];
  try {
    if (farSpara()) sparade = tolkaSparade(window.localStorage.getItem(SENASTE_NYCKEL));
  } catch {
    // ingen lagring: listan lever i minnet
  }
  minne = sparade;
  return minne;
}

/** Lägg en sökning först i listan. */
export function kommIhagSokning(sokning: string): string[] {
  minne = medSokning(senasteSokningar(), sokning);
  try {
    if (farSpara()) window.localStorage.setItem(SENASTE_NYCKEL, JSON.stringify(minne));
  } catch {
    // full eller avstängd lagring: listan finns kvar i minnet
  }
  return minne;
}

/** Töm listan, i minnet och i lagringen. */
export function glomSokningar(): string[] {
  minne = [];
  try {
    window.localStorage.removeItem(SENASTE_NYCKEL);
  } catch {
    // inget att ta bort
  }
  return minne;
}
