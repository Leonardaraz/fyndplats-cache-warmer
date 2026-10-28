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

/**
 * En soptunna: Storlek först i optionerna och i varje variant, och BÅDA optionerna
 * har kopplade bilder utan en enda gemensam (varje bild har en ägare): färgens
 * foton för sig, storlekens måttkort för sig. Så såg soptunnan c841717c ut
 * 2026-10-23, och så ser de 16 sidor ut som rättades samma natt.
 */
function soptunna(over: Obj = {}): Obj {
  const v = (id: string, s: [string, string], f: [string, string]) =>
    variant(id, [["opt-storlek", s[0], "Storlek", s[1]], ["opt-farg", f[0], "Färg", f[1]]]);
  return {
    id: "tunna",
    revision: "39",
    name: "Soptunna",
    slug: "soptunna",
    visible: true,
    media: { main: bild("huvud") },
    options: [
      {
        id: "opt-storlek",
        name: "Storlek",
        choicesSettings: { choices: [val("c-45", "45 liter", ["kort-45"]), val("c-60", "60 liter", ["kort-60"])] },
      },
      {
        id: "opt-farg",
        name: "Färg",
        choicesSettings: { choices: [val("c-svart", "Svart", ["svart-1", "svart-2"]), val("c-silver", "Silver", ["silver-1", "silver-2"])] },
      },
    ],
    variantsInfo: {
      variants: [
        v("v-45-svart", ["c-45", "45 liter"], ["c-svart", "Svart"]),
        v("v-45-silver", ["c-45", "45 liter"], ["c-silver", "Silver"]),
        v("v-60-svart", ["c-60", "60 liter"], ["c-svart", "Svart"]),
        v("v-60-silver", ["c-60", "60 liter"], ["c-silver", "Silver"]),
      ],
    },
    ...over,
  };
}

/** Två optioner utan färg (Storlek och Modell), med bilder på båda och ingen gemensam. */
function modeller(): Obj {
  const v = (id: string, m: [string, string], s: [string, string]) =>
    variant(id, [["opt-modell", m[0], "Modell", m[1]], ["opt-storlek", s[0], "Storlek", s[1]]]);
  return {
    id: "modeller",
    revision: "3",
    visible: true,
    media: { main: bild("huvud") },
    options: [
      { id: "opt-storlek", name: "Storlek", choicesSettings: { choices: [val("c-s", "S", ["s-1"]), val("c-l", "L", ["l-1"])] } },
      { id: "opt-modell", name: "Modell", choicesSettings: { choices: [val("c-a", "A", ["a-1"]), val("c-b", "B", ["b-1"])] } },
    ],
    variantsInfo: {
      variants: [
        v("v-a-s", ["c-a", "A"], ["c-s", "S"]),
        v("v-b-l", ["c-b", "B"], ["c-l", "L"]),
      ],
    },
  };
}

