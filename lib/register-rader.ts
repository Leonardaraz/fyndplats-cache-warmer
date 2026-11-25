// Registret "Alla kategorier" på /butik: en rad per avdelning (Leonard 2026-11-25).
//
// "startsidan på datorn ser inte alls premium ut och matchar inte startsidan på
// telefon". På datorn var registret fyra spalter text, 2 006 px högt (mätt på
// www i 1 440 px): Möbler ensamt 30 rader, sista spalten nästan tom. På
// telefonen var samma register redan en rad per avdelning, med kategorierna
// som knappar i en rad man sveper.
//
// Nu har datorn samma form: avdelningens namn till vänster och kategorierna som
// knappar till höger, så många som ryms på EN rad. Resten fälls ut med "Alla N"
// (app/butik/butik.css, "/butik: en rad per avdelning"). På båda skärmarna syns
// alltså bara de första kategorierna i varje rad utan att kunden gör något, och
// då ska de första vara de som flest letar efter.

/** En avdelning med så här få kategorier visas alltid hel på datorn, utan
 *  knappen "Alla N": fem knappar ryms på en rad från 1 100 px, och på två
 *  rader däremellan. */
export const RAD_UTAN_KNAPP = 5;

/** Har raden knappen "Alla N"? */
export function radenFallsUt(antalKategorier: number): boolean {
  return antalKategorier > RAD_UTAN_KNAPP;
}

/**
 * Kategorierna med flest varor först. Lika stora står i bokstavsordning
 * (svensk: å, ä och ö sist), så att ordningen är densamma vid varje bygge.
 * Listan som kommer in lämnas orörd: menyerna visar samma kategorier i sin
 * egen ordning (lib/category-groups.ts, MAIN_GROUPS).
 */
export function storstForst<T extends { name: string; count: number }>(subs: ReadonlyArray<T>): T[] {
  return [...subs].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "sv"));
}
