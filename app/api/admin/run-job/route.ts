// POST /api/admin/run-job  { job: "migrate" | "morning-email" | "seo-weekly" }
// Manuell trigger för cron-jobb och DB-migrering. Gated by proxy.ts (fp_admin-cookie).
// Används av dashboardens snabbåtgärder + för verifiering efter deploy.
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { runMigration } from "@/lib/db";
import { buildDashboard } from "@/lib/dashboard";
import { renderMorningEmail } from "@/lib/dashboard-email";
import { buildSeoHealthReport, renderSeoEmailHtml, seoEmailSubject } from "@/lib/seo-health";
import { syncOrdersFromWix } from "@/lib/order-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FROM = process.env.RESEND_FROM || "Fyndplats <orders@fyndplats.se>";

export async function POST(request: Request) {
  let job = "";
  try {
    const body = (await request.json()) as { job?: string };
    job = body.job ?? "";
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const to = process.env.OPS_ALERT_EMAIL || "info@fyndplats.com";

  try {
    if (job === "migrate") {
      await runMigration();
      return NextResponse.json({ ok: true, job, migrated: true });
    }

    if (job === "order-sync") {
      const result = await syncOrdersFromWix();
      return NextResponse.json({ job, ...result });
    }

    if (job === "morning-email" || job === "seo-weekly") {
      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({ ok: false, error: "RESEND_API_KEY not configured" }, { status: 500 });
      }
      const resend = new Resend(process.env.RESEND_API_KEY);
      let subject: string, html: string, text: string | undefined;
      if (job === "morning-email") {
        const data = await buildDashboard();
        ({ subject, html, text } = renderMorningEmail(data));
      } else {
        const report = await buildSeoHealthReport();
        subject = seoEmailSubject(report);
        html = renderSeoEmailHtml(report);
      }
      const { data: sent, error } = await resend.emails.send({ from: FROM, to, subject, html, text });
      if (error) return NextResponse.json({ ok: false, job, error: String(error) }, { status: 502 });
      return NextResponse.json({ ok: true, job, id: sent?.id, subject });
    }

    return NextResponse.json({ ok: false, error: `unknown job "${job}"` }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, job, error: (e as Error).message }, { status: 500 });
  }
}
