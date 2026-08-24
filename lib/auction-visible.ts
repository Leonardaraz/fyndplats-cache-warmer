// lib/auction-visible.ts
//
// Vilka live-dokument ska faktiskt synas i Fyndauktionens rutnät?
//
// LÖVMODUL med flit: inga sido-importer och inget nätverk, så `node --test`
// kan ladda den. lib/auction-view.ts gör uppslaget mot Wix och katalogen och
// använder regeln härifrån.
//
// PROBLEMET. Motorn befordrar nästa produkt ur kön i samma sekund som en
// auktion säljs. Den nya får `status: "live"` men `startAt` = nästa 07:00, så
// ett nytt kort dök upp i rutan 1,2 sekunder efter köpet — till ordinarie
// pris, utan nedräkning. Platsen såg upptagen ut ett helt dygn innan något
// hände där. (Uppmätt 2026-08-24: satsbordet sålde 12:49:40, svängbilen stod i
// dess slot 12:49:41.)
//
// VARFÖR INTE BARA DÖLJA ALLT OSTARTAT. Mellan 19:00 och 07:00 är ALLA fem
// schemalagda för nästa morgon. Då ska de synas med nedräkning — det är
// "pre"-läget i lib/auction-day.ts. Att dölja dem hade tömt sidan varje natt,
// vilket är värre än problemet vi löser.

/** Det regeln behöver ur ett auktionsdokument. */
export interface StartbartFynd {
  startAt?: string | null;
}

/**
 * Har fyndet börjat sjunka?
 *
 * FAIL-OPEN: saknas `startAt`, eller går det inte att tolka, räknas fyndet som
 * igång och visas. Att gömma ett fynd är den dyra riktningen att fela åt — en
 * tom ruta i rutnätet syns för varje besökare, medan ett kort som visas en
 * halvtimme för tidigt bara ser ivrigt ut. Äldre dokument utan fältet ska
 * dessutom fortsätta fungera oförändrat.
 */
export function harStartat(rad: StartbartFynd, nowMs: number): boolean {
  if (!rad.startAt) return true;
  const t = Date.parse(rad.startAt);
  if (!Number.isFinite(t)) return true;
  return t <= nowMs;
}

/**
 * Filtrerar live-dokumenten till dem som ska visas.
 *
 * Regeln: ett KOMMANDE fynd visas bara när ingen auktion är igång.
 *
 *   Mitt på dagen (någon har startat) → ett ostartat kort är en ersättare för
 *   något sålt. Dölj det; platsen står tom till 07:00 dagen efter.
 *
 *   Kväll och natt (ingen har startat) → hela morgondagens omgång är
 *   schemalagd. Visa alla med nedräkning.
 */
export function synligaFynd<T extends StartbartFynd>(rader: readonly T[], nowMs: number): T[] {
  const nagonIgang = rader.some((r) => harStartat(r, nowMs));
  if (!nagonIgang) return [...rader];
  return rader.filter((r) => harStartat(r, nowMs));
}
