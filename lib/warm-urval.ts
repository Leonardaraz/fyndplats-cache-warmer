// lib/warm-urval.ts
// Vilka sidor som läses och i vilken ordning de värms — de rena delarna av
// värmningen, utbrutna ur lib/warm.ts.
//
// VARFÖR EN EGEN FIL: warm.ts importerar lib/site-urls (som i sin tur drar in
// produkter, blogg och SEO-modulerna), och den kedjan går inte att ladda i
// node:test. Urvalet här är rent och beroendefritt, så det kan täckas av
// tester — och det är just de två egenskaperna som behöver låsas: att provet är
// FAST (hela dess kostnadsargument) och att rotationen går per KÖRNING, inte per
// timme. Båda är osynliga i drift och syns bara på fakturan när de går sönder.
// warm.ts återexporterar, så anroparna är oförändrade.

/** Parallella hämtningar. 8 håller ett fullt pass runt 200 s — inom
 *  maxDuration — utan att värmaren själv blir lasten som gör sidorna långsamma. */
export const PARALLELLT = 8;

/** Rotationssteget måste följa hur ofta värmningen faktiskt KÖRS, inte klockan.
 *  varm-katalogen går var 15:e minut (vercel.json). */
const ROTATIONSSTEG_MS = 15 * 60_000;

/**
 * Roterar startpunkten mellan körningar. Hinner ett pass inte klart innan
 * deadline fortsätter nästa på ett annat ställe, så täckningen vandrar i stället
 * för att fastna på samma första hundra.
 *
 * STEGET ÄR PER KÖRNING, INTE PER TIMME. Den första versionen räknade på timme,
 * skriven när värmningen låg i en timcron. När den flyttade till en kvartscron
 * blev det ett fel: alla fyra körningar per timme fick samma startpunkt, så ett
 * avbrutet pass gjorde om exakt samma huvud tre gånger till och nådde aldrig
 * svansen förrän timmen tickade över.
 *
 * Och det hade blivit dyrt, inte bara långsamt: provet är spritt över katalogen
 * (fastProv nedan), så det HADE sett att svansen var kall och triggat ett nytt
 * fullt pass var 15:e minut — som varje gång värmde om samma redan varma huvud.
 *
 * Marginalen är verklig: 1 622 sidor / 8 parallella à ~1 s ≈ 200 s mot en
 * deadline på 240. Ett avbrott är alltså inte hypotetiskt.
 */
export function roterad(slugs: readonly string[], nu = Date.now()): string[] {
  if (slugs.length === 0) return [...slugs];
  const korning = Math.floor(nu / ROTATIONSSTEG_MS);
  const start = (korning * PARALLELLT * 40) % slugs.length;
  return [...slugs.slice(start), ...slugs.slice(0, start)];
}

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
