// Wix Stores V3 hårda gränser för en produkts options/varianter. En import som
// överskrider någon av dem får create-product att 400:a. capOptionsAndVariants
// (lib/import/variant-cap.ts) kapar ned till dessa innan vi skapar produkten.
//
// CHOICES: en överlastad AliExpress-axel (AE-säljare lägger ibland 100-tals värden
// under "Color"/"Style") sprängde gränsen → 400/428 CHOICES_LIMIT_EXCEEDED.
//
// ⚠️ RUNTIME-TAKET ÄR 100, INTE 200 — höj ALDRIG denna konstant. Wix REST-SCHEMAT
// säger visserligen `maxItems: 200` för Customization.choicesSettings.choices, men
// runtime-felet är entydigt: httpCode 428, code CHOICES_LIMIT_EXCEEDED,
// "Number of choices exceeded the limit of 100 per customization." (Verifierat 2026-06).
// Schemats 200 är en fälla — följer man det och höjer capen återinförs exakt kraschen.
//
// VIKTIGT: detta är per produkt. Den FARLIGA gränsen är den BUTIKS-GLOBALA: varje delad
// "customization" (option matchad på name + customizationRenderType) cappas också på 100
// val över HELA butiken. capOptionsAndVariants ser bara per-produkt-bilden och kan
// strukturellt aldrig se den globala hinken — den hanteras separat (se
// lib/wix/customization-identity.ts + lib/wix/prune-customizations.ts).
export const WIX_MAX_CHOICES_PER_OPTION = 100;
export const WIX_MAX_OPTIONS_PER_PRODUCT = 6;
export const WIX_MAX_VARIANTS_PER_PRODUCT = 1000;

/**
 * Längsta namn på en option eller ett val (`name` och `key` på `ConnectedOption`
 * och `ConnectedOptionChoice`). Schemat säger `maxLength: 50`, och runtime
 * säger detsamma: VEVOR-importen 2026-10-30 fick `400 … choices[1].name has
 * size 58, expected 50 or less`. Uppmätt, inte bara läst.
 */
export const WIX_MAX_VALNAMN = 50;

/**
 * Butiks-global gräns: max antal val i EN delad customization (option matchad på
 * name + customizationRenderType) över hela butiken. Samma 100 som per produkt, men
 * en helt annan, ackumulerande gräns. Se customization-identity.ts.
 */
export const WIX_MAX_CHOICES_PER_CUSTOMIZATION = 100;

/**
 * Media per produkt (`media.itemsInfo.items`).
 *
 * ☠️ UPPMÄTT 2026-10-21, INTE LÄST: Wix tar 50, inte de 15 som "About Product
 * Media" säger. En dold testprodukt (raderad direkt efteråt) fick 16, 20, 25,
 * 30, 40, 46 och 50 bilder, och varje skrivning lästes tillbaka i ett eget
 * anrop. Den 51:a gav `400 MAX_SIZE` ("has size 51, expected 50 or less",
 * threshold 50). Dessutom höll 86 publicerade sidor redan 16–46 bilder när
 * mätningen gjordes, skrivna av sammanslagningen.
 *
 * Samma hållning som CHOICES-taket ovan, åt andra hållet: dokumentationen
 * hade fel, och här var felet försiktigt. Konstanten höjs eller sänks bara
 * efter en ny mätning. Bildtaket i `lib/aosom/` och planernas validering i
 * `lib/polish/` läser den här, så ett nytt tal ändras på ETT ställe.
 */
export const WIX_MAX_BILDER_PER_PRODUKT = 50;

/**
 * Produkter per butik (Wix Stores). VEVOR-importen prövar den före första
 * produkten och lämnar plats åt allt annat (lib/vevor/import.ts).
 */
export const WIX_MAX_PRODUKTER = 50_000;

/**
 * Sidtak för ett svep över HELA katalogen, 100 produkter per sida: Wix tak och
 * tio sidor till. Ett svep som når det har en markör som aldrig tar slut, inte
 * en stor katalog, och ska kasta.
 *
 * ☠️ VARFÖR TAKET HÄNGER PÅ WIX TAK (2026-10-29). Fem svep hade egna tak på
 * 200 eller 300 sidor, "långt över nuvarande katalog". VEVOR-importen tar
 * katalogen från ~6 300 till ~22 000 produkter. Prislistan som Aosom- och
 * VEVOR-synken läser och svepet bakom Prisjakt-flödet hade kastat vid 20 000,
 * och städningen av val likaså. Inget av dem hade skrivit fel, men priserna och
 * flödet hade stannat ungefär ett dygn efter att importen slagits på. Samma
 * klass som `listVisibleV3ProductIds` 2026-09-14: en konstant som var rätt när
 * den sattes och blev fel när volymen växte.
 *
 * ⚠️ Taket är inte tidsbudgeten. Katalogsvepet för färgbilderna och raderingen
 * av pensionerade utkast (`listCatalogProductMedia`) har 150–170 sekunder, och
 * det tog under en minut för ~6 000 produkter (2026-09-28). Med 22 000 kan det
 * ta längre än budgeten. Då slutar svepet ofullständigt och verktygen vägrar,
 * som de ska. Mät efter importen.
 */
export const KATALOG_SIDTAK = Math.ceil(WIX_MAX_PRODUKTER / 100) + 10;
