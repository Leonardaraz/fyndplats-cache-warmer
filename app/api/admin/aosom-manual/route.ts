// GET /api/admin/aosom-manual?wix=<wixProductId> — var ligger Aosoms
// produktmanual för en av våra sidor?
//
// Leonard 2026-09-30: fyra publicerade torktumlare saknar energimärkning,
// "kolla produkt pdf om du kan hitta där". Manualen finns bara som en adress i
// feeden, och feedens adress är hemlig. Rutten slår därför upp sidans artiklar
// och deras manualer här, där feeden redan går att läsa.
//
// ☠️ SVARET BÄR MANUALENS ADRESS, OCH DEN BÄR ARTIKELNUMRET. Det får bara
// läsas av den som har CRON_SECRET, alltså workflowen "Aosom — sök i
// produktmanualer", som maskerar varje adress innan den skriver något och
// sedan hämtar PDF:en själv. PDF:en går inte genom rutten: Vercel tar högst
// 4,5 MB i ett svar, och manualerna är ofta tiotals megabyte.
//
// ☠️ INGET LOGGAS HÄR UTOM RÄKNARE. Vercels logg är privat, men en adress
// som hamnar där hamnar också i varje export av den.
//
// Rutten skriver ingenting.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { resolveAosomFeedUrl } from "@/lib/aosom/feed";
import { artiklarPaSidan, manualLankar, unikaManualer } from "@/lib/aosom/manual";
import { isAosomMapping } from "@/lib/store/supplier";

export const runtime = "nodejs";
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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
  const wix = (req.nextUrl.searchParams.get("wix") ?? "").trim().toLowerCase();
  if (!UUID.test(wix)) {
    return NextResponse.json({ ok: false, error: "wix ska vara ett produkt-id (uuid)" }, { status: 400 });
  }

  const m = await getStore().getMappingByWixProductId(wix);
  if (!m) {
    return NextResponse.json({ ok: false, error: "ingen mappning för produkten" }, { status: 404 });
  }
  if (!isAosomMapping(m)) {
    return NextResponse.json({ ok: false, error: "inte en Aosom-sida — manualen finns bara i Aosoms feed" }, { status: 400 });
  }
  const artiklar = artiklarPaSidan(m);
  if (artiklar.length === 0) {
    return NextResponse.json({ ok: false, error: "raden bär ingen artikel" }, { status: 404 });
  }

  try {
    const res = await fetch(await resolveAosomFeedUrl());
    if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
    const lankar = manualLankar(await res.text(), artiklar);
    const manualer = unikaManualer(artiklar, lankar);
    console.log(`[aosom-manual] ${artiklar.length} artiklar, ${manualer.length} manualer, ${artiklar.length - lankar.size} utan`);
    return NextResponse.json({
      ok: true,
      wix,
      artiklar: artiklar.length,
      utanManual: artiklar.length - lankar.size,
      // ☠️ Bär artikelnumret — se överst. Workflowen maskerar varje post.
      manualer,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : String(e) },
      { status: 500 },
    );
  }
}
