import { describe, it, expect } from "vitest";
import { korSammanslagning, fargSlug, type SammanslagningDeps, type SammanslagningInput } from "./sammanslagning";
import { aosomArtikelbild, aosomArtikelForTask } from "./artiklar";
import { synligtSaldo } from "./sync";
import type { AosomRow } from "./feed";
import type { ProductMappingRecord } from "../store";
import type { WixAnrop } from "../polish/skrivplan";

// Syntetiska artikelnummer — riktiga får aldrig stå i en testfil, repot är
// publikt. A-1 är sidans artikel, G-7 utkastets.

type Obj = Record<string, unknown>;

function rad(sku: string, over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku,
    name: `Produkt ${sku}`,
    url: "",
    imageUrls: [],
    category: "",
    color: "", material: "", size: "", packageSize: "",
    weightKg: 5,
    descriptionHtml: "", bulletsHtml: "",
    qty: 23,
    normalPriceEur: 100,
    wholesaleEur: 40,
    seFreightEur: 20,
    rowIndex: 1,
    ...over,
  };
}

function mappning(artikel: string, wixProductId: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplierProductId: `aosom:${artikel}`,
    supplier: "aosom",
    wixProductId,
    variants: [{
      supplierVariantId: artikel,
      sku: wixProductId === "sida" ? "FP-stol" : "FP-stuhl-grau",
      wixVariantId: wixProductId === "sida" ? "var-sida" : "var-utkast",
      choices: {},
      costUsd: 50,
      landedCostSek: 525,
      grossSek: wixProductId === "sida" ? 699 : 649,
    }],
    ...over,
  };
}

/** En låtsas-Wix med två produkter och deras lager, som svarar som V3 gör. */
function fejkWix(over: { sida?: Obj; utkast?: Obj } = {}) {
  const produkter: Record<string, Obj> = {
    sida: {
      id: "sida",
      revision: "5",
      visible: true,
      name: "Kontorsstol med nackstöd",
      plainDescription: "<p>En stol.</p>",
      options: [],
      variantsInfo: { variants: [{ id: "var-sida", visible: true, sku: "FP-stol", choices: [], price: { actualPrice: { amount: "699" } }, inventoryStatus: { inStock: true } }] },
      media: { itemsInfo: { items: [{ id: "bild-s1", altText: "Stol framifrån" }, { id: "bild-s2", altText: "Stol från sidan" }] } },
      ...over.sida,
    },
    utkast: {
      id: "utkast",
      revision: "2",
      visible: false,
      name: "Bürostuhl grau",
      options: [],
      variantsInfo: { variants: [{ id: "var-utkast", visible: true, sku: "FP-stuhl-grau", choices: [], price: { actualPrice: { amount: "649" } } }] },
      media: { itemsInfo: { items: [{ id: "bild-u1", altText: "Bürostuhl" }, { id: "bild-u2", altText: "Bürostuhl" }] } },
      ...over.utkast,
    },
  };
  const lager: Record<string, { id: string; variantId: string; quantity: number }[]> = {
    sida: [{ id: "inv-sida", variantId: "var-sida", quantity: 40 }],
    utkast: [{ id: "inv-utkast", variantId: "var-utkast", quantity: 12 }],
  };
  const anrop: { metod: string; sokvag: string; kropp?: unknown }[] = [];
  const fel: { [nyckel: string]: number } = {};
  const kast = (nyckel: string) => {
    if ((fel[nyckel] ?? 0) > 0) {
      fel[nyckel]--;
      throw new Error(`Wix 404: ${nyckel}`);
    }
  };
  const idAv = (sokvag: string) => decodeURIComponent(sokvag.split("?")[0].split("/").pop()!);
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    anrop.push({ metod, sokvag, kropp });
    if (metod === "GET" && sokvag.startsWith("/stores/v3/products/")) {
      const p = produkter[idAv(sokvag)];
      if (!p) throw new Error("Wix 404: finns inte");
      return { product: structuredClone(p) };
    }
    if (metod === "POST" && sokvag === "/stores/v3/inventory-items/query") {
      const id = ((kropp as Obj).query as { filter: { productId: string } }).filter.productId;
      return { inventoryItems: structuredClone(lager[id] ?? []) };
    }
    if (metod === "PATCH" && sokvag.startsWith("/stores/v3/products-with-inventory/")) {
      kast("varianter");
      const id = idAv(sokvag);
      const p = produkter[id];
      const k = (kropp as { product: Obj }).product;
      p.options = structuredClone(k.options);
      const varianter = ((k.variantsInfo as Obj).variants as Obj[]).map((v, i) => {
        const { inventoryItem, ...rest } = v;
        const vid = (v.id as string) ?? `var-ny-${i}`;
        const post = inventoryItem as { id?: string; quantity: number };
        const befintlig = lager[id].find((x) => x.id === post.id);
        if (befintlig) befintlig.quantity = post.quantity;
        else lager[id].push({ id: `inv-${vid}`, variantId: vid, quantity: post.quantity });
        return { ...rest, id: vid };
      });
      p.variantsInfo = { variants: varianter };
      p.revision = String(Number(p.revision) + 1);
      return { product: structuredClone(p) };
    }
    if (metod === "PATCH" && sokvag.startsWith("/stores/v3/products/")) {
      const id = idAv(sokvag);
      const p = produkter[id];
      const k = kropp as { product: Obj; fieldMask: { paths: string[] } };
      if (k.fieldMask.paths.includes("media")) {
        kast("bilder");
        p.media = structuredClone(k.product.media);
      } else {
        kast("koppling");
        p.options = structuredClone(k.product.options);
      }
      p.revision = String(Number(p.revision) + 1);
      return { product: structuredClone(p) };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, produkter, lager, anrop, fel };
}

