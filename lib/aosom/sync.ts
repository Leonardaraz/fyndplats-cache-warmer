// Lager- och prissynk för Aosom-sortimentet.
//
// VARFÖR DEN SER HELT ANNORLUNDA UT ÄN ALIEXPRESS-SYNKEN
//
// AE-synken måste ringa DS-API:t en gång per produkt, lever under `maxApiCalls`
// och roterar därför genom katalogen — ett varv tar ~20 timmar och två strikes
// ligger en hel rotation isär. Aosom är **ett enda HTTP-anrop** som ger alla
// 6 057 rader med saldo och pris. Ingen budget, ingen rotation, inga rate limits,
// ingen strike-mekanik: varje körning ser hela sanningen samtidigt.
//
// Det gör problemet mindre — men flyttar också risken. När en körning kan röra
// hela sortimentet på en gång är en trasig feed farligare än en trasig produkt.
// Därför ligger tyngdpunkten här på spärrar mot MASSFEL, inte mot enskilda fel.
//
// ☠️ EN RAD SOM FÖRSVINNER UR FEEDEN ÄR INTE UTGÅNGEN
//
// Aosoms egen B2B-guide, ordagrant: "Items with low stock may be temporarily
// removed to avoid overselling." Raden tas alltså bort SOM ETT LAGERBESKED, och
// kommer tillbaka. Rätt svar är att nolla saldot och låta produkten ligga kvar —
// aldrig att avpublicera eller radera. Nästa körning där raden är tillbaka
// återställer saldot av sig själv.
//
// VAD DEN INTE RÖR
//
// Synlighet, texter, bilder, kategorier. Bara lagersaldo, pris och de tre
// kostnadsfälten på mappningen.

import { fetchAosomFeed, landedCostEur, type AosomRow } from "./feed";
import { aosomSupplierProductId, type AosomFx } from "./to-product";
import { SUPPLIER_VAT_RATE } from "../auction/seed";
import { computePriceWithRules } from "../import/pricing";
import type { PricingRules } from "../import/types";
import type { ProductMappingRecord } from "../store";

const DEFAULT_LIMIT = 400;
const DEFAULT_TIME_BUDGET_MS = 240_000;

/**
 * Under så här många rader är feeden trasig, inte sortimentet.
 *
 * Den här spärren är hela skillnaden mot AE-synken. Där kan ett API-fel nolla
 * EN produkt; här kan en halvhämtad CSV nolla HELA katalogen i en körning.
 * Feeden har legat på 6 057 rader; ett svar under en tredjedel av det är ett
 * transportfel som ska fälla körningen, inte tolkas som att lagret tagit slut.
 */
export const MIN_FEED_RADER = 2000;

/**
 * Saldon på eller under det här visas som SLUTSÅLT.
 *
 * Feeden uppdateras tre gånger per dygn, så mellan två synkar finns ett fönster
 * där Aosoms siffra är gammal. Säger de "3 kvar" och vi visar 3, säljer vi den
 * fjärde. Aosom markerar dessutom själva 276 rader med "Low Stock Alert" — de
 * vet att svansen är opålitlig. Bufferten kostar några enstaka sälj och sparar
 * en återbetalning plus en besviken kund.
 */
export const LAGER_BUFFERT = 3;

/**
 * Tak på hur mycket ett pris får ändras i EN körning, i procent.
 *
 * Prissynken är avsiktligt tvåvägs och automatisk (Leonards beslut 2026-08-28):
 * stiger inköpet ska priset upp, sjunker det ska priset ner. Men en feed-rad med
 * en trasig siffra — en frakt som råkar bli 0, ett grossistpris med fel decimal —
 * får inte slå igenom till kund. Över taket skrivs ingenting och raden hamnar i
 * `varningar` för en människa att titta på.
 */
export const MAX_PRISANDRING_PCT = 40;

/** Priser under detta är alltid fel. Skyddar mot en tom eller nollad feed-rad. */
const MIN_RIMLIGT_PRIS_SEK = 20;

