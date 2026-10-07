import { describe, it, expect } from "vitest";
import {
  korSammanslagning,
  fargSlug,
  MAX_OMDIRIGERINGAR,
  type SammanslagningDeps,
  type SammanslagningInput,
} from "./sammanslagning";
import type { StoredReview } from "../store/reviews";
import type { RedirectRow } from "../wix/redirects";
import { aosomArtikelbild, aosomArtikelForTask } from "./artiklar";
import { synligtSaldo } from "./sync";
import type { AosomRow } from "./feed";
import type { ProductMappingRecord } from "../store";
import type { WixAnrop } from "../polish/skrivplan";
import { MinnesFargbildLager } from "../store/fargbilder";

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

/**
 * En låtsas-Wix med två produkter och deras lager, som svarar som V3 gör.
 * `stavning` gör som Wix delade valista: ett val som butiken redan har sparas
 * med listans stavning ("Svart och röd" blir "Svart och Röd").
 */
function fejkWix(over: { sida?: Obj; utkast?: Obj; stavning?: Record<string, string> } = {}) {
  const produkter: Record<string, Obj> = {
    sida: {
      id: "sida",
      revision: "5",
      visible: true,
      name: "Kontorsstol med nackstöd",
      slug: "kontorsstol-nackstod",
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
      slug: "burostuhl-grau",
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
  /** Delad händelselogg — ordningen mellan Wix och omdirigeringarna testas. */
  const logg: string[] = [];
  const fel: { [nyckel: string]: number } = {};
  const kast = (nyckel: string) => {
    if ((fel[nyckel] ?? 0) > 0) {
      fel[nyckel]--;
      throw new Error(`Wix 404: ${nyckel}`);
    }
  };
  const idAv = (sokvag: string) => decodeURIComponent(sokvag.split("?")[0].split("/").pop()!);
  const stava = (namn: unknown) => (typeof namn === "string" ? over.stavning?.[namn] ?? namn : namn);
  const stavaOm = (p: Obj) => {
    for (const o of (p.options ?? []) as Obj[]) {
      for (const c of ((o.choicesSettings as { choices?: Obj[] } | undefined)?.choices ?? [])) c.name = stava(c.name);
    }
    for (const v of ((p.variantsInfo as { variants?: Obj[] } | undefined)?.variants ?? [])) {
      for (const c of (v.choices ?? []) as Obj[]) {
        const n = c.optionChoiceNames as Obj | undefined;
        if (n) n.choiceName = stava(n.choiceName);
      }
    }
  };
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
      // Wix ger varje nytt val ett id; befintliga behåller sitt.
      for (const o of (p.options ?? []) as Obj[]) {
        for (const c of ((o.choicesSettings as { choices?: Obj[] } | undefined)?.choices ?? [])) {
          c.choiceId ??= `val-${String(o.name)}-${String(c.name)}`;
        }
      }
      const foreVarianter = ((p.variantsInfo as { variants?: Obj[] } | undefined)?.variants ?? []);
      const varianter = ((k.variantsInfo as Obj).variants as Obj[]).map((v, i) => {
        const { inventoryItem, ...rest } = v;
        const vid = (v.id as string) ?? `var-ny-${i}`;
        // Utan `inventoryItem` rörs lagret inte (variantbildens rättning).
        if (inventoryItem !== undefined) {
          const post = inventoryItem as { quantity: number };
          // Strikt som schemat: `quantity` ELLER `inStock` (plus `preorderInfo`),
          // och lagret följer varianten — inget id.
          const falt = Object.keys(post);
          if (falt.some((f) => !["quantity", "inStock", "preorderInfo"].includes(f))) {
            throw new Error(`Wix 400: okänt fält i inventoryItem: ${falt.join(",")}`);
          }
          const befintlig = lager[id].find((x) => x.variantId === vid);
          if (befintlig) befintlig.quantity = post.quantity;
          else lager[id].push({ id: `inv-${vid}`, variantId: vid, quantity: post.quantity });
        }
        // Som Wix: variantens bild räknas om ur valets första kopplade bild bara
        // när valen står enbart med namn. Med val-id står den gamla kvar.
        const baraNamn = ((rest.choices ?? []) as Obj[]).every((c) => !c.optionChoiceIds);
        const gammal = foreVarianter.find((x) => x.id === vid)?.media;
        let media: unknown = gammal;
        if (baraNamn) {
          media = undefined;
          for (const c of (rest.choices ?? []) as Obj[]) {
            const n = c.optionChoiceNames as Obj;
            const o = ((k.options ?? []) as Obj[]).find((x) => x.name === n.optionName);
            const val = ((o?.choicesSettings as { choices?: Obj[] } | undefined)?.choices ?? []).find((x) => x.name === n.choiceName);
            const forsta = (val?.linkedMedia as Obj[] | undefined)?.[0];
            if (forsta) { media = { id: forsta.id }; break; }
          }
        }
        return { ...rest, id: vid, ...(media ? { media } : {}) };
      });
      p.variantsInfo = { variants: varianter };
      stavaOm(p);
      p.revision = String(Number(p.revision) + 1);
      return { product: structuredClone(p) };
    }
    if (metod === "PATCH" && sokvag.startsWith("/stores/v3/products/")) {
      const id = idAv(sokvag);
      const p = produkter[id];
      const k = kropp as { product: Obj; fieldMask: { paths: string[] } };
      if (k.fieldMask.paths.length === 1 && k.fieldMask.paths[0] === "visible") {
        kast("avpublicering");
        p.visible = k.product.visible;
        logg.push(`synlighet ${id} ${String(k.product.visible)}`);
      } else if (k.fieldMask.paths.includes("media")) {
        kast("bilder");
        p.media = structuredClone(k.product.media);
      } else {
        kast("koppling");
        p.options = structuredClone(k.product.options);
        stavaOm(p);
      }
      p.revision = String(Number(p.revision) + 1);
      return { product: structuredClone(p) };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, produkter, lager, anrop, fel, logg };
}

function miljo(over: {
  wix?: ReturnType<typeof fejkWix>;
  mappningar?: ProductMappingRecord[];
  feed?: AosomRow[];
  sparaFaller?: number;
  extra?: Partial<SammanslagningDeps>;
} = {}) {
  const w = over.wix ?? fejkWix();
  const rader = new Map<string, ProductMappingRecord>();
  for (const m of over.mappningar ?? [mappning("A-1", "sida"), mappning("G-7", "utkast", { draftStatus: "pending_review", needsAiPolish: true })]) {
    rader.set(m.wixProductId, m);
  }
  let sparaFaller = over.sparaFaller ?? 0;
  const lager = new MinnesFargbildLager();
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
    fargbilder: lager,
    vanta: async () => {},
    ...over.extra,
  };
  return { deps, rader, w, lager, fall: (n: number) => { sparaFaller = n; } };
}

// ── hjälpare för de nya fallen ──────────────────────────────────────────────

/** Ett tredje utkast: samma stol i blått, artikel H-8. */
function laggTillUtkast2(w: ReturnType<typeof fejkWix>, over: Obj = {}) {
  w.produkter.utkast2 = {
    id: "utkast2",
    revision: "3",
    visible: false,
    name: "Bürostuhl blau",
    slug: "burostuhl-blau",
    options: [],
    variantsInfo: { variants: [{ id: "var-utkast2", visible: true, sku: "FP-stuhl-blau", choices: [], price: { actualPrice: { amount: "679" } } }] },
    media: { itemsInfo: { items: [{ id: "bild-b1", altText: "Bürostuhl" }] } },
    ...over,
  };
  w.lager.utkast2 = [{ id: "inv-utkast2", variantId: "var-utkast2", quantity: 9 }];
}