const varianterAv = (p: Obj) => (p.variantsInfo as { variants: Obj[] }).variants;
const vAv = (p: Obj, id: string) => varianterAv(p).find((v) => v.id === id)!;
/** Variantens val i den ordning de ligger (optionsnamn=valnamn). */
const valOrdning = (v: Obj) =>
  (v.choices as Obj[]).map((c) => {
    const n = c.optionChoiceNames as Obj;
    return `${n.optionName}=${n.choiceName}`;
  });

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

  it("☠️ överlappande listor: färgens första bild, ingen skärning (Wix räknar ingen)", () => {
    const p = jacka();
    // Röd [rod-1, rod-s, rod-m] och S [rod-s, storlek-s] har rod-s gemensamt, men Wix tar första
    // bilden hos första valet. Mätt 2026-10-23 på en dold testprodukt: färgen först gav färgens
    // första foto på alla fyra varianter, aldrig skärningen. Förut förväntade motorn rod-s.
    expect(forvantadBild(p, vAv(p, "v-rod-s"))).toEqual({ bild: "rod-1", kalla: "forsta_val" });
    expect(forvantadBild(p, vAv(p, "v-rod-m"))).toEqual({ bild: "rod-1", kalla: "forsta_val" });
  });

  it("färg + storlek: bara en option har bilder → den optionens första", () => {
    const p = jacka();
    expect(forvantadBild(p, vAv(p, "v-rod-l"))).toEqual({ bild: "rod-1", kalla: "val" });
  });

  it("färg + storlek utan gemensam bild: färgens första bild (varje bild har EN ägare)", () => {
    const p = jacka();
    // Grön [gron-1] och S [rod-s, storlek-s] har inget gemensamt. Färgen räknas först, som Wix
    // gör när varianten skrivs med färgen först (mätt 2026-10-23).
    expect(forvantadBild(p, vAv(p, "v-gron-s"))).toEqual({ bild: "gron-1", kalla: "forsta_val" });
    const lage = variantbildLage(p);
    expect(lage.okanda).toEqual([]);
    expect(lage.avvikande.find((a) => a.variantId === "v-gron-s")).toEqual({
      variantId: "v-gron-s",
      namn: "Grön / S",
      har: "huvud",
      vill: "gron-1",
    });
  });

  it("☠️ en bild per ägare (soptunnan): färgens första foto, inte `inget_snitt` som förut", () => {
    const p = soptunna();
    // Storlek står först i optionerna och i varje variant, men färgen räknas först.
    expect(forvantadBild(p, vAv(p, "v-45-svart"))).toEqual({ bild: "svart-1", kalla: "forsta_val" });
    expect(forvantadBild(p, vAv(p, "v-45-silver"))).toEqual({ bild: "silver-1", kalla: "forsta_val" });
    expect(forvantadBild(p, vAv(p, "v-60-svart"))).toEqual({ bild: "svart-1", kalla: "forsta_val" });
    expect(forvantadBild(p, vAv(p, "v-60-silver"))).toEqual({ bild: "silver-1", kalla: "forsta_val" });
    // Förut gav alla fyra "ingen förväntan", så svepet kunde varken se eller rätta dem.
    const lage = variantbildLage(p);
    expect(lage.okanda).toEqual([]);
    expect(lage.avvikande.map((a) => a.variantId)).toEqual(["v-45-svart", "v-45-silver", "v-60-svart", "v-60-silver"]);
  });

  it("färgen räknas först oavsett var i varianten den ligger", () => {
    const p = soptunna();
    const v = vAv(p, "v-45-silver");
    v.choices = [...(v.choices as Obj[])].reverse(); // Färg först i varianten
    expect(forvantadBild(p, v)).toEqual({ bild: "silver-1", kalla: "forsta_val" });
  });

  it("utan färgoption gäller optionernas ordning: den första optionens första bild", () => {
    const p = modeller();
    // Modell står först i varianten men Storlek först bland optionerna.
    expect(forvantadBild(p, vAv(p, "v-a-s"))).toEqual({ bild: "s-1", kalla: "forsta_val" });
    expect(forvantadBild(p, vAv(p, "v-b-l"))).toEqual({ bild: "l-1", kalla: "forsta_val" });
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

  it("en sida med en option lämnar valordningen orörd", () => {
    const p = stol();
    expect(varianter.map((v) => (v.choices as Obj[]).length)).toEqual([1, 1, 1]);
    expect(byggVariantbildKropp(p)).toEqual(kropp);
  });
});

