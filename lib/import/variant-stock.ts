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