function mappningUtkast2(): ProductMappingRecord {
  const m = mappning("H-8", "utkast2", { draftStatus: "pending_review", needsAiPolish: true });
  m.variants[0] = { ...m.variants[0], sku: "FP-stuhl-blau", wixVariantId: "var-utkast2", grossSek: 679, landedCostSek: 560 };
  return m;
}

const TRE = [rad("A-1", { qty: 43 }), rad("G-7", { qty: 23 }), rad("H-8", { qty: 13 })];
const TREDJE: SammanslagningInput = { behall: "sida", utkast: "utkast2", fargBehall: "", fargUtkast: "Blå" };

const valPa = (w: ReturnType<typeof fejkWix>) =>
  ((w.produkter.sida.options as Obj[])[0].choicesSettings as { choices: Obj[] }).choices;
const bildPa = (c: Obj) => ((c.linkedMedia ?? []) as Obj[])[0]?.id;
const varianterPa = (w: ReturnType<typeof fejkWix>) => (w.produkter.sida.variantsInfo as { variants: Obj[] }).variants;
const prisPa = (v: Obj) => (v.price as { actualPrice: { amount: string } }).actualPrice.amount;

function fejkRecensioner(start: StoredReview[]) {
  const rader = structuredClone(start);
  const lager = {
    listByProduct: async (id: string) => structuredClone(rader.filter((r) => r.productId === id)),
    upsert: async (r: StoredReview) => {
      const i = rader.findIndex((x) => x.productId === r.productId && x.reviewIdAE === r.reviewIdAE);
      if (i >= 0) rader[i] = structuredClone(r);
      else rader.push(structuredClone(r));
    },
  };
  return { lager, rader };
}

function fejkOmdirigeringar(start: RedirectRow[], logg: string[]) {
  const rader = structuredClone(start);
  let faller = 0;
  const lager = {
    lista: async () => structuredClone(rader),
    skriv: async (r: RedirectRow) => {
      if (faller > 0) {
        faller--;
        throw new Error("Wix Data svarade inte");
      }
      logg.push(`omdirigering ${r.fromSlug} ${r.toPath}`);
      const i = rader.findIndex((x) => x.fromSlug === r.fromSlug);
      if (i >= 0) rader[i] = { ...r };
      else rader.push({ ...r });
    },
  };
  return { lager, rader, fall: (n: number) => { faller = n; } };
}

const recension = (productId: string, id: string, text: string, status: StoredReview["status"] = "approved"): StoredReview => ({
  productId, reviewIdAE: id, rating: 5, textOriginal: text, textSwedish: text, initials: "A.B.", hasImage: false, status,
});

const PAR: SammanslagningInput = { behall: "sida", utkast: "utkast", fargBehall: "Svart", fargUtkast: "Grå" };
const patchar = (w: ReturnType<typeof fejkWix>) => w.anrop.filter((a) => a.metod === "PATCH");
/**
 * Sammanslagningens egen variantskrivning: den bär lagret. Variantbildens
 * rättning går till samma adress men utan `inventoryItem`.
 */
