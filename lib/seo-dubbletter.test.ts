// lib/seo-dubbletter.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dubblaBeskrivningar, dubblaTitlar, seoNyckel, seoSidaAv, sidorIGrupper } from "./seo-dubbletter.ts";

const sida = (slug: string, titel: string, besk = "") => ({ slug, titel, besk });

describe("seoNyckel (samma exempel som motorns lib/polish/seo-unik.test.ts)", () => {
  it("butikens suffix, versaler och skiljetecken skiljer inte två titlar åt", () => {
    const facit = seoNyckel("Konstgjord häck 3 × 1 m | Fyndplats");
    assert.equal(facit, "konstgjord häck 3 1 m");
    for (const t of ["Konstgjord häck, 3 × 1 m | Fyndplats", "Konstgjord häck – 3 × 1 m", "KONSTGJORD HÄCK 3×1 m  |  fyndplats "]) {
      assert.equal(seoNyckel(t), facit, t);
    }
  });

  it("det som faktiskt skiljer två sidor står kvar: ord, tal och å, ä, ö", () => {
    const nycklar = [
      "Smalt badrumsskåp i bambu | Fyndplats",
      "Smalt badrumsskåp i bambu, 120 cm | Fyndplats",
      "Smalt badrumsskap i bambu | Fyndplats",
      "Smalt badrumsskåp i bambu, 80 cm | Fyndplats",
    ].map(seoNyckel);
    assert.equal(new Set(nycklar).size, 4);
  });

  it("suffixet tas bara bort sist i titeln", () => {
    assert.equal(seoNyckel("Fyndplats guide | Fyndplats"), "fyndplats guide");
    assert.equal(seoNyckel(" | Fyndplats"), "");
  });
});

describe("dubblaTitlar", () => {
  it("☠️ tre fåtöljer med samma titel blir en grupp, och en egen titel står utanför", () => {
    const ut = dubblaTitlar([
      sida("fatolj-c", "Uppresningsfåtölj med massage och värme | Fyndplats"),
      sida("bord", "Soffbord i ek | Fyndplats"),
      sida("fatolj-a", "Uppresningsfåtölj med massage och värme | Fyndplats"),
      sida("fatolj-b", "Uppresningsfåtölj med massage och värme | Fyndplats"),
    ]);
    assert.deepEqual(ut, [{ text: "Uppresningsfåtölj med massage och värme | Fyndplats", slugs: ["fatolj-a", "fatolj-b", "fatolj-c"] }]);
    assert.equal(sidorIGrupper(ut), 3);
  });

  it("☠️ ett kommatecken gör inte en ny titel", () => {
    const ut = dubblaTitlar([sida("hack-1", "Konstgjord häck på rulle 300 × 100 cm | Fyndplats"), sida("hack-2", "Konstgjord häck på rulle, 300 × 100 cm | Fyndplats")]);
    assert.deepEqual(ut.map((g) => g.slugs), [["hack-1", "hack-2"]]);
  });

  it("störst grupp först, sedan i bokstavsordning", () => {
    const ut = dubblaTitlar([
      sida("b1", "Bord | Fyndplats"), sida("b2", "Bord | Fyndplats"),
      sida("s1", "Stol | Fyndplats"), sida("s2", "Stol | Fyndplats"), sida("s3", "Stol | Fyndplats"),
      sida("a1", "Arbetslampa | Fyndplats"), sida("a2", "Arbetslampa | Fyndplats"),
    ]);
    assert.deepEqual(ut.map((g) => g.text), ["Stol | Fyndplats", "Arbetslampa | Fyndplats", "Bord | Fyndplats"]);
  });

  it("inga dubbletter ger en tom lista", () => {
    assert.deepEqual(dubblaTitlar([sida("a", "Bord A | Fyndplats"), sida("b", "Bord B | Fyndplats")]), []);
    assert.deepEqual(dubblaTitlar([]), []);
  });
});

describe("dubblaBeskrivningar", () => {
  it("samma beskrivning på två färger fälls, och sidor utan beskrivning räknas inte", () => {
    const besk = "Smådjurshage 181 × 100 cm utan botten. Två lock som öppnas helt.";
    const ut = dubblaBeskrivningar([
      sida("hage-natur", "Smådjurshage, natur | Fyndplats", besk),
      sida("hage-gra", "Smådjurshage, grå | Fyndplats", besk),
      sida("utan-1", "Bord A | Fyndplats"),
      sida("utan-2", "Bord B | Fyndplats"),
    ]);
    assert.deepEqual(ut, [{ text: besk, slugs: ["hage-gra", "hage-natur"] }]);
  });
});

describe("seoSidaAv", () => {
  it("den kuraterade titeln går först, annars namnet med butikens suffix", () => {
    assert.deepEqual(seoSidaAv({ slug: "bord", name: "Soffbord i ek – 90 cm", seoTitle: "Soffbord i ek | Fyndplats", seoDescription: "Ett soffbord." }), {
      slug: "bord",
      titel: "Soffbord i ek | Fyndplats",
      besk: "Ett soffbord.",
    });
    assert.deepEqual(seoSidaAv({ slug: "bord", name: "Soffbord i ek" }), { slug: "bord", titel: "Soffbord i ek | Fyndplats", besk: "" });
  });

  it("två sidor med samma namn och ingen egen titel är också dubbletter", () => {
    const ut = dubblaTitlar([seoSidaAv({ slug: "a", name: "Soffbord i ek" }), seoSidaAv({ slug: "b", name: "Soffbord i ek" })]);
    assert.equal(ut.length, 1);
  });
});
