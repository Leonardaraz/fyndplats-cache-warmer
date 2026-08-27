// GET/POST /api/cron/aosom-import
//
// Hämtar in Aosoms B2B-sortiment i katalogen som osynliga utkast.
//
// Uppdraget (Leonard 2026-08-27): "hämta alla produkter till vår katalog som går
// att frakta till sverige. Gör dom inte visable. Vi ska polera alla sen."
//
// TRE SIFFROR SOM FÖRKLARAR HELA UPPLÄGGET
//
//   6 057   rader i feeden
//   5 566   som går att frakta till Sverige (saldo + ett verkligt fraktpris)
//  50 018   bilder bakom dem — och varje bild är ett eget Wix-anrop
//
// Det sista talet är varför rutten tar en tugga i taget. En serverless-rutt har
// 300 sekunder; hela svepet är timmar. Körningen stämplar av det som är klart i
// mappningarna, returnerar en markör, och kan startas om hur många gånger som
// helst — dubblettspärren gör omkörning till en no-op.
//
// KOSTNAD: noll credits. Läget är alltid "raw" — inga Claude-anrop alls. Det är
// också det som gör produkterna osynliga: pipeline.ts sätter visible:false
// ovillkorligt i rått läge. Poleringen sker sedan gratis i chatten via
// /admin/queue, precis som för AliExpress-importerna.
//
// INTE SCHEMALAGD. Rutten körs för hand tills sortimentet är inne. En cron som
// fyller poleringskön snabbare än någon hinner skriva om texterna skapar bara
// en växande hög med tyska utkast — samma skäl som review-backfill står oschema-
// lagd. Vill du automatisera svepet: lägg in cron-raden i vercel.json OCH sätt
// limit lågt, så kön växer i den takt den töms.
//
// Query:
//   ?dryRun=false        skarpt läge (default: torrkörning, skriver ingenting)
//   ?limit=25            produkter denna körning
//   ?after=845-030CG     fortsätt efter det här artikelnumret (markören ur förra svaret)
//   ?skipFreightHeavy=1  hoppa över de 1 175 där frakten kostar mer än varan
//   ?sku=845-030CG,...   kör bara dessa (rökprov och riktad omkörning)
//   ?delayMs=250         paus mellan produkter om Wix börjar svara 429
//   ?bilder=alla         hämta alla nio bilderna (default: 1,2,3,8,9 — se
//                        RENA_BILDPOSITIONER; 46 % av feedens bilder bär tysk
//                        text inbränd, och den sitter mätbart på 4-7)
//   ?bilder=1,2,9        egna positioner

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { runAosomImport, liveDeps } from "@/lib/aosom/import-run";

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

function boolParam(req: NextRequest, name: string): boolean {
  const v = req.nextUrl.searchParams.get(name);
  return v === "1" || v === "true";
}

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") !== "false";
  const limit = intParam(req, "limit", 25);
  const after = req.nextUrl.searchParams.get("after") ?? undefined;
  const skipFreightHeavy = boolParam(req, "skipFreightHeavy");
  const delayMs = intParam(req, "delayMs", 0);
  const bilderParam = (req.nextUrl.searchParams.get("bilder") ?? "").trim();
  const bildpositioner = bilderParam === "alla"
    ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
    : bilderParam
      ? bilderParam.split(",").map((s) => Number(s.trim())).filter((n) => n >= 1 && n <= 9)
      : undefined;
  const onlySkus = (req.nextUrl.searchParams.get("sku") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const summary = await runAosomImport(await liveDeps(), {
      dryRun,
      limit,
      after,
      skipFreightHeavy,
      delayMs,
      onlySkus: onlySkus.length ? onlySkus : undefined,
      bildpositioner: bildpositioner?.length ? bildpositioner : undefined,
      timeBudgetMs: TIME_BUDGET_MS,
    });

    if (!dryRun && summary.imported > 0) {
      await audit(
        "aosom-import",
        "batch",
        `${summary.imported} produkter importerade som utkast, ${summary.failed} fel, `
          + `${summary.remaining} kvar (stopp: ${summary.stoppedBy})`,
      );
    }

    return NextResponse.json(
      {
        ok: true,
        ...summary,
        // Nästa anrop, färdigt att klistra in. Null när sortimentet är inne.
        next: summary.cursor
          ? `/api/cron/aosom-import?dryRun=${dryRun ? "true" : "false"}&limit=${limit}`
            + `&after=${encodeURIComponent(summary.cursor)}`
          : null,
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Aosom-importen misslyckades", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
