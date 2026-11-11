// En publicerad sidas titel och metabeskrivning ska vara dess egna.
//
// Proven låser det som gick fel 2026-11-11: 63 sidor delade titel med en annan
// sida, och två av dem skilde sig till slut bara på ett kommatecken.

import { describe, expect, it } from "vitest";
import type { WixAnrop } from "./skrivplan";
import {
  krocktext,
  lasPubliceradSeo,
  MAX_SEO_SIDOR,
  seoKrockar,
  seoFraga,
  seoKrockarInom,
  seoNyckel,
  seoUrProdukt,
  type PubliceradSeo,
} from "./seo-unik";

const rad = (kort: string, seoTitel: string, seoBesk = `Beskrivning för ${kort}.`) => ({
  kort,
  pid: `${kort}-0000-4000-8000-000000000001`,
  seoTitel,
  seoBesk,
});

const sida = (kort: string, titel: string, besk = `En annan text om ${kort}.`): PubliceradSeo => ({
  id: `${kort}-0000-4000-8000-000000000001`,
  titel,
  besk,
});

describe("seoNyckel", () => {
  it("butikens suffix, versaler och skiljetecken skiljer inte två titlar åt", () => {
    const facit = seoNyckel("Konstgjord häck 3 × 1 m | Fyndplats");
    expect(facit).toBe("konstgjord häck 3 1 m");
    for (const t of [
      "Konstgjord häck, 3 × 1 m | Fyndplats",
      "Konstgjord häck – 3 × 1 m",
      "KONSTGJORD HÄCK 3×1 m  |  fyndplats ",
      "Konstgjord häck 3 x 1 m | Fyndplats".replace(" x ", " × "),
    ]) {
      expect(seoNyckel(t), t).toBe(facit);
    }
  });

  it("det som faktiskt skiljer två sidor står kvar: ord, tal och å, ä, ö", () => {
    const nycklar = [
      "Smalt badrumsskåp i bambu | Fyndplats",
      "Smalt badrumsskåp i bambu, 120 cm | Fyndplats",
      "Smalt badrumsskap i bambu | Fyndplats",
      "Smalt badrumsskåp i bambu, 80 cm | Fyndplats",
    ].map(seoNyckel);
    expect(new Set(nycklar).size).toBe(4);
  });

  it("suffixet tas bara bort sist i titeln", () => {
    expect(seoNyckel("Fyndplats guide | Fyndplats")).toBe("fyndplats guide");
    expect(seoNyckel("")).toBe("");
    expect(seoNyckel(" | Fyndplats")).toBe("");
  });
});

describe("seoUrProdukt", () => {
  it("läser titeln ur titeltaggen och beskrivningen ur metataggen", () => {
    expect(
      seoUrProdukt({
        name: "Testbord i ek – 40 × 30 cm",
        seoData: {
          tags: [
            { type: "title", children: " Testbord i ek | Fyndplats " },
            { type: "meta", props: { property: "og:title", content: "Annat" } },
            { type: "meta", props: { name: "description", content: "Ett testbord." } },
          ],
        },
      }),
    ).toEqual({ titel: "Testbord i ek | Fyndplats", besk: "Ett testbord." });
  });

  it("utan titeltagg är produktens namn sidans titel, som i butiken", () => {
    expect(seoUrProdukt({ name: "Testbord i ek" })).toEqual({ titel: "Testbord i ek", besk: "" });
    expect(seoUrProdukt({ name: "Namn", seoTitle: "Fält", seoDescription: "Beskrivning" })).toEqual({ titel: "Fält", besk: "Beskrivning" });
  });
});

