import { describe, expect, it } from "vitest";
import type { WixAnrop } from "../polish/skrivplan";
import type { ProductMappingRecord } from "../store";
import {
  BekraftaFel,
  MAX_FEL_I_FOLJD,
  MIN_KATALOGVARIANTER,
  korVarukostnad,
  kostnadsText,
  lasKatalogVarianter,
  planeraVarukostnad,
  redigeraFeltext,
  skrivVarukostnad,
  type KatalogVariant,
  type KostnadUtfall,
} from "./varukostnad";

type Obj = Record<string, unknown>;

const vanta = async () => {};

// ── En låtsas-Wix som gör som V3 (mätt 2026-10-24 och 2026-10-28) ────────────
//  - en variantsInfo-PATCH ERSÄTTER varianterna; en variant utan `revenueDetails` har ingen kostnad
//  - en läsning utan MERCHANT_DATA bär ingen kostnad, och `profit` och `profitMargin` räknas av Wix
//  - en flervariantsprodukt kräver `options` i fältmasken (428 annars)
//  - en variantsInfo-PATCH utan `visible` i fältmasken PUBLICERAR produkten
//  - belopp lagras som tal utan nollor: "1099.40" blir "1099.4"
//  - läsningen kan släpa efter skrivningen

function variant(id: string, kostnad: string | null, over: Obj = {}): Obj {
  return {
    id,
    sku: `FP-${id}`,
    visible: true,
    choices: [{ optionChoiceIds: { optionId: "o1", choiceId: `c-${id}` }, optionChoiceNames: { optionName: "Färg", choiceName: id } }],
    price: { actualPrice: { amount: "1499" } },
    physicalProperties: {},
    media: { id: "huvud" },
    ...(kostnad !== null ? { revenueDetails: { cost: { amount: kostnad }, profit: { amount: "400" }, profitMargin: 0.2 } } : {}),
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
  /** Antal läsningar efter skrivningen som visar produkten som den var. */
  lag?: number;
  /** Wix skriver inte kostnaden. */
  tappaKostnad?: boolean;
  /** Wix ändrar priset på första varianten. */
  andraPris?: boolean;
  /** Wix ändrar lagret under skrivningen. */
  andraLager?: boolean;
  /** Läsningen efter skrivningen kastar. */
  lasfelEfter?: boolean;
  /** Skrivningen kastar. */
  patchFel?: string;
}

function fejkWix(start: Obj, over: FejkOpts = {}) {
  const id = String(start.id);
  let p: Obj = structuredClone(start);
  let fore: Obj | null = null;
  let lagerKvantitet = 50;
  let lasningarEfter = 0;
  const anrop: { metod: string; sokvag: string; kropp?: unknown }[] = [];
  let skrivet = false;

  const norm = (a: unknown) => {
    const n = Number(a);
    return Number.isFinite(n) ? String(n) : String(a);
  };
  const utanMerchant = (x: Obj): Obj => {
    const k = structuredClone(x) as Obj;
    for (const v of ((k.variantsInfo as Obj).variants as Obj[])) delete v.revenueDetails;
    return k;
  };

  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    anrop.push({ metod, sokvag, kropp });
    if (metod === "GET" && sokvag.startsWith(`/stores/v3/products/${id}`)) {
      const medMerchant = sokvag.includes("MERCHANT_DATA");
      if (medMerchant && over.merchant403) throw new Error("Wix 403: NO_PERMISSION_TO_READ_MERCHANT_DATA");
      if (skrivet && over.lasfelEfter) throw new Error("Wix 500: läsningen föll");
      let svar = p;
      if (skrivet && over.lag && lasningarEfter < over.lag && fore) {
        lasningarEfter++;
        svar = fore;
      }
      return { product: medMerchant ? structuredClone(svar) : utanMerchant(svar) };
    }
    if (metod === "POST" && sokvag === "/stores/v3/inventory-items/query") {
      return { inventoryItems: [{ id: "i1", variantId: "v1", quantity: lagerKvantitet, trackQuantity: true, availabilityStatus: "IN_STOCK", revision: "3" }], pagingMetadata: { hasNext: false } };
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
      if (paths.includes("variantsInfo")) {
        const skickade = (body.product.variantsInfo as Obj).variants as Obj[];
        ny.variantsInfo = {
          variants: skickade.map((v, i) => {
            const u = structuredClone(v) as Obj;
            const kost = (u.revenueDetails as Obj | undefined)?.cost as Obj | undefined;
            if (kost && !over.tappaKostnad) {
              const k = Number(norm(kost.amount));
              const pris = Number(((u.price as Obj).actualPrice as Obj).amount);
              u.revenueDetails = { cost: { amount: norm(kost.amount) }, profit: { amount: String(pris - k) }, profitMargin: (pris - k) / pris };
            } else delete u.revenueDetails;
            if (i === 0 && over.andraPris) u.price = { actualPrice: { amount: "1" } };
            return u;
          }),
        };
      }
      if (paths.includes("options")) ny.options = body.product.options;
      // ☠️ En variantsInfo-PATCH utan `visible` i masken publicerar produkten.
      ny.visible = paths.includes("visible") ? body.product.visible : true;
      ny.revision = String(Number(p.revision) + 1);
      p = ny;
      skrivet = true;
      if (over.andraLager) lagerKvantitet = 49;
      return { product: { id, revision: p.revision } };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, anrop, tillstand: () => p, patchar: () => anrop.filter((a) => a.metod === "PATCH") };
}

const kostnadAvVariant = (p: Obj, id: string): string | null => {
  const v = ((p.variantsInfo as Obj).variants as Obj[]).find((x) => x.id === id)!;
  const k = ((v.revenueDetails as Obj | undefined)?.cost as Obj | undefined)?.amount;
  return k === undefined ? null : String(k);
};

// ── skrivVarukostnad ─────────────────────────────────────────────────────

describe("skrivVarukostnad", () => {
  const enVariant = () => produkt("p1", [variant("v1", null)]);
  const tvaVarianter = () => produkt("p1", [variant("v1", null), variant("v2", "525.00")]);

  it("skriver kostnaden på en variant som saknar den, och läser tillbaka", async () => {
    const f = fejkWix(enVariant());
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "1099.40"]]), { vanta });
    expect(u).toMatchObject({ status: "skriven", skrivna: 1, redanKostnad: 0, saknas: 0 });
    expect(kostnadAvVariant(f.tillstand(), "v1")).toBe("1099.4");
    expect(f.patchar()).toHaveLength(1);
  });

  it("☠️ en befintlig kostnad skrivs ALDRIG över, och en produkt där alla redan har kostnad skrivs inte alls", async () => {
    const f = fejkWix(tvaVarianter());
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "700.00"], ["v2", "999.00"]]), { vanta, foljUpVariantbild: async () => ({ status: "ratt" }) });
    expect(u).toMatchObject({ status: "skriven", skrivna: 1, redanKostnad: 1 });
    expect(kostnadAvVariant(f.tillstand(), "v1")).toBe("700");
    expect(kostnadAvVariant(f.tillstand(), "v2")).toBe("525");

    const g = fejkWix(produkt("p1", [variant("v1", "525.00")]));
    const klar = await skrivVarukostnad(g.wix, "p1", new Map([["v1", "999.00"]]), { vanta });
    expect(klar).toMatchObject({ status: "redan_klar", skrivna: 0, redanKostnad: 1 });
    expect(g.patchar()).toHaveLength(0);
  });

  it("torrt skriver ingenting men säger vad som skulle skrivas", async () => {
    const f = fejkWix(enVariant());
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"]]), { vanta, torr: true });
    expect(u).toMatchObject({ status: "torr", skrivna: 1 });
    expect(f.patchar()).toHaveLength(0);
  });

  it("☠️ nekas MERCHANT_DATA skrivs ingenting: en skrivning utan kostnadsläsning ersätter varianterna utan kostnad", async () => {
    const f = fejkWix(enVariant(), { merchant403: true });
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"]]), { vanta });
    expect(u.status).toBe("fel");
    // Felet ska säga orsaken i klartext (Wix egen text bär också ordet MERCHANT_DATA, så ordet räcker inte).
    expect(u.fel).toMatch(/nyckeln får inte läsa varukostnaden/);
    expect(u.fel).toMatch(/ingenting skrevs/);
    expect(f.patchar()).toHaveLength(0);
  });

  it("en önskad variant som inte finns räknas, och rör ingenting", async () => {
    const f = fejkWix(enVariant());
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"], ["spokvariant", "20.00"]]), { vanta });
    expect(u).toMatchObject({ status: "skriven", skrivna: 1, saknas: 1 });
  });

  it("☠️ skickar `visible` och `options` med, och bara kostnaden i revenueDetails (inte profit)", async () => {
    const f = fejkWix(tvaVarianter());
    await skrivVarukostnad(f.wix, "p1", new Map([["v1", "700.00"]]), { vanta, foljUpVariantbild: async () => ({ status: "ratt" }) });
    const body = f.patchar()[0].kropp as { product: Obj; fieldMask: { paths: string[] } };
    expect(body.fieldMask.paths).toEqual(["variantsInfo", "visible", "options"]);
    expect(body.product.visible).toBe(true);
    expect(body.product.options).toBeDefined();
    for (const v of (body.product.variantsInfo as Obj).variants as Obj[]) {
      expect(Object.keys((v.revenueDetails as Obj) ?? {})).toEqual(["cost"]);
    }
  });

  it("☠️ ett dolt utkast förblir dolt (en variantsInfo-PATCH utan visible publicerar)", async () => {
    const f = fejkWix(produkt("p1", [variant("v1", null)], { visible: false }));
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"]]), { vanta });
    expect(u.status).toBe("skriven");
    expect(f.tillstand().visible).toBe(false);
    expect((f.patchar()[0].kropp as { fieldMask: { paths: string[] } }).fieldMask.paths).toContain("visible");
  });

  it("☠️ Wix som lämnar kostnaden osparad ger avvikelse, inte skriven", async () => {
    const f = fejkWix(enVariant(), { tappaKostnad: true });
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"]]), { vanta });
    expect(u.status).toBe("avvikelse");
    expect(u.avvikelser?.join("; ")).toMatch(/kostnaden syns inte/);
  });

  it("☠️ en ändring av något annat än kostnaden stoppar: priset", async () => {
    const f = fejkWix(enVariant(), { andraPris: true });
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"]]), { vanta });
    expect(u.status).toBe("avvikelse");
    expect(u.avvikelser?.join("; ")).toMatch(/pris/);
  });

  it("☠️ en ändring av lagret stoppar", async () => {
    const f = fejkWix(enVariant(), { andraLager: true });
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"]]), { vanta });
    expect(u.status).toBe("avvikelse");
    expect(u.avvikelser?.join("; ")).toMatch(/lagret/);
  });

  it("☠️ läsningen släpar: produkten läses om tills revisionen gått fram, och 1099.40 mot 1099.4 är samma kostnad", async () => {
    const f = fejkWix(enVariant(), { lag: 2 });
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "1099.40"]]), { vanta });
    expect(u.status).toBe("skriven");
  });

  it("☠️ läsningen hinner aldrig ikapp: det är en avvikelse, inte en lyckad skrivning", async () => {
    const f = fejkWix(enVariant(), { lag: 99 });
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"]]), { vanta, omlasningar: 3 });
    expect(u.status).toBe("avvikelse");
  });

  it("☠️ föll kontrollen EFTER skrivningen vet vi inte vad Wix har: avvikelse", async () => {
    const f = fejkWix(enVariant(), { lasfelEfter: true });
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"]]), { vanta });
    expect(u.status).toBe("avvikelse");
  });

  it("föll skrivningen själv är ingenting ändrat: fel", async () => {
    const f = fejkWix(enVariant(), { patchFel: "Wix 409: revisionen är gammal" });
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"]]), { vanta });
    expect(u.status).toBe("fel");
  });

  it("☠️ en Wix-felkropp som ekar värdet eller ett artikelnummer lämnar aldrig modulen oredigerad", async () => {
    const f = fejkWix(enVariant(), { patchFel: 'Wix 400: {"message":"revenueDetails.cost.amount 1099.40 avvisades för 999-999X99"}' });
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "1099.40"]]), { vanta });
    expect(u.status).toBe("fel");
    expect(u.fel).not.toMatch(/1099|999-999X99/);
    expect(u.fel).toMatch(/‹tal›/);
    expect(u.fel).toMatch(/‹REDIGERAT›/);
  });

  it("☠️ samma redigering gäller katalogsvepets fel, och ett övergående fel känns fortfarande igen före redigeringen", async () => {
    let n = 0;
    const wix: WixAnrop = async () => {
      n++;
      if (n === 1) throw new Error("Wix 429: för många anrop, vänta 12.5 s");
      throw new Error("Wix 400: sämre värde 1099.40");
    };
    await expect(lasKatalogVarianter(wix, vanta)).rejects.toThrow(/katalogsvepet föll på sida 0: Wix 400: sämre värde ‹tal›/);
    expect(n).toBe(2);
  });

  it("☠️ en flervariantsprodukt får variantbilden uppföljd med revisionen som skrevs, och en avvikelse därifrån stoppar", async () => {
    const f = fejkWix(tvaVarianter());
    const anrop: number[] = [];
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "700.00"]]), {
      vanta,
      foljUpVariantbild: async (_id, rev) => {
        anrop.push(rev);
        return { status: "rattad" };
      },
    });
    expect(u).toMatchObject({ status: "skriven", variantbild: "rattad" });
    expect(anrop).toEqual([8]);

    const g = fejkWix(tvaVarianter());
    const ut = await skrivVarukostnad(g.wix, "p1", new Map([["v1", "700.00"]]), {
      vanta,
      foljUpVariantbild: async () => ({ status: "avvikelse", avvikelser: ["variantens pris ändrades"] }),
    });
    expect(ut).toMatchObject({ status: "avvikelse", variantbild: "avvikelse" });
  });

  it("en produkt med en variant följer inte upp variantbilden", async () => {
    const f = fejkWix(enVariant());
    let anropad = false;
    const u = await skrivVarukostnad(f.wix, "p1", new Map([["v1", "10.00"]]), { vanta, foljUpVariantbild: async () => { anropad = true; return { status: "ratt" }; } });
    expect(u.status).toBe("skriven");
    expect(anropad).toBe(false);
    expect(u.variantbild).toBeUndefined();
  });
});

