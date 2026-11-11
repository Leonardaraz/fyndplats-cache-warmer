// lib/stycken.ts
//
// EN LÅNG TEXT DELAS I STYCKEN VID MENINGSGRÄNSERNA.
//
// ☠️ MÄTT 2026-11-11 (Semrush, "Content not optimized", kategorin AI Search).
// 22 produktsidor pekades ut. På var och en fanns ett enda stycke på 158–219
// ord, nästan alltid en lång kundrecension. Sidor utan fynd hade högst 84 ord i
// ett stycke. En maskinläsare får hela recensionen som ett block utan struktur.
//
// Texten ändras aldrig: samma ord i samma ordning, bara fler <p>. Hur styckena
// ser ut avgör den som ritar dem (recensionerna ritar dem i följd, så att
// klampen på fem rader och "Visa mer" fungerar som förut).
//
// LÖVMODUL med flit, så att `node --test` kan ladda den.

/** Så många ord får ett stycke högst ha, om inte en enda mening är längre. */
export const MAX_ORD_PER_STYCKE = 70;
/** Ett färdigt stycke i en HTML-text delas först när det är längre än så här. */
export const DELA_FRAN_ORD = 84;

const antalOrd = (s: string) => s.split(/\s+/).filter(Boolean).length;

/**
 * Delar texten i stycken om högst `maxOrd` ord, bara mellan meningar. En text
 * som ryms kommer tillbaka som ett stycke. En mening delas aldrig.
 *
 * Styckena blir ungefär lika långa: 90 ord blir 45 + 45, inte 70 + 20. Ett
 * stycke stängs när det nått sin andel av texten, eller när nästa mening inte
 * ryms.
 */
export function delaIStycken(text: string, maxOrd: number = MAX_ORD_PER_STYCKE): string[] {
  const ren = text.trim();
  if (!ren) return [];
  if (antalOrd(ren) <= maxOrd) return [ren];
  // En mening slutar på . ! ? eller …, kanske följt av ett citattecken eller en
  // parentes, och nästa börjar med versal, siffra eller citattecken. "t.ex. en"
  // delas alltså inte.
  const meningar = ren.split(/(?<=[.!?…]["”’')\]]?)\s+(?=[A-ZÅÄÖÉ0-9"“”'(])/u);
  const totalt = antalOrd(ren);
  const andel = Math.ceil(totalt / Math.ceil(totalt / maxOrd));
  const ut: string[] = [];
  let nu: string[] = [];
  let n = 0;
  const stang = () => {
    ut.push(nu.join(" "));
    nu = [];
    n = 0;
  };
  for (const m of meningar) {
    const k = antalOrd(m);
    if (nu.length > 0 && n + k > maxOrd) stang();
    nu.push(m);
    n += k;
    if (n >= andel) stang();
  }
  if (nu.length > 0) stang();
  return ut;
}

/**
 * Delar varje `<p>` i en HTML-text som är längre än `franOrd` ord i flera
 * `<p>`, vid meningsgränserna. Attributen på stycket följer med till varje del.
 *
 * ☠️ MÄTT 2026-11-11 på förhandsbygget: på 9 av Semrush 22 produktsidor satt
 * det långa stycket inte i en recension utan i produkttextens flik "Användning
 * och skötsel", 164–185 ord i ett enda `<p>`. Texten i Wix rörs inte: orden är
 * desamma, sidan ritar dem bara som flera stycken.
 *
 * Bara stycken som är REN TEXT delas. Ett stycke med en tagg i sig (en länk,
 * fetstil) lämnas som det är, för en delning får aldrig hamna mitt i en tagg.
 */
export function delaLangaStyckenIHtml(
  html: string,
  franOrd: number = DELA_FRAN_ORD,
  maxOrd: number = MAX_ORD_PER_STYCKE,
): string {
  if (!html || !html.includes("<p")) return html;
  return html.replace(/<p(\s[^>]*)?>([^<]*)<\/p>/g, (hela: string, attribut: string | undefined, inre: string) => {
    if (antalOrd(inre) <= franOrd) return hela;
    const delar = delaIStycken(inre, maxOrd);
    if (delar.length < 2) return hela;
    return delar.map((d) => `<p${attribut || ""}>${d}</p>`).join("");
  });
}
