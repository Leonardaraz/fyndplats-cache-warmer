import { describe, it, expect } from "vitest";
import {
  planeraStadning,
  runMediaCleanup,
  mediaNyckel,
  type MediaFil,
  type MediaCleanupDeps,
} from "./media-cleanup";

const MB = 1_000_000;

/** Vår import: kommer från en leverantörs CDN. */
function fil(namn: string, id = namn, storlek = MB): MediaFil {
  return {
    id, displayName: namn,
    url: `https://static.wixstatic.com/media/${id}~mv2.jpg`,
    sizeInBytes: storlek,
    sourceUrl: `https://img.aosomcdn.com/100/product/${id}.jpg`,
  };
}

/** Handuppladdad i Wix-editorn: ingen sourceUrl. */
function handfil(namn: string, id = namn, storlek = MB): MediaFil {
  return { id, displayName: namn, url: `https://static.wixstatic.com/media/${id}~mv2.jpg`, sizeInBytes: storlek };
}

/** Wix egen omimport: pekar tillbaka på en av våra filer. */
function kopia(av: MediaFil, id: string, storlek = MB): MediaFil {
  return {
    id, displayName: `b379ce_${id}~mv2.jpg`,
    url: `https://static.wixstatic.com/media/${id}~mv2.jpg`,
    sizeInBytes: storlek,
    sourceUrl: av.url,
  };
}

const url = (id: string) => `https://static.wixstatic.com/media/${id}~mv2.jpg`;

describe("mediaNyckel", () => {
  it("plockar filnamnet ur adressen", () => {
    expect(mediaNyckel("https://static.wixstatic.com/media/abc~mv2.jpg")).toBe("abc~mv2.jpg");
  });

  it("ignorerar query-parametrar — Wix lägger på dem vid visning", () => {
    expect(mediaNyckel("https://static.wixstatic.com/media/abc~mv2.jpg/v1/fill/w_500.jpg?x=1"))
      .toBe(mediaNyckel("https://static.wixstatic.com/media/abc~mv2.jpg/v1/fill/w_500.jpg"));
  });
});

describe("planeraStadning", () => {
  it("raderar bara Aosom-filer som ingen produkt använder", () => {
    const filer = [fil("aosom-A-1.jpg", "a1"), fil("aosom-A-2.jpg", "a2")];
    const plan = planeraStadning(filer, [url("a1")], 1);
    expect(plan.attRadera.map((f) => f.id)).toEqual(["a2"]);
    expect(plan.anvanda).toBe(1);
  });

  it("☠️ rör ALDRIG en handuppladdad bild — den saknar sourceUrl", () => {
    // Sajtens logotyp, banners och kategoribilder syns inte i något API vi kan
    // lista. De måste undantas på EGENSKAP, inte på uppräkning: en bild någon
    // dragit in i editorn bär ingen källadress.
    const filer = [
      handfil("logotyp.png", "logo"),
      handfil("hero-banner.jpg", "hero"),
      fil("aosom-A-1.jpg", "a1"),
    ];
    const plan = planeraStadning(filer, [], 0);
    expect(plan.attRadera.map((f) => f.id)).toEqual(["a1"]);
  });

  it("☠️ fångar Wix EGNA kopior — de är hälften av beståndet", () => {
    // 591 av 595 granskade wixstatic-filer var kopior av våra egna bilder,
    // skapade av att vi skickade `url` i stället för `id` till V3.
    const var1 = fil("aosom-A-1.jpg", "a1");
    const wixKopia = kopia(var1, "kopia1");
    const plan = planeraStadning([var1, wixKopia], [], 0);
    expect(plan.attRadera.map((f) => f.id).sort()).toEqual(["a1", "kopia1"]);
  });

  it("en kopia av en HANDUPPLADDAD bild rörs inte heller", () => {
    // Kedjan måste sluta i en fil vi äger. Gör den inte det är hela kedjan inte
    // vår att radera.
    const hand = handfil("logotyp.png", "logo");
    const kopiaAvHand = kopia(hand, "logokopia");
    const plan = planeraStadning([hand, kopiaAvHand], [], 0);
    expect(plan.attRadera).toHaveLength(0);
  });

  it("AliExpress-bilder räknas också som våra", () => {
    const ae: MediaFil = {
      id: "ae1", displayName: "gardintyg-blatt-1.jpg",
      url: "https://static.wixstatic.com/media/ae1~mv2.jpg",
      sizeInBytes: MB,
      sourceUrl: "https://ae01.alicdn.com/kf/S123.jpg",
    };
    const plan = planeraStadning([ae], [], 0);
    expect(plan.attRadera.map((f) => f.id)).toEqual(["ae1"]);
  });

  it("☠️ KASTAR när referenslistan är misstänkt liten", () => {
    // Halvfallerar produktlistningen ser varenda fil föräldralös ut, och en
    // körning hade raderat hela bildbanken permanent.
    const filer = Array.from({ length: 100 }, (_, i) => fil(`aosom-S${i}-1.jpg`, `f${i}`));
    expect(() => planeraStadning(filer, [url("f0")], 500)).toThrow(/läsfel/);
  });

  it("spärren släpper igenom en normal katalog", () => {
    const filer = Array.from({ length: 100 }, (_, i) => fil(`aosom-S${i}-1.jpg`, `f${i}`));
    const anvanda = Array.from({ length: 250 }, (_, i) => url(`f${i}`));
    expect(() => planeraStadning(filer, anvanda, 100)).not.toThrow();
  });

  it("spärren gäller inte när katalogen mätbart är tom", () => {
    // antalProdukter 0 = ingen produkt lästes, alltså inget att jämföra mot.
    expect(() => planeraStadning([fil("aosom-A-1.jpg", "a1")], [], 0)).not.toThrow();
  });

  it("räknar frigjorda byte", () => {
    const plan = planeraStadning(
      [fil("aosom-A-1.jpg", "a1", 3 * MB), fil("aosom-A-2.jpg", "a2", 2 * MB)],
      [],
      0,
    );
    expect(plan.bytes).toBe(5 * MB);
  });
});

