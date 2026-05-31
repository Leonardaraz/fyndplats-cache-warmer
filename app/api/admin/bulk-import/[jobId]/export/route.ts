// GET /api/admin/bulk-import/[jobId]/export — laddar ner resultat-CSV.
//
// Innehåller original-fälten + import_status, wix_product_id, queue_url, error.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getJobWithItems } from "@/lib/bulk-import/service";
import { buildResultCsv, type ResultRow } from "@/lib/bulk-import/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

function isAuthorizedExport(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.EXTENSION_API_TOKEN;
  if (!token || !expected) return false;
  return token === expected;
}

function publicBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!env) return "https://fyndplats-cache-warmer.vercel.app";
  return env.startsWith("http") ? env : `https://${env}`;
}

export async function GET(req: NextRequest, ctx: RouteContext): Promise<Response> {
  if (!isAuthorizedExport(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const { jobId } = await ctx.params;
  const data = await getJobWithItems(jobId);
  if (!data) {
    return NextResponse.json({ error: "Jobbet hittades inte" }, { status: 404 });
  }

  const base = publicBaseUrl().replace(/\/$/, "");
  const rows: ResultRow[] = data.items.map((it) => ({
    row_index: it.rowIndex,
    aliexpress_url: it.aliexpressUrl,
    wix_collection_slug: it.collectionSlug,
    target_price_sek: it.targetPriceSek,
    notes: it.notes,
    import_status: it.status,
    wix_product_id: it.wixProductId,
    queue_url: it.wixProductId ? `${base}/admin/queue#${it.wixProductId}` : undefined,
    error: it.error,
  }));

  const csv = buildResultCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bulk-import-${jobId}.csv"`,
    },
  });
}
