import { describe, it, expect } from "vitest";
import {
  aosomArtikelbild,
  aosomArtiklarPaRaden,
  aosomArtikelForTask,
  NIL_VARIANT_ID,
} from "./artiklar";
import type { ProductMappingRecord } from "../store";

// Syntetiska artikelnummer. Riktiga får aldrig stå i en testfil — repot är publikt.
type Variant = ProductMappingRecord["variants"][number];

function variant(artikel: string, over: Partial<Variant> = {}): Variant {
  return {
    supplierVariantId: artikel,
    sku: `FP-${artikel}`,
    wixVariantId: `wixvar-${artikel}`,
    choices: {},
    costUsd: 10,
    landedCostSek: 105,
    grossSek: 129,
    ...over,
  };
}

function rad(artikel: string, varianter: Variant[]): Pick<ProductMappingRecord, "supplierProductId" | "variants"> {
  return { supplierProductId: `aosom:${artikel}`, variants: varianter };
}

/** En färgsammanslagen sida: svart (radens artikel) och grå (utkastets). */
function sammanslagen() {
  return rad("A-1", [
    variant("A-1", { choices: { Färg: "Svart" } }),
    variant("B-2", { choices: { Färg: "Grå" } }),
  ]);
}

describe("aosomArtikelbild", () => {
  it("en vanlig enkelvariantsrad är EN artikel — exakt som före sammanslagningen", () => {
    expect(aosomArtikelbild(rad("A-1", [variant("A-1")]))).toEqual({ typ: "en", artikel: "A-1" });
  });

  it("flera varianter med SAMMA artikel är fortfarande en vanlig rad", () => {
    const m = rad("A-1", [variant("A-1", { wixVariantId: "v1" }), variant("A-1", { wixVariantId: "v2" })]);
    expect(aosomArtikelbild(m)).toEqual({ typ: "en", artikel: "A-1" });
  });

  it("en rad utan varianter faller tillbaka på radens artikel", () => {
    expect(aosomArtikelbild(rad("A-1", []))).toEqual({ typ: "en", artikel: "A-1" });
  });

  it("två olika artiklar med var sitt variant-id blir en flerartikelrad", () => {
    const bild = aosomArtikelbild(sammanslagen());
    expect(bild.typ).toBe("flera");
    if (bild.typ !== "flera") return;
    expect(bild.artikel).toBe("A-1");
    expect(bild.varianter.map((v) => [v.index, v.artikel, v.wixVariantId])).toEqual([
      [0, "A-1", "wixvar-A-1"],
      [1, "B-2", "wixvar-B-2"],
    ]);
  });

  it.each([
    ["en variant saknar artikelnummer", [variant("A-1"), variant("B-2"), variant("", { wixVariantId: "v3" })]],
    ["två varianter bär samma artikelnummer", [variant("A-1"), variant("B-2"), variant("B-2", { wixVariantId: "v3" })]],
    ["en variant saknar Wix-variant-id", [variant("A-1"), variant("B-2", { wixVariantId: undefined })]],
    ["två varianter bär samma Wix-variant-id", [variant("A-1"), variant("B-2", { wixVariantId: "wixvar-A-1" })]],
  ])("tvetydig: %s", (skal, varianter) => {
    expect(aosomArtikelbild(rad("A-1", varianter))).toEqual({ typ: "tvetydig", artikel: "A-1", skal });
  });

  it("tvetydig när radens artikel inte finns bland varianterna", () => {
    const bild = aosomArtikelbild(rad("C-3", [variant("A-1"), variant("B-2")]));
    expect(bild).toEqual({
      typ: "tvetydig",
      artikel: "C-3",
      skal: "radens artikelnummer finns inte bland varianterna",
    });
  });

  it("☠️ ett skäl bär aldrig ett artikelnummer — skälen hamnar i publika loggar", () => {
    const fall = [
      rad("A-1", [variant("A-1"), variant("B-2"), variant("", { wixVariantId: "v3" })]),
      rad("A-1", [variant("A-1"), variant("B-2", { wixVariantId: undefined })]),
      rad("C-3", [variant("A-1"), variant("B-2")]),
    ];
    for (const m of fall) {
      const bild = aosomArtikelbild(m);
      expect(bild.typ).toBe("tvetydig");
      if (bild.typ !== "tvetydig") continue;
      for (const nummer of ["A-1", "B-2", "C-3"]) expect(bild.skal).not.toContain(nummer);
    }
  });
});

