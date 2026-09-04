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

/**
 * Värm bildkartan (/api/kort-bilder) — listsidornas kort hämtar den när de
 * behöver ett foto som inte fick plats i sidans HTML (se lib/list-payload.ts).
 *
 * VARFÖR DEN BEHÖVER VÄRMAS. Rutten läser hela katalogen, så en kall
 * lambda är dyr: uppmätt på preview-deployen 2026-09-04 tog den FÖRSTA
 * hämtningen 35,4 s, de följande svarade x-vercel-cache: HIT. Den kalla
 * hämtningen är annars en riktig besökares — den som hovrar "Visa fler" strax
 * efter en deploy eller efter att cacheposten gått ut. Korten står kvar
 * kompletta under tiden (namn, pris, betyg, länk), så inget går sönder, men
 * fotona dröjer. Samma resonemang som produktsidorna ovan: rendera en gång
 * innan någon väntar på den.
 *
 * Kastar aldrig — misslyckas den är enda konsekvensen att nästa besökare
 * betalar kallstarten, precis som före den här raden.
 */
async function varmBildkartan(): Promise<boolean> {
  try {
    const res = await fetch(`${SITE}/api/kort-bilder`, {
      headers: { "user-agent": "fyndplats-warmer" },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function varmAlla(slugs: string[], deadline = Infinity): Promise<{ ok: number; fel: number; avbruten: boolean }> {
  let ok = 0, fel = 0;
  for (let i = 0; i < slugs.length; i += PARALLELLT) {
    if (Date.now() > deadline) return { ok, fel, avbruten: true };
    const resultat = await Promise.all(slugs.slice(i, i + PARALLELLT).map(varm));
    for (const r of resultat) { if (r) ok++; else fel++; }
  }
  return { ok, fel, avbruten: false };
}

/**
 * HELA KATALOGEN, INTE BARA DE FÄRSKA.
 *
 * Leonard 2026-09-04: "när jag trycker på olika produkter är det fortfarande
 * väldigt trögt på vissa". Uppmätt samma dag på ett slumpurval om 14
 * produktsidor i produktion:
 *
 *   x-vercel-cache: MISS   11 st   0,86–1,52 s
 *   x-vercel-cache: HIT     3 st   0,15–0,24 s
 *
 * och när samma MISS-sidor hämtades EN GÅNG TILL svarade de HIT på 0,14–0,55 s.
 * En produktsida är alltså långsam exakt en gång: första begäran efter en
 * deploy, som tömmer ISR-cachen. Med 1 622 produkter och 40 förbyggda
 * (SSG_PREBUILD) betyder det att ~1 580 sidor är kalla efter varje deploy, och
 * att den som klickar först betalar renderingen.
 *
 * Därför värmer vi hela katalogen, inte bara det som publicerats den senaste
 * halvtimmen. I VILOLÄGE ÄR DET BILLIGT: en redan varm sida svarar ur cachen
 * (~0,15 s) utan att renderas om — passet kostar bara begäranden. Dyrt blir det
 * bara första gången efter en deploy, vilket är exakt när det behövs.
 *
 * Deadline-vakten finns för att passet aldrig ska spränga maxDuration: efter en
 * deploy tar 1 622 kalla renderingar ~200 s vid PARALLELLT=8, och marginalen är
 * inte stor. Hinner vi inte klart roterar nästa körning startpunkten, så
 * täckningen vandrar i stället för att fastna på samma första hundra.
 */
function roterad(slugs: string[]): string[] {
  if (slugs.length === 0) return slugs;
  const timme = Math.floor(Date.now() / 3_600_000);
  const start = (timme * PARALLELLT * 40) % slugs.length;
  return [...slugs.slice(start), ...slugs.slice(0, start)];
}

/** Hur många sidor stickprovet läser, och hur många MISS som räcker för att
 *  döma katalogen som kall. Två av tolv är långt under vad en deploy ger (då är
 *  i princip ALLA kalla) men långt över vad normal drift ger (noll). */
const STICKPROV = 12;
const MISS_FOR_KALL = 2;

/**
 * ÄR KATALOGEN KALL? Ett stickprov i stället för ett fullt pass.
 *
 * Varför det behövs: att värma en sida vars revalidate-fönster (1 h) löpt ut
 * serverar den inaktuella kopian direkt OCH startar en ny rendering i
 * bakgrunden. Ett fullt pass varje timme betyder därför en rendering per
 * produkt och timme — 1 622 × 24 ≈ 39 000 om dygnet — även när ingenting hänt.
 * Det var vad den första versionen av den här cronen gjorde, och det var
 * onödigt dyrt.
 *
 * Och onödigt, för en produktsida blir MISS av exakt en sak: en deploy, som
 * tömmer ISR-cachen. Är den en gång varm svarar den HIT eller STALE resten av
 * tiden, och båda går på ~0,15 s utan att kunden märker något. Klockan är
 * alltså fel signal — deployen är rätt signal.
 *
 * Stickprovet läser den signalen billigt: tolv slumpvisa produktsidor, och
 * x-vercel-cache i svaret berättar läget. Efter en deploy är i princip alla
 * MISS och det fulla passet körs. Däremellan är de HIT, passet hoppas över, och
 * timmen kostar tolv begäranden i stället för 1 622 renderingar.
 */
async function katalogenArKall(slugs: string[]): Promise<{ kall: boolean; missar: number; av: number }> {
  const urval: string[] = [];
  for (let i = 0; i < STICKPROV && slugs.length; i++) {
    urval.push(slugs[Math.floor(Math.random() * slugs.length)]!);
  }
  const lagen = await Promise.all(
    urval.map(async (slug) => {
      try {
        const res = await fetch(`${SITE}/produkt/${slug}`, {
          headers: { "user-agent": "fyndplats-warmer" },
          cache: "no-store",
        });
        return (res.headers.get("x-vercel-cache") ?? "").toUpperCase();
      } catch {
        // Ett nätverksfel säger ingenting om cachen — räkna det inte som MISS,
        // annars triggar en skakig minut ett fullt pass i onödan.
        return "OKAND";
      }
    }),
  );
  const missar = lagen.filter((l) => l === "MISS").length;
  return { kall: missar >= MISS_FOR_KALL, missar, av: urval.length };
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

  // Vaktens budget: maxDuration är 300 s, och vi lämnar en marginal så svaret
  // hinner skrivas även om sista batchen är trög.
  const deadline = Date.now() + 240_000;

  const entries = await getProductSitemapEntries();
  const urval = farskaProdukter(entries, Date.now(), FONSTER_MS, TAK_PER_KORNING);

  // Bildkartan värms varje körning, oberoende av om det finns färska produkter
  // — den går kall av att cacheposten löper ut, inte av att katalogen ändras.
  const bildkartan = await varmBildkartan();

  if (urval.slugs.length === 0) {
    // Inga färska produkter betyder inte att katalogen är varm — efter en deploy
    // är den kall oavsett när produkterna publicerades.
    const alla = roterad(entries.map((e) => e.slug));
    const prov = await katalogenArKall(alla);
    const katalogvarmning = prov.kall
      ? await varmAlla(alla, deadline)
      : { ok: 0, fel: 0, avbruten: false, hoppadOver: true as const };
    console.log(
      `[warm-and-ping] inga färska produkter. Stickprov ${prov.missar}/${prov.av} MISS → `
        + (prov.kall
          ? `kall, värmde ${katalogvarmning.ok}/${alla.length}`
            + `${katalogvarmning.avbruten ? " (avbruten på deadline)" : ""}`
          : "varm, passet hoppades över"),
    );
    return NextResponse.json({ ok: true, farska: 0, katalog: entries.length, bildkartan, katalogstickprov: prov, katalogvarmning });
  }

  // Ordningen är hela poängen: rendera först, berätta sedan.
  const varmning = await varmAlla(urval.slugs);
  const ping = await pingSearchEngines(urval.slugs.map((s) => `${SITE}/produkt/${s}`));

  // Katalogpasset ligger SIST: de färska sidorna och IndexNow-pingen är
  // tidskritiska (Googlebot kommer strax), katalogen tål att komma efter.
  // Och det körs bara när stickprovet säger att katalogen faktiskt är kall.
  const farskaRedanVarma = new Set(urval.slugs);
  const restenAvKatalogen = roterad(entries.map((e) => e.slug).filter((s) => !farskaRedanVarma.has(s)));
  const prov = await katalogenArKall(restenAvKatalogen);
  const katalogvarmning = prov.kall
    ? await varmAlla(restenAvKatalogen, deadline)
    : { ok: 0, fel: 0, avbruten: false, hoppadOver: true as const };

  console.log(
    `[warm-and-ping] ${urval.slugs.length} färska produkter — varma: ${varmning.ok}, `
      + `misslyckade: ${varmning.fel}, kvar till nästa körning: ${urval.overTaket}. `
      + `Katalogen: stickprov ${prov.missar}/${prov.av} MISS → `
      + (prov.kall
        ? `kall, värmde ${katalogvarmning.ok}/${restenAvKatalogen.length}`
          + `${katalogvarmning.avbruten ? " (avbruten på deadline — nästa körning roterar vidare)" : ""}`
        : "varm, passet hoppades över"),
  );

  return NextResponse.json({
    ok: ping.indexNow.ok,
    katalog: entries.length,
    farska: urval.iFonstret,
    behandlade: urval.slugs.length,
    kvarTillNasta: urval.overTaket,
    varmning,
    katalogstickprov: prov,
    katalogvarmning,
    bildkartan,
    indexNow: ping.indexNow,
    google: ping.google,
  });
}