export interface AosomSyncOptions {
  /** Torrkörning. DEFAULT TRUE — samma husregel som svepet och bildfixen. */
  dryRun?: boolean;
  /**
   * Tak på antal produkter som SKRIVS, inte på antal som granskas.
   *
   * Skillnaden är vad som gör att cronen konvergerar utan sparad markör. En
   * oförändrad produkt kostar noll Wix-anrop — bara en jämförelse i minnet — så
   * den får inte äta av budgeten. Nästa körning börjar om från början, går
   * gratis förbi allt som redan är synkat och skriver de nästa `limit` styckena.
   * Efter några varv är hela sortimentet i fas och varje körning skriver noll.
   */
  limit?: number;
  timeBudgetMs?: number;
  /** Fortsätt EFTER det här artikelnumret (markören ur föregående svar). */
  after?: string;
  /** Bara dessa artikelnummer. För riktad omkörning. */
  onlySkus?: string[];
  /** Hoppa över prisdelen och synka bara lager. */
  skipPrices?: boolean;
}

export interface AosomSyncSummary {
  dryRun: boolean;
  /** Rader i feeden den här körningen — kvittot på att spärren passerades. */
  feedRader: number;
  granskade: number;
  /** Produkter vars lagersaldo skrevs om. */
  lagerUppdaterade: number;
  /** Produkter vars pris skrevs om. */
  prisUppdaterade: number;
  /** Nollade för att raden saknades i feeden (tillfälligt bortplockad hos Aosom). */
  urFeeden: number;
  /** Nollade för att saldot låg på eller under bufferten. */
  slutsalda: number;
  /** Ingen förändring — varken lager eller pris. */
  oforandrade: number;
  misslyckade: number;
  kvar: number;
  cursor: string | null;
  stoppedBy: "klart" | "limit" | "tidsbudget";
  errors: { sku: string; error: string }[];
  /** Prisändringar som blockerades av taket. Kräver mänskligt öga. */
  varningar: { sku: string; fran: number; till: number; andringPct: number }[];
}

/** Lagersaldot vi faktiskt visar för kund, givet leverantörens siffra. */
export function synligtSaldo(leverantorensSaldo: number): number {
  const q = Math.trunc(leverantorensSaldo);
  if (!Number.isFinite(q) || q <= LAGER_BUFFERT) return 0;
  return q - LAGER_BUFFERT;
}

/** Landad kostnad INKLUSIVE moms, husets konvention för `landedCostSek`. */
export function landadKostnadSek(row: AosomRow, eurToSek: number): number {
  return landedCostEur(row) * eurToSek * (1 + SUPPLIER_VAT_RATE);
}

export interface AosomSyncDeps {
  fetchFeed: () => Promise<AosomRow[]>;
  /** Alla Aosom-mappningar. */
  listAosom: () => Promise<ProductMappingRecord[]>;
  /** Skriver absolut lagersaldo för produktens (enda) variant. */
  setStock: (wixProductId: string, sku: string, antal: number) => Promise<void>;
  /** Skriver variantpriset OCH inköpskostnaden i Wix. Får aldrig röra synlighet. */
  /**
   * ☠️ Tar variantens WIX-identitet, inte Aosoms artikelnummer.
   *
   * Den här signaturen sa tidigare `sku: string`, och anroparen skickade
   * loopens `sku` — som är feedens artikelnummer ("839-835V01CG"), nyckeln
   * till feed-raden. Wix-variantens SKU är något helt annat
   * ("FP-schlafsofa-2er-sofa-mit"), så matchningen kunde aldrig lyckas.
   * `setStock` tog samma argument men IGNORERADE det (`_sku`) och slog upp
   * lagerposterna på produkt-id — därför fungerade lagret, och därför såg
   * felet ut som om det inte fanns.
   */
  setPrice: (
    wixProductId: string,
    variant: { wixVariantId?: string; sku?: string },
    grossSek: number,
    landedCostSek: number,
  ) => Promise<void>;
  saveMapping: (m: ProductMappingRecord) => Promise<void>;
  fx: AosomFx;
  rules: PricingRules;
  now?: () => number;
}

/**
 * Kör en tugga av lager- och prissynken.
 *
 * Ordningen är artikelnummer stigande, samma som svepet och bildfixen, så
 * markören betyder samma sak i alla tre.
 */
