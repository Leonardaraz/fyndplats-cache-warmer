// POST /api/mappings/create
//
// Skapar en AliExpress↔Wix produktmappning för en redan importerad Wix-produkt.
// Varianter paras på VÄRDESIGNATUR (delad hjälpare med admin-verktyget —
// destillatorn 2026-08-09); positionell parning bara som reserv för omatchade
// rader, räknad i svaret.
//
// Body: { wixProductId, aliexpressInput } där aliexpressInput är antingen
// en URL eller ett rent productId.

import { type NextRequest, NextResponse } from "next/server";
import { classifyWarehouses, hasAnyEuWarehouse, uniqueShipFromCodes } from "@/lib/aliexpress/eu-countries";
import { extractAliExpressProductId, getProduct } from "@/lib/aliexpress/client";
import { getV3ProductVariants } from "@/lib/wix/v3-products";
import { getStore } from "@/lib/store/factory";
import { isAuthorized } from "@/lib/auth";
import { pricingConfigFromEnv } from "@/lib/config";
import { pairVariantMappings } from "@/lib/import/pair-variant-mappings";

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

  const aeVariants = aeProduct.variants;
  const pricing = pricingConfigFromEnv();
  const { variants: variantMappings, matched, positional } = pairVariantMappings(
    wixVariants,
    aeVariants,
    pricing,
    supplierProductId,
  );

  const store = getStore();
  try {
    // SLÅ IHOP med befintlig rad, ersätt den inte. Wix items/save är en
    // HELERSÄTTNING och JSON.stringify tappar undefined, så ett objekt byggt
    // från grunden raderar allt som inte står i literalen: draftStatus,
    // needsAiPolish, priceUnverified, seoTitle, createdAt, reviewsCheckedAt,
    // priority... En rad utan draftStatus matchar dessutom VARKEN kön eller
    // "senast importerade" i /admin/queue — produkten försvinner ur admin helt.
    //
    // Det är särskilt farligt sedan prisspärren (2026-08-20): dess badge säger
    // "saknar riktiga SKU-id:n", vilket är precis vad som får en att gå hit och
    // mappa om produkten — och därmed radera flaggan som höll den osynlig.
    // Lagerländerna kommer från den NYA listningen, inte den gamla mappningen.
    const skeppasFrån = uniqueShipFromCodes(
      (aeVariants ?? []).map((v: { shipFrom?: string }) => v.shipFrom).filter(Boolean),
    );
    const befintlig = await store.getMappingByWixProductId(wixProductId);
    await store.saveMapping({
      ...(befintlig ?? {}),
      supplierProductId,
      wixProductId,
      variants: variantMappings,
      // PER-AE-LISTNING: hör till den GAMLA källan och skulle ljuga efter en
      // ommappning. Sammanslagningen ovan räddar det som beskriver WIX-produkten
      // (draftStatus, seoTitle, createdAt, imageAnalysis, priority) — men allt
      // som beskriver LISTNINGEN måste räknas om eller nollas, annars länkar
      // "Källa" till den gamla varan, EU-flaggan visar fel lager och sålda
      // enheter skrivs på fel säljare i säljar-scoren.
      sourceUrl: `https://www.aliexpress.com/item/${supplierProductId}.html`,
      shipsFromCountries: skeppasFrån,
      hasEuWarehouse: hasAnyEuWarehouse(skeppasFrån),
      warehouseClass: classifyWarehouses(skeppasFrån),
      supplierId: undefined,
      supplierName: undefined,
      reviewsCheckedAt: undefined,
      unresolvedVariantValues: undefined,
      // En lyckad ommappning parar mot riktiga DS-SKU:er med riktiga per-SKU-
      // priser — alltså precis det prisspärren saknade. Utan den här raden
      // fanns ingen väg alls att rensa flaggan: den sätts bara vid import, och
      // ommappningen var enda manuella vägen innan sammanslagningen infördes.
      priceUnverified: undefined,
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

  const warnings: string[] = [];
  if (positional > 0) {
    warnings.push(`${positional} variant(er) parades positionellt (ingen värdematch) — KONTROLLERA.`);
  }
  if (wixVariants.length !== aeVariants.length) {
    warnings.push(`Variant-antal skiljer sig (Wix: ${wixVariants.length}, AE: ${aeVariants.length}). Bara ${variantMappings.length} mappades.`);
  }
  return NextResponse.json({
    ok: true,
    wixProductId,
    supplierProductId,
    mappedVariants: variantMappings.length,
    valueMatched: matched,
    positional,
    wixVariantCount: wixVariants.length,
    aliexpressVariantCount: aeVariants.length,
    warning: warnings.length ? warnings.join(" ") : undefined,
  });
}
