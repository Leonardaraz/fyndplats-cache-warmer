// GET /api/cron/auction-tick
//
// Fyndauktionens hjärtslag. Pingas varje timme av GitHub Actions
// (.github/workflows/auction-tick.yml) med Bearer CRON_SECRET — samma
// mönster som poll-tracking. Varje tick:
//
//   1. SÅLD-detektering: ordrar sedan äldsta live-start skannas
//      (fetchOrders/aggregateOrders, exkluderar INITIATED/CANCELED). En order
//      på en live-auktions produkt ⇒ status=sold, priset återställs till
//      listpris (compareAtPrice rensas), nästa köad produkt främjas till platsen.
//   2. FÖRFALL: en auktion som legat ≥24 h på golvet utan köp ⇒ expired,
//      pris återställs, platsen roteras.
//   3. PRISSTEG: för live-auktioner räknas målpriset ur stegen (ren funktion,
//      lib/auction/engine) och Wix-priset PATCH:as när målsteget ändrats.
//   4. PÅFYLLNING: färre än 5 live ⇒ främja kö-produkter (lägst queueOrder).
//
// Designval: butiken (headless) visar WIX-priset som källa till sanning och
// använder stegen bara för "nästa sänkning om…"-nedräkningen. Failar en tick
// visas alltså aldrig ett lägre pris än det som debiteras — den visade
// sänkningen kommer bara senare. Golvet är vinstskyddat per produkt
// (landad kostnad × 1,29, se lib/auction/engine.buildFloor).

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { fetchOrders, aggregateOrders } from "@/lib/wix/orders";
import { isExpired, priceAt, type AuctionDoc } from "@/lib/auction/engine";
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

    // 2) Förfall: ≥24 h på golvet utan köp → återställ + rotera.
    for (const a of live) {
      if (isExpired(a, now, 24)) {
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

    // 3) Prissteg för kvarvarande live.
    for (const a of live) {
      const target = priceAt(a, now);
      if (target !== a.lastPatchedPrice) {
        try {
          // Vid första steget (target === listPrice) behövs ingen strike-through.
          const compareAt = target < a.listPrice ? a.listPrice : null;
          await patchProductPrice(a.productId, target, compareAt);
          await saveAuction({ ...a, lastPatchedPrice: target });
          push("priced", { slug: a.slug, price: target });
        } catch (e) {
          push("errors", `price ${a.slug}: ${(e as Error).message}`);
        }
      }
    }

    // 4) Påfyllning: främja kö tills 5 platser är fyllda.
    const usedSlots = new Set(live.map((a) => a.slot));
    const freeSlots = [1, 2, 3, 4, 5].filter((s) => !usedSlots.has(s)).slice(0, Math.max(0, SLOTS - live.length));
    let qi = 0;
    for (const slot of freeSlots) {
      const next = queued[qi++];
      if (!next) break;
      try {
        const promoted: AuctionDoc = {
          ...next,
          status: "live",
          slot,
          startAt: new Date(now).toISOString(),
          lastPatchedPrice: next.listPrice, // start = listpris, ingen PATCH behövs
        };
        await saveAuction(promoted);
        push("promoted", { slug: next.slug, slot });
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
