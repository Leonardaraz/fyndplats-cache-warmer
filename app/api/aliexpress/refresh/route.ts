// POST /api/aliexpress/refresh
//
// Triggad av GitHub Actions var 12:e timme (.github/workflows/refresh-tokens.yml)
// — Vercel Hobby tillåter inte hourly cron-schemaläggning så vi använder
// samma external-cron-pattern som /api/cron/poll-tracking.
//
// Authentication: caller skickar `Authorization: Bearer <CRON_SECRET>` och vi
// jämför med env-varen via timing-safe equal.
//
// Logik:
//   1. Validera secret
//   2. Läs nuvarande tokens från store
//   3. Om access_token har mer än REFRESH_SKIP_THRESHOLD_MS kvar → skip
//      (sparar API-anrop). Tröskeln MÅSTE vara större än schemaintervallet —
//      se kommentaren vid konstanten.
//   4. Annars → refreshAndPersist via signed RPC /auth/token/refresh
//   5. Returnera status + new expiresAt

import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { refreshAndPersist } from "@/lib/aliexpress/client";
import { getStore } from "@/lib/store/factory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ☠️ FÖNSTRET MÅSTE VARA STÖRRE ÄN SCHEMAT. Det var det inte, och det kostade
// en tyst produktionsincident (2026-08-29).
//
// Gamla värdet var 2 h, med motiveringen att access_token lever "~48h".
// Uppmätt på den riktiga token: den lever **30 dygn** (förnyad 2026-07-30,
// utgången 2026-08-29T02:37). Livstiden spelar dock ingen roll för buggen —
// schemat gör det. Workflowen kör var 12:e timme och rutten hoppade över så
// länge mer än 2 h återstod, så en körning måste råka landa i de SISTA två
// timmarna för att förnya något alls. Sannolikheten är 2/12: fyra gånger av
// fem hinner token dö emellan.
//
// Så gick det också till. Körningen 2026-08-28 21:53 såg 4,7 h kvar och
// hoppade över. Token dog 02:37. Nästa körning låg 09:53 — sju timmar senare.
// Under tiden svarade VARENDA AliExpress-anrop `IllegalAccessToken` och synken
// fick 99 fel av 106 försök, medan workflowen rapporterade "success" hela
// vägen: den kollar bara HTTP-statusen, och ett hoppat över ÄR 200.
//
// 24 h är därför inte "lite marginal" — det är regeln: fönstret ska rymma
// minst två schemalagda körningar (12 h × 2), så en missad körning inte kan
// leda till en utgången token. Ändras schemat måste det här talet följa med.
const REFRESH_SKIP_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization") ?? "";
  if (!expected) return false;
  const expectedHeader = `Bearer ${expected}`;
  const a = Buffer.from(expectedHeader);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const store = getStore();
  const current = await store.getAliExpressTokens();
  if (!current) {
    return NextResponse.json(
      {
        error: "no_tokens_in_store",
        hint: "Kör initial OAuth via /api/aliexpress/auth.",
      },
      { status: 412 },
    );
  }

  const remainingMs = current.expiresAt.getTime() - Date.now();
  if (remainingMs > REFRESH_SKIP_THRESHOLD_MS) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "token_still_valid",
      expiresAt: current.expiresAt.toISOString(),
      remainingMs,
    });
  }

  try {
    const fresh = await refreshAndPersist();
    await store.appendAudit({
      at: new Date().toISOString(),
      kind: "aliexpress-token-refreshed",
      detail: `expiresAt=${fresh.expiresAt.toISOString()}`,
    });
    return NextResponse.json({
      ok: true,
      refreshed: true,
      newExpiresAt: fresh.expiresAt.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "refresh-fel";
    console.error("[refresh] failed:", message);
    return NextResponse.json(
      { error: "refresh_failed", message },
      { status: 500 },
    );
  }
}
