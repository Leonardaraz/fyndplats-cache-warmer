import { describe, expect, it } from "vitest";
import type { WixAnrop } from "../polish/skrivplan";
import {
  byggVariantbildKropp,
  forvantadBild,
  jamforForeEfter,
  refreshVariantMedia,
  variantbildLage,
  variantbildSteg,
} from "./variant-media";

type Obj = Record<string, unknown>;

const bild = (id: string) => ({ id, image: { id, url: `https://static.wixstatic.com/media/${id}` } });

/** Ett val med kopplade bilder. */
const val = (choiceId: string, name: string, bilder: string[] = []) => ({
  choiceId,
  name,
  ...(bilder.length ? { linkedMedia: bilder.map(bild) } : {}),
});

/** En variant som GET:en med VARIANT_OPTION_CHOICE_NAMES och MERCHANT_DATA visar den. */
function variant(id: string, val: Array<[string, string, string, string]>, over: Obj = {}): Obj {
  return {
    id,
    visible: true,
    sku: `FP-${id}`,
    choices: val.map(([optionId, choiceId, optionName, choiceName]) => ({
      optionChoiceIds: { optionId, choiceId },
      optionChoiceNames: { optionName, choiceName, renderType: "TEXT_CHOICES" },
    })),
    price: { actualPrice: { amount: "1499" } },
    media: bild("huvud"),
    physicalProperties: {},
    inventoryStatus: { inStock: true, preorderEnabled: false },
    ...over,
  };
}

/** En stol i tre färger, där alla varianter fastnat på huvudbilden. */
function stol(over: Obj = {}): Obj {
  return {
    id: "stol",
    revision: "29",
    name: "Kontorsstol",
    slug: "kontorsstol",
    visible: true,
    media: { main: bild("huvud") },
    options: [{
      id: "opt-farg",
      name: "Färg",
      optionRenderType: "TEXT_CHOICES",
      choicesSettings: {
        choices: [
          val("c-svart", "Svart", ["huvud", "svart-2"]),
          val("c-bla", "Blå", ["bla-1", "bla-2"]),
          val("c-rosa", "Rosa", ["rosa-1"]),
        ],
      },
    }],
    variantsInfo: {
      variants: [
        variant("v-svart", [["opt-farg", "c-svart", "Färg", "Svart"]], {
          revenueDetails: { cost: { amount: "525.00" }, profit: { amount: "974" }, profitMargin: 0.65 },
        }),
        variant("v-bla", [["opt-farg", "c-bla", "Färg", "Blå"]], {
          price: { actualPrice: { amount: "1299" }, compareAtPrice: { amount: "1799" } },
          barcode: "1234567890128",
        }),
        variant("v-rosa", [["opt-farg", "c-rosa", "Färg", "Rosa"]], {
          visible: false,
          physicalProperties: { weight: 12.5 },
        }),
      ],
    },
    ...over,
  };
}

/** Färg + storlek: bilderna sitter på båda optionerna. */
function jacka(): Obj {
  return {
    id: "jacka",
    revision: "4",
    visible: true,
    media: { main: bild("huvud") },
    options: [
      {
        id: "opt-farg",
        name: "Färg",
        choicesSettings: { choices: [val("c-rod", "Röd", ["rod-1", "rod-s", "rod-m"]), val("c-gron", "Grön", ["gron-1"])] },
      },
      {
        id: "opt-storlek",
        name: "Storlek",
        choicesSettings: { choices: [val("c-s", "S", ["rod-s", "storlek-s"]), val("c-m", "M", ["rod-m"]), val("c-l", "L")] },
      },
    ],
    variantsInfo: {
      variants: [
        // Storleken står först i varianten, men optionernas ordning avgör.
        variant("v-rod-s", [["opt-storlek", "c-s", "Storlek", "S"], ["opt-farg", "c-rod", "Färg", "Röd"]]),
        variant("v-rod-m", [["opt-farg", "c-rod", "Färg", "Röd"], ["opt-storlek", "c-m", "Storlek", "M"]]),
        variant("v-rod-l", [["opt-farg", "c-rod", "Färg", "Röd"], ["opt-storlek", "c-l", "Storlek", "L"]]),
        variant("v-gron-s", [["opt-farg", "c-gron", "Färg", "Grön"], ["opt-storlek", "c-s", "Storlek", "S"]]),
      ],
    },
  };
}

const varianterAv = (p: Obj) => (p.variantsInfo as { variants: Obj[] }).variants;
const vAv = (p: Obj, id: string) => varianterAv(p).find((v) => v.id === id)!;

