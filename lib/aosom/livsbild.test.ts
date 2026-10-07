// Miljöbildsverktyget: bedömningen (okand mot saknas, länkad mot olänkad),
// färgens vy som butiken visar den, flytt och infogning på plats två,
// hindren, sha-bindningen, den stegvisa skrivningen, kandidaterna — och att
// det publika svaret aldrig bär ett artikelnummer eller en adress ur feeden.

import { describe, it, expect } from "vitest";
import {
  bedomGalleri,
  bedomVal,
  fargVy,
  hamtaKandidater,
  normKalla,
  planSha,
  planera,
  planeraOchSkriv,
  planeraSida,
  placeraIVal,
  rapportera,
  tolkaNycklar,
  tolkaPar,
  KALLOR_PER_ANROP,
  MAX_BILDER,
  type Atgard,
  type LivsbildDeps,
  type Mal,
} from "./livsbild";
import type { AosomRow } from "./feed";
import type { ProductMappingRecord } from "../store";
import type { WixAnrop } from "../polish/skrivplan";
import type { Bild, SidOption } from "./fargbilder";

type Obj = Record<string, unknown>;

// Igenkännbara strängar: hittas någon av dem i ett svar har något läckt.
const SKU_A = "835-HEMLIGA";
const SKU_B = "836-HEMLIGB";
const SKU_C = "837-HEMLIGC";
const CDN = "https://img.aosomcdn.com/HEMLIG-KATALOG";
const kallUrl = (sku: string, pos: number) => `${CDN}/${sku}/${pos}.jpg`;
const HEMLIGT = [SKU_A, SKU_B, SKU_C, "999-FINNSINTE", "HEMLIG", "aosomcdn", "aosom.de", "img."];

function rad(sku: string, over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku,
    name: `Produkt ${sku}`,
    url: `https://www.aosom.de/HEMLIG-PRODUKTSIDA~${sku}.html`,
    imageUrls: Array.from({ length: 10 }, (_, i) => kallUrl(sku, i + 1)),
    category: "", color: "", material: "", size: "", packageSize: "",
    weightKg: 5, descriptionHtml: "", bulletsHtml: "", qty: 5,
    normalPriceEur: 100, wholesaleEur: 40, seFreightEur: 20, rowIndex: 1,
    ...over,
  };
}
const FEED = [rad(SKU_A), rad(SKU_B), rad(SKU_C, { imageUrls: [kallUrl(SKU_C, 1)] })];

const id = (n: number) => `${String(n).padStart(8, "0")}-0000-4000-8000-000000000000`;
const fil = (n: number) => `b379ce_${n.toString(16).padStart(32, "0")}~mv2.jpg`;

/** Galleribilderna "A1", "B2" … har källan artikelns position. */
const KALLOR = new Map<string, string>();
for (const [p, sku] of [["A", SKU_A], ["B", SKU_B]] as const) {
  for (let i = 1; i <= 10; i++) KALLOR.set(`${p}${i}`, kallUrl(sku, i));
}
KALLOR.set("KORT", "https://static.wixstatic.com/media/eget-kort.jpg");

function enkel(wixId: string, sku: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return { supplierProductId: `aosom:${sku}`, supplier: "aosom", wixProductId: wixId, variants: [], ...over };
}

function flera(wixId: string): ProductMappingRecord {
  return enkel(wixId, SKU_A, {
    variants: [
      { wixVariantId: "v1", supplierVariantId: SKU_A, sku: "FP-1", choices: { Färg: "Grå" } },
      { wixVariantId: "v2", supplierVariantId: SKU_B, sku: "FP-2", choices: { Färg: "Blå" } },
    ] as unknown as ProductMappingRecord["variants"],
  });
}

/** En V3-produkt i Wix form. `farger` = valens länkade bilder. */
function v3(n: number, galleri: string[], farger?: { gra: string[]; bla: string[] }, over: Obj = {}): Obj {
  const alt = (g: string) => (g === "KORT" ? "Måttkort för soffan" : g.startsWith("B") ? "Den blå soffan" : `Soffa ${g}`);
  return {
    id: id(n), name: `Soffa ${n}`, visible: true, revision: "1",
    media: { itemsInfo: { items: galleri.map((g) => ({ id: g, altText: alt(g) })) } },
    options: farger
      ? [{
        id: "opt-farg", name: "Färg",
        choicesSettings: {
          choices: [
            { choiceId: "c-gra", name: "Grå", linkedMedia: farger.gra.map((x) => ({ id: x })) },
            { choiceId: "c-bla", name: "Blå", linkedMedia: farger.bla.map((x) => ({ id: x })) },
          ],
        },
      }]
      : [],
    variantsInfo: {
      variants: farger
        ? [
          { id: "v1", visible: true, sku: "FP-1", price: { actualPrice: { amount: "999" } }, choices: [{ optionChoiceNames: { optionName: "Färg", choiceName: "Grå" } }] },
          { id: "v2", visible: true, sku: "FP-2", price: { actualPrice: { amount: "999" } }, choices: [{ optionChoiceNames: { optionName: "Färg", choiceName: "Blå" } }] },
        ]
        : [{ id: "v1", visible: true, sku: "FP-1", price: { actualPrice: { amount: "499" } } }],
    },
    ...over,
  };
}

