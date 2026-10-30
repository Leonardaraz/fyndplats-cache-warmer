// Rättningen av VEVOR-familjernas bilder mot en låtsas-Wix som vägrar det
// riktiga Wix vägrar: en kopplad bild som faller ur galleriet och en koppling
// till en bild utanför galleriet (404 PRODUCT_MEDIA_NOT_EXIST), en gammal
// revision (409) och en options-PATCH utan variantsInfo (428).

import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import type { WixAnrop } from "@/lib/polish/skrivplan";
import type { VariantbildUtfall } from "@/lib/wix/variant-media";
import { valjVevorBilder } from "./bilder";
import {
  altFor,
  bildaxelFor,
  korFamiljebilder,
  lasOchPlanera,
  normKalla,
  planeraFamilj,
  skrivFamilj,
  type FamiljebildDeps,
} from "./familjebilder";
import type { Avlasning } from "./lager";
import { testAvlasning, testgalleri } from "./testsida";

type Obj = Record<string, unknown>;

// Påhittade artikelnummer och id.
const sku = (n: number) => `TESTSKUFB${String(n).padStart(6, "0")}`;
const PID = "00000000-0000-4000-8000-0000000000f1";
const NAMN = "VEVOR Testskydd, 2 st";
const FARGER = ["Röd", "Grön", "Orange"];

const avl = (n: number): Avlasning => testAvlasning({ sku: sku(n), bilder: testgalleri(sku(n)) });
const valda = (n: number) => valjVevorBilder(avl(n).bilder).urls;

function mappning(over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplier: "vevor",
    supplierProductId: `vevor:${sku(1)}`,
    wixProductId: PID,
    needsAiPolish: true,
    variants: [1, 2, 3].map((n, i) => ({
      supplierVariantId: sku(n),
      sku: `FP-test-${n}`,
      wixVariantId: `var-${n}`,
      choices: { Färg: FARGER[i] },
      costUsd: 30,
      landedCostSek: 300,
      grossSek: 399,
    })),
    ...over,
  } as ProductMappingRecord;
}

/** Utkastet som importen gjorde före 2026-10-30: ankarets sex bilder och en swatch per färg. */
function gammalProdukt(): { produkt: Obj; kallor: Map<string, string> } {
  const kallor = new Map<string, string>();
  const items: Obj[] = [];
  valda(1).forEach((u, i) => {
    kallor.set(`a${i + 1}`, u);
    items.push({ id: `a${i + 1}`, altText: `${NAMN} (röd)` });
  });
  for (const [i, n] of [1, 2, 3].entries()) {
    kallor.set(`s${n}`, valda(n)[0]);
    items.push({ id: `s${n}`, altText: `${NAMN} – ${FARGER[i]}` });
  }
  return {
    kallor,
    produkt: {
      id: PID,
      name: NAMN,
      visible: false,
      revision: "1",
      media: { itemsInfo: { items } },
      options: [
        {
          name: "Färg",
          choicesSettings: {
            choices: FARGER.map((f, i) => ({ choiceId: `c${i + 1}`, name: f, linkedMedia: [{ id: `s${i + 1}` }] })),
          },
        },
      ],
      variantsInfo: {
        variants: [1, 2, 3].map((n, i) => ({
          id: `var-${n}`,
          visible: true,
          sku: `FP-test-${n}`,
          price: { actualPrice: { amount: "399" } },
          choices: [{ optionChoiceNames: { optionName: "Färg", choiceName: FARGER[i] } }],
          revenueDetails: { cost: { amount: "300.00" } },
        })),
      },
    },
  };
}

const UTKAST: VariantbildUtfall = { productId: PID, status: "utkast_hoppat", avvikande: [], okanda: [] } as unknown as VariantbildUtfall;