describe("förväntad variantbild", () => {
  it("är första bilden i valets linkedMedia", () => {
    const p = stol();
    expect(forvantadBild(p, vAv(p, "v-svart"))).toEqual({ bild: "huvud", kalla: "val" });
    expect(forvantadBild(p, vAv(p, "v-bla"))).toEqual({ bild: "bla-1", kalla: "val" });
    expect(forvantadBild(p, vAv(p, "v-rosa"))).toEqual({ bild: "rosa-1", kalla: "val" });
  });

  it("saknar valet kopplade bilder gäller produktens huvudbild", () => {
    const p = stol();
    const o = (p.options as Obj[])[0].choicesSettings as { choices: Obj[] };
    delete o.choices[1].linkedMedia;
    expect(forvantadBild(p, vAv(p, "v-bla"))).toEqual({ bild: "huvud", kalla: "huvudbild" });
  });

  it("färg + storlek: första bilden i snittet, i den första optionens ordning", () => {
    const p = jacka();
    // Röd [rod-1, rod-s, rod-m] ∩ S [rod-s, storlek-s] = rod-s.
    expect(forvantadBild(p, vAv(p, "v-rod-s"))).toEqual({ bild: "rod-s", kalla: "snitt" });
    expect(forvantadBild(p, vAv(p, "v-rod-m"))).toEqual({ bild: "rod-m", kalla: "snitt" });
  });

  it("färg + storlek: bara en option har bilder → den optionens första", () => {
    const p = jacka();
    expect(forvantadBild(p, vAv(p, "v-rod-l"))).toEqual({ bild: "rod-1", kalla: "val" });
  });

  it("färg + storlek utan gemensam bild: ingen förväntan, rapporteras i stället för att gissas", () => {
    const p = jacka();
    expect(forvantadBild(p, vAv(p, "v-gron-s"))).toEqual({ bild: null, kalla: "inget_snitt" });
    const lage = variantbildLage(p);
    expect(lage.okanda).toEqual([{ variantId: "v-gron-s", namn: "Grön / S", skal: "inget_snitt" }]);
  });

  it("valen hittas på namn när varianten bara bär namn", () => {
    const p = stol();
    const v = vAv(p, "v-bla");
    v.choices = [{ optionChoiceNames: { optionName: "Färg", choiceName: "Blå" } }];
    expect(forvantadBild(p, v)).toEqual({ bild: "bla-1", kalla: "val" });
  });

  it("listar varianterna som står på fel bild", () => {
    expect(variantbildLage(stol()).avvikande).toEqual([
      { variantId: "v-bla", namn: "Blå", har: "huvud", vill: "bla-1" },
      { variantId: "v-rosa", namn: "Rosa", har: "huvud", vill: "rosa-1" },
    ]);
  });
});

describe("kroppen till products-with-inventory", () => {
  const kropp = byggVariantbildKropp(stol()) as { product: Obj };
  const varianter = (kropp.product.variantsInfo as { variants: Obj[] }).variants;

  it("bär valen BARA med namn — inga val-id", () => {
    for (const v of varianter) {
      for (const c of v.choices as Obj[]) {
        expect(Object.keys(c)).toEqual(["optionChoiceNames"]);
      }
    }
    expect(varianter[1].choices).toEqual([
      { optionChoiceNames: { optionName: "Färg", choiceName: "Blå", renderType: "TEXT_CHOICES" } },
    ]);
  });

  it("☠️ skickar inget lager och ingen variantbild, och ingen fältmask", () => {
    expect(Object.keys(kropp)).toEqual(["product"]);
    for (const v of varianter) {
      expect(v).not.toHaveProperty("inventoryItem");
      expect(v).not.toHaveProperty("media");
      expect(v).not.toHaveProperty("inventoryStatus");
    }
  });

  it("alla varianter följer med, med id", () => {
    expect(varianter.map((v) => v.id)).toEqual(["v-svart", "v-bla", "v-rosa"]);
  });

  it("☠️ kostnad, jämförpris och synlighet följer med oförändrade", () => {
    // Bara kostnaden: vinst och marginal räknas av Wix och är skrivskyddade.
    expect(varianter[0].revenueDetails).toEqual({ cost: { amount: "525.00" } });
    expect(varianter[1]).not.toHaveProperty("revenueDetails");
    expect(varianter[1].price).toEqual({ actualPrice: { amount: "1299" }, compareAtPrice: { amount: "1799" } });
    expect(varianter.map((v) => v.visible)).toEqual([true, true, false]);
  });

  it("SKU, streckkod och fysiska egenskaper följer med; saknad streckkod blir null", () => {
    expect(varianter.map((v) => v.sku)).toEqual(["FP-v-svart", "FP-v-bla", "FP-v-rosa"]);
    expect(varianter.map((v) => v.barcode)).toEqual([null, "1234567890128", null]);
    expect(varianter[2].physicalProperties).toEqual({ weight: 12.5 });
    expect(varianter[0].physicalProperties).toEqual({});
  });

  it("☠️ produktens synlighet, revision och optioner följer med ordagrant", () => {
    const p = stol({ visible: false });
    const k = byggVariantbildKropp(p) as { product: Obj };
    expect(k.product.visible).toBe(false);
    expect(k.product.revision).toBe("29");
    expect(k.product.id).toBe("stol");
    expect(k.product.options).toEqual(p.options);
  });

  it("kastar när valnamnen saknas (GET:en utan VARIANT_OPTION_CHOICE_NAMES)", () => {
    const p = stol();
    for (const v of varianterAv(p)) for (const c of v.choices as Obj[]) delete c.optionChoiceNames;
    expect(() => byggVariantbildKropp(p)).toThrow(/saknar valnamn/);
  });
});