describe("seoKrockar", () => {
  it("☠️ samma titel som en annan publicerad sida fälls, och säger vilken", () => {
    const k = seoKrockar([rad("1a2b3c4d", "Uppresningsfåtölj med massage och värme | Fyndplats")], [
      sida("9f8e7d6c", "Uppresningsfåtölj med massage och värme | Fyndplats"),
    ]);
    expect(k).toEqual([{ kort: "1a2b3c4d", falt: "seoTitel", mot: "9f8e7d6c" }]);
  });

  it("☠️ ett kommatecken gör inte en ny titel", () => {
    const k = seoKrockar([rad("1a2b3c4d", "Konstgjord häck, 3 × 1 m | Fyndplats")], [sida("9f8e7d6c", "Konstgjord häck 3 × 1 m | Fyndplats")]);
    expect(k.map((x) => x.falt)).toEqual(["seoTitel"]);
  });

  it("samma metabeskrivning fälls för sig", () => {
    const besk = "Elbil för barn med fjärrkontroll, 12 V och två sittplatser.";
    const k = seoKrockar([rad("1a2b3c4d", "Elbil för barn i rosa | Fyndplats", besk)], [sida("9f8e7d6c", "Elbil för barn i blått | Fyndplats", besk)]);
    expect(k).toEqual([{ kort: "1a2b3c4d", falt: "seoBesk", mot: "9f8e7d6c" }]);
  });

  it("sidan själv räknas inte: en omskrivning får behålla sin titel", () => {
    const egen = sida("1a2b3c4d", "Testbord i ek | Fyndplats", "Beskrivning för 1a2b3c4d.");
    expect(seoKrockar([rad("1a2b3c4d", "Testbord i ek | Fyndplats")], [egen])).toEqual([]);
  });

  it("två produkter i samma plan får byta titel med varandra", () => {
    const plan = [rad("1a2b3c4d", "Bord B | Fyndplats"), rad("2b3c4d5e", "Bord A | Fyndplats")];
    const butik = [sida("1a2b3c4d", "Bord A | Fyndplats"), sida("2b3c4d5e", "Bord B | Fyndplats")];
    expect(seoKrockar(plan, butik)).toEqual([]);
  });

  it("en sida utan titel eller beskrivning krockar inte med en tom rad", () => {
    expect(seoKrockar([rad("1a2b3c4d", " | Fyndplats", "")], [sida("9f8e7d6c", "", "")])).toEqual([]);
  });

  it("en egen titel går igenom", () => {
    expect(seoKrockar([rad("1a2b3c4d", "Testbord i ek, 40 cm | Fyndplats")], [sida("9f8e7d6c", "Testbord i ek, 60 cm | Fyndplats")])).toEqual([]);
  });
});

describe("seoKrockarInom", () => {
  it("två rader i samma plan med samma titel fälls, och den andra pekar på den första", () => {
    const k = seoKrockarInom([rad("1a2b3c4d", "Testbord | Fyndplats"), rad("2b3c4d5e", "Testbord – | Fyndplats"), rad("3c4d5e6f", "Annat bord | Fyndplats")]);
    expect(k).toEqual([{ kort: "2b3c4d5e", falt: "seoTitel", mot: "1a2b3c4d" }]);
  });

  it("samma beskrivning fälls också", () => {
    const k = seoKrockarInom([rad("1a2b3c4d", "Bord A | Fyndplats", "Samma text."), rad("2b3c4d5e", "Bord B | Fyndplats", "Samma text!")]);
    expect(k).toEqual([{ kort: "2b3c4d5e", falt: "seoBesk", mot: "1a2b3c4d" }]);
  });
});

describe("krocktext", () => {
  it("bär kort-id och fältnamn, aldrig själva texten", () => {
    expect(
      krocktext([
        { kort: "1a2b3c4d", falt: "seoTitel", mot: "9f8e7d6c" },
        { kort: "2b3c4d5e", falt: "seoBesk", mot: "8e7d6c5b" },
      ]),
    ).toBe("1a2b3c4d: titeln står redan på 9f8e7d6c; 2b3c4d5e: metabeskrivningen står redan på 8e7d6c5b");
  });
});

describe("seoFraga", () => {
  it("första sidan bär filtret, nästa sida bara markören", () => {
    expect(seoFraga(undefined)).toEqual({ query: { filter: { visible: true }, cursorPaging: { limit: 100 } } });
    expect(seoFraga("m1")).toEqual({ query: { cursorPaging: { limit: 100, cursor: "m1" } } });
  });
});

