// app/api/cron/pris-snapshot/route.ts
// Vercel Cron entry: GET /api/cron/pris-snapshot
// Schedule: "30 2 * * *" (02:30 UTC dagligen — se vercel.json).
//
// Varför 02:30: efter midnatt i svensk tid oavsett sommar- eller vintertid, och
// före order-sync (04:00) och morgonmejlet (06:00) så dygnets rader finns när
// dashboarden läser. Dagen bestäms av Europe/Stockholm i lib/price-snapshot.ts,
// inte av serverns UTC-dygn.
//
// Vad: skriver en rad per produkt med dagens faktiskt tillämpade pris, så att
// 7 a § prisinformationslagen går att uppfylla. Uppgiften finns inte i Wix —
// den måste mätas, och mätningen blir användbar först efter 30 dagar. Cronet
// ska alltså köra långt innan något överstruket pris byter grund.
//
// Idempotent: kör det två gånger samma dag skrivs samma rad igen, inte en till.
//
// Auth: Vercel Cron skickar "Authorization: Bearer $CRON_SECRET". Saknas
// CRON_SECRET i miljön släpper vi igenom (samma mönster som övriga cron-routes).

import { NextResponse } from "next/server";
import { runMigration } from "@/lib/db";
import { skrivDagensPriser } from "@/lib/price-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorised(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true; // dev fallback
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }

  // Säkerställ tabellen (idempotent migration) — samma mönster som
  // trustpilot-invite. Utan den här raden hade cronet krävt att någon manuellt
  // körde /api/admin/run-job först, och ett snapshot som inte kör är en lucka
  // som kostar 30 dagar att laga.
  try {
    await runMigration();
  } catch (e) {
    console.error("[pris-snapshot] migration failed", (e as Error).message);
  }

  const resultat = await skrivDagensPriser();
  console.log("[pris-snapshot]", resultat);
  return NextResponse.json(resultat, { status: resultat.ok ? 200 : 502 });
}
