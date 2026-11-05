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
//   • STARTADE live-auktioner rörs ALDRIG (mitt i sin auktionsdag); live-rader
//     som väntar på nästa 07:00 får dagens pris och stege (lib/auction/seed planSeed)
//   • sold/expired behåller status/historik men får färska stegar
//   • köade + nya får status queued och ny köordning
//   • köade dokument som inte längre kvalar in TAS BORT (rapporteras)
//
// Live per-variant-priser hämtas med en GET per FLER-variant-produkt (≈90 st,
// väl under maxDuration); enkel-variant-produkter använder katalogens min-pris
// direkt (ingen extra GET). Idempotent och omkörningsbar via GitHub Actions.
//
// 30-DAGARSSPÄRREN (Leonard 2026-11-04, lib/auction/trettio-dagar.ts). Varje
// kandidat som inte redan startat prövas mot prishistoriken och sin förra
// auktion: en köad mot nästa start, en schemalagd mot sin egen. Seeden körs
// före 07 och är därmed sista grinden före starten.
//
//   ?sparr=pa|av   slår spärren på eller av (FyndplatsAppConfig) och svarar
//                  bara med läget. Av = torrläge: avslagen räknas och står i
//                  rapporten, men ingenting tas bort.
//
// ☠️ Påslaget tar bort många köade på en gång, och skyddsräcket nedan skriver
// då INGENTING (inte heller morgonens prisuppdatering). Första körningen med
// spärren på körs därför för hand med apply + force, när torrlägets tal är lästa.

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { getImportCostStore } from "@/lib/store/import-costs";
import { queryAuctions, removeAuctionsBulk, saveAuctionsBulk } from "@/lib/auction/store";
import { nextStartAt } from "@/lib/auction/engine";
import { forstaSankning, trettioDagar, type Historikdetalj } from "@/lib/auction/trettio-dagar";
import { WixReaLager, type Prisforlopp } from "@/lib/pricing/rea-lager";
import type { Lucka } from "@/lib/pricing/rea";
import { getAppConfig, saveAppConfig } from "@/lib/store/app-config";
import {
  assignQueueOrder,
  evaluateCandidate,
  headlineDiscount,
  planSeed,
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

/**
 * Sidtak för katalogläsningen. Det gamla taket (50 sidor = 5 000) slog i tyst
 * när katalogen passerade 6 000: de äldsta produkterna, bland dem hela kön och
 * dagens live-fynd, syntes inte, och en apply hade tagit bort ~390 köade fynd
 * (torrkörning 2026-09-28). Ett tak ska kasta, aldrig kapa (CLAUDE.md).
 */
const CATALOG_MAX_PAGES = 300;

/** Lättviktig V3-listning (utan varianter) för hela katalogen. */
async function fetchCatalog(): Promise<CatalogRow[]> {
  const headers = wixHeaders();
  const all: CatalogRow[] = [];
  let cursor: string | undefined;
  for (let page = 0; ; page++) {
    if (page >= CATALOG_MAX_PAGES) {
      throw new Error(`Katalogen har fler än ${CATALOG_MAX_PAGES * 100} produkter: höj CATALOG_MAX_PAGES.`);
    }
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
        // Bara HELT i lager. Delvis slut (en färg slut) räknades tidigare som
        // köpbar, men auktionskortets pris kan vara den slutsålda färgens och
        // kunden landade på "Slutsåld" (Hollywoodgungan, 2026-09-28).
        inStock: (p.inventory?.availabilityStatus ?? "IN_STOCK") === "IN_STOCK",
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

/** Spärrens läge. Ett läsfel ger torrläge och syns som ok:false i rapporten. */
async function lasSparren(): Promise<{ pa: boolean; fel?: string }> {
  try {
    return { pa: (await getAppConfig()).auktionTrettioDagar === "pa" };
  } catch (e) {
    return { pa: false, fel: `konfigurationen gick inte att läsa: ${(e as Error).message.slice(0, 120)}` };
  }
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

  // Strömbrytaren. Svarar bara med läget: raden bär hemliga nycklar.
  const sparrIn = req.nextUrl.searchParams.get("sparr");
  if (sparrIn !== null) {
    if (sparrIn !== "pa" && sparrIn !== "av") {
      return NextResponse.json({ ok: false, error: 'sparr måste vara "pa" eller "av"' }, { status: 400 });
    }
    try {
      const c = await saveAppConfig({ auktionTrettioDagar: sparrIn });
      return NextResponse.json({ ok: true, trettioDagar: c.auktionTrettioDagar === "pa" ? "pa" : "av" });
    } catch (e) {
      return NextResponse.json({ ok: false, error: (e as Error).message.slice(0, 200) }, { status: 500 });
    }
  }

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

    // 30-dagarsspärren. En startad auktion rörs aldrig (planSeed hoppar över
    // den), så den prövas inte heller.
    const nuMs = Date.now();
    const sparr = await lasSparren();
    let historik: { forlopp: Map<string, Prisforlopp>; luckor: Lucka[] } | null = null;
    let historikFel: string | undefined;
    try {
      const lager = new WixReaLager();
      const [forlopp, tillstand] = await Promise.all([lager.allaForlopp(), lager.lasTillstand()]);
      historik = { forlopp: new Map(forlopp.map((f) => [f.productId, f])), luckor: tillstand.luckor };
    } catch (e) {
      historikFel = `prishistoriken gick inte att läsa: ${(e as Error).message.slice(0, 120)}`;
    }
    const radPer = new Map(existing.map((e) => [e.productId, e]));
    const nastaStart = nextStartAt(nuMs);
    const stoppade = { prishistorik: 0, nyssAuktionerad: 0 };
    const detaljer: Partial<Record<Historikdetalj, number>> = {};
    const prov: { prishistorik: string[]; nyssAuktionerad: string[] } = { prishistorik: [], nyssAuktionerad: [] };
    const urval: SeedCandidate[] = [];
    for (const c of included) {
      const forra = radPer.get(c.productId);
      const startad = forra?.status === "live" && (!forra.startAt || Date.parse(forra.startAt) <= nuMs);
      if (startad || !historik) {
        urval.push(c);
        continue;
      }
      const start = forra?.status === "live" && forra.startAt ? forra.startAt : nastaStart;
      const utfall = trettioDagar({
        varianter: c.variantPrices.map((t) => ({ id: t.wixVariantId, listOre: Math.round(t.listPrice * 100) })),
        forlopp: historik.forlopp.get(c.productId),
        luckor: historik.luckor,
        forra,
        tSankning: forstaSankning(start, c.stepMinutes),
        nuMs,
      });
      if (utfall.ok) {
        urval.push(c);
        continue;
      }
      stoppade[utfall.skal]++;
      if (utfall.skal === "prishistorik") detaljer[utfall.detalj] = (detaljer[utfall.detalj] ?? 0) + 1;
      if (prov[utfall.skal].length < 10) prov[utfall.skal].push(c.slug);
      // Torrläge: avslaget räknas men kandidaten står kvar.
      if (!sparr.pa) urval.push(c);
    }

    const order = assignQueueOrder(urval);
    const { toSave, toRemove, skippedLive, refreshedLive, liveNotRefreshed } = planSeed(urval, existing, order, nuMs);

    const report: Record<string, unknown> = {
      apply,
      catalogTotal: catalog.length,
      multiVariantProducts: multiRows.length,
      fetchErrors: fetchErrors.slice(0, 5),
      included: urval.length,
      trettioDagar: {
        lage: sparr.pa ? "pa" : "torr",
        provade: included.length,
        stoppade,
        detaljer,
        prov,
        luckor: historik?.luckor.length ?? null,
        ...(sparr.fel || historikFel ? { fel: [sparr.fel, historikFel].filter(Boolean) } : {}),
      },
      excluded,
      excludedSamples,
      skippedLive,
      refreshedLive,
      liveNotRefreshed,
      removeFromQueue: toRemove.map((r) => r.slug),
      launchLineup: toSave
        .filter((d) => d.status === "queued" && (d.queueOrder ?? 0) <= 5)
        .sort((a, b) => a.queueOrder - b.queueOrder)
        .map((d) => ({
          queueOrder: d.queueOrder,
          slug: d.slug,
          variants: d.variantPrices?.length ?? 1,
          bestDiscount: `-${Math.round(headlineDiscount(d) * 100)}%`,
        })),
    };

    // Spärren på men historiken oläsbar: då går det inte att pröva något, och
    // ingenting skrivs (ett fynd utan prövning får inte starta).
    if (sparr.fel || historikFel) {
      if (apply && sparr.pa && historikFel) {
        report.ok = false;
        report.error = `${historikFel}; spärren är på, så inget skrevs.`;
        return NextResponse.json(report);
      }
    }

    // Skyddsräcke för den schemalagda körningen: försvinner en stor del av kön
    // på en gång är det nästan alltid katalogläsningen som brustit, inte
    // sortimentet. Då skrivs ingenting; ?force=1 kör ändå.
    const queuedBefore = existing.filter((e) => e.status === "queued").length;
    const removeLimit = Math.max(50, Math.ceil(queuedBefore * 0.2));
    const force = req.nextUrl.searchParams.get("force") === "1";
    if (apply && !force && toRemove.length > removeLimit) {
      report.ok = false;
      report.error = `Skulle ta bort ${toRemove.length} av ${queuedBefore} köade (gräns ${removeLimit}); inget skrevs. Granska rapporten och kör med force=1 om det stämmer.`;
      return NextResponse.json(report);
    }

    if (apply) {
      // Bulk (100/anrop): ~400 enskilda saves sprängde Wix Datas per-minut-kvot
      // (WDE0014) och lämnade kön halvskriven — 279/399 sparade, 0 borttagna.
      const saveErrors = await saveAuctionsBulk(toSave);
      const removeErrors = await removeAuctionsBulk(toRemove.map((d) => d._id!));
      report.saved = toSave.length - saveErrors.length;
      report.removed = toRemove.length - removeErrors.length;
      report.errors = [...saveErrors, ...removeErrors].slice(0, 10);
      report.ok = saveErrors.length === 0 && removeErrors.length === 0 && !sparr.fel && !historikFel;
    } else {
      report.ok = !sparr.fel && !historikFel;
      report.note = "Torrkörning — lägg till ?apply=1 för att skriva.";
    }

    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
