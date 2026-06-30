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
 * Butiks-global gräns: max antal val i EN delad customization (option matchad på
 * name + customizationRenderType) över hela butiken. Samma 100 som per produkt, men
 * en helt annan, ackumulerande gräns. Se customization-identity.ts.
 */
export const WIX_MAX_CHOICES_PER_CUSTOMIZATION = 100;
