import { beforeEach, describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import type { Anrop } from "@/lib/wix/kategoritrad";
import { korKategorier, type KategoriDeps } from "./kategorier-kor";
import { TRADET } from "./kategorier";
import type { Avlasning } from "./lager";
import { testAvlasning } from "./testsida";

// Påhittade artikelnummer och id.
const sku = (n: number) => `TESTKATSKU${String(n).padStart(9, "0")}`;
const pid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const SVETS = [
  { id: "1", namn: "Verktyg" },
  { id: "2", namn: "Svetsning och lödning" },
  { id: "3", namn: "Svetsmaskiner" },
];
const KASSASKAP = [
  { id: "1", namn: "Verktyg" },
  { id: "2", namn: "Säkerhet och trygghet" },
  { id: "3", namn: "Kassaskåp" },
];

type Kropp = Record<string, unknown>;

let rader: Map<string, ProductMappingRecord>;
let avl: Map<string, Avlasning>;
let iKategori: Map<string, Set<string>>;
let addAnrop: { kategori: string; pids: string[] }[];
let svaraFel: Set<string>;
let tradetAndrat: ((t: { id: string; name: string; parentCategory?: { id: string } }[]) => void) | null;

function rad(n: number, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    wixProductId: pid(n),
    supplier: "vevor",
    supplierProductId: `vevor:${sku(n)}`,
    variants: [],
    needsAiPolish: true,
    draftStatus: "pending_review",
    ...over,
  } as unknown as ProductMappingRecord;
}

function lagg(n: number, kategorier: Avlasning["kategorier"], namn: string, over: Partial<ProductMappingRecord> = {}) {
  rader.set(pid(n), rad(n, over));
  avl.set(sku(n), testAvlasning({ sku: sku(n), kategorier, namn }));
}

function trad() {
  const ut: { id: string; name: string; parentCategory?: { id: string }; visible: boolean }[] = [];
  for (const [avd, subs] of Object.entries(TRADET)) {
    ut.push({ id: `avd-${avd}`, name: avd, visible: true });
    for (const s of subs) ut.push({ id: `kat-${s}`, name: s, parentCategory: { id: `avd-${avd}` }, visible: false });
  }
  tradetAndrat?.(ut);
  return ut;
}

const wix: Anrop = async (_metod, sokvag, kropp) => {
  if (sokvag === "/categories/v1/categories/query") return { categories: trad(), pagingMetadata: {} };
  const lista = /^\/categories\/v1\/categories\/([^/]+)\/list-items$/.exec(sokvag);
  if (lista) {
    const id = decodeURIComponent(lista[1]);
    return { items: [...(iKategori.get(id) ?? [])].map((p) => ({ catalogItemId: p })), pagingMetadata: {} };
  }
  const add = /^\/categories\/v1\/bulk\/categories\/([^/]+)\/add-items$/.exec(sokvag);
  if (add) {
    const id = decodeURIComponent(add[1]);
    const items = (kropp as Kropp).items as { catalogItemId: string }[];
    addAnrop.push({ kategori: id, pids: items.map((i) => i.catalogItemId) });
    return {
      results: items.map((it) => {
        if (svaraFel.has(it.catalogItemId)) {
          return { itemMetadata: { item: { catalogItemId: it.catalogItemId }, success: false, error: { code: "X", id: it.catalogItemId } } };
        }
        const redan = iKategori.get(id)?.has(it.catalogItemId);
        if (!redan) iKategori.set(id, new Set([...(iKategori.get(id) ?? []), it.catalogItemId]));
        return redan
          ? { itemMetadata: { item: { catalogItemId: it.catalogItemId }, success: false, error: { code: "ALREADY_EXISTS" } } }
          : { itemMetadata: { item: { catalogItemId: it.catalogItemId }, success: true } };
      }),
      bulkActionMetadata: { undetailedFailures: 0 },
    };
  }
  throw new Error(`oväntat anrop ${sokvag}`);
};

function deps(): KategoriDeps {
  return {
    wix,
    mappningar: async () => [...rader.values()],
    avlasningar: async (skus) => new Map(skus.filter((s) => avl.has(s)).map((s) => [s, avl.get(s)!])),
    lasMappningar: async (ids) => new Map(ids.filter((i) => rader.has(i)).map((i) => [i, structuredClone(rader.get(i)!)])),
    sparaMappningar: async (nya) => {
      for (const r of nya) rader.set(r.wixProductId, structuredClone(r));
      return { fel: [] };
    },
  };
}

