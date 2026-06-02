import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getSupplierStatus } from "@/lib/import/supplier-tracking";

// GET /api/supplier-status?supplierId=123456
//
// Slår upp en AliExpress-säljares nuvarande score/status (Feature 6). Används av
// extensionen FÖRE import för att varna Leonard om säljaren börjat bli dålig
// (blocked/warning). Okänd säljare (ingen historik än) → status "good" + known:false.
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const supplierId = new URL(req.url).searchParams.get("supplierId")?.trim();
  if (!supplierId) {
    return NextResponse.json({ error: "supplierId saknas" }, { status: 400 });
  }

  try {
    const record = await getSupplierStatus(supplierId);
    if (!record) {
      // Aldrig importerad från denna säljare → ingen historik att varna om.
      return NextResponse.json({ ok: true, known: false, status: "good", record: null });
    }
    return NextResponse.json({
      ok: true,
      known: true,
      status: record.status,
      complaintRate: record.complaintRate,
      avgShipDays: record.avgShipDays,
      productsImported: record.productsImported,
      productsSold: record.productsSold,
      complaintCount: record.complaintCount,
      record,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Kunde inte hämta säljarstatus", message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