describe("aosomArtiklarPaRaden", () => {
  it("en vanlig rad bär bara sin egen artikel", () => {
    expect(aosomArtiklarPaRaden(rad("A-1", [variant("A-1")]))).toEqual(["A-1"]);
  });

  it("en sammanslagen sida bär båda — annars importeras den andra färgen igen", () => {
    expect(aosomArtiklarPaRaden(sammanslagen()).sort()).toEqual(["A-1", "B-2"]);
  });

  it("en tvetydig rad bär ALLA sina artiklar — hellre en utebliven import än ett dubbelutkast", () => {
    const m = rad("A-1", [variant("A-1"), variant("B-2", { wixVariantId: undefined })]);
    expect(aosomArtiklarPaRaden(m).sort()).toEqual(["A-1", "B-2"]);
  });

  it("en AE-rad bär inga Aosom-artiklar", () => {
    expect(aosomArtiklarPaRaden({ supplierProductId: "1005001", variants: [variant("123")] })).toEqual([]);
  });
});

describe("aosomArtikelForTask", () => {
  const task = (over: { wixVariantId?: string; sku?: string; variantChoices?: Record<string, string> } = {}) => ({
    variantChoices: {},
    ...over,
  });

  describe("vanlig rad", () => {
    const m = rad("A-1", [variant("A-1")]);

    it("beställer radens artikel, som förut", () => {
      expect(aosomArtikelForTask(task({ sku: "FP-A-1" }), m)).toEqual({ artikel: "A-1" });
    });

    it("nollan är en enkelvariantsprodukts variant-id på orderraden — den beställs som vanligt", () => {
      expect(aosomArtikelForTask(task({ wixVariantId: NIL_VARIANT_ID }), m)).toEqual({ artikel: "A-1" });
    });

    it("en task utan variant-id (skapad innan fältet fanns) beställs som vanligt", () => {
      expect(aosomArtikelForTask(task(), m)).toEqual({ artikel: "A-1" });
    });

    it("radens eget variant-id beställs som vanligt", () => {
      expect(aosomArtikelForTask(task({ wixVariantId: "wixvar-A-1" }), m)).toEqual({ artikel: "A-1" });
    });

    it("☠️ ett OKÄNT variant-id hålls — sidan har fått en färg mappningen inte känner till", () => {
      const utfall = aosomArtikelForTask(task({ wixVariantId: "wixvar-okand" }), m);
      expect(utfall).toHaveProperty("skal");
      expect(utfall).not.toHaveProperty("artikel");
    });

    it("en rad med flera varianter av SAMMA artikel beställer radens artikel oavsett variant", () => {
      const m2 = rad("A-1", [variant("A-1", { wixVariantId: "v1" }), variant("A-1", { wixVariantId: "v2" })]);
      expect(aosomArtikelForTask(task({ wixVariantId: "v9" }), m2)).toEqual({ artikel: "A-1" });
    });
  });

  describe("sammanslagen sida", () => {
    const m = sammanslagen();

    it("variant-id:t avgör färgen", () => {
      expect(aosomArtikelForTask(task({ wixVariantId: "wixvar-B-2", sku: "FP-A-1" }), m)).toEqual({ artikel: "B-2" });
      expect(aosomArtikelForTask(task({ wixVariantId: "wixvar-A-1" }), m)).toEqual({ artikel: "A-1" });
    });

    it("☠️ ett okänt variant-id hålls — faller ALDRIG tillbaka på radens artikel", () => {
      const utfall = aosomArtikelForTask(task({ wixVariantId: "wixvar-okand", sku: "FP-A-1" }), m);
      expect(utfall).toHaveProperty("skal");
    });

    it("en order lagd före sammanslagningen (nollan) matchas på SKU", () => {
      expect(aosomArtikelForTask(task({ wixVariantId: NIL_VARIANT_ID, sku: "FP-A-1" }), m)).toEqual({ artikel: "A-1" });
    });

    it("en task utan variant-id matchas på SKU", () => {
      expect(aosomArtikelForTask(task({ sku: "FP-B-2" }), m)).toEqual({ artikel: "B-2" });
    });

    it("utan id och SKU avgör valen — skiftlägesokänsligt", () => {
      expect(aosomArtikelForTask(task({ variantChoices: { Färg: "grå" } }), m)).toEqual({ artikel: "B-2" });
    });

    it("☠️ utan id, SKU och matchande val hålls orderraden i stället för att gissa", () => {
      expect(aosomArtikelForTask(task({ sku: "FP-annan" }), m)).toHaveProperty("skal");
      expect(aosomArtikelForTask(task(), m)).toHaveProperty("skal");
      expect(aosomArtikelForTask(task({ variantChoices: { Färg: "Röd" } }), m)).toHaveProperty("skal");
    });

    it("☠️ två varianter med samma SKU hålls", () => {
      const m2 = rad("A-1", [
        variant("A-1", { sku: "FP-samma" }),
        variant("B-2", { sku: "FP-samma" }),
      ]);
      expect(aosomArtikelForTask(task({ sku: "FP-samma" }), m2)).toHaveProperty("skal");
    });
  });

  it("☠️ en tvetydig rad beställer ingenting", () => {
    const m = rad("A-1", [variant("A-1"), variant("B-2", { wixVariantId: undefined })]);
    expect(aosomArtikelForTask(task({ sku: "FP-A-1" }), m)).toHaveProperty("skal");
  });
});
