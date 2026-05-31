// POST /api/admin/bulk-import — skapa ett bulk-import-jobb från en CSV-buffer.
// GET  /api/admin/bulk-import — lista senaste jobben (för UI:t).
//
// Skyddat med EXTENSION_API_TOKEN (samma som /api/import).
//
// Body (multipart eller JSON):
//   - csv: rå CSV-sträng
//   - createdBy?: string (default "leonard")
//   - notes?: string

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { parseBulkImportCsv, CsvLimitsError } from "@/lib/bulk-import/csv";
import { createBulkImportJob, BulkImportLimitError } from "@/lib/bulk-import/service";
import { getBulkImportStore } from "@/lib/bulk-import/store";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const store = getBulkImportStore();
  const jobs = await store.listJobs(50);
  return NextResponse.json({ ok: true, jobs });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  let csvText = "";
  let createdBy: string | undefined;
  let notes: string | undefined;

  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (file instanceof File) {
        csvText = await file.text();
      }
      const cb = form.get("createdBy");
      if (typeof cb === "string") createdBy = cb;
      const n = form.get("notes");
      if (typeof n === "string") notes = n;
    } else {
      const body = (await req.json()) as { csv?: string; createdBy?: string; notes?: string };
      csvText = body.csv ?? "";
      createdBy = body.createdBy;
      notes = body.notes;
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Kunde inte läsa request-body", message: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  if (!csvText.trim()) {
    return NextResponse.json({ error: "Tom CSV" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseBulkImportCsv(csvText);
  } catch (err) {
    if (err instanceof CsvLimitsError) {
      return NextResponse.json({ error: "Filstorleksgräns", message: err.message }, { status: 413 });
    }
    return NextResponse.json(
      { error: "CSV-parse misslyckades", message: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: "CSV-fel", details: parsed.errors }, { status: 422 });
  }

  try {
    const created = await createBulkImportJob({ csv: parsed, createdBy, notes });
    await audit(
      "bulk-import-job-created",
      created.job.id,
      `total=${created.job.totalRows} skipped=${created.skippedValidationCount}`,
    );
    return NextResponse.json(
      { ok: true, job: created.job, skippedValidationCount: created.skippedValidationCount },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof BulkImportLimitError) {
      const status = err.code === "concurrent_job" ? 409
        : err.code === "daily_cap" ? 429
        : 422;
      return NextResponse.json({ error: err.code, message: err.message, details: err.details }, { status });
    }
    return NextResponse.json(
      { error: "Kunde inte skapa jobb", message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
