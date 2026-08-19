import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickHero } from "./hero-picks.ts";

const p = (slug: string, rating?: unknown) => ({ slug, rating });

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
