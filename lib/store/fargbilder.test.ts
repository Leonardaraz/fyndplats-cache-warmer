// Färgbildstabellen. SQL:en bevisas mot databasen i drift; här låses de
// regler som lätt går förlorade: en skrivning är EN sats (Neons HTTP-drivrutin
// har inga transaktioner), tabellen skapas innan den används, och lagret i
// minnet ersätter en sida eller ett val — aldrig mer.

import { beforeEach, describe, expect, it, vi } from "vitest";

const anrop: { text: string; varden: unknown[] }[] = [];
vi.mock("../db/client", () => ({
  sql: () => ({
    query: async (text: string, varden: unknown[] = []) => {
      anrop.push({ text, varden });
      return [];
    },
  }),
}));

import { MinnesFargbildLager, PostgresFargbildLager } from "./fargbilder";
import type { TabellRad } from "@/lib/aosom/fargbilder";

const rad = (over: Partial<TabellRad> = {}): TabellRad => ({
  wixProductId: "p1", choiceId: "v1", choiceName: "Grå", ordning: 0, filId: "f1", plats: "galleri", givareId: "g1", ...over,
});

beforeEach(() => {
  anrop.length = 0;
});

describe("MinnesFargbildLager", () => {
  it("ersätter bara sidans rader, och ett val bara sitt", async () => {
    const l = new MinnesFargbildLager();
    await l.ersattForProdukt("p1", [rad(), rad({ choiceId: "v2", choiceName: "Svart", filId: "f2" })]);
    await l.ersattForProdukt("p2", [rad({ wixProductId: "p2" })]);
    await l.ersattForVal("p1", "v1", [rad({ filId: "f3" })]);
    expect((await l.lasForProdukt("p1")).map((r) => r.filId)).toEqual(["f3", "f2"]);
    expect((await l.lasForProdukt("p2")).map((r) => r.filId)).toEqual(["f1"]);
    expect((await l.lasAllaFilIdn()).sort()).toEqual(["f1", "f2", "f3"]);
    expect(await l.lasSkrivnaVal()).toHaveLength(3);
  });

  it("vägrar en rad som hör till en annan produkt eller samma fil två gånger", async () => {
    const l = new MinnesFargbildLager();
    await expect(l.ersattForProdukt("p1", [rad({ wixProductId: "p2" })])).rejects.toThrow(/annan produkt/);
    await expect(l.ersattForProdukt("p1", [rad(), rad({ ordning: 1 })])).rejects.toThrow(/två gånger/);
    await expect(l.ersattForVal("p1", "v1", [rad({ choiceId: "v2" })])).rejects.toThrow(/annat val/);
  });
});

describe("PostgresFargbildLager", () => {
  it("skapar tabellen före första användningen", async () => {
    await new PostgresFargbildLager().lasForProdukt("p1");
    expect(anrop[0].text).toMatch(/create table if not exists fargbilder/);
    expect(anrop.at(-1)!.text).toMatch(/from fargbilder where wix_product_id = \$1/);
  });

  it("☠️ en skrivning är EN sats: borttagning och upsert i samma", async () => {
    const l = new PostgresFargbildLager();
    await l.lasForProdukt("p0");
    anrop.length = 0;
    await l.ersattForProdukt("p1", [rad(), rad({ filId: "f2", ordning: 1, plats: "overflow" })]);
    expect(anrop).toHaveLength(1);
    expect(anrop[0].text).toMatch(/delete from fargbilder/);
    expect(anrop[0].text).toMatch(/on conflict \(wix_product_id, choice_id, fil_id\) do update/);
    expect(JSON.parse(anrop[0].varden[0] as string)).toHaveLength(2);
    expect(anrop[0].varden[1]).toBe("p1");
  });

  it("ett val ersätts bara inom valet", async () => {
    const l = new PostgresFargbildLager();
    await l.lasForProdukt("p0");
    anrop.length = 0;
    await l.ersattForVal("p1", "v1", [rad()]);
    expect(anrop).toHaveLength(1);
    expect(anrop[0].text).toMatch(/t\.choice_id = \$3/);
    expect(anrop[0].varden.slice(1)).toEqual(["p1", "v1"]);
  });
});
