// Färgtillägget: kandidater per färg (rätt artikel, rätt position, redan synliga hoppas över),
// åtgärderna, placeringen efter färgens sista bild, hindren, sha-bindningen, den stegvisa
// skrivningen — och att det publika svaret aldrig bär ett artikelnummer eller en adress ur feeden.

import { describe, it, expect } from "vitest";
import {
  fargArtiklar,
  hamtaTillaggskandidater,
  laggTillIVal,
  planShaTillagg,
  planeraOchSkrivTillagg,
  planeraTillagg,
  tillaggFilnamn,
  tolkaMal,
  tolkaPositioner,
  tolkaTillagg,
  MAX_FILER_PER_FARG,
  type TillaggAtgard,
} from "./fargtillagg";
import { fargVy, normKalla, MAX_BILDER, type LivsbildDeps } from "./livsbild";
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


// ── fixturen för färgtillägget ──────────────────────────────────────────────

/** Nya filer: Grås artikel (A) position 3, 8 och 9, Blås (B) position 3 och 8. */
const NYA = new Map([
  ...KALLOR,
  [fil(2001), kallUrl(SKU_A, 3)], [fil(2002), kallUrl(SKU_A, 8)], [fil(2003), kallUrl(SKU_A, 9)],
  [fil(3001), kallUrl(SKU_B, 3)], [fil(3002), kallUrl(SKU_B, 8)],
]);

/** Grå äger A1 och A2, Blå B1 och B2. */
const sida = (n = 1, over: Obj = {}) => v3(n, ["A1", "A2", "B1", "B2"], { gra: ["A1", "A2"], bla: ["B1", "B2"] }, over);

const atg = (wix: string, val: string, ...bilder: (string | { fil: string; alt?: string })[]): TillaggAtgard => ({
  id: wix,
  val,
  bilder: bilder.map((b) => (typeof b === "string" ? { fil: b } : b)),
});

const optioner = (galleriLankat: Record<string, string[]>): SidOption[] => [{
  namn: "Färg",
  val: Object.entries(galleriLankat).map(([id, lankade]) => ({ id, namn: id === "c-gra" ? "Grå" : "Blå", lankade })),
}];
const bilder = (...ids: string[]): Bild[] => ids.map((i) => ({ id: i, alt: `alt ${i}` }));

// ── små rena hjälpare ───────────────────────────────────────────────────────

describe("positioner och filnamn", () => {
  it("standard är 3, 8, 9 och 10; ogiltigt ignoreras och dubbletter slås ihop", () => {
    expect(tolkaPositioner(undefined)).toEqual([3, 8, 9, 10]);
    expect(tolkaPositioner([])).toEqual([3, 8, 9, 10]);
    expect(tolkaPositioner(["x", 0, 16])).toEqual([3, 8, 9, 10]);
    expect(tolkaPositioner([10, "3", 3, 0, 16, "x", 8.5])).toEqual([3, 10]);
    expect(tolkaPositioner([15, 1])).toEqual([1, 15]);
  });

  it("☠️ filnamnet byggs av wix-id, färgens plats och position, aldrig av källan", () => {
    expect(tillaggFilnamn(id(7), 2, 8)).toBe("kandidat-00000007-v2-8.jpg");
    for (const h of HEMLIGT) expect(tillaggFilnamn(id(7), 2, 8)).not.toContain(h);
  });
});

describe("tolkaMal", () => {
  it("läser wix-id och wix-id:val-id, normerar gemener och sorterar", () => {
    const r = tolkaMal([id(2).toUpperCase(), `${id(1)}:c-gra`, ` ${id(1)}:c-gra `]);
    expect(r).toEqual({ mal: [{ id: id(1), val: "c-gra" }, { id: id(2) }] });
  });

  it("☠️ vägrar listan utan att upprepa värdet (det kan vara ett artikelnummer)", () => {
    const r = tolkaMal([id(1), "835-HEMLIGA"]);
    expect("fel" in r && r.fel).toMatch(/1 värden/);
    expect(JSON.stringify(r)).not.toContain("HEMLIG");
    expect(tolkaMal([`${id(1)}:a:b`])).toHaveProperty("fel");
    expect(tolkaMal([])).toEqual({ fel: "inga mål" });
    const manga = Array.from({ length: 51 }, (_, i) => id(i + 1));
    expect(tolkaMal(manga)).toHaveProperty("fel");
  });
});

