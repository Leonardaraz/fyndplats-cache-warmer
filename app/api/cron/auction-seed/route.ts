// GET /api/cron/auction-seed[?apply=1]
//
// Fyller/uppdaterar Fyndauktionens pool ur HELA katalogen. Utan ?apply=1 körs
// en torrkörning som bara rapporterar vad som SKULLE hända — kör den först.
//
// Varje produkt byggs som PER-VARIANT-auktion: varje variant får sin egen stege
// från sitt ordinariepris (LIVE-priset i katalogen) till sitt eget −7 %-golv
// (ur variantens landade kostnad i FyndplatsMappings). Enkel-variant-produkter
// blir en en-element-track. lib/auction/seed avgör kvalificering (synlig, i
// lager, ingen befintlig rea, känd kostnad per variant, ≥10 % rabatt på minst
// en variant) och köordning. Sedan:
//
//   • LIVE-auktioner rörs ALDRIG (mitt i sin auktionsdag)
//   • sold/expired behåller status/historik men får färska stegar
//   • köade + nya får status queued och ny köordning
//   • köade dokument som inte längre kvalar in TAS BORT (rapporteras)
//
// Live per-variant-priser hämtas med en GET per FLER-variant-produkt (≈90 st,
// väl under maxDuration); enkel-variant-produkter använder katalogens min-pris
// direkt (ingen extra GET). Idempotent och omkörningsbar via GitHub Actions.

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { getImportCostStore } from "@/lib/store/import-costs";
import type { AuctionDoc } from "@/lib/auction/engine";
import { queryAuctions, removeAuctionsBulk, saveAuctionsBulk } from "@/lib/auction/store";
import {
  assignQueueOrder,
  evaluateCandidate,
  headlineDiscount,
  type SeedCandidate,
  type SeedInput,
  type SeedRejection,
  type SeedVariantInput,
} from "@/lib/auction/seed";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const WIX_BASE = "https://www.wixapis.com";

function wixHeaders(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  return {
    "Content-Type": "application/json",
    Authorization: token,
    "wix-site-id": process.env.HEADLESS_WIX_SITE_ID || "e6d27e90-4749-4720-9afe-0bbe91c1b3d3",
  };
}

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
  variantCount: number;
  hasCompareAt: boolean;
  priceMin: number;
}

/** Lättviktig V3-listning (utan varianter) för hela katalogen. */
async function fetchCatalog(): Promise<CatalogRow[]> {
  const headers = wixHeaders();
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
        variantSummary?: { variantCount?: number };
        actualPriceRange?: { minValue?: { amount?: string } };
        compareAtPriceRange?: { maxValue?: { amount?: string } };
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
        variantCount: p.variantSummary?.variantCount ?? 1,
        hasCompareAt: Number(p.compareAtPriceRange?.maxValue?.amount ?? 0) > 0,
        priceMin: Number(p.actualPriceRange?.minValue?.amount ?? Number.NaN),
      });
    }
    cursor = data.pagingMetadata?.cursors?.next;
    if (!cursor || data.pagingMetadata?.hasNext === false || (data.products?.length ?? 0) === 0) break;
  }
  return all;
}

/** Live per-variant-priser för en fler-variant-produkt (en GET). */
async function fetchProductVariants(productId: string): Promise<Array<{ id: string; price: number }>> {
  const res = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, { method: "GET", headers: wixHeaders() });
  if (!res.ok) throw new Error(`GET ${productId} ${res.status}`);
  const data = (await res.json()) as {
    product?: { variantsInfo?: { variants?: Array<{ id: string; price?: { actualPrice?: { amount?: string } } }> } };
  };
  return (data.product?.variantsInfo?.variants ?? [])
    .map((v) => ({ id: v.id, price: Number(v.price?.actualPrice?.amount ?? Number.NaN) }))
    .filter((v) => v.id && Number.isFinite(v.price) && v.price > 0);
}

