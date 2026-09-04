// GET/POST /api/cron/aosom-sync
//
// Speglar Aosoms lagersaldon och priser till Wix.
//
// VARFÖR DEN FINNS
//
// Aosom-sortimentet hade ingen synk alls fram till 2026-08-28, och det var det
// enda som hindrade publicering: en butik som visar saldon ingen uppdaterar
// säljer varor som inte finns.
//
// SKILLNADEN MOT ALIEXPRESS-SYNKEN
//
// AE ringer sitt API en gång per produkt och roterar genom katalogen under en
// anropsbudget. Aosom är ett enda anrop som ger hela sortimentet, så varje
// körning ser allt samtidigt. Priset för det är att en trasig feed kan slå mot
// hela katalogen på en gång — därför kastar `runAosomSync` när feeden ser
// trunkerad ut, i stället för att tolka den som att lagret tagit slut.
//
// VAD DEN INTE RÖR
//
// Synlighet, texter, bilder, kategorier. Bara lagersaldo, pris och mappningens
// kostnadsfält. Prisskrivningen går via `updateV3VariantPrices`, som sedan
// 2026-08-28 skickar tillbaka `visible` oförändrad — utan det publicerar en
// variantsInfo-PATCH utkastet den rör.
//
// ☠️ FACIT FÖR PRISET ÄR BUTIKEN, INTE MAPPNINGEN (sedan 2026-09-02).
// Butikens priser läses i bulk före loopen (~54 anrop för hela katalogen).
// Jämfördes de mot mappningens `grossSek` kunde en rad som drivit isär aldrig
// självläka — se `jamforelsePris` i lib/aosom/sync.ts. `skipPrices=1` hoppar
// över den läsningen helt.
//
// Query:
//   ?dryRun=false        skarpt läge (default: torrkörning, skriver ingenting)
//   ?limit=400           produkter denna körning
//   ?after=845-030CG     fortsätt efter det här artikelnumret
//   ?sku=845-030CG,...   kör bara dessa (riktad omkörning)
//   ?skipPrices=1        synka bara lager

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { runAosomSync, liveDeps } from "@/lib/aosom/sync";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Under maxDuration med marginal — feeden tar ~5 s att hämta och tolka. */
const TIME_BUDGET_MS = 240_000;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function intParam(req: NextRequest, name: string, fallback: number): number {
  const n = Number(req.nextUrl.searchParams.get(name));
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") !== "false";
  const limit = intParam(req, "limit", 400);
  const after = req.nextUrl.searchParams.get("after") ?? undefined;
  const skipPrices = req.nextUrl.searchParams.get("skipPrices") === "1";
  const onlySkus = (req.nextUrl.searchParams.get("sku") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const summary = await runAosomSync(await liveDeps(), {
      dryRun,
      limit,
      after,
      skipPrices,
      onlySkus: onlySkus.length ? onlySkus : undefined,
      timeBudgetMs: TIME_BUDGET_MS,
    });

    // `utanWixPris` fäller också raden: produkter vars pris vi inte kunde
    // jämföra är tyst överhoppade, och tyst överhoppat är precis hur de tjugo
    // drivande raderna kunde ligga osedda i en månad.
    // ☠️ `misslyckade` fäller också raden. Utan det skrevs ingen audit-rad alls
    // för en körning som bara misslyckades — och en körning som inte kunde
    // skriva någonting såg då ut exakt som en körning där allt redan stämde.
    if (!dryRun && (summary.lagerUppdaterade > 0 || summary.prisUppdaterade > 0
      || summary.utanWixPris > 0 || summary.utanLagerrader > 0 || summary.misslyckade > 0
      || summary.prislistaFel)) {
      await audit(
        "aosom-sync",
        "batch",
        `${summary.lagerUppdaterade} lagersaldon och ${summary.prisUppdaterade} priser uppdaterade, `
          + `${summary.urFeeden} ur feeden, ${summary.slutsalda} slutsålda, `
          + `${summary.varningar.length} blockerade prishopp, `
          + `${summary.utanWixPris} utan butikspris, ${summary.utanLagerrader} utan lagerrader, `
          + `${summary.lagerDrift} lagerdrift, ${summary.misslyckade} MISSLYCKADE, `
          + `${summary.kvar} kvar`
          + (summary.errors[0] ? ` — första felet: ${summary.errors[0].error.slice(0, 160)}` : "")
          + (summary.prislistaFel ? ` — PRISLISTAN GICK INTE ATT LÄSA: ${summary.prislistaFel}` : ""),
      );
    }

    // ☠️ En rad i loggen, alltid. Vercel visar annars bara `GET … 200` för en
    // schemalagd körning, och "ett svar utan fel är inget kvitto" — utan den
    // här raden går det inte att se vad nattens synk faktiskt gjorde utan att
    // ha CRON_SECRET för handen.
    console.log(
      `[aosom-sync] ${summary.granskade} granskade, ${summary.lagerUppdaterade} lager, `
        + `${summary.prisUppdaterade} priser, ${summary.utanWixPris} utan butikspris, `
        + `${summary.urFeeden} ur feeden, ${summary.slutsalda} slutsålda, `
        + `${summary.varningar.length} varningar, ${summary.utanLagerrader} utan lagerrader, `
        + `${summary.lagerDrift} lagerdrift, ${summary.misslyckade} misslyckade, `
        + `${summary.kvar} kvar${dryRun ? " (TORRKÖRNING — inget skrevs)" : ""}`
        + (summary.prislistaFel ? ` — PRISLISTAN GICK INTE ATT LÄSA: ${summary.prislistaFel}` : ""),
    );

    return NextResponse.json(
      {
        ok: true,
        ...summary,
        next: summary.cursor
          ? `/api/cron/aosom-sync?dryRun=${dryRun ? "true" : "false"}&limit=${limit}`
            + `&after=${encodeURIComponent(summary.cursor)}`
          : null,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    // En trunkerad feed landar här. 500 är rätt: körningen ska synas som misslyckad
    // i cron-loggen, inte som en lyckad körning som råkade inte göra något.
    return NextResponse.json({ error: "Aosom-synken misslyckades", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
