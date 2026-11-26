// En ordning för sökningens träffar (lib/sok-ordning.ts, 2026-11-20).
//
// Leonard: "när man söker på saker så hoppar det till o kmr med lite andra
// produkter än de som syntes först". Sökrutan, servern och den kalla vägen
// rankade samma varor men ordnade dem på tre sätt. Proven här kör de tre
// vägarnas steg på samma katalog och kräver samma lista.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { katalogensSokordning, kopbaraForst, namnForst, nyastForst } from "./sok-ordning.ts";
import { kandidater } from "./sok-kall.ts";
import { rankaMedForslag, rankaMedInfo } from "./search.ts";

const las = (...delar: string[]) => readFileSync(join(import.meta.dirname, "..", ...delar), "utf8");

describe("kopbaraForst", () => {
  it("det köpbara först, ordningen kvar inom varje grupp", () => {
    const t = [{ s: "a", o: 1 }, { s: "b" }, { s: "c", o: 1 }, { s: "d" }, { s: "e" }];
    assert.deepEqual(kopbaraForst(t, (x) => x.o === 1).map((x) => x.s), ["b", "d", "e", "a", "c"]);
  });

  it("ger en ny lista och rör inte den den fick", () => {
    const t = [{ s: "a" }, { s: "b" }];
    const ut = kopbaraForst(t, () => false);
    assert.notEqual(ut, t);
    assert.deepEqual(ut, t);
    assert.deepEqual(kopbaraForst([], () => true), []);
  });
});

describe("nyastForst", () => {
  it("nyast först, och id skiljer varor med samma eller okänd ålder", () => {
    const v = [{ id: "c", createdAt: 5 }, { id: "b" }, { id: "a" }, { id: "d", createdAt: 9 }, { id: "e", createdAt: 5 }];
    assert.deepEqual(nyastForst(v).map((x) => x.id), ["d", "c", "e", "a", "b"]);
    // Samma svar hur listan än kom in.
    assert.deepEqual(nyastForst([...v].reverse()).map((x) => x.id), ["d", "c", "e", "a", "b"]);
  });

  it("samma regel som sortByNewest i lib/products.ts", () => {
    const regel = "(b.createdAt || 0) - (a.createdAt || 0) || String(a.id ?? \"\").localeCompare(String(b.id ?? \"\"))";
    assert.ok(las("lib", "sok-ordning.ts").includes(regel));
    assert.ok(las("lib", "products.ts").includes(regel));
    // Den kalla vägen har inga importer och bär regeln själv.
    assert.ok(las("lib", "sok-kall.ts").includes(regel));
  });

  it("katalogens ordning räknas en gång per katalog", () => {
    const katalog = [{ id: "a", createdAt: 1 }, { id: "b", createdAt: 2 }];
    const ett = katalogensSokordning(katalog);
    assert.deepEqual(ett.map((x) => x.id), ["b", "a"]);
    assert.equal(katalogensSokordning(katalog), ett, "samma katalog ger samma lista tillbaka");
    assert.notEqual(katalogensSokordning([...katalog]), ett, "en ny katalog räknas om");
    assert.deepEqual(katalog.map((x) => x.id), ["a", "b"], "katalogen själv rörs inte");
  });
});

// En liten katalog där många träffar är lika bra, och några är slutsålda.
type Vara = { id: string; slug: string; name: string; inStock: boolean; createdAt: number; price: string; priceNum: number; img?: string };
const KATALOG: Vara[] = Array.from({ length: 40 }, (_, i) => ({
  id: `id-${String(i).padStart(2, "0")}`,
  slug: `elbil-barn-${i}`,
  name: i % 7 === 0 ? `Elbil för barn modell ${i}` : i % 3 === 0 ? `Trampbil modell ${i}` : `Elbil barn 12V modell ${i}`,
  inStock: i % 5 !== 0,
  createdAt: 1000 + ((i * 37) % 40),
  price: `${1000 + i} kr`,
  priceNum: 1000 + i,
}));
const SOKORD = ["elbil", "elbil barn", "bil", "trampbil", "modell", "el"];

