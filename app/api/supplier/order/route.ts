import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { recordOrder } from "@/lib/import/supplier-tracking";

// POST /api/supplier/order
//   { productId: string, units?: number, shipDays?: number, supplierId?: string }
//
// Registrerar sålda enheter mot en säljare (Feature 6). Kallas av
// fyndplats-headless webhook-rutten vid `order_fulfilled` (per line-item), eller
// manuellt. Cache-warmerns egen /api/wix-order-rutt kallar redan recordOrder
// internt — denna endpoint är för headless/externa flöden. shipDays uppdaterar
// säljarens genomsnittliga leveranstid om det skickas med.
const Schema = z.object({
  productId: z.string().min(1),
  units: z.number().int().positive().optional(),
  shipDays: z.number().nonnegative().optional(),
  supplierId: z.string().optional(),
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
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valideringsfel", details: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const record = await recordOrder(parsed.data.productId, {
      units: parsed.data.units,
      shipDays: parsed.data.shipDays,
      ...(parsed.data.supplierId ? { supplierId: parsed.data.supplierId } : {}),
    });
    if (!record) {
      return NextResponse.json({ ok: true, tracked: false });
    }
    return NextResponse.json({ ok: true, tracked: true, productsSold: record.productsSold, status: record.status });
  } catch (err) {
    return NextResponse.json(
      { error: "Kunde inte registrera order", message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
