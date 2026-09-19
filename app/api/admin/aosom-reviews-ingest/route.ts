// POST /api/admin/aosom-reviews-ingest — läs in Aosom-recensioner hämtade i en webbläsare.
//
// Body (JSON):
//   {
//     "dryRun": true,                       default TRUE — skarpt kräver false
//     "rader": [
//       { "wixProductId": "…", "rating": 4.6, "reviewCount": 14,
//         "reviews": [ { "rating": 5, "text": "<tyska>", "sv": "<svenska, valfri>" } ] }
//     ]
//   }
//
// VARFÖR RUTTEN FINNS. /api/cron/aosom-reviews kan inte hämta: Aosoms kant
// (Akamai) släpper bara igenom riktiga webbläsare. Med Aosoms tillstånd
// (2026-09-16) hämtas recensionerna i Leonards Chrome och läses in här.
// Logiken bor i lib/aosom/review-ingest.ts; det här är IO och auth.
//
// ☠️ LOGGEN BÄR BARA RÄKNARE. Inga texter, inga namn, inga artikelnummer —
// rutten anropas från en publik Actions-logg.
//
// ☠️ HÖGST 60 RADER PER ANROP och en tidsbudget under maxDuration: varje rad
// kan kosta ~15 skrivningar mot Wix Data. Svaret säger `kvarFran` när budgeten
// tog slut, så anroparen kan fortsätta därifrån.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { getReviewStore } from "@/lib/store/reviews";
import { importReviewsForProduct } from "@/lib/import/review-import";
import { lasInRecensioner, tolkaInlasning } from "@/lib/aosom/review-ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

const TIDSBUDGET_MS = 240_000;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Kroppen är inte JSON" }, { status: 400 });
  }
  const dryRun = !(body && typeof body === "object" && (body as { dryRun?: unknown }).dryRun === false);
  const tolkning = tolkaInlasning(body);
  if (tolkning.fel.length > 0 && tolkning.rader.length === 0) {
    return NextResponse.json({ ok: false, error: tolkning.fel.slice(0, 5) }, { status: 400 });
  }

  const store = getStore();
  const reviewStore = getReviewStore();
  const mappningar = await store.listMappings();
  const perWix = new Map(mappningar.map((m) => [m.wixProductId, m]));

  const s = await lasInRecensioner(tolkning.rader, {
    hittaMappning: (id) => perWix.get(id),
    // Samma anrop som svepet i /api/cron/aosom-reviews — källan sätts av den som hämtar.
    importReviews: (productId, reviews) => importReviewsForProduct(productId, reviews, { source: "aosom" }),
    listByProduct: (productId) => reviewStore.listByProduct(productId),
    editText: (productId, id, sv) => reviewStore.editText(productId, id, sv),
    saveMapping: (m) => store.saveMapping(m),
    now: () => Date.now(),
    dryRun,
    tidsbudgetMs: TIDSBUDGET_MS,
    startMs: t0,
  });

  if (!dryRun && s.behandlade > 0) {
    await audit(
      "aosom-reviews",
      "ingest",
      `${s.behandlade} produkter, ${s.importerade} texter importerade, ${s.redanFanns} fanns, `
        + `${s.bortfiltrerade} bortfiltrerade, ${s.oversatta} översatta, ${s.underkanda} underkända, `
        + `${s.stamplade} stämplade, ${s.skrivfel} skrivfel, stoppad på ${s.stoppadAv}`,
    );
  }

  console.log(
    `[aosom-reviews] INGEST ${dryRun ? "TORR" : "SKARP"} ${s.rader} rader, ${s.behandlade} behandlade, `
      + `${s.okandProdukt} okända, ${s.texterInkomna} texter in, ${s.importerade} importerade, `
      + `${s.redanFanns} fanns, ${s.bortfiltrerade} bortfiltrerade, ${s.oversatta} översatta, `
      + `${s.underkanda} underkända, ${s.oversattningUtanRad} utan rad, ${s.stamplade} stämplade, `
      + `${s.skrivfel} skrivfel, ${s.stoppadAv}${s.kvarFran !== null ? ` kvar från ${s.kvarFran}` : ""}, `
      + `${Date.now() - t0} ms`,
  );

  return NextResponse.json({ ok: true, ...s, tolkningsfel: tolkning.fel.slice(0, 10) });
}
