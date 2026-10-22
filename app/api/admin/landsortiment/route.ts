// GET /api/admin/landsortiment?land=DK — vilka publicerade Aosom-sidor som får
// säljas i landet, och vad de kostar där.
//
// Underlaget för Danmark (Leonard 2026-10-22). Svaret bär en sammanfattning med
// räknare och en lista per sida med pris i landets valuta. Logiken och skälen
// står i lib/aosom/landsortiment.ts.
//
// ☠️ LISTAN BÄR PRISER OCH VÅRT URVAL. Workflowen "Danmark — sortiment och pris
// per sida (krypterat)" skriver bara sammanfattningen och krypterar listan.
// Rutten läser bara, och skriver ingenting.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { fetchAosomFeed } from "@/lib/aosom/feed";
import { felSvar, loggtext } from "@/lib/aosom/frakt-per-land";
import { arSaljland, matLandsortiment, SALJLANDER } from "@/lib/aosom/landsortiment";
import { eurToDkkFromEnv, eurToSekFromEnv } from "@/lib/config";
import { getPricingRules } from "@/lib/store/pricing-config";
import { getStore } from "@/lib/store/factory";
import { listV3ProductInfo } from "@/lib/wix/v3-products";

export const runtime = "nodejs";
export const maxDuration = 300;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }
  const land = req.nextUrl.searchParams.get("land") ?? "";
  if (!arSaljland(land)) {
    return NextResponse.json(
      { ok: false, error: `land måste vara ett av ${SALJLANDER.join(", ")}` },
      { status: 400 },
    );
  }
  try {
    const { sammanfattning, lista } = await matLandsortiment(land, {
      hamtaFlodet: () => fetchAosomFeed(undefined, fetch, { fraktPerLand: true }),
      listaMappningar: () => getStore().listMappings(),
      listaProdukter: () => listV3ProductInfo(),
      regler: () => getPricingRules(),
      kurser: { eurToSek: eurToSekFromEnv(), eurToLokal: eurToDkkFromEnv() },
    });
    const s = sammanfattning.sidor;
    console.log(
      `[landsortiment] ${land}: ${s.ok} av ${s.aosom} publicerade Aosom-sidor kan säljas, `
        + `${s.utesluten} uteslutna. Feeden ${sammanfattning.underlag.flodetRader} rader.`,
    );
    return NextResponse.json({ ok: true, ...sammanfattning, lista });
  } catch (err) {
    console.error(`[landsortiment] föll: ${loggtext(err)}`);
    const { status, error } = felSvar(err);
    return NextResponse.json({ ok: false, error }, { status });
  }
}
