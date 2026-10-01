// Admin-rutten för miljöbilden: auth, lägena, sha-kvitteringen och att svaret
// inte bär något ur feeden. Wix, mappningarna, feeden och Media Manager är
// låtsade; rapporten, kandidaterna, planen och skrivningen är de riktiga.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type Obj = Record<string, unknown>;

const SKU = "835-HEMLIGA";
const CDN = "https://img.aosomcdn.com/HEMLIG-KATALOG";
const ID1 = "11111111-2222-4333-8444-555555555555";
const fil = (n: number) => `b379ce_${n.toString(16).padStart(32, "0")}~mv2.jpg`;
const HEMLIGT = [SKU, "HEMLIG", "aosomcdn", "aosom.de"];

const varld = vi.hoisted(() => ({
  produkter: {} as Record<string, Record<string, unknown>>,
  patchar: 0,
  uppladdade: [] as string[],
  mappningar: [] as Record<string, unknown>[],
}));

vi.mock("@/lib/polish/skrivplan-wix", () => ({
  skapaWixAnrop: () => async (metod: string, sokvag: string, kropp?: unknown) => {
    if (sokvag === "/stores/v3/products/search") {
      return { products: Object.values(varld.produkter), pagingMetadata: { hasNext: false } };
    }
    const id = decodeURIComponent(sokvag.split("?")[0].split("/").pop()!);
    const p = varld.produkter[id];
    if (!p) throw new Error("Wix 404: finns inte");
    if (metod === "GET") return { product: structuredClone(p) };
    varld.patchar++;
    p.media = structuredClone((kropp as { product: Obj }).product.media);
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
  fetchAosomFeed: async () => [{
    sku: "835-HEMLIGA",
    url: "https://www.aosom.de/HEMLIG-PRODUKTSIDA.html",
    imageUrls: Array.from({ length: 10 }, (_, i) => `https://img.aosomcdn.com/HEMLIG-KATALOG/${i + 1}.jpg`),
  }],
}));

vi.mock("@/lib/wix/media", () => ({
  // Fil n kom från feedens position n.
  getMediaSourceUrls: async (ids: string[]) => {
    const ut = new Map<string, string>();
    for (const id of ids) {
      const m = /^b379ce_0+([0-9a-f]+)~mv2\.jpg$/.exec(id);
      if (m) ut.set(id, `https://img.aosomcdn.com/HEMLIG-KATALOG/${parseInt(m[1], 16)}.jpg`);
    }
    return ut;
  },
  importMediaByUrl: async (url: string, namn: string) => {
    varld.uppladdade.push(namn);
    return { id: fil(99), url: `https://static.wixstatic.com/media/${fil(99)}`, kalla: url };
  },
}));

vi.mock("@/lib/audit", () => ({ audit: async () => {} }));

import { POST } from "./route";

function anrop(kropp: unknown, auth = true): NextRequest {
  return new NextRequest("https://motor.test/api/admin/aosom-livsbild", {
    method: "POST",
    headers: { ...(auth ? { authorization: "Bearer hemligt" } : {}), "content-type": "application/json" },
    body: JSON.stringify(kropp),
  });
}

beforeEach(() => {
  process.env.CRON_SECRET = "hemligt";
  varld.patchar = 0;
  varld.uppladdade = [];
  varld.produkter = {
    [ID1]: {
      id: ID1, name: "Soffa", visible: true, revision: "1",
      media: { itemsInfo: { items: [{ id: fil(1), altText: "a" }, { id: fil(3), altText: "b" }] } },
      options: [],
      variantsInfo: { variants: [{ id: "v1", visible: true }] },
    },
  };
  varld.mappningar = [{ supplierProductId: `aosom:${SKU}`, supplier: "aosom", wixProductId: ID1, variants: [] }];
});

describe("POST /api/admin/aosom-livsbild", () => {
  it("vägrar utan nyckel", async () => {
    expect((await POST(anrop({}, false))).status).toBe(401);
  });

  it("rapport är default och bär bara nycklar och räknare", async () => {
    const res = await POST(anrop({}));
    expect(res.status).toBe(200);
    const svar = (await res.json()) as Obj;
    expect(svar).toMatchObject({ ok: true, lage: "rapport", granskade: 1, nasta: null });
    expect((svar.ids as Obj).saknas).toEqual([ID1]);
    const json = JSON.stringify(svar);
    for (const h of HEMLIGT) expect(json).not.toContain(h);
  });

  it("vägrar ett okänt läge, en markör med fel tecken och mål som inte är wix-id", async () => {
    expect((await POST(anrop({ lage: "radera" }))).status).toBe(400);
    expect((await POST(anrop({ lage: "rapport", efter: "a b" }))).status).toBe(400);
    const res = await POST(anrop({ lage: "kandidater", mal: [SKU] }));
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).not.toContain(SKU);
  });

  it("kandidater torrkör som standard och laddar upp först med dryRun: false", async () => {
    const torr = (await (await POST(anrop({ lage: "kandidater", mal: ID1 }))).json()) as Obj;
    expect(torr).toMatchObject({ ok: true, dryRun: true, uppladdade: 0 });
    expect(varld.uppladdade).toEqual([]);
    const skarp = (await (await POST(anrop({ lage: "kandidater", mal: [ID1], dryRun: false }))).json()) as Obj;
    expect(skarp).toMatchObject({ ok: true, dryRun: false, uppladdade: 1 });
    expect(varld.uppladdade).toEqual([`kandidat-${ID1.slice(0, 8)}-2.jpg`]);
    const json = JSON.stringify(skarp);
    for (const h of HEMLIGT) expect(json).not.toContain(h);
  });

  it("☠️ skriv kräver planens sha för samma par mot samma sidor", async () => {
    const plan = (await (await POST(anrop({ lage: "plan", par: `${ID1}:${fil(2)}` }))).json()) as Obj;
    expect(plan).toMatchObject({ ok: true, lage: "plan", skrivbara: 1 });
    expect(plan.sha).toMatch(/^[0-9a-f]{64}$/);
    expect(varld.patchar).toBe(0);

    expect((await POST(anrop({ lage: "skriv", par: `${ID1}:${fil(2)}` }))).status).toBe(400);
    const annan = await POST(anrop({ lage: "skriv", par: `${ID1}:${fil(4)}`, bekrafta: plan.sha }));
    expect(annan.status).toBe(409);
    expect(varld.patchar).toBe(0);

    const res = await POST(anrop({ lage: "skriv", par: [`${ID1}:${fil(2)}`], bekrafta: plan.sha }));
    expect(res.status).toBe(200);
    const svar = (await res.json()) as Obj;
    expect(svar).toMatchObject({ ok: true, lage: "skriv", skrivna: 1, stoppadAv: "klart" });
    expect(varld.patchar).toBe(1);
    const items = ((varld.produkter[ID1].media as Obj).itemsInfo as { items: { id: string }[] }).items;
    expect(items.map((i) => i.id)).toEqual([fil(1), fil(2), fil(3)]);
    expect(varld.mappningar[0].aosomBildFiler).toEqual([{ fileId: fil(2), kalla: `${CDN}/2.jpg` }]);
    const json = JSON.stringify(svar);
    for (const h of HEMLIGT) expect(json).not.toContain(h);
  });

  it("☠️ en sida som ändrats efter planen ger 409 och skrivs inte", async () => {
    const plan = (await (await POST(anrop({ lage: "plan", par: `${ID1}:${fil(2)}` }))).json()) as Obj;
    (varld.produkter[ID1].media as Obj).itemsInfo = { items: [{ id: fil(1), altText: "a" }, { id: fil(8), altText: "c" }] };
    const res = await POST(anrop({ lage: "skriv", par: `${ID1}:${fil(2)}`, bekrafta: plan.sha }));
    expect(res.status).toBe(409);
    expect(varld.patchar).toBe(0);
  });
});