/** Wix, mappningarna, feeden och Media Manager som en liten värld. */
function varld(produkter: Obj[], mappningar: ProductMappingRecord[], kallor = KALLOR) {
  const p = new Map(produkter.map((x) => [x.id as string, structuredClone(x)]));
  const rader = new Map(mappningar.map((m) => [m.wixProductId, structuredClone(m)]));
  const patchar: { paths: string[]; product: Obj }[] = [];
  const sokningar: Obj[] = [];
  const kallAnrop: string[][] = [];
  const uppladdade: { url: string; namn: string }[] = [];
  const sparade: ProductMappingRecord[] = [];
  const v = {
    /** Så många GET efter en galleri-PATCH svarar med galleriet från före. */
    gamlaLasningar: 0,
    /** Så många länkskrivningar svarar 404 PRODUCT_MEDIA_NOT_EXIST. */
    lank404: 0,
    /** Produkter vars galleri-PATCH Wix "tar emot" utan att ändra något. */
    tarInte: new Set<string>(),
    /** Sidstorlek i sökningen. */
    sidstorlek: 100,
  };
  const fore = new Map<string, Obj>();
  const wix: WixAnrop = async (metod, sokvag, kropp) => {
    if (sokvag === "/stores/v3/products/search") {
      sokningar.push(structuredClone(kropp) as Obj);
      const cursor = ((kropp as { search: { cursorPaging: { cursor?: string } } }).search.cursorPaging.cursor) ?? "";
      const fran = cursor ? Number(cursor.slice(1)) : 0;
      const alla = [...p.values()];
      const sida = alla.slice(fran, fran + v.sidstorlek);
      const mer = fran + v.sidstorlek < alla.length;
      return { products: structuredClone(sida), pagingMetadata: { hasNext: mer, cursors: mer ? { next: `m${fran + v.sidstorlek}` } : {} } };
    }
    const wid = decodeURIComponent(sokvag.split("?")[0].split("/").pop()!);
    const x = p.get(wid);
    if (!x) throw new Error("Wix 404: finns inte");
    if (metod === "GET") {
      if (v.gamlaLasningar > 0 && fore.has(wid)) {
        v.gamlaLasningar--;
        return { product: structuredClone(fore.get(wid)) };
      }
      return { product: structuredClone(x) };
    }
    const k = kropp as { product: Obj; fieldMask: { paths: string[] } };
    patchar.push({ paths: k.fieldMask.paths, product: structuredClone(k.product) });
    if (k.fieldMask.paths.join() === "media") {
      fore.set(wid, structuredClone(x));
      if (!v.tarInte.has(wid)) x.media = structuredClone(k.product.media);
    } else {
      if (v.lank404 > 0) {
        v.lank404--;
        throw new Error("Wix 404: PRODUCT_MEDIA_NOT_EXIST");
      }
      x.options = structuredClone(k.product.options);
      x.variantsInfo = structuredClone(k.product.variantsInfo);
      x.visible = k.product.visible;
    }
    x.revision = String(Number(x.revision) + 1);
    return { product: structuredClone(x) };
  };
  const deps: LivsbildDeps = {
    wix,
    mappningar: async () => [...rader.values()].map((r) => structuredClone(r)),
    hamtaMappning: async (w) => structuredClone(rader.get(w) ?? null),
    sparaMappning: async (r) => {
      sparade.push(structuredClone(r));
      rader.set(r.wixProductId, structuredClone(r));
    },
    hamtaFeed: async () => FEED,
    hamtaKallor: async (ids) => {
      kallAnrop.push(ids);
      return new Map(ids.filter((x) => kallor.has(x)).map((x) => [x, kallor.get(x)!]));
    },
    laddaUpp: async (url, namn) => {
      uppladdade.push({ url, namn });
      const n = uppladdade.length;
      return { id: fil(1000 + n), url: `https://static.wixstatic.com/media/${fil(1000 + n)}` };
    },
    vanta: async () => {},
    nu: () => 0,
  };
  return { deps, v, p, patchar, sokningar, kallAnrop, uppladdade, sparade, rader };
}

const lankade = (x: Obj, valId: string) =>
  ((((x.options as Obj[])[0].choicesSettings as Obj).choices as Obj[]).find((c) => c.choiceId === valId)!.linkedMedia as Obj[])
    .map((m) => m.id);
const st = (r: { status: string } | { hinder: string }) => ("status" in r ? r.status : r.hinder);
const galleriAv = (x: Obj) => (((x.media as Obj).itemsInfo as Obj).items as Obj[]).map((i) => i.id);

// ── bedömningen ─────────────────────────────────────────────────────────────

