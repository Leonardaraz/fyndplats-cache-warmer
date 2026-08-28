// Repot kör node --test (se package.json), inte vitest — och en testfil måste
// importera sin syskonmodul MED .ts-ändelse för att köraren ska hitta den.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { farskaProdukter } from "./fresh-products.ts";

const NU = Date.UTC(2026, 7, 28, 12, 0, 0);
const MIN = 60_000;
const TIMME = 60 * MIN;
const p = (slug: string, minuterSedan: number) => ({ slug, updatedAt: NU - minuterSedan * MIN });

describe("farskaProdukter", () => {
  it("tar med det som ligger inom fönstret och utelämnar resten", () => {
    const ut = farskaProdukter([p("ny", 10), p("gammal", 300)], NU, 70 * MIN, 100);
    assert.deepEqual(ut.slugs, ["ny"]);
    assert.equal(ut.iFonstret, 1);
  });

  it("nyast först", () => {
    const ut = farskaProdukter([p("b", 30), p("a", 5), p("c", 60)], NU, 70 * MIN, 100);
    assert.deepEqual(ut.slugs, ["a", "b", "c"]);
  });

  it("BULK-PUBLICERING: identiska tidsstämplar ordnas stabilt på slug", () => {
    // Publiceras 300 produkter på en gång får de samma updatedAt. Utan
    // tie-break hade ordningen — och därmed vilka som ryms under taket —
    // kastat om sig mellan körningar.
    const alla = [p("zebra", 5), p("apa", 5), p("mus", 5)];
    const a = farskaProdukter(alla, NU, 70 * MIN, 100);
    const b = farskaProdukter([...alla].reverse(), NU, 70 * MIN, 100);
    assert.deepEqual(a.slugs, ["apa", "mus", "zebra"]);
    assert.deepEqual(a.slugs, b.slugs, "samma urval oavsett indataordning");
  });

  it("taket skär listan och rapporterar hur många som blev över", () => {
    const ut = farskaProdukter([p("a", 1), p("b", 2), p("c", 3)], NU, TIMME, 2);
    assert.deepEqual(ut.slugs, ["a", "b"]);
    assert.equal(ut.iFonstret, 3);
    assert.equal(ut.overTaket, 1, "resten tas av nästa körning");
  });

  it("PRODUKT UTAN TIDSSTÄMPEL RÄKNAS ALDRIG SOM FÄRSK", () => {
    // Annars hade en katalog utan updatedAt aviserat varenda produkt vid varje
    // körning — ett svep i stället för en avisering.
    assert.deepEqual(farskaProdukter([{ slug: "x", updatedAt: 0 }], NU, TIMME, 100).slugs, []);
    assert.deepEqual(farskaProdukter([{ slug: "x", updatedAt: -1 }], NU, TIMME, 100).slugs, []);
  });

  it("framtida tidsstämpel tas inte med (klockskev i Wix)", () => {
    assert.deepEqual(farskaProdukter([p("framtid", -30)], NU, TIMME, 100).slugs, []);
  });

  it("produkt utan slug hoppas över", () => {
    assert.deepEqual(farskaProdukter([{ slug: "", updatedAt: NU }], NU, TIMME, 100).slugs, []);
  });

  it("exakt på fönstrets kant räknas med", () => {
    assert.deepEqual(farskaProdukter([{ slug: "kant", updatedAt: NU - TIMME }], NU, TIMME, 100).slugs, ["kant"]);
  });

  it("tom katalog, nolltak och nollfönster ger inget", () => {
    assert.deepEqual(farskaProdukter([], NU, TIMME, 100).slugs, []);
    assert.deepEqual(farskaProdukter([p("a", 1)], NU, TIMME, 0).slugs, []);
    assert.deepEqual(farskaProdukter([p("a", 1)], NU, 0, 100).slugs, []);
  });

  it("muterar inte indatan", () => {
    const indata = [p("b", 30), p("a", 5)];
    const kopia = indata.map((x) => ({ ...x }));
    farskaProdukter(indata, NU, TIMME, 100);
    assert.deepEqual(indata, kopia);
  });
});
