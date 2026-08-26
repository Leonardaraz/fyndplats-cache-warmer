// Repot kör node --test (se package.json), inte vitest — och en testfil måste
// importera sin syskonmodul MED .ts-ändelse för att köraren ska hitta den.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { kategoriOrdning, grannar, utanSlutsalda, type Grannar } from "./product-neighbours.ts";

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

describe("grannar", () => {
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
