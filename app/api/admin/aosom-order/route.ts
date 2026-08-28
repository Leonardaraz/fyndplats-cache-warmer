// GET /api/admin/aosom-order
//
// Bygger bulkorder-filen för de Aosom-ordrar som väntar på att läggas.
//
// VARFÖR DEN FINNS
//
// `lib/orders/place-order.ts` är helt AliExpress och vägrar numera en
// Aosom-mappning uttryckligen. Aosoms egen väg är bulkuppladdning: en fil där
// varje rad är en order, som laddas upp på aosom.de/bulkordering och betalas i
// klump. Den filen byggs här — se lib/aosom/bulk-order.ts för gränserna, som är
// Aosoms och inte våra.
//
// Utan format-parametern svarar rutten med PLANEN som JSON: hur många batchar
// det blir, vad var och en innehåller, och vilka ordrar som inte gick att få med
// och varför. Läs den innan du laddar upp något.
//
// Query:
//   ?format=csv&batch=1   ladda ner batch 1 som CSV (1-indexerat)
//   ?status=pending       vilka orderstatusar som räknas (default: pending)

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { isAosomSupplierProductId, AOSOM_ID_PREFIX } from "@/lib/aosom/to-product";
import { planeraBulkOrder, byggCsv } from "@/lib/aosom/bulk-order";
import type { FulfillmentTask } from "@/lib/orders/types";

export const runtime = "nodejs";

/** Statusar som betyder "väntar på att beställas hos leverantören". */
const DEFAULT_STATUSAR = ["pending"];

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const statusar = new Set(
    (req.nextUrl.searchParams.get("status") ?? DEFAULT_STATUSAR.join(","))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  try {
    const store = getStore();
    const [tasks, mappningar] = await Promise.all([store.listTasks(), store.listMappings()]);

    // wixProductId → Aosom-artikelnummer. Bara Aosom-mappningar: en AE-order ska
    // aldrig hamna i den här filen, den läggs via place-order som vanligt.
    const skuPerWixId = new Map<string, string>();
    for (const m of mappningar) {
      if (!m.wixProductId || !isAosomSupplierProductId(m.supplierProductId)) continue;
      skuPerWixId.set(m.wixProductId, (m.supplierProductId ?? "").slice(AOSOM_ID_PREFIX.length));
    }

    const vantande = tasks.filter(
      (t: FulfillmentTask) =>
        statusar.has(t.status)
        && !t.aliexpressOrderId
        && !t.refundFlagged
        && !!t.wixCatalogItemId
        && skuPerWixId.has(t.wixCatalogItemId),
    );

    const plan = planeraBulkOrder(vantande, (t) =>
      t.wixCatalogItemId ? (skuPerWixId.get(t.wixCatalogItemId) ?? null) : null,
    );

    const format = req.nextUrl.searchParams.get("format");
    if (format === "csv") {
      const n = Number(req.nextUrl.searchParams.get("batch") ?? "1");
      const batch = plan.batchar[Math.trunc(n) - 1];
      if (!batch) {
        return NextResponse.json(
          { error: `Batch ${n} finns inte — planen har ${plan.batchar.length} stycken.` },
          { status: 404 },
        );
      }
      const datum = new Date().toISOString().slice(0, 10);
      return new NextResponse(byggCsv(batch), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="aosom-bulkorder-${datum}-batch${n}.csv"`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      vantandeRader: vantande.length,
      batchar: plan.batchar.map((b, i) => ({
        nummer: i + 1,
        ordrar: b.rader.length,
        enheter: b.enheter,
        unikaSkus: b.unikaSkus,
        csv: `/api/admin/aosom-order?format=csv&batch=${i + 1}`,
        ordernummer: b.rader.map((r) => r.orderNumber),
      })),
      omojliga: plan.omojliga,
      hoppadeOver: plan.hoppadeOver,
      sadarHar: "Ladda ner varje batch och ladda upp den på https://www.aosom.de/bulkordering",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Kunde inte bygga bulkordern", message }, { status: 500 });
  }
}
