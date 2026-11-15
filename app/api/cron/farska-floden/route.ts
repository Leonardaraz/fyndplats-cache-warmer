// app/api/cron/farska-floden/route.ts
// Vercel Cron: GET /api/cron/farska-floden, varannan timme (vercel.json).
//
// 1. Bygger flödena i LAGRADE_FLODEN (Pinterest) här, ett i taget, och sparar
//    dem i Vercels Runtime Cache (lib/feed/flodeslager.ts). Läsaren får sedan
//    kopian direkt i stället för att vänta på ett bygge: CDN:en behåller inte
//    ett flöde som hämtas en gång om dygnet (mätt 2026-11-15).
// 2. Hämtar sitemapen och de fyra öppna flödena en gång, så att CDN:ens kopia
//    förnyas varannan timme i stället för bara när någon utifrån hämtar dem.
//    Pinterest-flödet kommer då ur kopian, och raden visar vad läsaren får.
//    Skälet och mätningen står i lib/flodesvarmning.ts.
//
// AUTH som /api/cron/warm-and-ping: med CRON_SECRET satt krävs den, utan den
// kör rutten ändå. Ett obehörigt anrop bygger Pinterest-flödet och hämtar fem
// av våra egna öppna adresser.
import { NextResponse } from "next/server";
import { SITE } from "../../../../lib/site-urls";
import { flodesrad, hamtaFloden } from "../../../../lib/flodesvarmning";
import { BYGGARE } from "../../../../lib/feed/byggare";
import { LAGRADE_FLODEN, arVercelsLager, sparaKopia } from "../../../../lib/feed/flodeslager";
import { arTomtFlode, gzipFlode } from "../../../../lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Hela jobbets tid för bygget och hämtningarna. maxDuration ger marginal till den. */
const BUDGET_MS = 240_000;
/** Ett bygge som tar längre än så här ger upp (uppmätt 50–78 s). */
const BYGGE_MS = 150_000;

const sek = (ms: number) => `${(ms / 1000).toFixed(1).replace(".", ",")} s`;

/** Bygger flödet, gzippar och sparar. En rad för loggen, och om allt gick. */
async function byggOchSpara(fil: (typeof LAGRADE_FLODEN)[number]): Promise<{ rad: string; ok: boolean }> {
  const byggd = Date.now();
  let tidsgrans: ReturnType<typeof setTimeout> | undefined;
  try {
    const xml = await Promise.race([
      BYGGARE[fil]().then((r) => r.text()),
      new Promise<never>((_, nej) => {
        tidsgrans = setTimeout(() => nej(new Error(`bygget tog över ${BYGGE_MS / 1000} s`)), BYGGE_MS);
      }),
    ]);
    const byggtid = Date.now() - byggd;
    // Ett tomt flöde betyder att Wix inte gick att läsa. Den förra kopian gäller då.
    if (arTomtFlode(xml)) return { rad: `${fil} utan en enda vara, förra kopian behölls`, ok: false };
    const gz = gzipFlode(xml);
    const sparad = await sparaKopia(fil, gz, { byggd, xmlByte: Buffer.byteLength(xml) });
    const mb = (gz.byteLength / 1e6).toFixed(1).replace(".", ",");
    return { rad: `${fil} byggt på ${sek(byggtid)}, ${mb} MB${sparad ? ", sparat" : ", SPARADES INTE"}`, ok: sparad };
  } catch (e) {
    return { rad: `${fil} föll efter ${sek(Date.now() - byggd)}: ${(e as Error).message}`.slice(0, 200), ok: false };
  } finally {
    clearTimeout(tidsgrans);
  }
}

export async function GET(request: Request) {
  const hemlig = process.env.CRON_SECRET;
  if (hemlig && request.headers.get("authorization") !== `Bearer ${hemlig}`) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }
  // Bara i produktion: ett förhandsbygge ligger bakom inloggning och har ingen
  // CDN-kopia som någon utifrån läser.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return NextResponse.json({ ok: true, hoppad: "inte produktion" });
  }

  const start = Date.now();
  const kopior: { rad: string; ok: boolean }[] = [];
  for (const fil of LAGRADE_FLODEN) kopior.push(await byggOchSpara(fil));
  const lager = arVercelsLager() ? "Runtime Cache" : "BARA PROCESSENS MINNE";

  const { utfall, hoppade } = await hamtaFloden(SITE, { budgetMs: Math.max(10_000, BUDGET_MS - (Date.now() - start)) });
  const fel = utfall.filter((u) => u.status !== 200);
  const kopiaFel = kopior.some((k) => !k.ok);
  const rad =
    `[farska-floden] kopia (${lager}): ${kopior.map((k) => k.rad).join(", ")} | ` +
    `${utfall.map(flodesrad).join(" | ")}${hoppade.length ? ` | hoppade: ${hoppade.join(", ")}` : ""}`;
  if (fel.length > 0 || kopiaFel) console.error(rad);
  else console.log(rad);
  return NextResponse.json({ ok: fel.length === 0 && !kopiaFel, kopior: kopior.map((k) => k.rad), utfall, hoppade });
}
