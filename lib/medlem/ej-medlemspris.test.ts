// Flaggan "ej medlemspris" (lib/medlem/ej-medlemspris.ts): bara fältet ändras,
// en saknad rad skapas aldrig, och loggen skrivs först när återläsningen visar
// ändringen. Wix ersätts med ett lager i minnet.

import { beforeEach, describe, expect, it, vi } from "vitest";

const minne = vi.hoisted(() => {
  const data = new Map<string, Map<string, Record<string, unknown>>>();
  const kol = (k: string) => data.get(k) ?? data.set(k, new Map()).get(k)!;
  const matchar = (rad: Record<string, unknown>, filter: Record<string, unknown> = {}) =>
    Object.entries(filter).every(([f, v]) => rad[f] === v);
  const lager = {
    data,
    kol,
    /** true: patchen svarar "applied" men ändrar ingenting (ett svar utan fel som inte är ett kvitto). */
    tystPatch: false,
    async hamta(k: string, id: string) {
      const r = kol(k).get(id);
      return r ? { ...r } : null;
    },
    async allaRader(k: string, q: { filter?: Record<string, unknown> } = {}) {
      return [...kol(k).values()].filter((r) => matchar(r, q.filter)).map((r) => ({ ...r }));
    },
    async patcha(k: string, id: string, andringar: { action: string; fieldPath: string; setFieldOptions?: { value: unknown } }[]) {
      const r = kol(k).get(id);
      if (!r) return "not-found";
      if (lager.tystPatch) return "applied";
      for (const a of andringar) {
        if (a.action === "SET_FIELD") r[a.fieldPath] = a.setFieldOptions?.value;
        else delete r[a.fieldPath];
      }
      return "applied";
    },
    async infoga(k: string, id: string, d: Record<string, unknown>) {
      kol(k).set(id, { ...d, _id: id });
      return "skapad";
    },
  };
  return lager;
});

vi.mock("@/lib/db/wix-data-klient", async () => {
  const faktisk = await vi.importActual<typeof import("@/lib/db/wix-data-klient")>("@/lib/db/wix-data-klient");
  return { ...faktisk, ...minne };
});

let backend = "wix-data";
vi.mock("@/lib/store/backend", () => ({ storeBackend: () => backend }));

import { MEDLEM_KOL } from "./admin";
import { lasProduktId, sattEjMedlemspris, varorUtanMedlemspris } from "./ej-medlemspris";
import { MAPPNINGAR_KOL } from "@/lib/store/wix-data";

const P1 = "11111111-1111-4111-8111-111111111111";
const P2 = "22222222-2222-4222-8222-222222222222";
const P3 = "33333333-3333-4333-8333-333333333333";
const ORSAK = { kod: "prissattning", text: "Tunn marginal på den här" } as const;

function fyll() {
  minne.kol(MAPPNINGAR_KOL).set(P1, { _id: P1, wixProductId: P1, supplier: "aosom", seoTitle: "Skohylla", aosomSyncedQty: 7, variants: [] });
  minne.kol(MAPPNINGAR_KOL).set(P2, { _id: P2, wixProductId: P2, supplier: "vevor", ejMedlemspris: true, variants: [] });
}

beforeEach(() => {
  minne.data.clear();
  minne.tystPatch = false;
  backend = "wix-data";
});

describe("lasProduktId", () => {
  it("tar id:t ur det admin klistrar in, och bara när det är ett enda", () => {
    expect(lasProduktId(P1)).toBe(P1);
    expect(lasProduktId(`  ${P1.toUpperCase()} `)).toBe(P1);
    expect(lasProduktId(`https://manage.wix.com/dashboard/x/store/products/product/${P1}?ref=1`)).toBe(P1);
    expect(lasProduktId(`${P1} ${P1}`)).toBe(P1);
    expect(lasProduktId(`${P1} ${P2}`)).toBeNull();
    expect(lasProduktId("skohylla-i-trä")).toBeNull();
    expect(lasProduktId(undefined)).toBeNull();
  });
});

describe("sattEjMedlemspris", () => {
  it("sätter bara flaggan, läser tillbaka och loggar med orsak", async () => {
    fyll();
    expect(await sattEjMedlemspris(P1, true, ORSAK)).toBe("ok");
    const rad = minne.kol(MAPPNINGAR_KOL).get(P1)!;
    expect(rad.ejMedlemspris).toBe(true);
    // Synkens fält står kvar: raden skrevs inte om.
    expect(rad.aosomSyncedQty).toBe(7);
    const logg = [...minne.kol(MEDLEM_KOL.logg).values()];
    expect(logg).toHaveLength(1);
    expect(logg[0]).toMatchObject({ typ: "ej-medlemspris", produktId: P1, fore: { ejMedlemspris: false }, efter: { ejMedlemspris: true }, orsakKod: "prissattning" });
  });

  it("tar bort fältet när flaggan tas bort", async () => {
    fyll();
    expect(await sattEjMedlemspris(P2, false, ORSAK)).toBe("ok");
    expect("ejMedlemspris" in minne.kol(MAPPNINGAR_KOL).get(P2)!).toBe(false);
    expect([...minne.kol(MEDLEM_KOL.logg).values()][0]).toMatchObject({ typ: "medlemspris-igen", efter: { ejMedlemspris: false } });
  });

  it("skriver och loggar ingenting när flaggan redan står så", async () => {
    fyll();
    expect(await sattEjMedlemspris(P2, true, ORSAK)).toBe("Produkten har redan flaggan.");
    expect(await sattEjMedlemspris(P1, false, ORSAK)).toBe("Produkten har inte flaggan.");
    expect(minne.kol(MEDLEM_KOL.logg).size).toBe(0);
  });

  it("skapar aldrig en rad för en produkt utan mappning", async () => {
    fyll();
    expect(await sattEjMedlemspris(P3, true, ORSAK)).toMatch(/ingen mappning/);
    expect(minne.kol(MAPPNINGAR_KOL).has(P3)).toBe(false);
    expect(minne.kol(MEDLEM_KOL.logg).size).toBe(0);
  });

  it("ett svar utan fel är inget kvitto: utan ändringen vid återläsningen blir det ingen logg", async () => {
    fyll();
    minne.tystPatch = true;
    expect(await sattEjMedlemspris(P1, true, ORSAK)).toMatch(/återläsning/);
    expect(minne.kol(MEDLEM_KOL.logg).size).toBe(0);
  });

  it("rör ingenting när mappningarna inte bor i Wix", async () => {
    fyll();
    backend = "memory";
    expect(await sattEjMedlemspris(P1, true, ORSAK)).toMatch(/bor inte i Wix/);
    expect(minne.kol(MAPPNINGAR_KOL).get(P1)!.ejMedlemspris).toBeUndefined();
  });
});

describe("varorUtanMedlemspris", () => {
  it("listar bara de flaggade, med namn när sidan är polerad", async () => {
    fyll();
    minne.kol(MAPPNINGAR_KOL).set(P3, { _id: P3, wixProductId: P3, supplier: "aosom", seoTitle: "Bokhylla", ejMedlemspris: true, variants: [] });
    expect(await varorUtanMedlemspris()).toEqual([
      { wixProductId: P3, namn: "Bokhylla", leverantor: "aosom" },
      { wixProductId: P2, namn: "", leverantor: "vevor" },
    ]);
  });
});
