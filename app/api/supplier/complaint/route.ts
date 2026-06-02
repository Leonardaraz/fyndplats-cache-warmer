import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { recordComplaint } from "@/lib/import/supplier-tracking";

// POST /api/supplier/complaint
//   { productId: string, reason?: string, supplierId?: string }
//
// Registrerar ett klagomål/retur mot en säljare (Feature 6). Kallas av
// fyndplats-headless webhook-rutten vid `refund_created`, eller manuellt. Ökar
// complaintCount, räknar om complaintRate + status. supplierId resolvas från
// produktmappningen om det inte skickas med.
const Schema = z.object({
  productId: z.string().min(1),
  reason: z.string().max(500).optional(),
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
    const record = await recordComplaint(
      parsed.data.productId,
      parsed.data.reason ?? "retur/klagomål",
      parsed.data.supplierId ? { supplierId: parsed.data.supplierId } : undefined,
    );
    if (!record) {
      // Ingen säljare kunde kopplas (produkten saknar supplierId) → no-op men 200
      // så att headless-webhooken inte gör onödiga retries.
      return NextResponse.json({ ok: true, tracked: false });
    }
    return NextResponse.json({ ok: true, tracked: true, status: record.status, complaintRate: record.complaintRate });
  } catch (err) {
    return NextResponse.json(
      { error: "Kunde inte registrera klagomål", message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