// ── planeraVarukostnad ───────────────────────────────────────────────────

function mappning(over: Partial<ProductMappingRecord> & { wixProductId: string }, varianter: { wixVariantId?: string; sku: string; landedCostSek?: number }[]): ProductMappingRecord {
  return {
    supplierProductId: "aosom:X",
    supplier: "aosom",
    variants: varianter.map((v) => ({
      supplierVariantId: v.sku,
      sku: v.sku,
      ...(v.wixVariantId ? { wixVariantId: v.wixVariantId } : {}),
      choices: {},
      costUsd: 1,
      landedCostSek: v.landedCostSek as number,
      grossSek: 1,
    })),
    ...over,
  } as ProductMappingRecord;
}

const kv = (id: string, productId: string, kostnad: string | null, over: Partial<KatalogVariant> = {}): KatalogVariant => ({
  id,
  sku: `FP-${id}`,
  productId,
  synlig: true,
  kostnad,
  ...over,
});

describe("planeraVarukostnad", () => {
  it("tar varianter som saknar kostnad och skriver mappningens landedCostSek med två decimaler", () => {
    const plan = planeraVarukostnad(
      [mappning({ wixProductId: "p1" }, [{ wixVariantId: "v1", sku: "FP-v1", landedCostSek: 1099.4 }])],
      [kv("v1", "p1", null)],
    );
    expect(plan.produkter).toEqual([{ productId: "p1", synlig: true, skriv: [{ variantId: "v1", kostnad: "1099.40" }] }]);
    expect(plan.raknare).toMatchObject({ attSkriva: 1, produkter: 1, redanKostnad: 0 });
  });

  it("☠️ en befintlig kostnad är aldrig en kandidat, hur annorlunda mappningens tal är", () => {
    const plan = planeraVarukostnad(
      [mappning({ wixProductId: "p1" }, [{ wixVariantId: "v1", sku: "FP-v1", landedCostSek: 5000 }])],
      [kv("v1", "p1", "1264")],
    );
    expect(plan.produkter).toEqual([]);
    expect(plan.raknare.redanKostnad).toBe(1);
  });

  it("☠️ bara Aosom: AliExpress och okända leverantörer ger ingen kandidat (deras kostnad fryser vid importen)", () => {
    const ae = mappning({ wixProductId: "p1", supplier: "aliexpress", supplierProductId: "1005001" }, [{ wixVariantId: "v1", sku: "FP-v1", landedCostSek: 100 }]);
    const utanFalt = mappning({ wixProductId: "p2", supplier: undefined, supplierProductId: "1005002" }, [{ wixVariantId: "v2", sku: "FP-v2", landedCostSek: 100 }]);
    const vevor = mappning({ wixProductId: "p3", supplier: "vevor", supplierProductId: "vevor:ABC" }, [{ wixVariantId: "v3", sku: "FP-v3", landedCostSek: 100 }]);
    const plan = planeraVarukostnad([ae, utanFalt, vevor], [kv("v1", "p1", null), kv("v2", "p2", null), kv("v3", "p3", null)]);
    expect(plan.produkter).toEqual([]);
    expect(plan.raknare.aosomMappningar).toBe(0);
  });

  it("matchar på wixVariantId, annars på SKU, och bara på mappningens egen produkt", () => {
    const plan = planeraVarukostnad(
      [
        mappning({ wixProductId: "p1" }, [{ sku: "FP-v1", landedCostSek: 100 }]),
        mappning({ wixProductId: "p2" }, [{ sku: "FP-v1", landedCostSek: 200 }]),
        mappning({ wixProductId: "p3" }, [{ wixVariantId: "okänd", sku: "FP-saknas", landedCostSek: 300 }]),
      ],
      [kv("v1", "p1", null)],
    );
    expect(plan.produkter.map((p) => p.productId)).toEqual(["p1"]);
    expect(plan.raknare.utanKatalogvariant).toBe(2);
  });

  it("☠️ en mappning utan ett positivt landedCostSek ger ingen kandidat: noll, minus, NaN och saknat", () => {
    const plan = planeraVarukostnad(
      [mappning({ wixProductId: "p1" }, [
        { wixVariantId: "v1", sku: "a", landedCostSek: 0 },
        { wixVariantId: "v2", sku: "b", landedCostSek: -5 },
        { wixVariantId: "v3", sku: "c", landedCostSek: Number.NaN },
        { wixVariantId: "v4", sku: "d" },
      ])],
      [kv("v1", "p1", null), kv("v2", "p1", null), kv("v3", "p1", null), kv("v4", "p1", null)],
    );
    expect(plan.produkter).toEqual([]);
    expect(plan.raknare.utanMappningskostnad).toBe(4);
    expect(kostnadsText(undefined)).toBeNull();
  });

  it("pensionerade rader hoppas över: deras sida raderas", () => {
    const plan = planeraVarukostnad(
      [
        mappning({ wixProductId: "p1", draftStatus: "rejected" }, [{ wixVariantId: "v1", sku: "a", landedCostSek: 100 }]),
        mappning({ wixProductId: "p2", wixRaderad: { at: "2026-10-01" } }, [{ wixVariantId: "v2", sku: "b", landedCostSek: 100 }]),
      ],
      [kv("v1", "p1", null), kv("v2", "p2", null)],
    );
    expect(plan.produkter).toEqual([]);
    expect(plan.raknare.pensionerade).toBe(2);
  });

  it("utkast: tas med som standard, hoppas med utkast: false", () => {
    const m = [mappning({ wixProductId: "p1" }, [{ wixVariantId: "v1", sku: "a", landedCostSek: 100 }])];
    const k = [kv("v1", "p1", null, { synlig: false })];
    expect(planeraVarukostnad(m, k).raknare).toMatchObject({ produkter: 1, utkast: 1 });
    expect(planeraVarukostnad(m, k, { utkast: false }).produkter).toEqual([]);
  });

  it("ids avgränsar till de produkterna, och planen är sorterad på id", () => {
    const m = ["p3", "p1", "p2"].map((p) => mappning({ wixProductId: p }, [{ wixVariantId: `v-${p}`, sku: p, landedCostSek: 100 }]));
    const k = ["p3", "p1", "p2"].map((p) => kv(`v-${p}`, p, null));
    expect(planeraVarukostnad(m, k).produkter.map((p) => p.productId)).toEqual(["p1", "p2", "p3"]);
    expect(planeraVarukostnad(m, k, { ids: ["p2"] }).produkter.map((p) => p.productId)).toEqual(["p2"]);
  });

  it("räknar flervariantsprodukter och varianter per produkt, och skriver varje variant en gång", () => {
    const m = [
      mappning({ wixProductId: "p1" }, [
        { wixVariantId: "v1", sku: "a", landedCostSek: 100 },
        { wixVariantId: "v2", sku: "b", landedCostSek: 200 },
        { wixVariantId: "v2", sku: "b", landedCostSek: 200 },
      ]),
    ];
    const plan = planeraVarukostnad(m, [kv("v1", "p1", null), kv("v2", "p1", null)]);
    expect(plan.produkter[0].skriv).toHaveLength(2);
    expect(plan.raknare).toMatchObject({ attSkriva: 2, flervariant: 1 });
  });
});

