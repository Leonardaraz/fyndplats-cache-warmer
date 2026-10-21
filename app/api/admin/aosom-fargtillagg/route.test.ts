// Admin-rutten för färgtillägget: auth, lägena, bekräftelsen och att svaret inte
// bär något ur feeden. Wix, mappningarna, feeden och Media Manager är låtsade;
// kandidaterna, planen och skrivningen är de riktiga.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type Obj = Record<string, unknown>;

const SKU_A = "835-HEMLIGA";
const SKU_B = "836-HEMLIGB";
const CDN = "https://img.aosomcdn.com/HEMLIG-KATALOG";
const ID1 = "11111111-2222-4333-8444-555555555555";
const fil = (n: number) => `b379ce_${n.toString(16).padStart(32, "0")}~mv2.jpg`;
const HEMLIGT = [SKU_A, SKU_B, "HEMLIG", "aosomcdn", "aosom.de"];

/** Grå äger fil 1 och 2 (artikel A:s position 1 och 2), Blå fil 11 och 12 (artikel B). */
const KALLA = new Map<string, string>([
  [fil(1), `${CDN}/A/1.jpg`], [fil(2), `${CDN}/A/2.jpg`],
  [fil(11), `${CDN}/B/1.jpg`], [fil(12), `${CDN}/B/2.jpg`],
]);

const varld = vi.hoisted(() => ({
  produkter: {} as Record<string, Record<string, unknown>>,
  patchar: [] as string[],
  uppladdade: [] as string[],
  mappningar: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/polish/skrivplan-wix", () => ({
  skapaWixAnrop: () => async (metod: string, sokvag: string, kropp?: unknown) => {
    if (sokvag === "/stores/v3/products/search") {
      return { products: structuredClone(Object.values(varld.produkter)), pagingMetadata: { hasNext: false } };
    }
    const id = decodeURIComponent(sokvag.split("?")[0].split("/").pop()!);
    const p = varld.produkter[id];
    if (!p) throw new Error("Wix 404: finns inte");
    if (metod === "GET") return { product: structuredClone(p) };
    const k = kropp as { product: Obj; fieldMask: { paths: string[] } };
    varld.patchar.push(k.fieldMask.paths.join());
    if (k.fieldMask.paths.join() === "media") {
      p.media = structuredClone(k.product.media);
    } else {
      p.options = structuredClone(k.product.options);
      p.variantsInfo = structuredClone(k.product.variantsInfo);
      p.visible = k.product.visible;
    }
    p.revision = String(Number(p.revision) + 1);
    return { product: structuredClone(p) };
  },
}));

vi.mock("@/lib/store/factory", () => ({
  getStore: () => ({
    listMappings: async () => structuredClone(varld.mappningar),
    getMappingByWixProductId: async (id: string) =>
      structuredClone(varld.mappningar.find((m) => m.wixProductId === id) ?? null),
    saveMapping: async (r: Record<string, unknown>) => {
      varld.mappningar = varld.mappningar.map((m) => (m.wixProductId === r.wixProductId ? r : m));
    },
  }),
}));

vi.mock("@/lib/aosom/feed", () => ({
  fetchAosomFeed: async () => [
    {
      sku: "835-HEMLIGA",
      url: "https://www.aosom.de/HEMLIG-PRODUKTSIDA-A.html",
      imageUrls: Array.from({ length: 10 }, (_, i) => `https://img.aosomcdn.com/HEMLIG-KATALOG/A/${i + 1}.jpg`),
    },
    {
      sku: "836-HEMLIGB",
      url: "https://www.aosom.de/HEMLIG-PRODUKTSIDA-B.html",
      imageUrls: Array.from({ length: 10 }, (_, i) => `https://img.aosomcdn.com/HEMLIG-KATALOG/B/${i + 1}.jpg`),
    },
  ],
}));

vi.mock("@/lib/wix/media", () => ({
  // Filerna 100+p och 200+p kom från artikel A:s respektive B:s position p.
  getMediaSourceUrls: async (ids: string[]) => {
    const ut = new Map<string, string>();
    for (const id of ids) {
      const n = /^b379ce_0+([0-9a-f]+)~mv2\.jpg$/.exec(id);
      if (!n) continue;
      const tal = parseInt(n[1], 16);
      if (tal === 1 || tal === 2) ut.set(id, `https://img.aosomcdn.com/HEMLIG-KATALOG/A/${tal}.jpg`);
      else if (tal === 11 || tal === 12) ut.set(id, `https://img.aosomcdn.com/HEMLIG-KATALOG/B/${tal - 10}.jpg`);
      else if (tal > 100 && tal < 200) ut.set(id, `https://img.aosomcdn.com/HEMLIG-KATALOG/A/${tal - 100}.jpg`);
      else if (tal > 200 && tal < 300) ut.set(id, `https://img.aosomcdn.com/HEMLIG-KATALOG/B/${tal - 200}.jpg`);
    }
    return ut;
  },
  importMediaByUrl: async (url: string, namn: string) => {
    varld.uppladdade.push(namn);
    const m = /\/(A|B)\/(\d+)\.jpg$/.exec(url)!;
    const n = (m[1] === "A" ? 100 : 200) + Number(m[2]);
    return { id: fil(n), url: `https://static.wixstatic.com/media/${fil(n)}`, kalla: url };
  },
}));

