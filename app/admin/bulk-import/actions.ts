"use server";

import { revalidatePath } from "next/cache";
import { parseBulkImportCsv, CsvLimitsError, type ParsedCsv } from "@/lib/bulk-import/csv";
import {
  createBulkImportJob,
  stopBulkImportJob,
  BulkImportLimitError,
} from "@/lib/bulk-import/service";
import { audit } from "@/lib/audit";

export interface PreviewResult {
  ok: true;
  preview: ParsedCsv;
  validCount: number;
  invalidCount: number;
  byteSize: number;
}

export interface ActionError {
  ok: false;
  error: string;
  code?: string;
  details?: unknown;
}

export async function previewCsvAction(csvText: string): Promise<PreviewResult | ActionError> {
  if (!csvText.trim()) return { ok: false, error: "CSV-filen är tom" };
  try {
    const preview = parseBulkImportCsv(csvText);
    const validCount = preview.rows.filter((r) => r.errors.length === 0).length;
    const invalidCount = preview.rows.length - validCount;
    return {
      ok: true,
      preview,
      validCount,
      invalidCount,
      byteSize: Buffer.byteLength(csvText, "utf8"),
    };
  } catch (err) {
    if (err instanceof CsvLimitsError) {
      return { ok: false, error: err.message, code: err.limit };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function startBulkImportAction(csvText: string, notes?: string): Promise<{ ok: true; jobId: string } | ActionError> {
  if (!csvText.trim()) return { ok: false, error: "Tom CSV" };
  let parsed: ParsedCsv;
  try {
    parsed = parseBulkImportCsv(csvText);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  if (parsed.errors.length > 0) {
    return { ok: false, error: parsed.errors.join("; ") };
  }
  try {
    const created = await createBulkImportJob({
      csv: parsed,
      createdBy: "leonard",
      notes,
    });
    await audit(
      "bulk-import-job-created",
      created.job.id,
      `total=${created.job.totalRows} skipped=${created.skippedValidationCount}`,
    );
    revalidatePath("/admin/bulk-import");
    return { ok: true, jobId: created.job.id };
  } catch (err) {
    if (err instanceof BulkImportLimitError) {
      return { ok: false, error: err.message, code: err.code, details: err.details };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function stopJobAction(jobId: string): Promise<{ ok: true } | ActionError> {
  try {
    await stopBulkImportJob(jobId, "Stoppat manuellt från admin-UI:t");
    await audit("bulk-import-job-stopped-ui", jobId);
    revalidatePath("/admin/bulk-import");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
