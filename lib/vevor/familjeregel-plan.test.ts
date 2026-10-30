import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import type { Avlasning } from "./lager";
import { planeraFamiljeregel, spuKandidater } from "./familjeregel-plan";
import { testAvlasning, testgalleri } from "./testsida";

// Påhittade artikelnummer, id och värden.
const NU = Date.parse("2026-10-30T12:00:00.000Z");
const sku = (n: number) => `TESTSKUPLAN${String(n).padStart(6, "0")}`;

function rad(n: number, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    wixProductId: `wix-${n}`,
    supplierProductId: `vevor:${sku(n)}`,
    supplier: "vevor",
    needsAiPolish: true,
    draftStatus: "pending_review",
    variants: [{ supplierVariantId: sku(n), sku: `FP-${n}`, choices: {}, costUsd: 1 }],
    ...over,
  } as ProductMappingRecord;
}

/** En familj på en rad: artiklarna `n…` med valen. */
function familj(n: number, val: Record<string, string>[], over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return rad(n, {
    variants: val.map((choices, i) => ({ supplierVariantId: sku(n + i), sku: `FP-${n + i}`, choices, costUsd: 1, landedCostSek: 10, grossSek: 19 })),
    vevorArtiklar: val.map((_, i) => `vevor:${sku(n + i)}`),
    ...over,
  });
}

function hink(n: number, farg: string, over: Partial<Avlasning> = {}): Avlasning {
  return testAvlasning({
    sku: sku(n),
    spu: "55555",
    bilder: testgalleri(sku(n)),
    namn: `VEVOR Testhink ${farg}`,
    egenskaper: [],
    syskon: [],
    lastAt: "2026-10-30T10:00:00.000Z",
    spec: [["Artikelmodellnummer", `TEST-${n}`], ["Färg", farg], ["Material", "Plast"]],
    ...over,
  });
}

const grupper = (...a: Avlasning[]) => {
  const g = new Map<string, Avlasning[]>();
  for (const x of a) if (x.spu) g.set(x.spu, [...(g.get(x.spu) ?? []), x]);
  return g;
};

describe("planeraFamiljeregel: befintliga familjer", () => {
  it("☠️ en familj med en axel för funktion delas, en tillåten står kvar", () => {
    const p = planeraFamiljeregel({
      mappningar: [
        familj(1, [{ Kraft: "850 W" }, { Kraft: "1800 W" }]),
        familj(10, [{ Färg: "Svart" }, { Färg: "Vit" }]),
        familj(20, [{ Antal: "4 st" }, { Antal: "6 st" }]),
      ],
      grupper: new Map(),
      nu: NU,
    });
    expect(p).toMatchObject({ utkast: 3, familjer: 3, dela: ["wix-1"], slaIhop: [], grans: [] });
  });

  it("☠️ en oklar axel raderas inte, den listas per axel för Leonard", () => {
    const p = planeraFamiljeregel({
      mappningar: [familj(1, [{ Material: "Trä" }, { Material: "Bambu" }]), familj(10, [{ Material: "Stål" }, { Material: "Plast" }])],
      grupper: new Map(),
      nu: NU,
    });
    expect(p.dela).toEqual([]);
    expect(p.grans).toEqual([{ axel: "Material", antal: 2, wixIds: ["wix-1", "wix-10"] }]);
  });

  it("☠️ en polerad eller publicerad familj rörs aldrig", () => {
    const p = planeraFamiljeregel({
      mappningar: [
        familj(1, [{ Kraft: "850 W" }, { Kraft: "1800 W" }], { needsAiPolish: false }),
        familj(10, [{ Kraft: "850 W" }, { Kraft: "1800 W" }], { draftStatus: "published" }),
      ],
      grupper: new Map(),
      nu: NU,
    });
    expect(p).toMatchObject({ utkast: 0, familjer: 0, dela: [] });
  });
});

