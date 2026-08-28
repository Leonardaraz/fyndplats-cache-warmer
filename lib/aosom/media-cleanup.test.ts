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

  it("☠️ känner igen en kopia även när originalet redan är raderat", () => {
    // Kedjan "pekar på en fil vi äger" kräver att originalet finns i fönstret.
    // Efter ett skarpt varv är originalet ofta borta — och då hade kopian
    // blivit oigenkännlig för alltid. Signaturen finns i filen själv: en
    // omimport döps efter adressen den hämtades från.
    const foraldralosKopia: MediaFil = {
      id: "kopia",
      displayName: "b379ce_ee39b9fc40b346f284d8d7178949f8a1~mv2.jpg",
      url: "https://static.wixstatic.com/media/b379ce_213df005~mv2.jpg",
      sizeInBytes: MB,
      // Originalet är raderat och finns inte i listan.
      sourceUrl: "https://static.wixstatic.com/media/b379ce_ee39b9fc40b346f284d8d7178949f8a1~mv2.jpg",
    };
    const plan = planeraStadning([foraldralosKopia], [], 0);
    expect(plan.attRadera.map((f) => f.id)).toEqual(["kopia"]);
  });

  it("en wixstatic-fil med ett EGET namn rörs inte — den är inte en omimport", () => {
    // Skyddet mot att regeln ovan blir för bred: bara filer som bär exakt
    // källadressens filnamn är Wix egna kopior.
    const egetNamn: MediaFil = {
      id: "nagot",
      displayName: "kategoribild-tradgard.jpg",
      url: "https://static.wixstatic.com/media/nagot~mv2.jpg",
      sizeInBytes: MB,
      sourceUrl: "https://static.wixstatic.com/media/b379ce_okant~mv2.jpg",
    };
    expect(planeraStadning([egetNamn], [], 0).attRadera).toHaveLength(0);
  });

  it("en wixstatic-fil som varken pekar på oss eller bär omimport-namnet rörs inte", () => {
    // Gränsen för de två reglerna ovan. Att en fil har en wixstatic-sourceUrl
    // räcker INTE i sig — den måste antingen peka på en fil vi äger eller bära
    // omimportens namnsignatur.
    //
    // Skyddet som alltid gäller är det andra: ORIGINALET, den handuppladdade
    // filen utan sourceUrl, rörs aldrig oavsett vad som pekar på den.
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
    listaFiler: async () => ({
      filer: [fil("aosom-A-1.jpg", "a1"), fil("aosom-A-2.jpg", "a2"), fil("aosom-B-1.jpg", "b1")],
      cursor: null, komplett: true,
    }),
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
      listaFiler: async () => ({
        filer: Array.from({ length: 120 }, (_, i) => fil(`aosom-S${i}.jpg`, `f${i}`)),
        cursor: null, komplett: true,
      }),
      listaAnvanda: async () => ({ urls: [], antalProdukter: 0 }),
      raderaPermanent: async () => { if (n++ === 0) throw new Error("Wix svarade 500"); },
    });
    const s = await runMediaCleanup(d, { dryRun: false });
    expect(s.misslyckade).toBe(50);
    expect(s.raderade).toBe(70);
    expect(s.errors[0]).toMatch(/500/);
  });

  it("☠️ listningarna körs EFTER varandra, inte parallellt", async () => {
    // Parallellt dubblades anropstakten mot samma Wix-värd. Wix svarade 429
    // efter ~30 sekunder och hela rutten föll med 500 utan att radera något.
    const ordning: string[] = [];
    const { d } = deps({
      listaAnvanda: async () => { ordning.push("anvanda"); return { urls: [url("a1")], antalProdukter: 1 }; },
      listaFiler: async () => {
        ordning.push("filer");
        return { filer: [fil("aosom-A-1.jpg", "a1"), fil("aosom-A-2.jpg", "a2")], cursor: null, komplett: true };
      },
    });
    await runMediaCleanup(d);
    // Referenslistan först: den är massfel-spärrens underlag och måste vara hel.
    expect(ordning).toEqual(["anvanda", "filer"]);
  });

  it("en kapad listning raderar ändå det den såg — och säger att den är kapad", async () => {
    // Att radera föräldralösa filer bland de LÄSTA är alltid tryggt. Nästa
    // körning når längre eftersom listan blivit kortare.
    const { d, raderade } = deps({
      listaFiler: async () => ({
        filer: [fil("aosom-A-1.jpg", "a1"), fil("aosom-A-2.jpg", "a2")],
        cursor: "sida-2", komplett: false,
      }),
    });
    const s = await runMediaCleanup(d, { dryRun: false });
    expect(s.komplettListning).toBe(false);
    expect(raderade.flat()).toEqual(["a2"]);
  });

  it("markören förs vidare in i listningen och tillbaka i svaret", async () => {
    // Wix edge-lager svarar 429 med en HTML-sida när ETT anrop bläddrar för
    // många sidor i rad, och den spärren går inte att vänta ut inom ruttens
    // 300 sekunder. 58 160 filer måste därför tas i tuggor.
    let fick: string | undefined;
    const { d } = deps({
      listaFiler: async ({ efter }) => {
        fick = efter;
        return { filer: [fil("aosom-A-1.jpg", "a1")], cursor: "nasta-sida", komplett: false };
      },
    });
    const s = await runMediaCleanup(d, { after: "forra-sidan" });
    expect(fick).toBe("forra-sidan");
    expect(s.cursor).toBe("nasta-sida");
  });

  it("cursor blir null när hela Media Manager är genomgången", async () => {
    const { d } = deps();
    expect((await runMediaCleanup(d)).cursor).toBeNull();
  });

  it("en hel listning rapporteras som hel", async () => {
    const { d } = deps();
    expect((await runMediaCleanup(d)).komplettListning).toBe(true);
  });

  it("listningen får en DEL av budgeten, så det finns tid kvar att radera på", async () => {
    let fick: number | undefined;
    const { d } = deps({
      now: () => 1_000,
      listaFiler: async ({ stoppaVid }) => { fick = stoppaVid; return { filer: [], cursor: null, komplett: true }; },
    });
    await runMediaCleanup(d, { timeBudgetMs: 10_000 });
    expect(fick).toBe(8_000); // 70 % av 10 s
  });

  it("raderingen stannar på tidsbudgeten i stället för att dödas mitt i", async () => {
    // En stor `limit` får inte dra förbi ruttens maxDuration: då är filerna
    // raderade men svaret aldrig levererat.
    let t = 0;
    const { d, raderade } = deps({
      now: () => (t += 60_000),
      listaFiler: async () => ({
        filer: Array.from({ length: 300 }, (_, i) => fil(`aosom-S${i}.jpg`, `f${i}`)),
        cursor: null, komplett: true,
      }),
      listaAnvanda: async () => ({ urls: [], antalProdukter: 0 }),
    });
    const s = await runMediaCleanup(d, { dryRun: false, timeBudgetMs: 100_000 });
    expect(s.stoppedBy).toBe("tidsbudget");
    expect(s.raderade).toBeLessThan(300);
    expect(raderade.flat().length).toBe(s.raderade);
  });

  it("`limit` syns i stoppedBy", async () => {
    const { d } = deps();
    expect((await runMediaCleanup(d, { dryRun: false, limit: 1 })).stoppedBy).toBe("limit");
    expect((await runMediaCleanup(d, { dryRun: false })).stoppedBy).toBe("klart");
  });

  it("en trasig produktlistning fäller körningen innan något raderas", async () => {
    const { d, raderade } = deps({
      listaFiler: async () => ({
        filer: Array.from({ length: 100 }, (_, i) => fil(`aosom-S${i}.jpg`, `f${i}`)),
        cursor: null, komplett: true,
      }),
      listaAnvanda: async () => ({ urls: [], antalProdukter: 1000 }),
    });
    await expect(runMediaCleanup(d, { dryRun: false })).rejects.toThrow(/läsfel/);
    expect(raderade).toHaveLength(0);
  });
});
