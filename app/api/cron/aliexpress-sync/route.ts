// POST /api/cron/aliexpress-sync
//
// Daglig AliExpress-sync. Körs av Vercel Cron 06:00 UTC (07:00/08:00 Stockholm
// beroende på sommartid) så att rapporten ligger i Leonards inkorg när han
// vaknar.
//
// Vad rutten gör:
//   1. Loopar igenom alla FyndplatsMappings (upp till MAX_API_CALLS per körning)
//   2. För varje produkt: hämtar nuvarande AliExpress-status, jämför med
//      lastChecked-snapshot, bestämmer åtgärd, skriver sync-logg + ev. alert.
//   3. Auto-actions: hide produkter där listningen försvunnit; sätt oos när
//      lagret är slut; återställ inventory när lagret kommer tillbaka.
//   4. Alerts för Leonard: prishöjning som hotar marginalen, innehållsändring.
//   5. Skickar sammanfattnings-mejl till OPS_ALERT_EMAIL via Resend (om något
//      flaggats — annars ingen email-spam).
//
// Säkerhet:
//   - SYNC_DRY_RUN=true (default) → kör allt utom Wix-skrivningar.
//   - Auth: Vercel cron Bearer-token ELLER x-fyndplats-token (manuell trigger).
//
// Rate-limit: max SYNC_MAX_API_CALLS (default 100) AliExpress-anrop per
// körning. Produkter med äldst lastCheckedAt synkas först — så vi rullar runt
// över flera dagar om vi har många produkter.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { pricingConfigFromEnv } from "@/lib/config";
import {
  runDailySync,
  DEFAULT_MARGIN_FLOOR_PERCENT,
  DEFAULT_MAX_API_CALLS_PER_RUN,
  DEFAULT_SYNC_TIME_BUDGET_MS,
} from "@/lib/sync/aliexpress-sync";
import { audit } from "@/lib/audit";
import { buildDailySummaryEmail, sendEmail } from "@/lib/email/resend";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  try {
    // STORE_BACKEND=memory är meningslöst för cronen — listMappings() kommer
    // bara returnera vad som råkar finnas i denna lambda-instans. Skippa då.
    const backend = process.env.STORE_BACKEND ?? "memory";
    if (backend === "memory") {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "STORE_BACKEND=memory — sync-cronen kräver persistent store",
      });
    }

    const pricing = pricingConfigFromEnv();
    const dryRun = (process.env.SYNC_DRY_RUN ?? "true").toLowerCase() !== "false";
    const maxApiCalls = numberFromEnv("SYNC_MAX_API_CALLS", DEFAULT_MAX_API_CALLS_PER_RUN);
    const timeBudgetMs = numberFromEnv("SYNC_TIME_BUDGET_MS", DEFAULT_SYNC_TIME_BUDGET_MS);
    const marginFloorPercent = numberFromEnv(
      "SYNC_MARGIN_FLOOR_PERCENT",
      DEFAULT_MARGIN_FLOOR_PERCENT,
    );

    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL
      ?? process.env.VERCEL_URL
      ?? "https://fyndplats-cache-warmer.vercel.app"
    ).replace(/^https?:\/\//, "https://").replace(/\/$/, "");
    const opsEmailForAlerts = process.env.OPS_ALERT_EMAIL;

    const summary = await runDailySync({
      pricing,
      dryRun,
      maxApiCalls,
      timeBudgetMs,
      marginFloorPercent,
      baseUrl,
      opsAlertEmail: opsEmailForAlerts,
    });

    await audit(
      "aliexpress-sync-run",
      "cron",
      JSON.stringify({
        dryRun,
        checked: summary.checked,
        flaggedPrice: summary.flaggedPrice,
        flaggedContent: summary.flaggedContent,
        hidden: summary.hidden,
        markedOos: summary.markedOos,
        restored: summary.restored,
        oosRealtimeAlerts: summary.oosRealtimeAlerts,
        restockNotificationsSent: summary.restockNotificationsSent,
        errors: summary.errors.length,
      }),
    );

    // Email-rapport — bara om något hände eller om fel uppstod.
    const opsEmail = process.env.OPS_ALERT_EMAIL;
    if (opsEmail) {
      try {
        const alertsUrl = `${baseUrl}/admin/sync-alerts`;
        const built = buildDailySummaryEmail(summary, alertsUrl);
        if (built) {
          await sendEmail({
            to: opsEmail,
            subject: built.subject,
            bodyHtml: built.html,
            bodyText: built.text,
          });
        }
      } catch (emailErr) {
        // Skicka aldrig 500 bara för att mejlet failade — rapporten ska
        // ändå loggas och vara läsbar via /admin/sync-alerts.
        await audit(
          "aliexpress-sync-email-error",
          "cron",
          emailErr instanceof Error ? emailErr.message.slice(0, 300) : String(emailErr),
        );
      }
    }

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : "Error";
    await audit("aliexpress-sync-fatal", "cron", `${name}: ${msg.slice(0, 300)}`);
    return NextResponse.json(
      { ok: false, error: `${name}: ${msg}` },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}

// Vercel Cron skickar GET — stödjer båda för att kunna trigga manuellt med curl.
export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req);
}

function numberFromEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