function deps(over: Partial<MediaCleanupDeps> = {}) {
  const raderade: string[][] = [];
  const bas: MediaCleanupDeps = {
    listaFiler: async () => [
      fil("aosom-A-1.jpg", "a1"),
      fil("aosom-A-2.jpg", "a2"),
      fil("aosom-B-1.jpg", "b1"),
    ],
    listaAnvanda: async () => ({ urls: [url("a1")], antalProdukter: 1 }),
    raderaPermanent: async (ids) => { raderade.push(ids); },
    ...over,
  };
  return { d: bas, raderade };
}

describe("runMediaCleanup", () => {
  it("torrkörning är default och raderar ingenting", async () => {
    const { d, raderade } = deps();
    const s = await runMediaCleanup(d);
    expect(s.dryRun).toBe(true);
    expect(raderade).toHaveLength(0);
    expect(s.foraldralosa).toBe(2);
    expect(s.raderade).toBe(0);
    // Torrkörningen ska ändå säga hur mycket som skulle frigöras.
    expect(s.frigjordMb).toBe(2);
  });

  it("raderar i skarpt läge och räknar frigjort utrymme", async () => {
    const { d, raderade } = deps();
    const s = await runMediaCleanup(d, { dryRun: false });
    expect(raderade.flat().sort()).toEqual(["a2", "b1"]);
    expect(s.raderade).toBe(2);
    expect(s.frigjordMb).toBe(2);
  });

  it("`limit` begränsar hur många som raderas i en körning", async () => {
    const { d, raderade } = deps();
    const s = await runMediaCleanup(d, { dryRun: false, limit: 1 });
    expect(raderade.flat()).toHaveLength(1);
    expect(s.raderade).toBe(1);
    // Planen visar fortfarande hela sanningen.
    expect(s.foraldralosa).toBe(2);
  });

  it("ett misslyckat anrop stoppar inte resten", async () => {
    let n = 0;
    const { d } = deps({
      listaFiler: async () => Array.from({ length: 120 }, (_, i) => fil(`aosom-S${i}.jpg`, `f${i}`)),
      listaAnvanda: async () => ({ urls: [], antalProdukter: 0 }),
      raderaPermanent: async () => { if (n++ === 0) throw new Error("Wix svarade 500"); },
    });
    const s = await runMediaCleanup(d, { dryRun: false });
    expect(s.misslyckade).toBe(50);
    expect(s.raderade).toBe(70);
    expect(s.errors[0]).toMatch(/500/);
  });

  it("en trasig produktlistning fäller körningen innan något raderas", async () => {
    const { d, raderade } = deps({
      listaFiler: async () => Array.from({ length: 100 }, (_, i) => fil(`aosom-S${i}.jpg`, `f${i}`)),
      listaAnvanda: async () => ({ urls: [], antalProdukter: 1000 }),
    });
    await expect(runMediaCleanup(d, { dryRun: false })).rejects.toThrow(/läsfel/);
    expect(raderade).toHaveLength(0);
  });
});
