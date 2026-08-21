// GET/POST /api/cron/price-repair
//
// Efterhands-reparation av produkter vars varianter delar inköpspris.
//
// price-trust.ts (PR #486) hindrar NYA importer från att nå kund med sidans
// baspris på alla varianter. Den gör ingenting åt dem som redan ligger i
// butiken: Leonards tre produkter 2026-08-20 (4-pack och 6-pack båda 589 kr,
// två spegelstorlekar båda 1279 kr) säljer fortfarande den dyra varianten till
// den billigas pris.
//
// TVÅ STEG, OCH DE ÄR MEDVETET ÅTSKILDA:
//
//   GET  → TORRKÖRNING. Letar kandidater, slår upp facit hos AliExpress och
//          returnerar en plan per produkt: variant för variant, gammalt pris →
//          nytt pris, ny marginal. SKRIVER INGENTING.
//   POST → verkställer, men BARA för de wixProductId du räknar upp i kroppen.
//          Det finns ingen "kör allt"-flagga. Ett pris som når kund ska ha
//          passerat mänskliga ögon, och listan med id:n ÄR den kvitteringen.
//
// Kandidat ≠ trasig. Att alla varianter kostar lika mycket är fullkomligt
// normalt (färgvarianter gör nästan alltid det), så sökningen är bred med
// flit: DS-uppslaget avgör, och stämmer priserna blir planen tom. En variant
// vars inköpspris är oförändrat rörs aldrig — varken pris eller kostnad.
//
// Tre fält skrivs per rättad variant, aldrig bara det första:
//   grossSek       → Wix (det kunden betalar)
//   costUsd        → mappningen
//   landedCostSek  → mappningen. Lätt att glömma och värst att missa:
//                    lönsamhetsöversikten och auktionens GOLVBUD läser det.
//                    Rättas bara priset ser marginalen fantastisk ut och
//                    auktionen kan sälja under inköp.
//
// Query (GET):
//   ?limit=25            antal kandidater att slå upp denna körning
//   ?wixProductId=...    granska EN produkt (hoppar över kandidatsökningen)
//   ?minMargin=10        golv för nyräknad marginal (under → blockeras)
//
// Body (POST):
//   { "wixProductIds": ["...", "..."] }

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { isDryRun } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { getPricingRules } from "@/lib/store/pricing-config";
import { getProduct } from "@/lib/aliexpress/client";
import { updateV3VariantPrices } from "@/lib/wix/v3-products";
import {
  DEFAULT_MIN_MARGIN_PCT,
  planPriceRepair,
  sharesOneCost,
  type PriceRepairPlan,
} from "@/lib/import/price-repair";
import type { ProductMappingRecord } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 300;

// Under ruttens maxDuration (300 s) med marginal: varje produkt drar ett
// DS-anrop och, i apply-läge, en Wix-GET + en PATCH. Bryts körningen i stället
// av plattformen får man inget svar alls och vet inte vad som hann skrivas.
const TIME_BUDGET_MS = 240_000;

