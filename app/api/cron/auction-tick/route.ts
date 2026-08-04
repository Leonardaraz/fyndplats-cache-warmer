// GET /api/cron/auction-tick
//
// Fyndauktionens hjärtslag. Pingas varje timme av GitHub Actions
// (.github/workflows/auction-tick.yml) med Bearer CRON_SECRET — samma
// mönster som poll-tracking. Auktionen är DAGLIG: start på ordinarie pris
// kl 07:00 svensk tid, en prissänkning i timmen, golv (max −7 % marginal)
// kl 18:00, dagens slut kl 19:00. Varje tick:
//
//   1. SÅLD-detektering: ordrar sedan äldsta live-start skannas
//      (fetchOrders/aggregateOrders, exkluderar INITIATED/CANCELED). En order
//      på en live-auktions produkt ⇒ status=sold, priset återställs till
//      listpris (compareAtPrice rensas), platsen fylls på (start nästa 07:00).
//   2. DAGSLUT: kl 19:00 (start + 12 h) ⇒ expired, pris återställs, platsen
//      roteras till nästa produkt.
//   3. PRISSTEG: för live-auktioner räknas målpriset ur den timindexerade
//      stegen (ren funktion, lib/auction/engine) och Wix-priset PATCH:as när
//      målsteget ändrats. Ett framtida startAt ger listpris ⇒ ingen PATCH.
//   4. PÅFYLLNING: färre än 5 live ⇒ främja kö-produkter (lägst queueOrder)
//      med startAt = NÄSTA 07:00 svensk tid. Sinar kön återvinns avslutade
//      auktioner (äldst endedAt först) — hjulet snurrar för evigt.
//   5. SJÄLVLÄKNING: en auktion vars produkt RADERATS ur katalogen (pris-
//      PATCH:en 404:ar) tas bort och sloten frigörs samma tick. Utan detta
//      fastnar raden som evig live-zombie — varken expire eller prissteg kan
//      genomföras — och dagens lineup krymper (så /fyndauktion hamnade på 2
//      produkter i aug 2026: tre raderade produkter höll slot 1, 2 och 5).
//
// Designval: butiken (headless) visar WIX-priset som källa till sanning och
// använder stegen bara för "nästa sänkning om…"-nedräkningen. Failar en tick
// visas alltså aldrig ett lägre pris än det som debiteras — den visade
// sänkningen kommer bara senare. Golvet är max −7 % marginal per produkt
// (landad kostnad × 1,25 / 1,07, se lib/auction/engine.buildFloor).

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { fetchOrders, aggregateOrders } from "@/lib/wix/orders";
import { isExpired, nextStartAt, priceAt, stepIndexAt, variantPricesAt, type AuctionDoc } from "@/lib/auction/engine";
import {
  isProductGone,
  patchProductPrice,
  patchProductVariants,
  productExists,
  queryAuctions,
  removeAuction,
  saveAuction,
} from "@/lib/auction/store";

export const runtime = "nodejs";
export const maxDuration = 300;

const SLOTS = 5;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

/** Återställ produkten till ordinariepris (per variant om trackar finns). */
async function restoreListPrice(a: AuctionDoc): Promise<void> {
  if (a.variantPrices?.length) {
    const byVariant = new Map(a.variantPrices.map((t) => [t.wixVariantId, { price: t.listPrice, compareAt: null }]));
    await patchProductVariants(a.productId, byVariant);
  } else {
    await patchProductPrice(a.productId, a.listPrice, null);
  }
}