describe("kontrollen före och efter", () => {
  const lager = [
    { id: "i1", variantId: "v-svart", quantity: 199, trackQuantity: true, availabilityStatus: "IN_STOCK", revision: "5" },
  ];

  it("variantens bild och revisionen får ändras, inget annat", () => {
    const fore = stol();
    const efter = stol({ revision: "30" });
    for (const v of varianterAv(efter)) v.media = bild("annan");
    expect(jamforForeEfter({ produkt: fore, lager }, { produkt: efter, lager })).toEqual([]);
  });

  it.each([
    ["pris", (p: Obj) => { (vAv(p, "v-bla").price as Obj).actualPrice = { amount: "1" }; }, /v-bla.*pris/],
    ["jämförpris", (p: Obj) => { delete (vAv(p, "v-bla").price as Obj).compareAtPrice; }, /jamforpris/],
    ["kostnad", (p: Obj) => { delete vAv(p, "v-svart").revenueDetails; }, /kostnad/],
    ["sku", (p: Obj) => { vAv(p, "v-rosa").sku = "x"; }, /sku/],
    ["variantens synlighet", (p: Obj) => { vAv(p, "v-rosa").visible = true; }, /visible/],
    ["fysiska egenskaper", (p: Obj) => { vAv(p, "v-rosa").physicalProperties = {}; }, /physicalProperties/],
    ["produktens synlighet", (p: Obj) => { p.visible = false; }, /produktens visible/],
    ["slug", (p: Obj) => { p.slug = "x"; }, /slug/],
    ["bildordning", (p: Obj) => {
      const c = ((p.options as Obj[])[0].choicesSettings as { choices: Obj[] }).choices[1];
      c.linkedMedia = [bild("bla-2"), bild("bla-1")];
    }, /optionerna/],
    ["variant-id", (p: Obj) => { vAv(p, "v-rosa").id = "ny"; }, /variant-id/],
  ])("fäller en ändring av %s", (_namn, andra, monster) => {
    const efter = stol({ revision: "30" });
    andra(efter);
    const rader = jamforForeEfter({ produkt: stol(), lager }, { produkt: efter, lager });
    expect(rader.join("; ")).toMatch(monster);
  });

  it("fäller en ändring av lagret, även bara revisionen", () => {
    const efter = [{ ...lager[0], revision: "6" }];
    expect(jamforForeEfter({ produkt: stol(), lager }, { produkt: stol(), lager: efter })).toEqual([
      "lagret (antal, spårning, status eller revision) ändrades",
    ]);
  });
});

/**
 * En låtsas-Wix som gör som V3: variantens bild räknas om ur valets första
 * kopplade bild bara när valen skickas enbart med namn.
 */
function fejkWix(start: Obj, over: { merchant403?: boolean; andraPris?: boolean } = {}) {
  const p: Obj = structuredClone(start);
  const lager = [
    { id: "i-svart", variantId: "v-svart", quantity: 199, trackQuantity: true, availabilityStatus: "IN_STOCK", revision: "5" },
    { id: "i-bla", variantId: "v-bla", quantity: 133, trackQuantity: true, availabilityStatus: "IN_STOCK", revision: "7" },
  ];
  const anrop: { metod: string; sokvag: string; kropp?: unknown }[] = [];
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    anrop.push({ metod, sokvag, kropp });
    if (metod === "GET") {
      if (over.merchant403 && sokvag.includes("MERCHANT_DATA")) throw new Error("Wix 403: NO_PERMISSION_TO_READ_MERCHANT_DATA");
      const ut = structuredClone(p);
      if (!sokvag.includes("MERCHANT_DATA")) for (const v of varianterAv(ut)) delete v.revenueDetails;
      return { product: ut };
    }
    if (metod === "POST" && sokvag === "/stores/v3/inventory-items/query") return { inventoryItems: structuredClone(lager) };
    if (metod === "PATCH" && sokvag.startsWith("/stores/v3/products-with-inventory/")) {
      const k = (kropp as { product: Obj }).product;
      if (k.revision !== p.revision) throw new Error("Wix 409: revision");
      const gamla = varianterAv(p);
      p.variantsInfo = {
        variants: ((k.variantsInfo as Obj).variants as Obj[]).map((v) => {
          const g = gamla.find((x) => x.id === v.id)!;
          const choices = (g.choices as Obj[]);
          const baraNamn = (v.choices as Obj[]).every((c) => !c.optionChoiceIds);
          const ny: Obj = { ...g, ...v, choices, inventoryStatus: g.inventoryStatus };
          if (baraNamn) ny.media = bild(forvantadBild(p, g).bild ?? "huvud");
          if (over.andraPris) ny.price = { actualPrice: { amount: "1" } };
          return ny;
        }),
      };
      p.revision = String(Number(p.revision) + 1);
      return { product: structuredClone(p) };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, p, anrop, lager };
}

