import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { pricingConfigFromEnv } from "@/lib/config";
import { evaluatePriceChange } from "@/lib/sync/price-watch";
import { syncProductStock, type DesiredStock } from "@/lib/sync/inventory";
import { audit } from "@/lib/audit";

const ItemSchema = z.object({
  wixVariantId: z.string().min(1),
  stock: z.number().int().nonnegative(),
  /** Tidigare inköpspris (för prisbevakning). Utelämnas vid första synken. */
  oldCostUsd: z.number().nonnegative().optional(),
  /** Aktuellt inköpspris läst från AliExpress-sidan. */
  newCostUsd: z.number().nonnegative().optional(),
});

const SyncSchema = z.object({
  wixProductId: z.string().min(1),
  thresholdPercent: z.number().positive().optional(),
  autoAdjust: z.boolean().optional(),
  items: z.array(ItemSchema).min(1),
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

  const parsed = SyncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valideringsfel", details: parsed.error.flatten() }, { status: 422 });
  }

  const { wixProductId, items, thresholdPercent, autoAdjust } = parsed.data;
  const pricing = pricingConfigFromEnv();
  const watch = { thresholdPercent: thresholdPercent ?? 10, autoAdjust: autoAdjust ?? false };

  // Prisbevakning (ren logik) — körs alltid när vi har både gammalt och nytt pris.
  const priceAlerts = items
    .filter((i) => i.oldCostUsd !== undefined && i.newCostUsd !== undefined)
    .map((i) => ({
      wixVariantId: i.wixVariantId,
      ...evaluatePriceChange(i.oldCostUsd!, i.newCostUsd!, pricing, watch),
    }));

  // Logga prishöjningar som flaggats eller auto-justerats.
  for (const a of priceAlerts) {
    if (a.flagged) await audit("price-alert", a.wixVariantId, `+${a.percentChange}% inköpspris — kräver åtgärd`);
    else if (a.newGrossSek !== undefined) await audit("price-adjust", a.wixVariantId, `nytt pris ${a.newGrossSek} kr`);
  }

  // Lageruppdatering mot Wix (best-effort; rapporterar omatchade varianter).
  const desired: DesiredStock[] = items.map((i) => ({ wixVariantId: i.wixVariantId, quantity: i.stock }));
  try {
    const stockResult = await syncProductStock(wixProductId, desired);
    return NextResponse.json({ ok: true, stock: stockResult, priceAlerts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Lagersync misslyckades", message, priceAlerts }, { status: 502 });
  }
}
