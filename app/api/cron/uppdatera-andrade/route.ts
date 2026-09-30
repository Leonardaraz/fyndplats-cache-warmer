// app/api/cron/uppdatera-andrade/route.ts
// Vercel Cron: GET /api/cron/uppdatera-andrade — var femte minut (se vercel.json).
//
// TÖMMER PRODUKTSIDOR SOM ÄNDRATS, OCH BARA DEM.
//
// Produktsidan cachas i sex timmar (lib/produkt-cache.ts). Den här rutten är
// det som gör att sex timmar inte betyder sex timmar gammalt pris:
//   · Wix: alla produkter vars updatedDate flyttats — synkens pris och lager,
//     fyndauktionens prissteg, Leonards ändringar i Wix, polering, sammanslagning
//     och synlighet. Allt som rör produkten i Wix flyttar fältet (lagret
//     verifierat mot Wix 2026-09-30).
//   · Köp: produkterna i nya ordrar (lagret efter köpet).
//   · Motorn: produkter vars recensioner ändrats (motorns /api/review-andringar).
// Varje träff får sin cachepost och sin sida tömda, och sidan värms efteråt så
// att nästa kund får den färdigbyggd.
//
// FÖNSTRET ÄR ELVA MINUTER, CRONEN GÅR VAR FEMTE. Två skäl:
//   · Wix läsning kan släpa efter en skrivning (motorns CLAUDE.md). En sida som
//     byggdes om med det gamla priset byggs om igen av nästa körning, minst fem
//     minuter senare — varje ändring ses av två eller tre körningar.
//   · En körning som faller (Wix nere trots omförsöken, en överhoppad körning)
//     lämnar inget glapp: nästa körnings fönster täcker hela den föregåendes.
//     Först TVÅ fallerade körningar i rad lämnar ett glapp, och då gäller
//     säkerhetsnätet på sex timmar. `?minuter=` (1–180) gör ett längre pass för
//     hand, t.ex. efter ett avbrott.
//
// AUTH: Vercel Cron skickar "Authorization: Bearer $CRON_SECRET". ☠️ Saknas
// CRON_SECRET svarar rutten 503 och gör ingenting — till skillnad från
// grannarna, som släpper igenom. Den här rutten hämtar från Wix och motorn,
// tömmer cache och bygger om sidor; öppen hade den varit ett sätt för vem som
// helst att driva upp just de kostnader den finns till för att sänka.

import { NextResponse, after } from "next/server";
import { andradeIWix, andradeRecensioner, kopteProdukter, uppdateraProduktsidor } from "../../../../lib/produktsidor-uppdatera";
import type { AndradProdukt } from "../../../../lib/produkt-cache";
import { bearerVarde, sammaHemlighet } from "../../../../lib/hemlig-jamforelse";
import { varmAlla } from "../../../../lib/warm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FONSTER_MINUTER = 11;
/** Så många sidor värms per körning (en natts prissynk kan röra hundratals);
 *  resten byggs om vid nästa besök — färskt, eftersom de redan är tömda. */
const MAX_VARMA = 120;
/** Tömningen verkställs efter svaret (waitUntil). Värmningen väntar in den. */
const VANTA_FORE_VARMNING_MS = 5_000;
/** Sista värmningen startar senast så här långt före maxDuration (en sidhämtning får ta 60 s). */
const MARGINAL_MS = 70_000;

export async function GET(request: Request) {
  const start = Date.now();
  if (!process.env.CRON_SECRET) {
    console.error("[uppdatera-andrade] CRON_SECRET saknas i miljön — rutten är avstängd. Lägg in den i Vercel.");
    return NextResponse.json({ ok: false, error: "CRON_SECRET saknas — rutten är avstängd" }, { status: 503 });
  }
  if (!sammaHemlighet(bearerVarde(request.headers.get("authorization")), process.env.CRON_SECRET)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  const begart = Number(new URL(request.url).searchParams.get("minuter"));
  const minuter = Number.isFinite(begart) && begart >= 1 ? Math.min(180, Math.floor(begart)) : FONSTER_MINUTER;
  const sedan = new Date(start - minuter * 60_000).toISOString();

  // De tre källorna är oberoende; en som faller stoppar inte de andra.
  const [wixUtfall, kopUtfall, recensioner] = await Promise.all([
    andradeIWix(sedan).then(
      (v) => ({ ...v, fel: undefined as string | undefined }),
      (e: Error) => ({ produkter: [] as AndradProdukt[], trunkerad: false, fel: e.message.slice(0, 200) }),
    ),
    kopteProdukter(sedan).then(
      (produkter) => ({ produkter, fel: undefined as string | undefined }),
      (e: Error) => ({ produkter: [] as AndradProdukt[], fel: e.message.slice(0, 200) }),
    ),
    andradeRecensioner(sedan),
  ]);
  if (wixUtfall.fel) console.error(`[uppdatera-andrade] Wix-frågan föll: ${wixUtfall.fel}`);
  if (kopUtfall.fel) console.error(`[uppdatera-andrade] orderfrågan föll: ${kopUtfall.fel}`);
  // 502 när Wix inte gick att fråga, så att körningen syns som fallerad i
  // Vercels cron-logg. Det som gick att hämta töms ändå.
  const ok = !wixUtfall.fel && !kopUtfall.fel;
  const status = ok ? 200 : 502;

  const poster: AndradProdukt[] = [...wixUtfall.produkter, ...kopUtfall.produkter, ...(recensioner ?? [])];
  const sammanfattning = {
    ok,
    sedan,
    wix: wixUtfall.produkter.length,
    kop: kopUtfall.produkter.length,
    recensioner: recensioner?.length ?? null,
    ...(wixUtfall.trunkerad ? { trunkerad: true } : {}),
    ...(wixUtfall.fel ? { wixFel: wixUtfall.fel } : {}),
    ...(kopUtfall.fel ? { orderFel: kopUtfall.fel } : {}),
  };
  if (poster.length === 0) return NextResponse.json(sammanfattning, { status });

  const plan = await uppdateraProduktsidor(poster);
  // Värmningen går mot produktionsadressen (lib/site-urls.ts). En preview ska
  // inte värma produktionens sidor — de har inte tömts.
  const varma = process.env.VERCEL_ENV === "production" ? plan.slugs.slice(0, MAX_VARMA) : [];
  if (varma.length) {
    after(async () => {
      await new Promise((r) => setTimeout(r, VANTA_FORE_VARMNING_MS));
      const r = await varmAlla(varma, start + maxDuration * 1000 - MARGINAL_MS);
      console.log(`[uppdatera-andrade] värmde ${r.ok} av ${varma.length} (fel ${r.fel}${r.avbruten ? ", avbruten" : ""})`);
    });
  }

  console.log(
    `[uppdatera-andrade] sedan ${sedan}: Wix ${wixUtfall.produkter.length}, köp ${kopUtfall.produkter.length}, `
      + `recensioner ${recensioner?.length ?? "–"}, produkter ${plan.ids.length}, sidor ${plan.sokvagar.length}, `
      + `utan slug ${plan.utanSlug.length}`,
  );
  return NextResponse.json(
    {
      ...sammanfattning,
      produkter: plan.ids.length,
      sidor: plan.sokvagar.length,
      utanSlug: plan.utanSlug.length,
      varms: varma.length,
      ...(plan.uppslagFel ? { uppslagFel: plan.uppslagFel } : {}),
    },
    { status },
  );
}
