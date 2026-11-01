import { describe, expect, it, vi } from "vitest";
import type { Anrop } from "@/lib/wix/kategoritrad";
import { TRADET } from "./kategorier";
import { MIN_SYNLIGA_PRODUKTER, NYA_FRAN, korKategorisynlighet } from "./kategorier-synlighet";

interface Nod {
  id: string;
  name: string;
  visible: boolean;
  parent: string | null;
  createdDate: string;
  revision: string;
}

const GAMMAL = "2026-09-01T00:00:00.000Z";
const NY = "2026-10-31T09:04:43.290Z";

/** Hela trädet efter natten: avdelningar och underkategorier synliga och gamla. */
function trad(): Map<string, Nod> {
  const ut = new Map<string, Nod>();
  for (const [avd, subs] of Object.entries(TRADET)) {
    const id = `avd:${avd}`;
    ut.set(id, { id, name: avd, visible: true, parent: null, createdDate: GAMMAL, revision: "1" });
    for (const s of subs) ut.set(`kat:${s}`, { id: `kat:${s}`, name: s, visible: true, parent: id, createdDate: GAMMAL, revision: "1" });
  }
  return ut;
}

function ny(t: Map<string, Nod>, id: string): void {
  const n = t.get(id)!;
  n.visible = false;
  n.createdDate = NY;
}

function fejkWix(t: Map<string, Nod>, antal: Record<string, number>, opts: { tappaSkrivning?: boolean } = {}) {
  const skrivna: string[] = [];
  const wix: Anrop = async (metod, sokvag, kropp) => {
    if (metod === "POST" && sokvag === "/categories/v1/categories/query") {
      return {
        categories: [...t.values()].map((n) => ({
          id: n.id,
          name: n.name,
          visible: n.visible,
          revision: n.revision,
          createdDate: n.createdDate,
          ...(n.parent ? { parentCategory: { id: n.parent } } : {}),
        })),
        pagingMetadata: { cursors: {} },
      };
    }
    if (metod === "POST" && sokvag === "/stores/v3/products/count") {
      const f = (kropp as { filter: { $and: Record<string, { $matchItems?: { id: { $eq: string } }[]; $eq?: boolean }>[] } }).filter;
      const id = f.$and[0]["allCategoriesInfo.categories"].$matchItems![0].id.$eq;
      expect(f.$and[1]).toEqual({ visible: { $eq: true } });
      return { count: antal[id] ?? 0 };
    }
    if (metod === "PATCH" && sokvag === "/categories/v1/categories/visibility") {
      const k = kropp as { categoryId: string; visible: boolean; revision: string };
      const n = t.get(k.categoryId)!;
      expect(k.visible).toBe(true);
      expect(k.revision).toBe(n.revision);
      if (n.parent && !t.get(n.parent)!.visible) {
        throw new Error("Wix 428: Category can't be visible if at least one of the parent categories is hidden");
      }
      skrivna.push(n.name);
      if (!opts.tappaSkrivning) n.visible = true;
      return { category: { id: n.id, visible: true } };
    }
    throw new Error(`oväntat anrop ${metod} ${sokvag}`);
  };
  return { wix, skrivna };
}

const ADV = "Företag & Proffs";
const SUB = TRADET[ADV][0];
const SUB2 = TRADET[ADV][1];

