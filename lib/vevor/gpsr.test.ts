import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import { gpsrStatus, publikGpsr, tvattaGpsr, tvattaPart, type GpsrPart } from "./gpsr";
import { lasEffektiva, STANDARD_RAD } from "./gpsr-standard";
import type { GpsrLager, VevorGpsrRad } from "./gpsr-lager";
import { publiceringshinder, publiceringshinderFor } from "@/lib/publicering";
import { vevorPubliceradeUtanGpsr } from "./gpsr-vakt";
import { lasGpsr, raknaGpsr, sattGpsr, sattStandard, type GpsrSattDeps } from "./gpsr-satt";

// Påhittade bolag och artikelnummer. Inga riktiga uppgifter i testerna.
const TILLVERKARE: GpsrPart = { namn: "Testfabriken Co., Ltd.", adress: "Testgatan 1, 200000 Teststad, CN", epost: "info@testfabriken.example" };
const EU: GpsrPart = { namn: "Testombud Limited", adress: "Testvägen 2, D00 X000 Dublin, Ireland", epost: "kontakt@testombud.example" };
const SKU_A = "ABC123DEF456";
const SKU_B = "XYZ789UVW012";

function mappning(sku: string, wixProductId: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    wixProductId,
    supplier: "vevor",
    supplierProductId: `vevor:${sku}`,
    variants: [],
    vevorGranskning: { gpsr: "ingen_manual", medicinteknik: false, bildmonster: "ny", bildgranskning: false },
    ...over,
  } as unknown as ProductMappingRecord;
}

function minneslager(start: VevorGpsrRad[] = []): GpsrLager & { rader: Map<string, VevorGpsrRad> } {
  const rader = new Map(start.map((r) => [r.sku, r]));
  return {
    rader,
    async las(skus) {
      return new Map(skus.filter((s) => rader.has(s)).map((s) => [s, rader.get(s)!]));
    },
    async alla() {
      return [...rader.values()];
    },
    async spara(rad) {
      rader.set(rad.sku, rad);
    },
    async taBort(sku) {
      rader.delete(sku);
    },
  };
}

const rad = (sku: string, over: Partial<VevorGpsrRad> = {}): VevorGpsrRad => ({
  sku, tillverkare: TILLVERKARE, euAnsvarig: EU, kalla: "testkälla", at: "2026-10-29T00:00:00.000Z", ...over,
});

describe("tvättningen", () => {
  it("kräver namn, adress och e-post", () => {
    expect(tvattaPart(TILLVERKARE, "tillverkare").ok).toBe(true);
    expect(tvattaPart({ ...TILLVERKARE, epost: "" }, "tillverkare").ok).toBe(false);
    expect(tvattaPart({ ...TILLVERKARE, adress: "kort" }, "tillverkare").ok).toBe(false);
  });

  it("☠️ vägrar webbadresser, artikelnummer och taggar, eftersom loggen är publik", () => {
    expect(tvattaPart({ ...EU, adress: "se https://example.com/manual.pdf" }, "eu").ok).toBe(false);
    expect(tvattaPart({ ...EU, namn: `Ombud ${SKU_A}` }, "eu").ok).toBe(false);
    expect(tvattaPart({ ...EU, namn: "<b>Ombud</b>" }, "eu").ok).toBe(false);
  });

  it("en part får saknas, men inte båda, och källan krävs", () => {
    expect(tvattaGpsr({ tillverkare: TILLVERKARE, euAnsvarig: null, kalla: "manualen" }).ok).toBe(true);
    expect(tvattaGpsr({ tillverkare: null, euAnsvarig: null, kalla: "manualen" }).ok).toBe(false);
    expect(tvattaGpsr({ tillverkare: TILLVERKARE, euAnsvarig: EU, kalla: "" }).ok).toBe(false);
  });
});

