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
import {
  getProduct as getAliExpressProduct,
  queryFreightToCountry,
  debugRawProductGet,
} from "@/lib/aliexpress/client";
import { checkMappingShippability, SHIP_FROM_FAILOVER_MAX, zeroUnshippableInventory } from "@/lib/sync/shippability";
import { isAliExpressMapping } from "@/lib/store/supplier";

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
  const raw = req.nextUrl.searchParams.get("raw") === "1";
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

    if (!isAliExpressMapping(mapping)) {
      return NextResponse.json(
        {
          error:
            `${mapping.wixProductId} kommer inte från AliExpress — fraktkontrollen `
            + "gäller bara AE-listningar. Aosom-frakt står i feedens SE Ship Fee.",
        },
        { status: 400 },
      );
    }

    const product = await getAliExpressProduct(mapping.supplierProductId);
    // stock + shipFrom följer med så lager-failovern kan prioritera samma sätt
    // som synken gör (lager med saldo först, EU före icke-EU).
    const aeVariants = product.variants
      .filter((v) => v.skuId)
      .map((v) => ({
        skuId: String(v.skuId),
        skuAttr: v.skuAttr,
        skuProps: v.skuProps ?? {},
        stock: v.stock,
        shipFrom: v.shipFrom,
      }));

    // Lager-diagnos (SucceBuy-utredningen 2026-07-14): synken läste lager 0 på
    // levande, köpbara produkter. Dumpa hur dropship-API:t FAKTISKT rapporterar
    // lager + warehouse per SKU så vi kan skilja "verkligt 0" från "vi tappar
    // EU-lagrets SKU". `product`-summeringen är alltid med; hela råsvaret bara
    // med raw=1 (kan vara stort).
    const productSummary = {
      title: product.title,
      shipsFromCountries: product.shipsFromCountries,
      hasEuWarehouse: product.hasEuWarehouse,
      totalStock: product.variants.reduce((s, v) => s + (v.stock ?? 0), 0),
      variantCount: product.variants.length,
      variants: product.variants.map((v) => ({
        skuId: v.skuId,
        skuAttr: v.skuAttr,
        stock: v.stock,
        price: v.price,
        shipFrom: v.shipFrom,
        skuProps: v.skuProps,
      })),
    };
    const rawProduct = raw ? await debugRawProductGet(mapping.supplierProductId) : undefined;

    const check = await checkMappingShippability({
      mapping: {
        supplierProductId: mapping.supplierProductId,
        // Tvinga omkontroll av ALLA varianter i debug-läget (nollställ stämpeln).
        variants: mapping.variants.map((v) => ({ ...v, shippabilityCheckedAt: undefined })),
      },
      aeVariants,
      nowMs: Date.now(),
      // Plats för failoverns extra anrop. Med bara en per variant kunde
      // debug-rutten aldrig prova de andra lagren — och för en produkt med EN
      // variant (stödbenen) hade den rapporterat samma nej som synken utan att
      // ens titta åt ES/FR/CZ/PL. Det är precis den frågan man öppnar rutten för.
      // Taket håller rutten inom sin maxDuration (600 ms paus per anrop).
      budget: { remaining: Math.min(mapping.variants.length * (1 + SHIP_FROM_FAILOVER_MAX), 40) },
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
      product: productSummary,
      apiCalls: check.apiCalls,
      unshippable: check.unshippable,
      applied,
      variants: check.details,
      ...(rawProduct !== undefined ? { rawProduct } : {}),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg.slice(0, 400) }, { status: 500 });
  }
}
