// Rutten för radering av pensionerade utkast: behörighet, parametrar och de två
// grindarna som ska hålla även när logiken bakom är riktig — `bekrafta` och en
// klocka som bara får gå bakåt. Logiken själv testas i lib/aosom/pensionerade.test.ts.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MemoryStore } from "@/lib/store/memory";
import type { ProductMappingRecord } from "@/lib/store";
import type { KatalogProdukt } from "@/lib/wix/media-audit";

let store: MemoryStore;
vi.mock("@/lib/store/factory", () => ({ getStore: () => store }));

let auktoriserad = true;
vi.mock("@/lib/auth", () => ({ isAuthorized: () => auktoriserad }));
vi.mock("@/lib/audit", () => ({ audit: async () => {} }));

let katalog: KatalogProdukt[] = [];
let katalogKomplett = true;
vi.mock("@/lib/wix/media-audit", () => ({
  headlessSiteId: () => "sajt",
  listCatalogProductMedia: async () => ({ produkter: katalog, complete: katalogKomplett }),
  countProducts: async () => katalog.length,
  collectCategoryMediaIds: async () => new Set<string>(),
  getFileStates: async (_s: string, ids: string[]) => new Map(ids.map((id) => [id, "OK"])),
}));

const raderade: string[] = [];
vi.mock("@/lib/wix/v3-products", () => ({
  lasProduktForRadering: async (id: string) => {
    const p = katalog.find((x) => x.id === id);
    return p ? { finns: true, visible: p.visible, slug: p.slug, skus: [], nycklar: p.nycklar } : { finns: false };
  },
  deleteV3Product: async (id: string) => {
    raderade.push(id);
    katalog = katalog.filter((x) => x.id !== id);
    return "raderad";
  },
  v3ProduktFinns: async (id: string) => katalog.some((x) => x.id === id),
}));
vi.mock("@/lib/wix/redirects", () => ({ listRedirects: async () => [] }));
vi.mock("@/lib/auction/store", () => ({ queryAuctions: async () => [] }));

import { GET } from "./route";

const GAMMAL = new Date(Date.now() - 30 * 86_400_000).toISOString();

/** Utan egen artikel — som en sammanslagen givare. `egen` ger raden en. */
function rad(id: string, egen = false): ProductMappingRecord {
  return {
    wixProductId: id,
    supplier: "aosom",
    supplierProductId: egen ? `aosom:SYNT-${id}` : "",
    draftStatus: "rejected",
    needsAiPolish: false,
    reviewedAt: GAMMAL,
    variants: [],
  } as unknown as ProductMappingRecord;
}

function anrop(q: string) {
  return GET(new NextRequest(`https://x.test/api/admin/pensionerade?${q}`));
}

beforeEach(async () => {
  store = new MemoryStore();
  auktoriserad = true;
  katalogKomplett = true;
  raderade.length = 0;
  // En butik stor nog att inte se ut som ett läsfel, plus två pensionerade utkast.
  katalog = Array.from({ length: 600 }, (_, i) => ({ id: `p${i}`, visible: true, slug: `s${i}`, nycklar: [`p${i}~mv2.jpg`] }));
  katalog.push({ id: "a", visible: false, slug: "tysk-slug-a", nycklar: ["a~mv2.jpg"] });
  katalog.push({ id: "b", visible: false, slug: "tysk-slug-b", nycklar: ["b~mv2.jpg"] });
  katalog.push({ id: "c", visible: false, slug: "tysk-slug-c", nycklar: ["c~mv2.jpg"] });
  await store.saveMapping(rad("a"));
  await store.saveMapping(rad("b"));
  await store.saveMapping(rad("c", true));
});

