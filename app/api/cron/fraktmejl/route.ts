// app/api/cron/fraktmejl/route.ts
// Vercel Cron: GET /api/cron/fraktmejl, var 15:e minut (vercel.json).
//
// Fraktmejlet går normalt direkt från webhooken när hela ordern är skickad,
// med alla spårningsnummer i ett mejl (lib/shipping-email-batch.ts). Skickas en
// order i omgångar blir den inte helt skickad vid första paketet. Den här cronen
// skickar det som väntat i minst VANTETID_MIN minuter, så kunden aldrig står utan
// spårningsnummer.

import { NextResponse } from "next/server";
import { ordrarSomVantat, VANTETID_MIN } from "@/lib/shipping-email-batch";
import { skickaSamlatFraktmejl } from "@/app/api/wix-webhook/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorised(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }
  const ordrar = await ordrarSomVantat(VANTETID_MIN);
  const resultat = [];
  for (const orderGuid of ordrar) {
    try {
      resultat.push({ orderGuid, ...(await skickaSamlatFraktmejl(orderGuid)) });
    } catch (err) {
      console.error("[cron/fraktmejl]", orderGuid, err instanceof Error ? err.message : err);
      resultat.push({ orderGuid, sent: 0, reason: "error" });
    }
  }
  if (ordrar.length > 0) console.log(`[cron/fraktmejl] ${ordrar.length} ordrar`, JSON.stringify(resultat));
  return NextResponse.json({ ok: true, ordrar: ordrar.length, resultat });
}
