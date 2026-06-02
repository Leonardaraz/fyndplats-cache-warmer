// app/api/cron/morning-email/route.ts
// Vercel Cron entry: GET /api/cron/morning-email
// Schedule: "0 6,7 * * *" (06:00 + 07:00 UTC, se vercel.json). Vercel Cron körs i
// fast UTC utan tidszonsstöd, så vi fyrar på BÅDA timmarna och grindar i koden mot
// svensk lokaltid (lib/cron-time) så mejlet alltid går 08:00 svensk — sommar som
// vinter. På sommaren träffar 06 UTC = 08:00, på vintern 07 UTC = 08:00; den andra
// firningen kortsluts med 200 (skipped).
//
// Bygger dashboard-datat (lib/dashboard) och mejlar en tl;dr till OPS_ALERT_EMAIL
// (fallback info@fyndplats.com) via Resend. Skickas ALLTID — även när allt är 0 —
// så Leonard vet att cronet kör. Manuell körning går via /api/admin/run-job (som
// inte träffar denna route, så grinden påverkar inte den).
//
// Auth: Vercel Cron skickar "Authorization: Bearer $CRON_SECRET". Om CRON_SECRET
// saknas i miljön släpper vi igenom (samma mönster som seo-weekly-email).
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildDashboard } from "../../../../lib/dashboard";
import { renderMorningEmail } from "../../../../lib/dashboard-email";
import { cronClock, isSwedishHour } from "../../../../lib/cron-time";

// Mejlet ska landa 08:00 svensk tid. `?force=1` förbigår grinden (verifiering
// efter deploy / manuell test mot själva cron-routen).
const TARGET_SWEDISH_HOUR = 8;

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

  // DST-grind: hoppa över firningen som inte motsvarar 08:00 svensk tid.
  const clock = cronClock();
  const force = new URL(request.url).searchParams.get("force") === "1";
  if (!force && !isSwedishHour(TARGET_SWEDISH_HOUR)) {
    console.log("[morning-email] skipped — utanför mål-timmen", clock);
    return NextResponse.json({ ok: true, skipped: "off_target_hour", ...clock });
  }
  console.log("[morning-email] firing", { ...clock, force });

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
