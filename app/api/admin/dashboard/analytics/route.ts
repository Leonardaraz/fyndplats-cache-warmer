// GET /api/admin/dashboard/analytics — analytics + marknadsföring + nyhetsbrev som JSON
// (admin-gated via proxy.ts).
import { NextResponse } from "next/server";
import { buildDashboard } from "@/lib/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const d = await buildDashboard();
  return NextResponse.json({
    ok: true,
    analytics: d.analytics,
    marketing: d.marketing,
    newsletter: d.newsletter,
    generatedAt: d.generatedAt,
  });
}