vi.mock("@/lib/audit", () => ({ audit: async () => {} }));

import { POST } from "./route";

function anrop(kropp: unknown, auth = true): NextRequest {
  return new NextRequest("https://motor.test/api/admin/aosom-fargtillagg", {
    method: "POST",
    headers: { ...(auth ? { authorization: "Bearer hemligt" } : {}), "content-type": "application/json" },
    body: JSON.stringify(kropp),
  });
}

const galleri = (): string[] =>
  ((varld.produkter[ID1].media as Obj).itemsInfo as { items: { id: string }[] }).items.map((i) => i.id);
const lankade = (valId: string): string[] =>
  ((((varld.produkter[ID1].options as Obj[])[0].choicesSettings as Obj).choices as Obj[])
    .find((c) => c.choiceId === valId)!.linkedMedia as { id: string }[]).map((m) => m.id);

beforeEach(() => {
  process.env.CRON_SECRET = "hemligt";
  varld.patchar = [];
  varld.uppladdade = [];
  varld.produkter = {
    [ID1]: {
      id: ID1, name: "Soffa", visible: true, revision: "1",
      media: {
        itemsInfo: {
          items: [fil(1), fil(2), fil(11), fil(12)].map((id) => ({ id, altText: `Soffa ${KALLA.get(id) ? "bild" : ""}` })),
        },
      },
      options: [{
        id: "opt-farg", name: "Färg",
        choicesSettings: {
          choices: [
            { choiceId: "c-gra", name: "Grå", linkedMedia: [fil(1), fil(2)].map((id) => ({ id })) },
            { choiceId: "c-bla", name: "Blå", linkedMedia: [fil(11), fil(12)].map((id) => ({ id })) },
          ],
        },
      }],
      variantsInfo: {
        variants: [
          { id: "v1", visible: true, sku: "FP-1", price: { actualPrice: { amount: "999" } },
            choices: [{ optionChoiceNames: { optionName: "Färg", choiceName: "Grå" } }] },
          { id: "v2", visible: true, sku: "FP-2", price: { actualPrice: { amount: "999" } },
            choices: [{ optionChoiceNames: { optionName: "Färg", choiceName: "Blå" } }] },
        ],
      },
    },
  };
  varld.mappningar = [{
    supplierProductId: `aosom:${SKU_A}`, supplier: "aosom", wixProductId: ID1,
    variants: [
      { wixVariantId: "v1", supplierVariantId: SKU_A, sku: "FP-1", choices: { Färg: "Grå" } },
      { wixVariantId: "v2", supplierVariantId: SKU_B, sku: "FP-2", choices: { Färg: "Blå" } },
    ],
  }];
});

