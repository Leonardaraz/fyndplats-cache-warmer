// app/api/cron/varm-katalogen/route.ts
// Vercel Cron: GET /api/cron/varm-katalogen — var 15:e minut (se vercel.json).
//
// HÅLLER KATALOGEN VARM EFTER EN DEPLOY.
//
// Varje deploy tömmer ISR-cachen. Med 1 622 produkter och 40 förbyggda blir
// ~1 580 sidor kalla, och den som klickar först betalar renderingen: uppmätt
// 0,86–1,52 s mot 0,15 när sidan är varm. Rutten upptäcker det och värmer.
//
// VARFÖR EN EGEN RUTT, OCH VARFÖR VAR 15:E MINUT.
// Värmningen bodde först i warm-and-ping, som går varje timme. Den kan inte gå
// oftare: dess andra halva aviserar IndexNow om färska produkter inom ett
// 90-minutersfönster, och en kvartscron hade pingat samma produkter sex gånger.
// Med en egen rutt kapas fönstret efter en deploy från 60 till 15 minuter utan
// att röra IndexNow-kadensen.
//
// VAD DET KOSTAR. Provet är fast (lib/warm.ts:fastProv), så de tolv sidorna vi
// tittar på är samma varje gång och hålls varma av provet självt — ~288
// renderingar om dygnet, oavsett hur ofta vi tittar. Ett slumpmässigt prov hade
// rört tolv nya sidor per körning och kostat upp emot 1 150 om dygnet bara för
// att titta. Det fulla passet (1 622 renderingar) körs bara när provet säger
// att katalogen faktiskt är kall, alltså i praktiken en gång per deploy.
//
// ☠️ ETT PASS HINNER INTE HELA KATALOGEN LÄNGRE (2026-10-23). Efter deployen
// 01:02 UTC värmde körningen 01:15 1 824 av 5 092 produktsidor och slutade, och
// nästa körning såg ett varmt prov (provets egen hämtning hade värmt det). Ett
// avbrutet pass lämnar därför resten till ett LED: ett POST till den här rutten
// med listan över det som återstår. Ledet svarar 202 och värmer efter svaret,
// och hinner det inte heller klart startar det nästa, högst MAX_LED. Listorna
// värms av det led som gör katalogen klar. Se lib/warm-urval.ts.
//
// AUTH: samma konvention som grannarna — Vercel Cron skickar
// "Authorization: Bearer $CRON_SECRET". Är secreten osatt kör rutten ändå men
// loggar en varning; exponeringen är att någon renderar VÅRA EGNA sidor, vilket
// är precis det värmande vi vill ha. Se den längre noten i warm-and-ping.
// ☠️ Ett LED kräver däremot hemligheten (som uppdatera-andrade): det tar en
// lista i kroppen och startar fler anrop, och öppet hade det varit ett sätt för
// vem som helst att låta oss rendera katalogen om och om igen.
import { NextResponse, after } from "next/server";
import { getCollections, getProductSitemapEntries } from "../../../../lib/products";
import { hamtaKundvagnsUnderlag } from "../../../../lib/kundvagn-underlag";
import { bearerVarde, sammaHemlighet } from "../../../../lib/hemlig-jamforelse";
import {
  arSakerSlug, katalogenArKall, kvarEfterPass, roterad, startaLed, tolkaLed, varmAlla, varmBildkartan, varmListor,
} from "../../../../lib/warm";
import type { ListNyckel } from "../../../../lib/list-key";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Värmningen slutar påbörja nya omgångar efter så här lång tid. En omgång kan
 *  ta upp till 60 s (varmSida), och att starta nästa led upp till ~32 s, så
 *  200 s håller båda inom maxDuration 300. */
const VARMNING_MS = 200_000;

type AuthUtfall = "ok" | "fel-token" | "oskyddad";

