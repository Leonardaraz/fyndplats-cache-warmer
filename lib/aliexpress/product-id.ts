// Ett produkt-id som FAKTISKT går att slå upp mot AliExpress DS-API:t.
//
// Bakgrunden är ett fel som redan hänt sex gånger och hittades en sjunde
// (audit 2026-08-28): `/api/aliexpress/sync-all` läste `listMappings()` och
// skickade varje rads `supplierProductId` till `getInventory`. Sedan
// Aosom-importen bär 4 432 av raderna ett artikelnummer ("aosom:845-030CG")
// som aldrig kan träffa AE — omöjliga uppslag som äter API-budgeten och
// tränger undan de produkter som faktiskt behöver synkas. Rutten NOLLAR
// dessutom lagret vid `offline`, så en felklassad rad kunde tömma en
// Aosom-produkt.
//
// Spärren `isAliExpressMapping` fanns redan i de sex andra vägarna. Att lägga
// till den på ett sjunde ställe löser dagens fall och inte nästa — därför är
// id:t numera en EGEN TYP. En naken `string` går inte längre att skicka in, och
// den enda vägen från en mappningsrad går genom `aliExpressIdOf`, som
// returnerar null för Aosom. Nästa gång någon glömmer spärren blir det ett
// kompileringsfel i stället för tusentals tysta anrop.
//
// Typen är ren kompileringstid: `AliExpressProductId` ÄR en string vid körning,
// så loggning, jämförelser och Map-nycklar fungerar precis som förut.

declare const aliExpressIdBrand: unique symbol;

/**
 * Ett AliExpress-produkt-id. Skapas bara via `aliExpressIdOf` (från en
 * mappningsrad, med leverantörsspärren) eller `aliExpressIdFromListing`
 * (för id som kommer från AliExpress själv).
 */
export type AliExpressProductId = string & { readonly [aliExpressIdBrand]: true };

/**
 * För id som kommer från AliExpress SJÄLV och alltså inte kan vara något annat:
 * en AE-URL någon klistrat in, ett sökträffs-id, ett id tillägget skrapat från
 * en AE-produktsida, ett id ur ett DS-svar.
 *
 * ☠️ Använd den ALDRIG på `mapping.supplierProductId` — det är exakt det felet
 * typen finns för att fånga. Där heter vägen `aliExpressIdOf`.
 */
export function aliExpressIdFromListing(id: string): AliExpressProductId {
  return id as AliExpressProductId;
}
