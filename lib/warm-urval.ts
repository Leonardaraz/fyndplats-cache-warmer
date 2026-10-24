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

/** Parallella hämtningar. 8 håller värmaren från att själv bli lasten som gör
 *  sidorna långsamma. Med 1 622 sidor rymdes ett fullt pass i en körning; med
 *  5 092 (2026-10-23) gör det inte det, och resten tas av kedjan nedan. */
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
 * Marginalen var liten redan med 1 622 sidor (8 parallella à ~1 s ≈ 200 s mot
 * en deadline på 240). Med 5 092 sidor hinner ett pass ungefär en tredjedel,
 * och rotationen räcker inte: se kedjan längst ned.
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

// ── Kedjan efter en deploy ────────────────────────────────────────────────
//
// ☠️ ETT PASS RÄCKER INTE LÄNGRE, OCH NÄSTA KÖRNING TROR ATT ALLT ÄR VARMT.
// Uppmätt efter deployen 2026-10-23 01:02 UTC: körningen 01:15 värmde 1 824 av
// 5 092 produktsidor innan deadline, och sedan inga fler. Provet (fastProv)
// hämtar sina tolv sidor, och hämtningen värmer dem, så körningen 01:30 såg
// tolv varma provsidor och gjorde inget fullt pass. Kl 13:19 samma dag var 5 av
// 40 stickprovssidor fortfarande kalla (1,1 s mot 0,4 för en varm sida).
//
// Ett pass som inte hinner klart lämnar därför över resten till ett nytt anrop
// av samma rutt, ett LED, med listan över det som återstår i kroppen. Ledet
// svarar 202 direkt och värmer efter svaret. Hinner inte heller det klart
// startar det nästa led, högst MAX_LED.

/** Så många led en värmning får ha efter kronans körning. Ett led hinner
 *  omkring 1 500–1 800 kalla sidor, så åtta led räcker till en katalog på
 *  minst 12 000. Taket finns för att en kedja aldrig ska kunna gå vidare i
 *  oändlighet. */
export const MAX_LED = 8;

/** Högsta antal sidor ett led tar emot. Katalogen var 5 092 den 2026-10-23. */
export const MAX_KVAR = 50_000;

/** Det som återstår av ett pass som stoppades på sin deadline. varmAlla räknar
 *  varje hämtad sida som ok eller fel, så ok + fel är exakt hur många av
 *  sidorna i ordningen som hann hämtas. */
export function kvarEfterPass(
  ordning: readonly string[],
  pass: { ok: number; fel: number },
): string[] {
  return ordning.slice(Math.max(0, pass.ok + pass.fel));
}

/** En slug som blir en del av sökvägen `/produkt/<slug>`. Inget som kan byta
 *  katalog, lägga till en fråga eller smuggla in ett kodat snedstreck. */
export function arSakerSlug(slug: unknown): slug is string {
  return typeof slug === "string"
    && /^[^\s/?#\\%]{1,300}$/u.test(slug)
    && slug !== "."
    && slug !== "..";
}

export type Led = { led: number; kvar: string[] };

/**
 * Läser ett leds kropp. Allt som inte är ett giltigt led avvisas: ett led ska
 * bara kunna värma produktsidor, och aldrig bli fler än MAX_LED. Kronans körning
 * skickar bara säkra slugs (arSakerSlug), så en osäker slug i kroppen betyder
 * att kroppen inte kommer därifrån.
 */
export function tolkaLed(kropp: unknown): Led | { fel: string } {
  if (!kropp || typeof kropp !== "object" || Array.isArray(kropp)) {
    return { fel: "kroppen ska vara ett objekt" };
  }
  const { led, kvar } = kropp as { led?: unknown; kvar?: unknown };
  if (typeof led !== "number" || !Number.isInteger(led) || led < 1 || led > MAX_LED) {
    return { fel: `led ska vara ett heltal 1–${MAX_LED}` };
  }
  if (!Array.isArray(kvar) || kvar.length === 0) return { fel: "kvar ska vara en lista med minst en slug" };
  if (kvar.length > MAX_KVAR) return { fel: `kvar får ha högst ${MAX_KVAR} slugs` };
  if (!kvar.every(arSakerSlug)) return { fel: "kvar har en ogiltig slug" };
  return { led, kvar: kvar as string[] };
}