describe("tolkaTillagg", () => {
  it("läser objekt- och strängformen, normerar fil-id och sorterar på sida och färg", () => {
    const r = tolkaTillagg([
      { id: id(2), val: "c-bla", bilder: [fil(3001)] },
      { id: id(1), val: "c-gra", bilder: [fil(2001), { fil: fil(2002), alt: " Närbild på gråa soffan " }] },
    ]);
    expect(r).toEqual({
      atgarder: [
        { id: id(1), val: "c-gra", bilder: [{ fil: fil(2001) }, { fil: fil(2002), alt: "Närbild på gråa soffan" }] },
        { id: id(2), val: "c-bla", bilder: [{ fil: fil(3001) }] },
      ],
    });
  });

  it("☠️ vägrar utan att upprepa värdet: fel id, fel fil-id, tom lista, dubbletter, för många", () => {
    const fel = (x: unknown) => {
      const r = tolkaTillagg(x);
      expect(r).toHaveProperty("fel");
      expect(JSON.stringify(r)).not.toContain("HEMLIG");
      return r;
    };
    fel("inte en lista");
    fel([{ id: "835-HEMLIGA", val: "c-gra", bilder: [fil(1)] }]);
    fel([{ id: id(1), val: "c-gra", bilder: ["835-HEMLIGA"] }]);
    fel([{ id: id(1), val: "c-gra", bilder: [] }]);
    fel([{ id: id(1), val: "c-gra" }]);
    fel([{ id: id(1), val: "c gra", bilder: [fil(1)] }]);
    fel([{ id: id(1), val: "c-gra", bilder: [fil(1), fil(1)] }]);
    fel([{ id: id(1), val: "c-gra", bilder: Array.from({ length: MAX_FILER_PER_FARG + 1 }, (_, i) => fil(i + 1)) }]);
    expect(tolkaTillagg([{ id: id(1), val: "c-gra", bilder: [fil(1)] }, { id: id(1), val: "c-gra", bilder: [fil(2)] }]))
      .toEqual({ fel: "samma färg står två gånger" });
    expect(tolkaTillagg([])).toEqual({ fel: "inga åtgärder" });
  });
});

// ── färgens artiklar ────────────────────────────────────────────────────────

describe("fargArtiklar", () => {
  const feed = new Map(FEED.map((r) => [r.sku, r]));
  const opt = optioner({ "c-gra": ["A1"], "c-bla": ["B1"] });

  it("knyter varje färg till sin artikels feedrad via mappningens choices.Färg", () => {
    const r = fargArtiklar([flera(id(1))], opt, feed);
    expect("val" in r && r.val.map((v) => [v.valId, v.valIndex, v.rader.map((x) => x.sku), v.hinder])).toEqual([
      ["c-gra", 0, [SKU_A], undefined],
      ["c-bla", 1, [SKU_B], undefined],
    ]);
  });

  it("en enkel sida, en sida utan färgaxel och en utan Aosom-rad är hinder för hela sidan", () => {
    expect(fargArtiklar([enkel(id(1), SKU_A)], opt, feed)).toEqual({ hinder: "inte_sammanslagen" });
    expect(fargArtiklar([flera(id(1))], [], feed)).toEqual({ hinder: "saknar_fargaxel" });
    expect(fargArtiklar([], opt, feed)).toEqual({ hinder: "ingen_mappning" });
    expect(fargArtiklar([enkel(id(1), SKU_A, { supplier: "aliexpress", supplierProductId: "100500" })], opt, feed))
      .toEqual({ hinder: "inte_aosom" });
  });

  it("☠️ ett val utan artikel eller utan feedrad är ett hinder för det valet, inte en gissning", () => {
    const m = enkel(id(1), SKU_A, {
      variants: [
        { wixVariantId: "v1", supplierVariantId: SKU_A, sku: "FP-1", choices: { Färg: "Grå" } },
        { wixVariantId: "v2", supplierVariantId: SKU_B, sku: "FP-2", choices: { Färg: "Röd" } },
      ] as unknown as ProductMappingRecord["variants"],
    });
    const r = fargArtiklar([m], opt, feed);
    expect("val" in r && r.val.map((v) => v.hinder)).toEqual([undefined, "val_utan_artikel"]);
    const utanB = new Map([[SKU_A, feed.get(SKU_A)!]]);
    const r2 = fargArtiklar([flera(id(1))], opt, utanB);
    expect("val" in r2 && r2.val.map((v) => v.hinder)).toEqual([undefined, "saknas_i_feeden"]);
  });
});

