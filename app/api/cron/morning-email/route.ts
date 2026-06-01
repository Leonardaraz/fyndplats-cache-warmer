// app/api/cron/morning-email/route.ts
// Vercel Cron entry: GET /api/cron/morning-email
// Schedule: "0 6 * * *" (06:00 UTC = 08:00 svensk sommartid, se vercel.json).
//
// Bygger dashboard-datat (lib/dashboard) och mejlar en tl;dr till OPS_ALERT_EMAIL
// (fallback info@fyndplats.com) via Resend. Skickas ALLTID — även när allt är 0 —
// så Leonard vet att cronet kör.
//
// Auth: Vercel Cron skickar "Authorization: Bearer $CRON_SECRET". Om CRON_SECRET
// saknas i miljön släpper vi igenom (samma mönster som seo-weekly-email).
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildDashboard } from "../../../../lib/dashboard";
import { renderMorningEmail } from "../../../../lib/dashboard-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FROM = process.env.RESEND_FROM || "Fyndplats <orders@fyndplats.se>";

function isAuthorised(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return true;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const to = process.env.OPS_ALERT_EMAIL || "info@fyndplats.com";
  const resend = new Resend(process.env.RESEND_API_KEY);

  const data = await buildDashboard();
  const { subject, html, text } = renderMorningEmail(data);

  try {
    const { data: sent, error } = await resend.emails.send({ from: FROM, to, subject, html, text });
    if (error) {
      console.error("[morning-email] resend error", { to, subject, error: String(error) });
      return NextResponse.json({ ok: false, error: String(error), subject }, { status: 502 });
    }
    console.log("[morning-email] sent", {
      id: sent?.id,
      to,
      orders24h: data.orders.last24h.orders,
      warnings: data.warnings.length,
      source: data.orders.source,
    });
    return NextResponse.json({ ok: true, id: sent?.id, subject, orders24h: data.orders.last24h.orders });
  } catch (e) {
    console.error("[morning-email] send threw", { to, subject, error: (e as Error).message });
    return NextResponse.json({ ok: false, error: (e as Error).message, subject }, { status: 502 });
  }
}