function miljo(over: {
  wix?: ReturnType<typeof fejkWix>;
  mappningar?: ProductMappingRecord[];
  feed?: AosomRow[];
  sparaFaller?: number;
} = {}) {
  const w = over.wix ?? fejkWix();
  const rader = new Map<string, ProductMappingRecord>();
  for (const m of over.mappningar ?? [mappning("A-1", "sida"), mappning("G-7", "utkast", { draftStatus: "pending_review", needsAiPolish: true })]) {
    rader.set(m.wixProductId, m);
  }
  let sparaFaller = over.sparaFaller ?? 0;
  const deps: SammanslagningDeps = {
    wix: w.wix,
    getMapping: async (id) => structuredClone(rader.get(id) ?? null),
    listMappings: async () => [...rader.values()].map((m) => structuredClone(m)),
    saveMapping: async (m) => {
      if (sparaFaller > 0) {
        sparaFaller--;
        throw new Error("databasen svarade inte");
      }
      rader.set(m.wixProductId, structuredClone(m));
    },
    fetchFeed: async () => over.feed ?? [rad("A-1", { qty: 43 }), rad("G-7", { qty: 23 })],
    vanta: async () => {},
  };
  return { deps, rader, w };
}

const PAR: SammanslagningInput = { behall: "sida", utkast: "utkast", fargBehall: "Svart", fargUtkast: "Grå" };
const patchar = (w: ReturnType<typeof fejkWix>) => w.anrop.filter((a) => a.metod === "PATCH");

