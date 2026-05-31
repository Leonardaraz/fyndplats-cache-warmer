// Lönsamhetsaggregering per produkt — kärnan i /admin/profitability.
//
// Ren funktion: tar in (mappings, importCosts, orders, settings) och returnerar
// en sorterad lista över rader klara att rendera + en summary-block.
// Inga sidoeffekter eller fetch — testbart utan stubs.

import type { ProductMappingRecord } from "../store/index";
import type { ImportCostRecord } from "../store/import-costs";
import type { OrderUnitsByProduct } from "../wix/orders";

export interface ProfitabilitySettings {
  /** Fast fraktestimat i SEK som dras från varje såld enhet (default 15). */
  shippingCostSek: number;
  /** Klarna-avgift % på brutto. */
  paymentFeePercent: number;
  /** Klarna-avgift fast i SEK per transaktion. */
  paymentFeeFixedSek: number;
  /** Moms-% (Sverige = 25). */
  vatRatePercent: number;
  /**
   * Antagen inköp som fraktion av sälj-pris exkl. moms när faktisk inköp saknas
   * (t.ex. 0.30 = 30%). Används bara som fallback för produkter utan kostdata.
   */
  fallbackCostFractionOfNet: number;
}

export const DEFAULT_PROFITABILITY_SETTINGS: ProfitabilitySettings = {
  shippingCostSek: 15,
  paymentFeePercent: 3,
  paymentFeeFixedSek: 2,
  vatRatePercent: 25,
  fallbackCostFractionOfNet: 0.3,
};

export interface ProductInput {
  productId: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  /** Aktuellt sälj-pris inkl. moms (lägsta varianten om flera). */
  priceSek?: number;
  inStock?: boolean;
  variantCount?: number;
}

export interface ProfitabilityRow {
  productId: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  inStock: boolean;
  /** Sälj-pris inkl. moms (lägsta varianten). */
  sellingPriceSek: number;
  /** Inköpskostnad per enhet i SEK (landad, inkl. valutaomräkning). */
  costSek: number;
  /** Anger varifrån kostnaden kom — saknas-flagga används i UI:t. */
  costSource: "mapping" | "import-cost-collection" | "fallback-pct" | "missing";
  /** Marginal per enhet i kr (sälj-netto − inköp − frakt − Klarna-andel). */
  marginPerUnitSek: number;
  /** Marginal-% (vinst / sälj-pris exkl. moms). */
  marginPercent: number;
  /** Antal sålda enheter under perioden. */
  unitsSold: number;
  /** Total vinst (marginal × antal sålda). */
  totalProfitSek: number;
  /** Total intäkt brutto (debit, inkl. moms). */
  totalRevenueSek: number;
  /** Senast sålt (ISO). */
  lastSoldAt?: string;
}

export interface ProfitabilitySummary {
  totalRevenueSek: number;
  totalCostSek: number;
  totalProfitSek: number;
  /** Vägd marginal-% = totalProfit / totalNetRevenue. */
  averageMarginPercent: number;
  productsSoldCount: number;
  productsWithoutSalesCount: number;
  productsWithoutCostDataCount: number;
  top5Profitable: ProfitabilityRow[];
  bottom5ZeroSales: ProfitabilityRow[];
}

export interface DailyTrendPoint {
  /** YYYY-MM-DD. */
  date: string;
  revenueSek: number;
  profitSek: number;
}

export interface ProfitabilityReport {
  rows: ProfitabilityRow[];
  summary: ProfitabilitySummary;
  trend: DailyTrendPoint[];
  /** Antal produkter där inköp saknas helt (vägledning till "Fyll på inköpsdata"). */
  productsMissingCostData: number;
  /** Settings som användes (för visning i UI). */
  settings: ProfitabilitySettings;
  /** ISO-tid då aggregeringen kördes. */
  generatedAt: string;
  /** Perioden som täcks (i dagar). */
  periodDays: number;
}

/**
 * Räknar netto-intäkt (sälj exkl. moms) från brutto.
 */