function fejk(opts: { produkt?: Obj; kallor?: Map<string, string>; mappningar?: ProductMappingRecord[]; avlasningar?: Avlasning[] } = {}) {
  const gammal = gammalProdukt();
  const p = opts.produkt ?? gammal.produkt;
  const kallor = opts.kallor ?? gammal.kallor;
  const patchar: string[][] = [];
  const sabotage: { sku?: boolean; uppladdningFaller?: boolean } = {};
  let filNr = 0;
  const lankade = (x: Obj) =>
    ((x.options ?? []) as Obj[]).flatMap((o) =>
      ((((o.choicesSettings as Obj).choices ?? []) as Obj[]).flatMap((c) => ((c.linkedMedia ?? []) as Obj[]).map((m) => String(m.id)))));
  const galleri = (x: Obj) => (((x.media as Obj).itemsInfo as Obj).items as Obj[]).map((b) => String(b.id));
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    if (metod === "GET") return { product: structuredClone(p) };
    const k = kropp as { product: Obj; fieldMask: { paths: string[] } };
    patchar.push(k.fieldMask.paths);
    if (k.product.revision !== p.revision) throw new Error("Wix 409: INVALID_REVISION");
    if (k.fieldMask.paths.join() === "media") {
      const items = ((k.product.media as Obj).itemsInfo as Obj).items as Obj[];
      const nya = new Set(items.map((b) => String(b.id)));
      if (lankade(p).some((m) => !nya.has(m))) throw new Error("Wix 404: PRODUCT_MEDIA_NOT_EXIST");
      p.media = { itemsInfo: { items: structuredClone(items) } };
    } else {
      if (!k.fieldMask.paths.includes("variantsInfo") || !k.fieldMask.paths.includes("options")) {
        throw new Error("Wix 428: MISSING_OPTIONS_ON_UPDATE_VARIANTS");
      }
      const g = new Set(galleri(p));
      if (lankade(k.product).some((m) => !g.has(m))) throw new Error("Wix 404: PRODUCT_MEDIA_NOT_EXIST");
      p.options = structuredClone(k.product.options);
      p.variantsInfo = structuredClone(k.product.variantsInfo);
      if (sabotage.sku) ((p.variantsInfo as Obj).variants as Obj[])[0].sku = "FP-annan";
      p.visible = k.product.visible;
    }
    p.revision = String(Number(p.revision) + 1);
    return { product: structuredClone(p) };
  };
  const avlasningar = opts.avlasningar ?? [1, 2, 3].map(avl);
  const deps: FamiljebildDeps = {
    wix,
    mappningar: async () => opts.mappningar ?? [mappning()],
    avlasningar: async (skus) => new Map(avlasningar.filter((a) => skus.includes(a.sku)).map((a) => [a.sku, a])),
    kallor: async (idn) => new Map(idn.filter((id) => kallor.has(id)).map((id) => [id, kallor.get(id)!])),
    laddaUpp: async (url) => {
      if (sabotage.uppladdningFaller) throw new Error("Wix 500: uppladdningen föll");
      const id = `n${++filNr}`;
      kallor.set(id, url);
      return { id };
    },
    variantbild: async () => UTKAST,
    vanta: async () => {},
  };
  return { p, kallor, deps, patchar, sabotage, galleri, lankade };
}

const valen = (p: Obj) => (((p.options as Obj[])[0].choicesSettings as Obj).choices as Obj[]).map((c) => ((c.linkedMedia ?? []) as Obj[]).map((m) => String(m.id)));

