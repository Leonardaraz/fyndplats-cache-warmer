import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "../store";
import type { WixProduktPris } from "../wix/v3-products";
import {
  MAX_HOJNING_PCT,
  OgiltigHojning,
  entydigtButikspris,
  planSumma,
  planeraPrishojning,
  validateraPct,
} from "./ae-prishojning";

function mappning(over: Partial<ProductMappingRecord> & { wixProductId: string }): ProductMappingRecord {
  return {
    supplierProductId: "1005001234567",
    variants: [{ wixVariantId: "v1", grossSek: 599 }],
    ...over,
  } as unknown as ProductMappingRecord;
}

function pris(priceSek: number | null, variantCount = 1): WixProduktPris {
  return { priceSek, variantCount };
}

/** Butiken säger 599 på en enkel AE-produkt. */
function enkelKatalog() {
  const m = [mappning({ wixProductId: "p1" })];
  const w = new Map([["p1", pris(599)]]);
  return { m, w };
}

describe("planeraPrishojning", () => {
  it("höjer från BUTIKENS pris och avrundar med husets strategi", () => {
    const { m, w } = enkelKatalog();
    const plan = planeraPrishojning(m, w, 10, "charm99");
    // 599 × 1,10 = 658,90 → charm99
    expect(plan.rader).toHaveLength(1);
    expect(plan.rader[0].fran).toBe(599);
    expect(plan.rader[0].till).toBeGreaterThan(599);
    expect(plan.rader[0].till % 10).toBe(9);
  });

  it("☠️ räknar på BUTIKEN, inte på mappningens grossSek", () => {
    // Den dyraste förväxlingen i huset: prissynken jämförde mot mappningen i en
    // månad. Här bär mappningen 400 medan kunden betalar 599 — höjningen ska
    // utgå från 599, annars cementeras driften.
    const m = [mappning({ wixProductId: "p1", variants: [{ wixVariantId: "v1", grossSek: 400 }] as never })];
    const w = new Map([["p1", pris(599)]]);
    const plan = planeraPrishojning(m, w, 10, "none");

    expect(plan.rader[0].fran).toBe(599);
    expect(plan.rader[0].till).toBeCloseTo(658.9, 5);
    // Driften MÄTS, den rättas inte tyst här.
    expect(plan.rader[0].mappningensPris).toBe(400);
    expect(plan.rader[0].drift).toBe(true);
    expect(plan.drivande).toBe(1);
  });

  it("☠️ en Aosom-rad höjs ALDRIG — synken hade skrivit tillbaka den", () => {
    const m = [
      mappning({ wixProductId: "p1", supplier: "aosom", supplierProductId: "aosom:845-030CG" } as never),
    ];
    const w = new Map([["p1", pris(599)]]);
    const plan = planeraPrishojning(m, w, 10, "charm99");

    expect(plan.rader).toHaveLength(0);
    expect(plan.ejAliExpress).toBe(1);
  });

  it("en rad UTAN supplier-fält räknas som AliExpress", () => {
    // Hela katalogen före 2026-08-27 saknar fältet. Klassades de som "okänt"
    // hade höjningen missat merparten av det den gäller.
    const { m, w } = enkelKatalog();
    expect(planeraPrishojning(m, w, 10, "charm99").rader).toHaveLength(1);
  });

  it("☠️ ett PRISLÅST pris rörs inte, och räknas", () => {
    const m = [mappning({ wixProductId: "p1", prisLast: true })];
    const w = new Map([["p1", pris(599)]]);
    const plan = planeraPrishojning(m, w, 10, "charm99");

    expect(plan.rader).toHaveLength(0);
    expect(plan.prisLasta).toBe(1);
  });

  it("☠️ okänt butikspris GISSAS aldrig ur mappningen", () => {
    const m = [mappning({ wixProductId: "saknas" }), mappning({ wixProductId: "flera" })];
    const w = new Map([["flera", pris(null, 3)]]); // min ≠ max → inget entydigt pris
    const plan = planeraPrishojning(m, w, 10, "charm99");

    expect(plan.rader).toHaveLength(0);
    expect(plan.utanWixPris).toBe(2);
  });

  it("flera varianter till SAMMA pris höjs — det är inte tvetydigt", () => {
    // Skillnaden mot `jamforelsePris`, som avvisar varje variantCount > 1.
    const m = [
      mappning({
        wixProductId: "p1",
        variants: [
          { wixVariantId: "v1", grossSek: 599 },
          { wixVariantId: "v2", grossSek: 599 },
        ] as never,
      }),
    ];
    const w = new Map([["p1", pris(599, 2)]]);
    const plan = planeraPrishojning(m, w, 10, "charm99");

    expect(plan.rader).toHaveLength(1);
    expect(plan.rader[0].variantIds).toEqual(["v1", "v2"]);
  });

  it("☠️ mappning som inte täcker alla Wix-varianter hoppas över — halvt höjt pris är värre", () => {
    const m = [
      mappning({ wixProductId: "p1", variants: [{ wixVariantId: "v1", grossSek: 599 }] as never }),
    ];
    const w = new Map([["p1", pris(599, 3)]]); // Wix har tre, mappningen en
    const plan = planeraPrishojning(m, w, 10, "charm99");

    expect(plan.rader).toHaveLength(0);
    expect(plan.variantavvikelse).toBe(1);
  });

  it("en höjning som avrundas bort blir ingen skrivning", () => {
    const m = [mappning({ wixProductId: "p1" })];
    const w = new Map([["p1", pris(599)]]);
    // 599 × 1,0001 = 599,06 → charm99 rundar tillbaka till 599
    const plan = planeraPrishojning(m, w, 0.01, "charm99");

    expect(plan.rader).toHaveLength(0);
    expect(plan.oforandrade).toBe(1);
  });
});