describe("statusen", () => {
  it("båda parter ger komplett, bara tillverkaren bara_tillverkare, annars saknas", () => {
    expect(gpsrStatus(rad(SKU_A), "ingen_manual")).toBe("komplett");
    expect(gpsrStatus(rad(SKU_A, { euAnsvarig: null }), "ingen_manual")).toBe("bara_tillverkare");
    expect(gpsrStatus(rad(SKU_A, { tillverkare: null }), "ingen_manual")).toBe("saknas");
  });

  it("utan rad gäller importens status", () => {
    expect(gpsrStatus(null, "ingen_manual")).toBe("ingen_manual");
    expect(gpsrStatus(null, "manual_ej_last")).toBe("manual_ej_last");
    expect(gpsrStatus(null, undefined)).toBe("manual_ej_last");
  });

  it("☠️ en part som ändrats för hand i Wix CMS prövas igen vid läsningen", () => {
    expect(gpsrStatus(rad(SKU_A, { euAnsvarig: { ...EU, epost: "ingen-epost" } }), undefined)).toBe("bara_tillverkare");
  });

  it("det publika svaret finns bara när uppgifterna är kompletta", () => {
    expect(publikGpsr(rad(SKU_A))).toMatchObject({ marke: "VEVOR", tillverkare: TILLVERKARE, euAnsvarig: EU });
    expect(publikGpsr(rad(SKU_A, { euAnsvarig: null }))).toBeNull();
    expect(publikGpsr(null)).toBeNull();
  });
});

describe("standardraden", () => {
  it("gäller varor utan egen rad, och en egen rad går före", async () => {
    const egen = rad(SKU_A, { euAnsvarig: null });
    const lager = minneslager([egen, rad(STANDARD_RAD)]);
    const ut = await lasEffektiva(lager, [SKU_A, SKU_B]);
    expect(ut.get(SKU_A)).toBe(egen);
    expect(ut.get(SKU_B)?.sku).toBe(STANDARD_RAD);
  });

  it("utan standardrad saknas varor utan egen rad i svaret", async () => {
    const ut = await lasEffektiva(minneslager(), [SKU_B]);
    expect(ut.has(SKU_B)).toBe(false);
  });
});

describe("publiceringsspärren", () => {
  it("rör inte Aosom, AliExpress eller okända leverantörer", () => {
    expect(publiceringshinder({ supplier: "aosom", supplierProductId: "aosom:X" } as never, null, "ko")).toBeNull();
    expect(publiceringshinder({ supplierProductId: "1005000000000000" } as never, null, "polering")).toBeNull();
  });

  it("☠️ köns knapp publicerar aldrig en VEVOR-vara, inte ens med komplett GPSR", () => {
    expect(publiceringshinder(mappning(SKU_A, "p1"), rad(SKU_A), "ko")).toEqual({ kod: "via_poleringen" });
  });

  it("poleringen publicerar bara med komplett GPSR", () => {
    expect(publiceringshinder(mappning(SKU_A, "p1"), rad(SKU_A), "polering")).toBeNull();
    expect(publiceringshinder(mappning(SKU_A, "p1"), rad(SKU_A, { euAnsvarig: null }), "polering"))
      .toEqual({ kod: "gpsr", status: "bara_tillverkare" });
    expect(publiceringshinder(mappning(SKU_A, "p1"), null, "polering")).toEqual({ kod: "gpsr", status: "ingen_manual" });
  });

  it("☠️ standardraden släpper varor utan egen rad, men en ofullständig egen rad stoppar ändå", async () => {
    const lager = minneslager([rad(STANDARD_RAD), rad(SKU_A, { euAnsvarig: null })]);
    const hinder = await publiceringshinderFor([mappning(SKU_A, "p1"), mappning(SKU_B, "p2")], "polering", lager);
    expect(hinder.has("p2")).toBe(false);
    expect(hinder.get("p1")).toEqual({ kod: "gpsr", status: "bara_tillverkare" });
  });
});

describe("morgonmejlets vakt", () => {
  it("listar bara synliga VEVOR-varor med hinder", async () => {
    const ids: string[][] = [];
    const ut = await vevorPubliceradeUtanGpsr({
      mappningar: async () => [mappning(SKU_A, "p1"), mappning(SKU_B, "p2"), { wixProductId: "p3", supplier: "aosom", supplierProductId: "aosom:X" } as never],
      synliga: async (frågade) => {
        ids.push(frågade);
        return new Set(["p1"]);
      },
      lager: minneslager([rad(SKU_B)]),
    });
    expect(ut).toEqual(["p1"]);
    expect(ids).toEqual([["p1", "p2"]]);
  });

  it("☠️ kastar när synligheten svarar om produkter vi inte frågade efter", async () => {
    await expect(vevorPubliceradeUtanGpsr({
      mappningar: async () => [mappning(SKU_A, "p1")],
      synliga: async () => new Set(["p1", "nagon-annan"]),
      lager: minneslager(),
    })).rejects.toThrow(/inte frågade efter/);
  });

  it("frågar inte Wix när det inte finns några VEVOR-varor", async () => {
    let fragat = false;
    const ut = await vevorPubliceradeUtanGpsr({
      mappningar: async () => [],
      synliga: async () => {
        fragat = true;
        return new Set();
      },
      lager: minneslager(),
    });
    expect(ut).toEqual([]);
    expect(fragat).toBe(false);
  });
});