describe("bedomGalleri", () => {
  const mal = new Map([[normKalla(kallUrl(SKU_A, 2)), kallUrl(SKU_A, 2)]]);

  it("plats 1 är har_som_tva, plats 0 ar_huvudbild, längre bak har_annan_plats", () => {
    expect(bedomGalleri(["A1", "A2", "A3"], KALLOR, mal)).toEqual({ status: "har_som_tva", fil: "A2" });
    expect(bedomGalleri(["A2", "A1"], KALLOR, mal)).toEqual({ status: "ar_huvudbild", fil: "A2" });
    expect(bedomGalleri(["A1", "A3", "A2"], KALLOR, mal)).toEqual({ status: "har_annan_plats", fil: "A2" });
  });

  it("saknas bara när varje bild är spårad", () => {
    expect(bedomGalleri(["A1", "A3"], KALLOR, mal)).toEqual({ status: "saknas" });
  });

  it("☠️ en ospårad bild gör svaret okand, aldrig saknas", () => {
    expect(bedomGalleri(["A1", "x9", "A3"], KALLOR, mal)).toEqual({ status: "okand" });
  });

  it("jämför utan protokoll och query", () => {
    const k = new Map([["z", "http://IMG.aosomcdn.com/HEMLIG-KATALOG/835-HEMLIGA/2.jpg?v=3"]]);
    expect(bedomGalleri(["A1", "z"], new Map([...KALLOR, ...k]), mal).status).toBe("har_som_tva");
  });
});

describe("färgens vy och bedömning", () => {
  const sida = (galleri: string[], gra: string[], bla: string[]) => {
    const p = v3(1, galleri, { gra, bla });
    return {
      bilder: galleri.map((g) => ({
        id: g,
        alt: ((((p.media as Obj).itemsInfo as Obj).items as Obj[]).find((i) => i.id === g)!.altText as string),
      })),
      optioner: [{
        namn: "Färg",
        val: [{ id: "c-gra", namn: "Grå", lankade: gra }, { id: "c-bla", namn: "Blå", lankade: bla }],
      }] as SidOption[],
    };
  };
  const malB = new Map([[normKalla(kallUrl(SKU_B, 2)), kallUrl(SKU_B, 2)]]);
  const malA = new Map([[normKalla(kallUrl(SKU_A, 2)), kallUrl(SKU_A, 2)]]);

  it("vyn: färgens egna och de gemensamma i galleriets ordning, valets första bild först", () => {
    const s = sida(["A1", "A3", "KORT", "B1", "B2"], ["A1"], ["B1", "B2"]);
    expect(fargVy(s, "c-gra")).toEqual(["A1", "A3", "KORT"]);
    expect(fargVy(s, "c-bla")).toEqual(["B1", "KORT", "B2"]);
  });

  it("länkad och tvåa i vyn är har_som_tva; länkad längre bak har_annan_plats", () => {
    expect(st(bedomVal(sida(["A1", "B1", "B2", "KORT"], ["A1"], ["B1", "B2"]), "c-bla", KALLOR, malB))).toBe("har_som_tva");
    expect(st(bedomVal(sida(["A1", "KORT", "B1", "B2"], ["A1"], ["B1", "B2"]), "c-bla", KALLOR, malB))).toBe("har_annan_plats");
  });

  it("☠️ i galleriet men inte länkad till färgen är i_galleriet_olankad", () => {
    expect(bedomVal(sida(["A1", "A2", "B1"], ["A1"], ["B1"]), "c-gra", KALLOR, malA)).toEqual({ status: "i_galleriet_olankad", fil: "A2" });
  });

  it("färgens första bild är ar_huvudbild; ingen bild alls är saknas/okand; utan länk är hinder", () => {
    expect(st(bedomVal(sida(["A1", "B2"], ["A1"], ["B2"]), "c-bla", KALLOR, malB))).toBe("ar_huvudbild");
    expect(st(bedomVal(sida(["A1", "B1"], ["A1"], ["B1"]), "c-bla", KALLOR, malB))).toBe("saknas");
    expect(st(bedomVal(sida(["A1", "B1", "ny"], ["A1"], ["B1"]), "c-bla", KALLOR, malB))).toBe("okand");
    expect(bedomVal(sida(["A1", "B1"], ["A1"], []), "c-bla", KALLOR, malB)).toEqual({ hinder: "val_utan_bild" });
  });

  it("placeraIVal lägger filen före den bild vyn annars visat som två, och länkar den som valets andra", () => {
    const s = sida(["A1", "A3", "A8", "KORT", "B1"], ["A1"], ["B1"]);
    const ny: Bild = { id: "X", alt: "ny" };
    const r = placeraIVal({ bilder: s.bilder, optioner: s.optioner }, "c-bla", ny);
    if ("hinder" in r) throw new Error(r.hinder);
    expect(r.bilder.map((b) => b.id)).toEqual(["A1", "A3", "A8", "X", "KORT", "B1"]);
    expect(r.optioner[0].val.find((v) => v.id === "c-bla")!.lankade).toEqual(["B1", "X"]);
    expect(fargVy(r, "c-bla")).toEqual(["B1", "X", "KORT"]);
    // Den andra färgens vy är densamma som förut.
    expect(fargVy(r, "c-gra")).toEqual(fargVy(s, "c-gra"));
  });
});

// ── rapporten ───────────────────────────────────────────────────────────────

