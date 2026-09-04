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
// AUTH: samma konvention som grannarna — Vercel Cron skickar
// "Authorization: Bearer $CRON_SECRET". Är secreten osatt kör rutten ändå men
// loggar en varning; exponeringen är att någon renderar VÅRA EGNA sidor, vilket
// är precis det värmande vi vill ha. Se den längre noten i warm-and-ping.
import { NextResponse } from "next/server";
import { getProductSitemapEntries } from "../../../../lib/products";
import { katalogenArKall, roterad, varmAlla, varmBildkartan } from "../../../../lib/warm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type AuthUtfall = "ok" | "fel-token" | "oskyddad";

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

  // Marginal mot maxDuration så svaret hinner skrivas även om sista batchen är trög.
  const deadline = Date.now() + 240_000;

  const entries = await getProductSitemapEntries();
  const slugs = entries.map((e) => e.slug);
  const prov = await katalogenArKall(slugs);

  if (!prov.kall) {
    return NextResponse.json({ ok: true, katalog: slugs.length, prov, varmning: null, bildkartan: null });
  }

  // Kall katalog = färsk deploy. Bildkartan först: den är EN begäran och
  // listsidornas kort väntar på den, medan produktsidorna värms en och en.
  const bildkartan = await varmBildkartan();
  const varmning = await varmAlla(roterad(slugs), deadline);

  console.log(
    `[varm-katalogen] prov ${prov.missar}/${prov.av} MISS → kall. `
      + `Värmde ${varmning.ok}/${slugs.length}${varmning.avbruten ? " (avbruten på deadline — nästa körning roterar vidare)" : ""}. `
      + `Bildkartan: ${bildkartan ? "ok" : "misslyckades"}`,
  );

  return NextResponse.json({ ok: true, katalog: slugs.length, prov, varmning, bildkartan });
}
