// Per-variant lagersaldo vid import.
//
// Bug 2026-06-01: pipelinen satte ALLTID ett fast placeholder-saldo (10) på varje
// variant, oavsett verkligt lager hos leverantören. Skrapan läser numera AliExpress
// `availQuantity` per variant (extension/content.js, inbäddad SKU-data) och skickar
// det som variant.stock. Den här rena funktionen avgör vilket saldo som faktiskt
// sätts i Wix:
//   - Produkten markerad slutsåld (productInStock === false) → 0 (vinner alltid).
//   - Annars: skrapans per-variant-saldo om det är ett ändligt heltal > 0.
//   - Annars (saknas / 0 / DOM-pathen som inte läser per-variant-saldo) → fallback
//     (default-saldot, t.ex. 10) — AE-produkter säljer aktivt, så 0/okänt tolkas
//     som "ej läst" snarare än "slut".
//
// Ren funktion — inga sidoeffekter, fullt enhetstestbar.

export function resolveImportStockQty(
  variantStock: number | undefined,
  fallbackQty: number,
  productInStock?: boolean,
): number {
  if (productInStock === false) return 0;
  if (typeof variantStock === "number" && Number.isFinite(variantStock) && variantStock > 0) {
    return Math.trunc(variantStock);
  }
  return Math.max(0, Math.trunc(fallbackQty));
}
