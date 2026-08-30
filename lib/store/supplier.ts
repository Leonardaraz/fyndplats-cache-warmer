// Vilken leverantör en mappningsrad hör till, och de spärrar som följer av det.
//
// Bakgrunden: hela synk-, prisbevaknings- och recensionskedjan är byggd runt
// antagandet att `supplierProductId` är ett AliExpress-produkt-id som går att
// slå upp mot AE:s API. När Aosom-importen lade till 5 566 rader med
// artikelnummer i stället slutade det antagandet gälla — men bara för de raderna.
//
// Spärren sitter medvetet i ett eget litet modul i stället för i varje loop:
// varje ny AE-anropande körning ska kunna importera EN funktion och vara klar,
// och det ska gå att hitta alla ställen som bryr sig med en enda grep.

import type { MappingSupplier, ProductMappingRecord } from "./index";
import type { AliExpressProductId } from "../aliexpress/product-id";
import { AOSOM_ID_PREFIX } from "../aosom/to-product";

/**
 * Leverantören för en rad. Läser det sparade fältet först och faller tillbaka på
 * id-prefixet — så att en rad som skrevs innan `supplier` fanns, eller som
 * tappade fältet i en partiell uppdatering, ändå klassas rätt. Default
 * "aliexpress": det är vad varenda rad i katalogen var före 2026-08-27.
 */
export function mappingSupplier(m: Pick<ProductMappingRecord, "supplier" | "supplierProductId">): MappingSupplier {
  if (m.supplier) return m.supplier;
  if (m.supplierProductId?.startsWith(AOSOM_ID_PREFIX)) return "aosom";
  return "aliexpress";
}

/**
 * Sant bara för rader vars `supplierProductId` faktiskt går att slå upp mot
 * AliExpress. Använd den som spärr i ALLA körningar som anropar AE per produkt:
 * lagersynken, prisbevakningen, prisreparationen, fraktkontrollen och
 * recensionshämtningen.
 *
 * Vad som annars händer, konkret: lagersynken skickar `aosom:845-030CG` till
 * getAliExpressProduct, får inget vettigt tillbaka och räknar upp en
 * fetchErrorStreak — 5 566 gånger per körning. Synken är fail-safe och skulle
 * inte nolla lagret (tomt variantsvar behandlas som transient), men budgeten för
 * API-anrop äts upp av produkter som aldrig kan svara, och de AE-produkter som
 * FAKTISKT behöver synkas hamnar sist i kön.
 */
export function isAliExpressMapping(
  m: Pick<ProductMappingRecord, "supplier" | "supplierProductId">,
): boolean {
  return mappingSupplier(m) === "aliexpress";
}

/**
 * Radens `supplierProductId` som ett id DS-API:t kan slå upp — eller null när
 * raden inte är en AliExpress-rad.
 *
 * Det här är den ENDA vägen från en mappningsrad till `getProduct`,
 * `getInventory`, `queryFreightToCountry` och `debugRawProductGet`: de tar en
 * `AliExpressProductId`, inte en `string`. En körning som loopar över
 * `listMappings()` och glömmer spärren kompilerar alltså inte längre — vilket
 * är hela poängen, för spärren glömdes bort sju gånger på ett halvår och det
 * syntes aldrig i något svar.
 *
 * Skriv `const id = aliExpressIdOf(mapping); if (!id) continue;` i loopen, eller
 * filtrera listan med `isAliExpressMapping` först. Typen är erased vid körning
 * — id:t ÄR strängen, så loggning och jämförelser är oförändrade.
 */
export function aliExpressIdOf(
  m: Pick<ProductMappingRecord, "supplier" | "supplierProductId">,
): AliExpressProductId | null {
  if (!isAliExpressMapping(m)) return null;
  const id = m.supplierProductId;
  return id ? (id as AliExpressProductId) : null;
}

/** Motsatsen — för admin-vyer och rapporter som vill titta på Aosom-sidan. */
export function isAosomMapping(
  m: Pick<ProductMappingRecord, "supplier" | "supplierProductId">,
): boolean {
  return mappingSupplier(m) === "aosom";
}

/**
 * Aosoms artikelnummer utan prefix, eller null för andra leverantörer.
 * Används för att matcha en mappningsrad mot en feed-rad vid omkörning.
 */
export function aosomSkuOf(
  m: Pick<ProductMappingRecord, "supplier" | "supplierProductId">,
): string | null {
  if (!isAosomMapping(m)) return null;
  const id = m.supplierProductId ?? "";
  return id.startsWith(AOSOM_ID_PREFIX) ? id.slice(AOSOM_ID_PREFIX.length) : null;
}
