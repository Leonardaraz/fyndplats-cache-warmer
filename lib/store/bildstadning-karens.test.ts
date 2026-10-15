// Bildstädningens karenstid. SQL:en bevisas mot databasen i drift; här låses
// det som lätt går förlorat: en fil behåller sin FÖRSTA tid, varje fil får en
// tid eller så kastar lagret, och tabellen skapas innan den används.

import { beforeEach, describe, expect, it, vi } from "vitest";

const anrop: { text: string; varden: unknown[] }[] = [];
let svar: (text: string, varden: unknown[]) => unknown[] = () => [];
vi.mock("../db/client", () => ({
  sql: () => ({
    query: async (text: string, varden: unknown[] = []) => {
      anrop.push({ text, varden });
      return svar(text, varden);
    },
  }),
}));

import { KARENS_DYGN, KARENS_MS, nyttMinnesKarens, PostgresKarens } from "./bildstadning-karens";

beforeEach(() => {
  anrop.length = 0;
  svar = () => [];
});

describe("karenstiden", () => {
  it("är tre dygn", () => {
    expect(KARENS_DYGN).toBe(3);
    expect(KARENS_MS).toBe(3 * 86_400_000);
  });
});

describe("lagret i minnet", () => {
  it("en fil behåller den tid den FÖRST sågs oanvänd", async () => {
    const l = nyttMinnesKarens();
    expect([...await l.registrera(["a", "b"], 100)]).toEqual([["a", 100], ["b", 100]]);
    expect([...await l.registrera(["a", "c"], 200)]).toEqual([["a", 100], ["c", 200]]);
  });

  it("en glömd fil börjar om", async () => {
    const l = nyttMinnesKarens();
    await l.registrera(["a"], 100);
    await l.glom(["a"]);
    expect((await l.registrera(["a"], 300)).get("a")).toBe(300);
  });

  it("läser alla antecknade filer", async () => {
    const l = nyttMinnesKarens();
    await l.registrera(["a", "b"], 100);
    await l.glom(["a"]);
    expect(await l.lasAlla()).toEqual(["b"]);
  });
});

describe("lagret i Postgres", () => {
  it("skapar tabellen och skriver alla filer i EN sats, utan dubbletter", async () => {
    svar = (text, varden) => text.startsWith("insert")
      ? (varden[0] as string[]).map((id) => ({ fil_id: id, forst_ms: id === "a" ? "1000" : 2000 }))
      : [];
    const tider = await new PostgresKarens().registrera(["a", "b", "a"], 2000);
    expect(tider.get("a")).toBe(1000);
    expect(tider.get("b")).toBe(2000);
    const inserts = anrop.filter((a) => a.text.startsWith("insert"));
    expect(inserts).toHaveLength(1);
    expect(inserts[0].varden[0]).toEqual(["a", "b"]);
    expect(inserts[0].text).toMatch(/on conflict \(fil_id\) do update set senast_sedd/);
    expect(anrop.findIndex((a) => /create table if not exists bildstadning_karens/.test(a.text)))
      .toBeLessThan(anrop.findIndex((a) => a.text.startsWith("insert")));
  });

  it("☠️ en fil som inte fick någon tid fäller anropet", async () => {
    svar = (text) => text.startsWith("insert") ? [{ fil_id: "a", forst_ms: 1000 }] : [];
    await expect(new PostgresKarens().registrera(["a", "b"], 2000)).rejects.toThrow(/utan tid/);
  });

  it("glömmer i en sats, och gör ingenting med en tom lista", async () => {
    await new PostgresKarens().glom([]);
    await new PostgresKarens().registrera([], 1);
    expect(anrop.filter((a) => !/^create/.test(a.text))).toEqual([]);
    await new PostgresKarens().glom(["a", "a", "b"]);
    const del = anrop.filter((a) => a.text.startsWith("delete"));
    expect(del).toHaveLength(1);
    expect(del[0].varden[0]).toEqual(["a", "b"]);
  });
});
