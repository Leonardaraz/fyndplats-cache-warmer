import { describe, it, expect } from "vitest";
import {
  borAterforsoka,
  klassaFil,
  sammanfattaFelkropp,
  planeraStadning,
  runMediaCleanup,
  mediaNyckel,
  recensionsbildUrler,
  RECENSION_TAK,
  kontrolleraSammaSajt,
  kontrolleraProduktsvep,
  type MediaFil,
  type MediaCleanupDeps,
} from "./media-cleanup";
import { KARENS_MS, nyttMinnesKarens, type KarensLager } from "../store/bildstadning-karens";

const MB = 1_000_000;

/**
 * Ett karenslager där varje fil redan varit oanvänd i hela karenstiden. De
 * flesta testerna gäller VAD som raderas, inte NÄR; karenstiden har egna
 * tester med det riktiga minneslagret.
 */
function moget(): KarensLager {
  return {
    registrera: async (idn, nu) => new Map(idn.map((id) => [id, nu - KARENS_MS])),
    lasAlla: async () => [],
    glom: async () => {},
  };
}

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

describe("borAterforsoka", () => {
  const HTML = '  <!DOCTYPE html>\n<html><head><meta charset="utf-8">';
  const JSON_FEL = '{"message":"INVALID_ARGUMENT: \'paging.limit\' must be less than or equal to 100"}';

  it("☠️ ett 400 med HTML-kropp är edge-strypningen — vänta ut den", () => {
    // 450 av 2 190 filer gavs upp direkt i ett enda fönster (2026-08-28) för
    // att 4xx inte återförsöktes. Det var aldrig ett ogiltigt anrop.
    expect(borAterforsoka(400, HTML)).toBe(true);
  });

  it("ett 400 med JSON-kropp är API:t — det blir aldrig bättre", () => {
    expect(borAterforsoka(400, JSON_FEL)).toBe(false);
  });

  it("429 och 5xx återförsöks oavsett kropp", () => {
    expect(borAterforsoka(429, HTML)).toBe(true);
    expect(borAterforsoka(429, JSON_FEL)).toBe(true);
    expect(borAterforsoka(503, "")).toBe(true);
  });

  it("404 med JSON rörs inte", () => {
    expect(borAterforsoka(404, '{"message":"not found"}')).toBe(false);
  });
});

