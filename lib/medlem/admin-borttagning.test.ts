// Kontots borttagning i motorns admin (lib/medlem/admin.ts): allt som bär
// medlemmen går, orderliggaren står kvar. Klienten ersätts med ett lager i
// minnet.

import { beforeEach, describe, expect, it, vi } from "vitest";

const minne = vi.hoisted(() => {
  const data = new Map<string, Map<string, Record<string, unknown>>>();
  const kol = (k: string) => data.get(k) ?? data.set(k, new Map()).get(k)!;
  const matchar = (rad: Record<string, unknown>, filter: Record<string, unknown> = {}) =>
    Object.entries(filter).every(([f, v]) => rad[f] === v);
  const lager = {
    data,
    kol,
    felVidMassborttagning: false,
    async hamta(k: string, id: string) {
      const r = kol(k).get(id);
      return r ? { ...r } : null;
    },
    async allaRader(k: string, q: { filter?: Record<string, unknown> } = {}) {
      return [...kol(k).values()].filter((r) => matchar(r, q.filter)).map((r) => ({ ...r }));
    },
    async taBort(k: string, id: string) {
      return kol(k).delete(id) ? "borttagen" : "fanns-inte";
    },
    async taBortManga(k: string, idn: string[]) {
      if (lager.felVidMassborttagning && idn.length) return { borttagna: 0, fel: ["WDE0055"] };
      let n = 0;
      for (const id of idn) if (kol(k).delete(id)) n++;
      return { borttagna: n, fel: [] };
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

import { MEDLEM_KOL, medlemsId, taBortKonto } from "./admin";

const EPOST = "kund@exempel.se";
const ID = medlemsId(EPOST);
const ORSAK = { kod: "radering", text: "Mejl från kunden" } as const;

function fyll() {
  minne.kol(MEDLEM_KOL.medlemmar).set(ID, { _id: ID, epost: EPOST, niva: "Guld" });
  minne.kol(MEDLEM_KOL.profiler).set(`${ID}__privat`, { _id: `${ID}__privat`, medlemsId: ID });
  minne.kol(MEDLEM_KOL.nivaer).set(`${ID}__2026-11-01`, { _id: `${ID}__2026-11-01`, medlemsId: ID, till: "Guld" });
  minne.kol(MEDLEM_KOL.nivaer).set(`${ID}__2026-11-04`, { _id: `${ID}__2026-11-04`, medlemsId: ID, till: "Silver" });
  minne.kol(MEDLEM_KOL.nivaer).set("annan__2026-11-04", { _id: "annan__2026-11-04", medlemsId: "annan", till: "Brons" });
  minne.kol(MEDLEM_KOL.inloggningar).set("i1", { _id: "i1", epost: EPOST });
  minne.kol(MEDLEM_KOL.inloggningar).set("i2", { _id: "i2", epost: "annan@exempel.se" });
  minne.kol(MEDLEM_KOL.orderliggare).set("o1", { _id: "o1", epost: EPOST });
  minne.kol(MEDLEM_KOL.sparade).set("sk_0000000000000001", { _id: "sk_0000000000000001", medlemsId: ID, namn: "Kontoret" });
  minne.kol(MEDLEM_KOL.sparade).set("sk_0000000000000002", { _id: "sk_0000000000000002", medlemsId: "annan", namn: "Hemma" });
}

beforeEach(() => {
  minne.data.clear();
  minne.felVidMassborttagning = false;
});

describe("taBortKonto", () => {
  it("tar bort medlemmen, profilen, nivåbytena, inloggningarna och de sparade korgarna, men lämnar orderliggaren och andra medlemmar", async () => {
    fyll();
    expect(await taBortKonto(ID, ORSAK)).toBe("ok");
    expect(minne.kol(MEDLEM_KOL.medlemmar).size).toBe(0);
    expect(minne.kol(MEDLEM_KOL.profiler).size).toBe(0);
    expect([...minne.kol(MEDLEM_KOL.nivaer).keys()]).toEqual(["annan__2026-11-04"]);
    expect([...minne.kol(MEDLEM_KOL.inloggningar).keys()]).toEqual(["i2"]);
    expect(minne.kol(MEDLEM_KOL.orderliggare).size).toBe(1);
    expect([...minne.kol(MEDLEM_KOL.sparade).keys()]).toEqual(["sk_0000000000000002"]);
    const logg = [...minne.kol(MEDLEM_KOL.logg).values()];
    expect(logg).toHaveLength(1);
    expect(logg[0]).toMatchObject({ typ: "konto-borttaget", medlemsId: ID, efter: { nivabyten: 2, inloggningar: 1, sparadeKorgar: 1 } });
    expect(JSON.stringify(logg[0])).not.toContain(EPOST);
  });

  it("står kvar när nivåbytena inte går att ta bort, så att ett nytt försök hittar allt", async () => {
    fyll();
    minne.felVidMassborttagning = true;
    expect(await taBortKonto(ID, ORSAK)).toMatch(/Kontot står kvar/);
    expect(minne.kol(MEDLEM_KOL.medlemmar).has(ID)).toBe(true);
    expect(minne.kol(MEDLEM_KOL.profiler).size).toBe(1);
    expect(minne.kol(MEDLEM_KOL.logg).size).toBe(0);
  });

  it("svarar att medlemmen saknas utan att röra något", async () => {
    expect(await taBortKonto(ID, ORSAK)).toBe("Medlemmen finns inte.");
  });
});