// ── kandidater ──────────────────────────────────────────────────────────────

describe("hamtaTillaggskandidater", () => {
  it("torrkörning laddar inte upp och säger vilka positioner som skulle hämtas", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    const s = await hamtaTillaggskandidater([{ id: id(1) }], {}, w.deps);
    expect(s.dryRun).toBe(true);
    expect(w.uppladdade).toHaveLength(0);
    expect(s.rader.map((r) => [r.val, r.namn, r.nuvarande, r.finns, r.attHamta, r.kandidater])).toEqual([
      ["c-gra", "Grå", 2, [], [3, 8, 9, 10], []],
      ["c-bla", "Blå", 2, [], [3, 8, 9, 10], []],
    ]);
  });

  it("skarpt: rätt artikels positioner, i ordning, med ett namn utan källa, och bara Wix egen adress i svaret", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    const s = await hamtaTillaggskandidater([{ id: id(1) }], { dryRun: false, positioner: [3, 8] }, w.deps);
    expect(w.uppladdade.map((u) => [u.url, u.namn])).toEqual([
      [kallUrl(SKU_A, 3), "kandidat-00000001-v1-3.jpg"],
      [kallUrl(SKU_A, 8), "kandidat-00000001-v1-8.jpg"],
      [kallUrl(SKU_B, 3), "kandidat-00000001-v2-3.jpg"],
      [kallUrl(SKU_B, 8), "kandidat-00000001-v2-8.jpg"],
    ]);
    expect(s.uppladdade).toBe(4);
    expect(s.rader[0].kandidater.map((k) => [k.pos, k.fileId])).toEqual([[3, fil(1001)], [8, fil(1002)]]);
    expect(s.rader[0].kandidater.every((k) => k.url.startsWith("https://static.wixstatic.com/"))).toBe(true);
    const json = JSON.stringify(s);
    for (const h of [...HEMLIGT, "aosom"]) expect(json).not.toContain(h);
  });

  it("positioner som redan syns i färgens vy hoppas över (spårade till källan)", async () => {
    const p = v3(1, ["A1", "A2", "A3", "B1", "B2"], { gra: ["A1", "A2", "A3"], bla: ["B1", "B2"] });
    const w = varld([p], [flera(id(1))], NYA);
    const s = await hamtaTillaggskandidater([{ id: id(1), val: "c-gra" }], { dryRun: false }, w.deps);
    expect(s.rader[0].finns).toEqual([3]);
    expect(s.rader[0].attHamta).toEqual([8, 9, 10]);
    expect(w.uppladdade.map((u) => u.namn)).toEqual([
      "kandidat-00000001-v1-8.jpg", "kandidat-00000001-v1-9.jpg", "kandidat-00000001-v1-10.jpg",
    ]);
  });

  it("☠️ en bild i vyn utan känd källa räknas, så att en kandidat som kan vara en dubblett syns", async () => {
    const p = v3(1, ["A1", "X1", "B1"], { gra: ["A1", "X1"], bla: ["B1"] });
    const w = varld([p], [flera(id(1))], NYA);
    const s = await hamtaTillaggskandidater([{ id: id(1), val: "c-gra" }], {}, w.deps);
    expect(s.rader[0].okandaKallor).toBe(1);
    expect(s.rader[1]).toBeUndefined();
  });

  it("ett mål utan val tar bara färger som visar högst hogstBilder; ett mål med val tar färgen ändå", async () => {
    const p = v3(1, ["A1", "A2", "A4", "A5", "A6", "B1", "B2"], { gra: ["A1", "A2", "A4", "A5", "A6"], bla: ["B1", "B2"] });
    const w = varld([p], [flera(id(1))], NYA);
    const hel = await hamtaTillaggskandidater([{ id: id(1) }], {}, w.deps);
    expect(hel.rader.map((r) => r.val)).toEqual(["c-bla"]);
    const med = await hamtaTillaggskandidater([{ id: id(1), val: "c-gra" }], {}, w.deps);
    expect(med.rader.map((r) => [r.val, r.nuvarande])).toEqual([["c-gra", 5]]);
    const hog = await hamtaTillaggskandidater([{ id: id(1) }], { hogstBilder: 5 }, w.deps);
    expect(hog.rader.map((r) => r.val)).toEqual(["c-gra", "c-bla"]);
  });

  it("hindren: okänd sida, dold sida, ingen mappning, enkel sida, okänt val", async () => {
    const w = varld(
      [sida(1), sida(2, { visible: false }), v3(3, ["A1"]), sida(4), sida(5)],
      [flera(id(1)), flera(id(2)), enkel(id(4), SKU_A)],
      NYA,
    );
    const s = await hamtaTillaggskandidater(
      [{ id: id(1), val: "c-x" }, { id: id(2) }, { id: id(3) }, { id: id(4) }, { id: id(5) }, { id: id(9) }],
      {},
      w.deps,
    );
    expect(s.rader.map((r) => [r.id, r.hinder])).toEqual([
      [id(1), "val_finns_inte"],
      [id(2), "inte_publicerad"],
      [id(3), "ingen_mappning"],
      [id(4), "inte_sammanslagen"],
      [id(5), "ingen_mappning"],
      [id(9), "saknas_i_wix"],
    ]);
  });

  it("stannar på tidsbudgeten FÖRE ett mål och säger vilka som är kvar", async () => {
    const w = varld([sida(1), sida(2)], [flera(id(1)), flera(id(2))], NYA);
    let t = 0;
    w.deps.nu = () => (t += 200_000);
    const s = await hamtaTillaggskandidater([{ id: id(1) }, { id: id(2) }], {}, w.deps);
    expect(s.rader.every((r) => r.id === id(1))).toBe(true);
    expect(s.kvar).toEqual([id(2)]);
  });

  it("☠️ ett uppladdningsfel räknas utan sitt meddelande, och bara Wix egen adress godtas", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    let n = 0;
    w.deps.laddaUpp = async (url) => {
      n++;
      if (n === 1) throw new Error(`HTTP 500 ${url}`);
      if (n === 2) return { id: fil(9), url };
      return { id: fil(100 + n), url: `https://static.wixstatic.com/media/${fil(100 + n)}` };
    };
    const s = await hamtaTillaggskandidater([{ id: id(1), val: "c-gra" }], { dryRun: false, positioner: [3, 8, 9] }, w.deps);
    expect(s.rader[0].missar).toEqual([3, 8]);
    expect(s.rader[0].kandidater.map((k) => k.pos)).toEqual([9]);
    expect([s.uppladdade, s.missar]).toEqual([1, 2]);
    const json = JSON.stringify(s);
    for (const h of [...HEMLIGT, "500"]) expect(json).not.toContain(h);
  });
});

