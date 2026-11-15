// app/api/cron/farska-floden/route.ts
// Vercel Cron: GET /api/cron/farska-floden, varannan timme (vercel.json).
//
// 1. Bygger Google-flödet EN gång och gör PriceRunner-, Pinterest- och det
//    hemliga Prisjakt-flödet ur det, med samma byggare som rutterna
//    (lib/feed/harledda.ts, lib/feed/prisjakt-hemlig.ts). Alla fyra sparas i
//    Vercels Runtime Cache (lib/feed/flodeslager.ts), och läsarna får kopian
//    direkt i stället för att vänta på ett bygge: CDN:en behåller inte ett
//    flöde som hämtas en gång om dygnet (mätt 2026-11-15). Förut byggdes
//    Google-flödet tre gånger per körning, en gång per flöde.
// 2. Hämtar sitemapen och de fyra öppna flödena en gång, så att CDN:ens kopia
//    förnyas varannan timme. De sparade flödena kommer då ur kopian, och raden
//    visar vad läsaren får. Skälet och mätningen står i lib/flodesvarmning.ts.
//
// ☠️ Jobbet känner inte till Prisjakts hemliga adress och får aldrig göra det.
// Det bygger flödet med motorns nummer och sparar det under ett namn
// (PRISJAKT_HEMLIG_KOPIA); bara rutten på adressen läser kopian.
//
// AUTH som /api/cron/warm-and-ping: med CRON_SECRET satt krävs den, utan den
// kör rutten ändå. Ett obehörigt anrop bygger flödena och hämtar fem av våra
// egna öppna adresser.
import { NextResponse } from "next/server";
import { GET as googleFeed } from "../../../feed/google.xml/route";
import { SITE } from "../../../../lib/site-urls";
import { flodesrad, hamtaFloden } from "../../../../lib/flodesvarmning";
import { pinterestXml, pricerunnerXml } from "../../../../lib/feed/harledda";
import { PRISJAKT_HEMLIG_KOPIA, prisjaktHemligXml } from "../../../../lib/feed/prisjakt-hemlig";
import { hamtaPrisjaktArtiklar } from "../../../../lib/feed/prisjakt-motor";
import { type LagratFlode, arVercelsLager, sparaKopia } from "../../../../lib/feed/flodeslager";
import { arTomtFlode, gzipFlode } from "../../../../lib/feed/prisjakt-svar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Hela jobbets tid för bygget och hämtningarna. maxDuration ger marginal till den. */
const BUDGET_MS = 240_000;
/** Ett bygge av Google-flödet som tar längre än så här ger upp (uppmätt 50–78 s). */
const BYGGE_MS = 150_000;

/**
 * Varje sparat flöde ur Google-flödets XML. Typen kräver en rad per flöde i
 * LAGRADE_FLODEN, så ett flöde som läggs till där byggs också här.
 */
const UR_GOOGLE: Record<LagratFlode, (googleXml: string) => string> = {
  "google.xml": (googleXml) => googleXml,
  "pricerunner.xml": pricerunnerXml,
  "pinterest.xml": pinterestXml,
};

const sek = (ms: number) => `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
const mb = (b: number) => `${(b / 1e6).toFixed(1).replace(".", ",")} MB`;

function medTidsgrans<T>(p: Promise<T>, ms: number, vad: string): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    p,
    new Promise<never>((_, nej) => {
      t = setTimeout(() => nej(new Error(`${vad} tog över ${ms / 1000} s`)), ms);
    }),
  ]).finally(() => clearTimeout(t));
}

/** Sparar ett flöde. En rad för loggen, och om det gick. Ett tomt flöde sparas aldrig. */
async function spara(namn: string, xml: string, byggd: number): Promise<{ rad: string; ok: boolean }> {
  if (arTomtFlode(xml)) return { rad: `${namn} utan en enda vara, förra kopian behölls`, ok: false };
  const gz = gzipFlode(xml);
  const sparad = await sparaKopia(namn, gz, { byggd, xmlByte: Buffer.byteLength(xml) });
  return { rad: `${namn} ${mb(gz.byteLength)}${sparad ? "" : " SPARADES INTE"}`, ok: sparad };
}

/** Bygger Google-flödet en gång, gör de andra ur det och sparar alla. */
async function byggOchSpara(): Promise<{ rad: string; ok: boolean }> {
  const byggd = Date.now();
  // Motorns nummer hämtas medan Google-flödet byggs, som på den hemliga adressen.
  const [google, motorn] = await Promise.allSettled([
    medTidsgrans(googleFeed().then((r) => r.text()), BYGGE_MS, "Google-flödet"),
    hamtaPrisjaktArtiklar(),
  ]);
  if (google.status === "rejected") {
    return { rad: `Google-flödet föll efter ${sek(Date.now() - byggd)}: ${String(google.reason?.message ?? google.reason).slice(0, 160)}, förra kopiorna behölls`, ok: false };
  }
  const googleXml = google.value;
  if (arTomtFlode(googleXml)) return { rad: "Google-flödet utan en enda vara, förra kopiorna behölls", ok: false };

  const delar: { rad: string; ok: boolean }[] = [];
  for (const [fil, ur] of Object.entries(UR_GOOGLE) as [LagratFlode, (x: string) => string][]) {
    delar.push(await spara(fil, ur(googleXml), byggd));
  }
  if (motorn.status === "fulfilled") {
    delar.push(await spara(PRISJAKT_HEMLIG_KOPIA, prisjaktHemligXml(googleXml, motorn.value), byggd));
  } else {
    const orsak = motorn.reason instanceof Error ? motorn.reason.message : "okänt fel";
    delar.push({ rad: `${PRISJAKT_HEMLIG_KOPIA}: motorns nummer saknas (${orsak.slice(0, 120)}), förra kopian gäller`, ok: false });
  }
  return {
    rad: `byggt på ${sek(Date.now() - byggd)}: ${delar.map((d) => d.rad).join(", ")}`,
    ok: delar.every((d) => d.ok),
  };
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
  const kopior = await byggOchSpara();
  const lager = arVercelsLager() ? "Runtime Cache" : "BARA PROCESSENS MINNE";

  const { utfall, hoppade } = await hamtaFloden(SITE, { budgetMs: Math.max(10_000, BUDGET_MS - (Date.now() - start)) });
  const fel = utfall.filter((u) => u.status !== 200);
  const rad =
    `[farska-floden] kopior (${lager}) ${kopior.rad} | ` +
    `${utfall.map(flodesrad).join(" | ")}${hoppade.length ? ` | hoppade: ${hoppade.join(", ")}` : ""}`;
  if (fel.length > 0 || !kopior.ok) console.error(rad);
  else console.log(rad);
  return NextResponse.json({ ok: fel.length === 0 && kopior.ok, kopior: kopior.rad, utfall, hoppade });
}