describe("färgsammanslagning — planen", () => {
  it("torrkörning är default och skriver ingenting", async () => {
    const { deps, rader, w } = miljo();
    const svar = await korSammanslagning(PAR, deps);
    expect(svar.ok).toBe(true);
    expect(svar.torrkorning).toBe(true);
    expect(patchar(w)).toEqual([]);
    expect(rader.get("sida")!.variants).toHaveLength(1);
    expect(svar.plan).toMatchObject({
      tillstand: "ny",
      hinder: [],
      prisBehall: 699,
      prisUtkast: 649,
      saldoBehall: 40,
      saldoUtkast: synligtSaldo(23),
      skuBehall: "FP-stol",
      skuUtkast: "FP-stol-gra",
      bilderBehall: 2,
      bilderUtkast: 1,
    });
  });

  it("☠️ svaret bär aldrig ett artikelnummer eller en kostnad — det går till en publik logg", async () => {
    for (const apply of [false, true]) {
      const { deps } = miljo();
      const text = JSON.stringify(await korSammanslagning(PAR, deps, { apply }));
      expect(text).not.toMatch(/A-1|G-7/);
      expect(text).not.toMatch(/525|landed|costUsd/);
    }
  });

  it.each([
    ["behall_ej_publicerad", { wix: fejkWix({ sida: { visible: false } }) }],
    ["utkast_publicerat", { wix: fejkWix({ utkast: { visible: true } }) }],
    ["namnet_bar_farg", { wix: fejkWix({ sida: { name: "Kontorsstol med nackstöd, svart" } }) }],
    ["utkast_saknas_i_feeden", { feed: [rad("A-1")] }],
    ["utkast_skickas_inte_till_sverige", { feed: [rad("A-1"), rad("G-7", { seFreightEur: 999.9 })] }],
    ["behall_ej_aosom", { mappningar: [mappning("A-1", "sida", { supplier: "aliexpress", supplierProductId: "1005001" }), mappning("G-7", "utkast")] }],
    ["artikeln_upptagen", { mappningar: [mappning("A-1", "sida"), mappning("G-7", "utkast"), mappning("G-7", "annan")] }],
    ["behall_har_redan_optioner", { wix: fejkWix({ sida: { options: [{ name: "Storlek", choicesSettings: { choices: [{ name: "S" }] } }] } }) }],
  ])("hinder: %s", async (hinder, over) => {
    const { deps, w } = miljo(over as Parameters<typeof miljo>[0]);
    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(false);
    expect(svar.plan.hinder).toContain(hinder);
    expect(patchar(w)).toEqual([]);
  });

  it("hinder: samma färg, en ogiltig bild och en SKU i artikelnummerform", async () => {
    const { deps } = miljo();
    expect((await korSammanslagning({ ...PAR, fargUtkast: "svart" }, deps)).plan.hinder).toContain("farg_lika");
    expect((await korSammanslagning({ ...PAR, bilder: [3] }, deps)).plan.hinder).toContain("bilder_ogiltiga");
    expect((await korSammanslagning({ ...PAR, sku: "FP-abc-12345" }, deps)).plan.hinder).toContain("sku_ogiltig");
  });

  it("varnar när beskrivningen nämner sidans färg", async () => {
    const { deps } = miljo({ wix: fejkWix({ sida: { plainDescription: "<p>En svart stol.</p>" } }) });
    const svar = await korSammanslagning(PAR, deps);
    expect(svar.ok).toBe(true);
    expect(svar.plan.varningar.join(" ")).toMatch(/beskrivningen/);
  });

  it("fargSlug ger en ren ASCII-del till SKU:n", () => {
    expect(fargSlug("Grå")).toBe("gra");
    expect(fargSlug("Vit och grön")).toBe("vit-och-gron");
  });
});