// ── placeringen ─────────────────────────────────────────────────────────────

describe("laggTillIVal", () => {
  const lage = () => ({
    bilder: bilder("A1", "A2", "B1", "B2"),
    optioner: optioner({ "c-gra": ["A1", "A2"], "c-bla": ["B1", "B2"] }),
  });

  it("lägger filerna efter färgens sista bild och sist i valets länkar; första bilden rörs inte", () => {
    const r = laggTillIVal(lage(), "c-gra", bilder("N1", "N2"));
    if ("hinder" in r) throw new Error(r.hinder);
    expect(r.bilder.map((b) => b.id)).toEqual(["A1", "A2", "N1", "N2", "B1", "B2"]);
    expect(r.optioner[0].val.find((v) => v.id === "c-gra")!.lankade).toEqual(["A1", "A2", "N1", "N2"]);
    expect(r.optioner[0].val.find((v) => v.id === "c-bla")!.lankade).toEqual(["B1", "B2"]);
    expect(fargVy(r, "c-gra")).toEqual(["A1", "A2", "N1", "N2"]);
    expect(fargVy(r, "c-bla")).toEqual(["B1", "B2"]);
  });

  it("den sista färgen får sina filer sist i galleriet", () => {
    const r = laggTillIVal(lage(), "c-bla", bilder("N1"));
    if ("hinder" in r) throw new Error(r.hinder);
    expect(r.bilder.map((b) => b.id)).toEqual(["A1", "A2", "B1", "B2", "N1"]);
  });

  it("en färg utan länkad bild eller vars länkar saknas i galleriet är ett hinder", () => {
    const utan = { bilder: bilder("A1"), optioner: optioner({ "c-gra": ["A1"], "c-bla": [] }) };
    expect(laggTillIVal(utan, "c-bla", bilder("N1"))).toEqual({ hinder: "val_utan_bild" });
    const trasig = { bilder: bilder("A1"), optioner: optioner({ "c-gra": ["A1"], "c-bla": ["B9"] }) };
    expect(laggTillIVal(trasig, "c-bla", bilder("N1"))).toEqual({ hinder: "plan_ogiltig" });
  });
});

