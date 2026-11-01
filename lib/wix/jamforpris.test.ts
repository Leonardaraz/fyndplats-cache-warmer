import { describe, expect, it } from "vitest";
import type { WixAnrop } from "../polish/skrivplan";
import { MIN_VARIANTER, lasVariantpriser, skrivJamforpriser, type OnskatJamforpris } from "./jamforpris";

type Obj = Record<string, unknown>;

const vanta = async () => {};

// ── En låtsas-Wix som gör som V3 ─────────────────────────────────────────────
//  - belopp lagras med två decimaler: "1000" blir "1000.00" (uppmätt 2026-11-01 i query-variants)
//  - `compareAtPrice: null` tar bort jämförpriset
//  - en variantsInfo-PATCH ERSÄTTER varianterna; en läsning utan MERCHANT_DATA bär ingen kostnad
//  - en flervariantsprodukt kräver `options` i fältmasken (428 annars)
//  - en variantsInfo-PATCH utan `visible` i fältmasken PUBLICERAR produkten
//  - läsningen kan släpa efter skrivningen

const belopp = (a: unknown) => Number(a).toFixed(2);

function variant(id: string, pris: string, jamfor: string | null, over: Obj = {}): Obj {
  return {
    id,
    sku: `FP-${id}`,
    visible: true,
    choices: [{ optionChoiceIds: { optionId: "o1", choiceId: `c-${id}` }, optionChoiceNames: { optionName: "Färg", choiceName: id } }],
    price: { actualPrice: { amount: pris }, ...(jamfor !== null ? { compareAtPrice: { amount: jamfor } } : {}) },
    physicalProperties: {},
    revenueDetails: { cost: { amount: "500.00" }, profit: { amount: "300" }, profitMargin: 0.3 },
    ...over,
  };
}

function produkt(id: string, varianter: Obj[], over: Obj = {}): Obj {
  const flera = varianter.length > 1;
  return {
    id,
    revision: "7",
    name: "Stol",
    slug: "stol",
    visible: true,
    ...(flera
      ? {
          options: [{
            id: "o1",
            name: "Färg",
            choicesSettings: { choices: varianter.map((v) => ({ choiceId: `c-${String(v.id)}`, name: String(v.id), linkedMedia: [{ id: `bild-${String(v.id)}` }] })) },
          }],
        }
      : {}),
    variantsInfo: { variants: varianter },
    ...over,
  };
}

interface FejkOpts {
  merchant403?: boolean;
  lag?: number;
  /** Wix skriver inte jämförpriset. */
  tappaJamfor?: boolean;
  /** Wix ändrar priset på första varianten. */
  andraPris?: boolean;
  andraLager?: boolean;
  patchFel?: string;
}

function fejkWix(start: Obj, over: FejkOpts = {}) {
  const id = String(start.id);
  let p: Obj = structuredClone(start);
  let fore: Obj | null = null;
  let lager = 50;
  let lasningarEfter = 0;
  let skrivet = false;
  const anrop: { metod: string; sokvag: string; kropp?: unknown }[] = [];
  const utanMerchant = (x: Obj): Obj => {
    const k = structuredClone(x) as Obj;
    for (const v of (k.variantsInfo as Obj).variants as Obj[]) delete v.revenueDetails;
    return k;
  };
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    anrop.push({ metod, sokvag, kropp });
    if (metod === "GET" && sokvag.startsWith(`/stores/v3/products/${id}`)) {
      const medMerchant = sokvag.includes("MERCHANT_DATA");
      if (medMerchant && over.merchant403) throw new Error("Wix 403: NO_PERMISSION_TO_READ_MERCHANT_DATA");
      let svar = p;
      if (skrivet && over.lag && lasningarEfter < over.lag && fore) {
        lasningarEfter++;
        svar = fore;
      }
      return { product: medMerchant ? structuredClone(svar) : utanMerchant(svar) };
    }
    if (metod === "POST" && sokvag === "/stores/v3/inventory-items/query") {
      return { inventoryItems: [{ id: "i1", variantId: "v1", quantity: lager, trackQuantity: true, availabilityStatus: "IN_STOCK", revision: "3" }], pagingMetadata: { hasNext: false } };
    }
    if (metod === "PATCH" && sokvag === `/stores/v3/products/${id}`) {
      if (over.patchFel) throw new Error(over.patchFel);
      const body = kropp as { product: Obj; fieldMask: { paths: string[] } };
      if (body.product.revision !== p.revision) throw new Error("Wix 409: revisionen är gammal");
      const paths = body.fieldMask.paths;
      const flera = ((p.variantsInfo as Obj).variants as Obj[]).length > 1;
      if (flera && !paths.includes("options")) throw new Error("Wix 428: MISSING_OPTIONS_ON_UPDATE_VARIANTS");
      fore = structuredClone(p);
      const ny = structuredClone(p) as Obj;
      const gamla = (p.variantsInfo as Obj).variants as Obj[];
      ny.variantsInfo = {
        variants: ((body.product.variantsInfo as Obj).variants as Obj[]).map((v, i) => {
          const u = structuredClone(v) as Obj;
          const pris = u.price as Obj;
          const ut: Obj = { actualPrice: { amount: belopp((pris.actualPrice as Obj).amount) } };
          const j = pris.compareAtPrice as Obj | null | undefined;
          if (over.tappaJamfor) {
            const g = (gamla[i].price as Obj).compareAtPrice;
            if (g) ut.compareAtPrice = g;
          } else if (j) ut.compareAtPrice = { amount: belopp(j.amount) };
          if (i === 0 && over.andraPris) ut.actualPrice = { amount: "1.00" };
          u.price = ut;
          const kost = (u.revenueDetails as Obj | undefined)?.cost as Obj | undefined;
          if (kost) u.revenueDetails = { cost: { amount: belopp(kost.amount) }, profit: { amount: "1" }, profitMargin: 0.1 };
          return u;
        }),
      };
      if (paths.includes("options")) ny.options = body.product.options;
      ny.visible = paths.includes("visible") ? body.product.visible : true;
      ny.revision = String(Number(p.revision) + 1);
      p = ny;
      skrivet = true;
      if (over.andraLager) lager = 49;
      return { product: { id, revision: p.revision } };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, tillstand: () => p, patchar: () => anrop.filter((a) => a.metod === "PATCH") };
}

