// POST /api/admin/recensioner-datumrensning — dölj recensioner daterade före 2021.
//
//   (ingen parameter)   torrt: räknar bara, skriver ingenting
//   ?skarp=ja           döljer: status → "rejected" på varje synlig eller
//                       väntande rad daterad före gränsen
//
// VARFÖR RUTTEN FINNS (2026-09-23). Leonards beslut: "Alla recensioner som är
// äldre än 2021 måste bort." Husets filter stoppar dem numera vid inläsningen
// (lib/import/review-import.ts); den här rutten städar det som redan ligger i
// lagret. Logiken bor i lib/reviews/datumgrans.ts, det här är IO och auth.
//
// ☠️ DÖLJ, RADERA ALDRIG. En dold rad kan återställas i /admin/reviews.
//
// ☠️ HELA LAGRET LÄSES. listAll sorterar nyast först och kapar vid sin
// gräns — med standardtaket (5 000) hade just de ÄLDSTA raderna, de vi letar
// efter, fallit bort tyst. Taket här är satt långt över lagrets storlek, och
// svaret säger `trunkerad: true` om det ändå nås.
//
// ☠️ LOGGEN BÄR BARA RÄKNARE — rutten anropas från en publik Actions-logg.
// Högst ~240 s per anrop; svaret bär `kvar` så workflowen kan fortsätta.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getReviewStore } from "@/lib/store/reviews";
import { planeraDatumrensning } from "@/lib/reviews/datumgrans";

export const runtime = "nodejs";
export const maxDuration = 300;

const TIDSBUDGET_MS = 240_000;
/** Långt över lagrets storlek (≈8 000 rader i september 2026). */
const LASTAK = 100_000;

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
  const skarp = req.nextUrl.searchParams.get("skarp") === "ja";

  const store = getReviewStore();
  let rader;
  try {
    rader = await store.listAll(LASTAK);
  } catch (err) {
    console.error(`[datumrensning] kunde inte läsa lagret: ${String(err).slice(0, 200)}`);
    return NextResponse.json({ ok: false, error: "Kunde inte läsa recensionslagret" }, { status: 500 });
  }
  const trunkerad = rader.length >= LASTAK;
  const plan = planeraDatumrensning(rader);

  let dolda = 0;
  let skrivfel = 0;
  if (skarp && !trunkerad) {
    for (const r of plan.attDölja) {
      if (Date.now() - t0 > TIDSBUDGET_MS) break;
      try {
        await store.setStatus(r.productId, r.reviewIdAE, "rejected");
        dolda++;
      } catch {
        skrivfel++;
      }
    }
  }
  const kvar = skarp ? plan.attDölja.length - dolda - skrivfel : plan.attDölja.length;

  if (skarp && dolda > 0) {
    await audit(
      "reviews",
      "datumrensning",
      `${dolda} recensioner daterade före ${plan.gräns} dolda (status rejected) på ${plan.produkter} produkter, `
        + `${skrivfel} skrivfel, ${kvar} kvar`,
    );
  }

  console.log(
    `[datumrensning] ${skarp ? "SKARP" : "TORR"} ${plan.granskade} granskade, ${plan.föreGränsen} före ${plan.gräns}, `
      + `${plan.attDölja.length} att dölja på ${plan.produkter} produkter, ${plan.redanDolda} redan dolda, `
      + `${plan.utanDatum} utan datum, ${dolda} dolda, ${skrivfel} skrivfel, ${kvar} kvar`
      + `${trunkerad ? ", TRUNKERAD" : ""}, ${Date.now() - t0} ms`,
  );

  // ASCII-nycklar med flit: workflowen läser svaret med jq, vars punktsyntax
  // (.nyckel) inte tål å, ä och ö.
  return NextResponse.json({
    ok: !trunkerad,
    dryRun: !skarp,
    grans: plan.gräns,
    granskade: plan.granskade,
    foreGransen: plan.föreGränsen,
    attDolja: plan.attDölja.length,
    produkter: plan.produkter,
    redanDolda: plan.redanDolda,
    utanDatum: plan.utanDatum,
    perStatus: plan.perStatus,
    perKalla: plan.perKälla,
    perAr: plan.perÅr,
    dolda,
    skrivfel,
    kvar,
    trunkerad,
  });
}
