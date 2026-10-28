// Bilder ur en publicerad sida, mot en låtsas-Wix som vägrar det riktiga Wix
// vägrar: en länkad bild som faller ur galleriet (404 PRODUCT_MEDIA_NOT_EXIST),
// en options-PATCH utan variantsInfo (428) och en gammal revision (409).

import { describe, expect, it } from "vitest";
import {
  MIN_BILDER,
  bortRaknare,
  bortSha,
  kontrolleraBort,
  optionerUtanBilderna,
  planeraBort,
  skrivBort,
  type BortPlan,
} from "./bilder-bort";
import { lasProdukt } from "./fargbilder-kor";
import type { WixAnrop } from "../polish/skrivplan";
import { KOSTNAD_EJ_LASBAR } from "../wix/produkt-kostnad";

type Obj = Record<string, unknown>;

const mid = (n: number) => `b379ce_${n.toString(16).padStart(32, "0")}~mv2.jpg`;
const BILDER = Array.from({ length: 13 }, (_, i) => mid(i + 1));
const ID = "571e37bf-6efe-4851-adcb-afb7b294de72";

/** Cykelkärran i miniatyr: tre färger, 13 bilder, varje bild länkad till en färg. */
function kärra(): Obj {
  const val = (choiceId: string, name: string, lankade: number[]) => ({
    choiceId,
    name,
    choiceType: "CHOICE_TEXT",
    linkedMedia: lankade.map((n) => ({ id: BILDER[n - 1] })),
  });
  const variant = (id: string, valId: string, namn: string, forstaBild: number, pris: string) => ({
    id,
    visible: true,
    sku: `FP-karra-${namn.toLowerCase()}`,
    price: { actualPrice: { amount: pris } },
    choices: [{ optionChoiceIds: { optionId: "opt-farg", choiceId: valId }, optionChoiceNames: { optionName: "Färg", choiceName: namn } }],
    media: { id: BILDER[forstaBild - 1] },
  });
  return {
    id: ID,
    name: "Cykelkärra för hund",
    visible: true,
    revision: "23",
    media: {
      main: { id: BILDER[0] },
      itemsInfo: { items: BILDER.map((id, i) => ({ id, altText: `Bild ${i + 1}` })) },
    },
    options: [
      {
        id: "opt-farg",
        name: "Färg",
        optionRenderType: "TEXT_CHOICES",
        choicesSettings: {
          choices: [
            val("val-rod", "Röd", [1, 2, 4, 5, 6, 7]),
            val("val-bla", "Blå", [8, 3, 9, 10, 11]),
            val("val-svart", "Svart och Vit", [12, 13]),
          ],
        },
      },
    ],
    variantsInfo: {
      variants: [
        variant("var-rod", "val-rod", "Röd", 1, "1599"),
        variant("var-bla", "val-bla", "Blå", 8, "1549"),
        variant("var-svart", "val-svart", "Svart och Vit", 12, "1639"),
      ],
    },
  };
}

/** Varukostnaden som Wix räknar marginal på. `profit` och `profitMargin` är skrivskyddade. */
const KOSTNAD = { cost: { amount: "850.00", formattedAmount: "850,00 kr" }, profit: { amount: "150.00" }, profitMargin: 15 };