describe("planeraFamilj", () => {
  it("☠️ varje färg får sina sex bilder, ankarets dubblett går ut, och tio bilder laddas upp", async () => {
    const f = fejk();
    const last = await lasOchPlanera(f.deps, mappning());
    const plan = last!.plan;
    expect(plan.hinder).toEqual([]);
    expect(plan.axel).toBe("Färg");
    expect(plan.galleriEfter.map((b) => normKalla(b.kalla))).toEqual([...valda(1), ...valda(2), ...valda(3)].map(normKalla));
    // Ankarets bilder och syskonens gamla swatch-bilder återanvänds, resten laddas upp.
    expect(plan.galleriEfter.map((b) => b.id)).toEqual([
      "a1", "a2", "a3", "a4", "a5", "a6",
      "s2", null, null, null, null, null,
      "s3", null, null, null, null, null,
    ]);
    expect(plan.nya).toBe(10);
    expect(plan.utgar.map((b) => b.id)).toEqual(["s1"]);
    expect(plan.galleriEfter[0].alt).toBe(altFor(NAMN, "Röd", 1));
    expect(plan.galleriEfter[7].alt).toBe(`${NAMN} – Grön, bild 2`);
    expect(plan.val.map((v) => [v.namn, v.kallorEfter.length])).toEqual([["Röd", 6], ["Grön", 6], ["Orange", 6]]);
    expect(plan.andrar).toBe(true);
  });

  it("☠️ en bild med en källa utanför familjen, eller utan källa, stoppar familjen", async () => {
    for (const kalla of ["https://example.test/annan-adress.jpg", null]) {
      const g = gammalProdukt();
      ((g.produkt.media as Obj).itemsInfo as Obj as { items: Obj[] }).items.push({ id: "x", altText: "Annan" });
      if (kalla) g.kallor.set("x", kalla);
      const f = fejk({ produkt: g.produkt, kallor: g.kallor });
      const plan = (await lasOchPlanera(f.deps, mappning()))!.plan;
      expect(plan.hinder).toEqual(["okand_kalla"]);
      expect(plan.galleriEfter).toEqual([]);
      expect(plan.nya).toBe(0);
      const svar = await korFamiljebilder(f.deps, { dryRun: false, bekrafta: 0, budgetMs: 300_000 });
      expect(svar.hinder.okand_kalla).toBe(1);
      expect(svar.attRatta).toBe(0);
      expect(f.patchar).toEqual([]);
    }
  });

  it("☠️ hinder: publicerad, polerad, saknad avläsning, ingen bildaxel och ett värde som inte finns", async () => {
    const g = gammalProdukt();
    const p = (await lasOchPlanera(fejk().deps, mappning()))!.produkt;
    const kallor = g.kallor;
    const alla = new Map([1, 2, 3].map((n) => [sku(n), avl(n)]));
    expect(planeraFamilj(mappning(), { ...p, synlig: true }, kallor, alla).hinder).toContain("publicerad");
    expect(planeraFamilj(mappning({ needsAiPolish: false }), p, kallor, alla).hinder).toContain("polerad");
    const tva = new Map([1, 2].map((n) => [sku(n), avl(n)]));
    expect(planeraFamilj(mappning(), p, kallor, tva).hinder).toContain("avlasning_saknas");
    const sammaFarg = mappning();
    sammaFarg.variants.forEach((v) => (v.choices = { Färg: "Röd" }));
    expect(planeraFamilj(sammaFarg, p, kallor, alla).hinder).toContain("ingen_bildaxel");
    const okand = mappning();
    okand.variants[2].choices = { Färg: "Blå" };
    expect(planeraFamilj(okand, p, kallor, alla).hinder).toEqual(["val_saknas"]);
    for (const plan of [planeraFamilj(mappning(), { ...p, synlig: true }, kallor, alla)]) {
      expect(plan.andrar).toBe(false);
    }
  });
});

describe("bildaxelFor", () => {
  it("den första axeln med olika värde för varje artikel, annars null", () => {
    const v = (choices: Record<string, string>) => ({ choices }) as ProductMappingRecord["variants"][number];
    expect(bildaxelFor([v({ Typ: "A", Färg: "Röd" }), v({ Typ: "A", Färg: "Grön" })])).toBe("Färg");
    expect(bildaxelFor([v({ Typ: "A", Färg: "Röd" }), v({ Typ: "B", Färg: "Grön" })])).toBe("Typ");
    expect(bildaxelFor([v({ Färg: "Röd" }), v({ Färg: "röd" })])).toBeNull();
    expect(bildaxelFor([v({ Färg: "Röd" })])).toBeNull();
  });
});

