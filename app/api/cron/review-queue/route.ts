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
import { listVisibleV3ProductIds } from "@/lib/wix/v3-products";
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
  // Flyttar omkontroll-gränsen framåt i tiden. Behövs när ett filter rättats:
  // recensionen som sorterades bort av buggen finns kvar hos AE, men stämpeln
  // säger "kollad" och gömmer produkten i RECHECK_DAYS dygn. Så förlorade
  // torktumlaren en fullt vettig recension 2026-08-17 (dedupKey klistrade ihop
  // ord → falsk spam-dom, rättat i #450).
  //
  // Sätt `checkedBefore` till klockslaget då svepet STARTADE, samma värde i
  // varje runda. Då betas katalogen av precis en gång och rundorna konvergerar
  // mot 0 kandidater av sig själva — till skillnad från ett trubbigt
  // "strunta i stämpeln", som aldrig tar slut.
  const checkedBeforeRaw = url.searchParams.get("checkedBefore");
  const checkedBefore = checkedBeforeRaw ? Date.parse(checkedBeforeRaw) : NaN;

  const nu = Date.now();
  // Ett uttryckligt `checkedBefore` vinner över standardintervallet, men bara
  // framåt: ett datum längre bak än RECHECK_DAYS skulle SNÄVA IN svepet, och
  // ett skrivfel ska inte tyst göra en körning mindre än den normala.
  const standardGräns = nu - RECHECK_DAYS * 24 * 3600 * 1000;
  const gräns = Number.isFinite(checkedBefore) ? Math.max(standardGräns, checkedBefore) : standardGräns;

  let mappings;
  try {
    mappings = await getStore().listMappings();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "kunde inte läsa mappningar", detail: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }

  // VILKA PRODUKTER RÄKNAS? Wix `visible`, inte mappningens draftStatus.
  //
  // draftStatus speglar bara vad som hände i granskningskön VID IMPORTEN. Den
  // följer inte med när en produkt senare publiceras eller poleras. Uppmätt
  // 2026-08-18: campingtoaletten står som `rejected` men är publicerad, polerad
  // och kostar 599 kr — den har 107 omdömen hos leverantören varav 15 klarar
  // filtret, och fick noll eftersom svepet aldrig tittade på den. 162 mappningar
  // bär den statusen.
  //
  // Fail-open: går listningen inte att hämta faller vi tillbaka på den gamla
  // draftStatus-regeln i stället för att svepa noll produkter.
  let synliga: Set<string> | null = null;
  try {
    synliga = await listVisibleV3ProductIds();
    console.log(`[review-queue] ${synliga.size} synliga produkter i butiken.`);
  } catch (err) {
    console.warn(
      "[review-queue] kunde inte lista synliga produkter, faller tillbaka på draftStatus:",
      err instanceof Error ? err.message : err,
    );
  }
  const räknasMed = (m: ProductMappingRecord) =>
    synliga
      ? synliga.has(String(m.wixProductId))
      // Rader utan draftStatus är gamla och räknas som publicerade (samma
      // regel som backfill-deps använder).
      : (m.draftStatus ?? "published") === "published";

  const kandidater = ((mappings ?? []) as ProductMappingRecord[])
    .filter((m) => m.supplierProductId && m.wixProductId && räknasMed(m))
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
    omkontrollGräns: new Date(gräns).toISOString(),
    kandidater: kandidater.length,
    kontrollerade,
    strypta,
    köade,
    produkterMedNytt: produkterMedNytt.slice(0, 50),
    // Så nästa körning vet om det finns mer att beta av.
    kvarAttKontrollera: Math.max(0, ((mappings ?? []) as ProductMappingRecord[]).filter(
      (m) => m.supplierProductId && m.wixProductId && räknasMed(m),
    ).length - kontrollerade),
  });
}
