// Repot kör node --test (se package.json), inte vitest — och en testfil måste
// importera sin syskonmodul MED .ts-ändelse för att köraren ska hitta den.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  kategoriOrdning,
  grannarIKedja,
  avdelningsKedja,
  avdelningFor,
  utanSlutsalda,
  type Avsnitt,
  type Grannar,
} from "./product-neighbours.ts";

type P = { id: string; slug: string; name: string; imageScore?: number; collectionIds?: string[]; inStock?: boolean };

const KAT = "kat-1";
const UNDER = "kat-1a";
const ANNAN = "kat-2";

/** Katalogordning a, b, c, d, e — bild-poängen sätts per test. */
function katalog(poang: Record<string, number> = {}): P[] {
  return ["a", "b", "c", "d", "e"].map((s) => ({
    id: `id-${s}`,
    slug: s,
    name: s.toUpperCase(),
    imageScore: poang[s] ?? 60,
    collectionIds: [KAT],
  }));
}

const namn = (g: Grannar<P>) => [g.forra?.slug ?? null, g.nasta?.slug ?? null];

/** Ett enda avsnitt — kedjan med ett led beter sig som en vanlig lista. */
const ett = (produkter: P[], namn = "Kategorin"): Avsnitt<P>[] => [
  { namn, slug: "kategorin", produkter },
];

/** Grannarna i en lista utan avsnittsgränser. */
const grannar = (lista: P[], slug: string) => grannarIKedja(ett(lista), slug);

describe("kategoriOrdning", () => {
  it("behåller katalogordningen när alla har samma bild-poäng", () => {
    // Lika poäng → sorteringen är stabil, så topp-3 blir a, b, c i ordning och
    // resten följer. Nettoresultatet är oförändrad ordning.
    const ut = kategoriOrdning(katalog(), new Set([KAT]));
    assert.deepEqual(ut.map((p) => p.slug), ["a", "b", "c", "d", "e"]);
  });

  it("lyfter de tre högsta bild-poängen först — kategorisidans steg 2", () => {
    // e, d, c har bäst bilder → de tre först, i poängordning. a och b följer i
    // katalogordning. Detta är det icke-uppenbara ledet; går det sönder pekar
    // pilarna på fel produkter jämfört med kategorisidan.
    const ut = kategoriOrdning(katalog({ e: 99, d: 90, c: 80 }), new Set([KAT]));
    assert.deepEqual(ut.map((p) => p.slug), ["e", "d", "c", "a", "b"]);
  });

  it("räknar med underkategorier", () => {
    const alla = katalog();
    alla[2].collectionIds = [UNDER];
    const ut = kategoriOrdning(alla, new Set([KAT, UNDER]));
    assert.equal(ut.length, 5);
    assert.ok(ut.some((p) => p.slug === "c"));
  });

  it("utesluter produkter i andra kategorier", () => {
    const alla = katalog();
    alla[1].collectionIds = [ANNAN];
    const ut = kategoriOrdning(alla, new Set([KAT]));
    assert.deepEqual(ut.map((p) => p.slug), ["a", "c", "d", "e"]);
  });

  it("tom mängd kategori-id ger tom lista i stället för hela katalogen", () => {
    assert.deepEqual(kategoriOrdning(katalog(), new Set()), []);
  });

  it("muterar inte listan den fick", () => {
    const alla = katalog({ e: 99 });
    const fore = alla.map((p) => p.slug);
    kategoriOrdning(alla, new Set([KAT]));
    assert.deepEqual(alla.map((p) => p.slug), fore);
  });

  it("kör efterbehandlingen sist — kategorisidans dedupeProducts", () => {
    // Kategorisidan släpper produkter som delar bild med en tidigare. Utan det
    // steget kan "nästa" peka på något som aldrig syntes i listan, och
    // räknaren räkna produkter besökaren inte kan nå därifrån.
    const bortMedC = (l: P[]) => l.filter((x) => x.slug !== "c");
    const ut = kategoriOrdning(katalog(), new Set([KAT]), bortMedC);
    assert.deepEqual(ut.map((x) => x.slug), ["a", "b", "d", "e"]);
  });

  it("efterbehandlingen får listan EFTER att topp-3 lyfts, inte före", () => {
    // Ordningen spelar roll: kategorisidan dedupar sin färdiga lista. Får
    // funktionen katalogordningen i stället kan den släppa fel produkt.
    let sedd: string[] = [];
    kategoriOrdning(katalog({ e: 99, d: 90, c: 80 }), new Set([KAT]), (l) => {
      sedd = l.map((x) => x.slug);
      return l;
    });
    assert.deepEqual(sedd, ["e", "d", "c", "a", "b"]);
  });

  it("hanterar produkter utan collectionIds", () => {
    const alla = katalog();
    delete alla[0].collectionIds;
    const ut = kategoriOrdning(alla, new Set([KAT]));
    assert.deepEqual(ut.map((p) => p.slug), ["b", "c", "d", "e"]);
  });
});