/** Kör `fn` över alla items med begränsad parallellism; samlar fel. */
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

    // Per-variant landad kostnad (variantId → kostnad) och produkt-override.
    const costByVariant = new Map<string, Map<string, number>>();
    const mappingVariants = new Map<string, Array<{ wixVariantId: string; landedCostSek: number }>>();
    for (const m of mappings) {
      const per = new Map<string, number>();
      const list: Array<{ wixVariantId: string; landedCostSek: number }> = [];
      for (const v of m.variants ?? []) {
        if (v.wixVariantId && typeof v.landedCostSek === "number" && v.landedCostSek > 0) {
          per.set(v.wixVariantId, v.landedCostSek);
          list.push({ wixVariantId: v.wixVariantId, landedCostSek: v.landedCostSek });
        }
      }
      if (per.size > 0) costByVariant.set(m.wixProductId, per);
      if (list.length > 0) mappingVariants.set(m.wixProductId, list);
    }
    const overrideCost = new Map<string, number>();
    for (const o of overrides) if (o.costSek > 0) overrideCost.set(o.productId, o.costSek);

    // Fler-variant-produkter kräver live per-variant-priser (en GET var).
    const multiRows = catalog.filter((r) => r.variantCount > 1 || (mappingVariants.get(r.id)?.length ?? 0) > 1);
    const liveVariants = new Map<string, Array<{ id: string; price: number }>>();
    const fetchErrors = await pool(multiRows, 6, async (r) => {
      liveVariants.set(r.id, await fetchProductVariants(r.id));
    });

    const excluded: Record<SeedRejection, number> = {
      hidden: 0,
      outOfStock: 0,
      noVariants: 0,
      existingSale: 0,
      noCost: 0,
      thinMargin: 0,
    };
    const excludedSamples: Partial<Record<SeedRejection, string[]>> = {};
    const included: SeedCandidate[] = [];

    for (const row of catalog) {
      const override = overrideCost.get(row.id);
      let variants: SeedVariantInput[];
      const live = liveVariants.get(row.id);
      if (live && live.length > 0) {
        // Fler-variant: LIVE-pris per variant, kostnad joinad på variant-id.
        const per = costByVariant.get(row.id);
        variants = live.map((lv) => ({
          wixVariantId: lv.id,
          listPrice: lv.price,
          landedCostSek: override ?? per?.get(lv.id) ?? null,
        }));
      } else {
        // Enkel-variant: katalogens min-pris + mappningens (enda) variant/kostnad.
        const mv = mappingVariants.get(row.id)?.[0];
        variants = [
          {
            wixVariantId: mv?.wixVariantId ?? "",
            listPrice: row.priceMin,
            landedCostSek: override ?? mv?.landedCostSek ?? null,
          },
        ];
      }

      const input: SeedInput = {
        productId: row.id,
        slug: row.slug,
        name: row.name,
        visible: row.visible,
        inStock: row.inStock,
        hasCompareAt: row.hasCompareAt,
        variants,
      };
      const verdict = evaluateCandidate(input);
      if (verdict.ok && input.variants.every((v) => v.wixVariantId)) {
        included.push(verdict.doc);
      } else if (verdict.ok) {
        // Kvalificerad men saknar variant-id (produkt utan mappning) → hoppa.
        excluded.noCost++;
        (excludedSamples.noCost ??= []).length < 20 && excludedSamples.noCost!.push(row.slug);
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

    const includedIds = new Set(included.map((c) => c.productId));
    const toRemove = existing.filter((e) => e.status === "queued" && !includedIds.has(e.productId));

    const report: Record<string, unknown> = {
      apply,
      catalogTotal: catalog.length,
      multiVariantProducts: multiRows.length,
      fetchErrors: fetchErrors.slice(0, 5),
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
          variants: d.variantPrices?.length ?? 1,
          bestDiscount: `-${Math.round(headlineDiscount(d) * 100)}%`,
        })),
    };

    if (apply) {
      // Bulk (100/anrop): ~400 enskilda saves sprängde Wix Datas per-minut-kvot
      // (WDE0014) och lämnade kön halvskriven — 279/399 sparade, 0 borttagna.
      const saveErrors = await saveAuctionsBulk(toSave);
      const removeErrors = await removeAuctionsBulk(toRemove.map((d) => d._id!));
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
