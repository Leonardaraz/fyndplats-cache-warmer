// POST /api/aliexpress/sync-all
// Hämtar lager + pris för ALLA mappade produkter direkt via DS API (server-side).
// Kräver inte att tillägget besöker varje sida — fungerar som ett schemalagt jobb.
//
// Kör från admin med ett klick, eller via cron (t.ex. Vercel Cron):
//   curl -X POST https://<host>/api/aliexpress/sync-all \
//     -H "x-fyndplats-token: <TOKEN>"
//
// Svar: { synced: N, alerts: [...], errors: [...] }

import { type NextRequest, NextResponse } from "next/server";
import { getInventory } from "@/lib/aliexpress/client";
import { checkToken } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { pricingConfigFromEnv } from "@/lib/config";
import { evaluatePriceChange } from "@/lib/sync/price-watch";
import { syncProductStock } from "@/lib/sync/inventory";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
// Tillåt längre körtid för batch-synk (Vercel Pro: 300 s, Hobby: 10 s).
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const authErr = checkToken(req);
  if (authErr) return authErr;

  const store = getStore();
  const mappings = await store.listMappings();

  if (mappings.length === 0) {
    return NextResponse.json({ synced: 0, alerts: [], errors: [], message: "Inga mappade produkter hittades." });
  }

  const pricing = pricingConfigFromEnv();
  const thresholdPercent = 10;
  const autoAdjust = process.env.AUTO_ADJUST_PRICE === "true";

  const alerts: unknown[] = [];
  const errors: string[] = [];
  let synced = 0;

  for (const mapping of mappings) {
    try {
      // Hämta aktuellt lager + pris per variant från DS API.
      const inventory = await getInventory(mapping.supplierProductId);

      // Bygg desired-stock baserat på variant-mappning (SKU → wixVariantId).
      const desired = inventory
        .map((inv) => {
          const vm = mapping.variants.find((v) => {
            // DS API returnerar skuId; vår mappning har supplierVariantId.
            return v.supplierVariantId === inv.skuId;
          });
          if (!vm?.wixVariantId) return null;

          // Prisbevakning.
          if (vm.costUsd && vm.costUsd !== inv.price) {
            const pw = evaluatePriceChange(vm.costUsd, inv.price, pricing, {
              thresholdPercent,
              autoAdjust,
            });
            if (pw.flagged || pw.newGrossSek !== undefined) {
              alerts.push({ wixVariantId: vm.wixVariantId, ...pw });
              if (pw.flagged) {
                void audit("price-alert", vm.wixVariantId, `+${pw.percentChange}% — kräver åtgärd`);
              } else if (pw.newGrossSek) {
                void audit("price-adjust", vm.wixVariantId, `nytt pris ${pw.newGrossSek} kr`);
              }
            }
          }

          return { wixVariantId: vm.wixVariantId, quantity: inv.stock };
        })
        .filter((d): d is { wixVariantId: string; quantity: number } => Boolean(d));

      if (desired.length > 0) {
        await syncProductStock(mapping.wixProductId, desired);
        synced++;
      }
    } catch (err) {
      const msg = `${mapping.supplierProductId}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      void audit("sync-error", mapping.wixProductId, msg);
    }
  }

  return NextResponse.json({ synced, total: mappings.length, alerts, errors });
}
