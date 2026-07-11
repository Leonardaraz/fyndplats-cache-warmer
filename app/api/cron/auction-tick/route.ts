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
//
// Designval: butiken (headless) visar WIX-priset som källa till sanning och
// använder stegen bara för "nästa sänkning om…"-nedräkningen. Failar en tick
// visas alltså aldrig ett lägre pris än det som debiteras — den visade
// sänkningen kommer bara senare. Golvet är max −7 % marginal per produkt
// (landad kostnad × 1,25 / 1,07, se lib/auction/engine.buildFloor).

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { fetchOrders, aggregateOrders } from "@/lib/wix/orders";
import { isExpired, nextStartAt, priceAt, type AuctionDoc } from "@/lib/auction/engine";
import { patchProductPrice, queryAuctions, saveAuction } from "@/lib/auction/store";

export const runtime = "nodejs";
export const maxDuration = 300;

const SLOTS = 5;

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

  const report: Record<string, unknown> = { sold: [], expired: [], priced: [], promoted: [], errors: [] };
  const push = (k: string, v: unknown) => (report[k] as unknown[]).push(v);

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
            await patchProductPrice(a.productId, a.listPrice, null); // återställ
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
          await patchProductPrice(a.productId, a.listPrice, null);
          await saveAuction({ ...a, status: "expired", endedAt: new Date(now).toISOString() });
          push("expired", a.slug);
          a.status = "expired";
        } catch (e) {
          push("errors", `expire ${a.slug}: ${(e as Error).message}`);
        }
      }
    }
    live = live.filter((a) => a.status === "live");

    // 3) Prissteg för kvarvarande live (framtida startAt ⇒ målet är redan
    //    listpriset = lastPatchedPrice, så ingen PATCH sker före 07:00).
    for (const a of live) {
      const target = priceAt(a, now);
      if (target !== a.lastPatchedPrice) {
        try {
          // Vid första steget (target === listPrice) behövs ingen strike-through.
          const compareAt = target < a.listPrice ? a.listPrice : null;
          // requireUniform: sänk aldrig priset om varianterna slutat dela ETT pris.
          await patchProductPrice(a.productId, target, compareAt, true);
          await saveAuction({ ...a, lastPatchedPrice: target });
          push("priced", { slug: a.slug, price: target });
        } catch (e) {
          push("errors", `price ${a.slug}: ${(e as Error).message}`);
        }
      }
    }

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
      const next = pool[qi++];
      if (!next) break;
      try {
        const promoted: AuctionDoc = {
          ...next,
          status: "live",
          slot,
          startAt,
          lastPatchedPrice: next.listPrice, // start = listpris, ingen PATCH behövs
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
