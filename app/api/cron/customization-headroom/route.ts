// POST /api/cron/customization-headroom
//
// READ-ONLY observability-cron (Fas 0 av den varaktiga val-tak-planen). Frågar Wix efter
// alla delade customizations och loggar fyllnadsgraden per hink, med VARNING för dem som
// närmar sig det butiks-globala 100-vals-taket. Muterar INGENTING — bara läser + loggar.
//
// Triggas av GitHub Actions (.github/workflows/customization-headroom.yml), samma
// external-cron-mönster som /api/aliexpress/refresh (Vercel Hobby saknar täta scheman).
// Auth: caller skickar `Authorization: Bearer <CRON_SECRET>`, timing-safe jämförelse.

import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { customizationHeadroomReport, formatHeadroomWarnings } from "@/lib/wix/prune-customizations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default-larmnivå: 85 av 100. Storlek ligger redan ~97 → larmar direkt.
const DEFAULT_WARN_AT = 85;

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization") ?? "";
  if (!expected) return false;
  const expectedHeader = `Bearer ${expected}`;
  const a = Buffer.from(expectedHeader);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const warnAt = Number(process.env.WIX_HEADROOM_WARN_AT) || DEFAULT_WARN_AT;

  try {
    const report = await customizationHeadroomReport({ warnAt });

    // Logga varje hink nära taket (synligt i Vercel-loggarna + cron-workflow-utskriften).
    for (const line of formatHeadroomWarnings(report)) console.warn(line);
    if (report.duplicateKeys.length) {
      console.warn(
        `[wix-headroom] ANOMALI: ${report.duplicateKeys.length} (namn+renderType)-nycklar på flera customization-id: ${report.duplicateKeys.join(", ")}`,
      );
    }
    console.log(
      `[wix-headroom] ${report.buckets.length} option-hinkar, max ${report.maxChoiceCount}/${report.limit} val, ` +
        `${report.nearLimit.length} nära taket (≥${warnAt}), ${report.emptyCount} tomma.`,
    );

    return NextResponse.json({
      ok: true,
      limit: report.limit,
      warnAt,
      maxChoiceCount: report.maxChoiceCount,
      nearLimit: report.nearLimit.map((b) => ({
        name: b.name,
        renderType: b.renderType,
        choiceCount: b.choiceCount,
        headroom: b.headroom,
        atLimit: b.atLimit,
      })),
      emptyCount: report.emptyCount,
      duplicateKeys: report.duplicateKeys,
      topBuckets: report.buckets.slice(0, 8).map((b) => ({ name: b.name, renderType: b.renderType, choiceCount: b.choiceCount })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "okänt fel";
    console.error(`[wix-headroom] rapport misslyckades: ${message}`);
    return NextResponse.json({ error: "headroom_report_failed", message }, { status: 500 });
  }
}