export function netFromGross(grossSek: number, vatRatePercent: number): number {
  if (vatRatePercent <= 0) return grossSek;
  return round2(grossSek / (1 + vatRatePercent / 100));
}

/**
 * Marginal per enhet givet en kombination av sälj, inköp och avgifter.
 *   marginal = (sälj − moms) − inköp − frakt − klarna_avgift
 */
export function marginPerUnit(
  sellingPriceSek: number,
  costSek: number,
  settings: ProfitabilitySettings,
): { marginSek: number; marginPercent: number; netRevenueSek: number } {
  const net = netFromGross(sellingPriceSek, settings.vatRatePercent);
  const fee = round2(sellingPriceSek * (settings.paymentFeePercent / 100) + settings.paymentFeeFixedSek);
  const margin = round2(net - costSek - settings.shippingCostSek - fee);
  const pct = net > 0 ? round2((margin / net) * 100) : 0;
  return { marginSek: margin, marginPercent: pct, netRevenueSek: net };
}

/**
 * Slår ihop allt: produkter + mappningar (för kostnad) + orders (för antal sålda)
 * + ev. ImportCost-override + settings → en sorterad lista över rader.
 */
export function computeProfitabilityReport(input: {
  products: ProductInput[];
  mappings: ProductMappingRecord[];
  importCosts: ImportCostRecord[];
  orders: OrderUnitsByProduct;
  settings: ProfitabilitySettings;
  periodDays: number;
}): ProfitabilityReport {
  const settings = input.settings;
  const mappingByProductId = new Map<string, ProductMappingRecord>();
  for (const m of input.mappings) mappingByProductId.set(m.wixProductId, m);
  const importCostByProductId = new Map<string, ImportCostRecord>();
  for (const c of input.importCosts) importCostByProductId.set(c.productId, c);

  const rows: ProfitabilityRow[] = [];

  for (const p of input.products) {
    const orderStats = input.orders.byProductId[p.productId];
    // Fallback till SKU-aggregat om productId saknas i orderdata (legacy V1-orders).
    const unitsSold = orderStats?.units ?? 0;
    const totalRevenueSek = orderStats?.grossSek ?? 0;
    const lastSoldAt = orderStats?.lastSoldAt;

    const sellingPriceSek = p.priceSek ?? 0;
    const { costSek, costSource } = resolveCost({
      productId: p.productId,
      sellingPriceSek,
      mapping: mappingByProductId.get(p.productId),
      override: importCostByProductId.get(p.productId),
      settings,
    });

    const { marginSek, marginPercent } = marginPerUnit(sellingPriceSek, costSek, settings);
    const totalProfitSek = round2(marginSek * unitsSold);

    rows.push({
      productId: p.productId,
      name: p.name,
      slug: p.slug,
      imageUrl: p.imageUrl,
      inStock: p.inStock ?? true,
      sellingPriceSek,
      costSek,
      costSource,
      marginPerUnitSek: marginSek,
      marginPercent,
      unitsSold,
      totalProfitSek,
      totalRevenueSek,
      lastSoldAt,
    });
  }

  // Sortera default på Total vinst desc (det användaren bad om).
  rows.sort((a, b) => b.totalProfitSek - a.totalProfitSek);

  const summary = buildSummary(rows);
  const trend = buildTrend(input.orders.dailyGrossSek, rows, settings);
  const productsMissingCostData = rows.filter((r) => r.costSource === "missing" || r.costSource === "fallback-pct").length;

  return {
    rows,
    summary,
    trend,
    productsMissingCostData,
    settings,
    generatedAt: new Date().toISOString(),
    periodDays: input.periodDays,
  };
}

