// lib/warm.ts
// Att hålla sidorna varma — delat av de två cronarna som gör det.
//
// VARFÖR DET BEHÖVS. En produktsida blir långsam av exakt en sak: en deploy,
// som tömmer ISR-cachen. Uppmätt i produktion 2026-09-04 på ett slumpurval om
// 14 sidor strax efter en deploy:
//
//   x-vercel-cache: MISS   11 st   0,86–1,52 s
//   x-vercel-cache: HIT     3 st   0,15–0,24 s
//
// och samma MISS-sidor hämtade EN GÅNG TILL svarade 0,14–0,55 s. Är sidan en
// gång varm svarar den HIT eller STALE resten av tiden, och båda levereras
// direkt ur cachen. Bara den allra första begäran gör ont — och med 1 622
// produkter och 40 förbyggda (SSG_PREBUILD i app/produkt/[slug]) är ~1 580
// sidor kalla efter varje deploy.
//
// VARFÖR TVÅ CRONAR. Värmningen bodde först i warm-and-ping, som går varje
// timme. Den kan inte gå oftare: dess andra halva aviserar IndexNow om färska
// produkter inom ett 90-minutersfönster, och en kvartscron hade pingat samma
// produkter sex gånger. Så värmningen flyttade hit och fick en egen rutt
// (/api/cron/varm-katalogen, var 15:e minut), medan warm-and-ping behåller
// färskpasset och aviseringen i sin timtakt.
//
// Det korta av det: kvart i stället för timme kapar fönstret efter en deploy
// från 60 till 15 minuter, utan att röra IndexNow-kadensen.

import { SITE } from "./site-urls";
// Provurvalet bor i en egen, beroendefri fil så node:test kan importera det —
// den här modulen drar in site-urls, som testköraren inte kan ladda.
import { fastProv, MISS_FOR_KALL, PROV_STORLEK } from "./warm-prov";
export { fastProv, MISS_FOR_KALL, PROV_STORLEK };

/** Parallella hämtningar. 8 håller ett fullt pass runt 200 s — inom
 *  maxDuration — utan att värmaren själv blir lasten som gör sidorna långsamma. */
export const PARALLELLT = 8;


/** Rendera en sida en gång så den ligger i ISR-cachen. Kastar aldrig. */
export async function varmSida(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${SITE}${path}`, {
      // Cache-busting vore fel här: vi VILL att Vercel skapar och behåller
      // cache-posten. En vanlig hämtning gör precis det.
      headers: { "user-agent": "fyndplats-warmer" },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const varmProdukt = (slug: string) => varmSida(`/produkt/${slug}`);

/** Bildkartan listsidornas kort hämtar (app/api/kort-bilder). Kall lambda kostar
 *  35 s uppmätt; den hämtningen ska inte vara en kunds. */
export const varmBildkartan = () => varmSida("/api/kort-bilder");

export async function varmAlla(
  slugs: readonly string[],
  deadline = Infinity,
): Promise<{ ok: number; fel: number; avbruten: boolean }> {
  let ok = 0, fel = 0;
  for (let i = 0; i < slugs.length; i += PARALLELLT) {
    if (Date.now() > deadline) return { ok, fel, avbruten: true };
    const resultat = await Promise.all(slugs.slice(i, i + PARALLELLT).map(varmProdukt));
    for (const r of resultat) { if (r) ok++; else fel++; }
  }
  return { ok, fel, avbruten: false };
}

/**
 * Roterar startpunkten per timme. Hinner ett pass inte klart innan deadline
 * fortsätter nästa körning på ett annat ställe, så täckningen vandrar i stället
 * för att fastna på samma första hundra.
 */
export function roterad(slugs: readonly string[]): string[] {
  if (slugs.length === 0) return [...slugs];
  const timme = Math.floor(Date.now() / 3_600_000);
  const start = (timme * PARALLELLT * 40) % slugs.length;
  return [...slugs.slice(start), ...slugs.slice(0, start)];
}


/**
 * Är katalogen kall? Läser x-vercel-cache på provsidorna.
 *
 * Ett nätverksfel räknas INTE som MISS. Annars hade en skakig minut triggat ett
 * fullt pass i onödan — precis den kostnad provet finns till för att undvika.
 */
export async function katalogenArKall(
  slugs: readonly string[],
): Promise<{ kall: boolean; missar: number; av: number }> {
  const urval = fastProv(slugs);
  const lagen = await Promise.all(
    urval.map(async (slug) => {
      try {
        const res = await fetch(`${SITE}/produkt/${slug}`, {
          headers: { "user-agent": "fyndplats-warmer" },
          cache: "no-store",
        });
        return (res.headers.get("x-vercel-cache") ?? "").toUpperCase();
      } catch {
        return "OKAND";
      }
    }),
  );
  const missar = lagen.filter((l) => l === "MISS").length;
  return { kall: missar >= MISS_FOR_KALL, missar, av: urval.length };
}
