import { describe, expect, it } from "vitest";
import {
  KOPPLA_PER_ANROP,
  idPerNamn,
  kopplaTillKategori,
  lasKategoritradet,
  produkterIKategori,
  taBortFranKategori,
  type Anrop,
} from "./kategoritrad";

type Kropp = Record<string, unknown>;

describe("lasKategoritradet", () => {
  it("☠️ ber om de dolda kategorierna och läser alla sidor med markör", async () => {
    const kroppar: Kropp[] = [];
    const wix: Anrop = async (_m, _s, kropp) => {
      kroppar.push(kropp as Kropp);
      const markor = ((kropp as Kropp).query as Kropp).cursorPaging as Kropp;
      if (!markor.cursor) {
        return { categories: [{ id: "a", name: "Hem", visible: true }], pagingMetadata: { cursors: { next: "n1" } } };
      }
      return { categories: [{ id: "b", name: "Mattor", visible: false, parentCategory: { id: "a" } }], pagingMetadata: {} };
    };
    const trad = await lasKategoritradet(wix);
    expect(trad).toEqual([
      { id: "a", namn: "Hem", foralder: null, synlig: true },
      { id: "b", namn: "Mattor", foralder: "a", synlig: false },
    ]);
    expect(kroppar.every((k) => k.returnNonVisibleCategories === true)).toBe(true);
    expect(((kroppar[1].query as Kropp).cursorPaging as Kropp).cursor).toBe("n1");
  });

  it("☠️ ett träd som aldrig tar slut kastar i stället för att kapas", async () => {
    let i = 0;
    const wix: Anrop = async () => ({ categories: [{ id: String(i++), name: `K${i}` }], pagingMetadata: { cursors: { next: "igen" } } });
    await expect(lasKategoritradet(wix)).rejects.toThrow(/tog inte slut/);
  });

  it("ett namn som finns två gånger ger null", () => {
    const m = idPerNamn([
      { id: "1", namn: "Pumpar", foralder: "x", synlig: false },
      { id: "2", namn: "Pumpar", foralder: "y", synlig: true },
      { id: "3", namn: "Mattor", foralder: "x", synlig: false },
    ]);
    expect(m.get("Pumpar")).toBeNull();
    expect(m.get("Mattor")).toBe("3");
  });
});

describe("kopplaTillKategori", () => {
  it("tolkar svaret per produkt: lyckad, redan kopplad, fel och saknad rad", async () => {
    const wix: Anrop = async () => ({
      results: [
        { itemMetadata: { item: { catalogItemId: "p1" }, success: true } },
        { itemMetadata: { originalIndex: 1, success: false, error: { code: "ALREADY_EXISTS" } } },
        { itemMetadata: { item: { catalogItemId: "p3" }, success: false, error: { code: "NOT_FOUND" } } },
      ],
      bulkActionMetadata: { totalSuccesses: 1, totalFailures: 2, undetailedFailures: 0 },
    });
    const u = await kopplaTillKategori(wix, "kat", ["p1", "p2", "p3", "p4"]);
    expect(u.get("p1")).toBe("ok");
    expect(u.get("p2")).toBe("redan");
    expect(u.get("p3")).toMatchObject({ fel: expect.stringContaining("NOT_FOUND") });
    expect(u.get("p4")).toEqual({ fel: "inget utfall för produkten" });
  });

  it("☠️ undetailedFailures gör hela anropet till fel, och ett kastat anrop fäller bara sin tugga", async () => {
    let n = 0;
    const wix: Anrop = async (_m, _s, kropp) => {
      n++;
      const items = (kropp as Kropp).items as { catalogItemId: string }[];
      if (n === 1) throw new Error("Wix 503");
      return {
        results: items.map((it) => ({ itemMetadata: { item: { catalogItemId: it.catalogItemId }, success: true } })),
        bulkActionMetadata: { undetailedFailures: n === 2 ? 1 : 0 },
      };
    };
    const pids = Array.from({ length: KOPPLA_PER_ANROP * 2 + 1 }, (_, i) => `p${i}`);
    const u = await kopplaTillKategori(wix, "kat", pids);
    expect(n).toBe(3);
    expect(u.get("p0")).toMatchObject({ fel: expect.stringContaining("503") });
    expect(u.get(`p${KOPPLA_PER_ANROP}`)).toMatchObject({ fel: expect.stringContaining("undetailedFailures") });
    expect(u.get(`p${KOPPLA_PER_ANROP * 2}`)).toBe("ok");
  });
});

