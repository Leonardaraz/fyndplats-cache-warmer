// Produktsidans brödsmula: Hem / avdelning / underkategori / produkt.
//
// Brödsmulan visade bara avdelningen, alltså Hem / Möbler / produkt. De
// smala sökordskategorierna (Snurrfåtöljer, Hörnskrivbord, Massagebänkar …)
// fick därför ingen länk från sina egna produkter. Bläddringsraden länkar
// visserligen till ett avsnitt, men det är det första i menyordningen. Mätt
// 2026-09-24 på 40 produkter som ligger i flera underkategorier: 5 länkade till
// sin smalaste. De åtta hörnskrivborden länkade till Dator & Gaming, och
// massagebänkarna till Massage & Återhämtning.
//
// Regeln: den SMALASTE underkategorin produkten ligger i, räknat i produkter
// på kategorisidan, och bara om den sidan får indexeras. Avdelningen blir
// underkategorins förälder, så att kedjan alltid är sammanhängande. En
// underkategori med 1–4 produkter hoppas över, eftersom den sidan är noindex.
// Ligger produkten inte i någon indexerbar underkategori gäller den gamla
// regeln: första avdelningen, annars första kategorin.
//
// Tröskeln skickas in (categoryIndexable) i stället för att importeras, så att
// modulen saknar beroenden och går att testa med node --test. Regeln har
// fortfarande bara en definition, i lib/category-threshold.ts.

export type BrodsmuleKategori = { id: string; name: string; slug: string; parentId: string | null };

export function valjBrodsmula<C extends BrodsmuleKategori>(
  egna: C[],
  alla: C[],
  antal: Map<string, number>,
  indexerbar: (antal: number) => boolean,
): { avdelning?: C; underkategori?: C } {
  const avdelningar = new Map(alla.filter((c) => c.parentId === null).map((c) => [c.id, c]));
  let underkategori: C | undefined;
  for (const c of egna) {
    if (!c.parentId || !avdelningar.has(c.parentId)) continue;
    const n = antal.get(c.id) || 0;
    if (!indexerbar(n)) continue;
    if (!underkategori) {
      underkategori = c;
      continue;
    }
    const m = antal.get(underkategori.id) || 0;
    if (n < m || (n === m && c.slug < underkategori.slug)) underkategori = c;
  }
  if (underkategori) return { avdelning: avdelningar.get(underkategori.parentId as string), underkategori };
  return { avdelning: egna.find((c) => c.parentId === null) || egna[0] };
}
