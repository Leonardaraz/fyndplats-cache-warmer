// Centraliserar EN antagande som hela den varaktiga val-tak-hanteringen vilar på:
// hur Wix Stores V3 avgör om två produkters option är SAMMA delade "customization".
//
// EMPIRISKT VERIFIERAT (read-only mot live-butiken, 2026-06-30):
//   • Customizations är butiks-GLOBALA, delade entiteter (en option per produkt ÄR en
//     customization). Det finns ingen produkt-lokal option i V3.
//   • Matchning sker på (name + customizationRenderType) inom customizationType=PRODUCT_OPTION.
//     Bevis: butiken har TVÅ separata "Färg"-customizations — en SWATCH_CHOICES (id
//     719645a9…, 22 val) och en TEXT_CHOICES (id 0b32a475…, 24 val). Samma namn, olika
//     render-typ → två oberoende hinkar, var och en med eget 100-vals-tak.
//   • Skapar man en produkt med en option vars (name+renderType) matchar en befintlig
//     customization → Wix återanvänder den (tyst). Ett nytt par → ny fristående customization.
//     Det finns ingen dokumenterad gräns på ANTALET customizations.
//
// Att hålla matchningsnyckeln på ETT ställe betyder att om Wix någon gång ändrar regeln
// blir det en enradsfix här, inte tre tysta mis-targets i prune/pre-flight/self-heal.

import { WIX_MAX_CHOICES_PER_CUSTOMIZATION } from "./limits";

/** Wix V3 render-typ för en option/customization. Öppen sträng för framtidssäkerhet. */
export type WixCustomizationRenderType = "TEXT_CHOICES" | "SWATCH_CHOICES" | (string & {});

/** Minsta gemensamma form vi behöver för att identifiera en customization-"hink". */
export interface CustomizationIdentityInput {
  name: string;
  /** Wix-fältet på customization-entiteten heter `customizationRenderType`. */
  renderType: WixCustomizationRenderType;
}


/**
 * Stabil nyckel som identifierar EN delad customization-hink. Två options med samma
 * nyckel landar i samma butiks-globala val-lista (och delar dess 100-vals-tak).
 *
 * Normaliserar namnet defensivt (trim) — render-typen är en enum och lämnas orörd.
 * OBS: vi normaliserar INTE bort skiftläge/diakritik; Wix matchar exakt, och att gissa
 * annorlunda skulle ge fel hink.
 */
export function customizationIdentityKey(input: CustomizationIdentityInput): string {
  return JSON.stringify([(input.name ?? "").trim(), input.renderType ?? ""]);
}

/** Är två options samma delade customization-hink? */
export function sameCustomizationBucket(
  a: CustomizationIdentityInput,
  b: CustomizationIdentityInput,
): boolean {
  return customizationIdentityKey(a) === customizationIdentityKey(b);
}

/** Lediga val-platser i en hink innan Wix 100-taket nås (aldrig negativt). */
export function customizationHeadroom(choiceCount: number): number {
  return Math.max(0, WIX_MAX_CHOICES_PER_CUSTOMIZATION - choiceCount);
}

/** True om hinken ligger på/över larmnivån (default 85 av 100). */
export function isCustomizationNearLimit(choiceCount: number, warnAt = 85): boolean {
  return choiceCount >= warnAt;
}
