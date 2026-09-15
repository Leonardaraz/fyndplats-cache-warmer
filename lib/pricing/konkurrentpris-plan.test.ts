import { describe, it, expect } from "vitest";
import {
  UPPFRISKNING_DAGAR,
  konkurrentStatus,
  planeraLotta,
  planeraSpara,
} from "./konkurrentpris-plan";
import { KONKURRENT_MAX_ALDER_DAGAR } from "./konkurrentregel";
import type { DerasRad } from "./dealproffsen";
import type { ProductMappingRecord } from "../store";
import type { WixProduktPris } from "../wix/v3-products";

const NU = Date.parse("2026-09-15T12:00:00Z");
const dagarSedan = (d: number) => new Date(NU - d * 86_400_000).toISOString();

function mappning(nr: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplierProductId: `aosom:${nr}`,
    supplier: "aosom",
    wixProductId: `wix-${nr}`,
    variants: [],
    ...over,
  };
}

function deras(...rader: Array<[string, number]>): Map<string, DerasRad> {
  const m = new Map<string, DerasRad>();
  for (const [reference, prisSek] of rader) {
    m.set(reference, { reference, prisSek, ordinariePrisSek: null, ean: null });
  }
  return m;
}

const TACKTA = new Set(["845-", "700-"]);

describe("planeraSpara", () => {
  it("sparar ett nytt konkurrentpris på en rad med träff", () => {
    const p = planeraSpara([mappning("845-030CG")], deras(["845-030CG", 2495]), TACKTA, NU);
    expect(p.attSpara).toHaveLength(1);
    expect(p.attSpara[0].pris).toBe(2495);
    expect(p.attSpara[0].fran).toBeNull();
  });

  it("☠️ ett uteblivet fynd sparar INGENTING och raderar INGENTING", () => {
    // De säljer den inte i dag. Raden behåller sitt gamla pris och får åldras —
    // synken fryser den efter sju dagar och säger till.
    const gammal = { pris: 2495, hamtad: dagarSedan(1) };
    const p = planeraSpara([mappning("845-030CG", { konkurrent: gammal })], deras(), TACKTA, NU);
    expect(p.attSpara).toHaveLength(0);
    expect(p.utanTraff).toBe(1);
  });

  it("☠️ ett prefix som inte hämtades räknas som 'utanför omgången', inte som 'utan träff'", () => {
    // Samma fel som i jämförelsen: "vi har inte frågat än" får inte se ut som
    // "de säljer den inte".
    const p = planeraSpara([mappning("921-672V00BG")], deras(), TACKTA, NU);
    expect(p.utanforOmgangen).toBe(1);
    expect(p.utanTraff).toBe(0);
  });

  it("samma pris med färsk stämpel rörs inte; samma pris med gammal stämpel friskas upp", () => {
    const farsk = mappning("845-1", { konkurrent: { pris: 2495, hamtad: dagarSedan(UPPFRISKNING_DAGAR - 1) } });
    const gammal = mappning("845-2", { konkurrent: { pris: 2495, hamtad: dagarSedan(UPPFRISKNING_DAGAR + 1) } });
    const p = planeraSpara([farsk, gammal], deras(["845-1", 2495], ["845-2", 2495]), TACKTA, NU);
    expect(p.oforandrade).toBe(1);
    expect(p.attSpara.map((r) => r.m.wixProductId)).toEqual(["wix-845-2"]);
  });

  it("ett ändrat pris sparas direkt, oavsett stämpel", () => {
    const m = mappning("845-1", { konkurrent: { pris: 2495, hamtad: dagarSedan(0) } });
    const p = planeraSpara([m], deras(["845-1", 2295]), TACKTA, NU);
    expect(p.attSpara).toEqual([{ m, pris: 2295, fran: 2495 }]);
  });

  it("AliExpress-rader och rader utan artikelnummer räknas för sig", () => {
    const ae = mappning("x", { supplier: "aliexpress", supplierProductId: "123" });
    const tom = mappning("", { supplierProductId: "aosom:" });
    const p = planeraSpara([ae, tom], deras(), TACKTA, NU);
    expect(p.ejAosom).toBe(1);
    expect(p.utanArtikelnummer).toBe(1);
  });

  it("ett nollpris hos dem är ingen träff", () => {
    const p = planeraSpara([mappning("845-1")], deras(["845-1", 0]), TACKTA, NU);
    expect(p.attSpara).toHaveLength(0);
    expect(p.utanTraff).toBe(1);
  });
});

