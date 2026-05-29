// POST /api/mappings/create
//
// Skapar en AliExpress↔Wix produktmappning för en redan importerad Wix-produkt.
// Matchar varianter POSITIONELLT (Wix-variant[0] ↔ AE-variant[0]).
//
// Body: { wixProductId, aliexpressInput } där aliexpressInput är antingen
// en URL eller ett rent productId.

import { type NextRequest, NextResponse } from "next/server";
import { extractAliExpressProductId, getProduct } from "@/lib/aliexpress/client";
import { getV3ProductVariants } from "@/lib/wix/v3-products";
import { getStore } from "@/lib/store/factory";
import { isAuthorized } from "@/lib/auth";
import { pricingConfigFromEnv } from "@/lib/config";
import { computePrice } from "@/lib/import/pricing";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  let body: { wixProductId?: string; aliexpressInput?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const wixProductId = body.wixProductId?.trim();
  const aliexpressInput = body.aliexpressInput?.trim();
  if (!wixProductId || !aliexpressInput) {
    return NextResponse.json(
      { error: "wixProductId och aliexpressInput krävs" },
      { status: 400 },
    );
  }

  const supplierProductId = extractAliExpressProductId(aliexpressInput);
  if (!supplierProductId) {
    return NextResponse.json(
      { error: "Kunde inte hitta AliExpress-produktID i input. Förväntad URL som /item/1234567890.html eller rent ID." },
      { status: 400 },
    );
  }

  // Hämta båda produkternas varianter parallellt.
  let wixVariants;
  let aeProduct;
  try {
    [wixVariants, aeProduct] = await Promise.all([
      getV3ProductVariants(wixProductId),
      getProduct(supplierProductId),
    ]);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fetch-fel" },
      { status: 502 },
    );
  }

  // Positionell mappning. Om antalet skiljer sig flaggar vi men sparar ändå
  // det överlappande sortimentet.
  const aeVariants = aeProduct.variants;
  const pairCount = Math.min(wixVariants.length, aeVariants.length);
  const pricing = pricingConfigFromEnv();
  const variantMappings = Array.from({ length: pairCount }, (_, i) => {
    const wv = wixVariants[i];
    const av = aeVariants[i];
    const breakdown = computePrice(av.price, pricing);
    return {
      supplierVariantId: av.skuId,
      sku: wv.sku || `${supplierProductId}-${i}`,
      wixVariantId: wv.id,
      choices: wv.choices,
      costUsd: av.price,
      landedCostSek: breakdown.costSek,
      grossSek: breakdown.grossSek,
    };
  });

  const store = getStore();
  try {
    await store.saveMapping({
      supplierProductId,
      wixProductId,
      variants: variantMappings,
    });
    await store.appendAudit({
      at: new Date().toISOString(),
      kind: "mapping-created",
      ref: wixProductId,
      detail: `supplierProductId=${supplierProductId} variants=${variantMappings.length}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save-fel" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    wixProductId,
    supplierProductId,
    mappedVariants: variantMappings.length,
    wixVariantCount: wixVariants.length,
    aliexpressVariantCount: aeVariants.length,
    warning: wixVariants.length !== aeVariants.length
      ? `Variant-antal skiljer sig (Wix: ${wixVariants.length}, AE: ${aeVariants.length}). Bara ${pairCount} mappades.`
      : undefined,
  });
}
