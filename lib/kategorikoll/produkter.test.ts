import { describe, expect, it } from "vitest";
import type { WixAnrop } from "@/lib/polish/skrivplan";
import { lasSynligaProdukter, sidfraga } from "./produkter";

type Obj = Record<string, unknown>;

const produkt = (id: string, kat: string[], status = "IN_STOCK", visible = true): Obj => ({
  id,
  name: `namn-${id}`,
  visible,
  directCategoriesInfo: { categories: kat.map((k) => ({ id: k })) },
  inventory: { availabilityStatus: status },
});

/**
 * En falsk Wix som beter sig som den riktiga på det som fällde kollen: ett
 * filter som följer med markören ger 400 INVALID_CURSOR. Sidorna lämnas ut i
 * ordning, och varje anrop sparas.
 */
function falskWix(sidor: Obj[][]): { wix: WixAnrop; anrop: Obj[] } {
  const anrop: Obj[] = [];
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    expect(metod).toBe("POST");
    expect(sokvag).toBe("/stores/v3/products/query");
    const k = kropp as Obj;
    anrop.push(k);
    const q = (k.query ?? {}) as Obj;
    const cursor = ((q.cursorPaging ?? {}) as Obj).cursor;
    if (cursor !== undefined && (q.filter !== undefined || q.sort !== undefined)) {
      throw new Error('Wix 400: {"message":"INVALID_CURSOR"}');
    }
    const i = cursor === undefined ? 0 : Number(String(cursor).replace("m", ""));
    const nasta = i + 1 < sidor.length ? `m${i + 1}` : undefined;
    return { products: sidor[i] ?? [], pagingMetadata: { cursors: nasta ? { next: nasta } : {} } };
  };
  return { wix, anrop };
}

describe("kategorikollens läsning av katalogen", () => {
  it("skickar filtret bara på första sidan och fields på varje sida", () => {
    expect(sidfraga(undefined)).toEqual({
      fields: ["DIRECT_CATEGORIES_INFO"],
      query: { filter: { visible: true }, cursorPaging: { limit: 100 } },
    });
    expect(sidfraga("m1")).toEqual({
      fields: ["DIRECT_CATEGORIES_INFO"],
      query: { cursorPaging: { limit: 100, cursor: "m1" } },
    });
  });

  it("läser alla sidor till slutet utan INVALID_CURSOR", async () => {
    const { wix, anrop } = falskWix([
      [produkt("a", ["k1"]), produkt("b", ["k1", "k2"], "OUT_OF_STOCK")],
      [produkt("c", [])],
      [produkt("d", ["k3"])],
    ]);
    const ut = await lasSynligaProdukter(wix);
    expect(ut.map((p) => p.id)).toEqual(["a", "b", "c", "d"]);
    expect(ut[1]).toEqual({ id: "b", namn: "namn-b", kat: ["k1", "k2"], iLager: false });
    expect(anrop).toHaveLength(3);
    expect(((anrop[0].query as Obj).filter as Obj).visible).toBe(true);
    for (const a of anrop.slice(1)) expect((a.query as Obj).filter).toBeUndefined();
    for (const a of anrop) expect(a.fields).toEqual(["DIRECT_CATEGORIES_INFO"]);
  });

  it("hoppar över dolda rader och rader utan id eller namn", async () => {
    const { wix } = falskWix([[produkt("a", []), produkt("dold", [], "IN_STOCK", false), { id: "utan-namn" }, { name: "utan-id" }]]);
    expect((await lasSynligaProdukter(wix)).map((p) => p.id)).toEqual(["a"]);
  });

  it("slutar på en tom sida även om en markör följer med", async () => {
    let n = 0;
    const wix: WixAnrop = async () => {
      n++;
      return n === 1
        ? { products: [produkt("a", [])], pagingMetadata: { cursors: { next: "m1" } } }
        : { products: [], pagingMetadata: { cursors: { next: "m2" } } };
    };
    expect((await lasSynligaProdukter(wix)).map((p) => p.id)).toEqual(["a"]);
    expect(n).toBe(2);
  });

  it("kastar i stället för att kapa när katalogen inte tar slut", async () => {
    const wix: WixAnrop = async () => ({ products: [produkt("x", [])], pagingMetadata: { cursors: { next: "m1" } } });
    await expect(lasSynligaProdukter(wix, 3)).rejects.toThrow("tog inte slut efter 3 sidor");
  });

  it("läser svaret också när Wix lägger det under data", async () => {
    const wix: WixAnrop = async () => ({ data: { products: [produkt("a", ["k"])], pagingMetadata: {} } });
    expect(await lasSynligaProdukter(wix)).toEqual([{ id: "a", namn: "namn-a", kat: ["k"], iLager: true }]);
  });
});
