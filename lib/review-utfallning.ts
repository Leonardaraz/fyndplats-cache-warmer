// lib/review-utfallning.ts
//
// När en recension får knappen "Visa mer" / "Visa mindre".
//
// ☠️ KNAPPEN AVGÖRS AV EN MÄTNING, INTE AV TECKENANTALET. Fram till 2026-10-12
// visades den för varje text över 320 tecken, med antagandet att det är ungefär
// fem rader, alltså precis över klampen. Det stämmer på en mobil men inte på en
// dator: där är kortet över 1 000 px brett, 320 tecken blir tre rader, och
// knappen fällde ut text som redan syntes. Leonards rapport 2026-10-12: "det
// kommer ingen mer text när man trycker visa mer".
//
// Teckenantalet avgör fortfarande vilka texter som klamppas till fem rader.
// Klampen och knappen renderas redan på servern, så en lång text på mobilen
// hoppar inte när sidan blir interaktiv. Efter laddningen mäter
// components/ProductReviews.tsx om klampen döljer något, och tar bort knappen
// där texten ryms. Bara knappen kan försvinna, aldrig text.

/** Texter längre än så här klamppas till fem rader (.rev-text-klamp). */
export const KLAMP_FRAN_TECKEN = 320;

export function klamppas(text: string): boolean {
  return text.length > KLAMP_FRAN_TECKEN;
}

/**
 * Ska knappen visas?
 *
 * - `lang`: texten klamppas (klamppas ovan).
 * - `utfalld`: kunden har fällt ut den. Då står "Visa mindre" kvar, för en
 *   utfälld text klipps aldrig och kan inte mätas.
 * - `doljer`: mätningen i webbläsaren. null = inte mätt än (servern och första
 *   renderingen), och då visas knappen som förut.
 */
export function visaUtfallningsknapp(o: { lang: boolean; utfalld: boolean; doljer: boolean | null }): boolean {
  if (!o.lang) return false;
  if (o.utfalld) return true;
  return o.doljer !== false;
}

/** Döljer klampen något? En pixel tål avrundning i webbläsarens mått. */
export function klampenDoljer(mått: { scrollHeight: number; clientHeight: number }): boolean {
  return mått.scrollHeight > mått.clientHeight + 1;
}