describe("produkterIKategori", () => {
  it("läser alla sidor", async () => {
    const wix: Anrop = async (_m, sokvag, kropp) => {
      expect(sokvag).toBe("/categories/v1/categories/kat/list-items");
      const c = ((kropp as Kropp).cursorPaging as Kropp).cursor;
      return c
        ? { items: [{ catalogItemId: "p2" }], pagingMetadata: {} }
        : { items: [{ catalogItemId: "p1" }], pagingMetadata: { cursors: { next: "n" } } };
    };
    expect([...(await produkterIKategori(wix, "kat"))]).toEqual(["p1", "p2"]);
  });
});

describe("taBortFranKategori", () => {
  it("skickar remove-items med Wix Stores app-id och trädet, och tolkar svaret per produkt", async () => {
    const anrop: Array<{ metod: string; sokvag: string; kropp: Kropp }> = [];
    const wix: Anrop = async (metod, sokvag, kropp) => {
      anrop.push({ metod, sokvag, kropp: kropp as Kropp });
      return {
        results: [
          { itemMetadata: { item: { catalogItemId: "p1" }, success: true } },
          // id saknas i raden: härleds ur originalIndex mot det som skickades
          { itemMetadata: { originalIndex: 1, success: false, error: { code: "NOT_FOUND" } } },
        ],
        bulkActionMetadata: { totalSuccesses: 1, totalFailures: 1, undetailedFailures: 0 },
      };
    };
    const u = await taBortFranKategori(wix, "kat/1", ["p1", "p2", "p3"]);
    expect(anrop).toHaveLength(1);
    expect(anrop[0].metod).toBe("POST");
    // Id:t kodas i sökvägen, som i add-items.
    expect(anrop[0].sokvag).toBe("/categories/v1/bulk/categories/kat%2F1/remove-items");
    expect(anrop[0].kropp.treeReference).toEqual({ appNamespace: "@wix/stores" });
    expect(anrop[0].kropp.items).toEqual([
      { catalogItemId: "p1", appId: "215238eb-22a5-4c36-9e7b-e7c08025e04e" },
      { catalogItemId: "p2", appId: "215238eb-22a5-4c36-9e7b-e7c08025e04e" },
      { catalogItemId: "p3", appId: "215238eb-22a5-4c36-9e7b-e7c08025e04e" },
    ]);
    expect(u.get("p1")).toBe("ok");
    expect(u.get("p2")).toEqual({ fel: expect.stringContaining("NOT_FOUND") });
    // En produkt Wix inte nämner är inte borttagen.
    expect(u.get("p3")).toEqual({ fel: "inget utfall för produkten" });
  });

  it("undetailedFailures gör hela anropet oadresserbart: alla produkter får ett fel", async () => {
    const wix: Anrop = async () => ({
      results: [],
      bulkActionMetadata: { totalSuccesses: 0, totalFailures: 2, undetailedFailures: 2 },
    });
    const u = await taBortFranKategori(wix, "kat", ["p1", "p2"]);
    expect([...u.values()].every((x) => x !== "ok" && x.fel.includes("undetailedFailures"))).toBe(true);
  });

  it("ett kast i anropet blir ett fel per produkt, inte ett kast", async () => {
    const wix: Anrop = async () => {
      throw new Error("Wix 403: MANAGED_CATEGORY_OPERATION_NOT_ALLOWED");
    };
    const u = await taBortFranKategori(wix, "kat", ["p1"]);
    expect(u.get("p1")).toEqual({ fel: expect.stringContaining("MANAGED_CATEGORY") });
  });

  it("delar upp i anrop om högst 100 produkter", async () => {
    let anrop = 0;
    const wix: Anrop = async (_m, _s, kropp) => {
      anrop++;
      const items = (kropp as { items: Array<{ catalogItemId: string }> }).items;
      return {
        results: items.map((it, i) => ({ itemMetadata: { item: { catalogItemId: it.catalogItemId }, originalIndex: i, success: true } })),
      };
    };
    const ids = Array.from({ length: KOPPLA_PER_ANROP + 1 }, (_, i) => `p${i}`);
    const u = await taBortFranKategori(wix, "kat", ids);
    expect(anrop).toBe(2);
    expect(u.size).toBe(ids.length);
  });
});