describe("rapportera", () => {
  it("räknar status och hinder per sida och per färg, och listar bara nycklar", async () => {
    const w = varld(
      [
        v3(1, ["A1", "A2", "A3"]), // har_som_tva
        v3(2, ["A1", "A3", "A2"]), // har_annan_plats
        v3(3, ["A2", "A1"]), // ar_huvudbild
        v3(4, ["A1", "A3"]), // saknas
        v3(5, ["A1", "ospårad"]), // okand
        v3(6, ["x"]), // ingen_mappning
        v3(7, ["x"]), // inte_aosom
        v3(8, ["x"]), // saknas_i_feeden
        v3(9, ["x"]), // feed_utan_bild_2
        v3(10, ["A1", "A2"], undefined, { visible: false }), // utkast: räknas inte
        // Sammanslagen: Grå har A2 olänkad, Blå har B2 länkad men bakom kortet.
        v3(11, ["A1", "A2", "KORT", "B1", "B2"], { gra: ["A1"], bla: ["B1", "B2"] }),
      ],
      [
        enkel(id(1), SKU_A), enkel(id(2), SKU_A), enkel(id(3), SKU_A), enkel(id(4), SKU_A), enkel(id(5), SKU_A),
        { supplierProductId: "ae:123", supplier: "aliexpress", wixProductId: id(7), variants: [] } as ProductMappingRecord,
        enkel(id(8), "999-FINNSINTE"), enkel(id(9), SKU_C), enkel(id(10), SKU_A), flera(id(11)),
      ],
    );
    w.v.sidstorlek = 6;
    const r = await rapportera(w.deps);

    expect(r.granskade).toBe(10);
    expect(r.rader).toBe(11);
    expect(r.sidor).toBe(2);
    expect(r.raknare).toMatchObject({
      har_som_tva: 1, har_annan_plats: 2, ar_huvudbild: 1, i_galleriet_olankad: 1, saknas: 1, okand: 1,
      ingen_mappning: 1, inte_aosom: 1, saknas_i_feeden: 1, feed_utan_bild_2: 1,
    });
    expect(r.ids).toEqual({
      har_annan_plats: [id(2), `${id(11)}:c-bla`],
      ar_huvudbild: [id(3)],
      i_galleriet_olankad: [`${id(11)}:c-gra`],
      saknas: [id(4)],
      okand: [id(5)],
    });
    expect(r.nasta).toBeNull();

    // ☠️ Filtret bara på första sidan; sida två bär markören och fälten.
    expect(w.sokningar[0]).toMatchObject({ fields: ["MEDIA_ITEMS_INFO"], search: { filter: { visible: true } } });
    expect((w.sokningar[1].search as Obj).filter).toBeUndefined();
    expect(w.sokningar[1]).toMatchObject({ fields: ["MEDIA_ITEMS_INFO"], search: { cursorPaging: { cursor: "m6" } } });
  });

  it("frågar Wix om källor i klump, högst 50 åt gången, och inte om det mappningen vet", async () => {
    const galleri = (n: number) => Array.from({ length: 8 }, (_, i) => `u${n}-${i}`);
    const produkter = Array.from({ length: 10 }, (_, n) => v3(n + 1, galleri(n + 1)));
    const kand = enkel(id(1), SKU_A, {
      aosomBildFiler: galleri(1).map((g, i) => ({ fileId: g, kalla: kallUrl(SKU_A, i + 1) })),
    });
    const w = varld(produkter, [kand, ...Array.from({ length: 9 }, (_, n) => enkel(id(n + 2), SKU_A))], new Map());
    const r = await rapportera(w.deps);
    expect(r.raknare.har_som_tva).toBe(1);
    expect(r.raknare.okand).toBe(9);
    const fragade = w.kallAnrop.flat();
    expect(fragade.some((x) => x.startsWith("u1-"))).toBe(false);
    expect(fragade).toHaveLength(72);
    expect(w.kallAnrop.every((a) => a.length <= KALLOR_PER_ANROP)).toBe(true);
  });

  it("stannar på tidsbudgeten FÖRE en sida, och nästa körning börjar på markören", async () => {
    const w = varld([v3(1, ["A1", "A2"]), v3(2, ["A1"])], [enkel(id(1), SKU_A), enkel(id(2), SKU_A)]);
    w.v.sidstorlek = 1;
    let t = 0;
    w.deps.nu = () => (t += 250_000);
    const r = await rapportera(w.deps, { tidsbudgetMs: 200_000 });
    expect([r.sidor, r.nasta, r.stoppadAv]).toEqual([1, "m1", "tidsbudget"]);

    w.deps.nu = () => 0;
    const r2 = await rapportera(w.deps, { efter: "m1" });
    expect((w.sokningar[w.sokningar.length - 1].search as Obj).filter).toBeUndefined();
    expect([r2.ids.saknas, r2.nasta]).toEqual([[id(2)], null]);
  });

  it("☠️ ett svar utan produktlista kastar, det ser inte ut som en tom katalog", async () => {
    const w = varld([], []);
    w.deps.wix = async () => ({ pagingMetadata: {} });
    await expect(rapportera(w.deps)).rejects.toThrow(/utan produktlista/);
  });

  it("☠️ ett get-files-fel når inte svaret med sin adress", async () => {
    const w = varld([v3(1, ["okänd"])], [enkel(id(1), SKU_A)]);
    w.deps.hamtaKallor = async () => { throw new Error(`Wix get-files: ${kallUrl(SKU_A, 2)}`); };
    const e = await rapportera(w.deps).catch((x: Error) => x);
    for (const h of HEMLIGT) expect(String(e)).not.toContain(h);
  });

  it("☠️ svaret bär aldrig artikelnummer, feedens adresser eller produktsidan", async () => {
    const w = varld(
      [v3(1, ["A1", "A2"]), v3(2, ["A1", "A3", "A2"]), v3(3, ["A1"]), v3(4, ["ospårad"]), v3(5, ["x"]), v3(6, ["x"]),
        v3(7, ["A1", "A2", "B1"], { gra: ["A1"], bla: ["B1"] })],
      [1, 2, 3, 4].map((n) => enkel(id(n), SKU_A)).concat([enkel(id(5), SKU_C), enkel(id(6), "999-FINNSINTE"), flera(id(7))]),
    );
    const json = JSON.stringify(await rapportera(w.deps));
    for (const h of [...HEMLIGT, "http"]) expect(json).not.toContain(h);
  });
});

