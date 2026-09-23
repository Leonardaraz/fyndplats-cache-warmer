// GET /api/admin/aosom-reviews-kandidater — vilka produkter ska få sina
// Aosom-recensioner hämtade?
//
//   ?fore=2026-09-16T00:00:00Z   ta även med produkter kontrollerade före det
//
// Svarar med synliga Aosom-produkter som aldrig fått `reviewsCheckedAt`, och
// deras artikelnummer. Logiken bor i lib/aosom/review-kandidater.ts.
//
// ☠️ SVARET BÄR ARTIKELNUMMER. Rutten kräver därför samma nyckel som resten av
// /api/admin, och den enda anroparen är aosom-reviews-kandidater.yml, som
// krypterar numren mot anroparens engångsnyckel innan något når den publika
// loggen. Rutten själv loggar bara räknare.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { listVisibleV3ProductIds } from "@/lib/wix/v3-products";
import { planeraRecensionskandidater } from "@/lib/aosom/review-kandidater";

export const runtime = "nodejs";
export const maxDuration = 120;

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
  const fore = req.nextUrl.searchParams.get("fore") ?? undefined;

  let plan;
  try {
    const [mappningar, synliga] = await Promise.all([
      getStore().listMappings(),
      listVisibleV3ProductIds(),
    ]);
    plan = planeraRecensionskandidater(mappningar, synliga, { fore });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[aosom-reviews-kandidater] misslyckades: ${msg.slice(0, 200)}`);
    return NextResponse.json({ ok: false, error: msg.slice(0, 200) }, { status: 502 });
  }

  console.log(
    `[aosom-reviews-kandidater] ${plan.kandidater.length} kandidater av ${plan.synligaAosom} synliga `
      + `Aosom-produkter (${plan.redanKontrollerade} redan kontrollerade, `
      + `${plan.utanArtikelnummer} utan artikelnummer, ${plan.ejSynliga} ej synliga`
      + (fore ? `, omsvep före ${fore}` : "")
      + ")",
  );

  return NextResponse.json({
    ok: true,
    antal: plan.kandidater.length,
    aosomRader: plan.aosomRader,
    synligaAosom: plan.synligaAosom,
    redanKontrollerade: plan.redanKontrollerade,
    utanArtikelnummer: plan.utanArtikelnummer,
    ejSynliga: plan.ejSynliga,
    fore: fore ?? null,
    kandidater: plan.kandidater,
  });
}
