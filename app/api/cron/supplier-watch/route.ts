// POST/GET /api/cron/supplier-watch
//
// Bevakar nya produkter hos våra stora AliExpress-säljare (Aosom, SucceBuy …)
// och köar matchningar för auto-import som RAW drafts i /admin/queue. Inget
// publiceras automatiskt — samma säkra flöde som all annan import.
//
// Schema: en gång/dygn (se vercel.json). Rotationen i lib/discover täcker hela
// termlistan över några dagar, så en daglig körning räcker.
//
// Säkerhet:
//   - SUPPLIER_WATCH_DRY_RUN != "false" (default) → rapporterar men köar inget.
//   - Auth: Vercel cron Bearer (CRON_SECRET) ELLER x-fyndplats-token (manuell).
//   - STORE_BACKEND=memory hoppas över (listMappings vore meningslös där).
//   - Hårt cap:ade API-anrop per körning (lib/discover-konfigen).

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { getProduct, searchAliExpressByText } from "@/lib/aliexpress/client";
import {
  listFreshSeen,
  saveSeenBatch,
  type SupplierWatchSeenRecord,
} from "@/lib/store/supplier-watch-seen";
import {
  runSupplierWatch,
  supplierWatchConfigFromEnv,
  type SupplierWatchDeps,
  type SupplierWatchMatch,
  type SupplierWatchSummary,
} from "@/lib/discover/supplier-watch";
import { createBulkImportJob, BulkImportLimitError } from "@/lib/bulk-import/service";
import type { ParsedCsv } from "@/lib/bulk-import/csv";
import { buildSupplierWatchEmail, sendEmail } from "@/lib/email/resend";

export const runtime = "nodejs";
export const maxDuration = 300;

const SEARCH_PAGE_SIZE = Number(process.env.SUPPLIER_WATCH_SEARCH_PAGE_SIZE) || 30;
const WATCH_CREATED_BY = "supplier-watch";

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

/** Bygger en syntetisk ParsedCsv ur matchningarna → återanvänder bulk-importen. */
function matchesToCsv(matches: SupplierWatchMatch[]): ParsedCsv {
  return {
    totalRows: matches.length,
    errors: [],
    rows: matches.map((m, i) => ({
      rowIndex: i + 1,
      aliexpressUrl: m.sourceUrl,
      notes: `supplier-watch: ${m.storeName ?? m.storeId} · "${m.foundByTerm}"`,
      errors: [],
    })),
  };
}

function buildDeps(): SupplierWatchDeps {
  return {
    search: (term) => searchAliExpressByText(term, { pageSize: SEARCH_PAGE_SIZE, sortBy: "orders,desc" }),
    getDetail: (id) => getProduct(id),
    listExistingSupplierProductIds: async () => {
      const mappings = await getStore().listMappings();
      return new Set(mappings.map((m) => m.supplierProductId).filter(Boolean));
    },
    listSeen: (ttlDays) => listFreshSeen(ttlDays),
    saveSeen: (records: SupplierWatchSeenRecord[]) => saveSeenBatch(records),
    enqueue: async (matches) => {
      try {
        const { job, items } = await createBulkImportJob({
          csv: matchesToCsv(matches),
          createdBy: WATCH_CREATED_BY,
          notes: `Auto: supplier-watch ${new Date().toISOString().slice(0, 10)}`,
        });
        return { jobId: job.id, itemCount: items.length };
      } catch (err) {
        if (err instanceof BulkImportLimitError) {
          // concurrent_job/daily_cap är förväntade lägen — köa nästa körning.
          return { error: `${err.code}: ${err.message}` };
        }
        return { error: err instanceof Error ? err.message.slice(0, 200) : String(err) };
      }
    },
  };
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const backend = process.env.STORE_BACKEND ?? "memory";
  if (backend === "memory") {
    return NextResponse.json({ ok: true, skipped: true, reason: "STORE_BACKEND=memory" });
  }

  const config = supplierWatchConfigFromEnv();

  let summary: SupplierWatchSummary;
  try {
    summary = await runSupplierWatch(buildDeps(), config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await audit("supplier_watch_error", undefined, msg.slice(0, 400));
    return NextResponse.json({ ok: false, error: msg.slice(0, 400) }, { status: 500 });
  }

  await audit(
    "supplier_watch_run",
    summary.enqueue && "jobId" in summary.enqueue ? summary.enqueue.jobId : undefined,
    JSON.stringify({
      terms: summary.termsUsed,
      matches: summary.matches.length,
      detailCalls: summary.detailCalls,
      skipped: summary.skipped,
      dryRun: summary.dryRun,
    }).slice(0, 900),
  );

  // Mejla bara när det finns matchningar (ingen tom-rapport-spam).
  if (summary.matches.length > 0) {
    const to = process.env.OPS_ALERT_EMAIL;
    if (to) {
      const mail = buildSupplierWatchEmail(summary);
      try {
        await sendEmail({ to, subject: mail.subject, bodyHtml: mail.html, bodyText: mail.text });
      } catch (err) {
        console.warn("[supplier-watch] email failade:", err instanceof Error ? err.message : err);
      }
    }
  }

  return NextResponse.json({ ok: true, ...summary });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}

// Vercel Cron gör GET — stöd båda.
export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}