describe("sammanfattaFelkropp", () => {
  it("kokar ned edge-lagrets HTML-sida till en rad", () => {
    // 200 tecken boilerplate per misslyckad skopa gjorde första skarpa
    // körningens logg oläsbar — per-fönster-raderna drunknade.
    const html = '  <!DOCTYPE html>\n<html><head><meta charset="utf-8">\n'.repeat(20);
    expect(sammanfattaFelkropp(html)).toBe("(HTML-felsida från Wix edge-lager)");
  });

  it("behåller ett API-fel ordagrant — där står vad som är fel", () => {
    const json = '{"message":"INVALID_ARGUMENT: paging.limit"}';
    expect(sammanfattaFelkropp(json)).toBe(json);
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
      id: "b379ce_213df005~mv2.jpg",
      displayName: "b379ce_ee39b9fc40b346f284d8d7178949f8a1~mv2.jpg",
      url: "https://static.wixstatic.com/media/b379ce_213df005~mv2.jpg",
      sizeInBytes: MB,
      // Originalet är raderat och finns inte i listan.
      sourceUrl: "https://static.wixstatic.com/media/b379ce_ee39b9fc40b346f284d8d7178949f8a1~mv2.jpg",
    };
    const plan = planeraStadning([foraldralosKopia], [], 0);
    expect(plan.attRadera.map((f) => f.id)).toEqual(["b379ce_213df005~mv2.jpg"]);
  });

  it("☠️ en bild hämtad ur ETT ANNAT bibliotek är inte vår kopia, även med samma namn", () => {
    // Wix gratisbilder (11062b_) och mallens bilder (22e53e_, All Products-
    // kategorins bild) bär signaturen men en annan ägare. De kan sitta på Wix
    // egna sidor, där ingen läsare ser dem (granskningen 2026-10-14).
    for (const agare of ["11062b", "22e53e"]) {
      const kalla = `${agare}_7ce192b539bc4ccfa676553133f07a78~mv2.jpg`;
      const f: MediaFil = {
        id: "b379ce_0c27b6fabd0247338daf7a0d37751570~mv2.jpg",
        displayName: kalla,
        url: "https://static.wixstatic.com/media/b379ce_0c27b6fabd0247338daf7a0d37751570~mv2.jpg",
        sizeInBytes: MB,
        sourceUrl: `https://static.wixstatic.com/media/${kalla}`,
      };
      expect(planeraStadning([f], [], 0).attRadera).toHaveLength(0);
      expect(klassaFil(f, new Set())).toBe("wix-annan");
    }
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
    listaRecensionsbilder: async () => [],
    listaKategoribilder: async () => [],
    listaFargbilder: async () => [],
    listaButikensBilder: async () => [],
    listaOrderbilder: async () => [],
    listaVariantbilder: async () => [],
    karens: moget(),
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

  it("☠️ pausar mellan skopor — annars trippar raderingen edge-spärren", async () => {
    // Femte passet 2026-08-28: skopor rygg mot rygg trippade spärren, och varje
    // trasig skopa väntade sedan 42 s på återförsök som ändå inte gick igenom.
    // 650 filer raderades av 1 200 innan tidsbudgeten tog slut.
    const pauser: number[] = [];
    const { d, raderade } = deps({
      listaFiler: async () => ({
        filer: Array.from({ length: 120 }, (_, i) => fil(`aosom-S${i}.jpg`, `f${i}`)),
        cursor: null, komplett: true,
      }),
      listaAnvanda: async () => ({ urls: [], antalProdukter: 0 }),
      paus: async (ms) => { pauser.push(ms); },
    });
    await runMediaCleanup(d, { dryRun: false });
    // Tre skopor à 50 → två pauser. Den första skopan pausar inte.
    expect(raderade).toHaveLength(3);
    expect(pauser).toEqual([200, 200]);
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

// ═══════════════════════════════════════════════════════════════════════════
// ☠️ RECENSIONSBILDERNA (2026-09-04)
//
// Städningen raderade dem, permanent, varje natt. Referenslistan gick bara
// igenom `stores/v3/products/search`, medan en recensionsbild refereras av en
// RECENSIONSRAD — och eftersom vår kod importerade den från
// aliexpress-media.com bär den en sourceUrl och passerade "vår kod skapade
// den"-filtret. Uppmätt i drift: 68 av 68 bilder över fyra produkter döda.
//
// Samma lärdom som migreringen skrev ned två gånger: en referenslista är klar
// först när ALLA läsare finns med i den. En läsare som bor i en annan tabell
// syns inte i koden här.
// ═══════════════════════════════════════════════════════════════════════════

describe("☠️ recensionsbilder är i bruk, inte föräldralösa", () => {
  it("en fil som sitter på en RECENSION raderas inte", () => {
    const plan = planeraStadning(
      [fil("aosom-A-1.jpg", "a1"), fil("rec-foto.jpg", "r1")],
      [url("a1")],          // produktbilder
      1,
      [url("r1")],          // recensionsbilder
    );
    expect(plan.attRadera.map((f) => f.id)).toEqual([]);
    expect(plan.anvanda).toBe(2);
  });

  it("utan recensionslistan hade samma fil raderats — det var buggen", () => {
    const plan = planeraStadning(
      [fil("aosom-A-1.jpg", "a1"), fil("rec-foto.jpg", "r1")],
      [url("a1")],
      1,
      [],                   // tom lista = det gamla beteendet
    );
    expect(plan.attRadera.map((f) => f.id)).toEqual(["r1"]);
  });

  it("både imageUrl och imageUrls skonas", () => {
    // En rad kan bära bara `imageUrl`; en annan bär flera i `imageUrls`.
    const plan = planeraStadning(
      [fil("r1.jpg", "r1"), fil("r2.jpg", "r2"), fil("r3.jpg", "r3")],
      [],
      0,
      [url("r1"), url("r2"), url("r3")],
    );
    expect(plan.attRadera).toEqual([]);
  });
});

describe("☠️ ett läsfel mot recensionslagret FÄLLER körningen", () => {
  it("kastar i stället för att radera med tom lista", async () => {
    // Fortsätter körningen med tom lista ser varje recensionsbild
    // föräldralös ut och raderas PERMANENT. Samma form som MIN_FEED_RADER:
    // när ett läsfel och ett tomt svar ser likadana ut, och det ena utfallet
    // är oåterkalleligt, är avbrott enda säkra svaret.
    const { d, raderade } = deps({
      listaRecensionsbilder: async () => { throw new Error("Postgres nere"); },
    });
    await expect(runMediaCleanup(d, { dryRun: false })).rejects.toThrow(/Recensionsbilderna gick inte att läsa/);
    expect(raderade).toEqual([]);
  });

  it("en TOM lista utan fel går igenom — tomhet är legitim, fel är det inte", async () => {
    const { d } = deps({ listaRecensionsbilder: async () => [] });
    const s = await runMediaCleanup(d, { dryRun: true });
    expect(s.foraldralosa).toBeGreaterThan(0);
  });
});

describe("☠️ kategoribilderna hör till referenslistan", () => {
  it("en fil som bara en kategori använder raderas inte", () => {
    // Kategoribilden valdes ur en produkts bilder och är SAMMA fil. När
    // produkten raderats är kategorin filens enda användare.
    const plan = planeraStadning([fil("aosom-A-1.jpg", "k1"), fil("aosom-A-2.jpg", "x1")], [], 0, [], [url("k1")]);
    expect(plan.attRadera.map((f) => f.id)).toEqual(["x1"]);
  });

  it("ett läsfel mot kategorierna FÄLLER körningen, ingen fil raderas", async () => {
    const { d, raderade } = deps({
      listaKategoribilder: async () => { throw new Error("Category search failed (503)"); },
    });
    await expect(runMediaCleanup(d, { dryRun: false })).rejects.toThrow(/Kategoribilderna gick inte att läsa/);
    expect(raderade).toEqual([]);
  });

  it("kategorins bild skonas i skarpt läge", async () => {
    const { d, raderade } = deps({ listaKategoribilder: async () => [url("b1")] });
    const s = await runMediaCleanup(d, { dryRun: false });
    expect(raderade.flat()).toEqual(["a2"]);
    expect(s.raderade).toBe(1);
  });
});

describe("recensionsbildUrler — skyddslistan läser hela recensionslagret", () => {
  it("ber om alla rader, inte admin-sidornas tak på 5 000", async () => {
    let fragat: number | undefined;
    const rader = Array.from({ length: 6000 }, (_, i) => ({ imageUrl: `https://static.wixstatic.com/media/r${i}.jpg`, imageUrls: [`https://static.wixstatic.com/media/r${i}.jpg`, `https://static.wixstatic.com/media/r${i}b.jpg`] }));
    const urls = await recensionsbildUrler({ listAll: async (limit) => { fragat = limit; return rader.slice(0, limit); } });
    expect(fragat).toBe(RECENSION_TAK);
    expect(urls).toContain("https://static.wixstatic.com/media/r5999b.jpg");
  });

  it("kastar när svaret når taket i stället för att kapa", async () => {
    await expect(
      recensionsbildUrler({ listAll: async (limit) => Array.from({ length: limit ?? 0 }, () => ({})) }),
    ).rejects.toThrow(/höj RECENSION_TAK/);
  });
});

describe("☠️ färgbildstabellen hör till referenslistan", () => {
  // Wix tar 15 bilder per produkt, och resten av en färgs bilder står bara i
  // motorns tabell (lib/aosom/fargbilder.ts) — ofta som filer på en givare som
  // ska raderas. När givaren är borta är tabellen filens enda användare.
  it("en fil som bara tabellen använder raderas inte — tabellen bär Wix fil-id", () => {
    const plan = planeraStadning([fil("aosom-A-1.jpg", "f1"), fil("aosom-A-2.jpg", "x1")], [], 0, [], [], ["f1~mv2.jpg"]);
    expect(plan.attRadera.map((f) => f.id)).toEqual(["x1"]);
  });

  it("en hel URL i tabellen skyddar också", () => {
    const plan = planeraStadning([fil("aosom-A-1.jpg", "f1")], [], 0, [], [], [url("f1")]);
    expect(plan.attRadera).toEqual([]);
  });

  it("ett läsfel mot tabellen FÄLLER körningen, ingen fil raderas", async () => {
    const { d, raderade } = deps({ listaFargbilder: async () => { throw new Error("DATABASE_URL saknas"); } });
    await expect(runMediaCleanup(d, { dryRun: false })).rejects.toThrow(/Färgbildstabellen gick inte att läsa/);
    expect(raderade).toEqual([]);
  });

  it("tabellens fil skonas i skarpt läge", async () => {
    const { d, raderade } = deps({ listaFargbilder: async () => [url("b1")] });
    const s = await runMediaCleanup(d, { dryRun: false });
    expect(raderade.flat()).toEqual(["a2"]);
    expect(s.raderade).toBe(1);
  });
});

describe("☠️ butikens lista och ordrarna hör till referenslistan (2026-10-14)", () => {
  // Bloggen visade 215 Wix-bilder, 61 av dem Aosom-importer och 122
  // Wix-kopior. Ingen av dem behöver sitta på en produkt.
  it("en leverantörsfil som bara bloggen pekar på raderas inte", async () => {
    const { d, raderade } = deps({ listaButikensBilder: async () => ["b1~mv2.jpg"] });
    const s = await runMediaCleanup(d, { dryRun: false });
    expect(raderade.flat()).toEqual(["a2"]);
    expect(s.referenser.butiken).toBe(1);
  });

  it("en fil som bara en order pekar på raderas inte", async () => {
    const { d, raderade } = deps({ listaOrderbilder: async () => ["a2~mv2.jpg"] });
    await runMediaCleanup(d, { dryRun: false });
    expect(raderade.flat()).toEqual(["b1"]);
  });

  it("butikens lista är gemener — en ändelse med versaler är samma fil", () => {
    const f = { ...fil("aosom-A-1.jpg", "AB1"), url: "https://static.wixstatic.com/media/AB1~mv2.JPG" };
    const plan = planeraStadning([f], [], 0, [], [], [], { butiksbilder: ["ab1~mv2.jpg"] });
    expect(plan.attRadera).toEqual([]);
  });

  it("☠️ en omskalad adress skyddar filen, inte bara adressens sista led", () => {
    // "…/media/<id>/v1/fill/w_640,h_640/file.jpg" slutar på "file.jpg".
    const id = "b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg";
    const f: MediaFil = {
      id, displayName: "kundbild-1.jpg", url: `https://static.wixstatic.com/media/${id}`,
      sizeInBytes: MB, sourceUrl: "https://ae01.alicdn.com/kf/x.jpg",
    };
    const omskalad = `https://static.wixstatic.com/media/${id}/v1/fill/w_640,h_640/file.jpg`;
    expect(planeraStadning([f], [], 0, [omskalad]).attRadera).toEqual([]);
  });

  it("☠️ en produkt som bär filen med versaler skyddar den fortfarande", () => {
    // Gemenerna får inte göra jämförelsen ensidig: listan och uppslaget ska
    // normaliseras på samma sätt, annars ser en använd fil oanvänd ut.
    const adress = "https://static.wixstatic.com/media/AB1~mv2.JPG";
    const f = { ...fil("aosom-A-1.jpg", "AB1"), url: adress };
    expect(planeraStadning([f], [adress], 1).attRadera).toEqual([]);
  });

  it("ett läsfel mot butikens lista FÄLLER körningen, ingen fil raderas", async () => {
    const { d, raderade } = deps({ listaButikensBilder: async () => { throw new Error("503"); } });
    await expect(runMediaCleanup(d, { dryRun: false })).rejects.toThrow(/Butikens bildlista gick inte att läsa/);
    expect(raderade).toEqual([]);
  });

  it("ett läsfel mot ordrarna FÄLLER körningen, ingen fil raderas", async () => {
    const { d, raderade } = deps({ listaOrderbilder: async () => { throw new Error("orders/search 500"); } });
    await expect(runMediaCleanup(d, { dryRun: false })).rejects.toThrow(/Ordrarnas bilder gick inte att läsa/);
    expect(raderade).toEqual([]);
  });
});

describe("läget allt (Leonard 2026-10-14: alla bilder som inte används)", () => {
  const NU = Date.parse("2026-10-14T12:00:00Z");
  const DAG = 86_400_000;
  const rid = (n: number) => `b379ce_${n.toString(16).padStart(32, "0")}~mv2.jpg`;
  function riktig(n: number, kalla: string | undefined, dagar: number, namn = `fil-${n}.jpg`): MediaFil {
    const id = rid(n);
    const t = new Date(NU - dagar * DAG).toISOString();
    return {
      id, displayName: namn, url: `https://static.wixstatic.com/media/${id}`,
      sizeInBytes: MB, sourceUrl: kalla, createdDate: t, updatedDate: t,
    };
  }
  const AOSOM = "https://img.aosomcdn.com/100/product/x.jpg";
  const KORT = "https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/gren/tools/polish-assets/kort-1.png";
  const UTSNITT = `https://static.wixstatic.com/media/${rid(900)}/v1/crop/x_0,y_0,w_800,h_800/file.jpg`;
  const ANNAN_WIX = `https://static.wixstatic.com/media/${rid(901)}`;
  const AI = "https://im.runware.ai/image/ws/0.5/ii/x.jpg";

  const filer = [
    riktig(1, AOSOM, 30),          // leverantör, gammal, oanvänd → raderas
    riktig(2, KORT, 30),           // kort ur grenen, gammalt, oanvänt → raderas
    riktig(3, UTSNITT, 30),        // utsnitt, gammalt, oanvänt → raderas
    riktig(4, undefined, 300),     // handuppladdad → aldrig
    riktig(5, ANNAN_WIX, 300),     // okänd wix-källa → aldrig
    riktig(6, AI, 300),            // annan värd → aldrig
    riktig(7, KORT, 3),            // kort, men nytt → ligger kvar
    riktig(8, AOSOM, 30),          // leverantör, men en produkt bär den
  ];
  const plan = (omfang: "aosom" | "allt") => planeraStadning(
    filer, [`https://static.wixstatic.com/media/${rid(8)}`], 1, [], [], [],
    { omfang, minAlderMs: 14 * DAG, nu: NU },
  );

  it("raderar leverantörsfiler, kort och utsnitt som är gamla och oanvända", () => {
    expect(plan("allt").attRadera.map((f) => f.id)).toEqual([rid(1), rid(2), rid(3)]);
  });

  it("☠️ rör aldrig en fil utan källa eller med en okänd källa", () => {
    const p = plan("allt");
    for (const k of ["ingen-kalla", "wix-annan", "annan-kalla"] as const) {
      expect(p.perKlass[k].oanvanda).toBe(1);
      expect(p.perKlass[k].raderbara).toBe(0);
    }
  });

  it("☠️ en fil som skapats nyligen ligger kvar — en annan session kan vara mitt i", () => {
    const p = plan("allt");
    expect(p.attRadera.map((f) => f.id)).not.toContain(rid(7));
    expect(p.forUnga).toBe(1);
  });

  it("en fil utan datum räknas som ny", () => {
    const utan = { ...riktig(10, KORT, 30), createdDate: undefined };
    expect(planeraStadning([utan], [], 0, [], [], [], { omfang: "allt", minAlderMs: 14 * DAG, nu: NU }).attRadera).toEqual([]);
  });

  it("ett ovanligt id raderas inte i läget allt", () => {
    const ovanlig = { ...riktig(11, KORT, 30), url: "https://static.wixstatic.com/media/b379ce_x~mv2_d_1920_1080_s_2.jpg" };
    const p = planeraStadning([ovanlig], [], 0, [], [], [], { omfang: "allt", minAlderMs: 14 * DAG, nu: NU });
    expect(p.attRadera).toEqual([]);
    expect(p.ovanligtId).toBe(1);
  });

  it("nattens läge är oförändrat: kort och utsnitt rörs inte", () => {
    expect(plan("aosom").attRadera.map((f) => f.id)).toEqual([rid(1)]);
  });

  it("räknar varje klass", () => {
    const p = plan("allt");
    expect(p.perKlass.leverantor).toMatchObject({ filer: 2, anvanda: 1, oanvanda: 1, raderbara: 1 });
    expect(p.perKlass.github).toMatchObject({ filer: 2, oanvanda: 2, raderbara: 1 });
    expect(p.perKlass["wix-utsnitt"]).toMatchObject({ filer: 1, raderbara: 1 });
  });

  it("☠️ läget allt vägrar en åldersgräns under sju dygn", async () => {
    const { d, raderade } = deps();
    await expect(runMediaCleanup(d, { dryRun: false, omfang: "allt", minAlderDagar: 1 })).rejects.toThrow(/minst 7/);
    await expect(runMediaCleanup(d, { dryRun: false, omfang: "allt", minAlderDagar: Number.NaN })).rejects.toThrow(/minst 7/);
    expect(raderade).toEqual([]);
  });
});

describe("☠️ skydden som granskningen 2026-10-14 bad om", () => {
  it("en läsare under golvet stoppar körningen INNAN listningen och raderingen", async () => {
    let listat = false;
    const { d, raderade } = deps({
      listaRecensionsbilder: async () => [],
      listaFiler: async () => { listat = true; return { filer: [fil("aosom-A-2.jpg", "a2")], cursor: null, komplett: true }; },
    });
    await expect(runMediaCleanup(d, { dryRun: false, golv: { recensioner: 3000 } }))
      .rejects.toThrow(/recensioner gav 0 referenser, under golvet 3000/);
    expect(listat).toBe(false);
    expect(raderade).toEqual([]);
  });

  it("en läsare på golvet går igenom", async () => {
    const { d } = deps({ listaOrderbilder: async () => ["x~mv2.jpg", "y~mv2.jpg"] });
    const s = await runMediaCleanup(d, { dryRun: true, golv: { ordrar: 2, butiken: 0 } });
    expect(s.referenser.ordrar).toBe(2);
  });

  it("☠️ ett fönster som aldrig hann börja är ett fel, inte ett tomt bibliotek", async () => {
    const { d, raderade } = deps({ listaFiler: async () => ({ filer: [], cursor: null, komplett: false }) });
    await expect(runMediaCleanup(d, { dryRun: false })).rejects.toThrow(/hann inte börja/);
    const { d: d2 } = deps({ listaFiler: async () => ({ filer: [], cursor: "m1", komplett: false }) });
    await expect(runMediaCleanup(d2, { dryRun: true, after: "m1" })).rejects.toThrow(/hann inte börja/);
    expect(raderade).toEqual([]);
  });

  it("ett tomt bibliotek som listats klart är inget fel", async () => {
    const { d } = deps({ listaFiler: async () => ({ filer: [], cursor: null, komplett: true }) });
    expect((await runMediaCleanup(d)).foraldralosa).toBe(0);
  });

  it("kort räknas bara som våra när de kommer ur vårt eget repo", () => {
    const bas: MediaFil = {
      id: "b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg", displayName: "kort.png",
      url: "https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg", sizeInBytes: MB,
    };
    expect(klassaFil({ ...bas, sourceUrl: "https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/abc/tools/k.png" }, new Set()))
      .toBe("github");
    expect(klassaFil({ ...bas, sourceUrl: "https://raw.githubusercontent.com/nagon-annan/repo/main/k.png" }, new Set()))
      .toBe("annan-kalla");
  });
});

describe("granskningen 2026-10-14", () => {
  const bas: MediaFil = {
    id: "b379ce_1f6a6260c9f243b3afd79cbaf147b67b~mv2.jpg", displayName: "utsnitt.jpg",
    url: "https://static.wixstatic.com/media/b379ce_1f6a6260c9f243b3afd79cbaf147b67b~mv2.jpg", sizeInBytes: MB,
  };
  const kalla = "https://static.wixstatic.com/media/b379ce_2e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg";

  it("☠️ ett utsnitt ur ett annat bibliotek är inte poleringens", () => {
    for (const agare of ["11062b", "22e53e"]) {
      const kalla = `https://static.wixstatic.com/media/${agare}_2e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/crop/x_0,y_0,w_800,h_800/file.jpg`;
      expect(klassaFil({ ...bas, sourceUrl: kalla }, new Set())).toBe("wix-annan");
    }
  });

  it("☠️ bara crop-adresser är poleringens utsnitt; fill och fit kan vara hämtade för hand", () => {
    expect(klassaFil({ ...bas, sourceUrl: `${kalla}/v1/crop/x_0,y_0,w_800,h_800/file.jpg` }, new Set())).toBe("wix-utsnitt");
    expect(klassaFil({ ...bas, sourceUrl: `${kalla}/v1/fill/w_1200,h_630/file.jpg` }, new Set())).toBe("wix-annan");
    expect(klassaFil({ ...bas, sourceUrl: `${kalla}/v1/fit/w_640,h_640/file.jpg` }, new Set())).toBe("wix-annan");
  });

  it("☠️ en variants egen bild skyddar filen, även när den inte står i galleriet", async () => {
    // Varukorgen, kassan och ordern visar variantens bild (lib/wix/variant-media.ts).
    const { d, raderade } = deps({ listaVariantbilder: async () => ["a2~mv2.jpg"] });
    const s = await runMediaCleanup(d, { dryRun: false });
    expect(raderade.flat()).toEqual(["b1"]);
    expect(s.referenser.varianter).toBe(1);
  });

  it("☠️ ett läsfel bland varianterna fäller körningen innan något listas", async () => {
    let listat = false;
    const { d, raderade } = deps({
      listaVariantbilder: async () => { throw new Error("query-variants 403"); },
      listaFiler: async () => { listat = true; return { filer: [], cursor: null, komplett: true }; },
    });
    await expect(runMediaCleanup(d, { dryRun: false })).rejects.toThrow(/Varianternas bilder gick inte att läsa/);
    expect(listat).toBe(false);
    expect(raderade).toEqual([]);
  });

  it("varianterna har ett golv som alla andra läsare", async () => {
    const { d, raderade } = deps({ listaVariantbilder: async () => [] });
    await expect(runMediaCleanup(d, { dryRun: false, golv: { varianter: 5000 } }))
      .rejects.toThrow(/varianter gav 0 referenser, under golvet 5000/);
    expect(raderade).toEqual([]);
  });

  describe("karenstiden", () => {
    const DAG = 86_400_000;
    const T0 = Date.parse("2026-10-15T01:30:00Z");

    it("☠️ första gången en fil ses oanvänd raderas den inte, den antecknas", async () => {
      const karens = nyttMinnesKarens();
      const { d, raderade } = deps({ karens, now: () => T0 });
      const s = await runMediaCleanup(d, { dryRun: false });
      expect(raderade).toEqual([]);
      expect(s.foraldralosa).toBe(2);
      expect(s.mogna).toBe(0);
      expect(s.iKarens).toBe(2);
      expect(s.karensDygn).toBe(3);
    });

    it("efter karenstiden raderas filen som fortfarande är oanvänd", async () => {
      const karens = nyttMinnesKarens();
      await runMediaCleanup(deps({ karens, now: () => T0 }).d, { dryRun: false });
      const fore = deps({ karens, now: () => T0 + 3 * DAG - 1 });
      expect((await runMediaCleanup(fore.d, { dryRun: false })).raderade).toBe(0);
      const efter = deps({ karens, now: () => T0 + 3 * DAG });
      const s = await runMediaCleanup(efter.d, { dryRun: false });
      expect(efter.raderade.flat().sort()).toEqual(["a2", "b1"]);
      expect(s.mogna).toBe(2);
      expect(s.iKarens).toBe(0);
    });

    it("torrkörningen antecknar också, så nästa skarpa körning efter karenstiden raderar", async () => {
      const karens = nyttMinnesKarens();
      const torr = deps({ karens, now: () => T0 });
      const s0 = await runMediaCleanup(torr.d, { dryRun: true });
      expect(torr.raderade).toEqual([]);
      expect(s0.iKarens).toBe(2);
      const skarp = deps({ karens, now: () => T0 + 3 * DAG });
      await runMediaCleanup(skarp.d, { dryRun: false });
      expect(skarp.raderade.flat().sort()).toEqual(["a2", "b1"]);
    });

    it("☠️ en fil som används igen glöms, och klockan börjar om när den blir oanvänd", async () => {
      const karens = nyttMinnesKarens();
      await runMediaCleanup(deps({ karens, now: () => T0 }).d, { dryRun: false });
      // Dag 1: b1 sitter på en produkt igen.
      await runMediaCleanup(deps({
        karens, now: () => T0 + DAG,
        listaAnvanda: async () => ({ urls: [url("a1"), url("b1")], antalProdukter: 1 }),
      }).d, { dryRun: false });
      // Dag 3: b1 är oanvänd igen. a2 har varit oanvänd hela tiden och raderas.
      const dag3 = deps({ karens, now: () => T0 + 3 * DAG });
      const s = await runMediaCleanup(dag3.d, { dryRun: false });
      expect(dag3.raderade.flat()).toEqual(["a2"]);
      expect(s.iKarens).toBe(1);
    });

    it("☠️ faller bokföringen raderas ingenting", async () => {
      const { d, raderade } = deps({
        karens: { registrera: async () => { throw new Error("DATABASE_URL saknas"); }, lasAlla: async () => [], glom: async () => {} },
      });
      await expect(runMediaCleanup(d, { dryRun: false })).rejects.toThrow(/DATABASE_URL/);
      expect(raderade).toEqual([]);
    });

    it("en fil utan antecknad tid raderas inte", async () => {
      const { d, raderade } = deps({
        karens: { registrera: async () => new Map(), lasAlla: async () => [], glom: async () => {} },
      });
      const s = await runMediaCleanup(d, { dryRun: false });
      expect(raderade).toEqual([]);
      expect(s.iKarens).toBe(2);
    });

    it("faller städningen av tabellen efter raderingen syns det, men filerna räknas som raderade", async () => {
      let glomd = 0;
      const { d, raderade } = deps({
        karens: {
          registrera: async (idn, nu) => new Map(idn.map((id) => [id, nu - KARENS_MS])),
          lasAlla: async () => [],
          glom: async (idn) => { if (glomd++ > 0 && idn.length) throw new Error("nätverksfel"); },
        },
      });
      const s = await runMediaCleanup(d, { dryRun: false });
      expect(raderade.flat().sort()).toEqual(["a2", "b1"]);
      expect(s.raderade).toBe(2);
      expect(s.errors.join(" ")).toMatch(/karenstabellen: nätverksfel/);
    });

    it("☠️ en gammal fil utanför fönstret som tas i bruk glöms, så klockan börjar om", async () => {
      // Gamla filer ligger utanför nattens fönster och ses annars bara vid en
      // full genomgång. Läsarna läser hela katalogen, så användningen syns ändå.
      const karens = nyttMinnesKarens();
      const gammal = fil("aosom-G-1.jpg", "g1");
      await runMediaCleanup(deps({ karens, now: () => T0,
        listaFiler: async () => ({ filer: [gammal], cursor: null, komplett: true }) }).d, { dryRun: true });
      // Dag 1: g1 sitter på en produkt igen, men nattens fönster ser bara nya filer.
      await runMediaCleanup(deps({ karens, now: () => T0 + DAG,
        listaAnvanda: async () => ({ urls: [url("a1"), url("g1")], antalProdukter: 1 }) }).d, { dryRun: false });
      // Dag 3: g1 släpps igen, och en full genomgång ser den oanvänd.
      const dag3 = deps({ karens, now: () => T0 + 3 * DAG,
        listaFiler: async () => ({ filer: [gammal], cursor: null, komplett: true }) });
      const s = await runMediaCleanup(dag3.d, { dryRun: false });
      expect(dag3.raderade).toEqual([]);
      expect(s.iKarens).toBe(1);
    });

    it("limit gäller de mogna filerna", async () => {
      const { d, raderade } = deps();
      const s = await runMediaCleanup(d, { dryRun: false, limit: 1 });
      expect(raderade.flat()).toHaveLength(1);
      expect(s.stoppedBy).toBe("limit");
    });
  });
});

describe("kontrolleraSammaSajt", () => {
  it("☠️ olika sajter för filerna och ordrarna stoppar körningen", () => {
    expect(() => kontrolleraSammaSajt("annan-sajt", "e6d27e90-4749-4720-9afe-0bbe91c1b3d3")).toThrow(/olika sajter/);
  });
  it("samma sajt, eller ingen WIX_SITE_ID, går igenom", () => {
    expect(() => kontrolleraSammaSajt("e6d27e90-4749-4720-9afe-0bbe91c1b3d3", "e6d27e90-4749-4720-9afe-0bbe91c1b3d3")).not.toThrow();
    expect(() => kontrolleraSammaSajt(undefined, "e6d27e90-4749-4720-9afe-0bbe91c1b3d3")).not.toThrow();
  });
});

describe("kontrolleraProduktsvep", () => {
  it("☠️ ett svep som tappat sidor fäller körningen", () => {
    expect(() => kontrolleraProduktsvep(5_000, true, 6_300)).toThrow(/såg 5000 av 6300/);
  });
  it("☠️ ett svep som nådde sidtaket fäller körningen", () => {
    expect(() => kontrolleraProduktsvep(6_300, false, 0)).toThrow(/sidtaket/);
  });
  it("☠️ en räknare som inte svarade med något antal fäller körningen, den stänger inte av jämförelsen", () => {
    // countProducts gör ett svar utan `count` till 0.
    expect(() => kontrolleraProduktsvep(6_300, true, 0)).toThrow(/räknare svarade 0/);
  });

  it("en import medan svepet pågår är inget fel (högst fem färre)", () => {
    expect(() => kontrolleraProduktsvep(6_295, true, 6_300)).not.toThrow();
    expect(() => kontrolleraProduktsvep(6_294, true, 6_300)).toThrow();
  });
});
