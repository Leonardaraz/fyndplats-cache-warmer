// Främjandet kräver att startpriset är varans pris i Wix just nu (2026-11-14).
// Fynden 12–14/11: 7 av 30 fick ett överstruket pris över dagen-före-priset,
// eftersom kön bar priser från före Aosoms ikappkörning.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { framjbar, type ProduktNu } from "./framjbar";
import { produktNu, variantPriser } from "./store";

const nu = (par: [string, number][]): ProduktNu => ({ finns: true, priser: new Map(par) });
const rad = (listPrice: number, spar?: [string, number][]) => ({
  listPrice,
  variantPrices: spar?.map(([wixVariantId, lp]) => ({ wixVariantId, listPrice: lp, floorPrice: lp - 100, ladder: [lp] })),
});

describe("framjbar", () => {
  it("lika pris per variant: främjas", () => {
    expect(framjbar(rad(1239, [["a", 1239]]), nu([["a", 1239]]))).toBe("ok");
    expect(framjbar(rad(499, [["a", 499], ["b", 549]]), nu([["a", 499], ["b", 549], ["c", 999]]))).toBe("ok");
  });

  it("☠️ priset har ändrats sedan seeden: står kvar i kön", () => {
    // Fynden 12–14/11: synken hade sänkt priset, raden bar det gamla.
    expect(framjbar(rad(1239, [["a", 1239]]), nu([["a", 1069]]))).toBe("pris_andrat");
    // Och åt andra hållet: synken hade höjt priset.
    expect(framjbar(rad(2579, [["a", 2579]]), nu([["a", 2759]]))).toBe("pris_andrat");
    // En variant av flera räcker.
    expect(framjbar(rad(499, [["a", 499], ["b", 549]]), nu([["a", 499], ["b", 529]]))).toBe("pris_andrat");
  });

  it("en spårad variant som inte finns kvar i Wix: står kvar i kön", () => {
    expect(framjbar(rad(499, [["a", 499], ["b", 549]]), nu([["a", 499]]))).toBe("pris_andrat");
  });

  it("en ospårad variant utan pris (0 kr) stoppar inte ett fynd vars spårade priser stämmer", () => {
    const priser = variantPriser([
      { id: "a", price: { actualPrice: { amount: "499" } } },
      { id: "gratis", price: { actualPrice: { amount: "0" } } },
    ]);
    expect(framjbar(rad(499, [["a", 499]]), { finns: true, priser })).toBe("ok");
    // Men en spårad variant som läses utan pris: står kvar i kön, utan att räknas som läsfel.
    const utanPris = variantPriser([
      { id: "a", price: { actualPrice: { amount: "0" } } },
      { id: "b", price: { actualPrice: { amount: "549" } } },
    ]);
    expect(framjbar(rad(499, [["a", 499], ["b", 549]]), { finns: true, priser: utanPris })).toBe("pris_andrat");
  });

  it("öre jämförs, inte strängar eller flyttal", () => {
    expect(framjbar(rad(1239, [["a", 1239]]), nu([["a", 1239.0]]))).toBe("ok");
    // 0,1 + 0,2 blir 0,30000000000000004 i flyttal: samma pris i öre.
    // (Literalen 99.90000000000001 är samma flyttal som 99.9 och prövade ingenting.)
    expect(framjbar(rad(300, [["a", 300]]), nu([["a", (0.1 + 0.2) * 1000]]))).toBe("ok");
    expect(framjbar(rad(300), nu([["v-x", (0.1 + 0.2) * 1000]]))).toBe("ok");
    expect(framjbar(rad(99.9, [["a", 99.9]]), nu([["a", 99.89]]))).toBe("pris_andrat");
  });

  it("raderad produkt: borta (raden slängs som förut)", () => {
    expect(framjbar(rad(1239, [["a", 1239]]), { finns: false })).toBe("borta");
  });

  it("priset gick inte att läsa: står kvar, raderas inte", () => {
    expect(framjbar(rad(1239, [["a", 1239]]), { finns: true, priser: null })).toBe("pris_okant");
    expect(framjbar(rad(1239, [["a", 1239]]), { finns: true, priser: new Map() })).toBe("pris_okant");
  });

  it("äldre rad utan spår: varje variant ska stå på listpriset", () => {
    expect(framjbar(rad(1000), nu([["x", 1000], ["y", 1000]]))).toBe("ok");
    expect(framjbar(rad(1000), nu([["x", 1000], ["y", 900]]))).toBe("pris_andrat");
  });
});

describe("variantPriser (V3-läsningen)", () => {
  it("läser actualPrice per variant, som text eller tal", () => {
    const m = variantPriser([
      { id: "a", price: { actualPrice: { amount: "1239" } } },
      { id: "b", price: { actualPrice: { amount: "1239.50" } } },
    ]);
    expect(m && [...m]).toEqual([["a", 1239], ["b", 1239.5]]);
  });

  it("en variant utan giltigt pris lämnas utanför; null bara när ingen variant har ett pris", () => {
    // En variant utan pris (0 kr, saknas) lämnas utanför; de andra läses.
    expect([...(variantPriser([{ id: "a", price: { actualPrice: { amount: "1239" } } }, { id: "b" }]) ?? [])]).toEqual([["a", 1239]]);
    expect([...(variantPriser([{ id: "a", price: { actualPrice: { amount: "0" } } }, { id: "b", price: { actualPrice: { amount: "549" } } }]) ?? [])]).toEqual([["b", 549]]);
    expect(variantPriser([{ id: "a", price: { actualPrice: { amount: "gratis" } } }])).toBeNull();
    expect(variantPriser([{ id: "a", price: { actualPrice: { amount: "0" } } }])).toBeNull();
    expect(variantPriser([])).toBeNull();
    expect(variantPriser(undefined)).toBeNull();
  });
});

describe("produktNu (en läsning per kandidat)", () => {
  const FORRA = { token: process.env.WIX_API_TOKEN, site: process.env.WIX_SITE_ID };
  beforeEach(() => {
    process.env.WIX_API_TOKEN = "t";
    process.env.WIX_SITE_ID = "s";
  });
  afterEach(() => {
    for (const [k, v] of [["WIX_API_TOKEN", FORRA.token], ["WIX_SITE_ID", FORRA.site]] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    vi.unstubAllGlobals();
  });
  const svara = (status: number, kropp: unknown) =>
    vi.stubGlobal("fetch", (async () => new Response(JSON.stringify(kropp), { status })) as typeof fetch);

  it("200 med priser: finns, med priset per variant", async () => {
    svara(200, { product: { variantsInfo: { variants: [{ id: "a", price: { actualPrice: { amount: "1239" } } }] } } });
    const r = await produktNu("p1");
    expect(r.finns && r.priser && [...r.priser]).toEqual([["a", 1239]]);
  });

  it("404: borta", async () => {
    svara(404, { message: "not found" });
    expect(await produktNu("p1")).toEqual({ finns: false });
  });

  it("☠️ 429, 5xx eller ett nätfel: finns, med okänt pris (aldrig borta)", async () => {
    svara(429, { message: "strypt" });
    expect(await produktNu("p1")).toEqual({ finns: true, priser: null });
    svara(503, { message: "nere" });
    expect(await produktNu("p1")).toEqual({ finns: true, priser: null });
    vi.stubGlobal("fetch", (async () => {
      throw new Error("ECONNRESET");
    }) as typeof fetch);
    expect(await produktNu("p1")).toEqual({ finns: true, priser: null });
  });
});

