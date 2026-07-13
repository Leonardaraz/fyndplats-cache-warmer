// GET /api/admin/freight-check?productId=<wixProductId|aliexpressId>[&apply=1]
//
// Manuell fraktbarhetskontroll för EN produkt: matchar mappningens varianter
// mot AliExpress SKU:er, frågar fraktAPI:t om varje variants fraktväg till
// Sverige och returnerar per-variant-detaljer (inkl. vilken API-metod som
// svarade och rå-diagnos vid oväntade svar) — verktyget för att verifiera
// kontrollen skarpt och felsöka enskilda produkter.
//
// Utan apply är anropet HELT läsande. Med apply=1 sparas domarna på
// mappningen och ofraktbara varianters Wix-lager nollas direkt.
//
// Auth: CRON_SECRET (Bearer) eller x-fyndplats-token — samma som övriga
// admin-/cron-rutter. Triggas normalt via GitHub-workflown freight-check.yml.

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { getProduct as getAliExpressProduct, queryFreightToCountry } from "@/lib/aliexpress/client";
import { checkMappingShippability, zeroUnshippableInventory } from "@/lib/sync/shippability";

export const runtime = "nodejs";
export const maxDuration = 120;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const id = (req.nextUrl.searchParams.get("productId") || "").trim();
  const apply = req.nextUrl.searchParams.get("apply") === "1";
  if (!id) {
    return NextResponse.json({ error: "productId krävs (wixProductId eller AliExpress-id)." }, { status: 400 });
  }

  try {
    const store = getStore();
    let mapping = await store.getMappingByWixProductId(id);
    if (!mapping) {
      // Slå upp via AliExpress-id (praktiskt när man står på AE-sidan).
      const all = await store.listMappings();
      mapping = all.find((m) => m.supplierProductId === id) ?? null;
    }
    if (!mapping) {
      return NextResponse.json({ error: `Ingen mappning för ${id}.` }, { status: 404 });
    }

    const product = await getAliExpressProduct(mapping.supplierProductId);
    const aeVariants = product.variants
      .filter((v) => v.skuId)
      .map((v) => ({ skuId: String(v.skuId), skuAttr: v.skuAttr, skuProps: v.skuProps ?? {} }));

    const check = await checkMappingShippability({
      mapping: {
        supplierProductId: mapping.supplierProductId,
        // Tvinga omkontroll av ALLA varianter i debug-läget (nollställ stämpeln).
        variants: mapping.variants.map((v) => ({ ...v, shippabilityCheckedAt: undefined })),
      },
      aeVariants,
      nowMs: Date.now(),
      budget: { remaining: mapping.variants.length },
      queryFn: (productId, skuId) => queryFreightToCountry(productId, skuId, "SE", 1),
    });

    let applied: { mappingSaved: boolean; inventoryZeroed: number } | undefined;
    if (apply) {
      mapping.variants = check.variants;
      await store.saveMapping(mapping);
      const inventoryZeroed = await zeroUnshippableInventory(mapping.wixProductId, check.variants);
      applied = { mappingSaved: true, inventoryZeroed };
    }

    return NextResponse.json({
      ok: true,
      wixProductId: mapping.wixProductId,
      aliexpressId: mapping.supplierProductId,
      apiCalls: check.apiCalls,
      unshippable: check.unshippable,
      applied,
      variants: check.details,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg.slice(0, 400) }, { status: 500 });
  }
}
