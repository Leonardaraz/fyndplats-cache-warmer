// GET/POST /api/cron/aosom-reviews
//
// Hämtar Aosoms PRODUKTrecensioner till katalogen. Vi köper varorna av Aosom,
// så det är samma fysiska artikelnummer — recensionerna handlar om produkten,
// inte om Aosom som säljare.
//
// ☠️ VILLKORET ÄR ATT KÄLLAN ANGES PÅ PRODUKTSIDAN. Artikel 7.6 UCPD (Omnibus
// 2019/2161) ålägger den som visar konsumentrecensioner att upplysa om
// huruvida och hur de kommer från konsumenter som faktiskt använt produkten;
// bilaga I punkt 23b förbjuder att PÅSTÅ att de är egna kunders utan täckning.
// Raderna skrivs därför med `source: "aosom"`, och butiken MÅSTE rendera
// härkomsten — annars hamnar de under rubriken "Kundrecensioner" som om de
// vore våra egna kunders, och det är själva överträdelsen.
//
// ☠️ AGGREGATET LAGRAS SEPARAT och räknas aldrig ur de hämtade texterna.
// JSON-LD bär högst fem recensioner av ibland åttiotalet, och Aosoms urval
// lutar högt: uppmätt snitt 4,86 över 30 spridda produkter ur vår katalog
// (2026-08-29). Sidan ska kunna säga "4,8 av 88", inte "5,0 av 5".
//
// UPPMÄTT TÄCKNING på samma urval: 77 % har aggregerat betyg, 63 % minst en
// recensionstext, i snitt 2,1 texter per produkt (inte 5). Utslaget på de
// 4 445 Aosom-mappningarna: ~3 400 med betyg, ~9 500 texter.
//
// Recensionerna är TYSKA och landar som `pending` med källtexten i både
// textOriginal och textSwedish — de blir svenska först när någon skriver om
// dem i /admin/reviews, exakt som AE-recensionerna sedan 2026-08-19.
//
// INTE SCHEMALAGD, av samma skäl som review-backfill och aosom-import: en cron
// som fyller översättningskön snabbare än någon hinner tömma den ger bara en
// växande hög tysk text. Kör den för hand i den takt kön töms.
//
// Query:
//   ?dryRun=false        skarpt läge (default: torrkörning, skriver ingenting)
//   ?limit=40            produkter denna körning
//   ?after=845-030CG     fortsätt efter det här artikelnumret (markören ur förra svaret)
//   ?sku=845-030CG,...   kör bara dessa (rökprov och riktad omkörning)
//   ?ignoreCheckedAt=1   kolla om även redan kontrollerade produkter
//   ?delayMs=1200        paus mellan sidhämtningar (Aosom är någon annans server)

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { importReviewsForProduct } from "@/lib/import/review-import";
import { runAosomReviewImport } from "@/lib/aosom/review-run";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Under maxDuration med marginal — mappningslistan tar ~15 s att läsa in. */
const TIME_BUDGET_MS = 230_000;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

function intParam(req: NextRequest, name: string, fallback: number): number {
  const n = Number(req.nextUrl.searchParams.get(name));
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : fallback;
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
  const limit = intParam(req, "limit", 40);
  const delayMs = intParam(req, "delayMs", 1200);
  const after = req.nextUrl.searchParams.get("after") ?? undefined;
  const onlySkus = (req.nextUrl.searchParams.get("sku") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const store = getStore();
    const summary = await runAosomReviewImport(
      {
        dryRun,
        limit,
        delayMs,
        after,
        ignoreCheckedAt: boolParam(req, "ignoreCheckedAt"),
        onlySkus: onlySkus.length ? onlySkus : undefined,
        timeBudgetMs: TIME_BUDGET_MS,
      },
      {
        listMappings: () => store.listMappings(),
        saveMapping: (m) => store.saveMapping(m),
        // `source: "aosom"` är inte metadata — det är det som gör raden möjlig
        // att märka på produktsidan. Se noten överst.
        importReviews: (productId, reviews) =>
          importReviewsForProduct(productId, reviews, { source: "aosom" }),
      },
    );

    if (!dryRun && (summary.imported > 0 || summary.failed > 0)) {
      await audit(
        "aosom-reviews",
        "batch",
        `${summary.imported} recensioner sparade, ${summary.withRating} betyg, `
          + `${summary.filteredOut} bortfiltrerade, ${summary.failed} fel, `
          + `${summary.remaining} kvar (stopp: ${summary.stoppedBy})`,
      );
    }

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Serialisera alltid felet till svaret — en naken 500 gjorde
    // aliexpress-sync omöjlig att felsöka i 57 timmar (audit 2026-08-28).
    await audit("aosom-reviews-fatal", "batch", msg.slice(0, 300));
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
