// Färgfacetten visade aldrig en enda färg. Produktionen loggade
// "[wix] färgval hämtade: 0 produkter har minst en färg" (2026-09-24), och
// felet låg i urvalet, inte i tolkningen.
//
// Frågan var ofiltrerad, gick nyast först och slutade efter 12 sidor, alltså
// vid de 1 200 senast skapade produkterna. Uppmätt mot skarpa V3 samma dag:
// katalogen har 6 067 produkter och 239 av dem har optioner. De 5 100 nyaste
// har NOLL, eftersom Aosom-varor har en variant och ingen option. Alla
// produkter med en färg att visa låg bakom sidtaket.
//
// Frågan filtrerar nu på `options.id` och får alla 239 på tre sidor. Uppmätt
// åt båda hållen: ett ofiltrerat svep över hela katalogen hittade samma 239,
// och filtret missade ingen av dem.
//
// Filtret skickas bara på FÖRSTA sidan. Markören bär frågan själv: sidorna
// två och tre med bara markören gav 100 och 39 produkter, alla med optioner.
// Filter plus markör svarar 400 INVALID_CURSOR ("Sort or filter can not be
// specified together with cursor"), uppmätt på products/query. Det är samma
// form som inventory-items/query, categories/query och products/search.
//
// Alla sidor eller ingen: ett fel på sida två ger fel antal i facetten, och
// det ser friskt ut. Därför kastar hämtningen i stället för att lämna ifrån sig
// en halv karta. Anroparen fångar felet och visar ingen facett alls.

export const FARGVAL_FILTER = { "options.id": { $exists: true } };

/** Sidor om 100. Katalogen har 239 produkter med optioner (2026-09-24). */
export const FARGVAL_SIDTAK = 30;

export type FargvalSvar = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type FargvalSida<O> = {
  products?: { id?: string; options?: O }[];
  pagingMetadata?: { hasNext?: boolean; cursors?: { next?: string } };
};

/** Kroppen till products/query: filtret på första sidan, sedan bara markören. */
export function fargvalKropp(cursor?: string) {
  return cursor
    ? { query: { cursorPaging: { limit: 100, cursor } } }
    : { query: { filter: FARGVAL_FILTER, cursorPaging: { limit: 100 } } };
}

export async function hamtaFargval<O>(
  post: (kropp: unknown) => Promise<FargvalSvar>,
  tolka: (options: O | undefined) => string[],
  sidtak: number = FARGVAL_SIDTAK,
): Promise<{ farger: Map<string, string[]>; medOptioner: number }> {
  const farger = new Map<string, string[]>();
  let medOptioner = 0;
  let cursor: string | undefined;
  for (let sida = 1; ; sida++) {
    if (sida > sidtak) {
      throw new Error(
        `färgfrågan har fler än ${sidtak} sidor (${medOptioner} produkter med optioner hittills) — visar hellre ingen facett än fel antal`,
      );
    }
    const res = await post(fargvalKropp(cursor));
    if (!res.ok) {
      throw new Error(`färgfrågan svarade HTTP ${res.status} på sida ${sida} — visar hellre ingen facett än fel antal`);
    }
    const data = (await res.json()) as FargvalSida<O> | null;
    for (const p of data?.products || []) {
      if (!p?.id) continue;
      medOptioner++;
      const nycklar = tolka(p.options);
      if (nycklar.length) farger.set(p.id, nycklar);
    }
    cursor = data?.pagingMetadata?.cursors?.next || undefined;
    if (!cursor || !data?.pagingMetadata?.hasNext) break;
  }
  return { farger, medOptioner };
}
