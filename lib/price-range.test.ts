import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatPrice,
  parsePriceSlug,
  priceBounds,
  priceRangeLabel,
  priceSlug,
  upperLimit,
} from "./price-range.ts";

// Bakgrund: de hårdkodade hinkarna (Under 100 / 100–250 / 250–500 / Över 500)
// filtrerade ingenting — 0 / 1 / 67 / 768 produkter i den riktiga katalogen.
// Testerna här låser att skalan räknas ur datan i stället, och att den långa
// svansen inte får äta upp dragsträckan.

const items = (...prices: number[]) => prices.map((priceNum) => ({ priceNum }));

/** n jämnt fördelade priser mellan lo och hi (inklusive båda). */
const spread = (n: number, lo: number, hi: number) =>
  items(...Array.from({ length: n }, (_, i) => Math.round(lo + ((hi - lo) * i) / (n - 1))));

/** Katalogens verkliga form 2026-08-21: 95 % under ~2 900 kr, en tunn svans upp
 *  till 19 459. Den fixtur som hela designen finns till för. */
const riktigKatalog = () => [
  ...spread(95, 199, 2879),
  ...items(3200, 5400, 8900, 13000, 19459),
];

describe("priceBounds", () => {
  it("avrundar utåt så billigaste och dyraste går att välja", () => {
    const b = priceBounds(spread(40, 199, 1899))!;
    assert.ok(b.min <= 199, `min ${b.min} får inte kapa den billigaste`);
    assert.ok(b.max >= 1899, `max ${b.max} får inte kapa den dyraste`);
    assert.equal(b.min % b.step, 0);
    assert.equal(b.max % b.step, 0);
  });

  it("kapar den långa svansen vid p95 och markerar toppen som öppen", () => {
    const b = priceBounds(riktigKatalog())!;
    assert.deepEqual(b, { min: 150, max: 2900, step: 50, openTop: true });
    // Utan kapningen hade skalan gått till 19 500 och "under 1 000 kr" legat på
    // de första fyra procenten av banan.
    assert.ok(b.max < 19459);
  });

  it("ingen kapning när katalogen saknar svans", () => {
    const b = priceBounds(spread(40, 200, 1000))!;
    assert.equal(b.openTop, false);
    assert.ok(b.max >= 1000);
  });

  it("steget växer med spannet och är alltid positivt", () => {
    assert.equal(priceBounds(spread(20, 50, 300))!.step, 10);
    assert.equal(priceBounds(spread(20, 100, 1000))!.step, 25);
    assert.equal(priceBounds(spread(40, 200, 3000))!.step, 50);
    for (const b of [spread(20, 50, 300), spread(40, 200, 3000), riktigKatalog()]) {
      assert.ok(priceBounds(b)!.step > 0);
    }
  });

  it("samma skala oavsett indatans ordning", () => {
    const lista = riktigKatalog();
    const omkastad = [...lista].reverse();
    const roterad = [...lista.slice(37), ...lista.slice(0, 37)];
    assert.deepEqual(priceBounds(omkastad), priceBounds(lista));
    assert.deepEqual(priceBounds(roterad), priceBounds(lista));
  });

  it("inget reglage när det inte kan hjälpa någon", () => {
    assert.equal(priceBounds([]), null);
    assert.equal(priceBounds(items(999)), null);
    assert.equal(priceBounds(items(...Array(40).fill(999))), null, "ett enda pris");
    assert.equal(priceBounds(spread(40, 899, 999)), null, "spridning 1,11 < 1,5");
    assert.equal(priceBounds(spread(5, 199, 4999)), null, "färre än 8 priser");
  });

  it("struntar i icke-priser i stället för att spegla dem i skalan", () => {
    const b = priceBounds([...spread(40, 200, 1600), ...items(0, -5, NaN, Infinity)])!;
    assert.ok(b.min > 0);
    assert.ok(Number.isFinite(b.max));
  });
});

