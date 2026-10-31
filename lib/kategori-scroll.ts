// lib/kategori-scroll.ts
//
// Var kategorilistan ska börja när den öppnas (Leonard 2026-10-31: "när man
// klickar på den ska man hamna där på menyn listan så det blir lättare o
// navigera dens undermeny om den har en").
//
// Listan öppnas överst, och den aktiva kategorin kan ligga långt ner. Den
// aktiva kategorins grupp (avdelningen med sina underkategorier) läggs därför
// överst i listan. Får den aktiva raden inte plats då läggs den en tredjedel
// ner, så att det som står runt den syns.
//
// Alla mått är skärmkoordinater (getBoundingClientRect) utom scrollTop och
// höjden. Listan och gruppen flyttas lika mycket av panelens inglidning, så
// skillnaden mellan dem stämmer även mitt i animationen.

export const MARGINAL = 8;

export type ScrollMatt = {
  /** Listans nuvarande scrollTop. */
  scrollTop: number;
  /** Listans överkant på skärmen. */
  kroppTopp: number;
  /** Listans synliga höjd (clientHeight). */
  hojd: number;
  /** Den aktiva gruppens överkant på skärmen. */
  gruppTopp: number;
  /** Den aktiva radens över- och underkant på skärmen. */
  aktivTopp: number;
  aktivBotten: number;
};

export function scrollTillAktiv(p: ScrollMatt): number {
  const iListan = (skarm: number) => skarm - p.kroppTopp + p.scrollTop;
  let mal = iListan(p.gruppTopp) - MARGINAL;
  const aktivTopp = iListan(p.aktivTopp);
  const aktivBotten = iListan(p.aktivBotten);
  if (aktivBotten - mal > p.hojd - MARGINAL) {
    mal = aktivTopp - Math.round(p.hojd / 3);
  }
  return Math.max(0, Math.round(mal));
}

/** Den grupp som bär den aktiva kategorin, som avdelning eller underkategori. */
export function aktivGruppId(
  tree: { id: string; slug?: string; subs: { slug?: string }[] }[],
  activeSlug?: string,
): string | null {
  if (!activeSlug) return null;
  for (const root of tree) {
    if (root.slug === activeSlug) return root.id;
    if (root.subs.some((s) => s.slug === activeSlug)) return root.id;
  }
  return null;
}