// ── nycklar, par och sha ────────────────────────────────────────────────────

describe("tolkaPar och tolkaNycklar", () => {
  it("läser de fyra formerna och normerar fil-id", () => {
    const hex = "ab".repeat(16);
    const t = tolkaPar([`${id(2)}:${hex}`, `${id(1).toUpperCase()}:c-bla:${fil(7)}`, `${id(3)}:flytta`, `${id(1)}:c-gra:FLYTTA`]);
    if ("fel" in t) throw new Error(t.fel);
    expect(t.atgarder).toEqual([
      { id: id(1), val: "c-bla", typ: "infoga", fileId: fil(7) },
      { id: id(1), val: "c-gra", typ: "flytta" },
      { id: id(2), typ: "infoga", fileId: `b379ce_${hex}~mv2.jpg` },
      { id: id(3), typ: "flytta" },
    ]);
  });

  it("vägrar listan när något inte börjar med ett wix-id, utan att upprepa värdet", () => {
    expect(tolkaPar([`${id(1)}:${fil(1)}`, `${SKU_A}:${fil(2)}`])).toEqual({
      fel: "1 par är inte wix-id:fil-id, wix-id:val-id:fil-id eller …:flytta",
    });
    expect(tolkaPar([`${id(1)}:${fil(1)}`, `${id(1)}:flytta`])).toHaveProperty("fel");
    expect(tolkaPar(Array.from({ length: 26 }, (_, n) => `${id(n)}:flytta`))).toHaveProperty("fel");
    expect(tolkaNycklar([id(1), `${id(2)}:c-bla`])).toEqual({ mal: [{ id: id(1) }, { id: id(2), val: "c-bla" }] });
    expect(JSON.stringify(tolkaNycklar([SKU_A]))).not.toContain(SKU_A);
  });

  it("ett ogiltigt fil-id blir ett hinder på sin åtgärd", async () => {
    const t = tolkaPar([`${id(1)}:${SKU_A}`]);
    if ("fel" in t) throw new Error(t.fel);
    const w = varld([v3(1, ["A1", "A3"])], [enkel(id(1), SKU_A)]);
    const [plan] = await planera(t.atgarder, w.deps);
    expect(plan.atgarder[0].hinder).toBe("ogiltigt_fil_id");
  });

  it("☠️ sha:n binder både paren och sidornas läge", async () => {
    const a: Atgard[] = [{ id: id(1), typ: "infoga", fileId: fil(50) }];
    const w = varld([v3(1, ["A1", "A3"])], [enkel(id(1), SKU_A)]);
    const s1 = planSha(a, await planera(a, w.deps));
    expect(planSha(a, await planera(a, w.deps))).toBe(s1);
    const b: Atgard[] = [{ id: id(1), typ: "infoga", fileId: fil(51) }];
    expect(planSha(b, await planera(b, w.deps))).not.toBe(s1);
    (w.p.get(id(1))!.media as Obj).itemsInfo = { items: [{ id: "A1", altText: "a" }, { id: "A8", altText: "b" }] };
    expect(planSha(a, await planera(a, w.deps))).not.toBe(s1);
  });
});

// ── planen ──────────────────────────────────────────────────────────────────

