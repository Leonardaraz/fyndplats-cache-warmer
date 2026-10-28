// De fyra lagren som bara fanns i Postgres fram till 2026-10-29 och nu har en
// Wix-version: färgbilderna, bildstädningens karenstid, Aosom-synkens markör
// och fakturaloggen. Klienten ersätts med ett lager i minnet som lyder samma
// regler som Wix (insert vägrar ett id som finns, villkor på borttagning).

import { beforeEach, describe, expect, it, vi } from "vitest";

const minne = vi.hoisted(() => {
  const data = new Map<string, Map<string, Record<string, unknown>>>();
  const kol = (k: string) => data.get(k) ?? data.set(k, new Map()).get(k)!;
  const matchar = (rad: Record<string, unknown>, filter: Record<string, unknown> = {}) =>
    Object.entries(filter).every(([f, v]) => {
      if (v && typeof v === "object" && "$in" in (v as object)) return ((v as { $in: unknown[] }).$in).includes(rad[f]);
      if (v && typeof v === "object" && "$exists" in (v as object)) return (rad[f] !== undefined) === (v as { $exists: boolean }).$exists;
      return rad[f] === v;
    });
  return {
    data,
    kol,
    async hamta(k: string, id: string) {
      const r = kol(k).get(id);
      if (!r) return null;
      const { anspraksToken: _t, ...utan } = r;
      return { ...utan };
    },
    async spara(k: string, id: string, d: Record<string, unknown>) {
      kol(k).set(id, { ...d, _id: id });
    },
    async sparaManga(k: string, rader: { id: string; data: Record<string, unknown> }[]) {
      for (const r of rader) kol(k).set(r.id, { ...r.data, _id: r.id });
      return { sparade: rader.length, fel: [] };
    },
    async allaRader(k: string, q: { filter?: Record<string, unknown> } = {}) {
      return [...kol(k).values()].filter((r) => matchar(r, q.filter)).map((r) => ({ ...r }));
    },
    async taBort(k: string, id: string, villkor?: Record<string, unknown>) {
      const r = kol(k).get(id);
      if (!r) return "fanns-inte";
      if (villkor && !matchar(r, villkor)) return "villkor";
      kol(k).delete(id);
      return "borttagen";
    },
    async taBortManga(k: string, idn: string[]) {
      let n = 0;
      for (const id of idn) if (kol(k).delete(id)) n++;
      return { borttagna: n, fel: [] };
    },
    async infoga(k: string, id: string, d: Record<string, unknown>) {
      if (kol(k).has(id)) return "fanns";
      kol(k).set(id, { ...d, _id: id, anspraksToken: "t" });
      return "skapad";
    },
    async patcha(k: string, id: string, andringar: { action: string; fieldPath: string; setFieldOptions?: { value: unknown } }[]) {
      const r = kol(k).get(id);
      if (!r) return "not-found";
      for (const a of andringar) {
        if (a.action === "SET_FIELD") r[a.fieldPath] = a.setFieldOptions?.value;
        else delete r[a.fieldPath];
      }
      return "applied";
    },
  };
});

vi.mock("@/lib/db/wix-data-klient", async () => {
  const faktisk = await vi.importActual<typeof import("./wix-data-klient")>("./wix-data-klient");
  return { ...faktisk, ...minne };
});

import { WixFargbildLager } from "@/lib/store/fargbilder";
import { WixKarens } from "@/lib/store/bildstadning-karens";
import { WixSyncMarkorLager } from "@/lib/aosom/sync-markor";
import { wixUtskickslogg } from "@/lib/orders/faktura-logg";
import type { TabellRad } from "@/lib/aosom/fargbilder";
import { NYA } from "./wix-kollektioner";

beforeEach(() => minne.data.clear());

const rad = (p: Partial<TabellRad>): TabellRad => ({
  wixProductId: "P",
  choiceId: "c1",
  choiceName: "Grå",
  ordning: 0,
  filId: "f1",
  plats: "galleri",
  givareId: null,
  ...p,
});