function fejkWix(start: Obj = kärra(), opts: { kostnad?: boolean } = {}) {
  const p: Obj = start;
  if (opts.kostnad) for (const v of ((p.variantsInfo as Obj).variants as Obj[])) v.revenueDetails = structuredClone(KOSTNAD);
  const fel: Record<string, number> = {};
  const patchar: string[][] = [];
  /** Wix tappar alt-texterna i galleri-PATCH:en. */
  const sabotage: { altText?: boolean; gamlaLasningar?: number; kostnadNekad?: boolean; tappaKostnad?: boolean } = {};
  let fore: Obj | null = null;
  const kast = (k: string, msg: string) => {
    if ((fel[k] ?? 0) > 0) {
      fel[k]--;
      throw new Error(msg);
    }
  };
  const galleri = () => ((((p.media as Obj).itemsInfo as Obj).items as Obj[]) ?? []).map((b) => String(b.id));
  const lankade = (o: Obj[]) =>
    o.flatMap((x) => (((x.choicesSettings as Obj).choices ?? []) as Obj[]).flatMap((c) => ((c.linkedMedia ?? []) as Obj[]).map((m) => String(m.id))));

  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    if (metod === "GET") {
      const medKostnad = sokvag.includes("MERCHANT_DATA");
      if (medKostnad && sabotage.kostnadNekad) throw new Error("Wix 403: NO_PERMISSION_TO_READ_MERCHANT_DATA");
      // Som Wix: utan MERCHANT_DATA finns ingen `revenueDetails` i svaret.
      const svar = (x: Obj) => {
        const k = structuredClone(x);
        if (!medKostnad) for (const v of ((k.variantsInfo as Obj).variants as Obj[])) delete v.revenueDetails;
        return { product: k };
      };
      if (fore && (sabotage.gamlaLasningar ?? 0) > 0) {
        sabotage.gamlaLasningar!--;
        return svar(fore);
      }
      return svar(p);
    }
    if (metod === "PATCH") {
      const k = kropp as { product: Obj; fieldMask: { paths: string[] } };
      const paths = k.fieldMask.paths;
      patchar.push(paths);
      if (k.product.revision !== p.revision) throw new Error("Wix 409: INVALID_REVISION");
      if (paths.join() === "media") {
        const items = ((k.product.media as Obj).itemsInfo as Obj).items as Obj[];
        if (items.length > 15) throw new Error("Wix 400: för många bilder");
        const nya = new Set(items.map((b) => String(b.id)));
        if (lankade(p.options as Obj[]).some((m) => !nya.has(m))) throw new Error("Wix 404: PRODUCT_MEDIA_NOT_EXIST");
        fore = structuredClone(p);
        p.media = {
          main: { id: items[0].id },
          itemsInfo: { items: structuredClone(items).map((b) => (sabotage.altText ? { ...b, altText: "" } : b)) },
        };
      } else {
        if (!paths.includes("variantsInfo") || !paths.includes("options")) throw new Error("Wix 428: MISSING_OPTIONS_ON_UPDATE_VARIANTS");
        kast("koppling", "Wix 409: INVALID_REVISION (tas emot)");
        kast("koppling428", "Wix 428: MISSING_OPTIONS_ON_UPDATE_VARIANTS");
        const g = new Set(galleri());
        const opts = k.product.options as Obj[];
        if (lankade(opts).some((m) => !g.has(m))) throw new Error("Wix 404: PRODUCT_MEDIA_NOT_EXIST");
        for (const v of (((k.product.variantsInfo as Obj).variants ?? []) as Obj[])) {
          const rd = (v.revenueDetails ?? {}) as Obj;
          if ("profit" in rd || "profitMargin" in rd) throw new Error("Wix 400: profit och profitMargin är skrivskyddade");
        }
        p.options = structuredClone(opts);
        // En variantsInfo-PATCH ERSÄTTER varianterna: det som inte skickas finns inte kvar.
        p.variantsInfo = structuredClone(k.product.variantsInfo);
        if (sabotage.tappaKostnad) for (const v of ((p.variantsInfo as Obj).variants as Obj[])) delete v.revenueDetails;
        p.visible = k.product.visible;
      }
      p.revision = String(Number(p.revision) + 1);
      return { product: structuredClone(p) };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, p, fel, patchar, sabotage, galleri, lankade };
}

async function planFor(w: ReturnType<typeof fejkWix>, bort: string[]): Promise<BortPlan> {
  const las = await lasProdukt(w.wix, ID);
  return planeraBort(las!, bort);
}

const lankarPa = (w: ReturnType<typeof fejkWix>) =>
  Object.fromEntries(
    (((w.p.options as Obj[])[0].choicesSettings as Obj).choices as Obj[]).map((c) => [String(c.name), ((c.linkedMedia ?? []) as Obj[]).map((m) => String(m.id))]),
  );

const TYSK_OCH_ENGELSK = [BILDER[8], BILDER[9]]; // plats 9 och 10

