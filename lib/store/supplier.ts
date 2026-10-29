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

import { LEVERANTORER, type Leverantor, type MappingSupplier, type ProductMappingRecord } from "./index";
import type { AliExpressProductId } from "../aliexpress/product-id";
import { AOSOM_ID_PREFIX, VEVOR_ID_PREFIX } from "./leverantorsprefix";

/** Sant för ett värde som står i `LEVERANTORER`. Fältet är fri text i databasen. */
export function arKandLeverantor(varde: unknown): varde is MappingSupplier {
  return typeof varde === "string" && (LEVERANTORER as readonly string[]).includes(varde);
}

/**
 * Leverantören för en rad. Läser det sparade fältet först och faller tillbaka på
 * id-prefixet — så att en rad som skrevs innan `supplier` fanns, eller som
 * tappade fältet i en partiell uppdatering, ändå klassas rätt. Default
 * "aliexpress": det är vad varenda rad i katalogen var före 2026-08-27.
 *
 * ☠️ VÄLJ VÄG MED `switch` OCH `assertNever`, INTE MED "aosom, annars
 * AliExpress". Svaret har fyra värden sedan VEVOR lades till (2026-10-21), och
 * ett val med två grenar skickar den tredje leverantören in i fel gren utan
 * att något fel syns. `leverantorsval-grind.test.ts` fäller de vanliga
 * formerna av ett sådant val.
 *
 * "okand" betyder ett sparat värde utanför `LEVERANTORER`. En sådan rad var
 * redan före 2026-10-21 varken AE eller Aosom för spärrarna nedan; svaret
 * gör bara det synligt. Default för en rad UTAN fält och utan känt prefix är
 * fortfarande "aliexpress", så ingen befintlig rad byter klass.
 */
export function mappingSupplier(m: Pick<ProductMappingRecord, "supplier" | "supplierProductId">): Leverantor {
  const falt: unknown = m.supplier;
  if (falt) return arKandLeverantor(falt) ? falt : "okand";
  if (m.supplierProductId?.startsWith(AOSOM_ID_PREFIX)) return "aosom";
  if (m.supplierProductId?.startsWith(VEVOR_ID_PREFIX)) return "vevor";
  return "aliexpress";
}

/**
 * Klassningen som ett värde att SPARA i `supplier`, för en rad vars
 * `supplierProductId` ska tömmas (pensionering, radering). Utan fältet hade den
 * tömda raden fallit tillbaka på default och klassats som AliExpress.
 *
 * Ett okänt sparat värde skrivs inte om till "okand": raden behåller det och
 * fortsätter vara varken AE eller Aosom, precis som före tömningen.
 */
export function frystLeverantor(
  m: Pick<ProductMappingRecord, "supplier" | "supplierProductId">,
): MappingSupplier | undefined {
  const leverantor = mappingSupplier(m);
  if (leverantor !== "okand") return leverantor;
  return m.supplier;
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
 * Raderna AE-synken faktiskt arbetar med: ett id, AliExpress-klass och inte
 * pensionerade. Används av synken (lib/sync/aliexpress-sync.ts) och av
 * räkningen per leverantör (lib/store/leverantorsrakning.ts), så att båda
 * räknar exakt samma urval i stället för var sin kopia av villkoret.
 */
export function arIAeSynkensUrval(
  m: Pick<ProductMappingRecord, "supplier" | "supplierProductId" | "draftStatus">,
): boolean {
  return Boolean(m.supplierProductId) && isAliExpressMapping(m) && m.draftStatus !== "rejected";
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

/**
 * Sant bara för Aosom-rader. Det är INTE motsatsen till `isAliExpressMapping`:
 * en VEVOR-rad eller en "okand" är varken eller. Använd den som positivt filter
 * ("bara Aosom går vidare"), aldrig som "allt som inte är AliExpress".
 */
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

/**
 * VEVOR:s artikelnummer utan prefix, eller null för andra leverantörer.
 * Positivt filter, som `aosomSkuOf`: bara en VEVOR-rad ger ett nummer.
 */
export function vevorSkuOf(
  m: Pick<ProductMappingRecord, "supplier" | "supplierProductId">,
): string | null {
  if (mappingSupplier(m) !== "vevor") return null;
  const id = m.supplierProductId ?? "";
  return id.startsWith(VEVOR_ID_PREFIX) ? id.slice(VEVOR_ID_PREFIX.length) : null;
}