/** Sätt aktuellt auktionspris (per variant om trackar finns). */
async function applyStepPrice(a: AuctionDoc, nowMs: number): Promise<void> {
  if (a.variantPrices?.length) {
    const byVariant = new Map(
      variantPricesAt(a, nowMs).map((v) => [
        v.wixVariantId,
        { price: v.price, compareAt: v.price < v.listPrice ? v.listPrice : null },
      ]),
    );
    await patchProductVariants(a.productId, byVariant);
  } else {
    const target = priceAt(a, nowMs);
    // requireUniform: enkel-pris-läget får aldrig platta ett prisspann.
    await patchProductPrice(a.productId, target, target < a.listPrice ? a.listPrice : null, true);
  }
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  const report: Record<string, unknown> = { sold: [], expired: [], priced: [], promoted: [], removedDead: [], errors: [] };
  const push = (k: string, v: unknown) => (report[k] as unknown[]).push(v);

  /**
   * Produkten är raderad ur katalogen → auktionsdokumentet är meningslöst och
   * FARLIGT: en live-rad vars pris-PATCH alltid 404:ar kan varken stega,
   * säljas eller avslutas — den blir en evig zombie som blockerar sin slot.
   * Släng dokumentet och markera raden avslutad i minnet så sloten frigörs
   * redan i detta tick (påfyllningen i steg 4 ser den som ledig).
   */
  const retireDead = async (a: AuctionDoc) => {
    try {
      await removeAuction(a._id ?? `auction-${a.productId}`);
      push("removedDead", a.slug);
      a.status = "expired";
    } catch (e) {
      push("errors", `removeDead ${a.slug}: ${(e as Error).message}`);
    }
  };

  try {
    const now = Date.now();
    const all = await queryAuctions(["live", "queued"]);
    let live = all.filter((a) => a.status === "live");
    const queued = all.filter((a) => a.status === "queued").sort((a, b) => a.queueOrder - b.queueOrder);

    // 1) Såld-detektering — en sökning för alla live-auktioner.
    if (live.length > 0) {
      const oldestStart = live
        .map((a) => (a.startAt ? Date.parse(a.startAt) : now))
        .reduce((m, t) => Math.min(m, t), now);
      const orders = await fetchOrders(new Date(oldestStart).toISOString(), { maxPages: 3 });
      const agg = aggregateOrders(orders);
      for (const a of live) {
        const hit = agg.byProductId[a.productId];
        const soldAfterStart = hit?.lastSoldAt && a.startAt && Date.parse(hit.lastSoldAt) >= Date.parse(a.startAt);
        if (soldAfterStart) {
          try {
            try {
              await restoreListPrice(a); // återställ till ordinariepris
            } catch (e) {
              // Produkt raderad efter köpet ⇒ inget pris att återställa, men
              // affären är verklig — spara sold-historiken ändå.
              if (!isProductGone(e)) throw e;
            }
            await saveAuction({ ...a, status: "sold", endedAt: new Date(now).toISOString(), soldPrice: a.lastPatchedPrice ?? a.listPrice });
            push("sold", { slug: a.slug, soldPrice: a.lastPatchedPrice ?? a.listPrice });
            a.status = "sold";
          } catch (e) {
            push("errors", `sold ${a.slug}: ${(e as Error).message}`);
          }
        }
      }
      live = live.filter((a) => a.status === "live");
    }

    // 2) Dagslut: 19:00 (start + 12 h) → återställ + rotera.
    for (const a of live) {
      if (isExpired(a, now)) {
        try {
          await restoreListPrice(a);
          await saveAuction({ ...a, status: "expired", endedAt: new Date(now).toISOString() });
          push("expired", a.slug);
          a.status = "expired";
        } catch (e) {
          if (isProductGone(e)) await retireDead(a);
          else push("errors", `expire ${a.slug}: ${(e as Error).message}`);
        }
      }
    }
    live = live.filter((a) => a.status === "live");

    // 3) Prissteg för kvarvarande live. Gate: per-variant på stegindex (så alla
    //    trackar följer med även om visningsstegen står stilla en timme),
    //    enkel-pris på visningspriset (bakåtkompat). Framtida startAt ⇒ idx=0
    //    och priset är redan ordinarie, så ingen PATCH sker före 07:00.
    for (const a of live) {
      const idx = stepIndexAt(a, now);
      const displayTarget = priceAt(a, now);
      const needPatch = a.variantPrices?.length ? idx !== (a.lastPatchedStep ?? -1) : displayTarget !== a.lastPatchedPrice;
      if (needPatch) {
        try {
          await applyStepPrice(a, now);
          await saveAuction({ ...a, lastPatchedStep: idx, lastPatchedPrice: displayTarget });
          push("priced", { slug: a.slug, price: displayTarget });
        } catch (e) {
          if (isProductGone(e)) await retireDead(a);
          else push("errors", `price ${a.slug}: ${(e as Error).message}`);
        }
      }
    }
    live = live.filter((a) => a.status === "live");

    // 4) Påfyllning: främja kö tills 5 platser är fyllda, start nästa 07:00.
    //    Sinar kön återvinns avslutade auktioner (äldst avslutad först) —
    //    varje produkt har exakt ETT dokument (_id = auction-<productId>),
    //    så en återvinning är samma dokument som flippas tillbaka till live.
    const usedSlots = new Set(live.map((a) => a.slot));
    const freeSlots = [1, 2, 3, 4, 5].filter((s) => !usedSlots.has(s)).slice(0, Math.max(0, SLOTS - live.length));
    let pool: AuctionDoc[] = [...queued];
    if (pool.length < freeSlots.length) {
      const ended = await queryAuctions(["sold", "expired"]);
      const recyclable = ended
        .filter((e) => e.floorPrice < e.listPrice) // hoppa produkter utan rabattutrymme
        .sort((x, y) => Date.parse(x.endedAt ?? "1970-01-01") - Date.parse(y.endedAt ?? "1970-01-01"));
      pool = pool.concat(recyclable);
      if (recyclable.length > 0) report.recycled = recyclable.slice(0, freeSlots.length - queued.length).map((r) => r.slug);
    }
    const startAt = freeSlots.length > 0 ? nextStartAt(now) : undefined;
    let qi = 0;
    for (const slot of freeSlots) {
      // Kandidater vars produkt raderats ur katalogen hoppar vi över (och
      // slänger dokumentet) — en blind främjning ger annars en död auktion
      // som bränner sloten en hel dag innan retireDead städar den.
      let next: AuctionDoc | undefined;
      while ((next = pool[qi++]) !== undefined) {
        if (await productExists(next.productId)) break;
        await retireDead(next);
      }
      if (!next) break;
      try {
        const promoted: AuctionDoc = {
          ...next,
          status: "live",
          slot,
          startAt,
          lastPatchedPrice: next.listPrice, // start = listpris, ingen PATCH behövs
          lastPatchedStep: 0,
          endedAt: undefined,
          soldPrice: undefined,
        };
        await saveAuction(promoted);
        push("promoted", { slug: next.slug, slot, startAt });
      } catch (e) {
        push("errors", `promote ${next.slug}: ${(e as Error).message}`);
      }
    }

    report.ok = (report.errors as unknown[]).length === 0;
    report.liveCount = live.length + (report.promoted as unknown[]).length;
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message, report }, { status: 500 });
  }
}