/** Alla listor, och de som värms varje körning: hela sortimentet, rean och huvudavdelningarna. */
function listnycklar(kategorier: Awaited<ReturnType<typeof getCollections>>): { alla: ListNyckel[]; topp: ListNyckel[] } {
  return {
    alla: ["alla", "rea", ...kategorier.map((c) => `kategori/${c.slug}` as const)],
    topp: ["alla", "rea", ...kategorier.filter((c) => c.parentId === null).map((c) => `kategori/${c.slug}` as const)],
  };
}

function authorisera(request: Request): AuthUtfall {
  const expected = process.env.CRON_SECRET;
  if (!expected) return process.env.VERCEL ? "oskyddad" : "ok";
  return request.headers.get("authorization") === `Bearer ${expected}` ? "ok" : "fel-token";
}

export async function GET(request: Request) {
  const auth = authorisera(request);
  if (auth === "fel-token") {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }
  if (auth === "oskyddad") {
    console.error(
      `[varm-katalogen] OSKYDDAD KÖRNING i ${process.env.VERCEL_ENV ?? "vercel"}: CRON_SECRET saknas `
        + "i miljön. Sätt den i Vercels miljövariabler så börjar grinden gälla automatiskt.",
    );
  }

  // Marginal mot maxDuration så svaret hinner skrivas och nästa led startas även
  // om sista omgången är trög (VARMNING_MS).
  const deadline = Date.now() + VARMNING_MS;

  const entries = await getProductSitemapEntries();
  const slugs = entries.map((e) => e.slug);

  // BILDKARTAN VÄRMS VARJE KÖRNING, INTE BARA NÄR KATALOGEN ÄR KALL.
  //
  // Den låg tidigare i timcronen och värmdes en gång i timmen. När den flyttade
  // hit hamnade den först innanför kall-grinden, vilket var en regression: dess
  // cachepost löper ut efter en timme (s-maxage=3600), och går det längre än så
  // utan att någon hämtar den betalar nästa besökare kallstarten — uppmätt till
  // 35,4 s, eftersom rutten läser hela katalogen.
  //
  // Det är EN begäran var 15:e minut. Den mesta av tiden är den en cacheträff
  // som inte kostar något alls; ungefär en gång i timmen faller den på ett
  // utgånget fönster och renderas om. Det är billigare än att låta en kund göra
  // det åt oss.
  const bildkartan = await varmBildkartan();

  // VARUKORGENS FÖRSLAG läses ur ett underlag i datacachen
  // (lib/kundvagn-underlag.ts). Saknas det, som efter en deploy, väntar nästa
  // varukorg på hela katalogen. Här byggs det av en instans som redan har
  // katalogen i minnet (getProductSitemapEntries ovan), och ett utgånget
  // underlag byggs om i bakgrunden. Svaret är antalet varor, null vid fel.
  const kundvagnsUnderlag = await hamtaKundvagnsUnderlag().then((u) => u.length, () => null);

  // LISTSIDORNAS PRODUKTLISTOR (app/api/lista), av samma skäl som bildkartan:
  // en kall lista är en kund som väntar på "Visa fler". Varje körning värms de
  // listor flest ser — hela sortimentet, rean och huvudavdelningarna. Efter en
  // deploy, när katalogen är kall, värms alla — EFTER produktsidorna och inom
  // samma deadline, så de aldrig tränger undan dem.
  const { alla: allaListor, topp: toppnycklar } = listnycklar(await getCollections());

  const prov = await katalogenArKall(slugs);
  if (!prov.kall) {
    const listor = await varmListor(toppnycklar, deadline);
    return NextResponse.json({ ok: true, katalog: slugs.length, prov, varmning: null, bildkartan, kundvagnsUnderlag, listor });
  }

  const ordning = roterad(slugs);
  const varmning = await varmAlla(ordning, deadline);
  const rad = `[varm-katalogen] prov ${prov.missar}/${prov.av} MISS → kall. `
    + `Värmde ${varmning.ok}/${slugs.length}${varmning.fel ? ` (fel ${varmning.fel})` : ""}. `
    + `Bildkartan: ${bildkartan ? "ok" : "misslyckades"}. `
    + `Varukorgens underlag: ${kundvagnsUnderlag === null ? "misslyckades" : `${kundvagnsUnderlag} varor`}. `;

  if (varmning.avbruten) {
    // Resten tas av kedjan. Listorna värms av det led som gör katalogen klar,
    // så de aldrig tränger undan produktsidorna.
    const rest = kvarEfterPass(ordning, varmning);
    const kvar = rest.filter(arSakerSlug);
    if (kvar.length < rest.length) {
      console.error(`[varm-katalogen] ${rest.length - kvar.length} slugs kan inte bli en sökväg och lämnas utanför kedjan`);
    }
    const led = await startaLed(kvar, 1);
    console.log(`${rad}Avbruten på deadline: ${kvar.length} kvar → led 1: ${led}`);
    if (led !== "startat") {
      console.error(`[varm-katalogen] kunde inte starta led 1 (${led}): ${kvar.length} sidor förblir kalla tills de besöks`);
    }
    return NextResponse.json({
      ok: true, katalog: slugs.length, prov, varmning, kedja: { kvar: kvar.length, led1: led }, bildkartan, kundvagnsUnderlag, listor: null,
    });
  }

  const listor = await varmListor(allaListor, deadline);
  console.log(`${rad}Listor: ${listor.ok}/${allaListor.length}`);
  return NextResponse.json({ ok: true, katalog: slugs.length, prov, varmning, kedja: null, bildkartan, kundvagnsUnderlag, listor });
}

