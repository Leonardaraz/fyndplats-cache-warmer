// Batch-import av Aosoms B2B-feed till katalogen.
//
// Uppdraget (Leonard 2026-08-27): "hämta alla produkter till vår katalog som går
// att frakta till sverige. Gör dom inte visable. Vi ska polera alla sen."
//
// VARFÖR DET HÄR ÄR ETT ÅTERUPPTAGBART JOBB OCH INTE ETT ANROP
//
// 5 566 importerbara artiklar bär 50 018 bilder. Varje bild är ett eget
// import-anrop till Wix media (lib/wix/media-import.ts), och Wix svarar 429 när
// takten blir för hög. Även i bästa fall ligger hela svepet på timmar — en
// serverless-rutt har 300 sekunder. Körningen tar därför en tugga i taget,
// stämplar av det som är klart i mappningarna och kan startas om hur många
// gånger som helst: dubblettspärren gör omkörning till en no-op.
//
// LÄGET ÄR ALLTID RÅTT
//
// qualityMode "raw" ger noll Claude-anrop ($0) och — viktigast — `visible:false`
// ovillkorligt (pipeline.ts: "RAW → ALLTID draft"). Produkterna hamnar i
// /admin/queue med "✨ Behöver AI-polering" och poleras därifrån, gratis, i
// chatten. Det är exakt arbetsflödet i CLAUDE.md, bara med en annan leverantör
// i andra änden.
//
// VAD SPÄRREN INTE SER
//
// Dubblettspärren nedan nyckar på `supplierProductId` ("aosom:<SKU>") och fångar
// alltså varje omkörning. Den fångar INTE de ~586 produkter vi redan säljer som
// är Aosom-varor inköpta via AliExpress — de bär ett AE-listnings-id och ser för
// spärren ut som något helt annat. Att matcha ihop dem kräver mått, produkttyp
// och bildjämförelse (så gjordes de 33 i leverantörsjämförelsen 2026-08-27), och
// en automatisk gissning där skulle slå ihop produkter som inte är samma vara.
// De dubbletterna får hanteras i poleringen, där en människa ändå läser varje
// produkt.

import type { AliExpressProduct, FeatureFlags } from "../import/types";
import type { ImportResult } from "../import/pipeline";
import type { ProductMappingRecord } from "../store";
import {
  fetchAosomFeed,
  freightShare,
  isShippableToSe,
  type AosomRow,
} from "./feed";
import { toImportProduct, aosomSupplierProductId, RENA_BILDPOSITIONER, type AosomFx } from "./to-product";

/** Rått läge, alltid. Se modulhuvudet — det är det som håller produkterna osynliga. */
export const RAW_FLAGS: FeatureFlags = { qualityMode: "raw", enableAI: false };

const DEFAULT_LIMIT = 25;
const DEFAULT_TIME_BUDGET_MS = 240_000;

export interface AosomImportOptions {
  /**
   * Torrkörning. DEFAULT TRUE — samma husregel som review-backfill och
   * price-repair: en körning som skriver ska ha bett om det uttryckligen.
   */
  dryRun?: boolean;
  /** Max antal produkter att FÖRSÖKA importera i den här körningen. */
  limit?: number;
  /** Väggklocksbudget. Ska ligga under ruttens maxDuration med marginal. */
  timeBudgetMs?: number;
  /**
   * Hoppa över rader där frakten kostar mer än varan (freightShare > 0,5).
   * Default FALSE — Leonard bad om allt som går att frakta hit. Flaggan finns
   * för att kunna köra de lönsamma först.
   */
  skipFreightHeavy?: boolean;
  /** Bara dessa artikelnummer. För enstaka omkörningar och rökprov. */
  onlySkus?: string[];
  /** Fortsätt EFTER det här artikelnumret (markören ur föregående svar). */
  after?: string;
  /** Paus mellan produkter i ms. 0 = ingen. Wix-429 hanteras redan med backoff. */
  delayMs?: number;
  /**
   * Bildpositioner att hämta hem (1-indexerat i feedens ordning). Saknas =
   * RENA_BILDPOSITIONER [1,2,3,8,9] — de positioner där bilden mätbart sällan
   * bär tysk text. Skicka alla nio för att ta hem allt.
   */
  bildpositioner?: readonly number[];
}

