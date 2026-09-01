// POST /api/cron/aliexpress-sync
//
// AliExpress-sync. Körs av Vercel Cron varannan timme (vercel.json) så att
// katalogen rullar igenom snabbare — ordervakten (/api/cron/order-guard)
// sammanfattar dygnets körningar i morgonmejlet.
//
// Vad rutten gör:
//   1. Loopar igenom alla FyndplatsMappings (upp till MAX_API_CALLS per körning)
//   2. För varje produkt: hämtar nuvarande AliExpress-status, jämför med
//      lastChecked-snapshot, bestämmer åtgärd, skriver sync-logg + ev. alert.
//   3. Auto-actions: hide produkter där listningen försvunnit; sätt oos när
//      lagret är slut; återställ inventory när lagret kommer tillbaka.
//   4. Alerts för Leonard: prishöjning som hotar marginalen, innehållsändring.
//   5. Mejl: dygnets händelser sammanställs i morgonmejlet (ordervakten) —
//      per-körnings-rapporten är AV om inte SYNC_PER_RUN_EMAIL=true.
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
import { getSyncStore } from "@/lib/sync/sync-log";
import { getStore } from "@/lib/store/factory";
import { AUDIT_RETENTION_DAYS, LLM_STATS_RETENTION_DAYS, SYNC_LOG_RETENTION_DAYS } from "@/lib/retention";
import { LLM_COLLECTIONS, llmPruneOlderThan } from "@/lib/llm/storage";
import { buildDailySummaryEmail, sendEmail } from "@/lib/email/resend";
import { isPersistentBackend } from "@/lib/store/backend";

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
    if (!isPersistentBackend()) {
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

    // ☠️ RETENTIONEN KÖRS FÖRST, OCH VARJE GÅNG. Båda delarna är lärdomar från
    // 2026-08-31, då Wix Datas radtak var nått och `FyndplatsAliExpressSyncLog`
    // inte kunde ta emot fler rader — samma tak avvisade nya order-tasks, så en
    // betald order (10024) föll ur pipelinen.
    //
    // Låg FÖRE: en städning som ligger efter arbetet är beroende av att arbetet
    // lyckas. Det höll den här gången (loopen fångar per-produkt-fel och rutten
    // svarar 200), men under fan-out-haveriet 2026-08-28 dog lambdan mitt i och
    // då hade städningen aldrig körts — precis när den behövdes som mest.
    // Städning som bara går när allt annat fungerar är ingen städning.
    //
    // Låg BAKOM en `getUTCHours() < 4`-grind: nattgrinden fanns för att slippa
    // raderingsjobb var fjärde timme. Priset var att ett fullt lager inte kunde
    // städas förrän nästa natt — upp till ett dygn med tappade ordrar. Jobbet är
    // asynkront hos Wix och no-op:ar när filtret inte matchar något, så en
    // körning i timmen kostar ett anrop och inget mer.
    //
    // Fönstren är satta efter UPPMÄTT volym, inte efter magkänsla. Vid 5 470
    // mappningar skriver synken ~600 loggrader/dygn: 21 dygn blev 12 278 rader,
    // varav 8 306 äldre än en vecka. Ingenting läser så gammalt — morgonmejlet
    // tittar på senaste dygnet (SYNC_DIGEST_WINDOW_MS), /admin på de 200
    // senaste och produkthistoriken på de 50 senaste. Samma sak för auditen:
    // 90 dygn var 4 723 rader när talet sattes och 22 977 när katalogen växt.
    // Ändras katalogens storlek igen är det de här två talen som ska följa med.
    const retentionDays = numberFromEnv("SYNC_LOG_RETENTION_DAYS", SYNC_LOG_RETENTION_DAYS);
    try {
      const jobId = await getSyncStore().pruneLogOlderThan(retentionDays);
      console.log(`[sync] loggstädning startad (>${retentionDays} dygn), jobId=${jobId}`);
    } catch (pruneErr) {
      console.warn(
        `[sync] loggstädning misslyckades: ${pruneErr instanceof Error ? pruneErr.message.slice(0, 200) : String(pruneErr)}`,
      );
    }

    const auditRetentionDays = numberFromEnv("AUDIT_RETENTION_DAYS", AUDIT_RETENTION_DAYS);
    try {
      const res = await getStore().pruneAuditOlderThan(auditRetentionDays);
      console.log(`[sync] auditstädning startad (>${auditRetentionDays} dygn), ${res}`);
    } catch (pruneErr) {
      console.warn(
        `[sync] auditstädning misslyckades: ${pruneErr instanceof Error ? pruneErr.message.slice(0, 200) : String(pruneErr)}`,
      );
    }

    // LLM-statistiken hade INGEN städning alls och växte med en rad per
    // anrop. Den delar site-bred postgräns med mappningar och ordrar, så den
    // åt utrymme från fulfillment-tasken för en betald order.
    const llmRetentionDays = numberFromEnv("LLM_STATS_RETENTION_DAYS", LLM_STATS_RETENTION_DAYS);
    try {
      const res = await llmPruneOlderThan(LLM_COLLECTIONS.stats, llmRetentionDays);
      console.log(`[sync] llm-statsstädning startad (>${llmRetentionDays} dygn), ${res}`);
    } catch (pruneErr) {
      console.warn(
        `[sync] llm-statsstädning misslyckades: ${pruneErr instanceof Error ? pruneErr.message.slice(0, 200) : String(pruneErr)}`,
      );
    }

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
        // Nämnaren (audit 2026-08-24): utan `total` och `skipped` sa mejlet
        // "600 produkter kollade" utan att avslöja att katalogen är 876 — en
        // rotation som saktar in var osynlig överallt.
        total: summary.total,
        skipped: summary.skipped,
        boundBy: summary.boundBy ?? null,
        throttled: summary.throttled ?? 0,
        orphans: summary.orphans ?? 0,
        checked: summary.checked,
        flaggedPrice: summary.flaggedPrice,
        flaggedContent: summary.flaggedContent,
        hidden: summary.hidden,
        markedOos: summary.markedOos,
        restored: summary.restored,
        oosRealtimeAlerts: summary.oosRealtimeAlerts,
        restockNotificationsSent: summary.restockNotificationsSent,
        shippabilityChecked: summary.shippabilityChecked ?? 0,
        shippabilityUnshippable: summary.shippabilityUnshippable ?? 0,
        errors: summary.errors.length,
      }),
    );

    // Email-rapport per körning — AV som standard sedan 2026-07-14. Cronen
    // kör varannan timme = upp till 12 rapporter/dygn i inkorgen; Leonard ville
    // ha ETT mejl om dagen. Dygnets händelser sammanställs numera i morgon-
    // mejlet (ordervakten, /api/cron/order-guard). Sätt SYNC_PER_RUN_EMAIL=true
    // för att få tillbaka per-körnings-rapporten.
    const opsEmail = process.env.SYNC_PER_RUN_EMAIL === "true"
      ? process.env.OPS_ALERT_EMAIL
      : undefined;
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
