// Googles klickkod ?srsltid=… i adressfältet (2026-09-30).
//
// Merchant Centers automatiska taggning lägger koden på varje länk från
// Googles sökresultat. Leonard: "det ser fult ut". Men Googles tagg läser
// koden för att koppla köp till gratisvisningarna, så den får inte försvinna
// innan taggen har gjort det.
//
// components/rensa-srsltid.tsx tar därför bort den ur ADRESSFÄLTET, och först
// när två saker gäller:
//   1. Googles tagg (gtag.js) har laddats och gått igenom kön, alltså skickat
//      sidvisningen med koden i.
//   2. Besökaren har gjort sitt val i cookiebannern. Beviljas samtycket
//      kan taggen spara koden i sin cookie först då, och den läser adressen.
// Sidan laddas inte om, och ingen annan parameter ändras. Sidans canonical
// pekar redan på den rena adressen, så för Google är ingenting nytt.

export const SRSLTID = "srsltid";

/**
 * Villkoren ska ha hållit så här länge innan adressen ändras. Consent Mode
 * väntar upp till 500 ms (wait_for_update) innan sidvisningen går iväg, och
 * ett nyss gjort val i bannern ska hinna nå taggen.
 */
export const MARGINAL_MS = 3000;

/**
 * Sökdelen utan srsltid, med alla andra parametrar tecken för tecken som de
 * stod. null betyder att parametern inte fanns, och då ska ingenting skrivas.
 *
 * Strängen delas för hand i stället för med URLSearchParams, som hade kodat
 * om de andra parametrarna (",", "+" och mellanslag) — en adress som ser
 * likadan ut men inte är det.
 */
export function utanSrsltid(search: string): string | null {
  const q = search.startsWith("?") ? search.slice(1) : search;
  if (!q) return null;
  const delar = q.split("&");
  const kvar = delar.filter((d) => d.split("=", 1)[0] !== SRSLTID);
  if (kvar.length === delar.length) return null;
  const rest = kvar.filter((d) => d !== "").join("&");
  return rest ? `?${rest}` : "";
}

/**
 * Får koden tas bort nu? Bara när besökaren har valt i bannern ("all" eller
 * "necessary" i localStorage) OCH Googles tagg har laddats. Saknas något av
 * dem står adressen kvar som den är, precis som före den här ändringen.
 */
export function kanStadas(l: { samtycke: string | null; taggLaddad: boolean }): boolean {
  return (l.samtycke === "all" || l.samtycke === "necessary") && l.taggLaddad;
}

/** Det städningen läser och skriver. I webbläsaren kopplas det i komponenten. */
export type Miljo = {
  sokdel: () => string;
  ersatt: (nySokdel: string) => void;
  samtycke: () => string | null;
  taggLaddad: () => boolean;
  nu: () => number;
};

/**
 * Ett varv i städningen. Tar och returnerar tidpunkten då villkoren började
 * hålla (null = de håller inte).
 *
 * Adressen skrivs först när villkoren hållit i MARGINAL_MS. Dyker koden upp
 * igen efteråt tas den bort direkt: Next skriver tillbaka sin egen adress vid
 * router.refresh(), som auktionsklockan gör när priset sjunker.
 */
export function steg(m: Miljo, klarSedan: number | null): number | null {
  const ny = utanSrsltid(m.sokdel());
  if (ny === null) return klarSedan;
  if (!kanStadas({ samtycke: m.samtycke(), taggLaddad: m.taggLaddad() })) return null;
  const t = m.nu();
  if (klarSedan === null) return t;
  if (t - klarSedan < MARGINAL_MS) return klarSedan;
  m.ersatt(ny);
  return klarSedan;
}
