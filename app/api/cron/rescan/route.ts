// GET /api/cron/rescan
// Övervakning (motiverar månadsabonnemanget): re-skannar alla bevakade URL:er,
// jämför mot förra mätningen och larmar (mejl till ägaren) vid försämring.
// Schemalägg via Vercel Cron. Skydd: CRON_SECRET eller x-fyndplats-token.

import { type NextRequest, NextResponse } from "next/server";
import { fetchPageHtml } from "@/lib/accessibility/scanner";
import { analyzePage, overallScore } from "@/lib/scan/analyze-page";
import { eaaRisk } from "@/lib/scan/prioritize";
import { detectRegression, getSnapshotStore, toSnapshot } from "@/lib/scan/history";
import { sendEmail } from "@/lib/email/notify";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const store = getSnapshotStore();
  const urls = await store.trackedUrls();
  const results: Array<{ url: string; overall?: number; regressed?: boolean; error?: string }> = [];

  for (const url of urls) {
    try {
      const previous = await store.latest(url);
      const { url: finalUrl, html } = await fetchPageHtml(url);
      const categories = analyzePage(finalUrl, html);
      const overall = overallScore(categories);
      const risk = eaaRisk(categories.find((c) => c.category === "accessibility")?.score ?? overall);
      const snapshot = toSnapshot(url, overall, risk, categories);

      let regressed = false;
      if (previous) {
        const reg = detectRegression(previous, snapshot);
        regressed = reg.regressed;
        if (regressed) await alertOwner(url, previous.overall, overall, reg.overallDelta);
      }
      await store.record(snapshot);
      results.push({ url, overall, regressed });
    } catch (err) {
      results.push({ url, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ checked: urls.length, results });
}

/** Mejlar ägaren vid försämring (best-effort, env-styrt via EMAIL_OWNER). */
async function alertOwner(url: string, before: number, after: number, delta: number): Promise<void> {
  const owner = process.env.EMAIL_OWNER;
  if (!owner) return;
  await sendEmail({
    to: owner,
    subject: `⚠️ Tillgänglighet försämrad: ${url} (${delta} poäng)`,
    html: `<p>Övervakningen upptäckte en försämring.</p>
      <ul><li>Sida: ${url}</li><li>Tidigare: ${before}/100</li><li>Nu: ${after}/100</li></ul>
      <p>Kör en ny granskning för detaljer.</p>`,
  });
}
