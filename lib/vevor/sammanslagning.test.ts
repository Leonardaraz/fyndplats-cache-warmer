import { describe, it, expect } from "vitest";
import {
  NYA_AXLAR,
  etikett,
  fordelaBilder,
  funktionSomSkiljer,
  iVevorSynkfonster,
  korVevorSammanslagning,
  recensionerAttKopiera,
  type VevorAvlasning,
  type VevorSammanslagningDeps,
  type VevorSammanslagningInput,
} from "./sammanslagning";
import type { StoredReview } from "../store/reviews";
import type { RedirectRow } from "../wix/redirects";
import { artikelbild } from "../aosom/artiklar";
import type { ProductMappingRecord } from "../store";
import type { WixAnrop } from "../polish/skrivplan";

// Syntetiska artikelnummer — riktiga får aldrig stå i en testfil, repot är
// publikt. XQSIDA1 är sidans artikel, XQGIV7 givarens, XQSYS2 ett syskon som
// redan sitter på en familj.

type Obj = Record<string, unknown>;

const PREFIX = "vevor:";

function mappning(artikel: string, wixProductId: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplierProductId: `${PREFIX}${artikel}`,
    supplier: "vevor",
    wixProductId,
    draftStatus: "pending_review",
    needsAiPolish: true,
    vevorArtiklar: [`${PREFIX}${artikel}`],
    variants: [{
      supplierVariantId: artikel,
      sku: wixProductId === "sida" ? "FP-hundgrind-fristaende" : "FP-hundgrind-813-mm",
      wixVariantId: wixProductId === "sida" ? "var-sida" : "var-utkast",
      choices: {},
      costUsd: 40,
      landedCostSek: 420,
      grossSek: wixProductId === "sida" ? 1071 : 1182,
    }],
    ...over,
  };
}

function avlasning(sku: string, over: Partial<VevorAvlasning> = {}): VevorAvlasning {
  return {
    sku,
    status: "i_lager",
    saldo: 40,
    borta: false,
    levererasTillSe: true,
    spec: [["Höjd", "753 mm"], ["Material", "Stål"]],
    ...over,
  };
}

/**
 * En låtsas-Wix med två produkter och deras lager, som svarar som V3 gör (samma
 * modell som lib/aosom/sammanslagning.test.ts).
 */