describe("planeraLotta", () => {
  const pris = (rader: Record<string, number | null>) => {
    const m = new Map<string, WixProduktPris>();
    for (const [id, p] of Object.entries(rader)) m.set(id, { priceSek: p, variantCount: p === null ? 2 : 1 });
    return m;
  };
  const konk = { pris: 3495, hamtad: dagarSedan(0) };

  it("lottar publicerade Aosom-rader med konkurrentpris och utan grupp", () => {
    const p = planeraLotta(
      [mappning("845-1", { konkurrent: konk })],
      pris({ "wix-845-1": 2999 }),
      new Set(["wix-845-1"]),
    );
    expect(p.attLotta).toHaveLength(1);
    expect(["A", "B"]).toContain(p.attLotta[0].grupp);
    expect(p.perGrupp.A + p.perGrupp.B).toBe(1);
  });

  it("☠️ en rad som redan har grupp rörs inte — ingen byter grupp mitt i testet", () => {
    const p = planeraLotta(
      [mappning("845-1", { konkurrent: konk, prisgrupp: "B" })],
      pris({ "wix-845-1": 2999 }),
      new Set(["wix-845-1"]),
    );
    expect(p.attLotta).toHaveLength(0);
    expect(p.redanLottade).toBe(1);
  });

  it("utkast, rader utan konkurrentpris och tvetydiga butikspriser lottas aldrig", () => {
    const p = planeraLotta(
      [
        mappning("845-1", { konkurrent: konk }), // ej publicerad
        mappning("845-2"), // utan konkurrentpris
        mappning("845-3", { konkurrent: konk }), // flera varianter → inget entydigt pris
      ],
      pris({ "wix-845-1": 2999, "wix-845-3": null }),
      new Set(["wix-845-3"]),
    );
    expect(p.attLotta).toHaveLength(0);
    expect(p.ejPublicerade).toBe(1);
    expect(p.utanKonkurrent).toBe(1);
    expect(p.utanVartPris).toBe(1);
  });

  it("`bara` begränsar lottningen till urvalet", () => {
    const p = planeraLotta(
      [mappning("845-1", { konkurrent: konk }), mappning("845-2", { konkurrent: konk })],
      pris({ "wix-845-1": 2999, "wix-845-2": 2999 }),
      new Set(["wix-845-1", "wix-845-2"]),
      new Set(["wix-845-2"]),
    );
    expect(p.attLotta.map((r) => r.m.wixProductId)).toEqual(["wix-845-2"]);
  });

  it("under 2 000 kr blir det alltid grupp A", () => {
    const p = planeraLotta(
      [mappning("845-1", { konkurrent: konk })],
      pris({ "wix-845-1": 1499 }),
      new Set(["wix-845-1"]),
    );
    expect(p.attLotta[0].grupp).toBe("A");
  });
});

describe("konkurrentStatus", () => {
  it("skiljer färska från gamla och räknar grupper", () => {
    const s = konkurrentStatus(
      [
        mappning("845-1", { konkurrent: { pris: 1, hamtad: dagarSedan(1) }, prisgrupp: "A" }),
        mappning("845-2", { konkurrent: { pris: 1, hamtad: dagarSedan(KONKURRENT_MAX_ALDER_DAGAR + 2) }, prisgrupp: "B" }),
        mappning("845-3", { prisgrupp: "A" }),
        mappning("845-4"),
        mappning("x", { supplier: "aliexpress", supplierProductId: "123" }),
      ],
      NU,
    );
    expect(s.aosomRader).toBe(4);
    expect(s.medKonkurrentpris).toBe(2);
    expect(s.farska).toBe(1);
    expect(s.gamla).toBe(1);
    expect(s.medGrupp).toEqual({ A: 2, B: 1 });
    expect(s.gruppUtanPris).toBe(1);
    expect(s.aldstaDagar).toBe(KONKURRENT_MAX_ALDER_DAGAR + 2);
  });
});
