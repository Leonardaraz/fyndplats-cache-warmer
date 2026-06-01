// GET /api/admin/dashboard/orders — order-sektionen som JSON (admin-gated via proxy.ts).
// Använd för client-side refresh/SWR. Säker placering under /api/admin/* (proxy.ts
// skyddar bara /admin/* och /api/admin/* — INTE /api/dashboard/*, därav nästlingen).
import { NextResponse } from "next/server";
import { buildDashboard } from "@/lib/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const d = await buildDashboard();
  return NextResponse.json({ ok: true, orders: d.orders, abandoned: d.abandoned, generatedAt: d.generatedAt });
}
