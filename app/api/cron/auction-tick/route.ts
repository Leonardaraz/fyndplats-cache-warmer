// GET /api/cron/auction-tick
//
// Fyndauktionens hjärtslag. Vercels cron (vercel.json) väcker den var tionde
// minut med Bearer CRON_SECRET. GitHub Actions (.github/workflows/auction-tick.yml)
// pingar den också, men oregelbundet (29 körningar på 122 timmar, uppmätt
// 24–29 oktober), och blir röd när ticket rapporterar ok:false.
//
// Auktionen är DAGLIG: start på ordinarie pris kl 07:00 svensk tid, en
// prissänkning i timmen, golv (max −7 % marginal) kl 18:00, dagens slut kl
// 19:00. Vad ett tick gör, och varför det tål 50 och 100 fynd om dagen, står i
// lib/auction/tick.ts. Här bor bara kopplingen till Wix.
//
// Designval: butiken (headless) visar WIX-priset som källa till sanning och
// använder stegen bara för "nästa sänkning om…"-nedräkningen. Failar en tick
// visas alltså aldrig ett lägre pris än det som debiteras — den visade
// sänkningen kommer bara senare. Golvet är max −7 % marginal per produkt
// (landad kostnad × 1,25 / 1,07, se lib/auction/engine.buildFloor).

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { fetchOrders } from "@/lib/wix/orders";
import { priceAt, variantPricesAt, type AuctionDoc } from "@/lib/auction/engine";
import { korTick, type TickRapport } from "@/lib/auction/tick";
import {
  patchProductPrice,
  patchProductVariants,
  productExists,
  queryAuctions,
  removeAuction,
  restoreListPrice,
  sparaAuktioner,
  type Skrivlage,
} from "@/lib/auction/store";
import { uppdateraProduktsidor } from "@/lib/headless/produktsidor";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Ordrarna sedan äldsta live-start läses till slutet. 50 sidor om 100 är mer
 * än butiken haft på ett år; förut lästes tre sidor, och ett 403 gav tyst inga
 * ordrar alls (`strict` kastar i stället, och ticket rapporterar felet).
 */
const ORDERSIDOR = 50;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

/** Sätt aktuellt auktionspris (per variant om trackar finns). */
async function applyStepPrice(a: AuctionDoc, nowMs: number, lage: Skrivlage): Promise<void> {
  if (a.variantPrices?.length) {
    const byVariant = new Map(
      variantPricesAt(a, nowMs).map((v) => [
        v.wixVariantId,
        { price: v.price, compareAt: v.price < v.listPrice ? v.listPrice : null },
      ]),
    );
    await patchProductVariants(a.productId, byVariant, lage);
  } else {
    const target = priceAt(a, nowMs);
    // requireUniform: enkel-pris-läget får aldrig platta ett prisspann.
    await patchProductPrice(a.productId, target, target < a.listPrice ? a.listPrice : null, true, lage);
  }
}

/** En rad i Vercels logg per tick: bara antal, så att Black Week går att följa i efterhand. */
function loggrad(r: TickRapport): string {
  const k = r.kvar;
  return [
    `mal=${r.mal ?? "-"}`,
    `sald=${r.sold.length}`,
    `slut=${r.expired.length}`,
    `steg=${r.priced.length}`,
    `framjad=${r.promoted.length}`,
    `dod=${r.removedDead.length}`,
    `fel=${r.errors.length}`,
    `kvar=${k.salda}/${k.dagslut}/${k.prissteg}/${k.framjanden}`,
    ...(r.framjandenVantar ? [`vantar=${r.framjandenVantar}`] : []),
    `wix429=${r.wix429}`,
    `tid=${r.tidMs}ms`,
    ...(r.errors.length ? [`forsta=${r.errors[0].slice(0, 160)}`] : []),
  ].join(" ");
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  try {
    const report = await korTick({
      nu: Date.now,
      lasAuktioner: (statusar, val) => queryAuctions(statusar, val),
      hamtaOrdrar: (sedanIso) => fetchOrders(sedanIso, { strict: true, maxPages: ORDERSIDOR }),
      aterstall: (a, lage) => restoreListPrice(a, lage),
      stega: applyStepPrice,
      produktFinns: productExists,
      taBort: removeAuction,
      spara: sparaAuktioner,
      uppdateraButiken: (produkter) => uppdateraProduktsidor(produkter, "auktion"),
    });
    console.log(`[auction-tick] ${loggrad(report)}`);
    return NextResponse.json(report);
  } catch (e) {
    const msg = (e as Error).message;
    console.error(`[auction-tick] föll: ${msg.slice(0, 300)}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