describe("parsePriceSlug", () => {
  it("förstår grammatikens tre former", () => {
    assert.deepEqual(parsePriceSlug("under-700"), { min: 0, max: 700 });
    assert.deepEqual(parsePriceSlug("700-1500"), { min: 700, max: 1500 });
    assert.deepEqual(parsePriceSlug("over-1500"), { min: 1500, max: Infinity });
  });

  it("de gamla hink-slugarna parsar fortfarande — delade länkar får inte dö", () => {
    assert.deepEqual(parsePriceSlug("under-100"), { min: 0, max: 100 });
    assert.deepEqual(parsePriceSlug("100-250"), { min: 100, max: 250 });
    assert.deepEqual(parsePriceSlug("250-500"), { min: 250, max: 500 });
    assert.deepEqual(parsePriceSlug("over-500"), { min: 500, max: Infinity });
  });

  it("skräp ger null i stället för ett halvt filter", () => {
    for (const s of ["", null, undefined, "banan", "under-", "-500", "500-100", "700-700", "abc-def", "1e9", "00000000700-1000", "under-0"]) {
      assert.equal(parsePriceSlug(s), null, `${s} borde ge null`);
    }
  });
});

describe("priceSlug", () => {
  const b = { min: 150, max: 2900, step: 50, openTop: true };

  it("tom sträng när handtagen står i ytterlägena — inget ?pris i URL:en", () => {
    assert.equal(priceSlug(150, 2900, b), "");
  });

  it("bara maxhandtaget draget → under-X", () => {
    assert.equal(priceSlug(150, 500, b), "under-500");
  });

  it("bara minhandtaget draget → over-X", () => {
    assert.equal(priceSlug(900, 2900, b), "over-900");
  });

  it("båda dragna → intervall", () => {
    assert.equal(priceSlug(500, 1500, b), "500-1500");
  });

  it("går fram och tillbaka genom parsePriceSlug", () => {
    for (const [lo, hi] of [[150, 500], [900, 2900], [500, 1500]] as const) {
      const parsed = parsePriceSlug(priceSlug(lo, hi, b))!;
      assert.equal(parsed.min, lo <= b.min ? 0 : lo);
      assert.equal(parsed.max, hi >= b.max ? Infinity : hi);
    }
  });
});

describe("upperLimit", () => {
  it("toppläget har ingen övre gräns", () => {
    const b = { min: 150, max: 2900, step: 50, openTop: true };
    assert.equal(upperLimit(2900, b), Infinity);
    assert.equal(upperLimit(1500, b), 1500);
  });

  it("gäller även när skalan inte är kapad — annars tappas den dyraste", () => {
    // Neutralläget får aldrig filtrera bort en produkt vars pris råkar ligga
    // exakt på skalans topp.
    const b = { min: 200, max: 1000, step: 25, openTop: false };
    assert.equal(upperLimit(1000, b), Infinity);
    const dyrast = 1000;
    assert.ok(dyrast >= b.min && dyrast < upperLimit(1000, b));
  });
});

describe("formatPrice", () => {
  it("hårt mellanslag som tusentalsavgränsare", () => {
    assert.equal(formatPrice(1219), "1 219 kr");
    assert.equal(formatPrice(999), "999 kr");
    assert.equal(formatPrice(19459), "19 459 kr");
  });

  it("aldrig Intl — etiketten jämförs vid hydrering", () => {
    // U+202F (narrow no-break space) är vad vissa CLDR-versioner byter till.
    assert.ok(!formatPrice(1000).includes(" "));
    assert.ok(!formatPrice(1000).includes(","));
  });
});

describe("priceRangeLabel", () => {
  it("säger vad som faktiskt är valt", () => {
    assert.equal(priceRangeLabel(0, Infinity), "Alla priser");
    assert.equal(priceRangeLabel(0, 900), "Under 900 kr");
    assert.equal(priceRangeLabel(1500, Infinity), "Från 1 500 kr");
    assert.equal(priceRangeLabel(650, 1200), "650–1 200 kr");
  });
});
