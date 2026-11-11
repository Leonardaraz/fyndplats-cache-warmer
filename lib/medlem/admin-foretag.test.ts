// Företagen i motorns admin (lib/medlem/admin.ts, E3): beslutet med villkor
// och logg, sökningen på organisationsnummer och kontoborttagningen. Klienten
// ersätts med ett lager i minnet.

import { beforeEach, describe, expect, it, vi } from "vitest";

const minne = vi.hoisted(() => {
  const data = new Map<string, Map<string, Record<string, unknown>>>();
  const kol = (k: string) => data.get(k) ?? data.set(k, new Map()).get(k)!;
  const enkelt = (rad: Record<string, unknown>, filter: Record<string, unknown>): boolean =>
    Object.entries(filter).every(([f, v]) => (f === "$and" ? (v as Record<string, unknown>[]).every((d) => enkelt(rad, d)) : rad[f] === v));
  const lager = {
    data,
    kol,
    async hamta(k: string, id: string) {
      const r = kol(k).get(id);
      return r ? { ...r } : null;
    },
    async fraga(k: string, q: { filter?: Record<string, unknown>; limit?: number } = {}) {
      return [...kol(k).values()].filter((r) => enkelt(r, q.filter ?? {})).slice(0, q.limit ?? 50).map((r) => ({ ...r }));
    },
    async allaRader(k: string, q: { filter?: Record<string, unknown> } = {}) {
      return [...kol(k).values()].filter((r) => enkelt(r, q.filter ?? {})).map((r) => ({ ...r }));
    },
    async patcha(k: string, id: string, andringar: { fieldPath: string; setFieldOptions?: { value: unknown } }[], villkor?: Record<string, unknown>) {
      const r = kol(k).get(id);
      if (!r) return "not-found";
      if (villkor && !enkelt(r, villkor)) return "condition-failed";
      for (const a of andringar) r[a.fieldPath] = a.setFieldOptions?.value;
      return "applied";
    },
    async taBort(k: string, id: string) {
      return kol(k).delete(id) ? "borttagen" : "fanns-inte";
    },
    async taBortManga(k: string, idn: string[]) {
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

import { MEDLEM_KOL, beslutaForetag, foretagsko, foretagsprofilId, medlemsId, orgnrForSok, sokMedlem, taBortKonto } from "./admin";

const EPOST = "inkop@exempel.se";
const ID = medlemsId(EPOST);
const ORSAK = { kod: "bolagsverket", text: "Aktivt bolag, namnet stämmer" } as const;
const PNR = "811218-9876";

function fyll(form: "juridisk" | "enskild" = "juridisk", status = "granskas") {
  minne.data.clear();
  minne.kol(MEDLEM_KOL.medlemmar).set(ID, { _id: ID, epost: EPOST, status: "aktiv" });
  minne.kol(MEDLEM_KOL.profiler).set(`${ID}__privat`, { _id: `${ID}__privat`, medlemsId: ID, typ: "privat" });
  minne.kol(MEDLEM_KOL.profiler).set(foretagsprofilId(ID), {
    _id: foretagsprofilId(ID),
    medlemsId: ID,
    typ: "foretag",
    status,
    namn: "Bygg i Norr AB",
    orgnr: form === "enskild" ? PNR : "556012-5790",
    form,
    ansokt: "2026-11-04T20:00:00.000Z",
  });
}

const loggen = () => [...minne.kol(MEDLEM_KOL.logg).values()];

describe("företagen i admin (E3)", () => {
  beforeEach(() => fyll());

  it("E3-3: godkännandet sätter status och beslutstid, och loggar orsaken", async () => {
    expect(await beslutaForetag(ID, "aktiv", ORSAK)).toBe("ok");
    const p = minne.kol(MEDLEM_KOL.profiler).get(foretagsprofilId(ID))!;
    expect(p.status).toBe("aktiv");
    expect(typeof p.beslutad).toBe("string");
    const [h] = loggen();
    expect(h).toMatchObject({ omrade: "foretag", typ: "foretag-godkant", medlemsId: ID, orsakKod: "bolagsverket", aktor: "admin" });
  });

  it("☠️ loggen får aldrig numret, inte heller en enskild firmas personnummer", async () => {
    fyll("enskild");
    await beslutaForetag(ID, "nekad", ORSAK);
    expect(JSON.stringify(loggen())).not.toContain("811218");
    expect(JSON.stringify(loggen())).not.toContain("9876");
  });

  it("ett godkänt företag kan återkallas, och samma beslut två gånger ändrar inget", async () => {
    await beslutaForetag(ID, "aktiv", ORSAK);
    expect(await beslutaForetag(ID, "aktiv", ORSAK)).toBe("Företaget är redan godkänt.");
    expect(await beslutaForetag(ID, "nekad", { kod: "missbruk", text: "Privata köp på företagspris" })).toBe("ok");
    expect(loggen().map((h) => h.typ)).toEqual(["foretag-godkant", "foretag-aterkallat"]);
  });

  it("ett konto utan företag får ett tydligt svar", async () => {
    minne.kol(MEDLEM_KOL.profiler).delete(foretagsprofilId(ID));
    expect(await beslutaForetag(ID, "aktiv", ORSAK)).toBe("Kontot har inget företag.");
  });

  it("kön visar bara företag som granskas, med kontots e-post", async () => {
    const ko = await foretagsko();
    expect(ko).toHaveLength(1);
    expect(ko[0].epost).toBe(EPOST);
    await beslutaForetag(ID, "aktiv", ORSAK);
    expect(await foretagsko()).toHaveLength(0);
  });

  it("sökningen hittar kontot på organisationsnumret, med eller utan bindestreck", async () => {
    expect(orgnrForSok("5560125790")).toBe("556012-5790");
    expect(orgnrForSok("165560125790")).toBe("556012-5790");
    expect(orgnrForSok("10167")).toBeNull();
    const s = await sokMedlem("556012-5790");
    expect(s.epost).toBe(EPOST);
    expect(s.medlem?._id).toBe(ID);
  });

  it("kontoborttagningen tar också företagsprofilen", async () => {
    expect(await taBortKonto(ID, { kod: "radering", text: "Kundens begäran via mejl" })).toBe("ok");
    expect(minne.kol(MEDLEM_KOL.profiler).has(foretagsprofilId(ID))).toBe(false);
    expect(minne.kol(MEDLEM_KOL.profiler).has(`${ID}__privat`)).toBe(false);
  });
});
