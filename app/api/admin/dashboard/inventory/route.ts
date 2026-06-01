// GET /api/admin/dashboard/inventory — lagersektionen som JSON (admin-gated via proxy.ts).
import { NextResponse } from "next/server";
import { buildDashboard } from "@/lib/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const d = await buildDashboard();
  return NextResponse.json({ ok: true, inventory: d.inventory, generatedAt: d.generatedAt });
}