/** Servern (app/sok/page.tsx): katalogen i sökningens ordning, ranka, det köpbara först. */
const varm = (q: string) => kopbaraForst(rankaMedForslag(katalogensSokordning(KATALOG), (p) => p.name, q).utfall.traffar, (p) => !p.inStock).map((p) => p.slug);
/** Indexet (app/api/search-index/route.ts): samma ordning, slutsålda märkta. */
const INDEX = katalogensSokordning(KATALOG).map((p) => ({ n: p.name, s: p.slug, i: `${p.slug}.jpg`, p: p.price, ...(p.inStock ? {} : { o: 1 as const }) }));
/** Sökrutan (lib/sok-rankning.ts, rankaForslagMedAntal): ranka indexet, det köpbara först, klipp. */
const rutan = (q: string, antal: number) => {
  const { utfall } = rankaMedForslag(INDEX, (h) => h.n, q);
  return kopbaraForst(utfall.traffar, (h) => h.o === 1).slice(0, antal).map((h) => h.s);
};
/** Den kalla vägen (components/sok-kall.tsx): varulistan i en ANNAN ordning, plus indexet. */
const LISTA = KATALOG.filter((p) => p.inStock).sort((a, b) => a.priceNum - b.priceNum);
const kall = (q: string) => kopbaraForst(rankaMedForslag(kandidater(LISTA, INDEX), (p) => p.name, q).utfall.traffar, (p) => !p.inStock).map((p) => p.slug);

describe("☠️ sökrutan, servern och den kalla vägen ger samma varor i samma ordning", () => {
  it("katalogen har lika bra träffar och slutsålda bland de bästa, annars prövar provet ingenting", () => {
    const u = rankaMedInfo(katalogensSokordning(KATALOG), (p) => p.name, "elbil");
    assert.ok(u.traffar.length > 20);
    assert.ok(u.traffar.slice(0, 12).some((p) => !p.inStock), "en slutsåld bland de tolv mest relevanta");
    // Den gamla regeln (klipp först, sänk sedan) gav en annan lista än sidan.
    const gammal = u.traffar.slice(0, 12).sort((a, b) => (a.inStock ? 0 : 1) - (b.inStock ? 0 : 1)).map((p) => p.slug);
    assert.notDeepEqual(gammal, varm("elbil").slice(0, 12));
  });

  for (const q of SOKORD) {
    it(`"${q}": sökrutans tolv och sju är resultatsidans första`, () => {
      const sida = varm(q);
      assert.ok(sida.length > 0, "sökordet ska ge träffar");
      assert.deepEqual(rutan(q, 12), sida.slice(0, 12));
      assert.deepEqual(rutan(q, 7), sida.slice(0, 7));
    });

    it(`"${q}": den kalla vägen ger hela listan i serverns ordning`, () => {
      assert.deepEqual(kall(q), varm(q));
    });
  }

  it("det slutsålda står sist, också när det är den bästa träffen", () => {
    const sida = varm("elbil");
    const forstaSlut = sida.findIndex((s) => !KATALOG.find((p) => p.slug === s)!.inStock);
    assert.ok(forstaSlut > 0);
    assert.ok(sida.slice(forstaSlut).every((s) => !KATALOG.find((p) => p.slug === s)!.inStock));
  });
});

describe("den kalla vägens varor (lib/sok-kall.ts, kandidater)", () => {
  it("en vara som indexet inte hunnit få står först: den är nyast", () => {
    const ny = { id: "ny", slug: "helt-ny-elbil", name: "Elbil barn 12V nyhet", inStock: true, createdAt: 99_999, price: "999 kr", priceNum: 999 };
    const alla = kandidater([...LISTA, ny], INDEX);
    assert.equal(alla[0].slug, "helt-ny-elbil");
    assert.equal(alla.length, KATALOG.length + 1);
  });

  it("samma adress två gånger i indexet ger ett kort", () => {
    const dubbelt = [...INDEX, INDEX[0], INDEX.find((h) => h.o === 1)!];
    assert.equal(kandidater(LISTA, dubbelt).length, KATALOG.length);
  });

  it("☠️ fotot kommer ur indexet när listan saknar det, och listans eget foto står kvar", () => {
    const medFoto = LISTA.map((p, i) => (i === 0 ? { ...p, img: "listans.jpg" } : p));
    const alla = kandidater(medFoto, INDEX);
    assert.equal(alla.find((p) => p.slug === medFoto[0].slug)!.img, "listans.jpg");
    assert.ok(alla.every((p) => p.img), "varje kort har ett foto");
    assert.equal(alla.find((p) => p.slug === LISTA[1].slug)!.img, `${LISTA[1].slug}.jpg`);
    // Listans rader rörs inte: kortet med foto är en kopia.
    assert.equal(LISTA[1].img, undefined);
  });

  it("utan index: bara varulistan, nyast först", () => {
    const utan = kandidater(LISTA, null);
    assert.deepEqual(utan.map((p) => p.slug), nyastForst(LISTA).map((p) => p.slug));
  });
});

