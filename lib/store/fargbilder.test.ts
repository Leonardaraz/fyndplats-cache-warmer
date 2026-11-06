// Färgbildstabellen. Wix-lagret prövas i lib/db/wix-nya-lager.test.ts (en sida
// är ETT dokument); här låses lagret i minnet, som dev och testerna kör: det
// ersätter en sida eller ett val — aldrig mer.

import { describe, expect, it } from "vitest";
import { MinnesFargbildLager } from "./fargbilder";
import type { TabellRad } from "@/lib/aosom/fargbilder";

const rad = (over: Partial<TabellRad> = {}): TabellRad => ({
  wixProductId: "p1", choiceId: "v1", choiceName: "Grå", ordning: 0, filId: "f1", plats: "galleri", givareId: "g1", ...over,
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

  it("rader är obekräftade tills bekraftaWix, och en ersättning nollställer bekräftelsen", async () => {
    const l = new MinnesFargbildLager();
    await l.ersattForProdukt("p1", [rad(), rad({ choiceId: "v2", filId: "f2" })]);
    expect((await l.lasSkrivnaVal()).every((v) => !v.bekraftad)).toBe(true);
    await l.bekraftaWix("p1");
    expect((await l.lasSkrivnaVal()).every((v) => v.bekraftad)).toBe(true);
    await l.ersattForVal("p1", "v1", [rad({ filId: "f3" })]);
    const val = await l.lasSkrivnaVal();
    expect(val.find((v) => v.choiceId === "v1")!.bekraftad).toBe(false);
    expect(val.find((v) => v.choiceId === "v2")!.bekraftad).toBe(true);
  });

  it("vägrar en rad som hör till en annan produkt eller samma fil två gånger", async () => {
    const l = new MinnesFargbildLager();
    await expect(l.ersattForProdukt("p1", [rad({ wixProductId: "p2" })])).rejects.toThrow(/annan produkt/);
    await expect(l.ersattForProdukt("p1", [rad(), rad({ ordning: 1 })])).rejects.toThrow(/två gånger/);
    await expect(l.ersattForVal("p1", "v1", [rad({ choiceId: "v2" })])).rejects.toThrow(/annat val/);
  });
});
