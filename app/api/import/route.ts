import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { pricingConfigFromEnv } from "@/lib/config";
import { importProduct } from "@/lib/import/pipeline";
import type { AliExpressProduct } from "@/lib/import/types";
import { getMemoryStore } from "@/lib/store/memory";
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
    await getMemoryStore().saveMapping({
      supplierProductId: result.supplierProductId,
      wixProductId: result.wixProductId,
      variants: result.variantMappings,
    });
    await audit("import", result.wixProductId, result.seo.title);
    return NextResponse.json({ ok: true, result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Import misslyckades", message }, { status: 500 });
  }
}
