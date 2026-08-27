import { describe, it, expect, vi } from "vitest";
import { runImageRepair, type ImageRepairDeps } from "./image-repair";
import type { AosomRow } from "./feed";

const FX = { eurToSek: 11.1, usdToSek: 10.5 };
const NIO = Array.from({ length: 9 }, (_, i) => `https://img.aosomcdn.com/${i + 1}.jpg`);

function rad(sku: string, over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku,
    name: `Produkt ${sku}`,
    url: `https://www.aosom.de/item/x~${sku}.html`,
    imageUrls: NIO,
    category: "Haus & Wohnen",
    color: "", material: "", size: "", packageSize: "",
    weightKg: 5,
    descriptionHtml: "", bulletsHtml: "",
    qty: 50,
    normalPriceEur: 100,
    wholesaleEur: 40,
    seFreightEur: 20,
    rowIndex: 1,
    ...over,
  };
}

/** Deps med instrumentering: `skrivna` visar exakt vad som PATCHades. */
function deps(over: Partial<ImageRepairDeps> = {}) {
  const skrivna: { id: string; urls: string[] }[] = [];
  const uppladdade: string[][] = [];
  // A saknar allt, B har tre, C är hel. Tillståndet är föränderligt eftersom
  // reparationen LÄSER TILLBAKA efter varje skrivning — ett 200-svar räknas inte.
  const lager: Record<string, { revision: string; antal: number }> = {
    "wix-a": { revision: "1", antal: 0 },
    "wix-b": { revision: "2", antal: 3 },
    "wix-c": { revision: "3", antal: 5 },
  };
  const bas: ImageRepairDeps = {
    fetchFeed: async () => [rad("A-1"), rad("B-2"), rad("C-3")],
    listAosom: async () => [
      { sku: "A-1", wixProductId: "wix-a" },
      { sku: "B-2", wixProductId: "wix-b" },
      { sku: "C-3", wixProductId: "wix-c" },
    ],
    getMedia: async (id) => (lager[id] ? { ...lager[id] } : null),
    importImages: async (urls) => {
      uppladdade.push(urls);
      return urls.map((u) => u.replace("img.aosomcdn.com", "static.wixstatic.com"));
    },
    setMedia: async (id, _rev, urls) => {
      skrivna.push({ id, urls });
      if (lager[id]) lager[id] = { revision: String(Number(lager[id].revision) + 1), antal: urls.length };
    },
    fx: FX,
    ...over,
  };
  return { d: bas, skrivna, uppladdade, lager };
}

