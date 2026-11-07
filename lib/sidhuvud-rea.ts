// REA-knappens regel i sidhuvudet. LÖVMODUL utan värdeimporter, så att
// node --test kan pröva den (lib/sidhuvud.test.ts, lib/rea.test.ts). Menyn och
// knappen byggs i lib/sidhuvud-data.ts.

/** Något nedsatt som går att köpa? Annars leder REA-knappen till en tom lista. */
export function harRea(produkter: readonly { onSale?: boolean; inStock?: boolean }[]): boolean {
  return produkter.some((p) => Boolean(p.onSale && p.inStock));
}
