import { describe, expect, it } from "vitest";
import { isSyntheticMappingId, repairSyntheticVariantIds } from "./mapping-repair";

// Audit 2026-08-08: 85 mappningar med dom-/default-id kan varken auto-beställas
// (sku_attr blir påhittat) eller lagermatchas per variant. Synken självläker dem.
const mv = (id: string, choices: Record<string, string> = {}, costUsd?: number) => ({
  supplierVariantId: id,
  choices,
  costUsd,
});
const dv = (
  skuId: string,
  skuProps: Record<string, string> = {},
  price?: number,
  stock?: number,
  shipFrom?: string,
) => ({
  skuId,
  skuProps,
  price,
  stock,
  shipFrom,
});
const identity = (s: string) => s;

describe("isSyntheticMappingId", () => {
  it("dom-/idx-/default/tomt är syntetiska; riktiga AE-id och attr-strängar är det inte", () => {
    expect(isSyntheticMappingId("dom-0")).toBe(true);
    expect(isSyntheticMappingId("idx-2")).toBe(true);
    expect(isSyntheticMappingId("default")).toBe(true);
    expect(isSyntheticMappingId("")).toBe(true);
    expect(isSyntheticMappingId("12000051057228918")).toBe(false);
    expect(isSyntheticMappingId("14:29#Black;5:100014")).toBe(false);
  });
});

