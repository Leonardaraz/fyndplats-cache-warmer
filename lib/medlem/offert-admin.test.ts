// Offerterna i motorns admin (lib/medlem/offert-admin.ts, E3-10): golvet
// räknas om vid prissättningen, beslutet skrivs med villkor och loggas utan
// priser. Klienten, katalogen och auktionerna ersätts med lager i minnet.

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";

const minne = vi.hoisted(() => {
  const data = new Map<string, Map<string, Record<string, unknown>>>();
  const kol = (k: string) => data.get(k) ?? data.set(k, new Map()).get(k)!;
  const matchar = (rad: Record<string, unknown>, filter: Record<string, unknown> = {}) =>
    Object.entries(filter).every(([f, v]) => (v && typeof v === "object" && "$ne" in (v as object) ? rad[f] !== (v as { $ne: unknown }).$ne : rad[f] === v));
  return {
    data,
    kol,
    mappningar: new Map<string, unknown>(),
    async hamta(k: string, id: string) {
      const r = kol(k).get(id);
      return r ? structuredClone(r) : null;
    },
    async fraga(k: string, q: { filter?: Record<string, unknown>; limit?: number } = {}) {
      return [...kol(k).values()].filter((r) => matchar(r, q.filter)).slice(0, q.limit ?? 50).map((r) => structuredClone(r));
    },
    async patcha(k: string, id: string, andringar: { fieldPath: string; setFieldOptions?: { value: unknown } }[], villkor?: Record<string, unknown>) {
      const r = kol(k).get(id);
      if (!r) return "not-found";
      if (villkor && !matchar(r, villkor)) return "condition-failed";
      for (const a of andringar) r[a.fieldPath] = structuredClone(a.setFieldOptions?.value);
      return "applied";
    },
    async infoga(k: string, id: string, d: Record<string, unknown>) {
      kol(k).set(id, { ...d, _id: id });
      return "skapad";
    },
  };
});

vi.mock("@/lib/db/wix-data-klient", async () => {
  const faktisk = await vi.importActual<typeof import("@/lib/db/wix-data-klient")>("@/lib/db/wix-data-klient");
  return { ...faktisk, hamta: minne.hamta, fraga: minne.fraga, patcha: minne.patcha, infoga: minne.infoga };
});
vi.mock("@/lib/store/factory", () => ({
  getStore: () => ({
    async getMappingsByWixProductIds(idn: string[]) {
      return new Map(idn.filter((id) => minne.mappningar.has(id)).map((id) => [id, minne.mappningar.get(id)]));
    },
  }),
}));
vi.mock("@/lib/auction/store", () => ({ queryAuctions: async () => [] }));

import { MEDLEM_KOL } from "./admin";
import { OFFERT_KOL, avbojOffert, offertko, prissattOffert } from "./offert-admin";

const ORSAK = { kod: "kundtjanst", text: "Offert enligt förfrågan" } as const;

function mappning(id: string, kostnadKr: number): ProductMappingRecord {
  return {
    supplierProductId: `aosom:${id}`,
    supplier: "aosom",
    wixProductId: id,
    variants: [{ supplierVariantId: "v", sku: "s", wixVariantId: "w1", choices: {}, costUsd: 0, landedCostSek: kostnadKr, grossSek: 0 }],
  } as ProductMappingRecord;
}

beforeEach(() => {
  minne.data.clear();
  minne.mappningar.clear();
  // Kostnad 1 000 kr: golvet 1 375 kr inkl. moms.
  minne.mappningar.set("p1", mappning("p1", 1000));
  minne.kol(MEDLEM_KOL.medlemmar).set("m_1", { _id: "m_1", epost: "inkop@exempel.se" });
  minne.kol(OFFERT_KOL).set("o_0123456789ab", {
    _id: "o_0123456789ab",
    medlemsId: "m_1",
    foretagNamn: "Bygg i Norr AB",
    status: "skickad",
    skapad: "2026-11-04T10:00:00.000Z",
    rader: [
      { produktId: "p1", variantId: "w1", appId: "stores", namn: "Pallställ", antal: 12, aOre: 249_000 },
      { produktId: "okand", appId: "stores", namn: "Utan kostnad", antal: 1, aOre: 50_000 },
    ],
  });
});

describe("offerterna i admin", () => {
  it("kön visar förfrågan med listpris och golv per rad, och kontots e-post", async () => {
    const [o] = await offertko();
    expect(o.epost).toBe("inkop@exempel.se");
    expect(o.rader.map((r) => r.golvOre)).toEqual([137_500, null]);
  });

  it("E3-10: priserna sparas, offerten blir prissatt i 14 dygn, och loggen får inga priser", async () => {
    expect(await prissattOffert("o_0123456789ab", { pris_0: "2 290", pris_1: "500" }, ORSAK)).toBe("ok");
    const o = minne.kol(OFFERT_KOL).get("o_0123456789ab")!;
    expect(o.status).toBe("prissatt");
    expect((o.rader as { offertOre: number }[]).map((r) => r.offertOre)).toEqual([229_000, 50_000]);
    expect(Date.parse(String(o.giltigTill)) - Date.parse(String(o.prissatt))).toBe(14 * 86_400_000);
    const logg = [...minne.kol(MEDLEM_KOL.logg).values()];
    expect(logg).toHaveLength(1);
    expect(JSON.stringify(logg)).not.toMatch(/2290|229000|50000/);
  });

  it("P6: ett pris under golvet sparas aldrig, och offerten väntar kvar", async () => {
    expect(await prissattOffert("o_0123456789ab", { pris_0: "1374", pris_1: "500" }, ORSAK)).toBe("Pallställ: offertpriset är under golvet.");
    expect(minne.kol(OFFERT_KOL).get("o_0123456789ab")!.status).toBe("skickad");
  });

  it("en offert som redan prissatts eller avböjts ändras inte igen", async () => {
    expect(await avbojOffert("o_0123456789ab", ORSAK)).toBe("ok");
    expect(await prissattOffert("o_0123456789ab", { pris_0: "2290", pris_1: "500" }, ORSAK)).toBe("Offerten väntar inte på priser längre.");
    expect(minne.kol(OFFERT_KOL).get("o_0123456789ab")!.status).toBe("avbojd");
  });
});