const torr = { dryRun: true, bekrafta: null, budgetMs: 200_000 };

beforeEach(() => {
  rader = new Map();
  avl = new Map();
  iKategori = new Map();
  addAnrop = [];
  svaraFel = new Set();
  tradetAndrat = null;
});

describe("planen", () => {
  it("räknar bara opolerade, dolda utkast, och bara det som saknas", async () => {
    lagg(1, SVETS, "Svetsmaskin");
    lagg(2, SVETS, "Svetsmaskin");
    lagg(3, SVETS, "Svetsmaskin", { needsAiPolish: false });
    lagg(4, SVETS, "Svetsmaskin", { draftStatus: "published" } as Partial<ProductMappingRecord>);
    lagg(5, SVETS, "Svetsmaskin", { draftStatus: "rejected" } as Partial<ProductMappingRecord>);
    lagg(6, [{ id: "9", namn: "Okänd" }], "Något");
    rader.set(pid(7), rad(7)); // ingen avläsning
    // Produkt 2 ligger redan i båda.
    iKategori.set("avd-Verktyg & Maskiner", new Set([pid(2)]));
    iKategori.set("kat-Svetsning", new Set([pid(2)]));
    const s = await korKategorier(deps(), torr);
    expect(s).toMatchObject({ utkast: 4, attKoppla: 1, redanKopplade: 1, utanRegel: 1, avlasningSaknas: 1, tradFel: [] });
    expect(s.perKategori).toEqual({ "Verktyg & Maskiner/Svetsning": 1 });
    expect(s.idn).toEqual([pid(1)]);
    expect(addAnrop).toEqual([]);
  });

  it("☠️ ett regelmål som saknas i Wix syns i planen och stoppar en skarp körning innan något skrivs", async () => {
    lagg(1, SVETS, "Svetsmaskin");
    tradetAndrat = (t) => t.splice(t.findIndex((k) => k.name === "Svetsning"), 1);
    const s = await korKategorier(deps(), torr);
    expect(s.tradFel).toEqual(["underkategorin Svetsning finns 0 gånger"]);
    const skarp = await korKategorier(deps(), { ...torr, dryRun: false, bekrafta: 1 });
    expect(skarp.stoppadAv).toBe("trad");
    expect(skarp.kopplade).toBe(0);
    expect(addAnrop).toEqual([]);
  });
});