describe("planeraBort", () => {
  it("tar bilderna ur galleriet och ur valets länkar, i samma ordning som förut", async () => {
    const w = fejkWix();
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    expect(plan.hinder).toEqual([]);
    expect(plan.galleriFore).toHaveLength(13);
    expect(plan.galleriEfter.map((b) => b.id)).toEqual(BILDER.filter((_, i) => i !== 8 && i !== 9));
    expect(plan.bort).toEqual([{ plats: 9, id: BILDER[8] }, { plats: 10, id: BILDER[9] }]);
    const bla = plan.val.find((v) => v.valId === "val-bla")!;
    expect(bla.lankadeFore).toEqual([BILDER[7], BILDER[2], BILDER[8], BILDER[9], BILDER[10]]);
    expect(bla.lankadeEfter).toEqual([BILDER[7], BILDER[2], BILDER[10]]);
    expect(plan.val.find((v) => v.valId === "val-rod")!.lankadeEfter).toEqual(plan.val.find((v) => v.valId === "val-rod")!.lankadeFore);
  });

  it("räknarna bär platser och antal, inga id och inga alt-texter", async () => {
    const w = fejkWix();
    const r = bortRaknare(await planFor(w, TYSK_OCH_ENGELSK));
    expect(r).toEqual({
      id: ID,
      galleri: { fore: 13, efter: 11 },
      bort: [9, 10],
      val: [{ axel: "Färg", fore: 5, efter: 3 }],
      hinder: [],
    });
    expect(JSON.stringify(r)).not.toMatch(/mv2|Bild \d/);
  });

  it("☠️ huvudbilden tas aldrig bort", async () => {
    const w = fejkWix();
    expect((await planFor(w, [BILDER[0]])).hinder).toContain("huvudbilden_far_inte_tas_bort");
  });

  it("en bild som inte finns i galleriet är ett hinder, och ingenting antas", async () => {
    const w = fejkWix();
    const plan = await planFor(w, [mid(99)]);
    expect(plan.hinder.join(" ")).toMatch(/okand_bild/);
    expect(plan.bort).toEqual([]);
  });

  it(`☠️ lämnar aldrig färre än ${MIN_BILDER} bilder`, async () => {
    const start = kärra();
    (start.media as Obj).itemsInfo = { items: BILDER.slice(0, 5).map((id) => ({ id, altText: "x" })) };
    for (const o of start.options as Obj[]) {
      for (const c of (o.choicesSettings as Obj).choices as Obj[]) c.linkedMedia = [{ id: BILDER[0] }, { id: BILDER[1] }];
    }
    const w = fejkWix(start);
    const plan = await planFor(w, [BILDER[3], BILDER[4]]);
    expect(plan.hinder.join(" ")).toMatch(/for_fa_bilder_kvar \(3, minst 4\)/);
  });

  it("☠️ ett val som hade bilder ska ha minst en kvar", async () => {
    const w = fejkWix();
    // Svart och Vit har bara plats 12 och 13.
    const plan = await planFor(w, [BILDER[11], BILDER[12]]);
    expect(plan.hinder.join(" ")).toMatch(/val_skulle_sakna_bild \(Färg\)/);
  });

  it("ingen bild angiven, och för många", async () => {
    const w = fejkWix();
    expect((await planFor(w, [])).hinder).toContain("inga_bilder_angivna");
    expect((await planFor(w, BILDER.slice(1, 12))).hinder.join(" ")).toMatch(/for_manga_bilder/);
  });

  it("samma bild två gånger räknas en gång", async () => {
    const w = fejkWix();
    const plan = await planFor(w, [BILDER[8], BILDER[8], BILDER[9]]);
    expect(plan.bort).toHaveLength(2);
  });
});