// ── planen ──────────────────────────────────────────────────────────────────

describe("planeraTillagg", () => {
  it("lägger Grås filer efter A2, länkar dem, och bygger svenska alt-texter med löpande nummer", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    const [p] = await planeraTillagg([atg(id(1), "c-gra", fil(2001), fil(2002))], w.deps);
    expect(p.hinder).toBeUndefined();
    expect(p.galleriEfter.map((b) => b.id)).toEqual(["A1", "A2", fil(2001), fil(2002), "B1", "B2"]);
    expect(p.galleriEfter.slice(2, 4).map((b) => b.alt)).toEqual(["Soffa 1 i färgen grå, bild 3", "Soffa 1 i färgen grå, bild 4"]);
    expect(p.val.map((v) => [v.valId, v.lankadeEfter])).toEqual([
      ["c-gra", ["A1", "A2", fil(2001), fil(2002)]],
      ["c-bla", ["B1", "B2"]],
    ]);
    expect(p.atgarder.map((a) => [a.val, a.typ, a.kalla, a.hinder])).toEqual([
      ["c-gra", "infoga", "matchar", undefined],
      ["c-gra", "infoga", "matchar", undefined],
    ]);
    // Intern bokföring: feedens egen sträng för varje fil, aldrig i det publika svaret.
    expect(p.atgarder.map((a) => a.sparaKalla)).toEqual([kallUrl(SKU_A, 3), kallUrl(SKU_A, 8)]);
  });

  it("en egen alt-text används, och en alt-text som redan finns på sidan får ett nummer efter sig", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    const [p] = await planeraTillagg([atg(id(1), "c-gra",
      { fil: fil(2001), alt: "Närbild på soffans sittdyna i grått tyg" },
      { fil: fil(2002), alt: "Närbild på soffans sittdyna i grått tyg" },
    )], w.deps);
    expect(p.galleriEfter.slice(2, 4).map((b) => b.alt)).toEqual([
      "Närbild på soffans sittdyna i grått tyg",
      "Närbild på soffans sittdyna i grått tyg, bild 2",
    ]);
  });

  it("☠️ en fil från en annan färgs artikel blir annan_kalla, och färgens egna filer skrivs ändå", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    const [p] = await planeraTillagg([atg(id(1), "c-gra", fil(2001), fil(3001))], w.deps);
    expect(p.atgarder.map((a) => a.hinder)).toEqual([undefined, "annan_kalla"]);
    expect(p.galleriEfter.map((b) => b.id)).toEqual(["A1", "A2", fil(2001), "B1", "B2"]);
  });

  it("☠️ en fil från en annan produkt (okänd position) blir också annan_kalla", async () => {
    const k = new Map([...NYA, [fil(2001), "https://img.aosomcdn.com/HEMLIG-KATALOG/ANNAN/1.jpg"]]);
    const w = varld([sida()], [flera(id(1))], k);
    const [p] = await planeraTillagg([atg(id(1), "c-gra", fil(2001))], w.deps);
    expect(p.atgarder[0].hinder).toBe("annan_kalla");
    expect(p.galleriEfter).toEqual(p.galleriFore);
  });

  it("en fil vars källa inte går att läsa planeras ändå, markerad okand och utan bokföring", async () => {
    const w = varld([sida()], [flera(id(1))], KALLOR);
    const [p] = await planeraTillagg([atg(id(1), "c-gra", fil(2001))], w.deps);
    expect([p.atgarder[0].kalla, p.atgarder[0].hinder, p.atgarder[0].sparaKalla]).toEqual(["okand", undefined, undefined]);
    expect(p.galleriEfter.map((b) => b.id)).toContain(fil(2001));
  });

  it("hindren: finns_redan, fullt, ogiltig_alt, val_finns_inte, inte_publicerad, saknas_i_wix", async () => {
    const fullt = Array.from({ length: MAX_BILDER - 2 }, (_, i) => `Z${i}`);
    const w = varld(
      [
        v3(1, [fil(2001), "A2", "B1", "B2"], { gra: [fil(2001), "A2"], bla: ["B1", "B2"] }),
        v3(2, ["A1", ...fullt], { gra: ["A1"], bla: [fullt[0]] }),
        sida(3),
        sida(4, { visible: false }),
      ],
      [flera(id(1)), flera(id(2)), flera(id(3)), flera(id(4))],
      NYA,
    );
    const s = await planeraTillagg(
      [
        atg(id(1), "c-gra", fil(2001)),
        atg(id(2), "c-gra", fil(2002), fil(2003)),
        atg(id(3), "c-gra", { fil: fil(2001), alt: "Schwarze Hundehütte mit Dach" }, { fil: fil(2002), alt: "Se aosom.de för mer" }, { fil: fil(2003), alt: "ok" }),
        atg(id(3), "c-x", fil(2001)),
        atg(id(4), "c-gra", fil(2001)),
        atg(id(9), "c-gra", fil(2001)),
      ],
      w.deps,
    );
    const per = (i: number) => s.find((p) => p.id === id(i))!;
    expect(per(1).atgarder.map((a) => a.hinder)).toEqual(["finns_redan"]);
    // Sidan har 49 bilder: den första filen ryms (50), den andra ryms inte.
    expect(per(2).atgarder.map((a) => a.hinder)).toEqual([undefined, "fullt"]);
    expect(per(3).atgarder.map((a) => [a.val, a.hinder])).toEqual([
      ["c-gra", "ogiltig_alt"], ["c-gra", "ogiltig_alt"], ["c-gra", "ogiltig_alt"], ["c-x", "val_finns_inte"],
    ]);
    expect(per(4).hinder).toBe("inte_publicerad");
    expect(per(9).hinder).toBe("saknas_i_wix");
  });

  it("☠️ ett get-files-fel kastar i stället för att släppa igenom källkollen", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    w.deps.hamtaKallor = async () => { throw new Error(kallUrl(SKU_A, 2)); };
    const e = await planeraTillagg([atg(id(1), "c-gra", fil(2001))], w.deps).catch((x: Error) => x);
    expect(String(e)).toMatch(/get-files/);
    expect(String(e)).not.toContain(CDN);
  });
});