describe("runImageRepair", () => {
  it("torrkörning är default och skriver ingenting", async () => {
    const { d, skrivna } = deps();
    const s = await runImageRepair(d);
    expect(s.dryRun).toBe(true);
    expect(s.trasiga).toBe(2);      // A (0 bilder) och B (3)
    expect(s.reparerade).toBe(0);
    expect(skrivna).toHaveLength(0);
  });

  it("reparerar bara de som har färre bilder än feeden kan ge", async () => {
    const { d, skrivna } = deps();
    const s = await runImageRepair(d, { dryRun: false });
    expect(s.reparerade).toBe(2);
    expect(skrivna.map((x) => x.id).sort()).toEqual(["wix-a", "wix-b"]);
    // C rördes inte alls.
    expect(skrivna.find((x) => x.id === "wix-c")).toBeUndefined();
  });

  it("skriver de fem rena positionerna, i ordning", async () => {
    const { d, skrivna } = deps();
    await runImageRepair(d, { dryRun: false });
    const a = skrivna.find((x) => x.id === "wix-a")!;
    expect(a.urls).toEqual(
      [1, 2, 3, 8, 9].map((n) => `https://static.wixstatic.com/${n}.jpg`),
    );
  });

  it("gör ALDRIG en produkt sämre — en halvlyckad omgång skrivs inte", async () => {
    // B har tre bilder; uppladdningen ger bara två. Att skriva vore en försämring.
    const { d, skrivna } = deps({
      listAosom: async () => [{ sku: "B-2", wixProductId: "wix-b" }],
      importImages: async (urls) => urls.slice(0, 2).map((u) => `https://static.wixstatic.com/${u.slice(-5)}`),
    });
    const s = await runImageRepair(d, { dryRun: false });
    expect(skrivna).toHaveLength(0);
    expect(s.reparerade).toBe(0);
    expect(s.kvarstaendeMissar).toBe(3);
  });

  it("räknar kvarstående missar när skrivningen ändå är en förbättring", async () => {
    const { d, skrivna } = deps({
      listAosom: async () => [{ sku: "A-1", wixProductId: "wix-a" }],
      importImages: async (urls) => urls.slice(0, 4).map((u) => `https://static.wixstatic.com/${u.slice(-5)}`),
    });
    const s = await runImageRepair(d, { dryRun: false });
    expect(s.reparerade).toBe(1);
    expect(skrivna[0].urls).toHaveLength(4);
    expect(s.kvarstaendeMissar).toBe(1);
  });

  it("rad som försvunnit ur feeden lämnas orörd — inte tömd", async () => {
    const { d, skrivna } = deps({ fetchFeed: async () => [] });
    const s = await runImageRepair(d, { dryRun: false });
    expect(skrivna).toHaveLength(0);
    expect(s.trasiga).toBe(0);
  });

  it("ett fel på en produkt stoppar inte de andra", async () => {
    const bas = deps();
    const las = bas.d.getMedia;
    const d = {
      ...bas.d,
      getMedia: async (id: string) => {
        if (id === "wix-a") throw new Error("Wix svarade 500");
        return las(id);
      },
    };
    const s = await runImageRepair(d, { dryRun: false });
    expect(s.misslyckade).toBe(1);
    expect(s.errors[0].sku).toBe("A-1");
    expect(s.reparerade).toBeGreaterThan(0);
  });

  it("en skrivning som inte tar räknas som MISSLYCKAD, aldrig som lagad", async () => {
    // Bildfixen 2026-08-27: 524 lagade av 524 rapporterades, men 214 produkter
    // hade fortfarande för få bilder efteråt. setMedia svarade utan fel och
    // ändrade ändå ingenting. Ett svar utan fel får aldrig räknas som ett kvitto.
    const bas = deps();
    const d = { ...bas.d, setMedia: async () => { /* svarar OK, gör ingenting */ } };
    const s = await runImageRepair(d, { dryRun: false });
    expect(s.trasiga).toBe(2);
    expect(s.reparerade).toBe(0);
    expect(s.misslyckade).toBe(2);
    expect(s.errors.map((e) => e.sku).sort()).toEqual(["A-1", "B-2"]);
    expect(s.errors[0].error).toMatch(/skrivningen tog inte/);
  });

  it("markören går att fortsätta från, i artikelnummerordning", async () => {
    const { d } = deps();
    const forsta = await runImageRepair(d, { limit: 1 });
    expect(forsta.cursor).toBe("A-1");
    expect(forsta.stoppedBy).toBe("limit");

    const andra = await runImageRepair(d, { after: forsta.cursor!, limit: 1 });
    expect(andra.cursor).toBe("B-2");
  });

  it("stannar på tidsbudgeten och lämnar en markör", async () => {
    const { d } = deps();
    let t = 0;
    const s = await runImageRepair({ ...d, now: () => (t += 200_000) }, { timeBudgetMs: 250_000 });
    expect(s.stoppedBy).toBe("tidsbudget");
    expect(s.cursor).toBeTruthy();
  });

  it("går att köra riktat på ett artikelnummer", async () => {
    const { d, skrivna } = deps();
    const s = await runImageRepair(d, { dryRun: false, onlySkus: ["B-2"] });
    expect(s.granskade).toBe(1);
    expect(skrivna.map((x) => x.id)).toEqual(["wix-b"]);
  });

  it("cursor blir null när allt är genomgånget", async () => {
    const { d } = deps();
    const s = await runImageRepair(d, { dryRun: false });
    expect(s.cursor).toBeNull();
    expect(s.stoppedBy).toBe("klart");
  });
});
