import { describe, expect, it } from "vitest";
import { buildReport, type MediaFile } from "./media-audit";

function fil(id: string, size = 1_048_576, hash?: string): MediaFile {
  return { id, displayName: `${id}.png`, sizeInBytes: size, hash };
}

const helKorning = { complete: true as const };

describe("buildReport", () => {
  it("räknar en fil som använd om NÅGON av produkt, variantlänk eller kategori pekar på den", () => {
    const r = buildReport(
      "site",
      { files: [fil("a"), fil("b"), fil("c"), fil("d")], total: 4, ...helKorning },
      { ids: new Set(["a", "b"]), products: 1, ...helKorning },
      { ids: new Set(["c"]) },
    );
    expect(r.utanKatalogreferens).toBe(1);
    expect(r.idUtanReferens).toEqual(["d"]);
    expect(r.katalogreferenser).toBe(3);
  });

  it("räknar bara KOPIORNA som dubblettkostnad, inte originalet", () => {
    const r = buildReport(
      "site",
      {
        files: [fil("a", 100, "h1"), fil("b", 100, "h1"), fil("c", 100, "h1"), fil("d", 100, "h2")],
        total: 4,
        ...helKorning,
      },
      { ids: new Set(), products: 0, ...helKorning },
      { ids: new Set() },
    );
    expect(r.dubblettgrupper).toBe(1);
    expect(r.bytesIDubbletter).toBe(200);
  });

  it("ignorerar filer utan hash i dubbletträkningen i stället för att bunta ihop dem", () => {
    const r = buildReport(
      "site",
      { files: [fil("a", 100), fil("b", 100)], total: 2, ...helKorning },
      { ids: new Set(), products: 0, ...helKorning },
      { ids: new Set() },
    );
    expect(r.dubblettgrupper).toBe(0);
    expect(r.bytesIDubbletter).toBe(0);
  });

  it("är INTE fullständig när katalogen stannade på budget — då är listan farlig", () => {
    // Det här är hela poängen med flaggan: en produkt som inte hanns läsas gör
    // sina bilder föräldralösa på pappret, och en radering mot den listan
    // hade tagit bort bilder som används.
    const r = buildReport(
      "site",
      { files: [fil("a")], total: 1, complete: true },
      { ids: new Set(), products: 0, complete: false },
      { ids: new Set() },
    );
    expect(r.fullstandig).toBe(false);
    expect(r.utanKatalogreferens).toBe(1);
  });

  it("är INTE fullständig när kategorierna inte kunde läsas", () => {
    const r = buildReport(
      "site",
      { files: [fil("a")], total: 1, ...helKorning },
      { ids: new Set(), products: 1, ...helKorning },
      { ids: null, fel: "403" },
    );
    expect(r.fullstandig).toBe(false);
    expect(r.kategoribilder).toBeNull();
    expect(r.kategorifel).toBe("403");
  });

  it("sorterar de största föräldralösa först och tar bara med föräldralösa", () => {
    const r = buildReport(
      "site",
      { files: [fil("liten", 10), fil("stor", 9_000_000), fil("anvand", 99_000_000)], total: 3, ...helKorning },
      { ids: new Set(["anvand"]), products: 1, ...helKorning },
      { ids: new Set() },
    );
    expect(r.storsta.map((f) => f.id)).toEqual(["stor", "liten"]);
    expect(r.storsta[0].mb).toBeCloseTo(8.58, 1);
  });
});