// ── lasKatalogVarianter ──────────────────────────────────────────────────

function katalogSvar(sidor: Obj[][]): { wix: WixAnrop; kroppar: Obj[] } {
  const kroppar: Obj[] = [];
  const wix: WixAnrop = async (_metod, sokvag, kropp) => {
    expect(sokvag).toBe("/stores/v3/products/query-variants");
    kroppar.push(kropp as Obj);
    const i = kroppar.length - 1;
    return {
      variants: sidor[i],
      pagingMetadata: { hasNext: i < sidor.length - 1, cursors: i < sidor.length - 1 ? { next: `k${i + 1}` } : {} },
    };
  };
  return { wix, kroppar };
}

const wixVariant = (id: string, productId: string, kostnad?: string, synlig = true): Obj => ({
  id,
  sku: `FP-${id}`,
  productData: { productId, visible: synlig },
  ...(kostnad !== undefined ? { revenueDetails: { cost: { amount: kostnad }, profit: { amount: "1" }, profitMargin: 0.1 } } : {}),
});

const stor = (start: number, n: number): Obj[] => Array.from({ length: n }, (_, i) => wixVariant(`v${start + i}`, `p${Math.floor((start + i) / 2)}`, i % 3 === 0 ? "10" : undefined));

describe("lasKatalogVarianter", () => {
  it("läser alla sidor, skickar fields på varje sida, och en variant utan revenueDetails saknar kostnad", async () => {
    const sidor = [stor(0, 1000), stor(1000, 1000), stor(2000, 1000), stor(3000, 1000), stor(4000, 500)];
    const { wix, kroppar } = katalogSvar(sidor);
    const ut = await lasKatalogVarianter(wix, vanta);
    expect(ut).toHaveLength(4500);
    expect(kroppar).toHaveLength(5);
    for (const k of kroppar) expect(k.fields).toEqual(["MERCHANT_DATA"]);
    expect(((kroppar[1].query as Obj).cursorPaging as Obj).cursor).toBe("k1");
    expect(ut.find((v) => v.id === "v0")!.kostnad).toBe("10");
    expect(ut.find((v) => v.id === "v1")!.kostnad).toBeNull();
    expect(ut.find((v) => v.id === "v1")!.productId).toBe("p0");
  });

  it("☠️ en halv katalog kastar i stället för att tolkas som 'ingen kostnad'", async () => {
    const { wix } = katalogSvar([stor(0, 1000)]);
    await expect(lasKatalogVarianter(wix, vanta)).rejects.toThrow(new RegExp(`golvet är ${MIN_KATALOGVARIANTER}`));
  });

  it("☠️ hasNext utan markör är ett trasigt svar, inte slutet", async () => {
    const wix: WixAnrop = async () => ({ variants: stor(0, 1000), pagingMetadata: { hasNext: true, cursors: {} } });
    await expect(lasKatalogVarianter(wix, vanta)).rejects.toThrow(/hasNext utan markör/);
  });

  it("ett övergående 429 försöks om, ett annat fel kastas direkt", async () => {
    let n = 0;
    const sidor = [stor(0, 4500)];
    const wix: WixAnrop = async () => {
      n++;
      if (n === 1) throw new Error("Wix 429: för många anrop");
      return { variants: sidor[0], pagingMetadata: { hasNext: false } };
    };
    expect(await lasKatalogVarianter(wix, vanta)).toHaveLength(4500);
    expect(n).toBe(2);
    const fel: WixAnrop = async () => { throw new Error("Wix 403: nekad"); };
    await expect(lasKatalogVarianter(fel, vanta)).rejects.toThrow(/403/);
  });
});