describe("grannarIKedja — ett avsnitt", () => {
  const ordning = katalog();

  it("ger föregående och nästa mitt i listan", () => {
    assert.deepEqual(namn(grannar(ordning, "c")), ["b", "d"]);
  });

  it("första produkten har ingen föregående", () => {
    assert.deepEqual(namn(grannar(ordning, "a")), [null, "b"]);
  });

  it("sista produkten har ingen nästa — ingen rundgång", () => {
    assert.deepEqual(namn(grannar(ordning, "e")), ["d", null]);
  });

  it("okänd slug ger tomt i båda ändar i stället för att kasta", () => {
    const g = grannar(ordning, "finns-inte");
    assert.deepEqual(namn(g), [null, null]);
    assert.equal(g.position, null);
  });

  it("ensam produkt har varken föregående eller nästa", () => {
    assert.deepEqual(namn(grannar([ordning[0]], "a")), [null, null]);
  });

  it("tom lista kraschar inte", () => {
    const g = grannar([], "a");
    assert.deepEqual(namn(g), [null, null]);
    assert.equal(g.antal, 0);
    assert.equal(g.avsnitt, null);
  });

  it("ett enda avsnitt ger aldrig någon avsnittsetikett", () => {
    const g = grannar(ordning, "c");
    assert.equal(g.forraFran, null);
    assert.equal(g.nastaFran, null);
    assert.deepEqual(g.avsnitt, { namn: "Kategorin", slug: "kategorin" });
  });

  it("position är 1-baserad och antal är listans längd", () => {
    const g = grannar(ordning, "c");
    assert.equal(g.position, 3);
    assert.equal(g.antal, 5);
  });
});

describe("utanSlutsalda", () => {
  const med = (slutsalda: string[]): P[] =>
    katalog().map((p) => ({ ...p, inStock: !slutsalda.includes(p.slug) }));

  it("släpper slutsålda produkter", () => {
    const ut = utanSlutsalda(med(["b", "d"]), "a");
    assert.deepEqual(ut.map((p) => p.slug), ["a", "c", "e"]);
  });

  it("behåller den man tittar på även om den är slutsåld", () => {
    // Annars försvinner produkten ur ordningen, grannar() svarar null i båda
    // ändarna, och besökaren blir strandsatt utan bläddring alls — på precis
    // den sida där man mest vill vidare.
    const ut = utanSlutsalda(med(["b", "c"]), "c");
    assert.deepEqual(ut.map((p) => p.slug), ["a", "c", "d", "e"]);
  });

  it("behåller produkter som saknar inStock i stället för att gissa bort dem", () => {
    const ut = utanSlutsalda(katalog(), "a");
    assert.equal(ut.length, 5);
  });

  it("grannarna hoppar över de slutsålda", () => {
    // b och c är slut → från a är nästa d, inte b.
    const kvar = utanSlutsalda(med(["b", "c"]), "a");
    assert.deepEqual(namn(grannar(kategoriOrdning(kvar, new Set([KAT])), "a")), [null, "d"]);
  });

  it("räknaren räknar köpbara, inte alla kort på kategorisidan", () => {
    const kvar = utanSlutsalda(med(["b", "c"]), "a");
    const g = grannar(kategoriOrdning(kvar, new Set([KAT])), "a");
    assert.equal(g.antal, 3);
  });
});