describe("lasPubliceradSeo", () => {
  const produkt = (n: number, visible: unknown = true) => ({
    id: `${String(n).padStart(8, "0")}-0000-4000-8000-000000000001`,
    visible,
    name: `Produkt ${n}`,
    seoData: { tags: [{ type: "title", children: `Titel ${n} | Fyndplats` }] },
  });

  /**
   * En butik som svarar som Wix gjorde 2026-11-11: sidorna lämnas ut i tur och
   * ordning, och ett filter som följer med markören ger 400 INVALID_CURSOR.
   */
  function butik(sidor: unknown[]): { wix: WixAnrop; kroppar: unknown[] } {
    const kroppar: unknown[] = [];
    const wix: WixAnrop = async (metod, sokvag, kropp) => {
      kroppar.push({ metod, sokvag, kropp });
      const query = ((kropp ?? {}) as { query?: { filter?: unknown; cursorPaging?: { cursor?: unknown } } }).query ?? {};
      if (query.cursorPaging?.cursor !== undefined && query.filter !== undefined) {
        throw new Error('Wix 400: {"message":"Invalid cursor. Sort or filter can not be specified together with cursor","details":{"applicationError":{"code":"INVALID_CURSOR"}}}');
      }
      const nr = kroppar.length - 1;
      return sidor[Math.min(nr, sidor.length - 1)];
    };
    return { wix, kroppar };
  }

  it("☠️ filtret följer inte med markören: alla sidor läses utan INVALID_CURSOR", async () => {
    const { wix, kroppar } = butik([
      { products: [produkt(1), produkt(2)], pagingMetadata: { count: 2, hasNext: true, cursors: { next: "m1" } } },
      { products: [produkt(3)], pagingMetadata: { count: 1, hasNext: true, cursors: { next: "m2", prev: "p1" } } },
      { products: [produkt(4)], pagingMetadata: { count: 1, hasNext: false, cursors: { prev: "p2" } } },
    ]);
    const ut = await lasPubliceradSeo(wix);
    expect(ut.map((p) => p.titel)).toEqual(["Titel 1 | Fyndplats", "Titel 2 | Fyndplats", "Titel 3 | Fyndplats", "Titel 4 | Fyndplats"]);
    expect(kroppar).toEqual([
      { metod: "POST", sokvag: "/stores/v3/products/query", kropp: { query: { filter: { visible: true }, cursorPaging: { limit: 100 } } } },
      { metod: "POST", sokvag: "/stores/v3/products/query", kropp: { query: { cursorPaging: { limit: 100, cursor: "m1" } } } },
      { metod: "POST", sokvag: "/stores/v3/products/query", kropp: { query: { cursorPaging: { limit: 100, cursor: "m2" } } } },
    ]);
  });

  it("☠️ ett utkast i svaret betyder att filtret inte bet: läsningen kastar", async () => {
    const { wix } = butik([{ products: [produkt(1), produkt(2, false)], pagingMetadata: { hasNext: false } }]);
    await expect(lasPubliceradSeo(wix)).rejects.toThrow("filtret bet inte");
  });

  it("☠️ ett utkast på en senare sida kastar också: markören ska bära filtret", async () => {
    const { wix } = butik([
      { products: [produkt(1)], pagingMetadata: { hasNext: true, cursors: { next: "m1" } } },
      { products: [produkt(2, false)], pagingMetadata: { hasNext: false } },
    ]);
    await expect(lasPubliceradSeo(wix)).rejects.toThrow("filtret bet inte");
  });

  it("☠️ ett svar utan produktlista kastar, det läses inte som en tom butik", async () => {
    const { wix } = butik([{ product: { revision: "1" } }]);
    await expect(lasPubliceradSeo(wix)).rejects.toThrow("utan produktlista");
    const { wix: tom } = butik([null]);
    await expect(lasPubliceradSeo(tom)).rejects.toThrow("utan produktlista");
  });

  it("☠️ taket kastar, det kortar inte av", async () => {
    const { wix, kroppar } = butik([{ products: [produkt(1)], pagingMetadata: { hasNext: true, cursors: { next: "m" } } }]);
    await expect(lasPubliceradSeo(wix)).rejects.toThrow("höj taket");
    expect(kroppar).toHaveLength(MAX_SEO_SIDOR);
  });

  it("stannar när markören saknas, även om hasNext säger annat", async () => {
    const { wix, kroppar } = butik([{ products: [produkt(1)], pagingMetadata: { hasNext: true } }]);
    expect(await lasPubliceradSeo(wix)).toHaveLength(1);
    expect(kroppar).toHaveLength(1);
  });

  it("☠️ ett svar utan hasNext kortar inte av listan: markören följs till en tom sida", async () => {
    const { wix, kroppar } = butik([
      { products: [produkt(1)], pagingMetadata: { cursors: { next: "m1" } } },
      { products: [produkt(2)], pagingMetadata: { cursors: { next: "m2" } } },
      { products: [], pagingMetadata: { cursors: { next: "m3" } } },
    ]);
    expect((await lasPubliceradSeo(wix)).map((p) => p.titel)).toEqual(["Titel 1 | Fyndplats", "Titel 2 | Fyndplats"]);
    expect(kroppar).toHaveLength(3);
  });

  it("hasNext false avslutar även när en markör följer med", async () => {
    const { wix, kroppar } = butik([{ products: [produkt(1)], pagingMetadata: { hasNext: false, cursors: { next: "m1" } } }]);
    expect(await lasPubliceradSeo(wix)).toHaveLength(1);
    expect(kroppar).toHaveLength(1);
  });
});