describe("validateraPct", () => {
  it("☠️ saknat värde avvisas — ingen default", () => {
    expect(() => validateraPct(null)).toThrow(OgiltigHojning);
    expect(() => validateraPct("")).toThrow(OgiltigHojning);
  });

  it("noll och negativa tal avvisas — rutten sänker aldrig", () => {
    expect(() => validateraPct("0")).toThrow(/inte en höjning/);
    expect(() => validateraPct("-5")).toThrow(/inte en höjning/);
  });

  it("☠️ över taket avvisas — fettfingret får inte nå kund", () => {
    expect(() => validateraPct(String(MAX_HOJNING_PCT + 1))).toThrow(/taket/);
    expect(validateraPct("10")).toBe(10);
  });

  it("icke-tal avvisas", () => {
    expect(() => validateraPct("tio")).toThrow(/inte ett tal/);
  });
});

describe("planSumma", () => {
  it("☠️ ändras när ett pris ändras — en gammal bekräftelse kan inte godkänna en ny plan", () => {
    const a = planSumma([
      { wixProductId: "p1", fran: 599, till: 659, mappningensPris: 599, drift: false, variantIds: ["v1"] },
    ]);
    const b = planSumma([
      { wixProductId: "p1", fran: 599, till: 669, mappningensPris: 599, drift: false, variantIds: ["v1"] },
    ]);
    expect(a).not.toBe(b);
  });

  it("är stabil för samma plan", () => {
    const rad = {
      wixProductId: "p1",
      fran: 599,
      till: 659,
      mappningensPris: 599,
      drift: false,
      variantIds: ["v1"],
    };
    expect(planSumma([rad])).toBe(planSumma([rad]));
  });
});

describe("entydigtButikspris", () => {
  it("saknad produkt och tvetydigt pris ger null", () => {
    expect(entydigtButikspris(undefined)).toBeNull();
    expect(entydigtButikspris(pris(null, 2))).toBeNull();
  });

  it("ett entydigt pris släpps igenom oavsett antal varianter", () => {
    expect(entydigtButikspris(pris(599, 7))).toBe(599);
  });
});