describe("att föra in uppgifterna", () => {
  function deps(lager: GpsrLager, m: ProductMappingRecord[]): GpsrSattDeps & { sparade: ProductMappingRecord[] } {
    const sparade: ProductMappingRecord[] = [];
    return {
      sparade,
      mappningar: async (ids) => new Map(m.filter((x) => ids.includes(x.wixProductId)).map((x) => [x.wixProductId, x])),
      allaMappningar: async () => m,
      sparaMappning: async (r) => {
        sparade.push(r);
      },
      lager,
      harManual: async (skus) => new Map(skus.map((s) => [s, false])),
      klocka: () => Date.parse("2026-10-29T12:00:00Z"),
    };
  }

  it("torrt skriver ingenting", async () => {
    const lager = minneslager();
    const d = deps(lager, [mappning(SKU_A, "p1")]);
    const ut = await sattGpsr(["p1"], { tillverkare: TILLVERKARE, euAnsvarig: EU, kalla: "manualen" }, d, true);
    expect(ut).toEqual([{ wixProductId: "p1", status: "komplett" }]);
    expect(lager.rader.size).toBe(0);
    expect(d.sparade).toEqual([]);
  });

  it("skarpt skrivs raden, läses tillbaka och statusen hamnar på mappningen", async () => {
    const lager = minneslager();
    const d = deps(lager, [mappning(SKU_A, "p1")]);
    await sattGpsr(["p1"], { tillverkare: TILLVERKARE, euAnsvarig: EU, kalla: "manualen" }, d, false);
    expect(lager.rader.get(SKU_A)?.euAnsvarig).toEqual(EU);
    expect(d.sparade[0].vevorGranskning?.gpsr).toBe("komplett");
  });

  it("☠️ en rad som inte läser tillbaka ger fel, och mappningen skrivs inte", async () => {
    const lager = minneslager();
    lager.spara = async () => undefined; // skrivningen tas inte emot
    const d = deps(lager, [mappning(SKU_A, "p1")]);
    const ut = await sattGpsr(["p1"], { tillverkare: TILLVERKARE, euAnsvarig: EU, kalla: "manualen" }, d, false);
    expect(ut[0].fel).toMatch(/läste inte tillbaka/);
    expect(d.sparade).toEqual([]);
  });

  it("vägrar varor som inte är VEVOR-varor", async () => {
    const d = deps(minneslager(), [{ wixProductId: "p3", supplier: "aosom", supplierProductId: "aosom:X" } as never]);
    const ut = await sattGpsr(["p3"], { tillverkare: TILLVERKARE, euAnsvarig: EU, kalla: "manualen" }, d, false);
    expect(ut[0].fel).toMatch(/inte en VEVOR-vara/);
  });

  it("standardraden räknas för varor utan egen rad och syns i läsningen", async () => {
    const lager = minneslager();
    const d = deps(lager, [mappning(SKU_A, "p1"), mappning(SKU_B, "p2")]);
    await sattGpsr(["p1"], { tillverkare: TILLVERKARE, euAnsvarig: null, kalla: "manualen" }, d, false);
    expect(await sattStandard({ tillverkare: TILLVERKARE, euAnsvarig: EU, kalla: "Leonards beslut" }, d, false)).toEqual({ status: "komplett" });
    const r = await raknaGpsr(d);
    expect(r).toMatchObject({ vevor: 2, egnaRader: 1, standard: "komplett" });
    expect(r.perStatus).toMatchObject({ komplett: 1, bara_tillverkare: 1 });
    expect(await lasGpsr("p2", d)).toMatchObject({ status: "komplett", rad: "standard" });
    expect(await lasGpsr("p1", d)).toMatchObject({ status: "bara_tillverkare", rad: "egen" });
  });
});
