// Per-variant lagersaldo vid import.
//
// Bug 2026-06-01: pipelinen satte ALLTID ett fast placeholder-saldo (10) per
// variant. Skrapan laser numera AliExpress availQuantity per variant
// (extension/content.js, inbaddad SKU-data) och skickar det som variant.stock.
//
// Bug 2026-06-02: tidigare behandlades 0 som "ej last" och foll tillbaka till
// 10 -> en AE-variant som var slutsald importerades med 10 i lager. Nu skiljer
// vi tydligt pa:
//
//   - productInStock === false -> 0 (vinner alltid).
//   - variantStock === 0 (uttrycklig OOS) -> 0 (LEGITIM OOS, ingen fallback).
//   - variantStock > 0 -> anvand det (Math.trunc till heltal).
//   - variantStock undefined / NaN / negativ -> fallback (default 10).
//
// Ren funktion - inga sidoeffekter, fullt enhetstestbar.

export function resolveImportStockQty(
  variantStock: number | undefined,
  fallbackQty: number,
  productInStock?: boolean,
): number {
  if (productInStock === false) return 0;
  // Uttrycklig stock-siffra fran skrapan (inkl. 0 = legitim OOS).
  if (typeof variantStock === "number" && Number.isFinite(variantStock) && variantStock >= 0) {
    return Math.trunc(variantStock);
  }
  // Saknas data - gissa "i lager" via fallback.
  return Math.max(0, Math.trunc(fallbackQty));
}

/**
 * Stabil nyckel for att matcha en variant mellan skrapan och DS-API:t nar
 * skuId saknas eller skiljer sig.
 *
 * Bug 2026-06-04: AliExpress laddar inte langre SKU-datan i sjalva sidan, sa
 * skrapan (content.js) far inget skuId och faller tillbaka pa "idx-N". DS-API:t
 * returnerar dock riktiga skuId, sa `bySku`-matchningen gav 0 traffar och varje
 * variant fick fallback-lagret 10. Vi matchar darfor pa optionsVARDENA (t.ex.
 * {Color:"Red",Size:"M"} -> "m|red") som bada kallor delar. Vardena, inte
 * namnen, sa sma namnskillnader mellan endpoints inte spelar roll. Unikt per
 * variant (varje variant ar en unik kombination), sa ingen kollisionsrisk.
 *
 * Ren funktion - inga sidoeffekter, fullt enhetstestbar.
 */
export function optionComboKey(options: Record<string, string> | undefined): string {
  if (!options) return "";
  return Object.values(options)
    .map((v) => String(v).trim().toLowerCase())
    .filter((v) => v.length > 0)
    .sort()
    .join("|");
}