describe("skrivFamilj", () => {
  it("☠️ skriver i steg: galleriet med den länkade dubbletten kvar, länkarna, sedan galleriet utan den", async () => {
    const f = fejk();
    const u = await skrivFamilj(mappning(), f.deps);
    expect(u.ok, u.fel).toBe(true);
    expect(f.patchar.map((x) => x.join())).toEqual(["media", "options,variantsInfo,visible", "media"]);
    // Galleriet: arton bilder, ingen två gånger, ankarets först.
    const galleri = f.galleri(f.p);
    expect(galleri).toHaveLength(18);
    expect(new Set(galleri).size).toBe(18);
    expect(galleri.slice(0, 6)).toEqual(["a1", "a2", "a3", "a4", "a5", "a6"]);
    expect(galleri).not.toContain("s1");
    // Varje färg pekar på sina sex bilder, i ordning, och huvudbilden är röds första.
    const v = valen(f.p);
    expect(v[0]).toEqual(["a1", "a2", "a3", "a4", "a5", "a6"]);
    expect(v[1][0]).toBe("s2");
    expect(v[2][0]).toBe("s3");
    expect(v.map((x) => x.length)).toEqual([6, 6, 6]);
    for (const [i, ids] of v.entries()) {
      expect(ids.map((id) => normKalla(f.kallor.get(id)!))).toEqual(valda(i + 1).map(normKalla));
    }
    // Alt-texterna som importen sätter dem.
    const alts = (((f.p.media as Obj).itemsInfo as Obj).items as Obj[]).map((b) => b.altText);
    expect(alts[0]).toBe(`${NAMN} – Röd`);
    expect(alts[6]).toBe(`${NAMN} – Grön`);
    expect(alts[13]).toBe(`${NAMN} – Orange, bild 2`);
    // Utkastet förblir dolt, och varianterna är orörda.
    expect(f.p.visible).toBe(false);
    expect(((f.p.variantsInfo as Obj).variants as Obj[]).map((x) => [x.sku, (x.revenueDetails as Obj).cost])).toEqual(
      [1, 2, 3].map((n) => [`FP-test-${n}`, { amount: "300.00" }]),
    );
  });

  it("en andra körning är rätt redan och skriver ingenting", async () => {
    const f = fejk();
    expect((await skrivFamilj(mappning(), f.deps)).ok).toBe(true);
    const n = f.patchar.length;
    const u = await skrivFamilj(mappning(), f.deps);
    expect(u).toEqual({ id: PID, ok: true, steg: ["redan rätt"] });
    expect(f.patchar).toHaveLength(n);
    expect((await lasOchPlanera(f.deps, mappning()))!.plan.andrar).toBe(false);
  });

  it("☠️ en uppladdning som faller lämnar Wix orört", async () => {
    const f = fejk();
    f.sabotage.uppladdningFaller = true;
    const u = await skrivFamilj(mappning(), f.deps);
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/Wix rördes INTE/);
    expect(f.patchar).toHaveLength(0);
  });

  it("☠️ en variant som ändras i skrivningen stoppar sidan", async () => {
    const f = fejk();
    f.sabotage.sku = true;
    const u = await skrivFamilj(mappning(), f.deps);
    expect(u.ok).toBe(false);
    expect(u.fel).toMatch(/SKU ändrades/);
  });
});

describe("korFamiljebilder", () => {
  it("torrt: räknar sidor, nya bilder och gamla kopior, och skriver ingenting", async () => {
    const f = fejk();
    const s = await korFamiljebilder(f.deps, { dryRun: true, bekrafta: null, budgetMs: 240_000 });
    expect(s).toMatchObject({ familjer: 1, attRatta: 1, redanRatt: 0, nyaBilder: 10, utgar: 1, skrivna: 0, kvar: 1, stoppadAv: "klart", idn: [PID] });
    expect(f.patchar).toHaveLength(0);
  });

  it("☠️ skarpt kräver bekrafta, och vägrar en plan som vuxit förbi den", async () => {
    const f = fejk();
    await expect(korFamiljebilder(f.deps, { dryRun: false, bekrafta: null, budgetMs: 240_000 })).rejects.toThrow(/bekrafta/);
    await expect(korFamiljebilder(f.deps, { dryRun: false, bekrafta: 0, budgetMs: 240_000 })).rejects.toThrow(/fler än bekrafta/);
    expect(f.patchar).toHaveLength(0);
  });

  it("skarpt: rättar, och sedan är inget kvar att rätta", async () => {
    const f = fejk();
    const s = await korFamiljebilder(f.deps, { dryRun: false, bekrafta: 1, budgetMs: 240_000 });
    expect(s).toMatchObject({ skrivna: 1, stoppadAv: "klart", fel: null });
    const igen = await korFamiljebilder(f.deps, { dryRun: true, bekrafta: null, budgetMs: 240_000 });
    expect(igen).toMatchObject({ attRatta: 0, redanRatt: 1 });
  });

  it("en enkel artikel och en annan leverantör är inga familjer", async () => {
    const enkel = mappning({ variants: mappning().variants.slice(0, 1) });
    const aosom = mappning({ supplier: "aosom", supplierProductId: "aosom:TEST" });
    const f = fejk({ mappningar: [enkel, aosom] });
    const s = await korFamiljebilder(f.deps, { dryRun: true, bekrafta: null, budgetMs: 240_000 });
    expect(s.familjer).toBe(0);
  });

  it("☠️ svaret bär inga artikelnummer och inga adresser", async () => {
    const f = fejk();
    f.sabotage.sku = true;
    const s = await korFamiljebilder(f.deps, { dryRun: false, bekrafta: 1, budgetMs: 240_000 });
    expect(s.stoppadAv).toBe("fel");
    const text = JSON.stringify(s);
    for (const n of [1, 2, 3]) expect(text).not.toContain(sku(n));
    expect(text).not.toMatch(/https?:\/\//);
  });
});