describe("WixFargbildLager", () => {
  it("☠️ en sida är ETT dokument: ersättningen är en enda skrivning", async () => {
    const l = new WixFargbildLager();
    await l.ersattForProdukt("P", [rad({ filId: "f2", ordning: 1 }), rad({ filId: "f1" }), rad({ choiceId: "c2", filId: "f3" })]);
    expect(minne.kol(NYA.fargbilder).size).toBe(1);
    expect((await l.lasForProdukt("P")).map((r) => `${r.choiceId}/${r.filId}`)).toEqual(["c1/f1", "c1/f2", "c2/f3"]);
  });

  it("ersattForVal rör bara valets rader, och en ersättning är obekräftad", async () => {
    const l = new WixFargbildLager();
    await l.ersattForProdukt("P", [rad({ filId: "f1" }), rad({ choiceId: "c2", filId: "f3" })]);
    await l.bekraftaWix("P");
    expect((await l.lasSkrivnaVal()).every((v) => v.bekraftad)).toBe(true);

    await l.ersattForVal("P", "c2", [rad({ choiceId: "c2", filId: "f9" })]);
    const val = await l.lasSkrivnaVal();
    expect(val.find((v) => v.choiceId === "c1")?.bekraftad).toBe(true);
    expect(val.find((v) => v.choiceId === "c2")?.bekraftad).toBe(false);
    expect((await l.lasAllaFilIdn()).sort()).toEqual(["f1", "f9"]);
  });

  it("en sida utan rader tas bort i stället för att ligga kvar tom", async () => {
    const l = new WixFargbildLager();
    await l.ersattForProdukt("P", [rad({})]);
    await l.ersattForProdukt("P", []);
    expect(minne.kol(NYA.fargbilder).size).toBe(0);
    expect(await l.lasForProdukt("P")).toEqual([]);
  });

  it("vägrar samma fil två gånger på samma val, som Postgres-vägen", async () => {
    await expect(new WixFargbildLager().ersattForProdukt("P", [rad({}), rad({})])).rejects.toThrow(/samma fil två gånger/);
  });
});

describe("WixKarens", () => {
  it("☠️ en fil som redan står där behåller sin första tid", async () => {
    const k = new WixKarens();
    const forst = await k.registrera(["a"], Date.parse("2026-10-20T00:00:00Z"));
    const sen = await k.registrera(["a", "b"], Date.parse("2026-10-25T00:00:00Z"));
    expect(forst.get("a")).toBe(Date.parse("2026-10-20T00:00:00Z"));
    expect(sen.get("a")).toBe(Date.parse("2026-10-20T00:00:00Z"));
    expect(sen.get("b")).toBe(Date.parse("2026-10-25T00:00:00Z"));
    expect((await k.lasAlla()).sort()).toEqual(["a", "b"]);
    await k.glom(["a"]);
    expect(await k.lasAlla()).toEqual(["b"]);
  });
});

describe("WixSyncMarkorLager", () => {
  it("sparar och läser per rotation", async () => {
    const m = new WixSyncMarkorLager();
    expect(await m.las("lager")).toBeNull();
    await m.spara("lager", "x");
    await m.spara("pris", null);
    expect(await m.las("lager")).toBe("x");
    expect(await m.las("pris")).toBeNull();
  });
});

describe("wixUtskickslogg", () => {
  it("☠️ raden tas före utskicket: bara den första tar den", async () => {
    expect(await wixUtskickslogg.ta("o1", "faktura", "10079")).toBe(true);
    expect(await wixUtskickslogg.ta("o1", "faktura", "10079")).toBe(false);
    expect(await wixUtskickslogg.finns("o1", "faktura")).toBe(true);
    expect(await wixUtskickslogg.skickad("o1", "faktura")).toBeNull();
  });

  it("en skickad rad släpps aldrig, en oskickad gör det", async () => {
    await wixUtskickslogg.ta("o1", "faktura", "10079");
    await wixUtskickslogg.bekrafta("o1", "faktura", "re_1");
    await wixUtskickslogg.slapp("o1", "faktura");
    expect(await wixUtskickslogg.skickad("o1", "faktura")).toBeInstanceOf(Date);

    await wixUtskickslogg.ta("o2", "kvitto", "10080");
    await wixUtskickslogg.slapp("o2", "kvitto");
    expect(await wixUtskickslogg.finns("o2", "kvitto")).toBe(false);
  });
});
