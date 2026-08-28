import { describe, it, expect, vi } from "vitest";
import { runImageRepair, planeraBilder, type ImageRepairDeps } from "./image-repair";
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

/** De fem rena positionerna ur NIO, i den ordning reparationen vill ha dem. */
const ONSKADE = [1, 2, 3, 8, 9].map((n) => `https://img.aosomcdn.com/${n}.jpg`);

/** En bild som sitter på produkten, med sitt Wix-fil-id. */
function bild(n: number) {
  return { id: `fil-${n}`, url: `https://static.wixstatic.com/${n}.jpg` };
}

/** Deps med instrumentering: `skrivna` visar exakt vad som PATCHades. */
function deps(over: Partial<ImageRepairDeps> = {}) {
  const skrivna: { id: string; urls: string[]; ids: (string | undefined)[] }[] = [];
  const uppladdade: string[][] = [];
  const sparade: { sku: string; filer: { kalla: string; fileId: string }[] }[] = [];

  // A saknar allt, B har tre, C är hel. Tillståndet är föränderligt eftersom
  // reparationen LÄSER TILLBAKA efter varje skrivning — ett 200-svar räknas inte.
  const lager: Record<string, { revision: string; media: { id?: string; url: string }[] }> = {
    "wix-a": { revision: "1", media: [] },
    "wix-b": { revision: "2", media: [bild(1), bild(2), bild(3)] },
    "wix-c": { revision: "3", media: [bild(1), bild(2), bild(3), bild(8), bild(9)] },
  };
  // B:s tre bilder är kända: de kommer från position 1, 2 och 3.
  const kanda: Record<string, { kalla: string; fileId: string }[]> = {
    "B-2": [1, 2, 3].map((n) => ({ kalla: `https://img.aosomcdn.com/${n}.jpg`, fileId: `fil-${n}` })),
  };

  const bas: ImageRepairDeps = {
    fetchFeed: async () => [rad("A-1"), rad("B-2"), rad("C-3")],
    listAosom: async () => [
      { sku: "A-1", wixProductId: "wix-a" },
      { sku: "B-2", wixProductId: "wix-b" },
      { sku: "C-3", wixProductId: "wix-c" },
    ],
    getMedia: async (id) =>
      lager[id] ? { revision: lager[id].revision, media: [...lager[id].media] } : null,
    kandaBildFiler: async (sku) => kanda[sku] ?? [],
    hamtaKallor: async () => new Map(),
    sparaBildFiler: async (sku, filer) => { sparade.push({ sku, filer }); },
    importImages: async (urls) => {
      uppladdade.push(urls);
      // Uppladdningen bär id, adress OCH källbilden. Utan `kalla` går det inte
      // att veta vilken av fem bilder posten svarar mot när en miss glesar ut
      // listan — och då kan bara alla fem laddas om.
      return urls.map((u) => {
        const n = u.split("/").pop()!.replace(".jpg", "");
        return { id: `fil-${n}`, url: `https://static.wixstatic.com/${n}.jpg`, kalla: u };
      });
    },
    setMedia: async (id, _rev, bilder) => {
      skrivna.push({ id, urls: bilder.map((b) => b.url), ids: bilder.map((b) => b.id) });
      if (lager[id]) {
        lager[id] = {
          revision: String(Number(lager[id].revision) + 1),
          media: bilder.map((b) => ({ id: b.id, url: b.url })),
        };
      }
    },
    fx: FX,
    ...over,
  };
  return { d: bas, skrivna, uppladdade, sparade, lager, kanda };
}

