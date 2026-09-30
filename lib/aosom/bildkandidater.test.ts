import { describe, it, expect, vi } from "vitest";
import {
  hamtaBildkandidater,
  tolkaPositioner,
  kandidatNamn,
  arWixProduktId,
  STANDARD_POSITIONER,
  type BildkandidatDeps,
} from "./bildkandidater";
import type { AosomRow } from "./feed";
import type { ProductMappingRecord } from "../store";

const ID_A = "11111111-2222-4333-8444-555555555555";
const ID_B = "22222222-3333-4444-8555-666666666666";
const ID_C = "33333333-4444-4555-8666-777777777777";

const NIO = (sku: string) =>
  Array.from({ length: 9 }, (_, i) => `https://img.aosomcdn.com/100/${sku}/${i + 1}.jpg`);

function rad(sku: string, over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku,
    name: `Produkt ${sku}`,
    url: `https://www.aosom.de/item/x~${sku}.html`,
    imageUrls: NIO(sku),
    category: "Haus & Wohnen",
    color: "", material: "", size: "", packageSize: "",
    weightKg: 5,
    descriptionHtml: "", bulletsHtml: "",
    qty: 50,
    normalPriceEur: 100,
    wholesaleEur: 40,
    seFreightEur: 20,
    rowIndex: 1,
    ...over,
  };
}

function mappning(wixProductId: string, nr: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return { supplierProductId: `aosom:${nr}`, supplier: "aosom", wixProductId, variants: [], ...over };
}

function deps(
  mappningar: ProductMappingRecord[],
  feed: AosomRow[],
  over: Partial<BildkandidatDeps> = {},
) {
  const uppladdade: { url: string; namn: string }[] = [];
  const hamtaFeed = vi.fn(async () => feed);
  let n = 0;
  const d: BildkandidatDeps = {
    hamtaMappning: async (id) => mappningar.find((m) => m.wixProductId === id) ?? null,
    hamtaFeed,
    laddaUpp: async (url, namn) => {
      uppladdade.push({ url, namn });
      n++;
      return { id: `b379ce_fil${n}~mv2.jpg`, url: `https://static.wixstatic.com/media/b379ce_fil${n}~mv2.jpg` };
    },
    vanta: async () => {},
    nu: () => 0,
    ...over,
  };
  return { d, uppladdade, hamtaFeed };
}