export interface AosomImportSummary {
  dryRun: boolean;
  /** Rader i feeden totalt. */
  feedRows: number;
  /** Rader som går att frakta till Sverige (saldo + verkligt fraktpris). */
  shippable: number;
  /** Redan i katalogen sedan tidigare körning. */
  alreadyImported: number;
  /** Överhoppade för att frakten är dyrare än varan (bara med skipFreightHeavy). */
  skippedFreightHeavy: number;
  /** Försökta i den här körningen. */
  attempted: number;
  imported: number;
  failed: number;
  /** Kvar att importera efter den här körningen. */
  remaining: number;
  /** Skicka tillbaka som `after` för att fortsätta. Null = allt är klart. */
  cursor: string | null;
  /** Varför körningen slutade. */
  stoppedBy: "klart" | "limit" | "tidsbudget";
  errors: { sku: string; error: string }[];
  /** Bilder som faktiskt hämtas hem för det som återstår — kostnadssignal. */
  remainingImages: number;
  /** Bildpositioner körningen använde. */
  bildpositioner: number[];
}

export interface AosomImportDeps {
  fetchFeed: () => Promise<AosomRow[]>;
  listMappings: () => Promise<Pick<ProductMappingRecord, "supplier" | "supplierProductId">[]>;
  importOne: (product: AliExpressProduct) => Promise<ImportResult>;
  saveMapping: (m: ProductMappingRecord) => Promise<void>;
  fx: AosomFx;
  now?: () => number;
}

/**
 * Kör en tugga av importen.
 *
 * Ordningen är deterministisk (artikelnummer stigande) — det är det som gör
 * `after`-markören meningsfull. Ändras sorteringen bryts fortsättningen mitt i
 * ett svep, så den ska stå still.
 */
export async function runAosomImport(
  deps: AosomImportDeps,
  opts: AosomImportOptions = {},
): Promise<AosomImportSummary> {
  const dryRun = opts.dryRun !== false;
  const limit = Math.max(1, opts.limit ?? DEFAULT_LIMIT);
  const timeBudgetMs = opts.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const now = deps.now ?? (() => Date.now());
  const bildpositioner = opts.bildpositioner ?? RENA_BILDPOSITIONER;
  const start = now();

  const feed = await deps.fetchFeed();
  const shippable = feed.filter(isShippableToSe).sort((a, b) => a.sku.localeCompare(b.sku));

  const existing = new Set(
    (await deps.listMappings()).map((m) => m.supplierProductId).filter(Boolean),
  );

  const onlySkus = opts.onlySkus?.length ? new Set(opts.onlySkus) : null;
  let alreadyImported = 0;
  let skippedFreightHeavy = 0;

  const queue: AosomRow[] = [];
  for (const row of shippable) {
    if (onlySkus && !onlySkus.has(row.sku)) continue;
    if (existing.has(aosomSupplierProductId(row.sku))) {
      alreadyImported++;
      continue;
    }
    if (opts.skipFreightHeavy && freightShare(row) > 0.5) {
      skippedFreightHeavy++;
      continue;
    }
    // Markören jämförs med samma localeCompare som sorteringen ovan.
    if (opts.after && row.sku.localeCompare(opts.after) <= 0) continue;
    queue.push(row);
  }

  const summary: AosomImportSummary = {
    dryRun,
    feedRows: feed.length,
    shippable: shippable.length,
    alreadyImported,
    skippedFreightHeavy,
    attempted: 0,
    imported: 0,
    failed: 0,
    remaining: queue.length,
    cursor: null,
    stoppedBy: "klart",
    errors: [],
    remainingImages: queue.reduce(
      (s, r) => s + toImportProduct(r, deps.fx, { positioner: bildpositioner }).imageUrls.length,
      0,
    ),
    bildpositioner: [...bildpositioner],
  };

  for (const row of queue) {
    if (summary.attempted >= limit) {
      summary.stoppedBy = "limit";
      break;
    }
    // Budgeten kollas FÖRE varje produkt, aldrig mitt i en — en avbruten
    // produkt skulle lämna bilder uppladdade utan mappningsrad.
    if (now() - start >= timeBudgetMs) {
      summary.stoppedBy = "tidsbudget";
      break;
    }

    summary.attempted++;
    const product = toImportProduct(row, deps.fx, { positioner: bildpositioner });

    if (dryRun) {
      summary.imported++;
      summary.remaining--;
      summary.cursor = row.sku;
      continue;
    }

    try {
      const result = await deps.importOne(product);
      await deps.saveMapping(buildMapping(row, result));
      summary.imported++;
      summary.remaining--;
      summary.cursor = row.sku;
    } catch (err) {
      summary.failed++;
      summary.errors.push({ sku: row.sku, error: err instanceof Error ? err.message : String(err) });
      // Markören flyttas ÄVEN vid fel. Annars fastnar hela svepet på en trasig
      // rad: nästa körning börjar om på samma produkt, misslyckas igen, och
      // katalogen står stilla. Felet står i summary och går att köra om riktat
      // med onlySkus.
      summary.cursor = row.sku;
      summary.remaining--;
    }

    if (opts.delayMs && opts.delayMs > 0) {
      await new Promise((r) => setTimeout(r, opts.delayMs));
    }
  }

  if (summary.remaining <= 0) summary.cursor = null;
  return summary;
}