describe("GET /api/admin/pensionerade", () => {
  it("kräver behörighet", async () => {
    auktoriserad = false;
    expect((await anrop("lage=plan")).status).toBe(401);
  });

  it("okänt läge avvisas", async () => {
    expect((await anrop("lage=allt")).status).toBe(400);
  });

  it("☠️ en framtida klocka vägras — den hade gjort fler produkter raderbara", async () => {
    const framtid = new Date(Date.now() + 86_400_000).toISOString();
    expect((await anrop(`lage=radera&skarp=ja&bekrafta=2&per=${framtid}`)).status).toBe(400);
    expect(raderade).toEqual([]);
  });

  it("planen bär räknare och wix-id — aldrig artikelnummer eller slug", async () => {
    const res = await anrop("lage=plan");
    expect(res.status).toBe(200);
    const text = await res.text();
    const j = JSON.parse(text);
    expect(j.raderbara).toBe(2);
    expect(j.forstaRaderbara.sort()).toEqual(["a", "b"]);
    expect(j.egnaArtiklar).toBe(1);
    expect(j.egnaArtiklarIds).toEqual(["c"]);
    // Planens egen klocka, inte de raderbaras — den finns även när ingen är raderbar.
    expect(typeof j.aldstaPensionering).toBe("string");
    expect(text).not.toContain("SYNT-");
    expect(text).not.toContain("tysk-slug");
    expect(raderade).toEqual([]);
  });

  it("☠️ radera utan skarp raderar ingenting", async () => {
    await anrop("lage=radera&bekrafta=2");
    expect(raderade).toEqual([]);
  });

  it("☠️ fel bekrafta: 400 och ingenting raderat", async () => {
    const res = await anrop("lage=radera&skarp=ja&bekrafta=7");
    expect(res.status).toBe(400);
    expect(raderade).toEqual([]);
  });

  it("raderar, märker raderna och säger hur många som är kvar", async () => {
    const res = await anrop("lage=radera&skarp=ja&bekrafta=2&limit=1");
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.raderade).toBe(1);
    expect(j.kvar).toBe(1);
    expect(typeof j.per).toBe("string");
    const m = await store.getMappingByWixProductId(raderade[0]);
    expect(m?.wixRaderad).toBeTruthy();
    expect(raderade).not.toContain("c");
  });

  it("☠️ egna=ja tar med utkastet med egen artikel — och artikeln flyttas till spärren", async () => {
    const utan = await anrop("lage=radera&skarp=ja&bekrafta=3");
    expect(utan.status).toBe(400);
    expect(raderade).toEqual([]);
    const res = await anrop("lage=radera&skarp=ja&bekrafta=3&egna=ja");
    expect(res.status).toBe(200);
    expect(raderade.sort()).toEqual(["a", "b", "c"]);
    const c = await store.getMappingByWixProductId("c");
    expect(c?.importSparr).toBe("aosom:SYNT-c");
    expect(c?.supplierProductId).toBe("");
  });

  it("☠️ hogst utan per vägras — utan låst klocka kan planen växa av att tiden går", async () => {
    const res = await anrop("lage=radera&skarp=ja&hogst=2");
    expect(res.status).toBe(400);
    expect(raderade).toEqual([]);
  });

  it("följande varv: hogst och per godkänner en plan som inte vuxit, men inte en som gjort det", async () => {
    const per = new Date(Date.now() - 60_000).toISOString();
    const vaxt = await anrop(`lage=radera&skarp=ja&hogst=1&per=${per}`);
    expect(vaxt.status).toBe(400);
    expect(raderade).toEqual([]);
    const res = await anrop(`lage=radera&skarp=ja&hogst=2&per=${per}&limit=1`);
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.raderade).toBe(1);
    expect(j.per).toBe(per);
  });

  it("☠️ hogst och bekrafta samtidigt vägras", async () => {
    const per = new Date(Date.now() - 60_000).toISOString();
    const res = await anrop(`lage=radera&skarp=ja&bekrafta=2&hogst=2&per=${per}`);
    expect(res.status).toBe(400);
    expect(raderade).toEqual([]);
  });

  it("☠️ ett ofullständigt katalogsvep: 503 och ingenting raderat", async () => {
    katalogKomplett = false;
    const res = await anrop("lage=radera&skarp=ja&bekrafta=2");
    expect(res.status).toBe(503);
    expect(raderade).toEqual([]);
  });
});
