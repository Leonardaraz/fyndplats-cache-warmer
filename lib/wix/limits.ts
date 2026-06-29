// Wix Stores V3 hårda gränser för en produkts options/varianter. En import som
// överskrider någon av dem får create-product att 400:a. capOptionsAndVariants
// (lib/import/variant-cap.ts) kapar ned till dessa innan vi skapar produkten.
//
// CHOICES: en överlastad AliExpress-axel (AE-säljare lägger ibland 100-tals värden
// under "Color"/"Style") sprängde gränsen → 400 CHOICES_LIMIT_EXCEEDED. Wix
// felmeddelanden har angett både "200" och "100 per customization" — vi cappar på
// det LÄGRE (100) så importen håller oavsett option-typ. Ändra här om Wix höjer.
export const WIX_MAX_CHOICES_PER_OPTION = 100;
export const WIX_MAX_OPTIONS_PER_PRODUCT = 6;
export const WIX_MAX_VARIANTS_PER_PRODUCT = 1000;