describe("namnForst: varan som heter som sökningen står kvar först", () => {
  type V = { n: string; slut?: true; kr: number };
  const A: V = { n: "A", kr: 900 };
  const B: V = { n: "B", slut: true, kr: 100 };
  const C: V = { n: "C", kr: 300 };
  const D: V = { n: "D", slut: true, kr: 200 };
  const kopbara = (resten: V[]) => kopbaraForst(resten, (v) => v.slut === true);

  it("utan namnträff är svaret ordningen själv", () => {
    for (const namn of [undefined, 0, -1]) {
      const ut = namnForst([B, A, D, C], namn, kopbara);
      assert.deepEqual(ut.traffar.map((v) => v.n), ["A", "C", "B", "D"]);
      assert.equal(ut.namn, 0);
    }
  });

  it("☠️ en slutsåld namnträff står kvar först, och resten ordnas som förut", () => {
    const ut = namnForst([B, D, A, C], 1, kopbara);
    assert.deepEqual(ut.traffar.map((v) => v.n), ["B", "A", "C", "D"]);
    assert.equal(ut.namn, 1);
  });

  it("flera namnträffar behåller sin ordning", () => {
    const ut = namnForst([D, A, B, C], 2, kopbara);
    assert.deepEqual(ut.traffar.map((v) => v.n), ["D", "A", "C", "B"]);
    assert.equal(ut.namn, 2);
  });

  it("gallringen gäller också namnträffen, och antalet säger vad som står kvar", () => {
    const billiga = (v: V) => v.kr <= 300;
    const ut = namnForst([A, B, C, D], 2, kopbara, billiga);
    // A kostar för mycket och faller bort: bara B är kvar av namnets två.
    assert.deepEqual(ut.traffar.map((v) => v.n), ["B", "C", "D"]);
    assert.equal(ut.namn, 1);
  });

  it("ett antal större än listan kapas, och indatan rörs inte", () => {
    const lista = [B, A];
    const ut = namnForst(lista, 5, kopbara);
    assert.deepEqual(ut.traffar.map((v) => v.n), ["B", "A"]);
    assert.equal(ut.namn, 2);
    assert.deepEqual(lista.map((v) => v.n), ["B", "A"]);
  });
});

