// GET /api/cron/auction-seed[?apply=1]
//
// Fyller/uppdaterar Fyndauktionens pool ur HELA katalogen. Utan ?apply=1 körs
// en torrkörning som bara rapporterar vad som SKULLE hända — kör den först.
//
// För varje katalogprodukt avgör lib/auction/seed om den kvalar in (synlig,
// i lager, enhetligt variantpris, ingen befintlig rea, känd landad kostnad,
// ≥10 % rabattutrymme vid −7 %-golvet) och bygger golv + timstege. Sedan:
//
//   • LIVE-auktioner rörs ALDRIG (mitt i sin auktionsdag)
//   • sold/expired behåller status/historik men får färska priser/stegar
//     (så recycling aldrig återanvänder inaktuella priser)
//   • köade + nya får status queued och ny köordning: största rabatterna
//     som 1–5 (lanseringsfemman), resten deterministiskt blandade
//   • köade dokument som inte längre kvalar in TAS BORT (rapporteras)
//
// Idempotent och omkörningsbar: trigga via GitHub Actions "auction-seed"
// (workflow_dispatch) när katalogen fått nya produkter eller priser ändrats.

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { getImportCostStore } from "@/lib/store/import-costs";
import type { AuctionDoc } from "@/lib/auction/engine";
import { queryAuctions, removeAuction, saveAuction } from "@/lib/auction/store";
import {
  assignQueueOrder,
  discountOf,
  evaluateCandidate,
  type SeedCandidate,
  type SeedInput,
  type SeedRejection,
} from "@/lib/auction/seed";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const WIX_BASE = "https://www.wixapis.com";

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

interface CatalogRow {
  id: string;
  slug: string;
  name: string;
  visible: boolean;
  inStock: boolean;
  priceMin: number;
  priceMax: number;
  hasCompareAt: boolean;
}

/** Lättviktig V3-listning med exakt de fält urvalet behöver. */
async function fetchCatalog(): Promise<CatalogRow[]> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const headers = {
    "Content-Type": "application/json",
    Authorization: token,
    "wix-site-id": process.env.HEADLESS_WIX_SITE_ID || "e6d27e90-4749-4720-9afe-0bbe91c1b3d3",
  };
  const all: CatalogRow[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    const cursorPaging: Record<string, unknown> = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    const res = await fetch(`${WIX_BASE}/stores/v3/products/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ search: { cursorPaging } }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`V3 search (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      products?: Array<{
        id: string;
        slug: string;
        name: string;
        visible?: boolean;
        inventory?: { availabilityStatus?: string };
        actualPriceRange?: { minValue?: { amount?: string }; maxValue?: { amount?: string } };
        compareAtPriceRange?: { minValue?: { amount?: string }; maxValue?: { amount?: string } };
      }>;
      pagingMetadata?: { cursors?: { next?: string }; hasNext?: boolean };
    };
    for (const p of data.products ?? []) {
      all.push({
        id: p.id,
        slug: p.slug,
        name: p.name,
        visible: p.visible !== false,
        inStock: p.inventory?.availabilityStatus !== "OUT_OF_STOCK",
        priceMin: Number(p.actualPriceRange?.minValue?.amount ?? Number.NaN),
        priceMax: Number(p.actualPriceRange?.maxValue?.amount ?? Number.NaN),
        hasCompareAt: Number(p.compareAtPriceRange?.maxValue?.amount ?? 0) > 0,
      });
    }
    cursor = data.pagingMetadata?.cursors?.next;
    if (!cursor || data.pagingMetadata?.hasNext === false || (data.products?.length ?? 0) === 0) break;
  }
  return all;
}