describe("hamtaBildkandidater", () => {
  it("laddar upp exakt de begärda positionerna och inget annat", async () => {
    const { d, uppladdade } = deps([mappning(ID_A, "845-001AB")], [rad("845-001AB")]);
    const svar = await hamtaBildkandidater([ID_A], { dryRun: false }, d);
    expect(uppladdade.map((u) => u.url)).toEqual(
      [4, 5, 6, 7].map((p) => `https://img.aosomcdn.com/100/845-001AB/${p}.jpg`),
    );
    expect(svar.produkter[0].kandidater.map((k) => k.pos)).toEqual([4, 5, 6, 7]);
    expect(svar.produkter[0].feedBilder).toBe(9);
    expect(svar.uppladdade).toBe(4);
  });

  it("☠️ en position feeden saknar hoppas över, och ingen träff laddar inte upp hela listan", async () => {
    const tre = rad("845-002AB", { imageUrls: NIO("845-002AB").slice(0, 3) });
    const { d, uppladdade } = deps([mappning(ID_A, "845-002AB")], [tre]);
    const svar = await hamtaBildkandidater([ID_A], { dryRun: false }, d);
    expect(uppladdade).toEqual([]);
    expect(svar.produkter[0].hinder).toBe("inga_bilder");
    expect(svar.produkter[0].feedBilder).toBe(3);

    const fem = rad("845-002AB", { imageUrls: NIO("845-002AB").slice(0, 5) });
    const b = deps([mappning(ID_A, "845-002AB")], [fem]);
    const svar2 = await hamtaBildkandidater([ID_A], { dryRun: false }, b.d);
    expect(svar2.produkter[0].positioner).toEqual([4, 5]);
    expect(b.uppladdade).toHaveLength(2);
  });

  it("torrkörning är default och laddar inte upp något", async () => {
    const { d, uppladdade } = deps([mappning(ID_A, "845-003AB")], [rad("845-003AB")]);
    const svar = await hamtaBildkandidater([ID_A], {}, d);
    expect(svar.dryRun).toBe(true);
    expect(uppladdade).toEqual([]);
    expect(svar.produkter[0].positioner).toEqual([4, 5, 6, 7]);
    expect(svar.produkter[0].kandidater).toEqual([]);
  });

  it("namnger varje hinder i stället för att tappa produkten", async () => {
    const ae: ProductMappingRecord = { supplierProductId: "1005001", supplier: "aliexpress", wixProductId: ID_B, variants: [] };
    const sammanslagen = mappning(ID_C, "845-004AB", {
      variants: [
        { wixVariantId: "v1", supplierVariantId: "845-004AB", sku: "FP-a" },
        { wixVariantId: "v2", supplierVariantId: "845-005AB", sku: "FP-b" },
      ] as ProductMappingRecord["variants"],
    });
    const saknas = mappning("44444444-5555-4666-8777-888888888888", "845-009AB");
    // Leverantören säger Aosom, men id:t bär inget prefix och alltså ingen artikel.
    const utanArtikel = mappning("55555555-6666-4777-8888-999999999999", "x", { supplierProductId: "845-010AB" });
    const { d, uppladdade } = deps([ae, sammanslagen, saknas, utanArtikel], [rad("845-004AB")]);
    const svar = await hamtaBildkandidater(
      [ID_A, ID_B, ID_C, "44444444-5555-4666-8777-888888888888", "55555555-6666-4777-8888-999999999999"],
      { dryRun: false },
      d,
    );
    expect(svar.produkter.map((p) => p.hinder)).toEqual([
      "ingen_mappning", "inte_aosom", "flera_artiklar", "saknas_i_feeden", "utan_artikel",
    ]);
    expect(uppladdade).toEqual([]);
  });

  it("☠️ ett uppladdningsfel räknas per position, och felmeddelandet följer inte med", async () => {
    const { d } = deps([mappning(ID_A, "845-006AB")], [rad("845-006AB")], {
      laddaUpp: async (url) => {
        if (url.endsWith("/5.jpg")) throw new Error(`Wix media-import misslyckades för ${url}`);
        return { id: "b379ce_ok~mv2.jpg", url: "https://static.wixstatic.com/media/b379ce_ok~mv2.jpg" };
      },
    });
    const svar = await hamtaBildkandidater([ID_A], { dryRun: false }, d);
    expect(svar.produkter[0].missar).toEqual([5]);
    expect(svar.produkter[0].kandidater.map((k) => k.pos)).toEqual([4, 6, 7]);
    expect(JSON.stringify(svar)).not.toContain("aosomcdn");
  });

  it("☠️ svaret bär aldrig artikelnumret, feedens adresser eller Aosoms produktadress", async () => {
    const nr = "845-007AB";
    const { d } = deps([mappning(ID_A, nr)], [rad(nr)]);
    const text = JSON.stringify(await hamtaBildkandidater([ID_A], { dryRun: false, positioner: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, d));
    expect(text).not.toContain(nr);
    expect(text).not.toContain("aosomcdn");
    expect(text).not.toContain("aosom.de");
  });

  it("☠️ filnamnet byggs av Wix-id och position, aldrig av källan", async () => {
    const { d, uppladdade } = deps([mappning(ID_A, "845-008AB")], [rad("845-008AB")]);
    await hamtaBildkandidater([ID_A], { dryRun: false, positioner: [4] }, d);
    expect(uppladdade[0].namn).toBe("kandidat-11111111-4.jpg");
    expect(uppladdade[0].namn).not.toContain("845");
    expect(kandidatNamn(ID_B, 7)).toBe("kandidat-22222222-7.jpg");
  });

  it("hämtar feeden en gång, och inte alls när ingen produkt är en Aosom-rad", async () => {
    const a = deps([mappning(ID_A, "845-010AB"), mappning(ID_B, "845-011AB")], [rad("845-010AB"), rad("845-011AB")]);
    await hamtaBildkandidater([ID_A, ID_B], {}, a.d);
    expect(a.hamtaFeed).toHaveBeenCalledTimes(1);

    const b = deps([], []);
    await hamtaBildkandidater([ID_A], {}, b.d);
    expect(b.hamtaFeed).not.toHaveBeenCalled();
  });

  it("lämnar det tidsbudgeten inte räckte till i `kvar`, och avbryter aldrig mitt i en produkt", async () => {
    let klocka = 0;
    const { d, uppladdade } = deps(
      [mappning(ID_A, "845-012AB"), mappning(ID_B, "845-013AB")],
      [rad("845-012AB"), rad("845-013AB")],
      {
        nu: () => klocka,
        laddaUpp: async (url) => {
          uppladdade.push({ url, namn: "" });
          klocka += 1000;
          return { id: "b379ce_x~mv2.jpg", url: "https://static.wixstatic.com/media/b379ce_x~mv2.jpg" };
        },
      },
    );
    const svar = await hamtaBildkandidater([ID_A, ID_B], { dryRun: false, tidsbudgetMs: 2000 }, d);
    expect(svar.produkter.map((p) => p.wixProductId)).toEqual([ID_A]);
    expect(svar.produkter[0].kandidater).toHaveLength(4);
    expect(svar.kvar).toEqual([ID_B]);
  });

  it("tar samma produkt en gång även om den skickas två gånger", async () => {
    const { d } = deps([mappning(ID_A, "845-014AB")], [rad("845-014AB")]);
    const svar = await hamtaBildkandidater([ID_A, ` ${ID_A} `], {}, d);
    expect(svar.produkter).toHaveLength(1);
  });
});

describe("tolkaPositioner", () => {
  it("defaultar till de positioner importen aldrig hämtar", () => {
    expect(tolkaPositioner(undefined)).toEqual([...STANDARD_POSITIONER]);
    expect(tolkaPositioner([])).toEqual([4, 5, 6, 7]);
  });

  it("tar heltal 1–9, sorterade och utan dubbletter", () => {
    expect(tolkaPositioner(["7", 4, 4, 0, 10, 2.5, "x", 9])).toEqual([4, 7, 9]);
  });
});

describe("arWixProduktId", () => {
  it("släpper bara igenom Wix produkt-id", () => {
    expect(arWixProduktId(ID_A)).toBe(true);
    expect(arWixProduktId("845-001AB")).toBe(false);
    expect(arWixProduktId("")).toBe(false);
  });
});