describe("kroppen när flera av variantens val har kopplade bilder", () => {
  const namnen = (v: Obj, falt: "optionName" | "choiceName") =>
    (v.choices as Obj[]).map((c) => (c.optionChoiceNames as Obj)[falt]);
  const kropp = (p: Obj) => (byggVariantbildKropp(p) as { product: Obj }).product;
  const varianter = (p: Obj) => (kropp(p).variantsInfo as { variants: Obj[] }).variants;

  it("☠️ lägger färgen först i VARJE variant, så Wix räknar variantens bild ur färgens första foto", () => {
    const vs = varianter(soptunna());
    for (const v of vs) expect(namnen(v, "optionName")).toEqual(["Färg", "Storlek"]);
    expect(namnen(vs[1], "choiceName")).toEqual(["Silver", "45 liter"]);
    expect(namnen(vs[2], "choiceName")).toEqual(["Svart", "60 liter"]);
  });

  it("optionerna skickas ordagrant: bara variantens egen valordning ändras", () => {
    const p = soptunna();
    expect(kropp(p).options).toEqual(p.options);
    expect((kropp(p).options as Obj[]).map((o) => o.name)).toEqual(["Storlek", "Färg"]);
  });

  it("valen bär fortfarande bara namn", () => {
    for (const v of varianter(soptunna())) for (const c of v.choices as Obj[]) expect(Object.keys(c)).toEqual(["optionChoiceNames"]);
  });

  it("☠️ har bara EN option bilder rörs valordningen inte", () => {
    const p = soptunna();
    for (const o of p.options as Obj[]) {
      if (o.name !== "Storlek") continue;
      for (const c of (o.choicesSettings as { choices: Obj[] }).choices) delete c.linkedMedia;
    }
    // Storleken har inga bilder: ordningen avgör ingenting och ska stå kvar som den var.
    for (const v of varianter(p)) expect(namnen(v, "optionName")).toEqual(["Storlek", "Färg"]);
  });

  it("utan färgoption läggs valen i optionernas ordning", () => {
    for (const v of varianter(modeller())) expect(namnen(v, "optionName")).toEqual(["Storlek", "Modell"]);
  });

  it("☠️ överlappande listor ger också färgen först, i varje variant (jackan: S × Röd delar rod-s)", () => {
    // Skärningen avgör ingenting hos Wix, bara valens ordning: se `forvantadBild`.
    for (const v of varianter(jacka())) expect(namnen(v, "optionName")).toEqual(["Färg", "Storlek"]);
  });

  it("ett val som inte finns bland optionerna hamnar sist, och resten behåller sin ordning", () => {
    const p = soptunna();
    const v = vAv(p, "v-45-silver");
    v.choices = [
      { optionChoiceIds: { optionId: "okand", choiceId: "okant" }, optionChoiceNames: { optionName: "Okänd", choiceName: "X", renderType: "TEXT_CHOICES" } },
      ...(v.choices as Obj[]),
    ];
    const ut = varianter(p).find((x) => x.id === "v-45-silver")!;
    expect(namnen(ut, "optionName")).toEqual(["Färg", "Storlek", "Okänd"]);
  });

  it("☠️ allt annat än valens ordning är oförändrat: id, pris, SKU och synlighet följer med", () => {
    const p = soptunna();
    vAv(p, "v-60-silver").visible = false;
    const vs = varianter(p);
    expect(vs.map((v) => v.id)).toEqual(["v-45-svart", "v-45-silver", "v-60-svart", "v-60-silver"]);
    expect(vs.map((v) => v.sku)).toEqual(["FP-v-45-svart", "FP-v-45-silver", "FP-v-60-svart", "FP-v-60-silver"]);
    expect(vs.map((v) => v.visible)).toEqual([true, true, true, false]);
    expect(vs[0].price).toEqual({ actualPrice: { amount: "1499" } });
    for (const v of vs) expect(v).not.toHaveProperty("media");
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

  it("☠️ valens ordning på en variant får ändras (färgen först), men inte vilka val varianten har", () => {
    const fore = soptunna();
    const omlagd = soptunna({ revision: "40" });
    for (const v of varianterAv(omlagd)) v.choices = [...(v.choices as Obj[])].reverse();
    expect(jamforForeEfter({ produkt: fore, lager }, { produkt: omlagd, lager })).toEqual([]);

    // Ett annat val på en variant är en ändring, hur det än ligger.
    const annat = soptunna({ revision: "40" });
    vAv(annat, "v-45-silver").choices = [...(vAv(soptunna(), "v-45-svart").choices as Obj[])].reverse();
    expect(jamforForeEfter({ produkt: fore, lager }, { produkt: annat, lager }).join("; ")).toMatch(/v-45-sil.*val/);

    // Och ett val som försvunnit också.
    const kortare = soptunna({ revision: "40" });
    vAv(kortare, "v-60-svart").choices = (vAv(kortare, "v-60-svart").choices as Obj[]).slice(0, 1);
    expect(jamforForeEfter({ produkt: fore, lager }, { produkt: kortare, lager }).join("; ")).toMatch(/v-60-sva.*val/);
  });
});

/**
 * En låtsas-Wix som gör som V3 (mätt på dolda testprodukter 2026-10-23):
 *  - variantens bild räknas om bara när valen skickas enbart med namn,
 *  - den blir första bilden hos det FÖRSTA valet i variantens egen valordning
 *    (som den skrevs) som har kopplade bilder, annars produktens huvudbild,
 *  - valen lagras i den ordning de skrevs.
 * `ingenOmrakning` låtsas att Wix lagrar ordningen men inte räknar om bilden.
 */
function fejkWix(start: Obj, over: { merchant403?: boolean; andraPris?: boolean; ingenOmrakning?: boolean } = {}) {
  const p: Obj = structuredClone(start);
  const wixBild = (choices: Obj[]): string => {
    for (const c of choices) {
      const ids = c.optionChoiceIds as Obj;
      const option = (p.options as Obj[]).find((o) => o.id === ids.optionId);
      const valet = (((option?.choicesSettings as Obj | undefined)?.choices ?? []) as Obj[]).find((x) => x.choiceId === ids.choiceId);
      const forsta = (valet?.linkedMedia as Obj[] | undefined)?.[0];
      if (forsta) return String(forsta.id);
    }
    return String(((p.media as Obj).main as Obj).id);
  };
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
          const skrivna = v.choices as Obj[];
          const baraNamn = skrivna.every((c) => !c.optionChoiceIds);
          // Namn-skrivningen lagras i skriven ordning, med både id och namn som GET:en visar dem.
          const choices = baraNamn
            ? skrivna.map((c) => {
              const n = c.optionChoiceNames as Obj;
              return (g.choices as Obj[]).find((x) => {
                const gn = x.optionChoiceNames as Obj;
                return gn.optionName === n.optionName && gn.choiceName === n.choiceName;
              })!;
            })
            : (g.choices as Obj[]);
          const ny: Obj = { ...g, ...v, choices, inventoryStatus: g.inventoryStatus };
          if (baraNamn && !over.ingenOmrakning) ny.media = bild(wixBild(choices));
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

  it("☠️ ett utkast rättas och förblir utkast; `utkast: false` hoppar det", async () => {
    const w = fejkWix(stol({ visible: false }));
    const utan = await refreshVariantMedia(w.wix, "stol", { utkast: false, vanta });
    expect(utan.status).toBe("utkast_hoppat");
    expect(w.anrop.every((a) => a.metod === "GET")).toBe(true);

    const med = await refreshVariantMedia(w.wix, "stol", { vanta });
    expect(med.status).toBe("rattad");
    expect(w.p.visible).toBe(false);
    const kropp = w.anrop.find((a) => a.metod === "PATCH")!.kropp as { product: Obj };
    expect(kropp.product.visible).toBe(false);
  });

  it("☠️ publicerade skrivningen ett utkast: avvikelse och stopp", async () => {
    const w = fejkWix(stol({ visible: false }));
    const inner = w.wix;
    const wix: WixAnrop = async (m, v, k) => {
      const svar = await inner(m, v, k);
      if (m === "PATCH") w.p.visible = true;
      return svar;
    };
    const u = await refreshVariantMedia(wix, "stol", { vanta });
    expect(u.status).toBe("avvikelse");
    expect((u.avvikelser ?? []).join("; ")).toMatch(/produktens visible/);
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

  it("☠️ en tvåaxlig sida med en ägare per bild rättas: färgen först, och Wix räknar fram färgens foto (soptunnan)", async () => {
    const w = fejkWix(soptunna());
    const u = await refreshVariantMedia(w.wix, "tunna", { vanta });
    expect(u.status).toBe("rattad");
    expect(u.okanda).toEqual([]);
    expect(u.avvikande.map((a) => a.variantId)).toEqual(["v-45-svart", "v-45-silver", "v-60-svart", "v-60-silver"]);
    const media = (id: string) => (vAv(w.p, id).media as Obj).id;
    expect(media("v-45-svart")).toBe("svart-1");
    expect(media("v-45-silver")).toBe("silver-1");
    expect(media("v-60-svart")).toBe("svart-1");
    expect(media("v-60-silver")).toBe("silver-1");
    // Färgen ligger först i varje variant. Optionerna, galleriet och länkarna är orörda.
    for (const v of varianterAv(w.p)) expect(valOrdning(v)[0]).toMatch(/^Färg=/);
    expect((w.p.options as Obj[]).map((o) => o.name)).toEqual(["Storlek", "Färg"]);
    expect(w.p.options).toEqual(soptunna().options);
    expect(variantbildSteg(u)).toEqual({ rad: "variantbilder: 4 rättade", stopp: false });
    // En omkörning ser att allt är rätt och skriver ingenting.
    const igen = await refreshVariantMedia(w.wix, "tunna", { vanta });
    expect(igen.status).toBe("ratt");
    expect(w.anrop.filter((a) => a.metod === "PATCH")).toHaveLength(1);
  });

  it("en sida som variantbild-farg.js redan rättat står rätt och skrivs inte", async () => {
    const p = soptunna();
    for (const v of varianterAv(p)) {
      v.choices = [...(v.choices as Obj[])].reverse();
      v.media = bild(forvantadBild(p, v).bild!);
    }
    const w = fejkWix(p);
    expect((await refreshVariantMedia(w.wix, "tunna", { vanta })).status).toBe("ratt");
    expect(w.anrop.filter((a) => a.metod !== "GET")).toEqual([]);
  });

  it("☠️ räknar Wix inte om bilden efter skrivningen blir det `ej_rattad` (ingen ny skrivning i samma körning)", async () => {
    const w = fejkWix(soptunna(), { ingenOmrakning: true });
    const u = await refreshVariantMedia(w.wix, "tunna", { vanta });
    expect(u.status).toBe("ej_rattad");
    expect(u.avvikande).toHaveLength(4);
    expect(w.anrop.filter((a) => a.metod === "PATCH")).toHaveLength(1);
    expect(variantbildSteg(u).stopp).toBe(false);
  });

  it("☠️ överlappande listor: Wix tar färgens första bild, inte skärningen, och sidan blir rätt efter EN skrivning", async () => {
    const w = fejkWix(jacka());
    const u = await refreshVariantMedia(w.wix, "jacka", { vanta });
    expect(u.status).toBe("rattad");
    const media = (id: string) => (vAv(w.p, id).media as Obj).id;
    // Röd × S delar rod-s: skärningen hade gett rod-s, Wix ger färgens första.
    expect(media("v-rod-s")).toBe("rod-1");
    expect(media("v-rod-m")).toBe("rod-1");
    expect(media("v-rod-l")).toBe("rod-1");
    expect(media("v-gron-s")).toBe("gron-1");
    expect((await refreshVariantMedia(w.wix, "jacka", { vanta })).status).toBe("ratt");
    expect(w.anrop.filter((a) => a.metod === "PATCH")).toHaveLength(1);
  });

  it("utan färgoption rättas sidan efter optionernas ordning", async () => {
    const w = fejkWix(modeller());
    const u = await refreshVariantMedia(w.wix, "modeller", { vanta });
    expect(u.status).toBe("rattad");
    expect((vAv(w.p, "v-a-s").media as Obj).id).toBe("s-1");
    expect((vAv(w.p, "v-b-l").media as Obj).id).toBe("l-1");
    for (const v of varianterAv(w.p)) expect(valOrdning(v)[0]).toMatch(/^Storlek=/);
    expect((await refreshVariantMedia(w.wix, "modeller", { vanta })).status).toBe("ratt");
  });

  it("kastar aldrig: ett läsfel blir `fel`", async () => {
    const wix: WixAnrop = async () => { throw new Error("Wix 500"); };
    const u = await refreshVariantMedia(wix, "stol", { vanta });
    expect(u.status).toBe("fel");
    expect(variantbildSteg(u).stopp).toBe(false);
  });
});

/**
 * Efter en prisskrivning (`updateV3VariantPrices`) är sidan i läget Wix lämnar den i: priset är nytt och
 * variantbilden nollställd. Läsningen släpar, så första GET:en kan visa produkten FÖRE prisskrivningen.
 */
describe("refreshVariantMedia direkt efter en prisskrivning (minRevision)", () => {
  /** Produkten som Wix har den efter prisskrivningen: revision 30, Blå sänkt från 1 299 till 1 199 kr. */
  function efterPris(): Obj {
    const p = stol();
    p.revision = "30";
    (vAv(p, "v-bla").price as Obj).actualPrice = { amount: "1199" };
    return p;
  }

  /** Låtsas-Wix vars första `antal` läsningar visar produkten som den var FÖRE prisskrivningen. */
  function slapar(antal: number) {
    const w = fejkWix(efterPris());
    const gammal = stol();
    let lasningar = 0;
    const wix: WixAnrop = async (metod, sokvag, kropp) => {
      if (metod === "GET" && lasningar < antal) {
        lasningar++;
        const ut = structuredClone(gammal);
        if (!sokvag.includes("MERCHANT_DATA")) for (const v of varianterAv(ut)) delete v.revenueDetails;
        return { product: ut };
      }
      return w.wix(metod, sokvag, kropp);
    };
    return { ...w, wix };
  }

  it("☠️ en läsning som släpar väntas ut: PATCH-kroppen bär det NYA priset, aldrig det gamla", async () => {
    const w = slapar(2);
    const u = await refreshVariantMedia(w.wix, "stol", { vanta, minRevision: 30 });
    expect(u.status).toBe("rattad");
    const skriv = w.anrop.filter((a) => a.metod === "PATCH");
    expect(skriv).toHaveLength(1);
    const kropp = skriv[0].kropp as { product: { revision: string; variantsInfo: { variants: Obj[] } } };
    expect(kropp.product.revision).toBe("30");
    const bla = kropp.product.variantsInfo.variants.find((v) => v.id === "v-bla")!;
    expect((bla.price as Obj).actualPrice).toEqual({ amount: "1199" });
    expect((vAv(w.p, "v-bla").price as Obj).actualPrice).toEqual({ amount: "1199" });
    expect(variantbildLage(w.p).avvikande).toEqual([]);
  });

  it("☠️ ger läsningen aldrig upp den nya revisionen skrivs inget: optimistisk samtidighet fäller PATCH:en", async () => {
    // Varje läsning visar produkten FÖRE prisskrivningen. PATCH-kroppen bär då revision 29 medan Wix
    // har 30, och Wix avvisar den. Utan revisionen hade det gamla priset skrivits över det nya.
    const w = slapar(99);
    const u = await refreshVariantMedia(w.wix, "stol", { vanta, minRevision: 30 });
    expect(u.status).toBe("fel");
    expect(w.p.revision).toBe("30");
    expect((vAv(w.p, "v-bla").price as Obj).actualPrice).toEqual({ amount: "1199" });
    expect(variantbildLage(w.p).avvikande.length).toBeGreaterThan(0);
  });

  it("utan minRevision läses sidan en gång innan den bedöms, som förut", async () => {
    const w = fejkWix(stol());
    const u = await refreshVariantMedia(w.wix, "stol", { vanta });
    expect(u.status).toBe("rattad");
    // Bedömningen utan handelsdata, sedan före och efter skrivningen med.
    expect(w.anrop.filter((a) => a.metod === "GET" && !a.sokvag.includes("MERCHANT_DATA"))).toHaveLength(1);
    expect(w.anrop.filter((a) => a.metod === "GET" && a.sokvag.includes("MERCHANT_DATA"))).toHaveLength(2);
  });

  it("minRevision som redan är nådd kostar ingen omläsning", async () => {
    const w = fejkWix(efterPris());
    const u = await refreshVariantMedia(w.wix, "stol", { vanta, minRevision: 30 });
    expect(u.status).toBe("rattad");
    // En läsning utan handelsdata, en med, och efter skrivningen en. Ingen omläsning i början.
    expect(w.anrop.filter((a) => a.metod === "GET")).toHaveLength(3);
  });

  it("väntan har ett tak: omläsningarna är högst `omlasningar`", async () => {
    const pauser: number[] = [];
    const w = slapar(99);
    await refreshVariantMedia(w.wix, "stol", { vanta: async (ms) => { pauser.push(ms); }, minRevision: 30, omlasningar: 3 });
    // Tre läsningar före skrivningen = två pauser, sedan ger den upp.
    expect(pauser.length).toBe(2);
  });
});
