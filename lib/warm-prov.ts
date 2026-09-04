// lib/warm-prov.ts
// Urvalet av provsidor — utbrutet ur lib/warm.ts.
//
// VARFÖR EN EGEN FIL: warm.ts importerar lib/site-urls (som i sin tur drar in
// produkter, blogg och SEO-modulerna), och den kedjan går inte att ladda i
// node:test. Urvalet här är rent och beroendefritt, så det kan täckas av
// tester — och det är just det som behöver låsas: att provet är FAST är hela
// dess kostnadsargument. warm.ts återexporterar, så anroparna är oförändrade.

/** Hur många sidor provet läser, och hur många MISS som räcker för att döma
 *  katalogen som kall. Två av tolv är långt under vad en deploy ger (då är i
 *  princip ALLA kalla) och långt över vad normal drift ger (noll). */
export const PROV_STORLEK = 12;
export const MISS_FOR_KALL = 2;

/**
 * PROVET ÄR FAST, INTE SLUMPMÄSSIGT — och det är hela poängen med kostnaden.
 *
 * Att hämta en sida vars revalidate-fönster (1 h) löpt ut serverar den
 * inaktuella kopian direkt OCH startar en ny rendering i bakgrunden. Ett
 * SLUMPMÄSSIGT prov rör därför tolv NYA sidor varje körning, och var 15:e minut
 * blir det upp emot 1 150 extra renderingar om dygnet — bara för att titta.
 *
 * Ett fast prov rör samma tolv sidor varje gång. De hålls varma av provet
 * självt, och kostnaden stannar på ~288 renderingar om dygnet oavsett hur ofta
 * vi tittar.
 *
 * Det duger lika bra som detektor, för det är deployen vi letar efter: den
 * tömmer HELA cachen, alltså även provsidorna. Sidorna sprids jämnt över
 * katalogen så provet inte klumpar ihop sig i ett hörn av sortimentet — annars
 * hade ett läge där bara svansen är kall kunnat passera obemärkt.
 */
export function fastProv(slugs: readonly string[]): string[] {
  const n = slugs.length;
  if (n === 0) return [];
  const antal = Math.min(PROV_STORLEK, n);
  return Array.from({ length: antal }, (_, i) => slugs[Math.floor((i * n) / antal)]!);
}
