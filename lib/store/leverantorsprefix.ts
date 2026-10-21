// Leverantörernas prefix i `supplierProductId`.
//
// Prefixet skiljer en leverantörs artikelnummer från ett AliExpress-produkt-id
// i samma fält. Utan det skulle ett numeriskt artikelnummer en dag kunna
// kollidera med ett AE-produkt-id — och dubblettspärren, synken och
// mappningsuppslagen läser alla samma fält. Prefixet är också vad
// lib/aosom/import-run.ts känner igen sina egna rader på vid omkörning, och vad
// `mappingSupplier()` faller tillbaka på när `supplier`-fältet saknas.
//
// AliExpress har inget prefix: varenda rad i katalogen var en AE-rad före
// 2026-08-27, och deras id är rena siffror.
//
// Modulen importerar ingenting, så att lib/store/supplier.ts inte behöver
// importera från en leverantörs egen kod.

export const AOSOM_ID_PREFIX = "aosom:";
export const VEVOR_ID_PREFIX = "vevor:";
