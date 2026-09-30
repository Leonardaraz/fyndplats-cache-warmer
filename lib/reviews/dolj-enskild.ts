// Dölj EN recension som Leonard pekar ut ("radera denna recension", 2026-09-30).
//
// /admin/reviews visar högst 300 rader och har ingen sökning, så en godkänd
// recension bland tusentals gick inte att hitta där. Här letas den upp på det
// kunden ser: en bit av texten, plus gärna initialerna och datumet.
//
// Dölja = status "rejected", samma som knappen Avvisa. Inget raderas, och
// raden kan återställas i /admin/reviews.
//
// Skyddet mot att dölja för mycket: skarp körning kräver att träffarna är
// minst 1 och högst `max` (standard 1). Fler träffar än så → ingenting skrivs,
// och torrkörningen visar vilka rader det gällde så sökningen kan skärpas.
import type { StoredReview } from "../store/reviews";

export interface DoljSokning {
  /** Del av recensionstexten, minst 10 tecken. Skiftläge spelar ingen roll. */
  text: string;
  /** Visningsnamnet, t.ex. "Q.R.". */
  initialer?: string;
  /** Datumets början, t.ex. "2025-11-12". */
  datum?: string;
  /** Wix produkt-id. */
  produkt?: string;
}

export const MINSTA_TEXT = 10;

const norm = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim().toLowerCase();

export function sokningFel(s: DoljSokning): string | null {
  if (norm(s.text).length < MINSTA_TEXT) return `text måste vara minst ${MINSTA_TEXT} tecken`;
  if (s.datum && !/^\d{4}(-\d{2}){0,2}$/.test(s.datum.trim())) return "datum ska vara ÅÅÅÅ-MM-DD";
  return null;
}

/** Rader som matchar sökningen, oavsett status. */
export function hittaRecensioner(rader: StoredReview[], s: DoljSokning): StoredReview[] {
  const text = norm(s.text);
  const init = norm(s.initialer);
  const datum = (s.datum ?? "").trim();
  const produkt = (s.produkt ?? "").trim();
  return rader.filter((r) => {
    if (produkt && r.productId !== produkt) return false;
    if (init && norm(r.initials) !== init) return false;
    if (datum && !(r.date ?? "").startsWith(datum)) return false;
    return norm(r.textSwedish).includes(text) || norm(r.textOriginal).includes(text);
  });
}

export interface DoljPlan {
  traffar: StoredReview[];
  /** Träffar som inte redan är dolda — de som en skarp körning skriver. */
  attDolja: StoredReview[];
  /** Null när en skarp körning får skriva, annars skälet. */
  stopp: string | null;
}

export function planeraDolj(rader: StoredReview[], s: DoljSokning, max = 1): DoljPlan {
  const fel = sokningFel(s);
  if (fel) return { traffar: [], attDolja: [], stopp: fel };
  const traffar = hittaRecensioner(rader, s);
  const attDolja = traffar.filter((r) => r.status !== "rejected");
  let stopp: string | null = null;
  if (attDolja.length === 0) stopp = traffar.length ? "redan dold" : "ingen träff";
  else if (attDolja.length > max) stopp = `${attDolja.length} träffar, max ${max}: skärp sökningen`;
  return { traffar, attDolja, stopp };
}