describe("färgsammanslagning — skrivningen", () => {
  it("☠️ lägger till färgen, kopplar bilderna, mappar per variant och pensionerar utkastet", async () => {
    const { deps, rader, w } = miljo();
    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(true);

    const p = w.produkter.sida;
    expect(p.visible).toBe(true);
    const val = ((p.options as Obj[])[0].choicesSettings as { choices: Obj[] }).choices;
    expect(val.map((c) => [c.name, (c.linkedMedia as Obj[])[0].id])).toEqual([
      ["Svart", "bild-s1"],
      ["Grå", "bild-u1"],
    ]);
    const varianter = (p.variantsInfo as { variants: Obj[] }).variants;
    expect(varianter.map((v) => [v.sku, (v.price as { actualPrice: { amount: string } }).actualPrice.amount, v.visible])).toEqual([
      ["FP-stol", "699", true],
      ["FP-stol-gra", "649", true],
    ]);
    // Bara den valda bilden följer med, med svensk alt-text.
    expect(((p.media as Obj).itemsInfo as { items: Obj[] }).items.map((b) => [b.id, b.altText])).toEqual([
      ["bild-s1", "Stol framifrån"],
      ["bild-s2", "Stol från sidan"],
      ["bild-u1", "Kontorsstol med nackstöd i färgen grå"],
    ]);
    // Lagret sattes i samma skrivning som varianten.
    expect(w.lager.sida.map((x) => x.quantity)).toEqual([40, synligtSaldo(23)]);

    const sida = rader.get("sida")!;
    expect(sida.variants.map((v) => [v.supplierVariantId, v.sku, v.choices, v.aosomSyncedQty, v.grossSek])).toEqual([
      ["A-1", "FP-stol", { Färg: "Svart" }, 40, 699],
      ["G-7", "FP-stol-gra", { Färg: "Grå" }, synligtSaldo(23), 649],
    ]);
    expect(aosomArtikelbild(sida).typ).toBe("flera");
    const utkast = rader.get("utkast")!;
    expect(utkast.draftStatus).toBe("rejected");
    expect(utkast.needsAiPolish).toBe(false);
    expect(utkast.supplierProductId).toBe("");
  });

  it("en order på den nya färgen beställer utkastets artikel efteråt", async () => {
    const { deps, rader } = miljo();
    await korSammanslagning(PAR, deps, { apply: true });
    const sida = rader.get("sida")!;
    const gra = sida.variants[1].wixVariantId!;
    expect(aosomArtikelForTask({ wixVariantId: gra, variantChoices: {} }, sida)).toEqual({ artikel: "G-7" });
  });

  it("☠️ faller variantskrivningen rullas bilderna tillbaka och ingen mappning skrivs", async () => {
    const w = fejkWix();
    w.fel.varianter = 1;
    const { deps, rader } = miljo({ wix: w });
    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(false);
    expect(svar.fel).toMatch(/återställd/);
    expect(((w.produkter.sida.media as Obj).itemsInfo as { items: Obj[] }).items.map((b) => b.id)).toEqual(["bild-s1", "bild-s2"]);
    expect(rader.get("sida")!.variants).toHaveLength(1);
    expect(rader.get("utkast")!.draftStatus).toBe("pending_review");
  });

  it("en bildkoppling som faller först försöks igen", async () => {
    const w = fejkWix();
    w.fel.koppling = 2;
    const { deps } = miljo({ wix: w });
    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(true);
    const val = ((w.produkter.sida.options as Obj[])[0].choicesSettings as { choices: Obj[] }).choices;
    expect(val.every((c) => (c.linkedMedia as Obj[]).length === 1)).toBe(true);
  });

  it("☠️ föll mappningen: omkörningen ser att Wix är klart och gör bara resten", async () => {
    const { deps, rader, w } = miljo({ sparaFaller: 1 });
    await expect(korSammanslagning(PAR, deps, { apply: true })).rejects.toThrow(/databasen/);
    // Wix bär färgen, mappningen gör det inte — synken nollar den nya färgen
    // och beställningsfilen håller en order på den tills raden är mappad.
    expect(rader.get("sida")!.variants).toHaveLength(1);
    const variantskrivningar = () => w.anrop.filter((a) => a.sokvag.includes("products-with-inventory")).length;
    expect(variantskrivningar()).toBe(1);

    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(svar.plan.tillstand).toBe("wix_klar");
    expect(variantskrivningar()).toBe(1);
    expect(rader.get("sida")!.variants.map((v) => v.supplierVariantId)).toEqual(["A-1", "G-7"]);
    expect(rader.get("utkast")!.draftStatus).toBe("rejected");
  });

  it("en tredje körning är en no-op", async () => {
    const { deps, w } = miljo();
    await korSammanslagning(PAR, deps, { apply: true });
    const fore = patchar(w).length;
    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(svar.plan.tillstand).toBe("klar");
    expect(patchar(w).length).toBe(fore);
  });

  it("☠️ stämmer inte Wix efter skrivningen skrivs ingen mappning", async () => {
    const w = fejkWix();
    // Wix "tappar" synligheten på den nya varianten.
    const orig = w.wix;
    const { deps, rader } = miljo({ wix: { ...w, wix: async (metod, sokvag, kropp) => {
      const svar = await orig(metod, sokvag, kropp);
      if (metod === "PATCH" && sokvag.includes("products-with-inventory")) {
        const v = (w.produkter.sida.variantsInfo as { variants: Obj[] }).variants[1];
        v.visible = false;
      }
      return svar;
    } } });
    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(false);
    expect(svar.fel).toMatch(/mappningen skrevs INTE/);
    expect(rader.get("sida")!.variants).toHaveLength(1);
  });
});
