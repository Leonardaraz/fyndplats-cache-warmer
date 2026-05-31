// GET    /api/admin/bulk-import/[jobId] — full status (job + items + ETA).
// DELETE /api/admin/bulk-import/[jobId] — stoppa pågående jobb.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getJobWithItems, stopBulkImportJob } from "@/lib/bulk-import/service";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function GET(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const { jobId } = await ctx.params;
  const data = await getJobWithItems(jobId);
  if (!data) {
    return NextResponse.json({ error: "Jobbet hittades inte" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...data });
}

export async function DELETE(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const { jobId } = await ctx.params;
  try {
    const job = await stopBulkImportJob(jobId, "Stoppat manuellt från admin-UI:t");
    await audit("bulk-import-job-stopped", jobId, `succ=${job.succeeded} fail=${job.failed}`);
    return NextResponse.json({ ok: true, job });
  } catch (err) {
    return NextResponse.json(
      { error: "Kunde inte stoppa jobbet", message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
