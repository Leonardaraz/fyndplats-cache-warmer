import { computeProfit } from "../import/pricing";
import type { PaymentFeeConfig } from "../config";
import type { ProductMappingRecord } from "../store/index";

export interface VariantProfit {
  sku: string;
  grossSek: number;
  netRevenueSek: number;
  profitSek: number;
  marginPercent: number;
}

export interface ProductProfitSummary {
  wixProductId: string;
  supplierProductId: string;
  variantCount: number;
  minProfit: number;
  maxProfit: number;
  minMargin: number;
  maxMargin: number;
  /** Detalj per variant — för en utökad vy om man vill borra ner. */
  variants: VariantProfit[];
}

export function feeForGross(grossSek: number, fee: PaymentFeeConfig): number {
  return round2(grossSek * (fee.percent / 100) + fee.fixedSek);
}

/** Räknar fram vinst per variant och min/max på produktnivå. */
export function summarizeProductProfit(
  mapping: ProductMappingRecord,
  vatRatePercent: number,
  fee: PaymentFeeConfig,
): ProductProfitSummary | null {
  if (mapping.variants.length === 0) return null;

  const variants: VariantProfit[] = mapping.variants.map((v) => {
    const paymentFeeSek = feeForGross(v.grossSek, fee);
    const r = computeProfit({
      grossSek: v.grossSek,
      vatRatePercent,
      landedCostSek: v.landedCostSek,
      paymentFeeSek,
    });
    return { sku: v.sku, grossSek: v.grossSek, ...r };
  });

  const profits = variants.map((v) => v.profitSek);
  const margins = variants.map((v) => v.marginPercent);
  return {
    wixProductId: mapping.wixProductId,
    supplierProductId: mapping.supplierProductId,
    variantCount: variants.length,
    minProfit: Math.min(...profits),
    maxProfit: Math.max(...profits),
    minMargin: Math.min(...margins),
    maxMargin: Math.max(...margins),
    variants,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
