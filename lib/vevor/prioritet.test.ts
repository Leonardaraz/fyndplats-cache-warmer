import { describe, expect, it } from "vitest";
import { INTERVALL_MS, klassbyten, medKlass, onskadeKlasser } from "./prioritet";
import type { Sidrad } from "./lager";

const NU = Date.parse("2026-10-29T12:00:00.000Z");
const iso = (ms: number) => new Date(ms).toISOString();

function sida(over: Partial<Sidrad> = {}): Sidrad {
  return {
    webbId: "000000000001",
    sokvag: "/t-c_1/t-p_000000000001",
    klass: "utkast",
    nastaLasning: iso(NU + 20 * 3_600_000),
    sku: "TESTSKUA",
    senastForsokAt: iso(NU - 4 * 3_600_000),
    senastUtfall: "ok",
    senastOkAt: iso(NU - 4 * 3_600_000),
    iKartan: true,
    saknadIKartanSedan: null,
    saknasForstaAt: null,
    borta: false,
    ...over,
  };
}

describe("onskadeKlasser", () => {
  const u = {
    produkter: [
      { wixProductId: "w1", sku: "A", publicerad: true },
      { wixProductId: "w2", sku: "B", publicerad: true },
      { wixProductId: "w3", sku: "C", publicerad: false },
      { wixProductId: "w4", sku: "D", publicerad: false },
      { wixProductId: "w5", sku: "E", publicerad: false },
    ],
    obestallda: new Set(["w4"]),
    iAuktion: new Set(["w5"]),
  };
  const saldo = (sku: string) => ({ A: 50, B: 3, C: 1 })[sku] ?? null;

  it("publicerade var fjärde timme, lågt lager, obeställda ordrar och auktioner varje timme", () => {
    expect(Object.fromEntries(onskadeKlasser(u, saldo))).toEqual({ A: "publicerad", B: "het", D: "het", E: "het" });
  });

  it("lågt lager på ett utkast gör det inte hett — det går inte att köpa", () => {
    expect(onskadeKlasser(u, saldo).has("C")).toBe(false);
  });
});

describe("medKlass", () => {
  it("ett kortare intervall flyttar nästa läsning fram, räknat från förra lyckade", () => {
    const r = medKlass(sida(), "het", NU);
    // Förra lyckade läsningen var för fyra timmar sedan: en timme har gått, läs nu.
    expect(r.nastaLasning).toBe(iso(NU));
    expect(r.klass).toBe("het");
    const p = medKlass(sida({ senastOkAt: iso(NU - 3_600_000) }), "publicerad", NU);
    expect(p.nastaLasning).toBe(iso(NU - 3_600_000 + INTERVALL_MS.publicerad));
  });

  it("en aldrig läst sida står redan först och rörs inte", () => {
    const k = sida({ klass: "katalog", nastaLasning: iso(NU - 1000) });
    expect(medKlass(k, "het", NU)).toBe(k);
  });
});

describe("klassbyten", () => {
  it("uppgraderar de önskade, nedgraderar de som inte längre är önskade, rör inte resten", () => {
    const onskad = new Map<string, "het" | "publicerad">([["A", "het"]]);
    const a = sida({ webbId: "1", sku: "A" });
    const b = sida({ webbId: "2", sku: "B", klass: "publicerad" });
    const byten = klassbyten(onskad, [a], [b], NU);
    expect(byten.map((r) => [r.webbId, r.klass])).toEqual([
      ["1", "het"],
      ["2", "utkast"],
    ]);
  });

  it("en sida som är borta får ingen ny klass", () => {
    const onskad = new Map<string, "het" | "publicerad">([["A", "het"]]);
    expect(klassbyten(onskad, [sida({ sku: "A", borta: true })], [], NU)).toEqual([]);
  });
});
