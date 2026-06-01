// app/api/cron/seo-weekly-email/route.ts
// Vercel Cron entry: GET /api/cron/seo-weekly-email
// Schedule: Mondays 08:00 UTC ("0 8 * * 1", see vercel.json).
//
// Builds the deterministic SEO health report (lib/seo-health) and emails it to
// OPS_ALERT_EMAIL via Resend. Subject reflects health:
//   • issues found → "⚠️ Fyndplats SEO weekly — N problem"
//   • all healthy  → "✅ Fyndplats SEO weekly — allt OK"
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildSeoHealthReport, renderSeoEmailHtml, seoEmailSubject } from "../../../../lib/seo-health";

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
      return NextResponse.json({ ok: false, error: String(error), subject }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      id: data?.id,
      subject,
      issues: report.issues.length,
      healthy: report.healthy,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message, subject }, { status: 502 });
  }
}
