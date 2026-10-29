// GET /api/cron/retention
//
// Loggstädningen, en gång per dygn (vercel.json). Raderar synkloggens,
// auditens och LLM-statistikens rader äldre än sina fönster (lib/retention.ts).
// Varje steg är ett asynkront Wix-jobb som inte gör något när inget matchar.
// Varför städningen har en egen cron står i lib/retention-korning.ts.
//
// Svarar 500 när ett steg föll, så att felet syns i Vercels loggar. De andra
// stegen har körts ändå.
//
// Auth: Vercel cron Bearer-token ELLER x-fyndplats-token (manuell körning).

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getSyncStore } from "@/lib/sync/sync-log";
import { getStore } from "@/lib/store/factory";
import { LLM_COLLECTIONS, llmPruneOlderThan } from "@/lib/llm/storage";
import { isPersistentBackend } from "@/lib/store/backend";
import { korRetention, type RetentionDeps } from "@/lib/retention-korning";

export const runtime = "nodejs";
export const maxDuration = 60;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

const liveDeps: RetentionDeps = {
  synklogg: (dagar, nuMs) => getSyncStore().pruneLogOlderThan(dagar, nuMs),
  audit: (dagar, nuMs) => getStore().pruneAuditOlderThan(dagar, nuMs),
  llmStatistik: (dagar, nuMs) => llmPruneOlderThan(LLM_COLLECTIONS.stats, dagar, nuMs),
};

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  if (!isPersistentBackend()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "STORE_BACKEND=memory — städningen kräver persistent store",
    });
  }

  const steg = await korRetention(liveDeps);
  const ok = steg.every((s) => s.ok);
  console[ok ? "log" : "error"](
    `[retention] ${steg
      .map((s) => `${s.namn} (>${s.dagar} dygn): ${s.ok ? s.svar || "startad" : `FEL ${s.svar}`}`)
      .join(" · ")}`,
  );
  return NextResponse.json({ ok, steg }, { status: ok ? 200 : 500 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}