const jamforAv = (p: Obj, id: string): string | null => {
  const v = ((p.variantsInfo as Obj).variants as Obj[]).find((x) => x.id === id)!;
  const j = (v.price as Obj).compareAtPrice as Obj | undefined;
  return j ? String(j.amount) : null;
};
const onskat = (rader: [string, OnskatJamforpris][]) => new Map(rader);
const ratt = async () => ({ status: "ratt" as const });

describe("skrivJamforpriser", () => {
  it("sätter jämförpriset på en variant vars pris står kvar, och läser tillbaka (1000 mot 1000.00 är samma)", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", null)]));
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta });
    expect(u).toMatchObject({ status: "skriven", satta: 1, borttagna: 0, redan: 0, prisAndrat: 0 });
    expect(jamforAv(f.tillstand(), "v1")).toBe("1000.00");
    const skickad = ((f.patchar()[0].kropp as { product: Obj }).product.variantsInfo as Obj).variants as Obj[];
    expect((skickad[0].price as Obj).compareAtPrice).toEqual({ amount: "1000" });
  });

  it("tar bort ett jämförpris med compareAtPrice: null", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", "1000.00")]));
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: null, prisOre: 80_000 }]]), { vanta });
    expect(u).toMatchObject({ status: "skriven", satta: 0, borttagna: 1 });
    expect(jamforAv(f.tillstand(), "v1")).toBeNull();
    const skickad = ((f.patchar()[0].kropp as { product: Obj }).product.variantsInfo as Obj).variants as Obj[];
    expect((skickad[0].price as Obj).compareAtPrice).toBeNull();
  });

  it("☠️ har priset ändrats sedan beslutet sätts inget jämförpris: nästa körning räknar om", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "850.00", null)]));
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta });
    expect(u).toMatchObject({ status: "redan_klar", satta: 0, prisAndrat: 1 });
    expect(f.patchar()).toHaveLength(0);
  });

  it("☠️ ett jämförpris som inte är högre än priset sätts aldrig", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", null)]));
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 80_000, prisOre: 80_000 }]]), { vanta });
    expect(u).toMatchObject({ status: "redan_klar", prisAndrat: 1 });
    expect(f.patchar()).toHaveLength(0);
  });

  it("att ta bort ett jämförpris kräver inget oförändrat pris: det påstår ingenting", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "850.00", "1000.00")]));
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: null, prisOre: 80_000 }]]), { vanta });
    expect(u).toMatchObject({ status: "skriven", borttagna: 1 });
  });

  it("redan rätt skrivs inte alls", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", "1000.00")]));
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta });
    expect(u).toMatchObject({ status: "redan_klar", redan: 1 });
    expect(f.patchar()).toHaveLength(0);
  });

  it("torrt skriver ingenting men säger vad som skulle skrivas", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", null)]));
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta, torr: true });
    expect(u).toMatchObject({ status: "torr", satta: 1 });
    expect(f.patchar()).toHaveLength(0);
  });

  it("☠️ nekas MERCHANT_DATA skrivs ingenting (kostnaden hade försvunnit)", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", null)]), { merchant403: true });
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta });
    expect(u.status).toBe("fel");
    expect(u.fel).toMatch(/ingenting skrevs/);
    expect(f.patchar()).toHaveLength(0);
  });

  it("☠️ skickar visible och options med, kostnaden tillbaka (utan profit), och den andra varianten orörd", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", null), variant("v2", "900.00", "1200.00")]));
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta, foljUpVariantbild: ratt });
    expect(u.status).toBe("skriven");
    const body = f.patchar()[0].kropp as { product: Obj; fieldMask: { paths: string[] } };
    expect(body.fieldMask.paths).toEqual(["variantsInfo", "visible", "options"]);
    for (const v of (body.product.variantsInfo as Obj).variants as Obj[]) {
      expect(Object.keys((v.revenueDetails as Obj) ?? {})).toEqual(["cost"]);
    }
    expect(jamforAv(f.tillstand(), "v2")).toBe("1200.00");
  });

  it("☠️ ett dolt utkast förblir dolt", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", "1000.00")], { visible: false }));
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: null, prisOre: null }]]), { vanta });
    expect(u.status).toBe("skriven");
    expect(f.tillstand().visible).toBe(false);
  });

  it("☠️ Wix som lämnar jämförpriset osparat ger avvikelse", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", null)]), { tappaJamfor: true });
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta });
    expect(u.status).toBe("avvikelse");
    expect(u.avvikelser?.join("; ")).toMatch(/jämförpriset syns inte/);
  });

  it("☠️ en ändring av priset eller lagret stoppar", async () => {
    const a = fejkWix(produkt("p1", [variant("v1", "800.00", null)]), { andraPris: true });
    const ua = await skrivJamforpriser(a.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta });
    expect(ua.status).toBe("avvikelse");
    expect(ua.avvikelser?.join("; ")).toMatch(/pris/);
    const b = fejkWix(produkt("p1", [variant("v1", "800.00", null)]), { andraLager: true });
    const ub = await skrivJamforpriser(b.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta });
    expect(ub.status).toBe("avvikelse");
    expect(ub.avvikelser?.join("; ")).toMatch(/lagret/);
  });

  it("☠️ läsningen släpar: läses om tills revisionen gått fram; hinner den aldrig ikapp är det en avvikelse", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", null)]), { lag: 2 });
    expect((await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta })).status).toBe("skriven");
    const g = fejkWix(produkt("p1", [variant("v1", "800.00", null)]), { lag: 99 });
    expect((await skrivJamforpriser(g.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta, omlasningar: 3 })).status).toBe("avvikelse");
  });

  it("föll skrivningen själv är ingenting ändrat: fel", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", null)]), { patchFel: "Wix 409: revisionen är gammal" });
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), { vanta });
    expect(u.status).toBe("fel");
  });

  it("☠️ en flervariantsprodukt får variantbilden uppföljd med revisionen som skrevs, och en avvikelse därifrån stoppar", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", "800.00", null), variant("v2", "900.00", null)]));
    const revisioner: number[] = [];
    const u = await skrivJamforpriser(f.wix, "p1", onskat([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]), {
      vanta,
      foljUpVariantbild: async (_id, rev) => {
        revisioner.push(rev);
        return { status: "avvikelse", avvikelser: ["variantens pris ändrades"] };
      },
    });
    expect(revisioner).toEqual([8]);
    expect(u.status).toBe("avvikelse");
  });
});

