// lib/seo/grannlankar.ts
//
// VARJE SIDA I EN GRUPP FÅR LÄNKAR FRÅN SINA GRANNAR.
//
// ☠️ MÄTT 2026-11-11 (Semrush, "Pages with only one incoming internal link",
// som också räknas i kategorin AI Search). 50 prissidor (/under-…-kr/<kategori>)
// hade en enda intern länk: den från sin egen kategorisida. Två intressesidor
// och två blogginlägg hade också bara en. Orsaken var densamma på alla tre
// ställena: listan med "fler sidor" togs med `.slice(0, 3)` från början, så de
// första sidorna fick alla länkar och de sista inga, eller så fanns ingen lista
// alls.
//
// Därför en RING: varje sida länkar till de närmast följande i ordningen, och
// den sista fortsätter från början. Då får varje sida lika många länkar in som
// den har ut, hur lång listan än är.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den.

/**
 * De `antal` element som följer efter `index`, runt hörnet. Elementet självt
 * är aldrig med. Tom lista för ett index utanför listan.
 */
export function ringEfter<T>(lista: readonly T[], index: number, antal: number): T[] {
  const n = lista.length;
  if (index < 0 || index >= n || antal <= 0) return [];
  const ut: T[] = [];
  for (let steg = 1; steg < n && ut.length < antal; steg++) ut.push(lista[(index + steg) % n]);
  return ut;
}

export type TrappKategori = { id: string; slug: string; name: string; parentId: string | null };
export type Trappsteg = { price: number; categorySlug: string };
export type Grannlank = { href: string; label: string };

/** Så många syskonkategoriers prissidor länkas från en prissida. */
export const MAX_SYSKON = 4;
/** Så många underkategoriers prissidor länkas från avdelningens prissida. */
export const MAX_BARN = 12;

/** Högsta giltiga prisnivån per kategori: den som står i sitemapen. */
export function hogstaTrappa(steg: readonly Trappsteg[]): Map<string, number> {
  const ut = new Map<string, number>();
  for (const s of steg) if ((ut.get(s.categorySlug) || 0) < s.price) ut.set(s.categorySlug, s.price);
  return ut;
}

/**
 * Prissidorna runt en kategori: avdelningens, underkategoriernas och de
 * närmast följande syskonens. Bara kategorier som har en giltig prissida, och
 * alltid den högsta nivån, som är sidans canonical.
 */
export function prisgrannar(
  cat: TrappKategori,
  kategorier: readonly TrappKategori[],
  steg: readonly Trappsteg[],
  maxSyskon: number = MAX_SYSKON,
): Grannlank[] {
  const hogst = hogstaTrappa(steg);
  const har = (c: TrappKategori) => hogst.has(c.slug);
  const lank = (c: TrappKategori): Grannlank => ({
    href: `/under-${hogst.get(c.slug)}-kr/${c.slug}`,
    label: `${c.name} under ${hogst.get(c.slug)} kr`,
  });
  const ut: Grannlank[] = [];
  const foralder = cat.parentId ? kategorier.find((c) => c.id === cat.parentId) : undefined;
  if (foralder && har(foralder)) ut.push(lank(foralder));
  ut.push(...kategorier.filter((c) => c.parentId === cat.id && har(c)).slice(0, MAX_BARN).map(lank));
  const syskon = kategorier.filter((c) => (c.parentId || null) === (cat.parentId || null) && har(c));
  ut.push(...ringEfter(syskon, syskon.findIndex((c) => c.id === cat.id), maxSyskon).map(lank));
  return ut;
}

/**
 * Från så många länkar är länkraden EN rad i sidled på mobilen. Med färre
 * radbryts den som förut.
 *
 * ☠️ MÄTT 2026-11-11 på förhandsbygget, 390 px: /under-1000-kr/mobler fick 19
 * länkar, och som rader blev de 18 rader och 1 014 px (förut 2 rader, 102 px).
 * Varje länk är för lång för att två ska rymmas i bredd. Med en rad i sidled,
 * samma mönster som kategorisidans underkategorier, är blocket en rad högt
 * hur många länkarna än är. På datorn radbryts de som förut (5 rader).
 */
export const SVEP_FRAN_LANKAR = 7;

export function svepRad(antalLankar: number): boolean {
  return antalLankar >= SVEP_FRAN_LANKAR;
}
