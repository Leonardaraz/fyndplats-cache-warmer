import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { pricingConfigFromEnv } from "@/lib/config";
import { importProduct } from "@/lib/import/pipeline";
import type { AliExpressProduct } from "@/lib/import/types";
import { getStore } from "@/lib/store/factory";
import { getImportCostStore } from "@/lib/store/import-costs";
import { audit } from "@/lib/audit";

const VariantSchema = z.object({
  supplierVariantId: z.string().min(1),
  options: z.record(z.string()),
  costUsd: z.number().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  included: z.boolean(),
});

const ProductSchema = z.object({
  supplierProductId: z.string().min(1),
  sourceUrl: z.string().url(),
  rawTitle: z.string().min(1),
  rawDescription: z.string(),
  imageUrls: z.array(z.string().url()),
  variants: z.array(VariantSchema).min(1),
  // Färgkoder samplade från produktbilden: { [optionName]: { [choiceName]: "#hex" } }.
  optionColorCodes: z.record(z.record(z.string())).optional(),
});

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valideringsfel", details: parsed.error.flatten() }, { status: 422 });
  }

  const { optionColorCodes, ...product } = parsed.data;

  try {
    const result = await importProduct(product as AliExpressProduct, pricingConfigFromEnv(), optionColorCodes);
    const draftStatus = process.env.IMPORT_DRAFT_DEFAULT === "false" ? "published" : "pending_review";
    await getStore().saveMapping({
      supplierProductId: result.supplierProductId,
      wixProductId: result.wixProductId,
      variants: result.variantMappings,
      draftStatus,
      createdAt: new Date().toISOString(),
      seoTitle: result.seo.title,
      sourceUrl: parsed.data.sourceUrl,
      imageAnalysis: result.imageAnalysis,
      categorySuggestion: result.categorySuggestion,
    });
    // Skriv även en cost-rad till FyndplatsImportCosts så /admin/profitability
    // har en kanonisk inköpsdata-källa (utöver mappnings-tabellen). Best-effort
    // — om kollektionen inte finns ännu eller skrivningen failar ska importen
    // inte avbrytas; logga bara och fortsätt.
    try {
      const variants = result.variantMappings;
      const avgCostSek = variants.length > 0
        ? variants.reduce((s, v) => s + (v.landedCostSek ?? 0), 0) / variants.length
        : 0;
      const avgCostUsd = variants.length > 0
        ? variants.reduce((s, v) => s + (v.costUsd ?? 0), 0) / variants.length
        : 0;
      if (avgCostSek > 0) {
        await getImportCostStore().upsert({
          productId: result.wixProductId,
          costSek: Math.round(avgCostSek * 100) / 100,
          costUsd: avgCostUsd || undefined,
          currency: "SEK",
          importedAt: new Date().toISOString(),
          source: "aliexpress",
        });
      }
    } catch (costErr) {
      console.warn(
        "[import] FyndplatsImportCosts.upsert failade (icke-fatalt):",
        costErr instanceof Error ? costErr.message : costErr,
      );
    }

    await audit(
      draftStatus === "pending_review" ? "import-pending" : "import",
      result.wixProductId,
      result.seo.title,
    );
    return NextResponse.json(
      {
        ok: true,
        result,
        draftStatus,
        // Bekvämligheter på toppnivå för smoke-tester och extension-UI.
        image_analysis: result.imageAnalysis,
        suggested_category: result.categorySuggestion,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Import misslyckades", message }, { status: 500 });
  }
}
