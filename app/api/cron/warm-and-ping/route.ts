// app/api/cron/warm-and-ping/route.ts
// Vercel Cron entry: GET /api/cron/warm-and-ping
// Schedule: varje timme ("0 * * * *", se vercel.json).
//
// VÄRMER FÖRST, AVISERAR SEDAN — för varje produkt som blivit synlig eller
// ändrats den senaste timmen.
//
// LUCKAN DEN TÄPPER. lib/indexnow.ts har exporterat `pingProductSlug` för
// realtidsavisering sedan den skrevs, och kommentaren i cron/indexnow-ping
// påstår att Wix-webhooken anropar den. Det gjorde den aldrig: webhookens
// `classify` känner bara igen order- och checkout-event, så funktionen var död
// kod. En produkt som publicerades på en tisdag aviserades först vid
// måndagssvepet — upp till sex dagars fördröjning.
//
// VARFÖR VÄRMNINGEN LIGGER FÖRE PINGEN. Uppmätt i produktion 2026-08-28:
//   kall produktsida (ingen cache-post)   1,3–2,1 s
//   varm produktsida                      0,2–0,6 s
// Bara 40 sidor förbyggs (SSG_PREBUILD), så en nypublicerad produkt är alltid
// kall — och den första hämtningen är Googlebots, den som avgör indexering.
// Att rendera sidan en gång innan vi berättar att den finns gör den hämtningen
// 3–4× snabbare. Att avisera först vore att bjuda in gästen och sedan börja
// laga maten.
//
// SKALAN. 2 712 dolda Aosom-produkter (mätt mot Wix 2026-08-28) ska publiceras
// i omgångar. TAK_PER_KORNING skär varje körning så en bulk-publicering inte
// spränger funktionens tidsbudget; fönstret är längre än cron-intervallet och
// resten tas nästa timme. 150/timme = 3 600/dygn, med god marginal.
//
// AUTH: Vercel Cron skickar "Authorization: Bearer $CRON_SECRET".
//
// SATT  → grinden gäller: fel eller ingen token ger 401.
// OSATT → rutten KÖR ÄNDÅ, men loggar en varning vid varje körning.
//
// Varför den faller öppet och inte stängt. Ett första försök svarade 503 när
// CRON_SECRET saknades i en deployad miljö. Det var fel avvägning: är secreten
// inte satt där vi tror hade cronen svarat 503 varje timme och aldrig värmt
// eller aviserat någonting — tyst, eftersom ingen läser svaret på en cron.
// En trasig funktion är värre än den exponering grinden skyddar mot.
//
// Exponeringen är dessutom mild jämfört med grannarna. Ett obehörigt anrop
// hit renderar upp till 150 av VÅRA EGNA sidor (exakt det värmande vi vill ha
// — de blir cachade) och skickar en avisering om publicerade produkt-URL:er
// till IndexNow. Ingendera är destruktiv. /api/cron/abandoned-cart-sender och
// /api/cron/morning-email följer samma konvention och skickar MEJL.
//
// Uppmätt på preview-deployen 2026-08-28: utan CRON_SECRET svarade rutten 200
// för vem som helst som kände till URL:en. Loggraden nedan gör det synligt i
// Vercels funktionsloggar i stället för att gå obemärkt förbi — och sätts
// CRON_SECRET i miljön börjar grinden gälla av sig själv, utan kodändring.
import { NextResponse } from "next/server";
import { getProductSitemapEntries } from "../../../../lib/products";
import { farskaProdukter } from "../../../../lib/fresh-products";
import { pingSearchEngines } from "../../../../lib/indexnow";
import { SITE } from "../../../../lib/site-urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Fönstret är avsiktligt längre än cron-intervallet (60 min): missas en körning
// — deploy, kallstart, Wix nere — hinner nästa fånga upp det som annars fallit
// mellan stolarna. Överlappet kostar bara en omvärmning av redan varma sidor.
const FONSTER_MS = 90 * 60_000;
const TAK_PER_KORNING = 150;
// Parallella värmningar. 8 håller 150 sidor à ~1,5 s runt 30 s — väl inom
// maxDuration — utan att vi själva blir lasten som gör sidorna långsamma.
const PARALLELLT = 8;

type AuthUtfall = "ok" | "fel-token" | "oskyddad";

function authorisera(request: Request): AuthUtfall {
  const expected = process.env.CRON_SECRET;
  if (!expected) return process.env.VERCEL ? "oskyddad" : "ok";
  return request.headers.get("authorization") === `Bearer ${expected}` ? "ok" : "fel-token";
}

/** Rendera en produktsida en gång så den ligger i ISR-cachen. Kastar aldrig. */
async function varm(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${SITE}/produkt/${slug}`, {
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

async function varmAlla(slugs: string[]): Promise<{ ok: number; fel: number }> {
  let ok = 0, fel = 0;
  for (let i = 0; i < slugs.length; i += PARALLELLT) {
    const resultat = await Promise.all(slugs.slice(i, i + PARALLELLT).map(varm));
    for (const r of resultat) { if (r) ok++; else fel++; }
  }
  return { ok, fel };
}

export async function GET(request: Request) {
  const auth = authorisera(request);
  if (auth === "fel-token") {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }
  if (auth === "oskyddad") {
    console.error(
      `[warm-and-ping] OSKYDDAD KÖRNING i ${process.env.VERCEL_ENV ?? "vercel"}: CRON_SECRET saknas i `
        + "miljön, så vem som helst med URL:en kan trigga värmning + IndexNow-avisering. "
        + "Sätt CRON_SECRET i Vercels miljövariabler så börjar grinden gälla automatiskt.",
    );
  }

  const entries = await getProductSitemapEntries();
  const urval = farskaProdukter(entries, Date.now(), FONSTER_MS, TAK_PER_KORNING);

  if (urval.slugs.length === 0) {
    return NextResponse.json({ ok: true, farska: 0, katalog: entries.length });
  }

  // Ordningen är hela poängen: rendera först, berätta sedan.
  const varmning = await varmAlla(urval.slugs);
  const ping = await pingSearchEngines(urval.slugs.map((s) => `${SITE}/produkt/${s}`));

  console.log(
    `[warm-and-ping] ${urval.slugs.length} färska produkter — varma: ${varmning.ok}, `
      + `misslyckade: ${varmning.fel}, kvar till nästa körning: ${urval.overTaket}`,
  );

  return NextResponse.json({
    ok: ping.indexNow.ok,
    katalog: entries.length,
    farska: urval.iFonstret,
    behandlade: urval.slugs.length,
    kvarTillNasta: urval.overTaket,
    varmning,
    indexNow: ping.indexNow,
    google: ping.google,
  });
}