/**
 * Ett LED i kedjan efter en deploy: värm `kvar`, och starta nästa led om inte
 * heller det här hinner klart. Svarar 202 direkt; värmningen sker efter svaret,
 * inom samma maxDuration.
 */
export async function POST(request: Request) {
  const start = Date.now();
  const hemlighet = process.env.CRON_SECRET;
  if (!hemlighet) {
    console.error("[varm-katalogen] CRON_SECRET saknas i miljön — ett led startas aldrig utan den.");
    return NextResponse.json({ ok: false, error: "CRON_SECRET saknas" }, { status: 503 });
  }
  if (!sammaHemlighet(bearerVarde(request.headers.get("authorization")), hemlighet)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }
  const tolkat = tolkaLed(await request.json().catch(() => null));
  if ("fel" in tolkat) return NextResponse.json({ ok: false, error: tolkat.fel }, { status: 400 });
  const { led, kvar } = tolkat;

  after(async () => {
    const deadline = start + VARMNING_MS;
    const pass = await varmAlla(kvar, deadline);
    if (pass.avbruten) {
      const rest = kvarEfterPass(kvar, pass);
      const nasta = await startaLed(rest, led + 1);
      console.log(
        `[varm-katalogen] led ${led}: värmde ${pass.ok}/${kvar.length}${pass.fel ? ` (fel ${pass.fel})` : ""}, `
          + `${rest.length} kvar → led ${led + 1}: ${nasta}`,
      );
      if (nasta !== "startat") {
        console.error(`[varm-katalogen] kedjan slutade efter led ${led} (${nasta}): ${rest.length} sidor förblir kalla tills de besöks`);
      }
      return;
    }
    const { alla } = listnycklar(await getCollections());
    const listor = await varmListor(alla, deadline);
    console.log(
      `[varm-katalogen] led ${led}: värmde ${pass.ok}/${kvar.length}${pass.fel ? ` (fel ${pass.fel})` : ""} — katalogen klar. `
        + `Listor: ${listor.ok}/${alla.length}${listor.avbruten ? " (avbruten på deadline)" : ""}`,
    );
  });

  return NextResponse.json({ ok: true, led, sidor: kvar.length }, { status: 202 });
}
