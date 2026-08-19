import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickHero } from "./hero-picks.ts";

const p = (slug: string, rating?: unknown, avd = "") => ({ slug, rating, avd });
const avdelning = (x: { avd: string }) => x.avd;

describe("pickHero", () => {
  it("tar produkter MED omdömen först", () => {
    const pool = [p("a"), p("b", { value: "4,5" }), p("c"), p("d", { value: "5,0" })];
    assert.deepEqual(pickHero(pool, [], 2).map((x) => x.slug), ["b", "d"]);
  });

  it("fyller på med obetygsatta när de betygsatta inte räcker", () => {
    // Kärnan i att prioriteringen är MJUK: hjälten blir aldrig gles bara för
    // att katalogen saknar omdömen i den avdelningen.
    const pool = [p("a"), p("b", { value: "4,5" }), p("c"), p("d")];
    assert.deepEqual(pickHero(pool, [], 4).map((x) => x.slug), ["b", "a", "c", "d"]);
  });

  it("bevarar ordningen inom varje pass", () => {
    // Anroparen skickar mixByCategory-ordnad data. Sorterar vi om här går
    // bredden över avdelningar och nyast-först förlorad.
    const pool = [p("a", 1), p("b", 1), p("c", 1)];
    assert.deepEqual(pickHero(pool, [], 3).map((x) => x.slug), ["a", "b", "c"]);
  });

  it("går till fallback sist när poolen är för liten", () => {
    const pool = [p("a", 1)];
    const fallback = [p("x"), p("y")];
    assert.deepEqual(pickHero(pool, fallback, 3).map((x) => x.slug), ["a", "x", "y"]);
  });

  it("samma produkt tar bara en plats även om den finns i båda listorna", () => {
    const pool = [p("a", 1), p("b")];
    const fallback = [p("a", 1), p("c")];
    assert.deepEqual(pickHero(pool, fallback, 4).map((x) => x.slug), ["a", "b", "c"]);
  });

  it("sprider de betygsatta over avdelningar i stallet for att klumpa ihop dem", () => {
    // Regressionen granskningen hittade: en ren filtrering av round-robin-listan
    // bevarade ordningen men inte bredden. Har har avdelning A tre betygsatta
    // och B/C en var — utan breddspärren hade hjälten blivit A,A,A,B.
    const pool = [
      p("a1", 1, "A"), p("b1", 1, "B"), p("a2", 1, "A"),
      p("c1", 1, "C"), p("a3", 1, "A"),
    ];
    assert.deepEqual(
      pickHero(pool, [], 4, avdelning).map((x) => x.slug),
      ["a1", "b1", "c1", "a2"],
    );
  });

  it("fyller pa fran en redan anvand avdelning hellre an att lamna en plats tom", () => {
    // Bredden ar en preferens, inte ett krav — annars hade hjälten blivit gles
    // i en katalog med fa avdelningar.
    const pool = [p("a1", 1, "A"), p("a2", 1, "A"), p("a3", 1, "A")];
    assert.deepEqual(pickHero(pool, [], 3, avdelning).map((x) => x.slug), ["a1", "a2", "a3"]);
  });

  it("betyg gar fore bredd: en andra betygsatt slar en obetygsatt fran ny avdelning", () => {
    const pool = [p("a1", 1, "A"), p("a2", 1, "A"), p("b1", undefined, "B")];
    assert.deepEqual(pickHero(pool, [], 2, avdelning).map((x) => x.slug), ["a1", "a2"]);
  });

  it("utan keyOf beter den sig som ren betygsprioritering", () => {
    const pool = [p("a1", 1, "A"), p("a2", 1, "A"), p("b1", 1, "B")];
    assert.deepEqual(pickHero(pool, [], 3).map((x) => x.slug), ["a1", "a2", "b1"]);
  });

  it("returnerar aldrig fler än limit", () => {
    const pool = [p("a", 1), p("b", 1), p("c", 1), p("d", 1), p("e", 1)];
    assert.equal(pickHero(pool, [], 4).length, 4);
  });

  it("tom katalog ger tom hjälte i stället för att kasta", () => {
    assert.deepEqual(pickHero([], [], 4), []);
  });

  it("behandlar rating som saknas och rating som finns lika oavsett form", () => {
    // applyRatings sätter antingen ett CardRating-objekt eller lämnar fältet
    // odefinierat — inga tomma strängar eller nollor att falla på.
    const pool = [p("utan", undefined), p("med", { value: "4,0", count: 3 })];
    assert.deepEqual(pickHero(pool, [], 1).map((x) => x.slug), ["med"]);
  });
});