describe("repairSyntheticVariantIds", () => {
  it("vanligaste fallet: en variant på båda sidor → repareras direkt", () => {
    const r = repairSyntheticVariantIds([mv("default")], [dv("9001", { Color: "Black" }, 47.3)], identity);
    expect(r.repaired).toBe(1);
    expect(r.ambiguous).toEqual([]);
    expect(r.variants[0].supplierVariantId).toBe("9001");
  });

  it("matchar via options-signatur med översättning (DS-rå engelska → mappningens svenska)", () => {
    const translate = (s: string) => ({ Blue: "Blå", Green: "Grön" })[s] ?? s;
    const r = repairSyntheticVariantIds(
      [mv("dom-0", { Färg: "Blå" }), mv("dom-1", { Färg: "Grön" })],
      [dv("1", { Color: "Green" }), dv("2", { Color: "Blue" })],
      translate,
    );
    expect(r.repaired).toBe(2);
    expect(r.variants.map((v) => v.supplierVariantId)).toEqual(["2", "1"]);
  });

  it("BLANDAT-mappning: redan använda riktiga id:n reserveras, resten matchas", () => {
    // Babygungan: dom-0 + två riktiga. DS har tre SKU:er — dom-0 ska få den lediga.
    const r = repairSyntheticVariantIds(
      [mv("dom-0", { Läge: "Grå" }), mv("111", { Läge: "Rosa" }), mv("222", { Läge: "Beige" })],
      [dv("999", { Mode: "Grå" }), dv("111", { Mode: "Rosa" }), dv("222", { Mode: "Beige" })],
      identity,
    );
    expect(r.repaired).toBe(1);
    expect(r.variants[0].supplierVariantId).toBe("999");
    expect(r.variants[1].supplierVariantId).toBe("111"); // orörd
  });

  it("pris-fallback: exakt en DS-SKU inom 1 % av costUsd", () => {
    const r = repairSyntheticVariantIds(
      [mv("dom-0", {}, 50)],
      [dv("1", { M: "A" }, 50.2), dv("2", { M: "B" }, 80)],
      identity,
    );
    expect(r.repaired).toBe(1);
    expect(r.variants[0].supplierVariantId).toBe("1");
  });

  it("tvetydigt → orört + rapporterat (hellre manuellt än fel SKU på kundorder)", () => {
    const r = repairSyntheticVariantIds(
      [mv("dom-0", {}, 50), mv("dom-1", {}, 50)],
      [dv("1", { M: "A" }, 50), dv("2", { M: "B" }, 50)],
      identity,
    );
    expect(r.repaired).toBe(0);
    expect(r.ambiguous).toEqual(["dom-0", "dom-1"]);
    expect(r.variants.map((v) => v.supplierVariantId)).toEqual(["dom-0", "dom-1"]);
  });

  it("samma DS-SKU kan aldrig ges till två rader (claimed-spärren)", () => {
    const r = repairSyntheticVariantIds(
      [mv("dom-0", { Färg: "Blå" }), mv("dom-1", {}, 30)],
      [dv("1", { Färg: "Blå" }, 30)],
      identity,
    );
    // dom-0 tar 1 via signatur; dom-1:s pris-fallback får INTE återanvända 1.
    expect(r.repaired).toBe(1);
    expect(r.variants[0].supplierVariantId).toBe("1");
    expect(r.variants[1].supplierVariantId).toBe("dom-1");
    expect(r.ambiguous).toEqual(["dom-1"]);
  });

  it("samma vara i flera lager (identisk signatur) → EU-lagret väljs framför Kina", () => {
    // Nattens facit 2026-08-09: dubbla lager-SKU:er gjorde signaturen "tvetydig"
    // fast det är SAMMA vara — nu väljs föredraget lager i stället.
    const r = repairSyntheticVariantIds(
      [mv("dom-0", { Färg: "Blå" })],
      [
        dv("1", { Color: "Blå", "Ships From": "China" }, 10, 50, "CN"),
        dv("2", { Color: "Blå", "Ships From": "Spain" }, 12, 3, "ES"),
      ],
      identity,
    );
    expect(r.repaired).toBe(1);
    expect(r.variants[0].supplierVariantId).toBe("2"); // EU vinner trots lägre saldo
  });

  it("ensam default-rad mot flerlager-listning där ALLA SKU:er är samma vara → föredragen väljs", () => {
    // 18 av 19 i första nattkörningen: "default" med tomma choices mot en
    // listning med flera lager. En enda signatur på DS-sidan = samma vara.
    const r = repairSyntheticVariantIds(
      [mv("default", {})],
      [
        dv("cn", { Voltage: "220V", "Ships From": "China" }, 60, 50, "CN"),
        dv("es", { Voltage: "220V", "Ships From": "Spain" }, 63, 1, "ES"),
        dv("pl", { Voltage: "220V", "Ships From": "Poland" }, 63, 9, "PL"),
      ],
      identity,
    );
    expect(r.repaired).toBe(1);
    expect(r.variants[0].supplierVariantId).toBe("pl"); // EU först, sedan högst saldo
  });

  it("ensam default-rad men DS har OLIKA varor (två signaturer) → fortfarande tvetydig", () => {
    const r = repairSyntheticVariantIds(
      [mv("default", {})],
      [dv("1", { Size: "12 L" }, 60), dv("2", { Size: "50 L" }, 90)],
      identity,
    );
    expect(r.repaired).toBe(0);
    expect(r.ambiguous).toEqual(["default"]);
  });

  it("ensam rad med EGNA motsägande värden tvångsmappas ALDRIG mot enhetlig DS-grupp (audit 2026-08-09)", () => {
    // Raden säger 'Gul' men alla lediga DS-SKU:er är 'Rosa' — motsägelse är
    // tvetydighet, inte en matchning (fel SKU på kundorder annars).
    const r = repairSyntheticVariantIds(
      [mv("111", { Färg: "Blå" }), mv("dom-3", { Färg: "Gul" })],
      [
        dv("p-es", { Color: "Rosa", "Ships From": "Spain" }, 10, 5, "ES"),
        dv("p-cn", { Color: "Rosa", "Ships From": "China" }, 9, 50, "CN"),
      ],
      identity,
    );
    expect(r.repaired).toBe(0);
    expect(r.ambiguous).toEqual(["dom-3"]);
    expect(r.variants[1].supplierVariantId).toBe("dom-3");
  });

  it("svensk frakt-axel ('Skickas från') på mappningssidan ignoreras i signaturen", () => {
    // Importen översätter 'Ships From' → 'Skickas från' — mappningens choices
    // bär den svenska formen och signaturen måste vara symmetrisk med DS-sidan.
    const r = repairSyntheticVariantIds(
      [mv("dom-0", { Färg: "Blå", "Skickas från": "Spanien" })],
      [
        dv("1", { Color: "Blå", "Ships From": "Spain" }, 12, 3, "ES"),
        dv("2", { Color: "Grön", "Ships From": "Spain" }, 12, 3, "ES"),
      ],
      identity,
    );
    expect(r.repaired).toBe(1);
    expect(r.variants[0].supplierVariantId).toBe("1");
  });

  it("EU-lager UTAN saldo väljs inte före lager MED saldo (audit 2026-08-09)", () => {
    const r = repairSyntheticVariantIds(
      [mv("default", {})],
      [
        dv("es0", { Voltage: "220V", "Ships From": "Spain" }, 63, 0, "ES"),
        dv("cn500", { Voltage: "220V", "Ships From": "China" }, 60, 500, "CN"),
      ],
      identity,
    );
    expect(r.repaired).toBe(1);
    expect(r.variants[0].supplierVariantId).toBe("cn500"); // saldo slår EU-preferens
  });

  it("frakt-axlar och tomma värden ignoreras i signaturen; no-op utan syntetiska id:n", () => {
    const r1 = repairSyntheticVariantIds(
      [mv("dom-0", { Färg: "Röd" })],
      [dv("1", { Color: "Röd", "Ships From": "CHINA" }), dv("2", { Color: "Grön", "Ships From": "CHINA" })],
      identity,
    );
    expect(r1.variants[0].supplierVariantId).toBe("1");
    const clean = [mv("12000051057228918", { Färg: "Blå" })];
    const r2 = repairSyntheticVariantIds(clean, [dv("1")], identity);
    expect(r2.repaired).toBe(0);
    expect(r2.variants[0].supplierVariantId).toBe("12000051057228918");
  });
});
