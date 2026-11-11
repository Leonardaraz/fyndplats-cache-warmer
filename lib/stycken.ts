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

const antalOrd = (s: string) => s.split(/\s+/).filter(Boolean).length;

/**
 * Delar texten i stycken om högst `maxOrd` ord, bara mellan meningar. En text
 * som ryms kommer tillbaka som ett stycke. En mening delas aldrig.
 */
export function delaIStycken(text: string, maxOrd: number = MAX_ORD_PER_STYCKE): string[] {
  const ren = text.trim();
  if (!ren) return [];
  if (antalOrd(ren) <= maxOrd) return [ren];
  // En mening slutar på . ! ? eller …, kanske följt av ett citattecken eller en
  // parentes, och nästa börjar med versal, siffra eller citattecken. "t.ex. en"
  // delas alltså inte.
  const meningar = ren.split(/(?<=[.!?…]["”’')\]]?)\s+(?=[A-ZÅÄÖÉ0-9"“”'(])/u);
  const ut: string[] = [];
  let nu: string[] = [];
  let n = 0;
  for (const m of meningar) {
    const k = antalOrd(m);
    if (nu.length > 0 && n + k > maxOrd) {
      ut.push(nu.join(" "));
      nu = [];
      n = 0;
    }
    nu.push(m);
    n += k;
  }
  if (nu.length > 0) ut.push(nu.join(" "));
  return ut;
}
