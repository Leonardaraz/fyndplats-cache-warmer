// Ren logik för multi-axel-variantväljaren (Färg × Storlek …). SDK-/React-fri →
// enhetstestbar med node --test. Datan byggs i lib/variant-price.ts (v3MultiVariantData);
// här är bara urvalslogiken: matcha vald kombination → variant, hitta startval, och
// avgöra om ett val är tillgängligt givet de andra valda axlarna.

export type ComboVariant = {
  choices: Record<string, string>; // axelnamn → val-etikett
  variantId: string;
  price: string;
  priceNum: number;
  originalPrice: string;
  inStock: boolean;
  image: string;
};

/** Hittar varianten vars hela kombination matchar `selected` (alla axlar lika). */
export function findVariant(
  table: ReadonlyArray<ComboVariant>,
  selected: Record<string, string>,
): ComboVariant | undefined {
  return table.find((v) => {
    const keys = Object.keys(v.choices);
    return keys.length === Object.keys(selected).length && keys.every((axis) => v.choices[axis] === selected[axis]);
  });
}

/** Startval: första variant som är i lager, annars första varianten. */
export function defaultSelection(table: ReadonlyArray<ComboVariant>): Record<string, string> {
  const v = table.find((x) => x.inStock) ?? table[0];
  return v ? { ...v.choices } : {};
}

/**
 * Sätter `choiceLabel` på `axisName` och håller resultatet på en GILTIG kombination:
 * om {…prev, [axisName]: choiceLabel} inte motsvarar en variant (t.ex. färgen finns
 * inte i den tidigare valda storleken) snäpps ÖVRIGA axlar till en variant som har
 * det klickade valet (helst i lager). Undviker återvändsgränder och att baspriset
 * visas för en obefintlig kombination. Finns valet inte i NÅGON variant → behåll
 * önskat (kombinationen blir då icke-köpbar, vilket är korrekt).
 */
export function reconcileSelection(
  table: ReadonlyArray<ComboVariant>,
  axisName: string,
  choiceLabel: string,
  prev: Record<string, string>,
): Record<string, string> {
  const desired = { ...prev, [axisName]: choiceLabel };
  if (findVariant(table, desired)) return desired;
  const candidates = table.filter((v) => v.choices[axisName] === choiceLabel);
  const best = candidates.find((v) => v.inStock) ?? candidates[0];
  return best ? { ...best.choices } : desired;
}

/**
 * Är `choiceLabel` på `axisName` tillgängligt (finns en variant I LAGER) givet de
 * ANDRA redan valda axlarna? Används för att dämpa omöjliga/slutsålda kombinationer
 * — valet går ändå att klicka (visar då slut-läget), så inga åter­vändsgränder.
 */
export function isChoiceAvailable(
  table: ReadonlyArray<ComboVariant>,
  axisName: string,
  choiceLabel: string,
  selected: Record<string, string>,
): boolean {
  return table.some(
    (v) =>
      v.inStock &&
      v.choices[axisName] === choiceLabel &&
      Object.entries(v.choices).every(([a, l]) => a === axisName || selected[a] === l),
  );
}
