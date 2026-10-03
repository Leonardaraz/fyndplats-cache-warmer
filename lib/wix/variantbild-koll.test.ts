import { describe, expect, it } from "vitest";
import type { WixAnrop } from "../polish/skrivplan";
import { korVariantbildKoll, listaKatalogen } from "./variantbild-koll";

type Obj = Record<string, unknown>;

const bild = (id: string) => ({ id });

/** En produkt med två färger, där den andra färgen står på huvudbilden om `fel`. */
function produkt(id: string, visible: boolean, fel: boolean): Obj {
  const v = (vid: string, choiceId: string, namn: string, media: string) => ({
    id: vid,
    visible: true,
    sku: `FP-${vid}`,
    choices: [{
      optionChoiceIds: { optionId: "o", choiceId },
      optionChoiceNames: { optionName: "Färg", choiceName: namn, renderType: "TEXT_CHOICES" },
    }],
    price: { actualPrice: { amount: "100" } },
    media: bild(media),
  });
  return {
    id,
    revision: "1",
    visible,
    name: id,
    slug: id,
    media: { main: bild(`${id}-svart`) },
    options: [{
      id: "o",
      name: "Färg",
      choicesSettings: {
        choices: [
          { choiceId: "c1", name: "Svart", linkedMedia: [bild(`${id}-svart`)] },
          { choiceId: "c2", name: "Blå", linkedMedia: [bild(`${id}-bla`)] },
        ],
      },
    }],
    variantsInfo: {
      variants: [v(`${id}-v1`, "c1", "Svart", `${id}-svart`), v(`${id}-v2`, "c2", "Blå", fel ? `${id}-svart` : `${id}-bla`)],
    },
  };
}

/** Katalogen i sidor om två, plus en GET per produkt. */
function fejkWix(produkter: Obj[], enVariant: string[] = [], over: { andraPrisPa?: string } = {}) {
  const katalog = [
    ...produkter.map((p) => ({ id: p.id, visible: p.visible, variantSummary: { variantCount: 2 } })),
    ...enVariant.map((id) => ({ id, visible: true, variantSummary: { variantCount: 1 } })),
  ];
  const anrop: { metod: string; sokvag: string; kropp?: unknown }[] = [];
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    anrop.push({ metod, sokvag, kropp });
    if (metod === "POST" && sokvag === "/stores/v3/products/query") {
      const paging = ((kropp as Obj).query as Obj).cursorPaging as { cursor?: string };
      const fran = Number(paging.cursor ?? 0);
      const sida = katalog.slice(fran, fran + 2);
      const nasta = fran + 2 < katalog.length ? String(fran + 2) : undefined;
      return { products: sida, pagingMetadata: { cursors: nasta ? { next: nasta } : {}, hasNext: !!nasta } };
    }
    const id = decodeURIComponent(sokvag.split("?")[0].split("/").pop()!);
    const p = produkter.find((x) => x.id === id);
    if (metod === "GET") return { product: structuredClone(p) };
    if (metod === "POST" && sokvag === "/stores/v3/inventory-items/query") return { inventoryItems: [] };
    if (metod === "PATCH" && p) {
      const k = (kropp as { product: Obj }).product;
      const vs = (p.variantsInfo as { variants: Obj[] }).variants;
      for (const v of vs) v.media = bild(`${id}-${v === vs[0] ? "svart" : "bla"}`);
      if (over.andraPrisPa === id) vs[0].price = { actualPrice: { amount: "1" } };
      p.revision = String(Number(k.revision) + 1);
      return { product: structuredClone(p) };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, anrop };
}

const vanta = async () => {};
const langt = () => Date.now() + 60_000;

describe("listaKatalogen", () => {
  it("går igenom alla sidor, utkast med", async () => {
    const w = fejkWix([produkt("a", true, false), produkt("b", false, true), produkt("c", true, true)], ["d"]);
    const lista = await listaKatalogen(w.wix, vanta);
    expect(lista.map((p) => [p.id, p.visible, p.varianter])).toEqual([
      ["a", true, 2], ["b", false, 2], ["c", true, 2], ["d", true, 1],
    ]);
  });

  it("☠️ ett fel mitt i svepet kastar, aldrig en halv lista", async () => {
    let n = 0;
    const wix: WixAnrop = async () => {
      if (++n > 1) throw new Error("Wix 400: INVALID_CURSOR");
      return { products: [{ id: "a", variantSummary: { variantCount: 2 } }], pagingMetadata: { cursors: { next: "x" }, hasNext: true } };
    };
    await expect(listaKatalogen(wix, vanta)).rejects.toThrow(/sida 1/);
  });
});

