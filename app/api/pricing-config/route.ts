import { NextResponse } from "next/server";
import { getPricingRules } from "@/lib/store/pricing-config";

// GET /api/pricing-config
// Returnerar de aktuella prissättningsreglerna (default-/kategori-multiplikatorer,
// intervall-tiers, moms, avrundning) som JSON. Read-only bekvämlighet för
// smoke-tester/curl och ev. externa verktyg; redigering sker i /admin/pricing
// (→ FyndplatsPricingConfig). Innehåller inga hemligheter (API-nycklar etc.).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rules = await getPricingRules();
    return NextResponse.json({ ok: true, rules });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