describe("planShaTillagg", () => {
  it("☠️ binder filerna, deras ordning, alt-texterna och sidans läge", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    const sha = async (a: TillaggAtgard[]) => planShaTillagg(a, await planeraTillagg(a, w.deps));
    const bas = await sha([atg(id(1), "c-gra", fil(2001), fil(2002))]);
    expect(bas).toMatch(/^[0-9a-f]{64}$/);
    expect(await sha([atg(id(1), "c-gra", fil(2001), fil(2002))])).toBe(bas);
    expect(await sha([atg(id(1), "c-gra", fil(2002), fil(2001))])).not.toBe(bas);
    expect(await sha([atg(id(1), "c-gra", fil(2001))])).not.toBe(bas);
    expect(await sha([atg(id(1), "c-gra", { fil: fil(2001), alt: "Närbild på ett gråbeige tyg" }, fil(2002))])).not.toBe(bas);
    w.p.get(id(1))!.revision = "9";
    w.p.get(id(1))!.media = { itemsInfo: { items: [{ id: "A1", altText: "annan text" }, { id: "A2" }, { id: "B1" }, { id: "B2" }] } };
    expect(await sha([atg(id(1), "c-gra", fil(2001), fil(2002))])).not.toBe(bas);
  });
});

// ── plan och skriv ──────────────────────────────────────────────────────────