describe("planeraSida — enkel sida", () => {
  const malA: Mal = { typ: "galleri", mal: new Map([[normKalla(kallUrl(SKU_A, 2)), kallUrl(SKU_A, 2)]]) };
  const sida = (galleri: string[], over: Partial<{ synlig: boolean }> = {}) => ({
    id: id(1), namn: "Soffa", synlig: over.synlig ?? true, bilder: galleri.map((g) => ({ id: g, alt: `alt ${g}` })), optioner: [],
  });
  const k = new Map([...KALLOR, [fil(50), kallUrl(SKU_A, 2)], [fil(51), kallUrl(SKU_A, 5)]]);

  it("infoga lägger filen på plats 1 och behåller varje bild vid sitt id i samma ordning", () => {
    const p = planeraSida(sida(["A1", "A3", "A8"]), id(1), [{ id: id(1), typ: "infoga", fileId: fil(50) }], malA, k);
    expect(p.galleriEfter.map((b) => b.id)).toEqual(["A1", fil(50), "A3", "A8"]);
    expect(p.galleriEfter[1].alt).toBe("Soffa i en miljöbild");
    expect(p.atgarder[0]).toMatchObject({ kalla: "matchar", sparaKalla: kallUrl(SKU_A, 2) });
  });

  it("flytta sätter miljöbilden på plats 1, resten i samma inbördes ordning, och antalet står still", () => {
    const p = planeraSida(sida(["A1", "A3", "A8", "A2", "A9"]), id(1), [{ id: id(1), typ: "flytta" }], malA, k);
    expect(p.galleriEfter.map((b) => b.id)).toEqual(["A1", "A2", "A3", "A8", "A9"]);
    expect(p.galleriEfter[1].alt).toBe("alt A2");
  });

  it("hindren", () => {
    const h = (galleri: string[], a: Atgard, over = {}) =>
      planeraSida(sida(galleri, over), id(1), [a], malA, k).atgarder[0].hinder;
    const inf = (f: string): Atgard => ({ id: id(1), typ: "infoga", fileId: f });
    const fly: Atgard = { id: id(1), typ: "flytta" };
    expect(h(["A2", "A1"], fly)).toBe("ar_huvudbild");
    expect(h(["A1", "A2"], fly)).toBe("redan_tva");
    expect(h(["A1", "A3"], fly)).toBe("saknas_pa_sidan");
    expect(h(["A1", fil(50)], inf(fil(50)))).toBe("finns_redan");
    expect(h(Array.from({ length: MAX_BILDER }, (_, i) => `u${i}`), inf(fil(50)))).toBe("fullt");
    expect(h([], inf(fil(50)))).toBe("tomt_galleri");
    expect(h(["A1"], inf(fil(51)))).toBe("annan_kalla");
    expect(h(["A1"], { id: id(1), val: "c-x", typ: "flytta" })).toBe("inte_sammanslagen");
    expect(planeraSida(sida(["A1"], { synlig: false }), id(1), [inf(fil(50))], malA, k).hinder).toBe("inte_publicerad");
    expect(planeraSida(null, id(1), [inf(fil(50))], malA, k).hinder).toBe("saknas_i_wix");
  });
});

// ── plan och skriv ──────────────────────────────────────────────────────────

const par = (xs: string[]) => {
  const t = tolkaPar(xs);
  if ("fel" in t) throw new Error(t.fel);
  return t.atgarder;
};

