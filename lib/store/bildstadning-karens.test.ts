// Bildstädningens karenstid. Wix-lagret prövas i lib/db/wix-nya-lager.test.ts;
// här låses minneslagret, som dev och testerna kör: en fil behåller sin FÖRSTA
// tid, och en glömd fil börjar om.

import { describe, expect, it } from "vitest";
import { KARENS_DYGN, KARENS_MS, nyttMinnesKarens } from "./bildstadning-karens";

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