describe("grannarIKedja — flera avsnitt", () => {
  const A: Avsnitt<P>[] = [
    { namn: "Solskydd", slug: "solskydd", produkter: katalog().slice(0, 2) }, // a, b
    { namn: "Grillar", slug: "grillar", produkter: katalog().slice(2, 4) }, // c, d
    { namn: "Möbler", slug: "mobler", produkter: katalog().slice(4) }, // e
  ];

  it("går vidare över avsnittsgränsen i stället för att ta slut", () => {
    // Hela ärendet: b var sist i sitt avsnitt och hade ingen nästa alls förut.
    assert.deepEqual(namn(grannarIKedja(A, "b")), ["a", "c"]);
  });

  it("märker upp grannen som ligger i ett ANNAT avsnitt", () => {
    const g = grannarIKedja(A, "b");
    assert.equal(g.forraFran, null, "a ligger i samma avsnitt");
    assert.equal(g.nastaFran, "Grillar");
  });

  it("märker upp åt andra hållet också", () => {
    const g = grannarIKedja(A, "c");
    assert.equal(g.forraFran, "Solskydd");
    assert.equal(g.nastaFran, null);
  });

  it("räknaren räknar i det EGNA avsnittet, inte i hela kedjan", () => {
    // "1 av 2 i Grillar" — inte "3 av 5". Det är listan besökaren kom ifrån.
    const g = grannarIKedja(A, "c");
    assert.equal(g.position, 1);
    assert.equal(g.antal, 2);
    assert.deepEqual(g.avsnitt, { namn: "Grillar", slug: "grillar" });
  });

  it("kedjans första produkt har ingen föregående", () => {
    assert.deepEqual(namn(grannarIKedja(A, "a")), [null, "b"]);
  });

  it("kedjans sista produkt har ingen nästa — ingen rundgång", () => {
    assert.deepEqual(namn(grannarIKedja(A, "e")), ["d", null]);
  });

  it("en produkt i två syskonavsnitt räknas bara en gång", () => {
    // Annars ligger den två gånger i kedjan, och den som bläddrar framåt
    // landar plötsligt på något hen redan sett.
    const dubbel = katalog()[1]; // b
    const B: Avsnitt<P>[] = [
      { namn: "Ett", slug: "ett", produkter: [katalog()[0], dubbel] },
      { namn: "Två", slug: "tva", produkter: [dubbel, katalog()[2]] },
    ];
    const g = grannarIKedja(B, "b");
    assert.deepEqual(namn(g), ["a", "c"]);
    // Första förekomsten vinner → b hör till "Ett", och "Två" har bara c kvar.
    assert.equal(g.avsnitt?.namn, "Ett");
    assert.equal(grannarIKedja(B, "c").antal, 1);
  });

  it("hoppar över tomma avsnitt utan att lämna en lucka", () => {
    const C: Avsnitt<P>[] = [
      { namn: "Ett", slug: "ett", produkter: katalog().slice(0, 1) }, // a
      { namn: "Tom", slug: "tom", produkter: [] },
      { namn: "Tre", slug: "tre", produkter: katalog().slice(1, 2) }, // b
    ];
    const g = grannarIKedja(C, "a");
    assert.deepEqual(namn(g), [null, "b"]);
    assert.equal(g.nastaFran, "Tre");
  });

  it("okänd slug ger tomt utan att kasta", () => {
    const g = grannarIKedja(A, "finns-inte");
    assert.deepEqual(namn(g), [null, null]);
    assert.equal(g.position, null);
    assert.equal(g.avsnitt, null);
  });
});

describe("avdelningFor", () => {
  type K = { id: string; slug: string; name: string; parentId: string | null; index: number };
  const HUVUD: K = { id: "h", slug: "tradgard", name: "Trädgård", parentId: null, index: 0 };
  const SOL: K = { id: "s", slug: "solskydd", name: "Solskydd", parentId: "h", index: 1 };

  it("tar den föräldralösa kategorin när produkten ligger i den", () => {
    assert.equal(avdelningFor([HUVUD, SOL], [SOL, HUVUD])?.id, "h");
  });

  it("klättrar upp till föräldern när produkten bara ligger i en underkategori", () => {
    assert.equal(avdelningFor([HUVUD, SOL], [SOL])?.id, "h");
  });

  it("faller tillbaka på kategorin själv när föräldern saknas i listan", () => {
    assert.equal(avdelningFor([SOL], [SOL])?.id, "s");
  });

  it("utan kategorier alls: null i stället för en gissning", () => {
    assert.equal(avdelningFor([HUVUD, SOL], []), null);
  });
});

