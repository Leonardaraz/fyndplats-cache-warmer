// app/api/cron/review-queue/route.ts
// Vercel Cron entry: GET /api/cron/review-queue
//
// Letar efter NYA recensioner hos AliExpress och lägger dem i översättningskön
// (status `pending`, tom svensk text → osynliga för kund). Översätter INGENTING.
//
// Varför separat från /api/cron/review-backfill: backfillen översätter med DeepL
// och är därför avstängd sedan Leonard valde bort DeepL (2026-08-16). Den här
// rutten gör bara hälften — hittar och köar — och lämnar översättningen till
// chatten, där den är gratis och kurerad. Kostnad: noll. AE:s feedback-endpoint
// är ett öppet JSON-anrop och ingen översättningstjänst rörs.
//
// Konvergens: varje produkt vi fått svar för stämplas med `reviewsCheckedAt` i
// mappningen. Nästa körning tar bara produkter utan stämpel eller med en stämpel
// äldre än REVIEW_RECHECK_DAYS. En STRYPT hämtning stämplas aldrig — annars
// hade rate-limiting gömt produkten i en månad.
//
// Takt (rättad 2026-08-17): DAGLIGEN 40 produkter. Veckovis räckte inte — med
// REVIEW_RECHECK_DAYS=30 behöver ~693 publicerade produkter ~23 kontroller per
// dygn för att hållas färska, och 40 i veckan är 5,7. Cronen hade alltså aldrig
// hunnit ikapp sitt eget omkontroll-intervall.
//
// FÖRSTA svepet görs inte av cronen utan av .github/workflows/review-queue.yml,
// som kör rutten i rundor tills katalogen är genombetad. Cronen håller den
// sedan färsk.
//
// Auth: Vercel Cron skickar "Authorization: Bearer $CRON_SECRET". Saknas
// CRON_SECRET släpper vi igenom (samma mönster som övriga cron-routes).

import { NextResponse } from "next/server";
import { fetchAeReviews } from "@/lib/aliexpress/reviews";
import { queueReviewsForProduct } from "@/lib/reviews/queue";
import { getStore } from "@/lib/store/factory";
import type { ProductMappingRecord } from "@/lib/store";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Hur länge en kontrollerad produkt får vila innan vi tittar igen. */
const RECHECK_DAYS = Number(process.env.REVIEW_RECHECK_DAYS || 30);
/** Produkter per körning. Håller körtiden under maxDuration med marginal. */
const DEFAULT_LIMIT = 40;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || DEFAULT_LIMIT)));
  const pages = Math.max(1, Math.min(5, Number(url.searchParams.get("pages") || 2)));
  // Torrkörning: hitta och räkna, men skriv ingenting. Bra för att se vad en
  // skarp körning SKULLE göra innan man släpper på den.
  const dryRun = url.searchParams.get("dryRun") === "true";

  const nu = Date.now();
  const gräns = nu - RECHECK_DAYS * 24 * 3600 * 1000;

  let mappings;
  try {
    mappings = await getStore().listMappings();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "kunde inte läsa mappningar", detail: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }

  const kandidater = ((mappings ?? []) as ProductMappingRecord[])
    // Rader utan draftStatus är gamla och räknas som publicerade (samma
    // regel som backfill-deps använder).
    .filter((m) => (m.draftStatus ?? "published") === "published" && m.supplierProductId && m.wixProductId)
    .filter((m) => {
      const stämpel = m.reviewsCheckedAt ? Date.parse(m.reviewsCheckedAt) : 0;
      return !stämpel || stämpel < gräns;
    })
    // Äldst kontrollerade först — då roterar katalogen jämnt i stället för att
    // samma produkter kollas om och om igen.
    .sort((a, b) => (Date.parse(a.reviewsCheckedAt || "") || 0) - (Date.parse(b.reviewsCheckedAt || "") || 0))
    .slice(0, limit);

  let köade = 0;
  let kontrollerade = 0;
  let strypta = 0;
  const produkterMedNytt: { wixProductId: string; queued: number }[] = [];

  for (const m of kandidater) {
    let res;
    try {
      res = await fetchAeReviews(m.supplierProductId as string, { pages });
    } catch {
      strypta++;
      continue;
    }
    if (res.throttled) {
      strypta++;
      continue;
    }

    kontrollerade++;

    if (!dryRun) {
      const kö = await queueReviewsForProduct(m.wixProductId as string, res.reviews);
      if (kö.queued > 0) {
        köade += kö.queued;
        produkterMedNytt.push({ wixProductId: m.wixProductId as string, queued: kö.queued });
      }
      // Stämpla ENDAST när AE faktiskt svarat. Även "inga recensioner" stämplas
      // — annars skulle de ~40 % recensionslösa produkterna hämtas om i all
      // evighet utan att något förändras.
      try {
        await getStore().saveMapping({ ...m, reviewsCheckedAt: new Date(nu).toISOString() });
      } catch (err) {
        console.warn("[review-queue] kunde inte stämpla", m.wixProductId, err instanceof Error ? err.message : err);
      }
    }
  }

  if (köade > 0) {
    await audit("reviews-queued-cron", "", `${köade} recensioner köade på ${produkterMedNytt.length} produkter`);
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    kandidater: kandidater.length,
    kontrollerade,
    strypta,
    köade,
    produkterMedNytt: produkterMedNytt.slice(0, 50),
    // Så nästa körning vet om det finns mer att beta av.
    kvarAttKontrollera: Math.max(0, ((mappings ?? []) as ProductMappingRecord[]).filter(
      (m) => (m.draftStatus ?? "published") === "published" && m.supplierProductId,
    ).length - kontrollerade),
  });
}