const arVariantskrivning = (a: { metod: string; sokvag: string; kropp?: unknown }) =>
  a.metod === "PATCH"
  && a.sokvag.startsWith("/stores/v3/products-with-inventory/")
  && (((a.kropp as { product?: Obj })?.product?.variantsInfo as { variants?: Obj[] } | undefined)?.variants ?? [])
    .some((v) => v.inventoryItem !== undefined);

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
      // Alla givarens bilder sedan 2026-09-30 — men givaren är opolerad
      // (tyskt namn), så position 2 och senare granskas i stället för att skrivas.
      bilderUtkast: 1,
      bilderOverflow: 0,
      bilderGranskas: 1,
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

  it("hinder: en SKU över Wix gräns på 40 tecken, given eller härledd, fälls i planen", async () => {
    const fyrtio = `FP-${"a".repeat(37)}`;
    expect(fyrtio).toHaveLength(40);
    const { deps } = miljo();
    expect((await korSammanslagning({ ...PAR, sku: fyrtio }, deps)).plan.hinder).not.toContain("sku_for_lang");
    expect((await korSammanslagning({ ...PAR, sku: `${fyrtio}b` }, deps)).plan.hinder).toContain("sku_for_lang");

    // Sidans egen SKU ryms, men sidans SKU + givarens färg gör det inte.
    const lang = "FP-kontorsstol-med-nackstod-och-hjulen";
    const sida = miljo({
      wix: fejkWix({
        sida: { variantsInfo: { variants: [{ id: "var-sida", visible: true, sku: lang, choices: [], price: { actualPrice: { amount: "699" } } }] } },
      }),
    });
    const svar = await korSammanslagning(PAR, sida.deps, { apply: true });
    expect(svar.plan.skuUtkast).toBe(`${lang}-gra`);
    expect(svar.plan.skuUtkast.length).toBeGreaterThan(40);
    expect(svar.plan.hinder).toEqual(["sku_for_lang"]);
    expect(svar.ok).toBe(false);
    expect(patchar(sida.w)).toEqual([]);
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
    // Varje färg får HELA sin lista: sidans foton till sidans färg (butikens
    // ägarregler), givarens till den nya.
    expect(val.map((c) => [c.name, (c.linkedMedia as Obj[]).map((m) => m.id)])).toEqual([
      ["Svart", ["bild-s1", "bild-s2"]],
      ["Grå", ["bild-u1"]],
    ]);
    const varianter = (p.variantsInfo as { variants: Obj[] }).variants;
    expect(varianter.map((v) => [v.sku, (v.price as { actualPrice: { amount: string } }).actualPrice.amount, v.visible])).toEqual([
      ["FP-stol", "699", true],
      ["FP-stol-gra", "649", true],
    ]);
    // Givarens huvudbild följer med, med svensk alt-text (givarens är tysk).
    // Bild 2 är från en opolerad givare och väntar på granskning i tabellen.
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

  it("☠️ varukostnaden sätts ur mappningarna — Wix handelsdata läses aldrig", async () => {
    // `fields=MERCHANT_DATA` kräver behörigheten SCOPE.STORES.PRODUCT_READ_ADMIN.
    // Saknas den svarar Wix 403 och redan PLANEN hade fallit. Kostnaden tas
    // därför ur mappningen — samma tal importen skriver — och skickas alltid:
    // en variantsInfo-PATCH ersätter varianten, och Wix räknade fält
    // (`profit`, `profitMargin`) är skrivskyddade och ska inte ekas tillbaka.
    const w = fejkWix({
      sida: {
        variantsInfo: { variants: [{
          id: "var-sida", visible: true, sku: "FP-stol", choices: [],
          price: { actualPrice: { amount: "699" } },
          revenueDetails: { cost: { amount: "1" }, profit: { amount: "698" }, profitMargin: 0.99 },
        }] },
      },
    });
    const utkast = mappning("G-7", "utkast", { draftStatus: "pending_review", needsAiPolish: true });
    utkast.variants[0].landedCostSek = 612.5;
    const { deps } = miljo({ wix: w, mappningar: [mappning("A-1", "sida"), utkast] });

    const svar = await korSammanslagning(PAR, deps, { apply: true });

    expect(svar.ok).toBe(true);
    // Planen och sammanslagningens egen skrivning läser aldrig handelsdata.
    // Variantbildens rättning efteråt gör det, men den får falla utan att
    // sammanslagningen gör det (se testet om 403 nedan).
    const forsta = w.anrop.findIndex((a) => arVariantskrivning(a));
    const lasningar = w.anrop.slice(0, forsta).filter((a) => a.metod === "GET");
    expect(lasningar.length).toBeGreaterThan(0);
    expect(lasningar.some((a) => a.sokvag.includes("MERCHANT_DATA"))).toBe(false);
    const skriv = w.anrop[forsta];
    const varianter = ((skriv.kropp as { product: Obj }).product.variantsInfo as Obj).variants as Obj[];
    expect(varianter[0].revenueDetails).toEqual({ cost: { amount: "525.00" } });
    expect(varianter[1].revenueDetails).toEqual({ cost: { amount: "612.50" } });
  });

  it("☠️ varje färg får sin egen bild i varukorgen: variantens bild rättas efter kopplingen", async () => {
    // Bilderna kopplas med val-id, och då räknar Wix inte om variantens bild
    // (lib/wix/variant-media.ts). Utan rättningen hade den nya grå färgen
    // stått på sidans svarta bild i varukorgen, kassan och ordern.
    const { deps, w } = miljo();
    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(varianterPa(w).map((v) => (v.media as Obj | undefined)?.id)).toEqual(["bild-s1", "bild-u1"]);
    expect(svar.steg).toContain("variantbilder: 2 rättade");
    // Rättningen rör inte lagret: ingen `inventoryItem` i dess skrivning.
    const rattning = w.anrop.filter((a) => a.metod === "PATCH" && a.sokvag.includes("products-with-inventory") && !arVariantskrivning(a));
    expect(rattning).toHaveLength(1);
    expect(w.lager.sida.map((x) => x.quantity)).toEqual([40, synligtSaldo(23)]);
  });

  it("☠️ får nyckeln inte läsa varukostnaden fortsätter sammanslagningen, och ingen rättning skrivs", async () => {
    const w = fejkWix();
    const inner = w.wix;
    const wix: WixAnrop = async (metod, sokvag, kropp) => {
      if (metod === "GET" && sokvag.includes("MERCHANT_DATA")) {
        w.anrop.push({ metod, sokvag, kropp });
        throw new Error("Wix 403: NO_PERMISSION_TO_READ_MERCHANT_DATA");
      }
      return inner(metod, sokvag, kropp);
    };
    const { deps, rader } = miljo({ wix: { ...w, wix } });
    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(svar.steg.some((r) => /variantbilder: kunde inte kontrolleras.*MERCHANT_DATA/.test(r))).toBe(true);
    expect(w.anrop.filter((a) => a.metod === "PATCH" && a.sokvag.includes("products-with-inventory") && !arVariantskrivning(a))).toHaveLength(0);
    expect(rader.get("sida")!.variants).toHaveLength(2);
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
    expect(val.map((c) => (c.linkedMedia as Obj[]).length)).toEqual([2, 1]);
  });

  it("☠️ en bild som aldrig kopplas stoppar mappningen, och omkörningen kopplar den", async () => {
    const w = fejkWix();
    w.fel.koppling = 1000;
    const { deps, rader } = miljo({ wix: w });
    const forsta = await korSammanslagning(PAR, deps, { apply: true });
    expect(forsta.ok).toBe(false);
    expect(forsta.fel).toMatch(/saknar kopplad bild.*mappningen skrevs INTE/);
    // Wix bär färgen men mappningen och givaren är orörda — en omkörning ska
    // alltså hamna i `wix_klar`, inte i `klar`, som inte kopplar något.
    expect(rader.get("sida")!.variants).toHaveLength(1);
    expect(rader.get("utkast")!.draftStatus).toBe("pending_review");

    w.fel.koppling = 0;
    const plan = await korSammanslagning(PAR, deps);
    expect(plan.plan.tillstand).toBe("wix_klar");
    const andra = await korSammanslagning(PAR, deps, { apply: true });
    expect(andra.ok).toBe(true);
    const val = ((w.produkter.sida.options as Obj[])[0].choicesSettings as { choices: Obj[] }).choices;
    expect(val.map((c) => [c.name, bildPa(c)])).toEqual([["Svart", "bild-s1"], ["Grå", "bild-u1"]]);
    expect(rader.get("sida")!.variants).toHaveLength(2);
    expect(rader.get("utkast")!.draftStatus).toBe("rejected");
  });

  it("☠️ Wix stavar sidans färg som den delade listan — bilden kopplas ändå", async () => {
    const w = fejkWix({ stavning: { "Svart och röd": "Svart och Röd" } });
    const { deps, rader } = miljo({ wix: w });
    const svar = await korSammanslagning({ ...PAR, fargBehall: "Svart och röd" }, deps, { apply: true });
    expect(svar.fel).toBeUndefined();
    expect(svar.ok).toBe(true);
    expect(valPa(w).map((c) => [c.name, bildPa(c)])).toEqual([["Svart och Röd", "bild-s1"], ["Grå", "bild-u1"]]);
    expect(rader.get("sida")!.variants).toHaveLength(2);
    expect(rader.get("utkast")!.draftStatus).toBe("rejected");
  });

  it("☠️ omkörningen efter en fallen koppling räknar valet en gång, fast stavningen skiljer", async () => {
    const w = fejkWix({ stavning: { "Svart och röd": "Svart och Röd" } });
    w.fel.koppling = 1000;
    const { deps, rader } = miljo({ wix: w });
    const input = { ...PAR, fargBehall: "Svart och röd" };
    expect((await korSammanslagning(input, deps, { apply: true })).ok).toBe(false);

    w.fel.koppling = 0;
    const andra = await korSammanslagning(input, deps, { apply: true });
    expect(andra.plan.tillstand).toBe("wix_klar");
    expect(andra.fel).toBeUndefined();
    expect(valPa(w).map((c) => [c.name, bildPa(c)])).toEqual([["Svart och Röd", "bild-s1"], ["Grå", "bild-u1"]]);
    expect(rader.get("sida")!.variants).toHaveLength(2);
  });

  it("☠️ föll mappningen: omkörningen ser att Wix är klart och gör bara resten", async () => {
    const { deps, rader, w } = miljo({ sparaFaller: 1 });
    await expect(korSammanslagning(PAR, deps, { apply: true })).rejects.toThrow(/databasen/);
    // Wix bär färgen, mappningen gör det inte — synken nollar den nya färgen
    // och beställningsfilen håller en order på den tills raden är mappad.
    expect(rader.get("sida")!.variants).toHaveLength(1);
    const variantskrivningar = () => w.anrop.filter(arVariantskrivning).length;
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

describe("sammanslagning — ett val till på en sammanslagen sida", () => {
  function tre() {
    const w = fejkWix();
    laggTillUtkast2(w);
    const m = miljo({
      wix: w,
      feed: TRE,
      mappningar: [
        mappning("A-1", "sida"),
        mappning("G-7", "utkast", { draftStatus: "pending_review", needsAiPolish: true }),
        mappningUtkast2(),
      ],
    });
    return { ...m, w };
  }

  it("planen säger utoka, och värdet sidan har behövs inte längre", async () => {
    const { deps } = tre();
    expect((await korSammanslagning(PAR, deps, { apply: true })).ok).toBe(true);
    const svar = await korSammanslagning(TREDJE, deps);
    expect(svar.ok).toBe(true);
    expect(svar.plan).toMatchObject({
      tillstand: "utoka",
      hinder: [],
      axlar: ["Färg"],
      nyaAxlar: [],
      varden: { Färg: ["Svart", "Grå", "Blå"] },
      varianter: 3,
      saknadeKombinationer: 0,
      skuUtkast: "FP-stol-bla",
      prisUtkast: 679,
      saldoBehall: 40 + synligtSaldo(23),
      saldoUtkast: synligtSaldo(13),
    });
  });

  it("☠️ lägger en tredje färg utan att röra de två första", async () => {
    const { deps, rader, w } = tre();
    await korSammanslagning(PAR, deps, { apply: true });
    const fore = varianterPa(w).map((v) => [v.id, v.sku, prisPa(v)]);

    const svar = await korSammanslagning(TREDJE, deps, { apply: true });
    expect(svar.ok).toBe(true);

    // De två första valen behåller sina bilder, det nya får sin.
    expect(valPa(w).map((c) => [c.name, bildPa(c)])).toEqual([
      ["Svart", "bild-s1"],
      ["Grå", "bild-u1"],
      ["Blå", "bild-b1"],
    ]);
    // De befintliga varianterna behåller id, SKU och pris.
    expect(varianterPa(w).map((v) => [v.id, v.sku, prisPa(v)])).toEqual([...fore, ["var-ny-2", "FP-stol-bla", "679"]]);
    expect(w.lager.sida.map((x) => x.quantity)).toEqual([40, synligtSaldo(23), synligtSaldo(13)]);

    const sida = rader.get("sida")!;
    expect(sida.variants.map((v) => [v.supplierVariantId, v.sku, v.choices, v.wixVariantId])).toEqual([
      ["A-1", "FP-stol", { Färg: "Svart" }, "var-sida"],
      ["G-7", "FP-stol-gra", { Färg: "Grå" }, "var-ny-1"],
      ["H-8", "FP-stol-bla", { Färg: "Blå" }, "var-ny-2"],
    ]);
    expect(aosomArtikelbild(sida).typ).toBe("flera");
    expect(sida.aosomSyncedQty).toBe(40 + synligtSaldo(23) + synligtSaldo(13));
    expect(rader.get("utkast2")!.draftStatus).toBe("rejected");

    // En order på den blå varianten beställer den blå artikeln.
    expect(aosomArtikelForTask({ wixVariantId: "var-ny-2", variantChoices: {} }, sida)).toEqual({ artikel: "H-8" });
  });

  it("☠️ skrivningen tar optionen och varianterna ur GET:en — id och kopplade bilder följer med", async () => {
    const { deps, w } = tre();
    await korSammanslagning(PAR, deps, { apply: true });
    await korSammanslagning(TREDJE, deps, { apply: true });
    const skriv = w.anrop.filter(arVariantskrivning).at(-1)!;
    const produkt = (skriv.kropp as { product: Obj }).product;
    const val = ((produkt.options as Obj[])[0].choicesSettings as { choices: Obj[] }).choices;
    expect(val.slice(0, 2).map(bildPa)).toEqual(["bild-s1", "bild-u1"]);
    const varianter = (produkt.variantsInfo as Obj).variants as Obj[];
    expect(varianter.map((v) => v.id)).toEqual(["var-sida", "var-ny-1", undefined]);
  });

  it("hinder: en färg sidan redan har, och en storlek utan givarens färg", async () => {
    const { deps } = tre();
    await korSammanslagning(PAR, deps, { apply: true });
    expect((await korSammanslagning({ ...TREDJE, fargUtkast: "grå" }, deps)).plan.hinder).toContain("kombinationen_finns");
    // Sidan har färgval: givaren måste säga sin färg, och en ny storleksaxel
    // kräver sidans storlek.
    const storlek = await korSammanslagning({ ...TREDJE, fargUtkast: "", storlekUtkast: "110 cm" }, deps);
    expect(storlek.plan.hinder).toEqual(expect.arrayContaining(["saknar_farg_utkast", "saknar_storlek_behall"]));
  });

  it("☠️ föll mappningen efter den tredje färgen: omkörningen gör bara resten", async () => {
    const { deps, rader, w, fall } = tre();
    await korSammanslagning(PAR, deps, { apply: true });
    fall(1);
    await expect(korSammanslagning(TREDJE, deps, { apply: true })).rejects.toThrow(/databasen/);
    expect(rader.get("sida")!.variants).toHaveLength(2);
    const skrivningar = () => w.anrop.filter(arVariantskrivning).length;
    expect(skrivningar()).toBe(2);

    const svar = await korSammanslagning(TREDJE, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(svar.plan.tillstand).toBe("wix_klar");
    expect(skrivningar()).toBe(2);
    expect(rader.get("sida")!.variants.map((v) => v.supplierVariantId)).toEqual(["A-1", "G-7", "H-8"]);
    expect(rader.get("utkast2")!.draftStatus).toBe("rejected");
  });
});

describe("sammanslagning — storlek", () => {
  const STORLEK: SammanslagningInput = {
    behall: "sida", utkast: "utkast", storlekBehall: "90 × 70 cm", storlekUtkast: "110 × 85 cm",
  };

  it("en storlek blir optionen Storlek, med storleken i SKU:n och alt-texten", async () => {
    const { deps, rader, w } = miljo();
    const svar = await korSammanslagning(STORLEK, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(svar.plan.skuUtkast).toBe("FP-stol-110-85-cm");
    const option = (w.produkter.sida.options as Obj[])[0];
    expect(option.name).toBe("Storlek");
    expect(valPa(w).map((c) => c.name)).toEqual(["90 × 70 cm", "110 × 85 cm"]);
    const alt = ((w.produkter.sida.media as Obj).itemsInfo as { items: Obj[] }).items.at(-1)!.altText;
    expect(alt).toBe("Kontorsstol med nackstöd i storleken 110 × 85 cm");
    expect(rader.get("sida")!.variants.map((v) => v.choices)).toEqual([
      { Storlek: "90 × 70 cm" },
      { Storlek: "110 × 85 cm" },
    ]);
  });

  it("varnar alltid att måtten i texten bara gäller en storlek, och tar tankstreck", async () => {
    const { deps } = miljo();
    const svar = await korSammanslagning({ ...STORLEK, storlekUtkast: "120–160 cm" }, deps);
    expect(svar.plan.hinder).toEqual([]);
    expect(svar.plan.varningar.join(" ")).toMatch(/spec-fliken/);
  });

  it("☠️ hinder: en storlek i artikelnummerform, och namnet som bär storleken", async () => {
    const { deps } = miljo();
    expect((await korSammanslagning({ ...STORLEK, storlekUtkast: "999-999ZZ" }, deps)).plan.hinder).toContain("storlek_ogiltig");
    const { deps: d2 } = miljo({ wix: fejkWix({ sida: { name: "Kontorsstol 90 × 70 cm" } }) });
    expect((await korSammanslagning(STORLEK, d2)).plan.hinder).toContain("namnet_bar_storlek");
  });
});

describe("sammanslagning — en publicerad givare", () => {
  const PUBLICERAD: SammanslagningInput = { ...PAR, omdirigera: true };

  function publicerad(opts: { recensioner?: StoredReview[]; omdirigeringar?: RedirectRow[]; ordrar?: number } = {}) {
    const w = fejkWix({ utkast: { visible: true } });
    const r = fejkRecensioner(opts.recensioner ?? [
      recension("utkast", "R1", "Bra stol"),
      recension("utkast", "R2", "Skön att sitta i"),
      recension("utkast", "R3", "Dold recension", "rejected"),
      recension("utkast", "R4", "Samma text som på sidan"),
      recension("sida", "R9", "Samma text som på sidan"),
      recension("sida", "R2", "Skön att sitta i"),
    ]);
    const o = fejkOmdirigeringar(opts.omdirigeringar ?? [{ fromSlug: "gammal-stol", toPath: "/produkt/burostuhl-grau" }], w.logg);
    const m = miljo({
      wix: w,
      extra: { recensioner: r.lager, omdirigeringar: o.lager, oppnaOrdrar: async () => opts.ordrar ?? 0 },
    });
    return { ...m, w, r, o };
  }

  it("planen visar recensionerna, omdirigeringen och kedjan som pekas om — och skriver ingenting", async () => {
    const { deps, w, r, o } = publicerad();
    const svar = await korSammanslagning(PUBLICERAD, deps);
    expect(svar.ok).toBe(true);
    expect(svar.plan).toMatchObject({
      tillstand: "ny",
      givarenPublicerad: true,
      recensionerAttKopiera: 1,
      omdirigering: "/produkt/burostuhl-grau → /produkt/kontorsstol-nackstod",
      omdirigeringarAttPekaOm: 1,
    });
    expect(patchar(w)).toEqual([]);
    expect(r.rader).toHaveLength(6);
    expect(o.rader).toHaveLength(1);
  });

  it("☠️ kopierar recensionerna, omdirigerar FÖRE avpubliceringen och pensionerar givaren", async () => {
    const { deps, rader, w, r, o } = publicerad();
    const svar = await korSammanslagning(PUBLICERAD, deps, { apply: true });
    expect(svar.ok).toBe(true);

    // Bara R1 kopieras: R2 finns redan (samma id), R3 är dold, R4 har samma text.
    expect(r.rader.filter((x) => x.productId === "sida").map((x) => x.reviewIdAE).sort()).toEqual(["R1", "R2", "R9"]);
    // Givarens rader rörs inte.
    expect(r.rader.filter((x) => x.productId === "utkast")).toHaveLength(4);

    expect(o.rader).toEqual(expect.arrayContaining([
      expect.objectContaining({ fromSlug: "burostuhl-grau", toPath: "/produkt/kontorsstol-nackstod" }),
      expect.objectContaining({ fromSlug: "gammal-stol", toPath: "/produkt/kontorsstol-nackstod" }),
    ]));
    const iOmd = w.logg.findIndex((x) => x.startsWith("omdirigering burostuhl-grau"));
    const iAvp = w.logg.indexOf("synlighet utkast false");
    expect(iOmd).toBeGreaterThanOrEqual(0);
    expect(iAvp).toBeGreaterThan(iOmd);
    expect(w.produkter.utkast.visible).toBe(false);
    expect(w.produkter.sida.visible).toBe(true);
    expect(rader.get("utkast")!.draftStatus).toBe("rejected");
    expect(rader.get("sida")!.variants.map((v) => v.supplierVariantId)).toEqual(["A-1", "G-7"]);
  });

  it.each([
    ["utkast_publicerat", { omdirigera: false }, {}],
    ["givaren_har_oppna_ordrar", {}, { ordrar: 1 }],
    ["omdirigering_krockar", {}, { omdirigeringar: [{ fromSlug: "burostuhl-grau", toPath: "/produkt/annan-sida" }] }],
    ["omdirigeringar_for_manga", {}, {
      omdirigeringar: Array.from({ length: MAX_OMDIRIGERINGAR }, (_, i) => ({ fromSlug: `rad-${i}`, toPath: "/produkt/x" })),
    }],
  ])("☠️ hinder: %s — ingenting skrivs", async (hinder, input, opts) => {
    const { deps, w, r, o } = publicerad(opts as Parameters<typeof publicerad>[0]);
    const svar = await korSammanslagning({ ...PUBLICERAD, ...input }, deps, { apply: true });
    expect(svar.ok).toBe(false);
    expect(svar.plan.hinder).toContain(hinder);
    expect(patchar(w)).toEqual([]);
    expect(r.rader).toHaveLength(6);
    expect(o.rader.some((x) => x.fromSlug === "burostuhl-grau" && x.toPath === "/produkt/kontorsstol-nackstod")).toBe(false);
  });

  it("utan verktygen för en publicerad givare vägras den", async () => {
    const { deps } = miljo({ wix: fejkWix({ utkast: { visible: true } }) });
    expect((await korSammanslagning(PUBLICERAD, deps, { apply: true })).plan.hinder).toContain("givare_publicerad_saknar_verktyg");
  });

  it("☠️ föll omdirigeringen: givaren ligger kvar ute, och omkörningen gör klart utan dubbla recensioner", async () => {
    const { deps, rader, w, r, o } = publicerad();
    o.fall(1);
    await expect(korSammanslagning(PUBLICERAD, deps, { apply: true })).rejects.toThrow(/Wix Data/);
    expect(w.produkter.utkast.visible).toBe(true);
    expect(rader.get("utkast")!.draftStatus).not.toBe("rejected");

    // Utan omdirigera vägras omkörningen — givaren får inte lämnas halv.
    expect((await korSammanslagning(PAR, deps, { apply: true })).plan.hinder).toContain("utkast_publicerat");

    const svar = await korSammanslagning(PUBLICERAD, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(svar.plan.tillstand).toBe("klar");
    expect(r.rader.filter((x) => x.productId === "sida" && x.reviewIdAE === "R1")).toHaveLength(1);
    expect(w.produkter.utkast.visible).toBe(false);
    expect(rader.get("utkast")!.draftStatus).toBe("rejected");

    // Och en körning till är en no-op.
    const fore = patchar(w).length;
    expect((await korSammanslagning(PUBLICERAD, deps, { apply: true })).steg).toEqual(["redan sammanslagen — ingenting att göra"]);
    expect(patchar(w).length).toBe(fore);
  });

  it("varnar när givarens pris styrs av konkurrentregeln eller ett lås — synken tar över det", async () => {
    const w = fejkWix({ utkast: { visible: true } });
    const r = fejkRecensioner([]);
    const o = fejkOmdirigeringar([], w.logg);
    const givare = mappning("G-7", "utkast", { prisgrupp: "A", prisLast: true });
    const { deps } = miljo({
      wix: w,
      mappningar: [mappning("A-1", "sida"), givare],
      extra: { recensioner: r.lager, omdirigeringar: o.lager, oppnaOrdrar: async () => 0 },
    });
    const text = (await korSammanslagning(PUBLICERAD, deps)).plan.varningar.join(" ");
    expect(text).toMatch(/låst/);
    expect(text).toMatch(/konkurrentregeln/);
  });

  it("☠️ svaret bär aldrig ett artikelnummer eller en kostnad, inte heller här", async () => {
    const { deps } = publicerad();
    const text = JSON.stringify(await korSammanslagning(PUBLICERAD, deps, { apply: true }));
    expect(text).not.toMatch(/A-1|G-7/);
    expect(text).not.toMatch(/525|landed|costUsd/);
  });
});

describe("sammanslagning — färg och storlek på samma sida", () => {
  const BADA: SammanslagningInput = {
    behall: "sida",
    utkast: "utkast",
    fargBehall: "Svart",
    fargUtkast: "Grå",
    storlekBehall: "90 × 70 cm",
    storlekUtkast: "110 × 85 cm",
  };
  /** Blå, sidans storlekar får en ny: 110 cm. Sidan är svart/grå i 90 cm. */
  const NY_STORLEK: SammanslagningInput = {
    behall: "sida", utkast: "utkast2", fargUtkast: "Blå", storlekUtkast: "110 cm", storlekBehall: "90 cm",
  };

  const axelVal = (w: ReturnType<typeof fejkWix>, axel: string) =>
    (((w.produkter.sida.options as Obj[]).find((o) => o.name === axel)!.choicesSettings) as { choices: Obj[] }).choices;
  const platsPa = (v: Obj) => Object.fromEntries(((v.choices ?? []) as Obj[]).map((c) => {
    const n = c.optionChoiceNames as { optionName: string; choiceName: string };
    return [n.optionName, n.choiceName];
  }));
  const bildPatchar = (w: ReturnType<typeof fejkWix>) => w.anrop.filter((a) =>
    a.metod === "PATCH" && a.sokvag === "/stores/v3/products/sida"
    && ((a.kropp as { fieldMask: { paths: string[] } }).fieldMask.paths).includes("media")).length;

  /** Ett fjärde utkast: samma stol i grått, fast stor. Artikel J-9. */
  function laggTillUtkast3(w: ReturnType<typeof fejkWix>) {
    w.produkter.utkast3 = {
      id: "utkast3",
      revision: "1",
      visible: false,
      name: "Bürostuhl grau groß",
      slug: "burostuhl-grau-gross",
      options: [],
      variantsInfo: { variants: [{ id: "var-utkast3", visible: true, sku: "FP-stuhl-grau-gross", choices: [], price: { actualPrice: { amount: "719" } } }] },
      media: { itemsInfo: { items: [{ id: "bild-g1", altText: "Bürostuhl" }] } },
    };
    w.lager.utkast3 = [{ id: "inv-utkast3", variantId: "var-utkast3", quantity: 11 }];
  }

  function fyra(over: { sparaFaller?: number } = {}) {
    const w = fejkWix();
    laggTillUtkast2(w);
    laggTillUtkast3(w);
    const utkast3 = mappning("J-9", "utkast3", { draftStatus: "pending_review", needsAiPolish: true });
    utkast3.variants[0] = { ...utkast3.variants[0], sku: "FP-stuhl-grau-gross", wixVariantId: "var-utkast3", grossSek: 719 };
    const m = miljo({
      wix: w,
      feed: [...TRE, rad("J-9", { qty: 31 })],
      mappningar: [
        mappning("A-1", "sida"),
        mappning("G-7", "utkast", { draftStatus: "pending_review", needsAiPolish: true }),
        mappningUtkast2(),
        utkast3,
      ],
      sparaFaller: over.sparaFaller,
    });
    return { ...m, w };
  }

  it("☠️ en sida utan val får båda axlarna på en gång — två varianter, två kombinationer saknas", async () => {
    const { deps, rader, w } = miljo();
    const plan = (await korSammanslagning(BADA, deps)).plan;
    expect(plan).toMatchObject({
      tillstand: "ny",
      hinder: [],
      axlar: ["Färg", "Storlek"],
      nyaAxlar: ["Färg", "Storlek"],
      varden: { Färg: ["Svart", "Grå"], Storlek: ["90 × 70 cm", "110 × 85 cm"] },
      varianter: 2,
      saknadeKombinationer: 2,
      skuUtkast: "FP-stol-110-85-cm-gra",
      bilderUtkast: 1,
    });
    expect(plan.varningar.join(" ")).toMatch(/2 av 4 kombinationer/);

    const svar = await korSammanslagning(BADA, deps, { apply: true });
    expect(svar.ok).toBe(true);
    // Färgen bär bilderna — butiken tar kombinationens bild därifrån. Storleken är text.
    expect(axelVal(w, "Färg").map((c) => [c.name, bildPa(c)])).toEqual([["Svart", "bild-s1"], ["Grå", "bild-u1"]]);
    expect(axelVal(w, "Storlek").map((c) => [c.name, bildPa(c)])).toEqual([["90 × 70 cm", undefined], ["110 × 85 cm", undefined]]);
    expect(varianterPa(w).map((v) => [v.sku, platsPa(v)])).toEqual([
      ["FP-stol", { Färg: "Svart", Storlek: "90 × 70 cm" }],
      ["FP-stol-110-85-cm-gra", { Färg: "Grå", Storlek: "110 × 85 cm" }],
    ]);
    const alt = ((w.produkter.sida.media as Obj).itemsInfo as { items: Obj[] }).items.at(-1)!.altText;
    expect(alt).toBe("Kontorsstol med nackstöd i färgen grå och storleken 110 × 85 cm");

    const sida = rader.get("sida")!;
    expect(sida.variants.map((v) => [v.supplierVariantId, v.choices])).toEqual([
      ["A-1", { Färg: "Svart", Storlek: "90 × 70 cm" }],
      ["G-7", { Färg: "Grå", Storlek: "110 × 85 cm" }],
    ]);
    // En order som bara bär valen beställer rätt artikel.
    const task = { wixVariantId: "", sku: "", variantChoices: { Färg: "Grå", Storlek: "110 × 85 cm" } };
    expect(aosomArtikelForTask(task, sida)).toEqual({ artikel: "G-7" });
    expect(rader.get("utkast")!.draftStatus).toBe("rejected");
  });

  it("☠️ en färgsida får storleksaxeln: de gamla varianterna behåller id och bilder och får sidans storlek", async () => {
    const { deps, rader, w } = fyra();
    await korSammanslagning(PAR, deps, { apply: true });
    const fore = varianterPa(w).map((v) => [v.id, v.sku, prisPa(v)]);

    const plan = (await korSammanslagning(NY_STORLEK, deps)).plan;
    expect(plan).toMatchObject({
      tillstand: "utoka",
      hinder: [],
      axlar: ["Färg", "Storlek"],
      nyaAxlar: ["Storlek"],
      nyaVarden: ["Färg", "Storlek"],
      varianter: 3,
      saknadeKombinationer: 3,
      skuUtkast: "FP-stol-110-cm-bla",
    });

    const svar = await korSammanslagning(NY_STORLEK, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(axelVal(w, "Färg").map((c) => [c.name, bildPa(c)])).toEqual([
      ["Svart", "bild-s1"],
      ["Grå", "bild-u1"],
      ["Blå", "bild-b1"],
    ]);
    expect(axelVal(w, "Storlek").map((c) => c.name)).toEqual(["90 cm", "110 cm"]);
    expect(varianterPa(w).map((v) => [v.id, v.sku, prisPa(v)])).toEqual([...fore, ["var-ny-2", "FP-stol-110-cm-bla", "679"]]);
    expect(varianterPa(w).map(platsPa)).toEqual([
      { Färg: "Svart", Storlek: "90 cm" },
      { Färg: "Grå", Storlek: "90 cm" },
      { Färg: "Blå", Storlek: "110 cm" },
    ]);
    expect(rader.get("sida")!.variants.map((v) => [v.supplierVariantId, v.choices])).toEqual([
      ["A-1", { Färg: "Svart", Storlek: "90 cm" }],
      ["G-7", { Färg: "Grå", Storlek: "90 cm" }],
      ["H-8", { Färg: "Blå", Storlek: "110 cm" }],
    ]);
    expect(rader.get("utkast2")!.draftStatus).toBe("rejected");
  });

  it("☠️ en ny storlek i en färg sidan redan har: stavas som sidan, och ingen ny bild", async () => {
    const { deps, rader, w } = fyra();
    await korSammanslagning(PAR, deps, { apply: true });
    await korSammanslagning(NY_STORLEK, deps, { apply: true });
    const bilderFore = bildPatchar(w);

    // "grå" med litet g: samma val som sidans "Grå", inte ett andra.
    const GRA_STOR: SammanslagningInput = { behall: "sida", utkast: "utkast3", fargUtkast: "grå", storlekUtkast: "110 cm" };
    const plan = (await korSammanslagning(GRA_STOR, deps)).plan;
    expect(plan).toMatchObject({
      tillstand: "utoka",
      hinder: [],
      nyaAxlar: [],
      nyaVarden: [],
      nyttVal: { Färg: "Grå", Storlek: "110 cm" },
      varianter: 4,
      saknadeKombinationer: 2,
      bilderUtkast: 0,
      skuUtkast: "FP-stol-110-cm-gra",
    });

    const svar = await korSammanslagning(GRA_STOR, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(bildPatchar(w)).toBe(bilderFore);
    expect(axelVal(w, "Färg").map((c) => c.name)).toEqual(["Svart", "Grå", "Blå"]);
    expect(axelVal(w, "Storlek").map((c) => c.name)).toEqual(["90 cm", "110 cm"]);
    expect(platsPa(varianterPa(w).at(-1)!)).toEqual({ Färg: "Grå", Storlek: "110 cm" });
    expect(rader.get("sida")!.variants.at(-1)).toMatchObject({ supplierVariantId: "J-9", choices: { Färg: "Grå", Storlek: "110 cm" } });
  });

  it("☠️ en storlekssida som får färg behåller storlekarnas bilder — sidans färg får ingen", async () => {
    const { deps, w } = fyra();
    await korSammanslagning(
      { behall: "sida", utkast: "utkast", storlekBehall: "90 × 70 cm", storlekUtkast: "110 × 85 cm" },
      deps,
      { apply: true },
    );
    const svar = await korSammanslagning(
      { behall: "sida", utkast: "utkast2", fargBehall: "Svart", fargUtkast: "Blå", storlekUtkast: "90 × 70 cm" },
      deps,
      { apply: true },
    );
    expect(svar.ok).toBe(true);
    expect(svar.plan.skuUtkast).toBe("FP-stol-bla");
    // Butiken tar bilden från färgen när den har en, annars från storleken:
    // de svarta varianterna visar fortfarande sin storleks bild.
    expect(axelVal(w, "Storlek").map((c) => [c.name, bildPa(c)])).toEqual([
      ["90 × 70 cm", "bild-s1"],
      ["110 × 85 cm", "bild-u1"],
    ]);
    expect(axelVal(w, "Färg").map((c) => [c.name, bildPa(c)])).toEqual([["Svart", undefined], ["Blå", "bild-b1"]]);
    expect(varianterPa(w).map(platsPa)).toEqual([
      { Storlek: "90 × 70 cm", Färg: "Svart" },
      { Storlek: "110 × 85 cm", Färg: "Svart" },
      { Storlek: "90 × 70 cm", Färg: "Blå" },
    ]);
  });

  it.each([
    ["saknar_storlek_utkast", { behall: "sida", utkast: "utkast3", fargUtkast: "Grå" }],
    ["kombinationen_finns", { behall: "sida", utkast: "utkast3", fargUtkast: "Blå", storlekUtkast: "110 cm" }],
  ])("☠️ hinder på en sida med båda axlarna: %s — ingenting skrivs", async (hinder, input) => {
    const { deps, w } = fyra();
    await korSammanslagning(PAR, deps, { apply: true });
    await korSammanslagning(NY_STORLEK, deps, { apply: true });
    const fore = patchar(w).length;
    const svar = await korSammanslagning(input as SammanslagningInput, deps, { apply: true });
    expect(svar.ok).toBe(false);
    expect(svar.plan.hinder).toContain(hinder);
    expect(patchar(w).length).toBe(fore);
  });

  it("hinder när axlarna läggs till: samma storlek på sidan och givaren, och en glömd givarfärg", async () => {
    const { deps } = miljo();
    expect((await korSammanslagning({ ...BADA, storlekUtkast: "90 × 70 CM" }, deps)).plan.hinder).toContain("storlek_lika");
    const glomd = await korSammanslagning(
      { behall: "sida", utkast: "utkast", fargBehall: "Svart", storlekBehall: "90 × 70 cm", storlekUtkast: "110 × 85 cm" },
      deps,
    );
    expect(glomd.plan.hinder).toContain("saknar_farg_utkast");
    expect((await korSammanslagning({ behall: "sida", utkast: "utkast" }, deps)).plan.hinder).toContain("inget_val");
  });

  it("☠️ föll mappningen efter att storleksaxeln lades till: omkörningen gör bara resten", async () => {
    const { deps, rader, w, fall } = fyra();
    await korSammanslagning(PAR, deps, { apply: true });
    fall(1);
    await expect(korSammanslagning(NY_STORLEK, deps, { apply: true })).rejects.toThrow(/databasen/);
    const skrivningar = () => w.anrop.filter(arVariantskrivning).length;
    expect(skrivningar()).toBe(2);
    expect(rader.get("sida")!.variants.map((v) => v.choices)).toEqual([{ Färg: "Svart" }, { Färg: "Grå" }]);

    const svar = await korSammanslagning(NY_STORLEK, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(svar.plan.tillstand).toBe("wix_klar");
    expect(skrivningar()).toBe(2);
    expect(rader.get("sida")!.variants.map((v) => v.choices)).toEqual([
      { Färg: "Svart", Storlek: "90 cm" },
      { Färg: "Grå", Storlek: "90 cm" },
      { Färg: "Blå", Storlek: "110 cm" },
    ]);
  });

  it("☠️ bär en befintlig variant fel val efter skrivningen skrivs ingen mappning", async () => {
    const { deps, rader, w } = fyra();
    await korSammanslagning(PAR, deps, { apply: true });
    // Wix "tappar" storleken på den svarta varianten i skrivningen.
    const orig = deps.wix;
    deps.wix = async (metod, sokvag, kropp) => {
      const svar = await orig(metod, sokvag, kropp);
      if (metod === "PATCH" && sokvag.includes("products-with-inventory")) {
        const v = varianterPa(w)[0];
        v.choices = ((v.choices ?? []) as Obj[]).filter((c) => (c.optionChoiceNames as Obj).optionName !== "Storlek");
      }
      return svar;
    };
    const svar = await korSammanslagning(NY_STORLEK, deps, { apply: true });
    expect(svar.ok).toBe(false);
    expect(svar.fel).toMatch(/fel val/);
    expect(svar.fel).toMatch(/mappningen skrevs INTE/);
    expect(rader.get("sida")!.variants).toHaveLength(2);
  });

  it("☠️ svaret bär aldrig ett artikelnummer eller en kostnad, inte heller med två axlar", async () => {
    const { deps } = fyra();
    await korSammanslagning(PAR, deps, { apply: true });
    for (const apply of [false, true]) {
      const text = JSON.stringify(await korSammanslagning(NY_STORLEK, deps, { apply }));
      expect(text).not.toMatch(/A-1|G-7|H-8|J-9/);
      expect(text).not.toMatch(/525|560|landed|costUsd/);
    }
  });
});

// ── Färgbilderna (2026-09-30) ───────────────────────────────────────────────
// Sammanslagningen tog bara givarens första bild, och återkopplingen skrev om
// varje befintligt val till sin första bild. Nu får en ny färg ALLA sina
// bilder under Wix 15, resten i färgbildstabellen, och befintliga val behåller
// hela sina listor.

describe("sammanslagning — färgbilderna", () => {
  const listor = (w: ReturnType<typeof fejkWix>) =>
    valPa(w).map((c) => [c.name, ((c.linkedMedia ?? []) as Obj[]).map((m) => m.id)]);
  const galleri = (w: ReturnType<typeof fejkWix>) =>
    ((w.produkter.sida.media as Obj).itemsInfo as { items: Obj[] }).items.map((b) => b.id);

  function tre() {
    const w = fejkWix();
    laggTillUtkast2(w);
    const m = miljo({
      wix: w,
      feed: TRE,
      mappningar: [
        mappning("A-1", "sida"),
        mappning("G-7", "utkast", { draftStatus: "pending_review", needsAiPolish: true }),
        mappningUtkast2(),
      ],
    });
    return { ...m, w };
  }

  it("☠️ utoka: de befintliga valen BEHÅLLER hela sina listor när en färg till läggs på", async () => {
    const { deps, w } = tre();
    expect((await korSammanslagning(PAR, deps, { apply: true })).ok).toBe(true);
    // Färgbildsverktyget har gett Svart en tredje bild.
    const svart = valPa(w)[0];
    (w.produkter.sida.media as { itemsInfo: { items: Obj[] } }).itemsInfo.items.push({ id: "bild-s3", altText: "Stolen bakifrån" });
    svart.linkedMedia = [{ id: "bild-s1" }, { id: "bild-s2" }, { id: "bild-s3" }];

    const svar = await korSammanslagning(TREDJE, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(listor(w)).toEqual([
      ["Svart", ["bild-s1", "bild-s2", "bild-s3"]],
      ["Grå", ["bild-u1"]],
      ["Blå", ["bild-b1"]],
    ]);
  });

  it("☠️ återkopplingen efter ett fel skriver HELA listorna, inte första bilden", async () => {
    const { deps, w } = tre();
    expect((await korSammanslagning(PAR, deps, { apply: true })).ok).toBe(true);
    w.fel.koppling = 2;
    expect((await korSammanslagning(TREDJE, deps, { apply: true })).ok).toBe(true);
    expect(listor(w)).toEqual([
      ["Svart", ["bild-s1", "bild-s2"]],
      ["Grå", ["bild-u1"]],
      ["Blå", ["bild-b1"]],
    ]);
  });

  it("den nya färgens lista står i färgbildstabellen, med givaren", async () => {
    const { deps, lager } = miljo();
    expect((await korSammanslagning(PAR, deps, { apply: true })).ok).toBe(true);
    const rader = await lager.lasForProdukt("sida");
    expect(rader.map((r) => [r.choiceName, r.ordning, r.filId, r.plats, r.givareId])).toEqual([
      ["Grå", 0, "bild-u1", "galleri", "utkast"],
      ["Grå", 1, "bild-u2", "granskas", "utkast"],
    ]);
    // Wix är återläst före tabellen, så valets rader är bekräftade.
    expect((await lager.lasSkrivnaVal()).every((v) => v.bekraftad)).toBe(true);
  });

  it("☠️ över Wix 15: det som inte ryms hamnar i tabellen som overflow — ingenting skärs bort", async () => {
    const w = fejkWix({
      sida: { media: { itemsInfo: { items: Array.from({ length: 13 }, (_, i) => ({ id: `bild-s${i + 1}`, altText: `Stol, vy ${i + 1}` })) } } },
      utkast: {
        name: "Kontorsstol i grått",
        media: { itemsInfo: { items: Array.from({ length: 5 }, (_, i) => ({ id: `bild-u${i + 1}`, altText: `Den grå stolen, vy ${i + 1}` })) } },
      },
    });
    const { deps, lager } = miljo({ wix: w });
    const plan = (await korSammanslagning(PAR, deps)).plan;
    expect(plan).toMatchObject({ bilderUtkast: 2, bilderOverflow: 3, bilderGranskas: 0 });
    expect(plan.varningar.join(" ")).toMatch(/ryms inte under Wix 15/);

    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(galleri(w)).toHaveLength(15);
    expect(listor(w)[1]).toEqual(["Grå", ["bild-u1", "bild-u2"]]);
    const rader = await lager.lasForProdukt("sida");
    expect(rader.filter((r) => r.plats === "overflow").map((r) => r.filId)).toEqual(["bild-u3", "bild-u4", "bild-u5"]);
    // Polerad givare: den svenska alt-texten behålls.
    const items = ((w.produkter.sida.media as Obj).itemsInfo as { items: Obj[] }).items;
    expect(items.find((b) => b.id === "bild-u2")!.altText).toBe("Den grå stolen, vy 2");
  });

  it("☠️ en opolerad givares bilder från position 2 skrivs inte — de sparas som granskas", async () => {
    const w = fejkWix({
      utkast: {
        media: { itemsInfo: { items: Array.from({ length: 5 }, (_, i) => ({ id: `bild-u${i + 1}`, altText: "Bürostuhl" })) } },
      },
    });
    const { deps, lager } = miljo({ wix: w });
    const svar = await korSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(svar.plan).toMatchObject({ bilderUtkast: 1, bilderOverflow: 0, bilderGranskas: 4 });
    expect(galleri(w)).not.toContain("bild-u2");
    const rader = await lager.lasForProdukt("sida");
    expect(rader.filter((r) => r.plats === "granskas").map((r) => r.filId)).toEqual(["bild-u2", "bild-u3", "bild-u4", "bild-u5"]);
  });

  it("givarens egna kort följer inte med — sidans kort gäller alla färger", async () => {
    const w = fejkWix({
      utkast: {
        name: "Kontorsstol i grått",
        media: { itemsInfo: { items: [
          { id: "bild-u1", altText: "Den grå stolen" },
          { id: "bild-u2", altText: "Faktakort: stolen i grått" },
          { id: "bild-u3", altText: "Den grå stolen från sidan" },
        ] } },
      },
    });
    const { deps } = miljo({ wix: w });
    expect((await korSammanslagning(PAR, deps, { apply: true })).ok).toBe(true);
    expect(listor(w)[1]).toEqual(["Grå", ["bild-u1", "bild-u3"]]);
    expect(galleri(w)).not.toContain("bild-u2");
  });

  it("med `bilder` följer exakt de valda med, och inga fler", async () => {
    const { deps, w, lager } = miljo();
    expect((await korSammanslagning({ ...PAR, bilder: [1] }, deps, { apply: true })).ok).toBe(true);
    expect(listor(w)[1]).toEqual(["Grå", ["bild-u1"]]);
    expect((await lager.lasForProdukt("sida")).map((r) => r.filId)).toEqual(["bild-u1"]);
  });

  it("ett fullt galleri stoppar planen i stället för att Wix får sexton", async () => {
    const w = fejkWix({
      sida: { media: { itemsInfo: { items: Array.from({ length: 15 }, (_, i) => ({ id: `bild-s${i + 1}`, altText: `Stol, vy ${i + 1}` })) } } },
    });
    const { deps } = miljo({ wix: w });
    expect((await korSammanslagning(PAR, deps)).plan.hinder).toContain("galleriet_fullt");
  });

  it("faller tabellen skrivs ingen mappning, och omkörningen (wix_klar) skriver den", async () => {
    const { deps, rader, lager } = miljo();
    let faller = 1;
    const ersatt = lager.ersattForVal.bind(lager);
    lager.ersattForVal = async (...a: Parameters<typeof ersatt>) => {
      if (faller-- > 0) throw new Error("databasen svarade inte");
      return ersatt(...a);
    };
    const forsta = await korSammanslagning(PAR, deps, { apply: true });
    expect(forsta.ok).toBe(false);
    expect(forsta.fel).toMatch(/färgbildstabellen föll/);
    expect(rader.get("sida")!.variants).toHaveLength(1);

    const andra = await korSammanslagning(PAR, deps, { apply: true });
    expect(andra.plan.tillstand).toBe("wix_klar");
    expect(andra.ok).toBe(true);
    expect((await lager.lasForProdukt("sida")).map((r) => [r.filId, r.plats])).toEqual([
      ["bild-u1", "galleri"],
      ["bild-u2", "granskas"],
    ]);
  });
});
