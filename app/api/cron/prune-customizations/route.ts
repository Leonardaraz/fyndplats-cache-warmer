// POST /api/cron/prune-customizations
//
// Auto-prune (Fas 3): städar SKRÄP ur butikens delade variant-listor — tomma customizations
// (0 val) + föräldralösa val (val som INGEN produkt använder). Håller listorna lean så de
// inte kryper mot Wix:s 100-vals-tak. Rör ALDRIG val i bruk (Wix nekar dessutom).
//
// SÄKERHET:
//   • DRY-RUN DEFAULT PÅ. Muterar bara om PRUNE_DRY_RUN === "false" är satt i miljön.
//     Tills dess loggar den BARA vad den SKULLE ta bort → granska i workflow-loggen först.
//   • Hård invariant: orphan-beslut fattas aldrig på partiell produktskanning
//     (queryProductChoiceUsage kastar hellre än returnerar ofullständigt → routen 500:ar, ingen prune).
//   • Dolda/utkast-produkter räknas som användning.
//   • Wix backstop: remove-choices nekar val i bruk, delete nekar tilldelad customization.
//
// Triggas av GitHub Actions (.github/workflows/prune-customizations.yml), samma external-cron-
// mönster som /api/aliexpress/refresh. Auth: `Authorization: Bearer <CRON_SECRET>`.

import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  queryCustomizations,
  queryProductChoiceUsage,
  planCustomizationPrune,
  executePrune,
} from "@/lib/wix/prune-customizations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  // DEFAULT: dry-run PÅ. Bara explicit "false" aktiverar skarp prune.
  const dryRun = process.env.PRUNE_DRY_RUN !== "false";

  try {
    const [customizations, usage] = await Promise.all([
      queryCustomizations(),
      queryProductChoiceUsage(), // kastar vid ofullständig skanning → ingen prune på partiell data
    ]);
    const plan = planCustomizationPrune(customizations, usage);

    console.log(
      `[wix-prune] plan: ${plan.emptyToDelete.length} tomma hinkar att radera, ` +
        `${plan.totalOrphanChoices} föräldralösa val över ${plan.choicePrunes.length} hinkar` +
        ` — dryRun=${dryRun}.`,
    );
    for (const cp of plan.choicePrunes) {
      console.log(`[wix-prune] "${cp.name}" (${cp.renderType}): ${cp.orphanChoiceIds.length} föräldralösa, behåller ${cp.keepCount}.`);
    }
    if (plan.emptyToDelete.length) {
      console.log(`[wix-prune] tomma hinkar: ${plan.emptyToDelete.map((e) => `"${e.name}"`).join(", ")}.`);
    }

    const result = await executePrune(plan, { dryRun });
    if (result.failures.length) {
      console.warn(`[wix-prune] ${result.failures.length} fel: ${result.failures.slice(0, 5).join(" | ")}`);
    }
    console.log(
      `[wix-prune] ${dryRun ? "DRY-RUN (inget muterat)" : "SKARP"}: ` +
        `${result.emptyDeleted} tomma raderade, ${result.choicesRemoved} val borttagna, ${result.failures.length} fel.`,
    );

    return NextResponse.json({
      ok: true,
      dryRun,
      plan: {
        emptyToDelete: plan.emptyToDelete.length,
        orphanChoices: plan.totalOrphanChoices,
        affectedCustomizations: plan.choicePrunes.length,
        topPrunes: plan.choicePrunes
          .slice()
          .sort((a, b) => b.orphanChoiceIds.length - a.orphanChoiceIds.length)
          .slice(0, 8)
          .map((c) => ({ name: c.name, renderType: c.renderType, orphans: c.orphanChoiceIds.length, keep: c.keepCount })),
      },
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "okänt fel";
    console.error(`[wix-prune] AVBRUTET (ingen mutation): ${message}`);
    return NextResponse.json({ error: "prune_failed", message }, { status: 500 });
  }
}
