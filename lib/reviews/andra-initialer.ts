// Ändra initialerna på EN utpekad recension (Leonard 2026-10-29: "ändra bokstav
// för initialer").
//
// Recensionen letas upp som i dolj-enskild.ts: en bit av texten, plus gärna de
// nuvarande initialerna och datumet. Sedan byts bara initialerna. Texten,
// betyget, datumet och STATUSEN följer med oförändrade: en godkänd recension
// förblir godkänd, en väntande förblir väntande.
//
// Skyddet mot att ändra fel rad: en skarp körning kräver att träffarna är minst
// 1 och högst `max` (standard 1). Fler träffar → ingenting skrivs, och
// torrkörningen visar vilka rader det gällde så sökningen kan skärpas.
import type { StoredReview } from "../store/reviews";
import { hittaRecensioner, sokningFel, type DoljSokning } from "./dolj-enskild";

/**
 * Initialer som butiken visar: en eller två versaler med punkt efter varje,
 * "S." eller "S.S.". Samma form som initialerAvNamn (kundinitialer.ts) ger.
 */
const FORM = /^\p{Lu}\.(\p{Lu}\.)?$/u;

/**
 * De nya initialerna, rättade till butikens form, eller null när de inte går
 * att rätta. "s.s", "S S" och "ss" blir "S.S."; en bokstav blir "S.".
 * Tecken som inte är bokstäver kastas, så fler än två bokstäver ger null i
 * stället för att gissa vilka två som avsågs.
 */
export function normaliseraInitialer(inmatning: string): string | null {
  const bokstaver = [...(inmatning ?? "")].filter((c) => /\p{L}/u.test(c)).map((c) => c.toLocaleUpperCase("sv-SE"));
  if (bokstaver.length < 1 || bokstaver.length > 2) return null;
  const ut = bokstaver.map((b) => `${b}.`).join("");
  return FORM.test(ut) ? ut : null;
}

export interface AndraPlan {
  traffar: StoredReview[];
  /** Träffar som faktiskt byter initialer, de som en skarp körning skriver. */
  attAndra: StoredReview[];
  /** Normaliserade nya initialer, null när inmatningen var ogiltig. */
  nya: string | null;
  /** Null när en skarp körning får skriva, annars skälet. */
  stopp: string | null;
}

export function planeraAndraInitialer(
  rader: StoredReview[],
  sokning: DoljSokning,
  nyaInmatning: string,
  max = 1,
): AndraPlan {
  const nya = normaliseraInitialer(nyaInmatning);
  const fel = sokningFel(sokning);
  if (fel) return { traffar: [], attAndra: [], nya, stopp: fel };
  if (!nya) {
    return { traffar: [], attAndra: [], nya, stopp: "nya initialer måste vara en eller två bokstäver, t.ex. S.K." };
  }
  const traffar = hittaRecensioner(rader, sokning);
  const attAndra = traffar.filter((r) => r.initials !== nya);
  let stopp: string | null = null;
  if (attAndra.length === 0) stopp = traffar.length ? "har redan de initialerna" : "ingen träff";
  else if (attAndra.length > max) stopp = `${attAndra.length} träffar, max ${max}: skärp sökningen`;
  return { traffar, attAndra, nya, stopp };
}
