// app/api/cron/seo-weekly-email/route.ts
// Vercel Cron entry: GET /api/cron/seo-weekly-email
// Schedule: Mondays "0 6,7 * * 1" (06:00 + 07:00 UTC, see vercel.json). Vercel
// Cron runs in fixed UTC without timezone support, so we fire on BOTH hours and
// gate in code against Swedish local time (lib/cron-time) so the report always
// lands 08:00 Swedish on Mondays — summer and winter alike. In summer 06 UTC =
// 08:00, in winter 07 UTC = 08:00; the other firing short-circuits with 200.
//
// Builds the deterministic SEO health report (lib/seo-health) and emails it to
// OPS_ALERT_EMAIL via Resend. Subject reflects health:
//   • issues found → "⚠️ Fyndplats SEO weekly — N problem"
//   • all healthy  → "✅ Fyndplats SEO weekly — allt OK"
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildSeoHealthReport, renderSeoEmailHtml, seoEmailSubject } from "../../../../lib/seo-health";
import { cronClock, isSwedishHour } from "../../../../lib/cron-time";

// Mondays 08:00 Swedish time. `?force=1` bypasses the gate (post-deploy verify).
const TARGET_SWEDISH_HOUR = 8;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // crawling key pages can take a moment

// Lazy: `new Resend(undefined)` throws, and Vercel evaluates route modules
// during the build's "collect page data" step where RESEND_API_KEY may be unset.
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

  // DST gate: skip the firing that isn't 08:00 Swedish time.
  const clock = cronClock();
  const force = new URL(request.url).searchParams.get("force") === "1";
  if (!force && !isSwedishHour(TARGET_SWEDISH_HOUR)) {
    console.log("[seo-weekly] skipped — off target hour", clock);
    return NextResponse.json({ ok: true, skipped: "off_target_hour", ...clock });
  }
  console.log("[seo-weekly] firing", { ...clock, force });

  // Fall back to the ops mailbox so the weekly touch still arrives even if
  // OPS_ALERT_EMAIL is missing in Vercel (mirrors app/api/sms-inbound/route.ts).
  const to = process.env.OPS_ALERT_EMAIL || "info@fyndplats.com";
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY not configured" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const report = await buildSeoHealthReport();
  const html = renderSeoEmailHtml(report);
  const subject = seoEmailSubject(report);

  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[seo-weekly] resend error", { to, subject, error: String(error) });
      return NextResponse.json({ ok: false, error: String(error), subject }, { status: 502 });
    }
    // Logged so each Monday run leaves an audit trail in Vercel function logs.
    console.log("[seo-weekly] sent", { id: data?.id, to, subject, issues: report.issues.length, healthy: report.healthy });
    return NextResponse.json({
      ok: true,
      id: data?.id,
      subject,
      issues: report.issues.length,
      healthy: report.healthy,
    });
  } catch (e) {
    console.error("[seo-weekly] send threw", { to, subject, error: (e as Error).message });
    return NextResponse.json({ ok: false, error: (e as Error).message, subject }, { status: 502 });
  }
}