export async function runAosomSync(
  deps: AosomSyncDeps,
  opts: AosomSyncOptions = {},
): Promise<AosomSyncSummary> {
  const dryRun = opts.dryRun !== false;
  const limit = Math.max(1, opts.limit ?? DEFAULT_LIMIT);
  const timeBudgetMs = opts.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const now = deps.now ?? (() => Date.now());
  const start = now();

  const feed = await deps.fetchFeed();

  // ☠️ MASSFEL-SPÄRREN. Kollas FÖRE allt annat och kastar — en halvhämtad feed
  // får aldrig se ut som att sortimentet tagit slut.
  if (feed.length < MIN_FEED_RADER) {
    throw new Error(
      `Aosom-feeden gav bara ${feed.length} rader (minst ${MIN_FEED_RADER} krävs). `
        + `Körningen avbryts — det här är ett hämtningsfel, inte ett lagerbesked.`,
    );
  }

  const perSku = new Map(feed.map((r) => [r.sku, r]));
  const onlySkus = opts.onlySkus?.length ? new Set(opts.onlySkus) : null;

  const mappningar = (await deps.listAosom())
    .filter((m) => !!m.wixProductId)
    .map((m) => ({ m, sku: (m.supplierProductId ?? "").slice(aosomSupplierProductId("").length) }))
    .filter((x) => x.sku && (!onlySkus || onlySkus.has(x.sku)))
    .filter((x) => !opts.after || x.sku.localeCompare(opts.after) > 0)
    .sort((a, b) => a.sku.localeCompare(b.sku));

  const summary: AosomSyncSummary = {
    dryRun,
    feedRader: feed.length,
    granskade: 0,
    lagerUppdaterade: 0,
    prisUppdaterade: 0,
    urFeeden: 0,
    slutsalda: 0,
    oforandrade: 0,
    misslyckade: 0,
    kvar: mappningar.length,
    cursor: null,
    stoppedBy: "klart",
    errors: [],
    varningar: [],
  };

  /** Antal produkter vi FAKTISKT skrivit. Det är den här `limit` gäller. */
  let skrivna = 0;

  for (const { m, sku } of mappningar) {
    if (skrivna >= limit) {
      summary.stoppedBy = "limit";
      break;
    }
    // Budgeten kollas FÖRE varje produkt — aldrig mitt i en halvskriven produkt,
    // där priset hunnit skrivas men mappningen inte.
    if (now() - start >= timeBudgetMs) {
      summary.stoppedBy = "tidsbudget";
      break;
    }

    summary.granskade++;
    summary.kvar--;
    summary.cursor = sku;

    try {
      const row = perSku.get(sku);
      const variant = m.variants?.[0];
      let rortes = false;

      // ── LAGER ────────────────────────────────────────────────────────────
      // Saknad rad = tillfälligt bortplockad hos Aosom, inte utgången. Nolla
      // saldot, lämna sidan. Se filhuvudet.
      const onskatSaldo = row ? synligtSaldo(row.qty) : 0;
      if (!row) summary.urFeeden++;
      else if (onskatSaldo === 0) summary.slutsalda++;

      if (m.aosomSyncedQty !== onskatSaldo) {
        if (!dryRun) await deps.setStock(m.wixProductId, sku, onskatSaldo);
        summary.lagerUppdaterade++;
        rortes = true;
      }

      // ── PRIS ─────────────────────────────────────────────────────────────
      // Bara när raden finns: utan rad finns inget nytt pris att räkna på, och
      // ett gammalt pris på en slutsåld vara skadar ingen.
      let nyttPris: number | null = null;
      let nyLandad: number | null = null;

      if (row && !opts.skipPrices && variant) {
        nyLandad = landadKostnadSek(row, deps.fx.eurToSek);
        const costUsd = nyLandad / deps.fx.usdToSek;
        // Kategorin är null: Aosom-utkast är okategoriserade tills poleringen
        // sätter den, och prisregeln har ändå inga kategorimultiplikatorer
        // (rensade 2026-08-27 — "Husdjur: 2,5" hade satt 60 % marginal på
        // hela PawHut-sortimentet utan att någon regel sa det).
        const pris = computePriceWithRules(costUsd, deps.rules, null).grossSek;
        const gammalt = variant.grossSek;

        if (pris < MIN_RIMLIGT_PRIS_SEK) {
          summary.varningar.push({ sku, fran: gammalt, till: pris, andringPct: 0 });
        } else if (gammalt > 0) {
          const andringPct = ((pris - gammalt) / gammalt) * 100;
          if (Math.abs(andringPct) > MAX_PRISANDRING_PCT) {
            // Tvåvägssynken är medvetet automatisk, men ett hopp av den här
            // storleken är oftare en trasig feed-rad än en verklig prisändring.
            summary.varningar.push({ sku, fran: gammalt, till: pris, andringPct: Math.round(andringPct) });
          } else if (pris !== gammalt) {
            nyttPris = pris;
          }
        } else if (pris > 0) {
          nyttPris = pris;
        }
      }

      if (nyttPris !== null && nyLandad !== null && variant) {
        if (!dryRun) {
          await deps.setPrice(
            m.wixProductId,
            { wixVariantId: variant.wixVariantId, sku: variant.sku },
            nyttPris,
            nyLandad,
          );
        }
        summary.prisUppdaterade++;
        rortes = true;
      }

      if (!rortes) {
        summary.oforandrade++;
        continue;
      }
      skrivna++;

      // ── MAPPNINGEN SIST ──────────────────────────────────────────────────
      // Wix skrivs FÖRE mappningen, samma ordning och samma skäl som
      // price-repair: går bara den ena igenom står kunden inför rätt pris medan
      // bokföringen är gammal, och nästa körning rättar det. Omvänd ordning hade
      // gjort mappningen "synkad" medan kunden köper till fel pris — och då
      // hittar ingen felet igen.
      if (!dryRun) {
        const uppdaterad: ProductMappingRecord = {
          ...m,
          aosomSyncedQty: onskatSaldo,
          aosomSyncedAt: new Date(now()).toISOString(),
          variants: (m.variants ?? []).map((v, i) =>
            i === 0 && nyttPris !== null && nyLandad !== null
              ? { ...v, grossSek: nyttPris, landedCostSek: nyLandad, costUsd: nyLandad / deps.fx.usdToSek }
              : v,
          ),
        };
        await deps.saveMapping(uppdaterad);
      }
    } catch (err) {
      summary.misslyckade++;
      summary.errors.push({ sku, error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (summary.kvar <= 0) summary.cursor = null;
  return summary;
}

/** Standard-deps mot skarpa systemet. Bryts ut så testerna slipper mocka moduler. */
export async function liveDeps(): Promise<AosomSyncDeps> {
  const [{ getStore }, { getPricingRules }, { eurToSekFromEnv }, wix, v3] = await Promise.all([
    import("../store/factory"),
    import("../store/pricing-config"),
    import("../config"),
    import("../wix/client"),
    import("../wix/v3-products"),
  ]);
  const rules = await getPricingRules();
  const store = getStore();

  return {
    fetchFeed: () => fetchAosomFeed(),
    listAosom: async () =>
      (await store.listMappings()).filter((m) =>
        (m.supplierProductId ?? "").startsWith(aosomSupplierProductId("")),
      ),
    setStock: async (wixProductId, _sku, antal) => {
      const poster = await wix.queryInventoryItemsByProductId(wixProductId);
      if (poster.length === 0) return;
      await wix.bulkUpdateInventoryQuantities(
        poster.map((p) => ({ id: p.id, revision: p.revision, quantity: antal })),
      );
    },
    // updateV3VariantPrices skickar tillbaka `visible` oförändrad — utan det
    // publicerar en variantsInfo-PATCH utkastet (uppmätt 2026-08-28).
    setPrice: async (wixProductId, variant, grossSek, landedCostSek) => {
      // ☠️ SVARET MÅSTE LÄSAS. updateV3VariantPrices returnerar {updated, missing}
      // och KASTAR INTE när ingen variant matchade — den hoppar över PATCH:en och
      // returnerar tyst. Det gamla anropet slängde returvärdet, så synken räknade
      // upp `prisUppdaterade` och skrev mappningen med det nya priset medan Wix
      // behöll det gamla. Uppmätt 2026-08-29 på bäddsoffan `efaa0c7b`: mappningen
      // sa 3 529 kr, kunden såg 4 539 kr, och produkten stod kvar på revision 1.
      //
      // Sjunde gången samma lärdom i det här repot: ett svar utan fel är inget
      // kvitto. Räkna efter.
      const resultat = await v3.updateV3VariantPrices(wixProductId, [
        {
          ...(variant.wixVariantId ? { wixVariantId: variant.wixVariantId } : {}),
          ...(variant.sku ? { sku: variant.sku } : {}),
          actualPrice: grossSek,
          costAmount: Math.round(landedCostSek),
        },
      ]);
      if (resultat.updated === 0) {
        throw new Error(
          `prisskrivningen matchade ingen variant på ${wixProductId} `
          + `(sökte ${resultat.missing.join(", ") || "utan nyckel"}) — priset i Wix är oförändrat`,
        );
      }
    },
    saveMapping: (m) => store.saveMapping(m),
    fx: { eurToSek: eurToSekFromEnv(), usdToSek: rules.usdToSek },
    rules,
  };
}
