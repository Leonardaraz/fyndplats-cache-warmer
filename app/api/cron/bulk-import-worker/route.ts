// POST/GET /api/cron/bulk-import-worker
//
// Körs varje minut av Vercel Cron. Drar upp till 10 pending-items från aktiva
// bulk-import-jobb och processar dem (1 item / 3 s, AliExpress rate-limit).
//
// Säkerhet:
//   - Cron Bearer-token ELLER x-fyndplats-token för manuell trigger.
//   - STORE_BACKEND=memory → no-op (samma policy som aliexpress-sync-cronen).

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { runBulkImportWorker } from "@/lib/bulk-import/worker";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const backend = process.env.STORE_BACKEND ?? "memory";
  if (backend === "memory") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "STORE_BACKEND=memory — bulk-import-cronen kräver persistent store",
    });
  }

  try {
    const result = await runBulkImportWorker({ maxItems: 10, budgetMs: 50_000 });
    if (result.itemsProcessed > 0) {
      await audit(
        "bulk-import-worker-tick",
        "cron",
        `proc=${result.itemsProcessed} ok=${result.itemsSucceeded} fail=${result.itemsFailed} retry=${result.itemsRetried}`,
      );
    }
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await audit("bulk-import-worker-error", "cron", msg.slice(0, 300));
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}