describe("den dagliga kollen", () => {
  it("torrt: listar publicerade och utkast med fel bild, skriver ingenting", async () => {
    const w = fejkWix([produkt("a", true, false), produkt("b", false, true), produkt("c", true, true)], ["d"]);
    const r = await korVariantbildKoll(w.wix, { deadline: langt(), vanta });
    expect(r.torr).toBe(true);
    expect(r.katalogen).toBe(4);
    expect(r.flervariant).toBe(3);
    expect(r.kontrollerade).toBe(3);
    expect(r.fullstandig).toBe(true);
    expect(r.medFelBild).toEqual({ publicerade: 1, utkast: 1, varianter: 2 });
    expect(r.produkter.map((p) => [p.id, p.status, p.exempel])).toEqual([["b", "torr", ["Blå"]], ["c", "torr", ["Blå"]]]);
    expect(w.anrop.some((a) => a.metod === "PATCH")).toBe(false);
    // Enkelvariantsprodukten läses aldrig.
    expect(w.anrop.some((a) => a.sokvag.includes("/products/d"))).toBe(false);
  });

  it("skarpt: rättar publicerade och utkast, och rör inte dem som redan är rätt", async () => {
    const w = fejkWix([produkt("a", true, false), produkt("b", false, true), produkt("c", true, true)]);
    const r = await korVariantbildKoll(w.wix, { torr: false, deadline: langt(), vanta });
    expect(r.summa).toEqual({ ratt: 1, rattad: 2 });
    expect(r.fullstandig).toBe(true);
    expect(w.anrop.filter((a) => a.metod === "PATCH").map((a) => a.sokvag)).toEqual([
      "/stores/v3/products-with-inventory/b",
      "/stores/v3/products-with-inventory/c",
    ]);
  });

  it("skarpt med `utkast: false`: utkasten listas men skrivs inte", async () => {
    const w = fejkWix([produkt("b", false, true), produkt("c", true, true)]);
    const r = await korVariantbildKoll(w.wix, { torr: false, utkast: false, deadline: langt(), vanta });
    expect(r.summa).toEqual({ utkast_hoppat: 1, rattad: 1 });
  });

  it("☠️ skarpt: en avvikelse stoppar körningen, och nästa produkt rörs inte", async () => {
    const w = fejkWix([produkt("c", true, true), produkt("e", true, true)], [], { andraPrisPa: "c" });
    const r = await korVariantbildKoll(w.wix, { torr: false, deadline: langt(), vanta });
    expect(r.stoppad).toBe(true);
    expect(r.fullstandig).toBe(false);
    expect(r.summa).toEqual({ avvikelse: 1, torr: 1 });
    expect(w.anrop.filter((a) => a.metod === "PATCH")).toHaveLength(1);
    expect(r.produkter.find((p) => p.id === "e")!.status).toBe("torr");
  });

  it("tidsbudgeten: ofullständig, med var nästa körning ska börja", async () => {
    const w = fejkWix([produkt("a", true, false), produkt("c", true, true)]);
    const r = await korVariantbildKoll(w.wix, { deadline: Date.now() - 1, vanta });
    expect(r.kontrollerade).toBe(0);
    expect(r.nasta).toBe(0);
    expect(r.fullstandig).toBe(false);

    const fortsatt = await korVariantbildKoll(w.wix, { start: 1, deadline: langt(), vanta });
    expect(fortsatt.kontrollerade).toBe(1);
    expect(fortsatt.produkter.map((p) => p.id)).toEqual(["c"]);
    expect(fortsatt.nasta).toBeNull();
  });

  it("provet: bara de angivna produkterna, utan katalogsvep", async () => {
    const w = fejkWix([produkt("b", false, true)]);
    const r = await korVariantbildKoll(w.wix, { ids: ["b"], torr: false, utkast: true, deadline: langt(), vanta });
    expect(r.summa).toEqual({ rattad: 1 });
    expect(w.anrop.some((a) => a.sokvag === "/stores/v3/products/query")).toBe(false);
  });
});