describe("bortSha", () => {
  it("samma plan ger samma sha, och en annan länklista ger en annan", async () => {
    const w = fejkWix();
    const a = await planFor(w, TYSK_OCH_ENGELSK);
    const b = await planFor(w, [TYSK_OCH_ENGELSK[1], TYSK_OCH_ENGELSK[0]]);
    expect(bortSha(a)).toBe(bortSha(b));
    expect(bortSha(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(bortSha(await planFor(w, [BILDER[8]]))).not.toBe(bortSha(a));
    // Någon ändrar länkarna mellan planen och skrivningen: sha:n skiljer.
    ((((w.p.options as Obj[])[0].choicesSettings as Obj).choices as Obj[])[1] as Obj).linkedMedia = [{ id: BILDER[7] }, { id: BILDER[8] }, { id: BILDER[9] }];
    expect(bortSha(await planFor(w, TYSK_OCH_ENGELSK))).not.toBe(bortSha(a));
  });
});

describe("skrivBort", () => {
  it("☠️ länkarna skrivs FÖRE galleriet, och sidan stämmer efteråt", async () => {
    const w = fejkWix();
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    const u = await skrivBort(plan, { wix: w.wix, vanta: async () => {} });
    expect(u.fel).toBeUndefined();
    expect(u.ok).toBe(true);
    expect(w.patchar[0]).toEqual(["options", "variantsInfo", "visible"]);
    expect(w.patchar[1]).toEqual(["media"]);
    expect(w.patchar).toHaveLength(2);
    expect(w.galleri()).toEqual(plan.galleriEfter.map((b) => b.id));
    expect(lankarPa(w)["Blå"]).toEqual([BILDER[7], BILDER[2], BILDER[10]]);
    expect(lankarPa(w)["Röd"]).toEqual([BILDER[0], BILDER[1], BILDER[3], BILDER[4], BILDER[5], BILDER[6]]);
    // Allt annat är orört: synlighet, pris, SKU och alt-texterna på de bilder som blev kvar.
    expect(w.p.visible).toBe(true);
    const v = ((w.p.variantsInfo as Obj).variants as Obj[]).map((x) => [x.sku, (x.price as Obj & { actualPrice: Obj }).actualPrice.amount]);
    expect(v).toEqual([["FP-karra-röd", "1599"], ["FP-karra-blå", "1549"], ["FP-karra-svart och vit", "1639"]]);
    expect((((w.p.media as Obj).itemsInfo as Obj).items as Obj[]).find((b) => b.id === BILDER[10])!.altText).toBe("Bild 11");
    expect(u.steg.some((s) => s.startsWith("länkar: 1 val"))).toBe(true);
    expect(u.steg).toContain("variantbilder: rätt");
  });

  it("ett 404 vore resultatet om galleriet skrevs först — därför är ordningen låst", async () => {
    const w = fejkWix();
    await expect(
      w.wix("PATCH", `/stores/v3/products/${ID}`, {
        product: { revision: "23", media: { itemsInfo: { items: BILDER.filter((_, i) => i !== 8).map((id) => ({ id, altText: "x" })) } } },
        fieldMask: { paths: ["media"] },
      }),
    ).rejects.toThrow(/PRODUCT_MEDIA_NOT_EXIST/);
  });

  it("☠️ varukostnaden följer med länkskrivningen — utan MERCHANT_DATA hade PATCH:en nollat den", async () => {
    const w = fejkWix(kärra(), { kostnad: true });
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    const u = await skrivBort(plan, { wix: w.wix, vanta: async () => {} });
    expect(u.ok).toBe(true);
    const varianter = (w.p.variantsInfo as Obj).variants as Obj[];
    expect(varianter).toHaveLength(3);
    for (const v of varianter) expect(v.revenueDetails, "varje variant behåller sin kostnad").toEqual({ cost: KOSTNAD.cost });
  });

  it("☠️ nekas kostnadsfältet skrivs sidan ändå, och svaret säger att kostnaden inte följde med", async () => {
    const w = fejkWix(kärra(), { kostnad: true });
    w.sabotage.kostnadNekad = true;
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    const u = await skrivBort(plan, { wix: w.wix, vanta: async () => {} });
    expect(u.ok).toBe(true);
    expect(u.steg).toContain(KOSTNAD_EJ_LASBAR);
  });

  it("☠️ en kostnad som ändå försvinner i skrivningen stoppar körningen", async () => {
    const w = fejkWix(kärra(), { kostnad: true });
    w.sabotage.tappaKostnad = true;
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    const u = await skrivBort(plan, { wix: w.wix, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/kostnad ändrades/);
  });

  it("☠️ en plan med hinder skriver ingenting och rör inte Wix", async () => {
    const w = fejkWix();
    const anrop: string[] = [];
    const plan = await planFor(w, [BILDER[0]]);
    const u = await skrivBort(plan, { wix: async (m, s, k) => { anrop.push(m); return w.wix(m, s, k); }, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/huvudbilden_far_inte_tas_bort/);
    expect(anrop).toEqual([]);
  });

  it("☠️ har sidan ändrats sedan planen skrivs ingenting", async () => {
    const w = fejkWix();
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    // Någon lägger till en bild efter planen.
    ((((w.p.media as Obj).itemsInfo as Obj).items) as Obj[]).push({ id: mid(50), altText: "ny" });
    const u = await skrivBort(plan, { wix: w.wix, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/har ändrats sedan planen/);
    expect(w.patchar).toEqual([]);
  });

  it("en länkning som faller medan Wix tar emot ändringen försöks om", async () => {
    const w = fejkWix();
    w.fel.koppling = 2;
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    const u = await skrivBort(plan, { wix: w.wix, vanta: async () => {} });
    expect(u.ok).toBe(true);
    expect(u.steg.join(" ")).toMatch(/länkar: 1 val \(3 försök\)/);
  });

  it("☠️ ett fel som inte är övergående stoppar före galleriet", async () => {
    const w = fejkWix();
    w.fel.koppling428 = 1;
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    const u = await skrivBort(plan, { wix: w.wix, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/länkningen föll.*428.*galleriet är orört/);
    expect(w.patchar.filter((p) => p.join() === "media")).toHaveLength(0);
    expect(w.galleri()).toHaveLength(13);
  });

  it("☠️ tappar Wix alt-texterna i galleriet märks det i återläsningen", async () => {
    const w = fejkWix();
    w.sabotage.altText = true;
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    const u = await skrivBort(plan, { wix: w.wix, vanta: async () => {} });
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/en alt-text är inte den planerade/);
  });

  it("en gammal läsning direkt efter galleri-PATCH:en läses om, och körningen lyckas", async () => {
    const w = fejkWix();
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    const original = w.wix;
    let galleriSkrivet = false;
    const wix: WixAnrop = async (m, s, k) => {
      const r = await original(m, s, k);
      if (m === "PATCH" && (k as { fieldMask: { paths: string[] } }).fieldMask.paths.join() === "media" && !galleriSkrivet) {
        galleriSkrivet = true;
        w.sabotage.gamlaLasningar = 2;
      }
      return r;
    };
    const u = await skrivBort(plan, { wix, vanta: async () => {} });
    expect(u.fel).toBeUndefined();
    expect(u.ok).toBe(true);
  });

  it("en körning som föll mellan länkarna och galleriet fortsätter där den slutade", async () => {
    const w = fejkWix();
    // Länkarna är redan skrivna utan de två bilderna; galleriet har dem kvar.
    const f = await planFor(w, TYSK_OCH_ENGELSK);
    await w.wix("PATCH", `/stores/v3/products/${ID}`, {
      product: { revision: w.p.revision, visible: true, options: optionerUtanBilderna((await lasProdukt(w.wix, ID))!.ra, f), variantsInfo: w.p.variantsInfo },
      fieldMask: { paths: ["options", "variantsInfo", "visible"] },
    });
    expect(w.galleri()).toHaveLength(13);
    // Planen räknas om ur det nya läget: länkarna är redan rätt.
    const plan = await planFor(w, TYSK_OCH_ENGELSK);
    expect(plan.val.every((v) => v.lankadeFore.join() === v.lankadeEfter.join())).toBe(true);
    const u = await skrivBort(plan, { wix: w.wix, vanta: async () => {} });
    expect(u.ok).toBe(true);
    expect(w.galleri()).toHaveLength(11);
    expect(u.steg.some((s) => s.startsWith("länkar"))).toBe(false);
  });

  it("☠️ pris, SKU och synlighet som ändras av skrivningen fäller körningen", async () => {
    const w = fejkWix();
    const fore = (await lasProdukt(w.wix, ID))!;
    // En plan som inte ändrar något: sidan jämförd med sig själv ger inga avvikelser.
    const oforandrad: BortPlan = { ...planeraBort(fore, TYSK_OCH_ENGELSK), val: planeraBort(fore, TYSK_OCH_ENGELSK).val.map((v) => ({ ...v, lankadeEfter: v.lankadeFore })) };
    const lage = { synlig: fore.synlig, optioner: fore.optioner, varianter: fore.varianter };
    expect(kontrolleraBort(oforandrad, fore.bilder, lage, fore)).toEqual([]);
    const andrad = { ...fore, synlig: false, varianter: fore.varianter.map((v, i) => (i === 1 ? { ...v, pris: "9", sku: "annat" } : v)) };
    expect(kontrolleraBort(oforandrad, fore.bilder, lage, andrad)).toEqual(
      expect.arrayContaining(["sidans synlighet ändrades", "en variants pris ändrades", "en variants SKU ändrades"]),
    );
  });
});