describe("planeraOchSkriv", () => {
  const k = new Map([...KALLOR, [fil(50), kallUrl(SKU_A, 2)], [fil(52), kallUrl(SKU_B, 2)], [fil(53), kallUrl(SKU_A, 2)]]);

  it("plan skriver ingenting", async () => {
    const w = varld([v3(1, ["A1", "A3"])], [enkel(id(1), SKU_A)], k);
    const s = await planeraOchSkriv(par([`${id(1)}:${fil(50)}`]), { skriv: false }, w.deps);
    expect(w.patchar).toHaveLength(0);
    expect(s.produkter).toEqual([{
      id: id(1), andrar: true, bilderFore: 2, bilderEfter: 3, lankarAndras: 0,
      atgarder: [{ typ: "infoga", kalla: "matchar" }],
    }]);
    expect(s.sha).toMatch(/^[0-9a-f]{64}$/);
  });

  it("☠️ skriv med en annan sha skriver ingenting", async () => {
    const w = varld([v3(1, ["A1", "A3"])], [enkel(id(1), SKU_A)], k);
    const s = await planeraOchSkriv(par([`${id(1)}:${fil(50)}`]), { skriv: true, bekrafta: "0".repeat(64) }, w.deps);
    expect(s.stoppadAv).toBe("sha");
    expect(w.patchar).toHaveLength(0);
  });

  it("enkel sida: bara media, vid id, läst tillbaka trots gammal läsning, och kopplingen sparad", async () => {
    const m = enkel(id(1), SKU_A, { aosomBildFiler: [{ fileId: "A1", kalla: kallUrl(SKU_A, 1) }] });
    const w = varld([v3(1, ["A1", "A3", "A8"])], [m], k);
    const a = par([`${id(1)}:${fil(50)}`]);
    const { sha } = await planeraOchSkriv(a, { skriv: false }, w.deps);
    w.v.gamlaLasningar = 2;
    const s = await planeraOchSkriv(a, { skriv: true, bekrafta: sha }, w.deps);

    expect([s.stoppadAv, s.skrivna]).toEqual(["klart", 1]);
    expect(w.patchar).toHaveLength(1);
    const pt = w.patchar[0];
    expect(pt.paths).toEqual(["media"]);
    expect(Object.keys(pt.product).sort()).toEqual(["media", "revision"]);
    // ☠️ Aldrig en adress: Wix hade importerat om bilden till en ny fil.
    expect(JSON.stringify(pt)).not.toMatch(/url|wixstatic|http/i);
    expect(galleriAv(w.p.get(id(1))!)).toEqual(["A1", fil(50), "A3", "A8"]);
    expect(s.utfall[0].steg).toContain("galleriet omläst 2 gånger");
    expect(w.sparade[0].aosomBildFiler).toEqual([
      { fileId: "A1", kalla: kallUrl(SKU_A, 1) },
      { fileId: fil(50), kalla: kallUrl(SKU_A, 2) },
    ]);
  });

  it("enkel sida: flytt utan uppladdning, och antalet står still", async () => {
    const w = varld([v3(1, ["A1", "A3", "A2", "A8"])], [enkel(id(1), SKU_A)], k);
    const a = par([`${id(1)}:flytta`]);
    const { sha } = await planeraOchSkriv(a, { skriv: false }, w.deps);
    const s = await planeraOchSkriv(a, { skriv: true, bekrafta: sha }, w.deps);
    expect(s.skrivna).toBe(1);
    expect(galleriAv(w.p.get(id(1))!)).toEqual(["A1", "A2", "A3", "A8"]);
    expect(w.sparade).toHaveLength(0);
  });

  it("sammanslagen sida: galleriet ensamt, sedan länkarna med options + variantsInfo ordagrant och visible", async () => {
    const produkt = v3(1, ["A1", "A2", "A3", "KORT", "B1"], { gra: ["A1"], bla: ["B1"] });
    const w = varld([produkt], [flera(id(1))], k);
    // Grå: A2 ligger olänkad → flytta länkar den. Blå: ny kandidat.
    const a = par([`${id(1)}:c-gra:flytta`, `${id(1)}:c-bla:${fil(52)}`]);
    const { sha, produkter } = await planeraOchSkriv(a, { skriv: false }, w.deps);
    expect(produkter[0].lankarAndras).toBe(2);
    w.v.lank404 = 1;
    const s = await planeraOchSkriv(a, { skriv: true, bekrafta: sha }, w.deps);

    expect([s.stoppadAv, s.skrivna]).toEqual(["klart", 1]);
    expect(w.patchar.map((x) => x.paths.join())).toEqual(["media", "options,variantsInfo,visible", "options,variantsInfo,visible"]);
    const lank = w.patchar[2].product;
    expect(lank.visible).toBe(true);
    expect(lank.variantsInfo).toEqual(produkt.variantsInfo);
    const efter = w.p.get(id(1))!;
    expect(galleriAv(efter)).toEqual(["A1", "A2", "A3", fil(52), "KORT", "B1"]);
    expect(lankade(efter, "c-gra")).toEqual(["A1", "A2"]);
    expect(lankade(efter, "c-bla")).toEqual(["B1", fil(52)]);
    expect(s.utfall[0].steg.some((x) => /länkar: 2 val \(2 försök\)/.test(x))).toBe(true);
    // Kopplingen sparas för den infogade filen, mot Blås artikel.
    expect(w.sparade[0].aosomBildFiler).toEqual([{ fileId: fil(52), kalla: kallUrl(SKU_B, 2) }]);
  });

  it("sammanslagen sida: hindren per färg", async () => {
    const w = varld([v3(1, ["A1", "A2", "B1"], { gra: ["A1"], bla: ["B1", "A2"] })], [flera(id(1))], k);
    const s = await planeraOchSkriv(
      par([`${id(1)}:c-gra:flytta`, `${id(1)}:c-x:flytta`, `${id(1)}:c-bla:${fil(50)}`]),
      { skriv: false },
      w.deps,
    );
    expect(s.produkter[0].atgarder.map((x) => [x.val, x.hinder])).toEqual([
      ["c-bla", "annan_kalla"],
      ["c-gra", "lankad_till_annat_val"],
      ["c-x", "val_finns_inte"],
    ]);
    const s2 = await planeraOchSkriv(par([`${id(1)}:flytta`]), { skriv: false }, w.deps);
    expect(s2.produkter[0].atgarder[0].hinder).toBe("val_kravs");
  });

  it("☠️ stannar vid första sida som inte läser tillbaka, och rör inte nästa", async () => {
    const w = varld([v3(1, ["A1", "A3"]), v3(2, ["A1", "A3"])], [enkel(id(1), SKU_A), enkel(id(2), SKU_A)], k);
    w.v.tarInte.add(id(1));
    const a = par([`${id(1)}:${fil(50)}`, `${id(2)}:${fil(53)}`]);
    const { sha } = await planeraOchSkriv(a, { skriv: false }, w.deps);
    const s = await planeraOchSkriv(a, { skriv: true, bekrafta: sha }, w.deps);
    expect(s.stoppadAv).toBe("avvikelse");
    expect(s.utfall).toHaveLength(1);
    expect(w.patchar).toHaveLength(1);
    expect(w.sparade).toHaveLength(0);
  });

  it("☠️ ett get-files-fel stoppar planen i stället för att släppa igenom källkollen", async () => {
    const w = varld([v3(1, ["A1"])], [enkel(id(1), SKU_A)], k);
    w.deps.hamtaKallor = async () => { throw new Error(kallUrl(SKU_A, 2)); };
    const e = await planeraOchSkriv(par([`${id(1)}:${fil(50)}`]), { skriv: false }, w.deps).catch((x: Error) => x);
    expect(String(e)).toMatch(/get-files/);
    expect(String(e)).not.toContain(CDN);
  });

  it("stannar på tidsbudgeten mellan sidor och säger vilka som är kvar", async () => {
    const w = varld([v3(1, ["A1", "A3"]), v3(2, ["A1", "A3"])], [enkel(id(1), SKU_A), enkel(id(2), SKU_A)], k);
    const a = par([`${id(1)}:${fil(50)}`, `${id(2)}:${fil(53)}`]);
    const { sha } = await planeraOchSkriv(a, { skriv: false }, w.deps);
    let t = 0;
    w.deps.nu = () => (t += 300_000);
    const s = await planeraOchSkriv(a, { skriv: true, bekrafta: sha }, w.deps);
    expect([s.stoppadAv, s.skrivna, s.kvar]).toEqual(["tidsbudget", 1, [id(2)]]);
  });

  it("☠️ svaret bär aldrig artikelnummer eller adresser, inte heller vid fel", async () => {
    const w = varld(
      [v3(1, ["A1", "A3"]), v3(2, ["A1", "A2", "B1"], { gra: ["A1"], bla: ["B1"] }), v3(3, ["A1", "A3"])],
      [enkel(id(1), SKU_A), flera(id(2)), enkel(id(3), SKU_A)],
      k,
    );
    w.v.tarInte.add(id(3));
    const a = par([`${id(1)}:${fil(50)}`, `${id(2)}:c-gra:flytta`, `${id(2)}:c-bla:${fil(52)}`, `${id(3)}:${fil(53)}`]);
    const { sha } = await planeraOchSkriv(a, { skriv: false }, w.deps);
    const s = await planeraOchSkriv(a, { skriv: true, bekrafta: sha }, w.deps);
    expect(s.stoppadAv).toBe("avvikelse");
    const json = JSON.stringify(s);
    for (const h of [...HEMLIGT, "http"]) expect(json).not.toContain(h);
  });
});