describe("planeraFamiljeregel: ensamma utkast med samma SPU", () => {
  it("två ensamma utkast som blir en familj raderas båda", () => {
    const p = planeraFamiljeregel({ mappningar: [rad(1), rad(2)], grupper: grupper(hink(1, "Svart"), hink(2, "Vit")), nu: NU });
    expect(p).toMatchObject({ slaIhop: ["wix-1", "wix-2"], slaIhopFamiljer: 1, dela: [] });
  });

  it("ett utkast och en artikel som inte importerats än: bara utkastet raderas", () => {
    const p = planeraFamiljeregel({ mappningar: [rad(2)], grupper: grupper(hink(1, "Svart"), hink(2, "Vit")), nu: NU });
    expect(p).toMatchObject({ slaIhop: ["wix-2"], slaIhopFamiljer: 1 });
  });

  it("☠️ en artikel på en polerad sida är upptagen och följer inte med", () => {
    const p = planeraFamiljeregel({
      mappningar: [rad(1, { needsAiPolish: false }), rad(2), rad(3)],
      grupper: grupper(hink(1, "Svart"), hink(2, "Vit"), hink(3, "Röd")),
      nu: NU,
    });
    expect(p).toMatchObject({ slaIhop: ["wix-2", "wix-3"], slaIhopFamiljer: 1 });
  });

  it("☠️ en grupp som blir egna sidor eller väntar raderar ingenting", () => {
    const effekt = (n: number, farg: string, w: string) =>
      hink(n, farg, { spec: [["Färg", farg], ["Effekt", w]], namn: `VEVOR Testhink ${farg} ${w}` });
    const egna = planeraFamiljeregel({
      mappningar: [rad(1), rad(2)],
      grupper: grupper(effekt(1, "Svart", "850 W"), effekt(2, "Vit", "1800 W")),
      nu: NU,
    });
    expect(egna).toMatchObject({ slaIhop: [], spuEnsamma: 1 });
    const vantar = planeraFamiljeregel({
      mappningar: [rad(1), rad(2)],
      grupper: grupper(hink(1, "Svart"), hink(2, "Vit", { betyg: undefined })),
      nu: NU,
    });
    expect(vantar).toMatchObject({ slaIhop: [], spuVantar: 1 });
  });

  it("☠️ en grupp med en oklar axel listas och raderas inte", () => {
    const mat = (n: number, m: string) => hink(n, "Svart", { spec: [["Färg", "Svart"], ["Material", m]], namn: `VEVOR Testhink ${m}` });
    const p = planeraFamiljeregel({ mappningar: [rad(1), rad(2)], grupper: grupper(mat(1, "Plast"), mat(2, "Stål")), nu: NU });
    expect(p.slaIhop).toEqual([]);
    expect(p.grans).toEqual([{ axel: "Material", antal: 1, wixIds: ["wix-1", "wix-2"] }]);
  });

  it("☠️ en artikel som länkar till syskon hör till en länkad familj, inte till gruppen", () => {
    const lankad = hink(2, "Vit", { syskon: [{ sku: sku(9), webbId: "000000000009", kanKopas: true }] });
    const p = planeraFamiljeregel({ mappningar: [rad(1), rad(2)], grupper: grupper(hink(1, "Svart"), lankad), nu: NU });
    expect(p).toMatchObject({ slaIhop: [], slaIhopFamiljer: 0 });
  });
});

describe("spuKandidater", () => {
  it("bara SPU:er med minst två artiklar utan länkar och ett ensamt utkast", () => {
    const r = (n: number, spu: string, over: Partial<Avlasning> = {}) => ({ sku: sku(n), spu, syskon: [], borta: false, ...over });
    const rader = [
      r(1, "A"),
      r(2, "A"),
      r(3, "B"),
      r(4, "B", { syskon: [{ sku: sku(3), webbId: "x", kanKopas: true }] }),
      r(5, "C"),
      r(6, "C", { borta: true }),
      r(7, "D"),
      r(8, "D"),
    ];
    // Utkast för 1, 3, 5 och en polerad rad för 7.
    const m = [rad(1), rad(3), rad(5), rad(7, { needsAiPolish: false })];
    expect(spuKandidater(rader, m)).toEqual(["A"]);
  });
});