// ── korVarukostnad ───────────────────────────────────────────────────────

function enPlan(n: number): { m: ProductMappingRecord[]; k: KatalogVariant[] } {
  const ider = Array.from({ length: n }, (_, i) => `p${String(i + 1).padStart(3, "0")}`);
  return {
    m: ider.map((p) => mappning({ wixProductId: p }, [{ wixVariantId: `v-${p}`, sku: p, landedCostSek: 100 }])),
    k: ider.map((p) => kv(`v-${p}`, p, null)),
  };
}

const framtid = () => Date.now() + 60_000;
const ok = (skrivna = 1): typeof skrivVarukostnad => async (_w, productId): Promise<KostnadUtfall> => ({ productId, status: "skriven", skrivna, redanKostnad: 0, saknas: 0 });
const wixIngen: WixAnrop = async () => { throw new Error("inget Wix-anrop väntat"); };

describe("korVarukostnad", () => {
  it("torrt skriver ingenting och räknar planen", async () => {
    const { m, k } = enPlan(3);
    let anropad = 0;
    const r = await korVarukostnad(wixIngen, m, k, { deadline: framtid(), skriv: async (...a) => { anropad++; return ok()(...a); } });
    expect(anropad).toBe(0);
    expect(r).toMatchObject({ torr: true, totalt: 3, skrivna: 0, fullstandig: true, forsta: ["p001", "p002", "p003"] });
    expect(r.plan.attSkriva).toBe(3);
  });

  it("☠️ skarpt kräver planens exakta antal som bekrafta", async () => {
    const { m, k } = enPlan(3);
    await expect(korVarukostnad(wixIngen, m, k, { torr: false, deadline: framtid(), skriv: ok() })).rejects.toBeInstanceOf(BekraftaFel);
    await expect(korVarukostnad(wixIngen, m, k, { torr: false, deadline: framtid(), bekrafta: "2", skriv: ok() })).rejects.toThrow(/torrkörningens antal produkter \(3\)/);
    const r = await korVarukostnad(wixIngen, m, k, { torr: false, deadline: framtid(), bekrafta: "3", vanta, skriv: ok() });
    expect(r).toMatchObject({ skrivna: 3, varianterSkrivna: 3, aterstod: 0, fullstandig: true, stoppad: false });
  });

  it("☠️ följande varv: hogst är ett tak, planen får krympa men aldrig växa, och bekrafta och hogst ihop vägras", async () => {
    const { m, k } = enPlan(3);
    const kor = (o: object) => korVarukostnad(wixIngen, m, k, { torr: false, deadline: framtid(), vanta, skriv: ok(), ...o });
    await expect(kor({ hogst: 2 })).rejects.toThrow(/fler än de 2/);
    await expect(kor({ hogst: 3, bekrafta: "3" })).rejects.toThrow(/antingen/);
    await expect(kor({ hogst: -1 })).rejects.toThrow(BekraftaFel);
    expect((await kor({ hogst: 5 })).skrivna).toBe(3);
  });

  it("limit skriver högst så många, och nasta pekar på sista behandlade", async () => {
    const { m, k } = enPlan(5);
    const r = await korVarukostnad(wixIngen, m, k, { torr: false, deadline: framtid(), bekrafta: "5", limit: 2, vanta, skriv: ok() });
    expect(r).toMatchObject({ skrivna: 2, nasta: "p002", ejNadda: 3, aterstod: 3, fullstandig: false, stoppad: false });
    // Nästa varv läser katalogen på nytt: de två som skrevs har nu en kostnad och syns inte längre i planen.
    const efterVarv1 = k.map((v) => (v.productId === "p001" || v.productId === "p002" ? { ...v, kostnad: "100" } : v));
    const andra = await korVarukostnad(wixIngen, m, efterVarv1, { torr: false, deadline: framtid(), hogst: r.aterstod, efter: r.nasta, limit: 2, vanta, skriv: ok() });
    expect(andra).toMatchObject({ totalt: 3, skrivna: 2, nasta: "p004", ejNadda: 1, aterstod: 1 });
  });

  it("efter hoppar över det som redan behandlats", async () => {
    const { m, k } = enPlan(3);
    const sedda: string[] = [];
    await korVarukostnad(wixIngen, m, k, { torr: false, deadline: framtid(), bekrafta: "3", efter: "p001", vanta, skriv: async (w, id, o, op) => { sedda.push(id); return ok()(w, id, o, op); } });
    expect(sedda).toEqual(["p002", "p003"]);
  });

  it("☠️ en avvikelse stoppar svepet direkt: resten rörs inte", async () => {
    const { m, k } = enPlan(4);
    const sedda: string[] = [];
    const r = await korVarukostnad(wixIngen, m, k, {
      torr: false,
      deadline: framtid(),
      bekrafta: "4",
      vanta,
      skriv: async (_w, id): Promise<KostnadUtfall> => {
        sedda.push(id);
        return id === "p002"
          ? { productId: id, status: "avvikelse", skrivna: 1, redanKostnad: 0, saknas: 0, avvikelser: ["variant v-p002: pris ändrades"] }
          : { productId: id, status: "skriven", skrivna: 1, redanKostnad: 0, saknas: 0 };
      },
    });
    expect(sedda).toEqual(["p001", "p002"]);
    expect(r).toMatchObject({ stoppad: true, stoppadAv: "avvikelse", avvikelser: 1, skrivna: 1, fullstandig: false, nasta: "p002", ejNadda: 2 });
    expect(r.produkter).toEqual([expect.objectContaining({ id: "p002", status: "avvikelse", avvikelser: ["variant v-p002: pris ändrades"] })]);
  });

  it("☠️ fem fel i följd stoppar (ett nekat MERCHANT_DATA fäller varje produkt), men ett fel mitt i en skiva gör det inte", async () => {
    const { m, k } = enPlan(8);
    const fel = (id: string): KostnadUtfall => ({ productId: id, status: "fel", skrivna: 0, redanKostnad: 0, saknas: 0, fel: "nekad" });
    const alla = await korVarukostnad(wixIngen, m, k, { torr: false, deadline: framtid(), bekrafta: "8", vanta, skriv: async (_w, id) => fel(id) });
    expect(alla).toMatchObject({ stoppad: true, stoppadAv: "fel_i_foljd", fel: MAX_FEL_I_FOLJD, aterstod: 8, ejNadda: 3 });

    const ett = await korVarukostnad(wixIngen, m, k, { torr: false, deadline: framtid(), bekrafta: "8", vanta, skriv: async (w, id, o, op) => (id === "p003" ? fel(id) : ok()(w, id, o, op)) });
    expect(ett).toMatchObject({ stoppad: false, fel: 1, skrivna: 7, aterstod: 1, fullstandig: true });
    expect(ett.produkter).toHaveLength(1);
  });

  it("tidsbudgeten stoppar före nästa produkt och är inget fel", async () => {
    const { m, k } = enPlan(3);
    let n = 0;
    const r = await korVarukostnad(wixIngen, m, k, {
      torr: false,
      bekrafta: "3",
      deadline: Date.now() + 50,
      vanta,
      skriv: async (w, id, o, op) => {
        if (n++ === 0) await new Promise((res) => setTimeout(res, 80));
        return ok()(w, id, o, op);
      },
    });
    expect(r).toMatchObject({ skrivna: 1, stoppad: true, stoppadAv: "tidsbudget", ejNadda: 2 });
  });

  it("redan_klar räknas som klar och lämnar planens återstod", async () => {
    const { m, k } = enPlan(3);
    const r = await korVarukostnad(wixIngen, m, k, {
      torr: false,
      deadline: framtid(),
      bekrafta: "3",
      vanta,
      skriv: async (w, id, o, op) => (id === "p002" ? { productId: id, status: "redan_klar", skrivna: 0, redanKostnad: 1, saknas: 0 } : ok()(w, id, o, op)),
    });
    expect(r).toMatchObject({ skrivna: 2, redanKlara: 1, aterstod: 0 });
    expect(r.produkter).toEqual([]);
  });

  it("bara problem skrivs ut, och bara Wix-id och räknare: svaret hamnar i en publik logg", async () => {
    const { m, k } = enPlan(2);
    const r = await korVarukostnad(wixIngen, m, k, {
      torr: false,
      deadline: framtid(),
      bekrafta: "2",
      vanta,
      skriv: async (_w, id): Promise<KostnadUtfall> => ({ productId: id, status: "skriven", skrivna: 1, redanKostnad: 0, saknas: 0, variantbild: id === "p001" ? "ej_rattad" : "rattad" }),
    });
    expect(r.produkter.map((p) => p.id)).toEqual(["p001"]);
    const text = JSON.stringify(r);
    expect(text).not.toMatch(/FP-|aosom:|sku/i);
  });

  it("utkast: false hoppar dolda produkter i planen", async () => {
    const { m, k } = enPlan(2);
    k[1] = { ...k[1], synlig: false };
    const r = await korVarukostnad(wixIngen, m, k, { deadline: framtid(), utkast: false });
    expect(r.totalt).toBe(1);
  });
});