const vanta = async () => {};

describe("refreshVariantMedia", () => {
  it("rättar varianterna, läser om och ser att inget annat ändrats", async () => {
    const w = fejkWix(stol());
    const u = await refreshVariantMedia(w.wix, "stol", { vanta });
    expect(u.status).toBe("rattad");
    expect(u.avvikande.map((a) => a.variantId)).toEqual(["v-bla", "v-rosa"]);
    expect(variantbildLage(w.p).avvikande).toEqual([]);
    const skriv = w.anrop.filter((a) => a.metod === "PATCH");
    expect(skriv).toHaveLength(1);
    expect(skriv[0].sokvag).toBe("/stores/v3/products-with-inventory/stol");
    expect(variantbildSteg(u)).toEqual({ rad: "variantbilder: 2 rättade", stopp: false });
  });

  it("skriver ingenting när alla redan står rätt, och läser då inte handelsdata", async () => {
    const p = stol();
    for (const v of varianterAv(p)) v.media = bild(forvantadBild(p, v).bild!);
    const w = fejkWix(p);
    expect((await refreshVariantMedia(w.wix, "stol", { vanta })).status).toBe("ratt");
    expect(w.anrop.filter((a) => a.metod !== "GET")).toEqual([]);
    expect(w.anrop.some((a) => a.sokvag.includes("MERCHANT_DATA"))).toBe(false);
  });

  it("torrt: listar, skriver ingenting", async () => {
    const w = fejkWix(stol());
    const u = await refreshVariantMedia(w.wix, "stol", { torr: true, vanta });
    expect(u.status).toBe("torr");
    expect(u.avvikande).toHaveLength(2);
    expect(w.anrop.every((a) => a.metod === "GET")).toBe(true);
  });

  it("☠️ ett utkast skrivs inte utan `utkast: true`", async () => {
    const w = fejkWix(stol({ visible: false }));
    const u = await refreshVariantMedia(w.wix, "stol", { vanta });
    expect(u.status).toBe("utkast_hoppat");
    expect(w.anrop.every((a) => a.metod === "GET")).toBe(true);

    const med = await refreshVariantMedia(w.wix, "stol", { utkast: true, vanta });
    expect(med.status).toBe("rattad");
    expect(w.p.visible).toBe(false);
  });

  it("☠️ får nyckeln inte läsa varukostnaden skrivs ingenting", async () => {
    const w = fejkWix(stol(), { merchant403: true });
    const u = await refreshVariantMedia(w.wix, "stol", { vanta });
    expect(u.status).toBe("fel");
    expect(u.fel).toMatch(/MERCHANT_DATA/);
    expect(w.anrop.filter((a) => a.metod === "PATCH")).toEqual([]);
  });

  it("☠️ ändrade skrivningen något annat än bilden: avvikelse, och anroparen ska stanna", async () => {
    const w = fejkWix(stol(), { andraPris: true });
    const u = await refreshVariantMedia(w.wix, "stol", { vanta });
    expect(u.status).toBe("avvikelse");
    expect((u.avvikelser ?? []).join("; ")).toMatch(/pris ändrades/);
    expect(variantbildSteg(u).stopp).toBe(true);
  });

  it("en produkt med en variant lämnas", async () => {
    const p = stol();
    (p.variantsInfo as { variants: Obj[] }).variants = [varianterAv(p)[0]];
    const w = fejkWix(p);
    expect((await refreshVariantMedia(w.wix, "stol", { vanta })).status).toBe("en_variant");
  });

  it("kastar aldrig: ett läsfel blir `fel`", async () => {
    const wix: WixAnrop = async () => { throw new Error("Wix 500"); };
    const u = await refreshVariantMedia(wix, "stol", { vanta });
    expect(u.status).toBe("fel");
    expect(variantbildSteg(u).stopp).toBe(false);
  });
});