describe("planeraOchSkrivTillagg", () => {
  const a2 = () => [atg(id(1), "c-gra", fil(2001), fil(2002)), atg(id(1), "c-bla", fil(3001))];

  it("plan skriver ingenting och visar vad som ändras utan att nämna en fil eller en källa", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    const s = await planeraOchSkrivTillagg(a2(), { skriv: false }, w.deps);
    expect(w.patchar).toHaveLength(0);
    expect(s.produkter).toEqual([{
      id: id(1), andrar: true, bilderFore: 4, bilderEfter: 7, lankarAndras: 2,
      atgarder: [
        { val: "c-bla", typ: "infoga", kalla: "matchar" },
        { val: "c-gra", typ: "infoga", kalla: "matchar" },
        { val: "c-gra", typ: "infoga", kalla: "matchar" },
      ],
    }]);
    expect(s.sha).toMatch(/^[0-9a-f]{64}$/);
  });

  it("☠️ skriv med en annan sha skriver ingenting", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    const s = await planeraOchSkrivTillagg(a2(), { skriv: true, bekrafta: "0".repeat(64) }, w.deps);
    expect(s.stoppadAv).toBe("sha");
    expect(w.patchar).toHaveLength(0);
  });

  it("skriver galleriet ensamt vid id, sedan länkarna med options + variantsInfo ordagrant och visible, och sparar kopplingen", async () => {
    const produkt = sida();
    const w = varld([produkt], [flera(id(1))], NYA);
    const { sha } = await planeraOchSkrivTillagg(a2(), { skriv: false }, w.deps);
    w.v.gamlaLasningar = 1;
    w.v.lank404 = 1;
    const s = await planeraOchSkrivTillagg(a2(), { skriv: true, bekrafta: sha }, w.deps);

    expect([s.stoppadAv, s.skrivna]).toEqual(["klart", 1]);
    expect(w.patchar.map((x) => x.paths.join())).toEqual(["media", "options,variantsInfo,visible", "options,variantsInfo,visible"]);
    // ☠️ Aldrig en adress i galleriskrivningen: Wix hade importerat om bilderna.
    expect(JSON.stringify(w.patchar[0])).not.toMatch(/url|wixstatic|http/i);
    const efter = w.p.get(id(1))!;
    expect(galleriAv(efter)).toEqual(["A1", "A2", fil(2001), fil(2002), "B1", "B2", fil(3001)]);
    expect(lankade(efter, "c-gra")).toEqual(["A1", "A2", fil(2001), fil(2002)]);
    expect(lankade(efter, "c-bla")).toEqual(["B1", "B2", fil(3001)]);
    expect(w.patchar[2].product.visible).toBe(true);
    expect(w.patchar[2].product.variantsInfo).toEqual(produkt.variantsInfo);
    expect(w.sparade[0].aosomBildFiler).toEqual([
      { fileId: fil(3001), kalla: kallUrl(SKU_B, 3) },
      { fileId: fil(2001), kalla: kallUrl(SKU_A, 3) },
      { fileId: fil(2002), kalla: kallUrl(SKU_A, 8) },
    ]);
  });

  it("efter skrivningen finns filerna redan: planen ändrar ingenting och hindret är finns_redan", async () => {
    const w = varld([sida()], [flera(id(1))], NYA);
    const { sha } = await planeraOchSkrivTillagg(a2(), { skriv: false }, w.deps);
    await planeraOchSkrivTillagg(a2(), { skriv: true, bekrafta: sha }, w.deps);
    const igen = await planeraOchSkrivTillagg(a2(), { skriv: false }, w.deps);
    expect(igen.skrivbara).toBe(0);
    expect(igen.produkter[0].atgarder.every((x) => x.hinder === "finns_redan")).toBe(true);
  });

  it("☠️ stannar vid första sida som inte läser tillbaka, och rör inte nästa", async () => {
    const w = varld([sida(1), sida(2)], [flera(id(1)), flera(id(2))], NYA);
    w.v.tarInte.add(id(1));
    const a = [atg(id(1), "c-gra", fil(2001)), atg(id(2), "c-gra", fil(2002))];
    const { sha } = await planeraOchSkrivTillagg(a, { skriv: false }, w.deps);
    const s = await planeraOchSkrivTillagg(a, { skriv: true, bekrafta: sha }, w.deps);
    expect(s.stoppadAv).toBe("avvikelse");
    expect(s.utfall).toHaveLength(1);
    expect(w.patchar).toHaveLength(1);
    expect(w.sparade).toHaveLength(0);
  });

  it("stannar på tidsbudgeten mellan sidor och säger vilka som är kvar", async () => {
    const w = varld([sida(1), sida(2)], [flera(id(1)), flera(id(2))], NYA);
    const a = [atg(id(1), "c-gra", fil(2001)), atg(id(2), "c-gra", fil(2002))];
    const { sha } = await planeraOchSkrivTillagg(a, { skriv: false }, w.deps);
    let t = 0;
    w.deps.nu = () => (t += 300_000);
    const s = await planeraOchSkrivTillagg(a, { skriv: true, bekrafta: sha }, w.deps);
    expect([s.stoppadAv, s.skrivna, s.kvar]).toEqual(["tidsbudget", 1, [id(2)]]);
  });

  it("☠️ svaret bär aldrig artikelnummer eller adresser, inte heller vid fel", async () => {
    const w = varld([sida(1), sida(2), sida(3)], [flera(id(1)), flera(id(2)), flera(id(3))], NYA);
    w.v.tarInte.add(id(3));
    const a = [
      atg(id(1), "c-gra", fil(2001), fil(3001)),
      atg(id(2), "c-bla", fil(3001)),
      atg(id(3), "c-gra", fil(2002)),
    ];
    const { sha } = await planeraOchSkrivTillagg(a, { skriv: false }, w.deps);
    const s = await planeraOchSkrivTillagg(a, { skriv: true, bekrafta: sha }, w.deps);
    expect(s.stoppadAv).toBe("avvikelse");
    const json = JSON.stringify(s);
    for (const h of [...HEMLIGT, "http"]) expect(json).not.toContain(h);
  });
});

describe("normKalla i färgtillägget", () => {
  it("två adresser till samma bild räknas som samma, med olika protokoll och query", () => {
    expect(normKalla(`${kallUrl(SKU_A, 3)}?v=2`)).toBe(normKalla(kallUrl(SKU_A, 3).replace("https:", "http:")));
  });
});

// Typerna används av fixturen även när ingen test läser dem.
export type _Anvand = LivsbildDeps | WixAnrop | AosomRow;