describe("nya kategorier blir synliga vid tio publicerade produkter", () => {
  it("gränsen är tio, och kategorierna från före VEVOR-trädet räknas som gamla", () => {
    expect(MIN_SYNLIGA_PRODUKTER).toBe(10);
    expect(Date.parse(NY)).toBeGreaterThanOrEqual(Date.parse(NYA_FRAN));
    expect(Date.parse(GAMMAL)).toBeLessThan(Date.parse(NYA_FRAN));
  });

  it("torrt säger vad som skulle visas och skriver ingenting", async () => {
    const t = trad();
    ny(t, "kat:Svetsning");
    const { wix, skrivna } = fejkWix(t, { "kat:Svetsning": 12 });
    const meddela = vi.fn();
    const s = await korKategorisynlighet({ wix, meddelaButiken: meddela }, { dryRun: true });
    expect(s.visade).toEqual([{ id: "kat:Svetsning", namn: "Svetsning", avdelning: "Verktyg & Maskiner", produkter: 12 }]);
    expect(skrivna).toEqual([]);
    expect(meddela).not.toHaveBeenCalled();
  });

  it("visar en ny kategori med tio, inte en med nio, läser tillbaka och säger till butiken", async () => {
    const t = trad();
    ny(t, "kat:Svetsning");
    ny(t, "kat:Hjälpmedel");
    const { wix, skrivna } = fejkWix(t, { "kat:Svetsning": 10, "kat:Hjälpmedel": 9 });
    const meddela = vi.fn().mockResolvedValue({ sokvagar: { "/sitemap.xml": 200 } });
    const s = await korKategorisynlighet({ wix, meddelaButiken: meddela }, { dryRun: false });
    expect(skrivna).toEqual(["Svetsning"]);
    expect(s.visade.map((v) => v.namn)).toEqual(["Svetsning"]);
    expect(s.underGransen).toEqual([{ namn: "Hjälpmedel", produkter: 9 }]);
    expect(t.get("kat:Hjälpmedel")!.visible).toBe(false);
    expect(meddela).toHaveBeenCalledTimes(1);
    expect(s.butiken).toEqual({ sokvagar: { "/sitemap.xml": 200 } });
    expect(s.fel).toEqual([]);
  });

  it("☠️ avdelningen visas före sin underkategori, och en underkategori under en dold avdelning väntar", async () => {
    const t = trad();
    ny(t, `avd:${ADV}`);
    for (const s of TRADET[ADV]) ny(t, `kat:${s}`);
    const { wix, skrivna } = fejkWix(t, { [`avd:${ADV}`]: 15, [`kat:${SUB}`]: 11, [`kat:${SUB2}`]: 4 });
    const s = await korKategorisynlighet({ wix }, { dryRun: false });
    expect(skrivna).toEqual([ADV, SUB]);
    expect(s.fel).toEqual([]);

    const t2 = trad();
    ny(t2, `avd:${ADV}`);
    ny(t2, `kat:${SUB}`);
    const w2 = fejkWix(t2, { [`avd:${ADV}`]: 8, [`kat:${SUB}`]: 11 });
    const s2 = await korKategorisynlighet({ wix: w2.wix }, { dryRun: false });
    expect(w2.skrivna).toEqual([]);
    expect(s2.vantarPaAvdelning).toEqual([SUB]);
    expect(s2.underGransen).toEqual([{ namn: ADV, produkter: 8 }]);
  });

  it("☠️ en gammal dold kategori och en dold kategori utanför reglerna rörs aldrig", async () => {
    const t = trad();
    const svets = t.get("kat:Svetsning")!;
    svets.visible = false; // dold, men skapad före VEVOR-trädet
    t.set("x:elektronik", { id: "x:elektronik", name: "Elektronik & Tillbehör", visible: false, parent: null, createdDate: NY, revision: "1" });
    const { wix, skrivna } = fejkWix(t, { "kat:Svetsning": 50, "x:elektronik": 71 });
    const s = await korKategorisynlighet({ wix }, { dryRun: false });
    expect(s.kandidater).toBe(0);
    expect(skrivna).toEqual([]);
  });

  it("☠️ ett trädfel stoppar körningen innan något räknas eller skrivs", async () => {
    const t = trad();
    ny(t, "kat:Svetsning");
    t.delete("kat:Pumpar");
    const { wix, skrivna } = fejkWix(t, { "kat:Svetsning": 30 });
    const s = await korKategorisynlighet({ wix }, { dryRun: false });
    expect(s.tradFel.length).toBeGreaterThan(0);
    expect(s.kandidater).toBe(0);
    expect(skrivna).toEqual([]);
  });

  it("☠️ en visning räknas först när kategorin läses tillbaka synlig", async () => {
    const t = trad();
    ny(t, "kat:Svetsning");
    const { wix } = fejkWix(t, { "kat:Svetsning": 30 }, { tappaSkrivning: true });
    const meddela = vi.fn();
    const s = await korKategorisynlighet({ wix, meddelaButiken: meddela }, { dryRun: false });
    expect(s.visade).toEqual([]);
    expect(s.fel).toEqual(["Svetsning: kategorin är fortfarande dold efter skrivningen"]);
    expect(meddela).not.toHaveBeenCalled();
  });

  it("en räkning som faller hoppar bara den kategorin, och felet bär inget id", async () => {
    const t = trad();
    ny(t, "kat:Svetsning");
    ny(t, "kat:Hjälpmedel");
    const { wix, skrivna } = fejkWix(t, { "kat:Hjälpmedel": 20 });
    const s = await korKategorisynlighet(
      {
        wix,
        raknaSynliga: async (id) => {
          if (id === "kat:Svetsning") throw new Error("Wix 500 för 0b8f1c2e-1111-2222-3333-444455556666");
          return 20;
        },
      },
      { dryRun: false },
    );
    expect(skrivna).toEqual(["Hjälpmedel"]);
    expect(s.fel).toHaveLength(1);
    expect(s.fel[0]).toContain("Svetsning");
    expect(s.fel[0]).not.toMatch(/0b8f1c2e/);
  });
});
