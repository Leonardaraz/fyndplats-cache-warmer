import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ensureRated, pickHero } from "./hero-picks.ts";

const p = (slug: string, rating?: unknown, avd = "") => ({ slug, rating, avd });
/** Betygsatt produkt med ett känt antal omdömen. */
const r = (slug: string, count: number, avd = "") =>
  p(slug, { value: "5,0", count }, avd);
const avdelning = (x: { avd: string }) => x.avd;
const slugs = (xs: { slug: string }[]) => xs.map((x) => x.slug);

describe("pickHero", () => {
  it("tar produkter MED omdömen först", () => {
    const pool = [p("a"), p("b", { value: "4,5" }), p("c"), p("d", { value: "5,0" })];
    assert.deepEqual(slugs(pickHero(pool, [], 2)), ["b", "d"]);
  });

  it("fyller på med obetygsatta när de betygsatta inte räcker", () => {
    // Kärnan i att golvet är MJUKT: hjälten blir aldrig gles bara för att
    // katalogen saknar omdömen i den avdelningen.
    const pool = [p("a"), p("b", { value: "4,5" }), p("c"), p("d")];
    assert.deepEqual(slugs(pickHero(pool, [], 4)), ["b", "a", "c", "d"]);
  });

  it("bevarar ordningen i de icke-reserverade passen", () => {
    // Anroparen skickar mixByCategory-ordnad data. Sorterar vi om där går
    // bredden över avdelningar och nyast-först förlorad.
    const pool = [p("a", 1), p("b", 1), p("c", 1)];
    assert.deepEqual(slugs(pickHero(pool, [], 3)), ["a", "b", "c"]);
  });

  it("går till fallback sist när poolen är för liten", () => {
    const pool = [p("a", 1)];
    const fallback = [p("x"), p("y")];
    assert.deepEqual(slugs(pickHero(pool, fallback, 3)), ["a", "x", "y"]);
  });

  it("samma produkt tar bara en plats även om den finns i båda listorna", () => {
    const pool = [p("a", 1), p("b")];
    const fallback = [p("a", 1), p("c")];
    assert.deepEqual(slugs(pickHero(pool, fallback, 4)), ["a", "b", "c"]);
  });

  it("sprider de betygsatta over avdelningar i stallet for att klumpa ihop dem", () => {
    // Regressionen granskningen hittade: en ren filtrering av round-robin-listan
    // bevarade ordningen men inte bredden. Har har avdelning A tre betygsatta
    // och B/C en var — utan breddspärren hade hjälten blivit A,A,A,B.
    const pool = [
      p("a1", 1, "A"), p("b1", 1, "B"), p("a2", 1, "A"),
      p("c1", 1, "C"), p("a3", 1, "A"),
    ];
    assert.deepEqual(slugs(pickHero(pool, [], 4, avdelning)), ["a1", "b1", "c1", "a2"]);
  });

  it("fyller pa fran en redan anvand avdelning hellre an att lamna en plats tom", () => {
    const pool = [p("a1", 1, "A"), p("a2", 1, "A"), p("a3", 1, "A")];
    assert.deepEqual(slugs(pickHero(pool, [], 3, avdelning)), ["a1", "a2", "a3"]);
  });

  it("betyg gar fore bredd pa de reserverade platserna", () => {
    const pool = [p("a1", 1, "A"), p("a2", 1, "A"), p("b1", undefined, "B")];
    assert.deepEqual(slugs(pickHero(pool, [], 2, avdelning)), ["a1", "a2"]);
  });

  it("utan keyOf beter den sig som ren betygsprioritering", () => {
    const pool = [p("a1", 1, "A"), p("a2", 1, "A"), p("b1", 1, "B")];
    assert.deepEqual(slugs(pickHero(pool, [], 3)), ["a1", "a2", "b1"]);
  });

  it("returnerar aldrig fler än limit", () => {
    const pool = [p("a", 1), p("b", 1), p("c", 1), p("d", 1), p("e", 1)];
    assert.equal(pickHero(pool, [], 4).length, 4);
  });

  it("tom katalog ger tom hjälte i stället för att kasta", () => {
    assert.deepEqual(pickHero([], [], 4), []);
  });

  it("behandlar rating som saknas och rating som finns lika oavsett form", () => {
    const pool = [p("utan", undefined), p("med", { value: "4,0", count: 3 })];
    assert.deepEqual(slugs(pickHero(pool, [], 1)), ["med"]);
  });

  // ── Leonards regel 2026-08-19: minst 2, inte alla 4, och blandat ──────────

  it("reserverar bara minRated platser — resten gar till nyast-forst", () => {
    // Klagomålet: alla fyra brickorna blev "5,0 (1)". Nu ska tva vara farska.
    const pool = [p("ny1"), p("ny2"), r("bra", 7), r("tunn", 1), r("mellan", 3)];
    assert.deepEqual(slugs(pickHero(pool, [], 4)), ["bra", "mellan", "ny1", "ny2"]);
  });

  it("de reserverade platserna gar till de BAST recenserade", () => {
    // 16 av katalogens 33 betygsatta kort har exakt ett omdöme. Tas de i
    // träffordning blir det nästan alltid engångsomdömen som visas.
    const pool = [r("en", 1), r("elva", 11), r("tva", 2), r("sex", 6)];
    assert.deepEqual(slugs(pickHero(pool, [], 2)), ["elva", "sex"]);
  });

  it("lika manga omdomen behaller anroparens ordning", () => {
    const pool = [r("forst", 4), r("sedan", 4), r("sist", 4)];
    assert.deepEqual(slugs(pickHero(pool, [], 2)), ["forst", "sedan"]);
  });

  it("hamtar betygsatta ur reserv-listan nar poolen inte racker till golvet", () => {
    // Annars vore "minst 2" bara en förhoppning i en ny avdelning.
    const pool = [r("enda", 2), p("ny1"), p("ny2")];
    const fallback = [r("gammal", 9)];
    assert.deepEqual(slugs(pickHero(pool, fallback, 4)), ["enda", "gammal", "ny1", "ny2"]);
  });

  it("minRated 0 stanger av reservationen helt", () => {
    const pool = [p("ny1"), p("ny2"), r("bra", 7)];
    assert.deepEqual(slugs(pickHero(pool, [], 3, () => "", 0)), ["ny1", "ny2", "bra"]);
  });

  it("golvet ar ett golv, inte ett tak", () => {
    // Är hela poolen betygsatt ska alla fyra få stjärnor — det är bara den
    // PÅTVINGADE fyllningen som är begränsad till 2.
    const pool = [r("a", 1), r("b", 1), r("c", 1), r("d", 1)];
    assert.equal(pickHero(pool, [], 4).filter((x) => x.rating).length, 4);
  });
});

