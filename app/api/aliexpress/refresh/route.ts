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
//   3. Om access_token har >2h kvar → skip (sparar API-anrop mot AliExpress)
//   4. Annars → refreshAndPersist via signed RPC /auth/token/refresh
//   5. Returnera status + new expiresAt

import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { refreshAndPersist } from "@/lib/aliexpress/client";
import { getStore } from "@/lib/store/factory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pre-emptive skip-fönster: om token har mer kvar än så ska cron inte
// refresha. AliExpress access_token har ~48h livstid; med cron var 12:e
// timme refreshar vi då ungefär en gång per 36h (när vi går under 2h kvar).
const REFRESH_SKIP_THRESHOLD_MS = 2 * 60 * 60 * 1000;

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
