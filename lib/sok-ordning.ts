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

/**
 * "soffa billigast": varorna som HETER som sökningen först, billigast överst,
 * och resten i sin vanliga ordning efter dem (2026-11-21).
 *
 * ☠️ Inte hela listan efter pris. Träffarna rymmer också varor som bara
 * nämner ordet ("Sidobord för soffan", "Överdrag till hörnsoffa"), och de är
 * billigast: en ren prissortering hade visat dem före varenda soffa. En vara
 * utan läsbart pris går sist i sin grupp.
 *
 * ☠️ Ordets egen kategori för sig. `hemma` är hur många av de första
 * träffarna som ligger i sökordets egen kategori (Sokutfall.hemma i
 * lib/search.ts). De ordnas efter pris först, och sedan de som heter så på
 * andra hyllor. Utan det stod barnsoffor och hundsoffor före varenda soffa,
 * och en raclettegrill och en leksaksgrill före kolgrillarna: de heter soffa
 * och grill, och de är billigast (mätt mot katalogen samma dag).
 *
 * Priset jämförs i HELA KRONOR, som det står på kortet. Sökrutan läser priset
 * ur indexets text ("1 599 kr") och resultatsidan ur varans tal: med ören i
 * jämförelsen hade två varor som båda visar 1 599 kr kunnat stå i olika
 * ordning i rutan och på sidan, och rutans förslag ska vara sidans första.
 */
export function billigastForst<T>(traffar: readonly T[], heterSa: (t: T) => boolean, pris: (t: T) => number, hemma?: number): T[] {
  type Rad = { t: T; kr: number; plats: number };
  const hem: Rad[] = [];
  const andra: Rad[] = [];
  const ovriga: T[] = [];
  const iHemmet = hemma ?? 0;
  traffar.forEach((t, plats) => {
    if (plats < iHemmet) hem.push({ t, kr: Math.round(pris(t)), plats });
    else if (heterSa(t)) andra.push({ t, kr: Math.round(pris(t)), plats });
    else ovriga.push(t);
  });
  const efterPris = (a: Rad, b: Rad): number => (a.kr > 0 ? a.kr : Infinity) - (b.kr > 0 ? b.kr : Infinity) || a.plats - b.plats;
  hem.sort(efterPris);
  andra.sort(efterPris);
  return [...hem.map((v) => v.t), ...andra.map((v) => v.t), ...ovriga];
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

/**
 * Varan som heter som sökningen hos en prisjämförelsesajt står kvar först
 * (lib/search.ts, medNamntraff), också när den är slutsåld. `namn` är hur många
 * av de första träffarna det gäller, och `ordna` är ordningen för resten (det
 * köpbara först, eller billigast först).
 *
 * ☠️ DEN SOM SÖKER EN VARA PÅ DESS NAMN SKA SE DEN, också slutsåld: annars
 * tror kunden att butiken inte har den. Märket "Slutsåld" säger resten.
 * Regeln om det köpbara först gäller träffarna under.
 *
 * `behall` gallrar alla träffar (priset i sökningen). Svaret säger hur många
 * av namnets varor som står kvar först.
 */
export function namnForst<T>(
  traffar: readonly T[], namn: number | undefined, ordna: (resten: T[]) => T[], behall?: (x: T) => boolean,
): { traffar: T[]; namn: number } {
  const n = namn !== undefined && namn > 0 ? namn : 0;
  const kvar = (lista: readonly T[]) => (behall ? lista.filter(behall) : [...lista]);
  const forst = kvar(traffar.slice(0, n));
  return { traffar: [...forst, ...ordna(kvar(traffar.slice(n)))], namn: forst.length };
}
