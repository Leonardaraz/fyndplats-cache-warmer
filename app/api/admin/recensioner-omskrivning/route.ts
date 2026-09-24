// POST /api/admin/recensioner-omskrivning — byt text på publicerade Aosom-recensioner.
//
// Body (JSON):
//   {
//     "dryRun": true,                       default TRUE — skarpt kräver false
//     "rader": [
//       { "productId": "…", "reviewIdAE": "…", "fore": "<publicerad text>", "sv": "<ny text>" },
//       { "productId": "…", "reviewIdAE": "…", "dolj": true }
//     ]
//   }
//
// VARFÖR RUTTEN FINNS (2026-09-24). Leonard: recensionerna såg AI-skrivna ut.
// Inläsningen rör bara väntande rader; det här är den enda vägen som byter text
// på en publicerad rad — bara Aosom-rader, bara synliga, bara om den lagrade
// texten fortfarande är `fore`, och bara genom översättningsgrinden. Logiken
// bor i lib/reviews/omskrivning.ts, det här är IO och auth.
//
// ☠️ LOGGEN BÄR BARA RÄKNARE — rutten anropas från en publik Actions-logg.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getReviewStore } from "@/lib/store/reviews";
import { skrivOm, tolkaOmskrivning } from "@/lib/reviews/omskrivning";

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
  const tolkning = tolkaOmskrivning(body);
  if (tolkning.fel.length > 0 && tolkning.rader.length === 0) {
    return NextResponse.json({ ok: false, error: tolkning.fel.slice(0, 5) }, { status: 400 });
  }

  const store = getReviewStore();
  const s = await skrivOm(tolkning.rader, {
    listByProduct: (productId) => store.listByProduct(productId),
    editText: (productId, id, sv) => store.editText(productId, id, sv),
    setStatus: (productId, id, status) => store.setStatus(productId, id, status),
    now: () => Date.now(),
    dryRun,
    tidsbudgetMs: TIDSBUDGET_MS,
    startMs: t0,
  });

  if (!dryRun && (s.omskrivna > 0 || s.dolda > 0)) {
    await audit(
      "reviews",
      "omskrivning",
      `${s.omskrivna} Aosom-recensioner omskrivna, ${s.dolda} dolda, ${s.andradeSedan} ändrade sedan, `
        + `${s.underkanda} underkända, ${s.skrivfel} skrivfel, stoppad på ${s.stoppadAv}`,
    );
  }

  console.log(
    `[omskrivning] ${dryRun ? "TORR" : "SKARP"} ${s.rader} rader, ${s.omskrivna} omskrivna, ${s.dolda} dolda, `
      + `${s.oforandrade} oförändrade, ${s.andradeSedan} ändrade sedan, ${s.ejSynliga} ej synliga, `
      + `${s.annanKalla} annan källa, ${s.saknas} saknas, ${s.underkanda} underkända, ${s.skrivfel} skrivfel, `
      + `${s.stoppadAv}${s.kvarFran !== null ? ` kvar från ${s.kvarFran}` : ""}, ${Date.now() - t0} ms`,
  );

  return NextResponse.json({ ok: true, ...s, tolkningsfel: tolkning.fel.slice(0, 10) });
}
