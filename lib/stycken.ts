// lib/stycken.ts
//
// EN LÅNG TEXT DELAS I STYCKEN VID MENINGSGRÄNSERNA.
//
// ☠️ MÄTT 2026-11-11 (Semrush, "Content not optimized", kategorin AI Search).
// 22 produktsidor pekades ut. På var och en fanns ett enda stycke på 158–219
// ord: på 13 sidor en lång kundrecension, på 9 ett stycke i produkttexten.
// Sidor utan fynd hade högst 84 ord i ett stycke. En maskinläsare får annars
// hela texten som ett block utan struktur.
//
// Texten ändras aldrig: samma ord i samma ordning, bara fler <p>. Hur styckena
// ser ut avgör den som ritar dem (recensionerna ritar dem i följd, så att
// klampen på fem rader och "Visa mer" fungerar som förut).
//
// ☠️ MODULEN GÅR TILL WEBBLÄSAREN (recensionerna är en klientkomponent). Därför
// inga bakåtblickande reguljära uttryck här: Safari före 16.4 kan inte läsa dem,
// och då faller hela skriptfilen, inte bara delningen. Butiken lovar iOS 14 och
// uppåt (browserslist i package.json). `lib/stycken.test.ts` vaktar det.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den.

/** Så många ord får ett stycke högst ha, om inte en enda mening är längre. */
export const MAX_ORD_PER_STYCKE = 70;
/** Ett färdigt stycke i en HTML-text delas först när det är längre än så här. */
export const DELA_FRAN_ORD = 84;

const antalOrd = (s: string) => s.split(/\s+/).filter(Boolean).length;

/**
 * Förkortningar som följs av mer text i samma mening. Efter dem börjar ingen ny
 * mening, hur nästa ord än ser ut: "ca. 10 cm", "max. 135 kg", "kl. 10".
 * Förkortningar som oftast AVSLUTAR en mening (osv., m.m., etc.) står inte här.
 */
const EJ_MENINGSSLUT = new Set([
  "ca", "c:a", "max", "min", "t.ex", "bl.a", "inkl", "exkl", "resp", "kl", "nr",
  "dvs", "d.v.s", "s.k", "ev", "fr.o.m", "t.o.m",
]);

/** Sista ordet före punkten, utan inledande citattecken och parenteser. */
const sistaOrdet = (fore: string) => (fore.split(/\s+/).pop() || "").replace(/^["“”'(\[]+/, "");

/**
 * Delar texten i meningar. En mening slutar på . ! ? eller …, kanske följt av
 * ett citattecken eller en parentes, och nästa börjar efter ett vanligt
 * mellanslag med versal, siffra eller citattecken. "t.ex. en" delas alltså inte.
 *
 * Tre ställen är ALDRIG en meningsgräns, för där skulle ett nytt stycke hamna
 * mitt i en uppgift:
 *   - efter en förkortning i EJ_MENINGSSLUT ("max." | "135 kg"),
 *   - efter ett ensamt tal med punkt, alltså en numrering ("2." | "Skruva fast"),
 *   - vid ett hårt mellanslag, som skribenten satt för att hålla ihop orden.
 * En utebliven delning gör bara ett stycke lite längre. En felaktig syns.
 */
function delaIMeningar(ren: string): string[] {
  const slut = /([.!?…]["”’')\]]?)[ \t\r\n]+(?=[A-ZÅÄÖÉ0-9"“”'(])/gu;
  const ut: string[] = [];
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = slut.exec(ren)) !== null) {
    if (m[1][0] === ".") {
      const ord = sistaOrdet(ren.slice(start, m.index));
      if (EJ_MENINGSSLUT.has(ord.toLowerCase()) || /^\d+$/.test(ord)) continue;
    }
    ut.push(ren.slice(start, m.index + m[1].length));
    start = m.index + m[0].length;
  }
  ut.push(ren.slice(start));
  return ut;
}

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
  const meningar = delaIMeningar(ren);
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
 * Ett stycke med ett `id` lämnas också: delarna ärver attributen, och ett id
 * får bara stå på ett ställe på sidan.
 */
export function delaLangaStyckenIHtml(
  html: string,
  franOrd: number = DELA_FRAN_ORD,
  maxOrd: number = MAX_ORD_PER_STYCKE,
): string {
  if (!html || !html.includes("<p")) return html;
  return html.replace(/<p(\s[^>]*)?>([^<]*)<\/p>/g, (hela: string, attribut: string | undefined, inre: string) => {
    if (antalOrd(inre) <= franOrd) return hela;
    if (attribut && /\sid\s*=/i.test(attribut)) return hela;
    const delar = delaIStycken(inre, maxOrd);
    if (delar.length < 2) return hela;
    return delar.map((d) => `<p${attribut || ""}>${d}</p>`).join("");
  });
}