describe("ensureRated", () => {
  it("lamnar raden ororld nar golvet redan ar uppnatt", () => {
    const picks = [r("a", 1), p("b"), r("c", 2), p("d")];
    assert.deepEqual(slugs(ensureRated(picks, [r("x", 9)], 2)), ["a", "b", "c", "d"]);
  });

  it("byter ut de SISTA obetygsatta — REA-fynden leder raden och star kvar", () => {
    const picks = [p("rea1"), p("rea2"), p("ny1"), p("ny2")];
    const kandidater = [r("bra", 8), r("mellan", 3)];
    assert.deepEqual(slugs(ensureRated(picks, kandidater, 2)), ["rea1", "rea2", "mellan", "bra"]);
  });

  it("byter bara sa manga som behovs", () => {
    // Ett betyg finns redan (c), golvet ar 2 → exakt EN post byts ut, och det
    // blir den sista obetygsatta (b). "a" och "c" star kvar.
    const picks = [p("a"), p("b"), r("c", 1)];
    assert.deepEqual(slugs(ensureRated(picks, [r("x", 9), r("y", 8)], 2)), ["a", "x", "c"]);
  });

  it("ror aldrig en post som redan har omdomen", () => {
    const picks = [p("a"), r("behall", 1)];
    const ut = ensureRated(picks, [r("x", 9)], 2);
    assert.equal(ut.filter((q) => q.slug === "behall").length, 1);
  });

  it("lagger aldrig in en produkt som redan finns i raden", () => {
    const picks = [p("a"), p("b")];
    const ut = ensureRated(picks, [p("a", { count: 5 }), r("ny", 2)], 2);
    assert.equal(slugs(ut).filter((s) => s === "a").length, 1);
    assert.ok(slugs(ut).includes("ny"));
  });

  it("returnerar raden oforandrad nar inga kandidater finns", () => {
    // Hellre en rad med farre stjarnor an en gles rad.
    const picks = [p("a"), p("b"), p("c")];
    assert.deepEqual(slugs(ensureRated(picks, [], 2)), ["a", "b", "c"]);
    assert.deepEqual(slugs(ensureRated(picks, [p("obetygsatt")], 2)), ["a", "b", "c"]);
  });

  it("andrar aldrig radens langd", () => {
    const picks = [p("a"), p("b"), p("c"), p("d")];
    assert.equal(ensureRated(picks, [r("x", 9), r("y", 8), r("z", 7)], 2).length, 4);
  });

  it("gor sa gott det gar nar raden ar kortare an golvet", () => {
    const picks = [p("a")];
    assert.deepEqual(slugs(ensureRated(picks, [r("x", 9), r("y", 8)], 2)), ["x"]);
  });

  it("tom rad ger tom rad", () => {
    assert.deepEqual(ensureRated([], [r("x", 9)], 2), []);
  });

  it("basta kandidaten forst aven har", () => {
    const picks = [p("a"), p("b")];
    assert.deepEqual(slugs(ensureRated(picks, [r("tunn", 1), r("bast", 12)], 1)), ["a", "bast"]);
  });
});
