// lib/sok-ordning.ts
//
// EN ORDNING FÖR SÖKNINGENS TRÄFFAR (2026-11-20).
//
// Leonard sökte "bilar" på sin iPhone, såg tolv varor i sökläget, tryckte
// "Visa alla" och fick en resultatsida som började med andra varor: "när man
// söker på saker så hoppar det till o kmr med lite andra produkter än de som
// syntes först". Mätt mot www samma morgon (audit/panel-mot-sida.cjs och
// ordning/jamfor.ts, mot det riktiga indexet med 7 853 varor):
//
//   1. LAGERREGELN VAR TVÅ. Resultatsidan lägger det köpbara först bland ALLA
//      träffar. Sökrutan klippte de tolv mest relevanta och sänkte sedan de
//      slutsålda bland dem. "bil": tre slutsålda bland sökrutans tolv, och
//      sidan skilde sig från plats 10. "bilar" och "soffa": en slutsåld var,
//      skillnad på plats 12.
//   2. LIKA BRA TRÄFFAR STÅR I DEN ORDNING DE KOM IN (lib/search.ts sorterar
//      stabilt). Sökindexet och serverns katalog står nyast först. Den kalla
//      vägen (components/sok-kall.tsx) sökte i varulistan, som står i
//      listsidornas ordning med de slutsålda sist. Samma träffar, annan ordning.
//
// Nu gäller en regel på alla tre ställena (sökrutan, servern, den kalla vägen):
//
//   • varorna rankas i katalogens ordning, nyast först (`katalogensSokordning`
//     här, och `kandidater` i lib/sok-kall.ts som följer sökindexets ordning),
//   • det köpbara först bland alla träffar (`kopbaraForst`), sedan klipps listan.
//
// Sökrutans tolv är därmed resultatsidans tolv första. En slutsåld vara syns i
// sökrutan när de köpbara träffarna är färre än rutans platser, vilket de är
// för den som skriver varans namn. Kontaktformulärets väljare (rankaForslag i
// lib/sok-rankning.ts) klipper fortfarande på relevans först: där letar kunden
// efter en vara den redan köpt, och den kan vara slut.
//
// LÖVMODUL: inga importer, så att `node --test` kan ladda den.

/** De köpbara först, relevansordningen kvar inom varje grupp. */
export function kopbaraForst<T>(traffar: readonly T[], slutsald: (t: T) => boolean): T[] {
  const kopbara: T[] = [];
  const slut: T[] = [];
  for (const t of traffar) (slutsald(t) ? slut : kopbara).push(t);
  return slut.length === 0 ? kopbara : kopbara.concat(slut);
}

type MedAlder = { createdAt?: number; id?: string };

/** Nyast först; id skiljer varor med samma eller okänd ålder, så att ordningen
 *  är densamma varje gång. Samma regel som sortByNewest i lib/products.ts. */
export function nyastForst<T extends MedAlder>(varor: readonly T[]): T[] {
  return [...varor].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0) || String(a.id ?? "").localeCompare(String(b.id ?? "")));
}

// Katalogen är en array som lever tills den förnyas (lib/products.ts), så
// ordningen räknas en gång per katalog och inte en gång per sökning.
const ordnad = new WeakMap<object, unknown[]>();

/** Katalogen i den ordning sökningen rankar den, för sökindexet och söksidan. */
export function katalogensSokordning<T extends MedAlder>(katalog: readonly T[]): T[] {
  let ut = ordnad.get(katalog) as T[] | undefined;
  if (!ut) {
    ut = nyastForst(katalog);
    ordnad.set(katalog, ut);
  }
  return ut;
}