function fejkWix(over: { sida?: Obj; utkast?: Obj } = {}) {
  const produkter: Record<string, Obj> = {
    sida: {
      id: "sida",
      revision: "5",
      visible: false,
      name: "Fristående hundgrind med fyra paneler",
      slug: "fristaende-hundgrind",
      plainDescription: "<p>En grind.</p>",
      options: [],
      variantsInfo: { variants: [{ id: "var-sida", visible: true, sku: "FP-hundgrind-fristaende", choices: [], price: { actualPrice: { amount: "1071" } } }] },
      media: { itemsInfo: { items: [{ id: "bild-s1", altText: "Grind framifrån" }, { id: "bild-s2", altText: "Grind från sidan" }] } },
      ...over.sida,
    },
    utkast: {
      id: "utkast",
      revision: "2",
      visible: false,
      name: "VEVOR Fristående hundgrind 813 mm hög",
      slug: "vevor-fristaende-hundgrind-813",
      options: [],
      variantsInfo: { variants: [{ id: "var-utkast", visible: true, sku: "FP-hundgrind-813-mm", choices: [], price: { actualPrice: { amount: "1182" } } }] },
      media: { itemsInfo: { items: [{ id: "bild-u1", altText: "Hundgrind" }, { id: "bild-u2", altText: "Hundgrind" }, { id: "bild-u3", altText: "Hundgrind" }] } },
      ...over.utkast,
    },
  };
  const lager: Record<string, { id: string; variantId: string; quantity: number }[]> = {
    sida: [{ id: "inv-sida", variantId: "var-sida", quantity: 64 }],
    utkast: [{ id: "inv-utkast", variantId: "var-utkast", quantity: 61 }],
  };
  const anrop: { metod: string; sokvag: string; kropp?: unknown }[] = [];
  const logg: string[] = [];
  const idAv = (sokvag: string) => decodeURIComponent(sokvag.split("?")[0].split("/").pop()!);
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    anrop.push({ metod, sokvag, kropp });
    if (metod === "GET" && sokvag.startsWith("/stores/v3/products/")) {
      const p = produkter[idAv(sokvag)];
      if (!p) throw new Error("Wix 404: finns inte");
      const svar = structuredClone(p);
      for (const v of ((svar.variantsInfo as { variants?: Obj[] } | undefined)?.variants ?? [])) {
        if (!sokvag.includes("MERCHANT_DATA")) delete v.revenueDetails;
        else if ((v.revenueDetails as Obj | undefined)?.cost) {
          v.revenueDetails = { ...(v.revenueDetails as Obj), profit: { amount: "100.00" }, profitMargin: 10 };
        }
      }
      return { product: svar };
    }
    if (metod === "POST" && sokvag === "/stores/v3/inventory-items/query") {
      const id = ((kropp as Obj).query as { filter: { productId: string } }).filter.productId;
      return { inventoryItems: structuredClone(lager[id] ?? []) };
    }
    if (metod === "PATCH" && sokvag.startsWith("/stores/v3/products-with-inventory/")) {
      const id = idAv(sokvag);
      const p = produkter[id];
      const k = (kropp as { product: Obj }).product;
      p.options = structuredClone(k.options);
      for (const o of (p.options ?? []) as Obj[]) {
        for (const c of ((o.choicesSettings as { choices?: Obj[] } | undefined)?.choices ?? [])) {
          c.choiceId ??= `val-${String(o.name)}-${String(c.name)}`;
        }
      }
      const foreVarianter = ((p.variantsInfo as { variants?: Obj[] } | undefined)?.variants ?? []);
      const varianter = ((k.variantsInfo as Obj).variants as Obj[]).map((v, i) => {
        const { inventoryItem, ...rest } = v;
        const vid = (v.id as string) ?? `var-ny-${i}`;
        if (inventoryItem !== undefined) {
          const post = inventoryItem as { quantity: number };
          const falt = Object.keys(post);
          if (falt.some((f) => !["quantity", "inStock", "preorderInfo"].includes(f))) {
            throw new Error(`Wix 400: okänt fält i inventoryItem: ${falt.join(",")}`);
          }
          const befintlig = lager[id].find((x) => x.variantId === vid);
          if (befintlig) befintlig.quantity = post.quantity;
          else lager[id].push({ id: `inv-${vid}`, variantId: vid, quantity: post.quantity });
        }
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
      p.revision = String(Number(p.revision) + 1);
      return { product: structuredClone(p) };
    }
    if (metod === "PATCH" && sokvag.startsWith("/stores/v3/products/")) {
      const id = idAv(sokvag);
      const p = produkter[id];
      const k = kropp as { product: Obj; fieldMask: { paths: string[] } };
      if (k.fieldMask.paths.length === 1 && k.fieldMask.paths[0] === "visible") {
        p.visible = k.product.visible;
        logg.push(`synlighet ${id} ${String(k.product.visible)}`);
      } else if (k.fieldMask.paths.includes("media")) {
        p.media = structuredClone(k.product.media);
      } else {
        p.options = structuredClone(k.product.options);
        const skickade = (k.product.variantsInfo as { variants?: Obj[] } | undefined)?.variants;
        if (skickade) {
          for (const v of skickade) {
            const rd = (v.revenueDetails ?? {}) as Obj;
            if ("profit" in rd || "profitMargin" in rd) throw new Error("Wix 400: profit och profitMargin är skrivskyddade");
          }
          p.variantsInfo = structuredClone(k.product.variantsInfo);
        }
        if (k.product.visible !== undefined) p.visible = k.product.visible;
      }
      p.revision = String(Number(p.revision) + 1);
      return { product: structuredClone(p) };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, produkter, lager, anrop, logg };
}

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
  const lager = {
    lista: async () => structuredClone(rader),
    skriv: async (r: RedirectRow) => {
      logg.push(`omdirigering ${r.fromSlug} ${r.toPath}`);
      const i = rader.findIndex((x) => x.fromSlug === r.fromSlug);
      if (i >= 0) rader[i] = { ...r };
      else rader.push({ ...r });
    },
  };
  return { lager, rader };
}

const recension = (productId: string, id: string, text: string, status: StoredReview["status"] = "approved"): StoredReview => ({
  productId, reviewIdAE: id, rating: 5, textOriginal: text, textSwedish: text, initials: "A.B.", hasImage: false, status,
});

/** Halv tolv på en lördag: utanför båda synkfönstren. */
const UTANFOR = Date.parse("2026-11-07T11:35:00Z");

function miljo(over: {
  wix?: ReturnType<typeof fejkWix>;
  mappningar?: ProductMappingRecord[];
  avlasningar?: VevorAvlasning[];
  hashar?: Record<string, string>;
  recensioner?: StoredReview[];
  sparaFaller?: number;
  now?: number;
  extra?: Partial<VevorSammanslagningDeps>;
} = {}) {
  const w = over.wix ?? fejkWix();
  const rader = new Map<string, ProductMappingRecord>();
  for (const m of over.mappningar ?? [mappning("XQSIDA1", "sida"), mappning("XQGIV7", "utkast")]) rader.set(m.wixProductId, m);
  const avl = new Map((over.avlasningar ?? [avlasning("XQSIDA1"), avlasning("XQGIV7", { saldo: 61, spec: [["Höjd", "813 mm"], ["Material", "Stål"]] })]).map((a) => [a.sku, a]));
  // bild-u1 är samma foto som bild-s1 (VEVOR lägger samma foto under olika adresser).
  const hashar = new Map(Object.entries(over.hashar ?? { "bild-s1": "h-front", "bild-s2": "h-sida", "bild-u1": "h-front", "bild-u2": "h-hog", "bild-u3": "h-hog-2" }));
  const rec = fejkRecensioner(over.recensioner ?? [
    recension("sida", "r-sida-1", "Bra grind, lätt att ställa upp"),
    recension("utkast", "r-giv-1", "Hög nog för vår stora hund", "pending"),
    recension("utkast", "r-giv-2", "Fel vara", "rejected"),
  ]);
  let sparaFaller = over.sparaFaller ?? 0;
  const deps: VevorSammanslagningDeps = {
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
    avlasningar: async (artiklar) => new Map(artiklar.filter((a) => avl.has(a)).map((a) => [a, structuredClone(avl.get(a)!)])),
    hashar: async (idn) => new Map(idn.filter((id) => hashar.has(id)).map((id) => [id, hashar.get(id)!])),
    recensioner: rec.lager,
    now: () => over.now ?? UTANFOR,
    vanta: async () => {},
    ...over.extra,
  };
  return { deps, rader, w, rec };
}

const PAR: VevorSammanslagningInput = { behall: "sida", utkast: "utkast", varden: { Storlek: "813 mm" }, vardenBehall: { Storlek: "753 mm" } };
const patchar = (w: ReturnType<typeof fejkWix>) => w.anrop.filter((a) => a.metod === "PATCH");
const varianterPa = (w: ReturnType<typeof fejkWix>) => (w.produkter.sida.variantsInfo as { variants: Obj[] }).variants;
const bilderPa = (w: ReturnType<typeof fejkWix>) => ((w.produkter.sida.media as { itemsInfo: { items: Obj[] } }).itemsInfo.items).map((b) => b.id);

describe("VEVOR-sammanslagning — rena delar", () => {
  it("synkfönstret är minut 45–57", () => {
    expect(iVevorSynkfonster(new Date("2026-11-07T10:44:59Z"))).toBe(false);
    expect(iVevorSynkfonster(new Date("2026-11-07T10:45:00Z"))).toBe(true);
    expect(iVevorSynkfonster(new Date("2026-11-07T10:57:59Z"))).toBe(true);
    expect(iVevorSynkfonster(new Date("2026-11-07T10:58:00Z"))).toBe(false);
  });

  it("de nya axlarna är familjeregelns tillåtna: färg, mönster, storlek, längd och förpackning", () => {
    expect([...NYA_AXLAR]).toEqual(["Färg", "Mönster", "Storlek", "Längd", "Förpackning"]);
  });

  it("etiketten följer axlarnas ordning, som importens `kopt`", () => {
    expect(etikett({ Storlek: "120 cm", Färg: "Svart" }, ["Färg", "Storlek"])).toBe("Svart / 120 cm");
  });

  it("bilderna jämförs på innehållet: samma foto läggs inte till igen", () => {
    const f = fordelaBilder(
      [{ id: "s1", altText: "" }, { id: "s2", altText: "" }],
      [{ id: "u1", altText: "" }, { id: "u2", altText: "" }, { id: "u3", altText: "" }],
      new Map([["s1", "a"], ["s2", "b"], ["u1", "a"], ["u2", "c"], ["u3", "c"]]),
      "Grind",
      "813 mm",
    );
    expect(f.gemensamma).toEqual(["u1"]);
    expect(f.sidansGemensamma).toEqual(["s1"]);
    // u3 är samma foto som u2: det tas en gång.
    expect(f.nya).toEqual([{ id: "u2", altText: "Grind – 813 mm" }]);
  });

  it("en specifikationsrad som visar funktion som skiljer hittas, en vikt gör det inte", () => {
    expect(funktionSomSkiljer([["Effekt", "850 W"], ["Vikt", "7 kg"]], [["Effekt", "1800 W"], ["Vikt", "8 kg"]])).toEqual(["Effekt"]);
    expect(funktionSomSkiljer([["Höjd", "753 mm"]], [["Höjd", "813 mm"]])).toEqual([]);
  });

  it("☠️ artikelns egna rader (modell, vikt, förpackning) är ingen funktion — som i importen", () => {
    const sidan: [string, string][] = [["Modell", "XQ-60"], ["Vikt", "2 kg"], ["Förpackningens innehåll", "1 rör"], ["Lastkapacitet (varje)", "200 kg"]];
    const givaren: [string, string][] = [["Modell", "XQ-90"], ["Vikt", "3 kg"], ["Förpackningens innehåll", "2 rör"], ["Lastkapacitet (varje)", "200 kg"]];
    expect(funktionSomSkiljer(sidan, givaren)).toEqual([]);
    // En verklig funktion stoppar fortfarande, också bredvid en modellrad.
    expect(funktionSomSkiljer([["Modell", "XQ-60"], ["Effekt", "850 W"]], [["Modell", "XQ-90"], ["Effekt", "1800 W"]])).toEqual(["Effekt"]);
  });

  it("recensioner: avvisade och de som redan finns (id eller text) kopieras inte", () => {
    const g = [recension("u", "1", "Bra"), recension("u", "2", "Dålig", "rejected"), recension("u", "3", "samma text"), recension("u", "4", "Ny")];
    const s = [recension("s", "9", "Samma  TEXT")];
    expect(recensionerAttKopiera(g, s).map((r) => r.reviewIdAE)).toEqual(["1", "4"]);
  });
});

describe("VEVOR-sammanslagning — planen", () => {
  it("torrkörning är default och skriver ingenting", async () => {
    const { deps, rader, w } = miljo();
    const svar = await korVevorSammanslagning(PAR, deps);
    expect(svar.ok).toBe(true);
    expect(svar.torrkorning).toBe(true);
    expect(patchar(w)).toEqual([]);
    expect(rader.get("sida")!.variants).toHaveLength(1);
    expect(svar.plan).toMatchObject({
      tillstand: "ny",
      hinder: [],
      axlar: ["Storlek"],
      nyaAxlar: ["Storlek"],
      varden: { Storlek: ["753 mm", "813 mm"] },
      familjeregel: { Storlek: "storlek" },
      bildaxel: "Storlek",
      prisBehall: 1071,
      prisUtkast: 1182,
      saldoBehall: 64,
      saldoUtkast: 61,
      skuBehall: "FP-hundgrind-fristaende",
      skuUtkast: "FP-hundgrind-fristaende-813-mm",
      bilderBehall: 2,
      bilderUtkast: 2,
      bilderGemensamma: 1,
      recensionerAttKopiera: 1,
      recensionerAttMarka: 1,
      behallPublicerad: false,
    });
  });

  it("☠️ svaret bär aldrig ett artikelnummer eller en kostnad — det går till en publik logg", async () => {
    for (const apply of [false, true]) {
      const { deps } = miljo();
      const text = JSON.stringify(await korVevorSammanslagning(PAR, deps, { apply }));
      expect(text).not.toMatch(/XQSIDA1|XQGIV7/);
      expect(text).not.toMatch(/420|landed|costUsd/);
    }
  });

  it("☠️ familjeregeln: en storlek som skiljer i liter är kapacitet och stoppas", async () => {
    const { deps, w } = miljo();
    const svar = await korVevorSammanslagning({ ...PAR, varden: { Storlek: "6 L" }, vardenBehall: { Storlek: "3 L" } }, deps, { apply: true });
    expect(svar.ok).toBe(false);
    expect(svar.plan.hinder).toContain("familjeregeln_funktion:Storlek");
    expect(patchar(w)).toEqual([]);
  });

  it("☠️ familjeregeln: en rad i specifikationen som visar en effekt som skiljer stoppar, vad axeln än heter", async () => {
    const { deps, w } = miljo({
      avlasningar: [
        avlasning("XQSIDA1", { spec: [["Effekt", "850 W"]] }),
        avlasning("XQGIV7", { spec: [["Effekt", "1800 W"]] }),
      ],
    });
    const svar = await korVevorSammanslagning(PAR, deps, { apply: true });
    expect(svar.plan.hinder).toContain("funktion_skiljer:Effekt");
    expect(patchar(w)).toEqual([]);
  });

  it("☠️ två artiklar med var sin modellrad stoppas inte (första torrkörningen 2026-11-07)", async () => {
    const { deps } = miljo({
      avlasningar: [
        avlasning("XQSIDA1", { spec: [["Höjd", "753 mm"], ["Modell", "XQ-753"]] }),
        avlasning("XQGIV7", { spec: [["Höjd", "813 mm"], ["Modell", "XQ-813"]] }),
      ],
    });
    const svar = await korVevorSammanslagning(PAR, deps);
    expect(svar.plan.hinder).toEqual([]);
    expect(svar.ok).toBe(true);
  });

  it.each([
    ["axel_ogiltig:Modell", { varden: { Modell: "B" }, vardenBehall: { Modell: "A" } }],
    ["varde_lika:Storlek", { varden: { Storlek: "753 mm" }, vardenBehall: { Storlek: "753 mm" } }],
    ["saknar_varde_behall:Storlek", { varden: { Storlek: "813 mm" }, vardenBehall: {} }],
    ["inget_val", { varden: {} }],
    ["sku_ogiltig", { sku: "FP-abc-12345" }],
  ])("hinder i indata: %s", async (hinder, over) => {
    const { deps } = miljo();
    const svar = await korVevorSammanslagning({ ...PAR, ...over } as VevorSammanslagningInput, deps);
    expect(svar.plan.hinder).toContain(hinder);
  });

  it.each([
    ["behall_ej_vevor", { mappningar: [mappning("XQSIDA1", "sida", { supplier: "aosom", supplierProductId: "aosom:845" }), mappning("XQGIV7", "utkast")] }],
    ["artikeln_upptagen", { mappningar: [mappning("XQSIDA1", "sida"), mappning("XQGIV7", "utkast"), mappning("XQANNAN", "annan", { vevorArtiklar: ["vevor:XQANNAN", "vevor:XQGIV7"] })] }],
    ["utkast_saknar_avlasning", { avlasningar: [avlasning("XQSIDA1")] }],
    ["utkast_borta_hos_vevor", { avlasningar: [avlasning("XQSIDA1"), avlasning("XQGIV7", { borta: true, status: "borta" })] }],
    ["utkast_levereras_inte_till_sverige", { avlasningar: [avlasning("XQSIDA1"), avlasning("XQGIV7", { levererasTillSe: false })] }],
    ["utkast_publicerat", { wix: fejkWix({ utkast: { visible: true } }) }],
    ["namnet_bar_varde:Storlek", { wix: fejkWix({ sida: { visible: true, name: "Hundgrind 753 mm hög" } }) }],
  ])("hinder i läget: %s", async (hinder, over) => {
    const { deps, w } = miljo(over as Parameters<typeof miljo>[0]);
    const svar = await korVevorSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(false);
    expect(svar.plan.hinder).toContain(hinder);
    expect(patchar(w)).toEqual([]);
  });

  it("ett utkasts namn som nämner sidans storlek är en varning, inte ett hinder — poleringen skriver namnet", async () => {
    const { deps } = miljo({ wix: fejkWix({ sida: { name: "Hundgrind 753 mm hög" } }) });
    const svar = await korVevorSammanslagning(PAR, deps);
    expect(svar.plan.hinder).toEqual([]);
    expect(svar.plan.varningar.join(" ")).toMatch(/namnet nämner sidans storlek/);
  });

  it("☠️ en ny färg utan eget foto stoppas: den hade visat en annan färgs bild", async () => {
    const { deps } = miljo({ hashar: { "bild-s1": "a", "bild-s2": "b", "bild-u1": "a", "bild-u2": "b", "bild-u3": "a" } });
    const svar = await korVevorSammanslagning({ ...PAR, varden: { Färg: "Grå" }, vardenBehall: { Färg: "Svart" } }, deps);
    expect(svar.plan.bildaxel).toBe("Färg");
    expect(svar.plan.hinder).toContain("utkast_saknar_egna_bilder");
  });

  it("☠️ inget skrivs i VEVOR-synkens fönster", async () => {
    const { deps, w, rader } = miljo({ now: Date.parse("2026-11-07T11:50:30Z") });
    const svar = await korVevorSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(false);
    expect(svar.fel).toMatch(/synkfönster/);
    expect(patchar(w)).toEqual([]);
    expect(rader.get("utkast")!.draftStatus).toBe("pending_review");
  });

  it("☠️ inget skrivs i Aosoms synkfönster heller", async () => {
    const { deps, w } = miljo({ now: Date.parse("2026-11-07T12:20:00Z") });
    const svar = await korVevorSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(false);
    expect(patchar(w)).toEqual([]);
  });
});

describe("VEVOR-sammanslagning — skrivningen", () => {
  it("två utkast blir ett: storleksaxel, en artikel per variant, givaren pensionerad, recensionerna med", async () => {
    const { deps, rader, w, rec } = miljo();
    const svar = await korVevorSammanslagning(PAR, deps, { apply: true });
    expect(svar.ok).toBe(true);

    // Wix: två varianter med sina val, priserna orörda, sidan fortfarande dold.
    const varianter = varianterPa(w);
    expect(varianter).toHaveLength(2);
    expect(varianter.map((v) => (v.price as { actualPrice: { amount: string } }).actualPrice.amount)).toEqual(["1071", "1182"]);
    expect(varianter.every((v) => v.visible === true)).toBe(true);
    expect(w.produkter.sida.visible).toBe(false);
    const option = (w.produkter.sida.options as Obj[])[0];
    expect(option.name).toBe("Storlek");
    expect(((option.choicesSettings as { choices: Obj[] }).choices).map((c) => c.name)).toEqual(["753 mm", "813 mm"]);
    expect(w.lager.sida.find((x) => x.variantId !== "var-sida")?.quantity).toBe(61);

    // Bara givarens EGNA foton läggs till; samma foto som sidans hoppas över.
    expect(bilderPa(w)).toEqual(["bild-s1", "bild-s2", "bild-u2", "bild-u3"]);
    const val = (option.choicesSettings as { choices: Obj[] }).choices;
    const lankade = (namn: string) => ((val.find((c) => c.name === namn)?.linkedMedia ?? []) as Obj[]).map((m) => m.id);
    expect(lankade("813 mm")).toEqual(["bild-u2", "bild-u3"]);
    // Sidans eget värde får bara sitt eget foto, inte det gemensamma.
    expect(lankade("753 mm")).toEqual(["bild-s2"]);

    // Mappningen: en artikel per variant och båda i vevorArtiklar.
    const sida = rader.get("sida")!;
    const bild = artikelbild(sida, PREFIX);
    expect(bild.typ).toBe("flera");
    expect(sida.variants.map((v) => [v.supplierVariantId, v.choices])).toEqual([
      ["XQSIDA1", { Storlek: "753 mm" }],
      ["XQGIV7", { Storlek: "813 mm" }],
    ]);
    expect(sida.vevorArtiklar).toEqual(["vevor:XQSIDA1", "vevor:XQGIV7"]);
    expect(sida.variants[1].sku).toBe("FP-hundgrind-fristaende-813-mm");

    // Givaren pensionerad, inte raderad, och artikeln kvar i vevorArtiklar.
    const givare = rader.get("utkast")!;
    expect(givare.draftStatus).toBe("rejected");
    expect(givare.supplierProductId).toBe("");
    expect(givare.needsAiPolish).toBe(false);
    expect(givare.vevorArtiklar).toEqual(["vevor:XQGIV7"]);

    // Recensionerna: givarens kopieras med sin variant, sidans egna får sin, den avvisade följer inte med.
    const paSidan = rec.rader.filter((r) => r.productId === "sida");
    expect(paSidan.map((r) => [r.reviewIdAE, r.kopt, r.status])).toEqual([
      ["r-sida-1", "753 mm", "approved"],
      ["r-giv-1", "813 mm", "pending"],
    ]);
    expect(rec.rader.filter((r) => r.productId === "utkast")).toHaveLength(2);
  });

  it("en omkörning efter en lyckad sammanslagning gör ingenting", async () => {
    const m = miljo();
    expect((await korVevorSammanslagning(PAR, m.deps, { apply: true })).ok).toBe(true);
    const antal = patchar(m.w).length;
    const igen = await korVevorSammanslagning(PAR, m.deps, { apply: true });
    expect(igen.ok).toBe(true);
    expect(igen.plan.tillstand).toBe("klar");
    expect(igen.steg).toContain("redan sammanslagen — ingenting att göra");
    expect(patchar(m.w).length).toBe(antal);
  });

  it("☠️ faller mappningen efter Wix gör omkörningen bara resten (`wix_klar`)", async () => {
    const m = miljo({ sparaFaller: 1 });
    await expect(korVevorSammanslagning(PAR, m.deps, { apply: true })).rejects.toThrow(/databasen/);
    expect(varianterPa(m.w)).toHaveLength(2);
    expect(m.rader.get("sida")!.variants).toHaveLength(1);
    const igen = await korVevorSammanslagning(PAR, m.deps, { apply: true });
    expect(igen.plan.tillstand).toBe("wix_klar");
    expect(igen.ok).toBe(true);
    expect(varianterPa(m.w)).toHaveLength(2);
    expect(artikelbild(m.rader.get("sida")!, PREFIX).typ).toBe("flera");
    expect(m.rader.get("utkast")!.draftStatus).toBe("rejected");
  });

  it("☠️ dör körningen före bildkopplingen får sidans värde bara sidans egna foton i omkörningen", async () => {
    const w = fejkWix();
    let efterVarianter = false;
    let fallit = false;
    const wix: WixAnrop = async (metod, sokvag, kropp) => {
      if (metod === "PATCH" && sokvag.startsWith("/stores/v3/products-with-inventory/")) efterVarianter = true;
      else if (efterVarianter && !fallit && metod === "GET" && sokvag.startsWith("/stores/v3/products/sida")) {
        fallit = true;
        throw new Error("Wix 503: tillfälligt fel");
      }
      return w.wix(metod, sokvag, kropp);
    };
    const m = miljo({ wix: w, extra: { wix } });
    await expect(korVevorSammanslagning(PAR, m.deps, { apply: true })).rejects.toThrow(/503/);
    const valAv = () => ((w.produkter.sida.options as Obj[])[0].choicesSettings as { choices: Obj[] }).choices;
    // Wix bär den nya varianten, men inget val har fått sina bilder än.
    expect(valAv().every((c) => !c.linkedMedia)).toBe(true);
    expect(bilderPa(w)).toEqual(["bild-s1", "bild-s2", "bild-u2", "bild-u3"]);

    const igen = await korVevorSammanslagning(PAR, m.deps, { apply: true });
    expect(igen.plan.tillstand).toBe("wix_klar");
    expect(igen.ok).toBe(true);
    const lankade = (namn: string) => ((valAv().find((c) => c.name === namn)?.linkedMedia ?? []) as Obj[]).map((x) => x.id);
    expect(lankade("813 mm")).toEqual(["bild-u2", "bild-u3"]);
    expect(lankade("753 mm")).toEqual(["bild-s2"]);
  });

  it("en familj från importen får en variant till (`utoka`), med sina egna axelnamn", async () => {
    const w = fejkWix({
      sida: {
        options: [{
          name: "Storlek",
          optionRenderType: "TEXT_CHOICES",
          choicesSettings: { choices: [{ choiceId: "c1", name: "610 mm" }, { choiceId: "c2", name: "753 mm" }] },
        }],
        variantsInfo: {
          variants: [
            { id: "var-a", visible: true, sku: "FP-hundgrind-610-mm", price: { actualPrice: { amount: "873" } }, choices: [{ optionChoiceNames: { optionName: "Storlek", choiceName: "610 mm" } }] },
            { id: "var-b", visible: true, sku: "FP-hundgrind-753-mm", price: { actualPrice: { amount: "1071" } }, choices: [{ optionChoiceNames: { optionName: "Storlek", choiceName: "753 mm" } }] },
          ],
        },
      },
    });
    w.lager.sida = [{ id: "inv-a", variantId: "var-a", quantity: 64 }, { id: "inv-b", variantId: "var-b", quantity: 71 }];
    const sida = mappning("XQSIDA1", "sida", {
      vevorArtiklar: ["vevor:XQSIDA1", "vevor:XQSYS2"],
      variants: [
        { supplierVariantId: "XQSIDA1", sku: "FP-hundgrind-610-mm", wixVariantId: "var-a", choices: { Storlek: "610 mm" }, costUsd: 30, landedCostSek: 300, grossSek: 873 },
        { supplierVariantId: "XQSYS2", sku: "FP-hundgrind-753-mm", wixVariantId: "var-b", choices: { Storlek: "753 mm" }, costUsd: 40, landedCostSek: 420, grossSek: 1071 },
      ],
    });
    const m = miljo({
      wix: w,
      mappningar: [sida, mappning("XQGIV7", "utkast")],
      avlasningar: [avlasning("XQSIDA1"), avlasning("XQSYS2"), avlasning("XQGIV7")],
    });
    const svar = await korVevorSammanslagning({ behall: "sida", utkast: "utkast", varden: { Storlek: "813 mm" }, sku: "FP-hundgrind-813-mm-hog" }, m.deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(svar.plan.tillstand).toBe("utoka");
    expect(varianterPa(w)).toHaveLength(3);
    const efter = m.rader.get("sida")!;
    expect(efter.variants.map((v) => v.choices.Storlek)).toEqual(["610 mm", "753 mm", "813 mm"]);
    expect(efter.vevorArtiklar).toEqual(["vevor:XQSIDA1", "vevor:XQSYS2", "vevor:XQGIV7"]);
    expect(artikelbild(efter, PREFIX)).toMatchObject({ typ: "flera" });
  });

  it("en publicerad givare: 301 till givarens variant, avpublicering, recensionerna med", async () => {
    const w = fejkWix({ sida: { visible: true }, utkast: { visible: true } });
    const om = fejkOmdirigeringar([], w.logg);
    const m = miljo({
      wix: w,
      extra: { omdirigeringar: om.lager, oppnaOrdrar: async () => 0 },
    });
    const svar = await korVevorSammanslagning({ ...PAR, omdirigera: true }, m.deps, { apply: true });
    expect(svar.ok).toBe(true);
    expect(w.produkter.utkast.visible).toBe(false);
    expect(om.rader[0].fromSlug).toBe("vevor-fristaende-hundgrind-813");
    expect(om.rader[0].toPath).toMatch(/^\/produkt\/fristaende-hundgrind\?variant=var-ny-1$/);
    // 301:an skrivs före avpubliceringen.
    expect(w.logg.findIndex((x) => x.startsWith("omdirigering"))).toBeLessThan(w.logg.findIndex((x) => x.startsWith("synlighet")));
  });
});