describe("POST /api/admin/aosom-fargtillagg", () => {
  it("vägrar utan nyckel", async () => {
    expect((await POST(anrop({}, false))).status).toBe(401);
  });

  it("vägrar ett okänt läge och värden som inte är wix-id, positioner, antal eller dryRun", async () => {
    expect((await POST(anrop({ lage: "radera" }))).status).toBe(400);
    const mal = await POST(anrop({ lage: "kandidater", mal: [SKU_A] }));
    expect(mal.status).toBe(400);
    expect(JSON.stringify(await mal.json())).not.toContain(SKU_A);
    expect((await POST(anrop({ lage: "kandidater", mal: [ID1], positioner: [3, 99] }))).status).toBe(400);
    expect((await POST(anrop({ lage: "kandidater", mal: [ID1], positioner: ["x"] }))).status).toBe(400);
    expect((await POST(anrop({ lage: "kandidater", mal: [ID1], hogstBilder: 2.5 }))).status).toBe(400);
    expect((await POST(anrop({ lage: "kandidater", mal: [ID1], dryRun: "nej" }))).status).toBe(400);
    expect((await POST(anrop({ lage: "plan", sidor: "x" }))).status).toBe(400);
    expect((await POST(anrop({ lage: "plan", sidor: [{ id: ID1, val: "c-gra", bilder: [SKU_A] }] }))).status).toBe(400);
    expect(varld.uppladdade).toEqual([]);
  });

  it("kandidater torrkör som standard, tar de färger som visar få bilder och laddar upp först med dryRun: false", async () => {
    const torr = (await (await POST(anrop({ lage: "kandidater", mal: ID1 }))).json()) as {
      ok: boolean; dryRun: boolean; uppladdade: number; rader: { val: string; namn: string; nuvarande: number; attHamta: number[] }[];
    };
    expect(torr).toMatchObject({ ok: true, dryRun: true, uppladdade: 0 });
    expect(torr.rader.map((r) => [r.val, r.namn, r.nuvarande, r.attHamta])).toEqual([
      ["c-gra", "Grå", 2, [3, 8, 9, 10]],
      ["c-bla", "Blå", 2, [3, 8, 9, 10]],
    ]);
    expect(varld.uppladdade).toEqual([]);

    const skarp = (await (await POST(anrop({
      lage: "kandidater", mal: [`${ID1}:c-gra`], positioner: [3], dryRun: false,
    }))).json()) as { ok: boolean; uppladdade: number; rader: { kandidater: { pos: number; fileId: string }[] }[] };
    expect(skarp).toMatchObject({ ok: true, uppladdade: 1 });
    expect(skarp.rader[0].kandidater).toEqual([expect.objectContaining({ pos: 3, fileId: fil(103) })]);
    expect(varld.uppladdade).toEqual([`kandidat-${ID1.slice(0, 8)}-v1-3.jpg`]);
    for (const h of HEMLIGT) expect(JSON.stringify(skarp)).not.toContain(h);
    for (const h of HEMLIGT) expect(JSON.stringify(torr)).not.toContain(h);
  });

  it("☠️ skriv kräver planens sha för samma sidor och filer mot samma läsningar", async () => {
    const sidor = [{ id: ID1, val: "c-gra", bilder: [{ fil: fil(103), alt: "Soffan i grått, sedd från sidan" }] }];
    const plan = (await (await POST(anrop({ lage: "plan", sidor }))).json()) as Obj;
    expect(plan).toMatchObject({ ok: true, lage: "plan", skrivbara: 1 });
    expect(plan.sha).toMatch(/^[0-9a-f]{64}$/);
    expect(varld.patchar).toEqual([]);

    expect((await POST(anrop({ lage: "skriv", sidor }))).status).toBe(400);
    const annan = await POST(anrop({
      lage: "skriv",
      sidor: [{ id: ID1, val: "c-gra", bilder: [fil(108)] }],
      bekrafta: plan.sha,
    }));
    expect(annan.status).toBe(409);
    expect(varld.patchar).toEqual([]);

    const res = await POST(anrop({ lage: "skriv", sidor, bekrafta: plan.sha }));
    expect(res.status).toBe(200);
    const svar = (await res.json()) as Obj;
    expect(svar).toMatchObject({ ok: true, lage: "skriv", skrivna: 1, stoppadAv: "klart" });
    // Galleriet först, länkarna sedan: den nya filen ligger efter Grås sista bild.
    expect(varld.patchar.slice(0, 2)).toEqual(["media", "options,variantsInfo,visible"]);
    expect(galleri()).toEqual([fil(1), fil(2), fil(103), fil(11), fil(12)]);
    expect(lankade("c-gra")).toEqual([fil(1), fil(2), fil(103)]);
    expect(lankade("c-bla")).toEqual([fil(11), fil(12)]);
    expect(varld.mappningar[0].aosomBildFiler).toEqual([{ fileId: fil(103), kalla: `${CDN}/A/3.jpg` }]);
    for (const h of HEMLIGT) expect(JSON.stringify(svar)).not.toContain(h);
  });

  it("☠️ en fil från fel färgs artikel blir ett hinder och skrivs inte", async () => {
    // Fil 203 hämtades för Blå (artikel B) och får inte hamna på Grå.
    const sidor = [{ id: ID1, val: "c-gra", bilder: [fil(203)] }];
    const plan = (await (await POST(anrop({ lage: "plan", sidor }))).json()) as Obj;
    expect(plan.skrivbara).toBe(0);
    expect(JSON.stringify(plan)).toContain("annan_kalla");
    const res = await POST(anrop({ lage: "skriv", sidor, bekrafta: plan.sha }));
    expect(varld.patchar).toEqual([]);
    expect(res.status).toBe(200);
    expect(galleri()).toEqual([fil(1), fil(2), fil(11), fil(12)]);
  });

  it("☠️ en sida som ändrats efter planen ger 409 och skrivs inte", async () => {
    const sidor = [{ id: ID1, val: "c-gra", bilder: [fil(103)] }];
    const plan = (await (await POST(anrop({ lage: "plan", sidor }))).json()) as Obj;
    (varld.produkter[ID1].media as Obj).itemsInfo = {
      items: [fil(1), fil(2), fil(11), fil(12), fil(13)].map((id) => ({ id, altText: "bild" })),
    };
    const res = await POST(anrop({ lage: "skriv", sidor, bekrafta: plan.sha }));
    expect(res.status).toBe(409);
    expect(varld.patchar).toEqual([]);
  });
});