function isCronAuthorized(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

interface ProduktPlan {
  wixProductId: string;
  supplierProductId: string;
  namn: string;
  plan: PriceRepairPlan;
}

/** Slår upp facit hos AliExpress och bygger planen för en mappning. */
async function planeraEn(
  mapping: ProductMappingRecord,
  minMargin: number,
): Promise<ProduktPlan | { wixProductId: string; fel: string }> {
  const rules = await getPricingRules();
  try {
    const ds = await getProduct(mapping.supplierProductId);
    const plan = planPriceRepair(mapping.variants ?? [], ds.variants ?? [], {
      rules,
      category: mapping.categorySuggestion?.collectionName ?? null,
      minMarginPct: minMargin,
    });
    return {
      wixProductId: mapping.wixProductId,
      supplierProductId: mapping.supplierProductId,
      namn: mapping.seoTitle || ds.title || mapping.wixProductId,
      plan,
    };
  } catch (err) {
    return {
      wixProductId: mapping.wixProductId,
      fel: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    };
  }
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") ?? 25), 100));
  const minMargin = Number(url.searchParams.get("minMargin") ?? DEFAULT_MIN_MARGIN_PCT);
  const enda = url.searchParams.get("wixProductId");

  const store = getStore();
  const alla = await store.listMappings();
  const kandidater = enda
    ? alla.filter((m) => m.wixProductId === enda)
    : alla.filter((m) => sharesOneCost(m.variants ?? []));

  const start = Date.now();
  const planer: ProduktPlan[] = [];
  const fel: { wixProductId: string; fel: string }[] = [];
  let uppslagna = 0;
  for (const m of kandidater.slice(0, limit)) {
    if (Date.now() - start > TIME_BUDGET_MS) break;
    uppslagna++;
    const r = await planeraEn(m, minMargin);
    if ("fel" in r) fel.push(r);
    else if (r.plan.changes.length > 0 || r.plan.blockers.length > 0) planer.push(r);
  }

  const attRätta = planer.filter((p) => p.plan.changes.length > 0);
  return NextResponse.json({
    ok: true,
    torrkörning: true,
    kandidater: kandidater.length,
    uppslagna,
    kvarAttSlåUpp: Math.max(0, kandidater.length - uppslagna),
    produkterAttRätta: attRätta.length,
    varianterAttRätta: attRätta.reduce((n, p) => n + p.plan.changes.length, 0),
    // Klart att klistra in i POST-kroppen när siffrorna ser rätt ut.
    wixProductIds: attRätta.map((p) => p.wixProductId),
    planer,
    fel,
  });
}

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: { wixProductIds?: unknown; minMargin?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "ogiltig JSON" }, { status: 400 });
  }
  const ids = Array.isArray(body.wixProductIds)
    ? body.wixProductIds.map((s) => String(s)).filter(Boolean)
    : [];
  if (ids.length === 0) {
    // Ingen "kör allt"-väg. Utan explicita id:n vet vi inte att någon läst
    // torrkörningen, och då ska inga priser flytta sig.
    return NextResponse.json(
      { ok: false, error: "wixProductIds saknas — kör GET först och klistra in listan därifrån." },
      { status: 400 },
    );
  }
  const minMargin = Number(body.minMargin ?? DEFAULT_MIN_MARGIN_PCT);

  const store = getStore();
  const alla = await store.listMappings();
  const perId = new Map(alla.map((m) => [m.wixProductId, m]));

  const start = Date.now();
  const rättade: Array<{
    wixProductId: string;
    namn: string;
    varianter: Array<{ label: string; från: number; till: number; marginal: number }>;
  }> = [];
  const hoppade: Array<{ wixProductId: string; skäl: string }> = [];
  let skrivnaVarianter = 0;

  for (const id of ids) {
    if (Date.now() - start > TIME_BUDGET_MS) {
      hoppade.push({ wixProductId: id, skäl: "tidsbudgeten tog slut — kör igen för resten" });
      continue;
    }
    const mapping = perId.get(id);
    if (!mapping) {
      hoppade.push({ wixProductId: id, skäl: "ingen mappning med det id:t" });
      continue;
    }
    const r = await planeraEn(mapping, minMargin);
    if ("fel" in r) {
      hoppade.push({ wixProductId: id, skäl: r.fel });
      continue;
    }
    if (r.plan.blockers.length > 0) {
      // Blockerad plan skrivs ALDRIG delvis. Ett halvrättat pris är svårare att
      // upptäcka än ett helt orört.
      hoppade.push({ wixProductId: id, skäl: `blockerad: ${r.plan.blockers.join(" · ")}` });
      continue;
    }
    if (r.plan.changes.length === 0) {
      hoppade.push({ wixProductId: id, skäl: "inget att rätta (priserna stämmer)" });
      continue;
    }

    try {
      // 1) WIX FÖRST. Går skrivningen mot butiken igenom men mappningen inte,
      // står kunden inför rätt pris medan vår bokföring är gammal — irriterande
      // men ofarligt, och nästa körning rättar det. Omvänd ordning hade i
      // stället gjort mappningen "rättad" medan kunden köper till fel pris,
      // och då hittar ingen felet igen.
      const w = isDryRun()
        ? { updated: r.plan.changes.length, missing: [] as string[] }
        : await updateV3VariantPrices(
            id,
            r.plan.changes.map((c) => ({
              wixVariantId: c.wixVariantId,
              sku: c.sku,
              actualPrice: c.toGrossSek,
              costAmount: c.toLandedCostSek,
            })),
          );
      if (w.updated === 0) {
        hoppade.push({
          wixProductId: id,
          skäl: `Wix hittade ingen av varianterna (${w.missing.join(", ")})`,
        });
        continue;
      }

      // 2) Sedan mappningen. saveMapping är en FULL ROW REPLACE i Wix Data —
      // hela posten skickas tillbaka, muterad, aldrig ett delobjekt.
      const perVariant = new Map(r.plan.changes.map((c) => [c.supplierVariantId, c]));
      mapping.variants = (mapping.variants ?? []).map((v) => {
        const c = perVariant.get(String(v.supplierVariantId));
        if (!c) return v;
        return { ...v, costUsd: c.toCostUsd, landedCostSek: c.toLandedCostSek, grossSek: c.toGrossSek };
      });
      // Produkten är inte längre "overifierad" — priserna kommer nu från DS.
      if (mapping.priceUnverified) delete mapping.priceUnverified;
      if (!isDryRun()) await store.saveMapping(mapping);

      skrivnaVarianter += w.updated;
      rättade.push({
        wixProductId: id,
        namn: r.namn,
        varianter: r.plan.changes.map((c) => ({
          label: c.label,
          från: c.fromGrossSek,
          till: c.toGrossSek,
          marginal: c.newMarginPct,
        })),
      });
      await audit(
        "price-repair",
        id,
        r.plan.changes
          .map((c) => `${c.label}: ${c.fromGrossSek}→${c.toGrossSek} kr (${c.newMarginPct} %)`)
          .join("; ")
          .slice(0, 500),
      );
    } catch (err) {
      hoppade.push({
        wixProductId: id,
        skäl: (err instanceof Error ? err.message : String(err)).slice(0, 200),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    torrkörning: isDryRun(),
    begärda: ids.length,
    rättadeProdukter: rättade.length,
    rättadeVarianter: skrivnaVarianter,
    rättade,
    hoppade,
  });
}