describe("skrivningen", () => {
  it("☠️ kräver bekrafta, och planen får inte vara större än det", async () => {
    lagg(1, SVETS, "Svetsmaskin");
    lagg(2, SVETS, "Svetsmaskin");
    await expect(korKategorier(deps(), { ...torr, dryRun: false })).rejects.toThrow(/bekrafta/);
    await expect(korKategorier(deps(), { ...torr, dryRun: false, bekrafta: 1 })).rejects.toThrow(/fler än bekrafta/);
    expect(addAnrop).toEqual([]);
  });

  it("kopplar bara det som saknas, och en omkörning har ingenting kvar", async () => {
    lagg(1, SVETS, "Svetsmaskin");
    lagg(2, SVETS, "Svetsmaskin");
    iKategori.set("avd-Verktyg & Maskiner", new Set([pid(2)]));
    const s = await korKategorier(deps(), { ...torr, dryRun: false, bekrafta: 2 });
    expect(s).toMatchObject({ kopplade: 2, fel: 0, stoppadAv: "klart" });
    // Avdelningen fick bara produkt 1, underkategorin båda.
    expect(addAnrop).toEqual([
      { kategori: "avd-Verktyg & Maskiner", pids: [pid(1)] },
      { kategori: "kat-Svetsning", pids: [pid(1), pid(2)] },
    ]);
    const igen = await korKategorier(deps(), torr);
    expect(igen).toMatchObject({ attKoppla: 0, redanKopplade: 2 });
  });

  it("☠️ vapenskåpet får ingen kategori, märks och läses tillbaka", async () => {
    lagg(1, KASSASKAP, "Vapenskåp för 10 gevär");
    lagg(2, KASSASKAP, "Kassaskåp 30 liter");
    const plan = await korKategorier(deps(), torr);
    expect(plan.vapenskap).toEqual({ totalt: 1, attMarka: 1, markta: 0, fel: 0, publicerade: 0, publiceradeIdn: [] });
    expect(plan.perKategori).toEqual({ "Hem & Inredning/Kassaskåp": 1 });
    const s = await korKategorier(deps(), { ...torr, dryRun: false, bekrafta: 1 });
    expect(s.vapenskap).toMatchObject({ markta: 1, fel: 0 });
    expect(rader.get(pid(1))!.vevorGranskning?.vapenskap).toBe(true);
    expect(addAnrop.flatMap((a) => a.pids)).not.toContain(pid(1));
    expect((await korKategorier(deps(), torr)).vapenskap.attMarka).toBe(0);
  });

  it("☠️ vapenskåp märks också på polerade och publicerade rader, och de publicerade räknas", async () => {
    lagg(1, KASSASKAP, "Vapenskåp för 10 gevär", { needsAiPolish: false });
    lagg(2, KASSASKAP, "Vapenskåp för 4 gevär", { needsAiPolish: false, draftStatus: "published" } as Partial<ProductMappingRecord>);
    const s = await korKategorier(deps(), { ...torr, dryRun: false, bekrafta: 0 });
    expect(s.vapenskap).toMatchObject({ totalt: 2, attMarka: 2, markta: 2, publicerade: 1, publiceradeIdn: [pid(2)] });
    expect(rader.get(pid(1))!.vevorGranskning?.vapenskap).toBe(true);
    expect(rader.get(pid(2))!.vevorGranskning?.vapenskap).toBe(true);
  });

  it("☠️ ett vapenskåp bland en familjs artiklar märker hela produkten", async () => {
    lagg(1, SVETS, "Svetsmaskin", { vevorArtiklar: [`vevor:${sku(1)}`, `vevor:${sku(9)}`] } as Partial<ProductMappingRecord>);
    avl.set(sku(9), testAvlasning({ sku: sku(9), kategorier: KASSASKAP, namn: "Vapenskåp för 2 gevär" }));
    const s = await korKategorier(deps(), { ...torr, dryRun: false, bekrafta: 0 });
    expect(s.vapenskap).toMatchObject({ totalt: 1, markta: 1 });
    expect(s.attKoppla).toBe(0);
    expect(addAnrop).toEqual([]);
  });

  it("☠️ vapenskåpen märks även när kategoriträdet saknar ett mål eller bekrafta inte stämmer", async () => {
    lagg(1, KASSASKAP, "Vapenskåp för 10 gevär");
    lagg(2, SVETS, "Svetsmaskin");
    tradetAndrat = (t) => t.splice(t.findIndex((k) => k.name === "Svetsning"), 1);
    const s = await korKategorier(deps(), { ...torr, dryRun: false, bekrafta: 0 });
    expect(s).toMatchObject({ stoppadAv: "trad", kopplade: 0 });
    expect(s.vapenskap.markta).toBe(1);
    rader.get(pid(1))!.vevorGranskning = undefined;
    tradetAndrat = null;
    await expect(korKategorier(deps(), { ...torr, dryRun: false, bekrafta: 0 })).rejects.toThrow(/fler än bekrafta/);
    expect(rader.get(pid(1))!.vevorGranskning?.vapenskap).toBe(true);
  });

  it("ett fel räknas, felexemplet bär inga id, och planen efteråt har kvar det som föll", async () => {
    lagg(1, SVETS, "Svetsmaskin");
    lagg(2, SVETS, "Svetsmaskin");
    svaraFel.add(pid(2));
    const s = await korKategorier(deps(), { ...torr, dryRun: false, bekrafta: 2 });
    expect(s).toMatchObject({ kopplade: 1, fel: 1, stoppadAv: "klart" });
    expect(s.felExempel[0]).not.toContain(pid(2));
    svaraFel.clear();
    expect((await korKategorier(deps(), torr)).attKoppla).toBe(1);
  });

  it("☠️ svaret bär inga artikelnummer eller produktnamn", async () => {
    lagg(1, SVETS, "Svetsmaskin Hemlig Modell");
    lagg(2, KASSASKAP, "Vapenskåp");
    const s = await korKategorier(deps(), { ...torr, dryRun: false, bekrafta: 1 });
    const text = JSON.stringify(s);
    expect(text).not.toContain(sku(1));
    expect(text).not.toContain(sku(2));
    expect(text).not.toContain("Hemlig");
  });
});
