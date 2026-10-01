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
  // Behåll så många av kundens andra val som möjligt (tre axlar: byt bara den
  // som måste bytas), helst en variant i lager.
  const lika = (v: ComboVariant) =>
    Object.entries(v.choices).filter(([a, l]) => a !== axisName && prev[a] === l).length;
  const rang = (v: ComboVariant) => lika(v) * 2 + (v.inStock ? 1 : 0);
  const best = candidates.reduce<ComboVariant | undefined>((b, v) => (!b || rang(v) > rang(b) ? v : b), undefined);
  return best ? { ...best.choices } : desired;
}

/**
 * De ANDRA axlar som reconcileSelection fick byta när kunden klickade på
 * `axisName`. Tom lista = inget byttes tyst. Väljaren säger då till, så att
 * kunden inte går från 177 till 205 cm (och från 549 till 629 kr) utan att
 * märka det (hammocköverdraget, 2026-10-01).
 */
export function andradeAxlar(
  prev: Record<string, string>,
  next: Record<string, string>,
  axisName: string,
): { axel: string; fran: string; till: string }[] {
  return Object.keys(next)
    .filter((a) => a !== axisName && prev[a] !== undefined && prev[a] !== next[a])
    .map((a) => ({ axel: a, fran: prev[a], till: next[a] }));
}

/**
 * Valets läge givet de andra valda axlarna:
 *  "ok"     — kombinationen finns och går att köpa
 *  "slut"   — kombinationen finns men är slut
 *  "saknas" — kombinationen finns inte alls (Svart görs inte i 177 cm)
 * "saknas" är INTE slut: färgen kan finnas i en annan storlek. Väljaren visar
 * därför de två olika, och bara "slut" får ordet Slut.
 */
export function choiceStatus(
  table: ReadonlyArray<ComboVariant>,
  axisName: string,
  choiceLabel: string,
  selected: Record<string, string>,
): "ok" | "slut" | "saknas" {
  const rader = table.filter(
    (v) =>
      v.choices[axisName] === choiceLabel &&
      Object.entries(v.choices).every(([a, l]) => a === axisName || selected[a] === undefined || selected[a] === l),
  );
  if (!rader.length) return "saknas";
  return rader.some((v) => v.inStock) ? "ok" : "slut";
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