/**
 * Mappningsraden. Utöver de vanliga fälten sätts tre saker som är hela poängen
 * med den här importen:
 *
 *   supplier: "aosom"     → håller raden utanför AE-synken, prisbevakningen,
 *                           prisreparationen och recensionshämtningen. Utan den
 *                           slår varje körning 5 566 omöjliga AE-uppslag.
 *   draftStatus           → "pending_review": produkten hamnar i /admin/queue.
 *   needsAiPolish: true   → kö-badgen "✨ Behöver AI-polering" + knappen som
 *                           kopierar produkten till chatten.
 *
 * needsAiPolish sätts här ovillkorligt i stället för att läsas ur resultatet.
 * Pipelinen sätter det redan i rått läge, men en Aosom-produkt är oPOLERAD på
 * ett sätt pipelinen inte kan veta: titeln, beskrivningen och varje spec-VÄRDE
 * är tyska. Den får aldrig nå kund utan att någon skrivit om den.
 */
export function buildMapping(row: AosomRow, result: ImportResult): ProductMappingRecord {
  const extra = result as unknown as Record<string, unknown>;
  return {
    supplierProductId: result.supplierProductId,
    supplier: "aosom",
    wixProductId: result.wixProductId,
    variants: result.variantMappings,
    draftStatus: "pending_review",
    createdAt: new Date().toISOString(),
    seoTitle: result.seo.title,
    sourceUrl: row.url,
    shipsFromCountries: result.shipsFromCountries,
    hasEuWarehouse: result.hasEuWarehouse,
    warehouseClass: result.warehouseClass,
    needsAiPolish: true,
    aosomFreightShare: round3(freightShare(row)),
    ...(typeof extra.priceUnverified === "string" ? { priceUnverified: extra.priceUnverified } : {}),
    ...(result.slugSuffix ? { slugSuffix: result.slugSuffix } : {}),
  };
}

/** Standard-deps mot skarpa systemet. Bryts ut så testerna slipper mocka moduler. */
export async function liveDeps(): Promise<AosomImportDeps> {
  const [{ importProduct }, { getStore }, { getPricingRules }, { eurToSekFromEnv }] = await Promise.all([
    import("../import/pipeline"),
    import("../store/factory"),
    import("../store/pricing-config"),
    import("../config"),
  ]);
  const rules = await getPricingRules();
  const store = getStore();
  return {
    fetchFeed: () => fetchAosomFeed(),
    listMappings: () => store.listMappings(),
    importOne: (product) => importProduct(product, rules, undefined, RAW_FLAGS),
    saveMapping: (m) => store.saveMapping(m),
    fx: { eurToSek: eurToSekFromEnv(), usdToSek: rules.usdToSek },
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
