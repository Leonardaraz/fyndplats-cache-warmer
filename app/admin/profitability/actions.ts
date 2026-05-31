"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { audit } from "@/lib/audit";
import { getImportCostStore, type ImportCostRecord } from "@/lib/store/import-costs";

/**
 * Tömmer 5-min-cachen så att Leonard tvingar omräkning (t.ex. efter han
 * fyllt på inköpsdata i Wix Data).
 */
export async function refreshProfitability(): Promise<void> {
  // Next 16: revalidateTag har bytt signatur — andra arget anger profil.
  revalidateTag("admin-profitability", "max");
  revalidatePath("/admin/profitability");
}

/**
 * Tar emot en CSV med kolumnerna: productId,costSek[,currency][,note]
 * Tolerant mot whitespace + trailing newlines. Sparas till FyndplatsImportCosts
 * (collection skapas inte automatiskt — operatorn måste lägga upp den i Wix
 * Data CMS, se docs).
 */
/**
 * Form action — Next 16 kräver void/Promise<void> som retur-typ för <form action>.
 * Resultatet skrivs istället till audit-loggen (synlig på /admin) och sidan
 * revalideras så att nya rader syns omedelbart.
 */
export async function uploadImportCostsCsv(formData: FormData): Promise<void> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    await audit("profitability-cost-upload", undefined, "ingen fil mottagen");
    return;
  }
  const text = await file.text();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    await audit("profitability-cost-upload", undefined, "csv tom");
    return;
  }
  // Stöd både header och header-lös; identifiera om första raden ser ut som header.
  const looksLikeHeader = /productid/i.test(lines[0]);
  const dataLines = looksLikeHeader ? lines.slice(1) : lines;

  const records: ImportCostRecord[] = [];
  const errors: string[] = [];
  const nowIso = new Date().toISOString();

  for (const [i, line] of dataLines.entries()) {
    const parts = line.split(",").map((p) => p.trim());
    const [productId, costSekStr, currency, note] = parts;
    if (!productId) {
      errors.push(`Rad ${i + 1}: tomt productId`);
      continue;
    }
    const costSek = Number(costSekStr);
    if (!Number.isFinite(costSek) || costSek <= 0) {
      errors.push(`Rad ${i + 1}: ogiltig costSek "${costSekStr}"`);
      continue;
    }
    records.push({
      productId,
      costSek,
      currency: (currency?.toUpperCase() as ImportCostRecord["currency"]) || "SEK",
      importedAt: nowIso,
      source: "csv-backfill",
      note: note || undefined,
    });
  }

  if (records.length === 0) {
    await audit(
      "profitability-cost-upload",
      undefined,
      `inga giltiga rader (${errors.slice(0, 3).join("; ")})`,
    );
    return;
  }

  const result = await getImportCostStore().upsertMany(records);
  await audit(
    "profitability-cost-upload",
    undefined,
    `saved=${result.saved} failed=${result.failed + errors.length}` +
      (result.errors.length ? ` (${result.errors.slice(0, 2).join("; ")})` : ""),
  );
  revalidateTag("admin-profitability", "max");
  revalidatePath("/admin/profitability");
}
