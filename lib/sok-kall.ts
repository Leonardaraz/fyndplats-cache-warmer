// lib/sok-kall.ts
//
// Vad webbläsaren söker i när servern inte har katalogen i minnet
// (components/sok-kall.tsx, 2026-11-19).
//
// ☠️ VARULISTAN HAR BARA DET SOM GÅR ATT KÖPA. /api/lista?k=alla är listsidornas
// lista, och den går genom forListings (lib/list-pages.ts). Söksidan visar med
// flit också slutsålda varor, sist: den som skriver namnet på en vara den just
// sett ska hitta den, med märket "Slutsåld" och bevakningen på produktsidan.
// Första bygget sökte bara i varulistan, och provet i webbläsaren visade
// skillnaden mot servern: "svart tv-bänk" 18 mot 21, "länstol" 250 mot 294,
// "utemöbler" 69 mot 89. Den enda tv-bänken med "svart" i namnet var slutsåld,
// så den kalla vägen strök dessutom ordet och gav ett annat besked.
//
// De slutsålda finns i sökindexet (/api/search-index), som sökrutan redan
// hämtar: namn, adress, foto, pris och märket `o`. Här läggs de till som
// enkla kort, så att de två vägarna söker i samma varor.
//
// LÖVMODUL: bara typer in, så att `node --test` kan ladda den.
import type { ListProduct } from "./products";

/** En rad i sökindexet, samma form som SokTraff i lib/sok-index.ts. */
export type IndexRad = { n: string; s: string; i: string; p: string; o?: 1 };

/**
 * Ett slutsålt kort ur en indexrad. Priset står som text i indexet ("1 599 kr"
 * eller "Från 659 kr", lib/price-range.ts listPris), och kortet ritar samma
 * text tillbaka. `id` är tomt: det används bara till att förhämta
 * medlemspriset, och en slutsåld vara har inget att förhämta.
 */
export function kortUrIndex(h: IndexRad): ListProduct {
  const fran = /^Från\s+/.test(h.p);
  const text = h.p.replace(/^Från\s+/, "");
  const tal = Number(text.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  return {
    id: "", slug: h.s, name: h.n, price: text, priceNum: tal, inStock: false,
    ...(h.i ? { img: h.i } : {}),
    ...(fran ? { hasRange: true, priceFrom: text, priceFromNum: tal } : {}),
  };
}

/**
 * Varorna den kalla vägen söker i, i den ordning servern rankar dem.
 *
 * ☠️ ORDNINGEN ÄR EN DEL AV SVARET (2026-11-20). Lika bra träffar står i den
 * ordning de kom in (lib/search.ts sorterar stabilt). Förr var det varulistans
 * ordning med de slutsålda efter, och då började den kalla vägens resultatsida
 * med andra varor än sökrutan och den varma vägen visade för samma ord
 * (lib/sok-ordning.ts). Nu följer raderna sökindexet, som står i katalogens
 * ordning, nyast först: varulistans kort där varan finns i listan, annars ett
 * enkelt kort för den som är slutsåld.
 *
 * En vara i listan som indexet inte hunnit få är nyare än indexet och står
 * först. En köpbar vara i indexet som saknas i listan läggs inte till: listan
 * avgör vad som går att köpa. Utan index (hämtningen föll) blir det bara
 * varulistan, alltså det som går att köpa, nyast först.
 *
 * ☠️ FOTOT KOMMER UR INDEXET (2026-11-20). Varulistan bär bara bild för de
 * första korten i listsidornas ordning (147 av 7 071 rader, mätt samma dag),
 * och en sökträff är nästan aldrig en av dem. Förr stod därför den kalla
 * vägens kort med tomma fotorutor tills bildkartan (406 kB) hade hämtats.
 * Indexet har varje varas bild, och det är redan hämtat när sökningen görs.
 */
export function kandidater(lista: readonly ListProduct[], index: readonly IndexRad[] | null): ListProduct[] {
  // Samma regel som nyastForst i lib/sok-ordning.ts (den här modulen har inga
  // importer); lib/sok-ordning.test.ts håller ihop de två.
  const nyast = (a: ListProduct, b: ListProduct) => (b.createdAt || 0) - (a.createdAt || 0) || String(a.id ?? "").localeCompare(String(b.id ?? ""));
  if (!index) return [...lista].sort(nyast);
  const iListan = new Map(lista.map((p) => [p.slug, p]));
  const med = new Set<string>();
  const ordnade: ListProduct[] = [];
  for (const h of index) {
    if (!h.s || med.has(h.s)) continue;
    const iLista = iListan.get(h.s);
    const kort = iLista ? (iLista.img || !h.i ? iLista : { ...iLista, img: h.i }) : h.o === 1 && h.n ? kortUrIndex(h) : null;
    if (!kort) continue;
    med.add(h.s);
    ordnade.push(kort);
  }
  const nya = lista.filter((p) => !med.has(p.slug)).sort(nyast);
  return nya.length > 0 ? [...nya, ...ordnade] : ordnade;
}

/**
 * Kör `hamta` tills den lyckas, högst `forsok` gånger, med `paus` emellan.
 * Kastar det sista felet när alla försök gått åt. `avbruten` svarar sant när
 * ingen längre väntar på svaret (kunden har sökt på något annat): då görs
 * inga fler försök.
 *
 * ☠️ FÖRSTA SÖKNINGEN EFTER EN DEPLOY VISADE FELRUTAN (2026-11-20). Varulistan
 * ligger inte i CDN:t direkt efter ett bygge, och en ny serverinstans läser
 * katalogen i 25–28 sekunder innan den kan svara. Söksidan väntar 20 och gav
 * upp, med "Sökningen kunde inte läsas in" och en knapp som ingen trycker på.
 * Den som laddade om fick svar direkt, för servern läste klart ändå. Nu gör
 * sidan det själv: ett avbrutet försök följs av ett nytt, och felrutan visas
 * först när alla har misslyckats.
 */
export async function medForsok<T>(hamta: (nr: number) => Promise<T>, forsok: number, paus: (nr: number) => Promise<void>, avbruten: () => boolean = () => false): Promise<T> {
  let sista: unknown = new Error("avbruten");
  for (let nr = 1; nr <= forsok && !avbruten(); nr++) {
    try {
      return await hamta(nr);
    } catch (fel) {
      sista = fel;
      if (nr < forsok && !avbruten()) await paus(nr);
    }
  }
  throw sista;
}
