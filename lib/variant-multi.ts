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