// ── kandidater ─────────────────────────────────────────────────────────────

describe("hamtaKandidater", () => {
  it("torrkörning laddar inte upp; skarpt får rätt artikels position 2 och ett namn utan källa", async () => {
    const w = varld(
      [v3(1, ["A1", "A3"]), v3(2, ["A1", "B1"], { gra: ["A1"], bla: ["B1"] })],
      [enkel(id(1), SKU_A), flera(id(2))],
    );
    const mal = [{ id: id(1) }, { id: id(2), val: "c-bla" }];
    const torr = await hamtaKandidater(mal, {}, w.deps);
    expect(torr.dryRun).toBe(true);
    expect(w.uppladdade).toHaveLength(0);
    expect(torr.rader).toEqual([{ id: id(1) }, { id: id(2), val: "c-bla", valNr: 2 }]);

    const skarp = await hamtaKandidater(mal, { dryRun: false }, w.deps);
    expect(w.uppladdade).toEqual([
      { url: kallUrl(SKU_A, 2), namn: `kandidat-${id(1).slice(0, 8)}-2.jpg` },
      { url: kallUrl(SKU_B, 2), namn: `kandidat-${id(2).slice(0, 8)}-v2-2.jpg` },
    ]);
    expect(skarp.uppladdade).toBe(2);
    expect(skarp.rader[1].kandidat).toEqual({ fileId: fil(1002), url: `https://static.wixstatic.com/media/${fil(1002)}` });
  });

  it("en sammanslagen sida utan val tar bara färgerna som saknar bilden eller är okända", async () => {
    // Grå har A2 olänkad (inte en kandidat), Blå saknar B2.
    const w = varld([v3(1, ["A1", "A2", "B1"], { gra: ["A1"], bla: ["B1"] })], [flera(id(1))]);
    const s = await hamtaKandidater([{ id: id(1) }], { dryRun: false }, w.deps);
    expect(s.rader.map((r) => r.val)).toEqual(["c-bla"]);
    expect(w.uppladdade.map((u) => u.url)).toEqual([kallUrl(SKU_B, 2)]);
  });

  it("☠️ ett uppladdningsfel räknas utan sitt meddelande, och bara Wix egen adress står i svaret", async () => {
    const w = varld([v3(1, ["A1"]), v3(2, ["A1"]), v3(3, ["x"])], [enkel(id(1), SKU_A), enkel(id(2), SKU_A), enkel(id(3), SKU_C)]);
    let n = 0;
    w.deps.laddaUpp = async (url) => {
      n++;
      if (n === 1) throw new Error(`Wix media-import misslyckades för ${url}`);
      return { id: `dry-x`, url }; // som importMediaByUrl under DRY_RUN
    };
    const s = await hamtaKandidater([{ id: id(1) }, { id: id(2) }, { id: id(3) }], { dryRun: false }, w.deps);
    expect([s.uppladdade, s.missar]).toEqual([0, 2]);
    expect(s.rader[2].hinder).toBe("feed_utan_bild_2");
    const json = JSON.stringify(s);
    for (const h of [...HEMLIGT, "http"]) expect(json).not.toContain(h);
  });
});