describe("avdelningsKedja", () => {
  type K = { id: string; slug: string; name: string; parentId: string | null; index: number };
  const HUVUD: K = { id: "h", slug: "tradgard", name: "Trädgård", parentId: null, index: 0 };
  // index är MENYORDNINGEN, inte fältordningen — Grillar ska komma först.
  const GRILL: K = { id: "g", slug: "grillar", name: "Grillar", parentId: "h", index: 0 };
  const SOL: K = { id: "s", slug: "solskydd", name: "Solskydd", parentId: "h", index: 1 };
  const ANNAT: K = { id: "x", slug: "kok", name: "Kök", parentId: null, index: 1 };
  const UNDERSOL: K = { id: "s2", slug: "parasoll", name: "Parasoll", parentId: "s", index: 0 };
  const KATS = [HUVUD, GRILL, SOL, ANNAT, UNDERSOL];

  const prod = (slug: string, kat: string[], inStock = true): P => ({
    id: `id-${slug}`, slug, name: slug.toUpperCase(), imageScore: 60,
    collectionIds: kat, inStock,
  });
  const form = (a: Avsnitt<P>[]) => a.map((x) => [x.namn, x.produkter.map((p) => p.slug)]);

  it("ett avsnitt per underkategori, i menyordning", () => {
    const alla = [prod("sol-1", ["s"]), prod("grill-1", ["g"])];
    assert.deepEqual(form(avdelningsKedja(KATS, HUVUD, alla, "sol-1")), [
      ["Grillar", ["grill-1"]],
      ["Solskydd", ["sol-1"]],
    ]);
  });

  it("underkategorins egna barn hamnar i dess avsnitt", () => {
    const alla = [prod("parasoll-1", ["s2"])];
    const ut = avdelningsKedja(KATS, HUVUD, alla, "parasoll-1");
    assert.deepEqual(ut.find((a) => a.slug === "solskydd")?.produkter.map((p) => p.slug), ["parasoll-1"]);
  });

  it("produkter direkt i avdelningen får ett SISTA avsnitt — 26-procentsbuggen", () => {
    // Utan det ledet fick "lös" en helt egen ordning (hela avdelningen) medan
    // grannen "sol-1" fick underkategorins, och steget tillbaka landade fel.
    const alla = [prod("sol-1", ["h", "s"]), prod("los", ["h"])];
    assert.deepEqual(form(avdelningsKedja(KATS, HUVUD, alla, "los")), [
      ["Solskydd", ["sol-1"]],
      ["Trädgård", ["los"]],
    ]);
  });

  it("en produkt i både avdelningen och en underkategori dubbleras inte", () => {
    const alla = [prod("sol-1", ["h", "s"])];
    const ut = avdelningsKedja(KATS, HUVUD, alla, "sol-1");
    assert.equal(ut.flatMap((a) => a.produkter).length, 1);
  });

  it("och därmed går steget tillbaka dit man kom ifrån", () => {
    const alla = [prod("sol-1", ["h", "s"]), prod("los", ["h"])];
    const kedja = avdelningsKedja(KATS, HUVUD, alla, "sol-1");
    const fram = grannarIKedja(kedja, "sol-1");
    assert.equal(fram.nasta?.slug, "los");
    assert.equal(
      grannarIKedja(avdelningsKedja(KATS, HUVUD, alla, "los"), "los").forra?.slug,
      "sol-1",
    );
  });

  it("korsar aldrig huvudavdelningen", () => {
    const alla = [prod("sol-1", ["s"]), prod("kok-1", ["x"])];
    const ut = avdelningsKedja(KATS, HUVUD, alla, "sol-1");
    assert.ok(!ut.some((a) => a.produkter.some((p) => p.slug === "kok-1")));
  });

  it("släpper slutsålda i alla avsnitt, men behåller den man tittar på", () => {
    const alla = [
      prod("sol-1", ["s"], false), // slutsåld OCH den vi står på → kvar
      prod("sol-2", ["s"], false), // slutsåld → bort
      prod("grill-1", ["g"], false), // slutsåld i ett annat avsnitt → bort
      prod("grill-2", ["g"]),
    ];
    assert.deepEqual(form(avdelningsKedja(KATS, HUVUD, alla, "sol-1")), [
      ["Grillar", ["grill-2"]],
      ["Solskydd", ["sol-1"]],
    ]);
  });

  it("skickar efterbehandlingen vidare till varje avsnitt", () => {
    const alla = [prod("sol-1", ["s"]), prod("sol-2", ["s"]), prod("grill-1", ["g"])];
    const bortMed2 = (l: P[]) => l.filter((x) => x.slug !== "sol-2");
    assert.deepEqual(form(avdelningsKedja(KATS, HUVUD, alla, "sol-1", bortMed2)), [
      ["Grillar", ["grill-1"]],
      ["Solskydd", ["sol-1"]],
    ]);
  });

  it("tomma avsnitt tas inte med i onödan — men bryter inte kedjan", () => {
    const alla = [prod("grill-1", ["g"]), prod("sol-1", ["s"]), prod("sol-2", ["s"])];
    const g = grannarIKedja(avdelningsKedja(KATS, HUVUD, alla, "grill-1"), "grill-1");
    assert.equal(g.nasta?.slug, "sol-1");
    assert.equal(g.nastaFran, "Solskydd");
    assert.equal(g.antal, 1, "räknaren står kvar i Grillar");
  });
});