/** Kör `fn` över alla items med begränsad parallellism. */
async function pool<T>(items: T[], limit: number, fn: (t: T) => Promise<void>): Promise<string[]> {
  const errors: string[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      try {
        await fn(item);
      } catch (e) {
        errors.push((e as Error).message.slice(0, 200));
      }
    }
  });
  await Promise.all(workers);
  return errors;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }
  const apply = req.nextUrl.searchParams.get("apply") === "1";

  try {
    const [catalog, mappings, overrides, existing] = await Promise.all([
      fetchCatalog(),
      getStore().listMappings(),
      getImportCostStore()
        .listAll()
        .catch(() => []),
      queryAuctions(["queued", "live", "sold", "expired"]),
    ]);

    // Högsta landade kostnaden per produkt (värsta varianten sätter golvet).
    const costByProduct = new Map<string, number>();
    for (const m of mappings) {
      const costs = (m.variants ?? [])
        .map((v) => v.landedCostSek)
        .filter((c): c is number => typeof c === "number" && c > 0);
      if (costs.length > 0) costByProduct.set(m.wixProductId, Math.max(...costs));
    }
    for (const o of overrides) {
      if (o.costSek > 0) costByProduct.set(o.productId, o.costSek);
    }

    const excluded: Record<SeedRejection, number> = {
      hidden: 0,
      outOfStock: 0,
      noPrice: 0,
      variantPriceSpread: 0,
      existingSale: 0,
      noCost: 0,
      thinMargin: 0,
    };
    const excludedSamples: Partial<Record<SeedRejection, string[]>> = {};
    const included: SeedCandidate[] = [];

    for (const row of catalog) {
      const input: SeedInput = {
        productId: row.id,
        slug: row.slug,
        name: row.name,
        visible: row.visible,
        inStock: row.inStock,
        priceMin: row.priceMin,
        priceMax: row.priceMax,
        hasCompareAt: row.hasCompareAt,
        landedCostSek: costByProduct.get(row.id) ?? null,
      };
      const verdict = evaluateCandidate(input);
      if (verdict.ok) {
        included.push(verdict.doc);
      } else {
        excluded[verdict.reason]++;
        (excludedSamples[verdict.reason] ??= []).length < 20 &&
          excludedSamples[verdict.reason]!.push(row.slug);
      }
    }

    const order = assignQueueOrder(included);
    const byProductId = new Map(existing.map((e) => [e.productId, e]));

    const toSave: AuctionDoc[] = [];
    const skippedLive: string[] = [];
    for (const cand of included) {
      const prev = byProductId.get(cand.productId);
      if (prev?.status === "live") {
        skippedLive.push(cand.slug);
        continue;
      }
      const keepEnded = prev?.status === "sold" || prev?.status === "expired";
      toSave.push({
        _id: `auction-${cand.productId}`,
        ...cand,
        slot: 0,
        status: keepEnded ? prev!.status : "queued",
        queueOrder: order.get(cand.productId) ?? 9999,
        ...(keepEnded ? { endedAt: prev!.endedAt, soldPrice: prev!.soldPrice } : {}),
      });
    }

    // Köade dokument vars produkt inte längre kvalar in → bort ur kön.
    const includedIds = new Set(included.map((c) => c.productId));
    const toRemove = existing.filter((e) => e.status === "queued" && !includedIds.has(e.productId));

    const report: Record<string, unknown> = {
      apply,
      catalogTotal: catalog.length,
      mappingsWithCost: costByProduct.size,
      included: included.length,
      excluded,
      excludedSamples,
      skippedLive,
      removeFromQueue: toRemove.map((r) => r.slug),
      launchLineup: toSave
        .filter((d) => (d.queueOrder ?? 0) <= 5)
        .sort((a, b) => a.queueOrder - b.queueOrder)
        .map((d) => ({
          queueOrder: d.queueOrder,
          slug: d.slug,
          listPrice: d.listPrice,
          floorPrice: d.floorPrice,
          discount: `-${Math.round(discountOf(d) * 100)}%`,
        })),
    };

    if (apply) {
      const saveErrors = await pool(toSave, 8, (d) => saveAuction(d));
      const removeErrors = await pool(toRemove, 8, (d) => removeAuction(d._id!));
      report.saved = toSave.length - saveErrors.length;
      report.removed = toRemove.length - removeErrors.length;
      report.errors = [...saveErrors, ...removeErrors].slice(0, 10);
      report.ok = saveErrors.length === 0 && removeErrors.length === 0;
    } else {
      report.ok = true;
      report.note = "Torrkörning — lägg till ?apply=1 för att skriva.";
    }

    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