describe("planeraBilder", () => {
  const O = [1, 2, 3, 8, 9].map((n) => `k${n}`);
  const b = (n: number) => ({ id: `f${n}`, url: `u${n}` });
  const kanda = (ns: number[]) => new Map(ns.map((n) => [`f${n}`, `k${n}`]));

  it("behåller det som sitter och pekar ut bara luckorna", () => {
    const p = planeraBilder(O, [b(1), b(2), b(3)], kanda([1, 2, 3]));
    expect(p.behall.map((x) => x.fileId)).toEqual(["f1", "f2", "f3"]);
    expect(p.saknas).toEqual(["k8", "k9"]);
    expect(p.oidentifierade).toBe(0);
  });

  it("lägger tillbaka bilderna i ÖNSKAD ordning, inte i produktens", () => {
    // Wix visar första bilden som huvudbild, så ordningen är inte kosmetisk.
    const p = planeraBilder(O, [b(9), b(1)], kanda([1, 9]));
    expect(p.behall.map((x) => x.kalla)).toEqual(["k1", "k9"]);
  });

  it("☠️ en bild utan känd källa räknas som oidentifierad — aldrig som en lucka", () => {
    // Räknades den som en lucka hade källbilden laddats upp igen och produkten
    // fått samma bild två gånger.
    const p = planeraBilder(O, [b(1), b(2), b(7)], kanda([1, 2]));
    expect(p.oidentifierade).toBe(1);
    expect(p.saknas).toEqual(["k3", "k8", "k9"]);
  });

  it("en bild utan id går inte att placera", () => {
    const p = planeraBilder(O, [{ url: "u1" }], new Map());
    expect(p.oidentifierade).toBe(1);
    expect(p.behall).toHaveLength(0);
  });

  it("samma källbild två gånger behålls en gång — dubbletten faller bort", () => {
    const p = planeraBilder(O, [b(1), { id: "f1b", url: "u1b" }], new Map([["f1", "k1"], ["f1b", "k1"]]));
    expect(p.behall).toHaveLength(1);
    expect(p.behall[0].fileId).toBe("f1");
  });

  it("☠️ luckan mitt i listan fylls på RÄTT plats, inte sist", () => {
    // Wix visar första objektet som huvudbild. Position 1 är den vita
    // produktbilden, 2 är livsstilsbilden. En produkt som har 2 och 3 men
    // saknar 1 måste få tillbaka 1 FÖRST.
    const p = planeraBilder(O, [b(2), b(3)], kanda([2, 3]));
    expect(p.saknas).toEqual(["k1", "k8", "k9"]);
    expect(p.behall.map((x) => x.kalla)).toEqual(["k2", "k3"]);
  });

  it("en hel produkt har inga luckor", () => {
    const p = planeraBilder(O, [1, 2, 3, 8, 9].map(b), kanda([1, 2, 3, 8, 9]));
    expect(p.saknas).toEqual([]);
    expect(p.behall).toHaveLength(5);
  });
});

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
    // B har tre bilder och saknar två. Går båda uppladdningarna i putten blir
    // den nya listan lika lång som den gamla, och då skrivs ingenting.
    const { d, skrivna } = deps({
      listAosom: async () => [{ sku: "B-2", wixProductId: "wix-b" }],
      importImages: async () => [],
    });
    const s = await runImageRepair(d, { dryRun: false });
    expect(skrivna).toHaveLength(0);
    expect(s.reparerade).toBe(0);
  });

  it("☠️ laddar om BARA det som saknas — de tre som sitter behålls vid sitt id", async () => {
    // Hela poängen. Förut laddades alla fem om och medialistan ersattes, vilket
    // lämnade tre föräldralösa filer per lagad produkt. Fyra körningar mot en
    // växande katalog tog slut på Wix-lagringen (2026-08-28).
    const { d, skrivna, uppladdade } = deps({
      listAosom: async () => [{ sku: "B-2", wixProductId: "wix-b" }],
    });
    const s = await runImageRepair(d, { dryRun: false });

    // Bara position 8 och 9 hämtas — inte 1, 2 och 3.
    expect(uppladdade).toEqual([[ONSKADE[3], ONSKADE[4] ]]);
    // De tre befintliga sitter kvar VID SITT ID, i önskad ordning.
    expect(skrivna[0].ids).toEqual(["fil-1", "fil-2", "fil-3", "fil-8", "fil-9"]);
    expect(s.atervandaBilder).toBe(3);
    expect(s.fullOmladdning).toBe(0);
  });

  it("☠️ skriver listan i ÖNSKAD ordning även när luckan sitter först", async () => {
    // Wix huvudbild är första objektet. "Behållna först, nya sist" hade gett
    // livsstilsbilden som huvudbild på varje produkt som saknade position 1.
    const { d, skrivna } = deps({
      listAosom: async () => [{ sku: "B-2", wixProductId: "wix-b" }],
      getMedia: async () => ({
        revision: "1",
        media: [{ id: "fil-2", url: "u2" }, { id: "fil-3", url: "u3" }],
      }),
      kandaBildFiler: async () =>
        [2, 3].map((n) => ({ kalla: `https://img.aosomcdn.com/${n}.jpg`, fileId: `fil-${n}` })),
    });
    await runImageRepair(d, { dryRun: false });
    expect(skrivna[0].ids).toEqual(["fil-1", "fil-2", "fil-3", "fil-8", "fil-9"]);
  });

  it("sparar kopplingen efteråt — och först efter en verifierad skrivning", async () => {
    const { d, sparade } = deps({
      listAosom: async () => [{ sku: "B-2", wixProductId: "wix-b" }],
    });
    await runImageRepair(d, { dryRun: false });
    expect(sparade).toHaveLength(1);
    expect(sparade[0].sku).toBe("B-2");
    expect(sparade[0].filer).toEqual(
      [1, 2, 3, 8, 9].map((n) => ({
        kalla: `https://img.aosomcdn.com/${n}.jpg`,
        fileId: `fil-${n}`,
      })),
    );
  });

  it("kopplingen sparas ALDRIG när skrivningen inte tog", async () => {
    // Sparad ändå hade den pekat på filer som inte sitter på produkten, och
    // nästa körning trott att bilder finns som inte gör det.
    const { d, sparade } = deps({
      listAosom: async () => [{ sku: "B-2", wixProductId: "wix-b" }],
      setMedia: async () => { /* svarar OK, gör ingenting */ },
    });
    const s = await runImageRepair(d, { dryRun: false });
    expect(s.misslyckade).toBe(1);
    expect(sparade).toHaveLength(0);
  });

  it("härleder kopplingen ur Wix sourceUrl när mappningen inte har den", async () => {
    // Bootstrappen för allt som importerades innan fältet fanns.
    const fragade: string[][] = [];
    const { d, uppladdade } = deps({
      listAosom: async () => [{ sku: "B-2", wixProductId: "wix-b" }],
      kandaBildFiler: async () => [],
      hamtaKallor: async (ids) => {
        fragade.push(ids);
        return new Map(ids.map((id) => [id, `https://img.aosomcdn.com/${id.replace("fil-", "")}.jpg`]));
      },
    });
    const s = await runImageRepair(d, { dryRun: false });
    expect(fragade).toEqual([["fil-1", "fil-2", "fil-3"]]);
    expect(uppladdade).toEqual([[ONSKADE[3], ONSKADE[4]]]);
    expect(s.fullOmladdning).toBe(0);
  });

  it("☠️ går tillbaka till full omladdning när en bild inte går att härleda", async () => {
    // Vet vi inte vad produkten redan har får vi inte fylla på: en felgissning
    // ger en dubblettbild på en kundsida. Hellre den gamla, dyrare vägen —
    // och bara en gång, eftersom kopplingen sparas efteråt.
    const { d, uppladdade } = deps({
      listAosom: async () => [{ sku: "B-2", wixProductId: "wix-b" }],
      kandaBildFiler: async () => [],
      hamtaKallor: async () => new Map(),
    });
    const s = await runImageRepair(d, { dryRun: false });
    expect(uppladdade).toEqual([ONSKADE]);
    expect(s.fullOmladdning).toBe(1);
    expect(s.atervandaBilder).toBe(0);
  });

  it("räknar kvarstående missar när skrivningen ändå är en förbättring", async () => {
    const { d, skrivna } = deps({
      listAosom: async () => [{ sku: "A-1", wixProductId: "wix-a" }],
      importImages: async (urls) => urls.slice(0, 4).map((u, i) => ({ id: `f${i}`, url: `https://static.wixstatic.com/${u.slice(-5)}`, kalla: u })),
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