describe("lasVariantpriser", () => {
  const variantRad = (i: number, over: Obj = {}): Obj => ({
    id: `v${i}`,
    visible: true,
    price: { actualPrice: { amount: "1669.00" } },
    productData: { productId: `p${Math.floor(i / 2)}`, visible: true },
    ...over,
  });
  const svar = (rader: Obj[]): WixAnrop => async () => ({ variants: rader, pagingMetadata: { hasNext: false } });

  it("pris och jämförpris i öre, och en dold produkt eller variant går inte att köpa", async () => {
    const rader = Array.from({ length: MIN_VARIANTER }, (_, i) => variantRad(i));
    rader[0] = variantRad(0, { price: { actualPrice: { amount: "1669.00" }, compareAtPrice: { amount: "1839.00" } } });
    rader[1] = variantRad(1, { visible: false });
    rader[2] = variantRad(2, { productData: { productId: "p1", visible: false } });
    const ut = await lasVariantpriser(svar(rader), vanta);
    expect(ut[0]).toEqual({ variantId: "v0", productId: "p0", erbjuden: true, prisOre: 166_900, jamforOre: 183_900 });
    expect(ut[1].erbjuden).toBe(false);
    expect(ut[2].erbjuden).toBe(false);
    expect(ut[3]).toMatchObject({ erbjuden: true, jamforOre: null });
  });

  it("☠️ en halv katalog kastar", async () => {
    await expect(lasVariantpriser(svar([variantRad(0)]), vanta)).rejects.toThrow(/golvet är/);
  });
});