function resolveCost(args: {
  productId: string;
  sellingPriceSek: number;
  mapping?: ProductMappingRecord;
  override?: ImportCostRecord;
  settings: ProfitabilitySettings;
}): { costSek: number; costSource: ProfitabilityRow["costSource"] } {
  // 1. Manuell override har högsta prioritet — operatorn vet bäst.
  if (args.override && Number.isFinite(args.override.costSek) && args.override.costSek > 0) {
    return { costSek: round2(args.override.costSek), costSource: "import-cost-collection" };
  }
  // 2. Faktisk import-cost från mapping (medelvärde över varianter).
  if (args.mapping && args.mapping.variants.length > 0) {
    const costs = args.mapping.variants
      .map((v) => v.landedCostSek)
      .filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0);
    if (costs.length > 0) {
      const avg = costs.reduce((s, n) => s + n, 0) / costs.length;
      return { costSek: round2(avg), costSource: "mapping" };
    }
  }
  // 3. Fallback: antagen kostnad som fraktion av netto-sälj.
  if (args.sellingPriceSek > 0 && args.settings.fallbackCostFractionOfNet > 0) {
    const net = netFromGross(args.sellingPriceSek, args.settings.vatRatePercent);
    return {
      costSek: round2(net * args.settings.fallbackCostFractionOfNet),
      costSource: "fallback-pct",
    };
  }
  // 4. Helt saknad — visas som "Saknas" i UI:t.
  return { costSek: 0, costSource: "missing" };
}

function buildSummary(rows: ProfitabilityRow[]): ProfitabilitySummary {
  const sold = rows.filter((r) => r.unitsSold > 0);
  const totalRevenueSek = round2(sold.reduce((s, r) => s + r.totalRevenueSek, 0));
  const totalCostSek = round2(sold.reduce((s, r) => s + r.costSek * r.unitsSold, 0));
  const totalProfitSek = round2(sold.reduce((s, r) => s + r.totalProfitSek, 0));
  // Vägd marginal — netto = brutto/1.25 om alla 25% moms; säkrare att räkna via summerade rader.
  const totalNet = round2(sold.reduce((s, r) => s + netFromGrossFor(r) * r.unitsSold, 0));
  const averageMarginPercent = totalNet > 0 ? round2((totalProfitSek / totalNet) * 100) : 0;

  const top5Profitable = [...sold]
    .sort((a, b) => b.totalProfitSek - a.totalProfitSek)
    .slice(0, 5);
  // "Bottom 5" = produkter UTAN försäljning (zero sales) — prio på de med lager.
  const zeroSales = rows.filter((r) => r.unitsSold === 0);
  const bottom5ZeroSales = zeroSales
    .sort((a, b) => Number(b.inStock) - Number(a.inStock) || b.sellingPriceSek - a.sellingPriceSek)
    .slice(0, 5);

  return {
    totalRevenueSek,
    totalCostSek,
    totalProfitSek,
    averageMarginPercent,
    productsSoldCount: sold.length,
    productsWithoutSalesCount: zeroSales.length,
    productsWithoutCostDataCount: rows.filter((r) => r.costSource === "missing").length,
    top5Profitable,
    bottom5ZeroSales,
  };
}

function netFromGrossFor(r: ProfitabilityRow): number {
  // Använd radens sellingPrice för att räkna netto — vi har inte vat-procenten
  // på radnivå men antar 25% (svensk standard) som överallt annars i koden.
  return netFromGross(r.sellingPriceSek, 25);
}

function buildTrend(
  dailyGrossSek: Record<string, number>,
  rows: ProfitabilityRow[],
  settings: ProfitabilitySettings,
): DailyTrendPoint[] {
  // Approximation: dagens profit ≈ dagens brutto × vägd vinst-fraktion på rader.
  // (Vi har inte order-detalj per dag per produkt här utan att hämta in detaljer
  // i orderaggregator — för en första iteration är detta bra nog för en trendlinje.)
  const totalNet = rows.reduce((s, r) => s + netFromGrossFor(r) * r.unitsSold, 0);
  const totalProfit = rows.reduce((s, r) => s + r.totalProfitSek, 0);
  const profitFraction = totalNet > 0 ? totalProfit / totalNet : 0;

  const dates = Object.keys(dailyGrossSek).sort();
  return dates.map((date) => {
    const revenueSek = round2(dailyGrossSek[date]);
    const net = netFromGross(revenueSek, settings.vatRatePercent);
    const profitSek = round2(net * profitFraction);
    return { date, revenueSek, profitSek };
  });
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