describe("de tre vägarna använder regeln", () => {
  it("sökrutan lägger det köpbara först FÖRE klippet", () => {
    const k = las("lib", "sok-rankning.ts");
    assert.match(k, /import \{ billigastForst, kopbaraForst, namnForst \} from "\.\/sok-ordning";/);
    // Träffarna som de rankades, eller med de billigaste först för "soffa billigast" (2026-11-21),
    // sedan det köpbara först, sedan klippet. Varan som heter som sökningen hos en
    // prisjämförelsesajt står kvar först (namnForst, 2026-11-25), och priset gallrar alla.
    assert.match(k, /const billigast = villHaBilligast\(term\) && utfall\.hela === undefined;/);
    assert.match(k, /const \{ traffar: kvar, namn \} = namnForst\(\s+utfall\.traffar,\s+utfall\.namn,\s+\(resten\) => kopbaraForst\(\s+billigast \? billigastForst\(resten, \(h\) => varanHeterSa\(h\.n, term\), \(h\) => prisTal\(h\.p\), utfall\.hemma\) : resten,\s+\(h\) => h\.o === 1,\s+\),\s+behall,\s+\);\s+return \{\s+traffar: kvar\.slice\(0, antal\),\s+totalt: kvar\.length,/);
    // Kontaktformulärets väljare klipper på relevans först: där letar kunden efter en vara den redan köpt.
    assert.match(k, /export function rankaForslag\(idx: SokTraff\[\], term: string, antal: number\): SokTraff\[\] \{\s+return rankByName\(idx, \(h\) => h\.n, term, namnFor\(idx\)\)\s+\.slice\(0, antal\)\s+\.sort\(/);
  });

  it("servern rankar katalogen i sökningens ordning och lägger det köpbara först", () => {
    const sida = las("app", "sok", "page.tsx");
    assert.match(sida, /const all = term \? katalogensSokordning\(await getProducts\(\)\) : \[\];/);
    // Namnens träffar: billigast först när sökningen ber om det, sedan det köpbara först,
    // med varan som heter som sökningen kvar först (namnForst, 2026-11-25).
    assert.match(sida, /const prisordna = billigast && hela === undefined && utfall\.traffar\.length > 1;/);
    assert.match(sida, /const ordnat = namnForst\(utfall\.traffar, utfall\.namn, \(resten\) => kopbaraForst\(\s+prisordna \? billigastForst\(resten, \(p\) => varanHeterSa\(p\.name, fraga\), lagstaPris, utfall\.hemma\) : resten,\s+\(p\) => !p\.inStock,\s+\)\);\s+results = ordnat\.traffar;/);
    assert.match(sida, /if \(prisordna\) prisordning = utfall\.hemma \? "kategori" : "namn";/);
    // Reserven i beskrivningarna lägger också det köpbara först.
    assert.match(sida, /results = kopbaraForst\(\s+all\.filter\(\(p\) => normalize\(p\.blurb \|\| ""\)\.includes\(phrase\) \|\| normalize\(p\.specs \|\| ""\)\.includes\(phrase\)\),\s+\(p\) => !p\.inStock,\s+\);/);
    // Ingen ordning läggs på efteråt: den hade flyttat en slutsåld namnträff sist.
    assert.match(sida, /results = await attachRatings\(results\);/);
    assert.doesNotMatch(sida, /attachRatings\(kopbaraForst\(/);
    // Beskedet visas bara när listan ordnats: det bär samma variabel.
    assert.match(sida, /billigast: prisordning,/);
  });

  it("sökindexet står i samma ordning", () => {
    assert.match(las("app", "api", "search-index", "route.ts"), /const products = katalogensSokordning\(await getProductsFarska\(\)\);[\s\S]{0,900}const index: object\[\] = products\.map\(/);
  });

  it("den kalla vägen lägger det köpbara först med samma funktion", () => {
    const kalla = las("components", "sok-kall.tsx");
    // Samma "billigast"-ordning som servern och sökrutan, före lagerregeln, och
    // varan som heter som sökningen kvar först (namnForst, 2026-11-25).
    assert.match(kalla, /const \{ traffar, namn \} = namnForst\(u\.traffar, u\.namn, \(resten\) => kopbaraForst\(\s+billigast \? billigastForst\(resten, \(p\) => varanHeterSa\(p\.name, prisfraga\.fraga\), lagstaPris, u\.hemma\) : resten,\s+\(p\) => !p\.inStock,\s+\)\);/);
    assert.match(kalla, /kall: true,/);
  });
});

describe("☠️ söksidans träffar bär de bilder bildkartan inte har", () => {
  // Mätt på www 2026-11-20 (audit/sok-slut-bild.cjs): 9 av 16 slutsålda träffar
  // för "bil" fick aldrig någon bild, 68 av 80 för "bord". Bildkartan har bara
  // det som går att köpa.
  it("de slutsålda och de första 240 träffarna bär sin bild i sidan", () => {
    const nytto = las("lib", "list-payload.ts");
    assert.match(nytto, /export const SOK_MED_BILD = 240;/);
    assert.match(nytto, /export function forSokClient\(list: Product\[\], dayMs\?: number\): ListProduct\[\] \{\s+const medBild = slugarMedBild\(list, dayMs\);\s+list\.forEach\(\(p, i\) => \{ if \(i < SOK_MED_BILD \|\| !p\.inStock\) medBild\.add\(p\.slug\); \}\);\s+return forClient\(list, medBild\);/);
    assert.match(las("app", "sok", "page.tsx"), /traffar: forSokClient\(results\),/);
    // Bildkartan är fortfarande bara det listsidorna kan visa.
    assert.match(las("app", "api", "kort-bilder", "route.ts"), /const produkter = forListings\(alla\);/);
  });

  it("listan fyller i den andra bilden ur kartan för kort som bara har den första", () => {
    const sb = las("components", "shopbrowser.tsx");
    assert.match(sb, /if \(!p\.img\) return \{ \.\.\.p, img: b\[0\], altImg: b\[1\] \?\? undefined \};/);
    assert.match(sb, /return !p\.altImg && b\[1\] \? \{ \.\.\.p, altImg: b\[1\] \} : p;/);
    assert.match(sb, /if \(andraBilderUrKartan && bilderDirekt\) hamtaBilder\(\);/);
  });
});

describe("☠️ listan börjar om när varorna byts, inte när samma varor kommer en gång till", () => {
  // Mätt på www 2026-11-20 (audit/sok-samma.cjs): samma sökning skickad igen
  // gav samma varor i en ny array, listan gick från 72 kort till 24, och
  // kunden stod vid sidfoten.
  it("nyckeln är antalet och första och sista varan, inte arrayen", () => {
    const sb = las("components", "shopbrowser.tsx");
    assert.match(sb, /const produktNyckel = `\$\{products\.length\}\|\$\{products\[0\]\?\.slug \?\? ""\}\|\$\{products\[products\.length - 1\]\?\.slug \?\? ""\}`;/);
    assert.match(sb, /setShown\(PAGE_SIZE\);\s+\}, \[sort, urlPrice, colorStr, onlyInStock, onlyOnSale, produktNyckel, specValtStr, valStr\]\);/);
    assert.doesNotMatch(sb, /onlyOnSale, products, specValtStr/);
  });
});
