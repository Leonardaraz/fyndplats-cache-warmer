import { describe, expect, it } from "vitest";
import { buildReport, MEDIA_PAGE_LIMIT, type MediaFile } from "./media-audit";

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

describe("buildReport — spärren mot en halv katalog", () => {
  it("är INTE fullständig när sökningen såg färre produkter än katalogen har", () => {
    // Utelämnar sök-endpointen utkast (scope-fråga) ser varenda utkasts bilder
    // föräldralösa ut. Skillnaden ska fälla rapporten, inte upptäckas efteråt.
    const r = buildReport(
      "site",
      { files: [fil("a")], total: 1, complete: true },
      { ids: new Set(["a"]), products: 1200, complete: true },
      { ids: new Set() },
      1696,
    );
    expect(r.fullstandig).toBe(false);
    expect(r.produkterIKatalogen).toBe(1696);
  });

  it("är fullständig när sökningen såg minst lika många som katalogen har", () => {
    const r = buildReport(
      "site",
      { files: [fil("a")], total: 1, complete: true },
      { ids: new Set(["a"]), products: 1696, complete: true },
      { ids: new Set() },
      1696,
    );
    expect(r.fullstandig).toBe(true);
  });

  it("faller tillbaka på övriga spärrar när facit inte kunde hämtas", () => {
    const r = buildReport(
      "site",
      { files: [fil("a")], total: 1, complete: true },
      { ids: new Set(["a"]), products: 3, complete: true },
      { ids: new Set() },
      null,
    );
    expect(r.fullstandig).toBe(true);
    expect(r.produkterIKatalogen).toBeNull();
  });
});

describe("MEDIA_PAGE_LIMIT", () => {
  it("håller sig inom API:ets faktiska tak på 100", () => {
    // Dokumentationen säger "up to 200 files"; API:t svarar 400
    // INVALID_ARGUMENT på allt över 100. Första skarpa körningen föll på det
    // (2026-08-29). Testet finns för att siffran inte ska glida tillbaka när
    // någon läser dokumentationen igen och "rättar" den.
    expect(MEDIA_PAGE_LIMIT).toBeLessThanOrEqual(100);
    expect(MEDIA_PAGE_LIMIT).toBeGreaterThan(0);
  });
});
