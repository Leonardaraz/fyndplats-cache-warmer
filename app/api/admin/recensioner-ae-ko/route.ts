// POST /api/admin/recensioner-ae-ko — töm AliExpress-kön i /admin/reviews.
//
//   (ingen parameter)   torrt: räknar bara, skriver ingenting
//   ?skarp=ja           döljer: status → "rejected" på varje VÄNTANDE
//                       AliExpress-recension
//
// Leonards beslut 2026-10-06: de väntande AliExpress-recensionerna behövs inte.
// Logiken bor i lib/reviews/ae-ko-rensning.ts, det här är IO och auth — samma
// form som /api/admin/recensioner-datumrensning.
//
// ☠️ DÖLJ, RADERA ALDRIG. En dold rad kan återställas i /admin/reviews.
//
// ☠️ HELA LAGRET LÄSES, med ett tak långt över lagrets storlek. Svaret säger
// `trunkerad: true` om det ändå nås, och då döljs ingenting.
//
// ☠️ LOGGEN BÄR BARA RÄKNARE — rutten anropas från en publik Actions-logg.
// Högst ~240 s per anrop; svaret bär `kvar` så workflowen kan fortsätta.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getReviewStore } from "@/lib/store/reviews";
import { planeraAeKoRensning } from "@/lib/reviews/ae-ko-rensning";

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
    console.error(`[ae-ko] kunde inte läsa lagret: ${String(err).slice(0, 200)}`);
    return NextResponse.json({ ok: false, error: "Kunde inte läsa recensionslagret" }, { status: 500 });
  }
  const trunkerad = rader.length >= LASTAK;
  const plan = planeraAeKoRensning(rader);

  let dolda = 0;
  let skrivfel = 0;
  if (skarp && !trunkerad) {
    for (const r of plan.attDolja) {
      if (Date.now() - t0 > TIDSBUDGET_MS) break;
      try {
        await store.setStatus(r.productId, r.reviewIdAE, "rejected");
        dolda++;
      } catch {
        skrivfel++;
      }
    }
  }
  const kvar = skarp ? plan.attDolja.length - dolda - skrivfel : plan.attDolja.length;

  if (skarp && dolda > 0) {
    await audit(
      "reviews",
      "ae-ko",
      `${dolda} väntande AliExpress-recensioner dolda (status rejected) på ${plan.produkter} produkter, `
        + `${skrivfel} skrivfel, ${kvar} kvar`,
    );
  }

  console.log(
    `[ae-ko] ${skarp ? "SKARP" : "TORR"} ${plan.granskade} granskade, ${plan.vantande} väntande `
      + `${JSON.stringify(plan.vantandePerKalla)}, ${plan.attDolja.length} AliExpress att dölja på ${plan.produkter} produkter `
      + `(${plan.medSvenskText} med svensk text), ${dolda} dolda, ${skrivfel} skrivfel, ${kvar} kvar`
      + `${trunkerad ? ", TRUNKERAD" : ""}, ${Date.now() - t0} ms`,
  );

  // ASCII-nycklar med flit: workflowen läser svaret med jq.
  return NextResponse.json({
    ok: !trunkerad,
    dryRun: !skarp,
    granskade: plan.granskade,
    vantande: plan.vantande,
    vantandePerKalla: plan.vantandePerKalla,
    attDolja: plan.attDolja.length,
    produkter: plan.produkter,
    medSvenskText: plan.medSvenskText,
    dolda,
    skrivfel,
    kvar,
    trunkerad,
  });
}
