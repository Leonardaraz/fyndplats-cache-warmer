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
import { syncProductStock, buildDesiredStock } from "@/lib/sync/inventory";
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
      const svar = await getInventory(mapping.supplierProductId);
      const inventory = svar.variants;

      // NEDTAGEN LISTNING (audit 2026-08-24). Den här rutten är en ANDRA
      // synkväg vid sidan av /api/cron/aliexpress-sync, och den saknade
      // hyllstatuskollen helt — en nedtagen listning svarar 200 med saldot
      // fruset på sista kända värdet, så rutten speglade tillbaka lager för
      // något ingen kunde köpa och upphävde spärren i synken.
      //
      // Här nollas lagret DIREKT i stället för att gå via strike-räkning:
      // rutten körs manuellt/på begäran och har inget state att räkna strikes
      // i. Den fäller aldrig ett eget domslut på tveksamt underlag — bara ett
      // UTTRYCKLIGT "offline" räknas, `unknown` passerar som förut.
      if (svar.listingAvailability === "offline") {
        const orsak = svar.offlineReason ? ` (${svar.offlineReason})` : "";
        // Byggs explicit i stället för via buildDesiredStock(variants, []):
        // den funktionens kontrakt säger uttryckligen att ett TOMT AE-svar är
        // transient och ska hoppas över. Här är noll inte ett tomt svar utan en
        // dom, och att låna en funktion vars dokumentation säger motsatsen är
        // hur nästa läsare drar fel slutsats.
        const desired = mapping.variants
          .filter((v) => v.wixVariantId)
          .map((v) => ({ wixVariantId: v.wixVariantId as string, quantity: 0 }));
        if (desired.length > 0) {
          await syncProductStock(mapping.wixProductId, desired);
          synced++;
        }
        errors.push(`${mapping.supplierProductId}: listningen är nedtagen${orsak} — lagret nollat`);
        void audit("sync-listing-offline", mapping.wixProductId, `nedtagen listning${orsak} — lagret nollat`);
        continue;
      }

      // Tomt/degraderat svar → rör INTE lagret (annars skulle ett partiellt
      // svar lämna allt orört, eller nolla fel). Hoppa över och försök nästa körning.
      if (inventory.length === 0) {
        errors.push(`${mapping.supplierProductId}: tomt lager-svar — hoppar över (rör inte lagret)`);
        void audit("sync-skip", mapping.wixProductId, "tomt AliExpress-lager-svar");
        continue;
      }

      // Matchar NÅGON mappad variant svaret? Om ingen gör det (helt inaktuell
      // mappning) hoppar vi över — annars skulle seed-zero nolla hela produkten
      // (falsk mass-OOS) på ett svar som egentligen inte gäller våra varianter.
      const bySupplier = new Map(inventory.map((inv) => [inv.skuId, inv]));
      const anyMatch = mapping.variants.some(
        (v) => v.wixVariantId && bySupplier.has(v.supplierVariantId),
      );
      if (!anyMatch) {
        errors.push(`${mapping.supplierProductId}: ingen variant matchar mappningen — hoppar över`);
        void audit("sync-skip", mapping.wixProductId, "ingen variant-match (inaktuell mappning?)");
        continue;
      }

      // Prisbevakning per variant som FINNS i svaret.
      for (const vm of mapping.variants) {
        if (!vm.wixVariantId || !vm.costUsd) continue;
        const inv = bySupplier.get(vm.supplierVariantId);
        if (!inv || vm.costUsd === inv.price) continue;
        const pw = evaluatePriceChange(vm.costUsd, inv.price, pricing, { thresholdPercent, autoAdjust });
        if (pw.flagged || pw.newGrossSek !== undefined) {
          alerts.push({ wixVariantId: vm.wixVariantId, ...pw });
          if (pw.flagged) {
            void audit("price-alert", vm.wixVariantId, `+${pw.percentChange}% — kräver åtgärd`);
          } else if (pw.newGrossSek) {
            void audit("price-adjust", vm.wixVariantId, `nytt pris ${pw.newGrossSek} kr`);
          }
        }
      }

      // Lager: seed:a ALLA mappade varianter; en variant som saknas i svaret
      // (slutsåld/borttagen) nollas i stället för att behålla gammalt saldo (oversälj).
      const desired = buildDesiredStock(mapping.variants, inventory);
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
