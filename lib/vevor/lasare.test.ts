import { gzipSync } from "node:zlib";
import { beforeEach, describe, expect, it } from "vitest";
import { ANVANDARAGENT, MIN_MELLANRUM_MS, type Hamtare } from "./hamtning";
import { korVevorLasare, loggrad, NYA_KARTRADER_PER_KORNING, type LasarDeps } from "./lasare";
import { MinnesVevorLager, type Avlasning, type Sidrad } from "./lager";
import { reglerFor, tolkaRobots } from "./robots";
import type { Prioritetsunderlag } from "./prioritet";
import { vevorRad } from "./rad";
import { testsida, VEVOR_ROBOTS, type Testsida } from "./testsida";

const START = Date.parse("2026-10-29T12:00:00.000Z");
const TIMME = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();
const wid = (n: number) => String(n).padStart(12, "0");
const sokvag = (n: number) => `/test-c_1/produkt-${n}-p_${wid(n)}`;
const skuFor = (n: number) => `TESTSKU${wid(n)}`;

interface Miljo {
  lager: MinnesVevorLager;
  deps: LasarDeps;
  anrop: { url: string; at: number; ua: string }[];
  larm: string[];
  /** Svar per sidnummer. Saknas ett: en giltig sida i lager. */
  svar: Map<number, () => Response>;
  karta: { xml: string | null };
  /** robots.txt-svaret. */
  robots: { svar: () => Response };
  underlag: Prioritetsunderlag;
  nu: () => number;
  flytta: (ms: number) => void;
}

let m: Miljo;

function miljo(): Miljo {
  let nu = START;
  const lager = new MinnesVevorLager();
  const anrop: Miljo["anrop"] = [];
  const larm: string[] = [];
  const svar = new Map<number, () => Response>();
  const karta = { xml: null as string | null };
  const robots = { svar: () => new Response(VEVOR_ROBOTS, { status: 200 }) };
  const underlag: Prioritetsunderlag = { produkter: [], obestallda: new Set(), iAuktion: new Set() };
  const hamtare: Hamtare = async (url, init) => {
    anrop.push({ url, at: nu, ua: (init.headers as Record<string, string>)["User-Agent"] });
    nu += 300;
    const vag = new URL(url).pathname;
    if (vag === "/robots.txt") return robots.svar();
    if (vag === "/sitemap/sitemap-index.xml") {
      return new Response(
        `<sitemapindex><sitemap><loc>https://eur.vevor.com/sitemap/sitemap_product_1.xml.gz</loc></sitemap></sitemapindex>`,
        { status: 200 },
      );
    }
    if (vag === "/sitemap/sitemap_product_1.xml.gz") {
      return karta.xml ? new Response(gzipSync(karta.xml), { status: 200 }) : new Response("", { status: 500 });
    }
    const n = Number(/-p_(\d+)$/.exec(vag)?.[1]);
    const f = svar.get(n);
    if (f) return f();
    return new Response(testsida({ sku: skuFor(n), webbId: wid(n) }), { status: 200 });
  };
  const deps: LasarDeps = {
    lager,
    hamtare,
    klocka: () => nu,
    vanta: async (ms) => {
      nu += ms;
    },
    prioritetsunderlag: async () => underlag,
    larma: async (amne) => {
      larm.push(amne);
    },
  };
  return { lager, deps, anrop, larm, svar, karta, robots, underlag, nu: () => nu, flytta: (ms) => (nu += ms) };
}

function rad(n: number, over: Partial<Sidrad> = {}): Sidrad {
  return {
    webbId: wid(n),
    sokvag: sokvag(n),
    klass: "utkast",
    nastaLasning: iso(START - 60_000),
    sku: skuFor(n),
    senastForsokAt: null,
    senastUtfall: null,
    senastOkAt: null,
    iKartan: true,
    saknadIKartanSedan: null,
    saknasForstaAt: null,
    borta: false,
    ...over,
  };
}

function laggIKon(...n: number[]) {
  for (const i of n) m.lager.sidrader.set(wid(i), rad(i));
}

const sida = (n: number, over: Partial<Testsida> = {}) => () =>
  new Response(testsida({ sku: skuFor(n), webbId: wid(n), ...over }), { status: 200 });

const kor = (over: { manuell?: boolean; maxSidor?: number } = {}) =>
  korVevorLasare(m.deps, { manuell: over.manuell ?? true, maxSidor: over.maxSidor ?? 100, budgetMs: 240_000 });

/** robots.txt som läsaren hade läst och sparat. */
const sparadRobots = (regler = VEVOR_ROBOTS) => ({ at: iso(START), ...reglerFor(tolkaRobots(regler)) });

beforeEach(() => {
  m = miljo();
  // Kartan och robots.txt räknas som lästa, så att testerna bara läser kön.
  // Deras egna tester sätter null.
  m.lager.tillstand = { ...m.lager.tillstand, kartaAt: iso(START), prioriteradAt: iso(START), robots: sparadRobots() };
});

describe("strömbrytaren, frysningen och låset", () => {
  it("avstängd: schemat läser ingenting", async () => {
    laggIKon(1);
    const s = await kor({ manuell: false });
    expect(s.utfall).toBe("avstangd");
    expect(m.anrop).toHaveLength(0);
  });

  it("☠️ fryst: ingenting läses, inte ens för hand", async () => {
    laggIKon(1);
    m.lager.tillstand.fryst = { at: iso(START - TIMME), skal: "429" };
    const s = await kor({ manuell: true });
    expect(s.utfall).toBe("fryst");
    expect(m.anrop).toHaveLength(0);
  });

  it("upptagen: en annan körning håller låset", async () => {
    laggIKon(1);
    m.lager.las = { agare: "annan", utgar: START + 60_000 };
    expect((await kor()).utfall).toBe("upptagen");
    expect(m.anrop).toHaveLength(0);
  });

  it("påslagen: schemat läser", async () => {
    laggIKon(1);
    m.lager.tillstand.aktiv = true;
    expect((await kor({ manuell: false })).utfall).toBe("klar");
  });
});

describe("en vanlig körning", () => {
  it("läser förfallna sidor i takt, ärligt, på svenska och i kronor, och sparar en avläsning per artikel", async () => {
    laggIKon(1, 2, 3, 4, 5);
    const s = await kor();
    expect(s).toMatchObject({ utfall: "klar", lasta: 5, giltiga: 5, iLager: 5 });
    expect(m.lager.avlasningsrader.size).toBe(5);
    expect(m.lager.avlasningsrader.get(skuFor(3))).toMatchObject({ webbId: wid(3), status: "i_lager", prisSek: 999.5 });
    for (let i = 1; i < m.anrop.length; i++) {
      expect(m.anrop[i].at - m.anrop[i - 1].at).toBeGreaterThanOrEqual(MIN_MELLANRUM_MS);
    }
    for (const a of m.anrop) {
      expect(a.ua).toBe(ANVANDARAGENT);
      expect(a.url).toMatch(/^https:\/\/eur\.vevor\.com\/test-c_1\/produkt-\d+-p_\d+\?lang=sv&currency=SEK$/);
    }
    const r = m.lager.sidrader.get(wid(1))!;
    expect(r).toMatchObject({ senastUtfall: "ok", klass: "utkast" });
    expect(Date.parse(r.nastaLasning) - START).toBe(24 * TIMME);
  });

  it("en aldrig läst sida blir utkast efter första läsningen", async () => {
    m.lager.sidrader.set(wid(1), rad(1, { klass: "katalog", sku: null }));
    await kor();
    expect(m.lager.sidrader.get(wid(1))).toMatchObject({ klass: "utkast", sku: skuFor(1) });
  });

  it("högst `maxSidor` ur kön", async () => {
    laggIKon(1, 2, 3, 4, 5);
    expect((await kor({ maxSidor: 2 })).lasta).toBe(2);
  });

  it("en avläsning som inte sparades: sidan läses om snart och ser inte klar ut", async () => {
    laggIKon(1, 2);
    m.lager.sparfelAvlasningar.add(skuFor(2));
    const s = await kor();
    expect(s.skrivna).toMatchObject({ avlasningar: 1, fel: 1 });
    expect(m.lager.sidrader.get(wid(2))).toMatchObject({ senastUtfall: "skrivfel", nastaLasning: iso(START + 30 * 60_000) });
  });

  it("fem tillfälliga fel i följd: slutar läsa, men skriver det som lästs", async () => {
    laggIKon(1, 2, 3, 4, 5, 6, 7, 8);
    for (const n of [2, 3, 4, 5, 6]) m.svar.set(n, () => new Response("fel", { status: 502 }));
    const s = await kor();
    expect(s.tillfalliga).toBe(5);
    expect(s.lasta).toBe(6);
    expect(m.lager.avlasningsrader.has(skuFor(1))).toBe(true);
    expect(m.lager.sidrader.get(wid(3))?.senastUtfall).toBe("tillfalligt");
  });

  it("☠️ loggraden och svaret bär inga artikelnummer eller adresser", async () => {
    laggIKon(1, 2);
    const s = await kor();
    const ut = JSON.stringify(s) + loggrad(s);
    expect(ut).not.toContain("TESTSKU");
    expect(ut).not.toContain("p_0000");
    expect(ut).not.toContain("produkt-");
  });
});

describe("☠️ spärrar från VEVOR fryser läsaren", () => {
  for (const [namn, f] of [
    ["429", () => new Response("", { status: 429 })],
    ["403", () => new Response("", { status: 403 })],
    ["captcha", () => new Response(`<html><body>${"x".repeat(3000)}<div class="captcha"></div></body></html>`, { status: 200 })],
    ["tom", () => new Response("", { status: 200 })],
  ] as const) {
    it(`${namn}: ingenting från körningen skrivs, larmet går, och nästa körning läser inget`, async () => {
      laggIKon(1, 2, 3, 4);
      m.svar.set(3, f);
      const fore = structuredClone([...m.lager.sidrader.values()]);
      const s = await kor();
      expect(s.utfall).toBe("stoppad");
      expect(s.blockerad).toBe(namn);
      expect(m.lager.tillstand.fryst?.skal).toBe(namn);
      expect(m.lager.avlasningsrader.size).toBe(0);
      expect([...m.lager.sidrader.values()]).toEqual(fore);
      expect(m.larm.some((l) => l.includes("fryst"))).toBe(true);
      // Sidan efter spärren läses aldrig.
      expect(m.anrop.some((a) => a.url.includes(`p_${wid(4)}`))).toBe(false);

      m.anrop.length = 0;
      m.lager.tillstand.aktiv = true;
      expect((await kor({ manuell: false })).utfall).toBe("fryst");
      expect((await kor({ manuell: true })).utfall).toBe("fryst");
      expect(m.anrop).toHaveLength(0);
    });
  }
});

describe("☠️ spärrarna i körningen skriver ingenting", () => {
  it("fler än 10 % otolkbara (här fel valuta)", async () => {
    const n = Array.from({ length: 20 }, (_, i) => i + 1);
    laggIKon(...n);
    for (const i of [3, 7, 11]) m.svar.set(i, sida(i, { valuta: "EUR" }));
    const s = await kor();
    expect(s.utfall).toBe("stoppad");
    expect(s.tolkningsfel.fel_valuta).toBe(3);
    expect(m.lager.avlasningsrader.size).toBe(0);
    expect(m.lager.sidrader.get(wid(1))?.senastUtfall).toBeNull();
    // Ett enstaka stopp larmar inte: det kan vara en slumpvis klunga.
    expect(m.larm).toHaveLength(0);
    expect(m.lager.tillstand.stoppIFoljd).toBe(1);
  });

  it("10 % eller färre otolkbara skrivs, och de otolkbara läses om senare", async () => {
    const n = Array.from({ length: 20 }, (_, i) => i + 1);
    laggIKon(...n);
    for (const i of [3, 7]) m.svar.set(i, sida(i, { valuta: "EUR" }));
    const s = await kor();
    expect(s.utfall).toBe("klar");
    expect(m.lager.avlasningsrader.size).toBe(18);
    expect(m.lager.sidrader.get(wid(3))?.senastUtfall).toBe("tolkningsfel:fel_valuta");
  });

  it("fler än 40 % slutsålda", async () => {
    const n = Array.from({ length: 60 }, (_, i) => i + 1);
    laggIKon(...n);
    for (const i of n.slice(0, 30)) m.svar.set(i, sida(i, { lager: 0, tillganglighet: "https://schema.org/OutOfStock" }));
    const s = await kor();
    expect(s.utfall).toBe("stoppad");
    expect(s.slutsalda).toBe(30);
    expect(m.lager.avlasningsrader.size).toBe(0);
  });

  it("fler än 20 % saknade", async () => {
    const n = Array.from({ length: 30 }, (_, i) => i + 1);
    laggIKon(...n);
    for (const i of n.slice(0, 8)) m.svar.set(i, () => new Response(testsida({ utanProdukt: true }), { status: 404 }));
    const s = await kor();
    expect(s.utfall).toBe("stoppad");
    expect(m.lager.sidrader.get(wid(1))?.saknasForstaAt).toBeNull();
  });

  it("☠️ larmet går vid tredje stoppet i följd, och sedan inte varje körning", async () => {
    // Alla sidor i fel valuta: ett verkligt fel som stoppar varje körning.
    const n = Array.from({ length: 20 }, (_, i) => i + 1);
    laggIKon(...n);
    for (const i of n) m.svar.set(i, sida(i, { valuta: "EUR" }));
    for (let k = 0; k < 2; k++) {
      expect((await kor()).utfall).toBe("stoppad");
      m.flytta(3 * TIMME);
    }
    expect(m.larm).toHaveLength(0);
    await kor();
    expect(m.lager.tillstand.stoppIFoljd).toBe(3);
    expect(m.larm).toHaveLength(1);
    m.flytta(3 * TIMME);
    await kor();
    expect(m.larm).toHaveLength(1);
    expect(m.lager.avlasningsrader.size).toBe(0);
  });

  it("en körning som skriver nollar räkningen av stopp i följd", async () => {
    laggIKon(1, 2);
    m.lager.tillstand.stoppIFoljd = 2;
    expect((await kor()).utfall).toBe("klar");
    expect(m.lager.tillstand.stoppIFoljd).toBe(0);
  });

  it("☠️ en spärr låser inte kön: sidorna läggs tillbaka utspridda, och nästa körning läser andra", async () => {
    // 100 sidor i köordning, de 40 första slutsålda: en klunga. Läsaren tar 60 per körning.
    const n = Array.from({ length: 100 }, (_, i) => i + 1);
    laggIKon(...n);
    for (const i of n) m.lager.sidrader.get(wid(i))!.nastaLasning = iso(START - (200 - i) * 60_000);
    for (const i of n.slice(0, 40)) m.svar.set(i, sida(i, { lager: 0, tillganglighet: "https://schema.org/OutOfStock" }));
    let slump = 0;
    m.deps.slump = () => (slump = (slump + 0.37) % 1);
    const s = await kor({ maxSidor: 60 });
    expect(s.utfall).toBe("stoppad");
    expect(s.aterlagda).toBe(60);
    const tider = n.slice(0, 60).map((i) => Date.parse(m.lager.sidrader.get(wid(i))!.nastaLasning) - START);
    expect(Math.min(...tider)).toBeGreaterThanOrEqual(5 * 60_000);
    expect(Math.max(...tider)).toBeLessThanOrEqual(2 * TIMME);
    expect(new Set(tider).size).toBeGreaterThan(1);
    // Inga avläsningar, inga signaler: bara köns tid.
    expect(m.lager.avlasningsrader.size).toBe(0);
    expect(m.lager.sidrader.get(wid(1))).toMatchObject({ senastUtfall: null, sku: skuFor(1) });

    // Nästa körning läser de 40 som inte lästes, i stället för samma 60 igen.
    m.anrop.length = 0;
    m.flytta(60_000);
    const s2 = await kor({ maxSidor: 60 });
    expect(s2.utfall).toBe("klar");
    expect(s2.giltiga).toBe(40);
    expect(m.anrop.map((a) => Number(/p_(\d+)/.exec(a.url)?.[1])).sort((a, b) => a - b)).toEqual(n.slice(60));
  });
});

describe("kontrollsidorna", () => {
  it("☠️ en kontrollsida utan pris stoppar alla skrivningar", async () => {
    laggIKon(1, 2, 3);
    m.lager.tillstand.kontroller = [wid(1)];
    m.svar.set(1, sida(1, { pris: null }));
    const s = await kor();
    expect(s.utfall).toBe("stoppad");
    expect(s.kontroller).toMatchObject({ lasta: 1, fel: 1 });
    expect(m.lager.avlasningsrader.size).toBe(0);
    // Kön läses inte när en kontroll fallit.
    expect(m.anrop).toHaveLength(1);
  });

  it("en kontrollsida som försvunnit byts ut, och körningen fortsätter", async () => {
    laggIKon(1, 2, 3);
    m.lager.tillstand.kontroller = [wid(1)];
    m.svar.set(1, () => new Response(testsida({ utanProdukt: true }), { status: 404 }));
    const s = await kor();
    expect(s.utfall).toBe("klar");
    expect(s.kontroller).toMatchObject({ lasta: 1, ersatta: 1 });
    expect(m.lager.avlasningsrader.size).toBe(2);
    // Påfylld med kända produkter i lager.
    expect(m.lager.tillstand.kontroller.sort()).toEqual([wid(2), wid(3)]);
  });

  it("kontrollsidornas avläsningar skrivs som vanliga avläsningar", async () => {
    laggIKon(1, 2);
    m.lager.tillstand.kontroller = [wid(1)];
    m.lager.sidrader.get(wid(1))!.nastaLasning = iso(START + 10 * TIMME);
    const s = await kor();
    expect(s.kontroller.ok).toBe(1);
    expect(m.lager.avlasningsrader.has(skuFor(1))).toBe(true);
  });
});

describe("☠️ borta kräver två signaler med minst ett dygn emellan", () => {
  const forstaAvlasning = async () => {
    laggIKon(1);
    await kor();
    expect(m.lager.avlasningsrader.get(skuFor(1))?.status).toBe("i_lager");
  };

  it("en 404 är en signal; nästa 404 mer än ett dygn senare gör sidan och artikeln borta", async () => {
    await forstaAvlasning();
    m.svar.set(1, () => new Response(testsida({ utanProdukt: true }), { status: 404 }));
    m.flytta(24 * TIMME);
    await kor();
    let r = m.lager.sidrader.get(wid(1))!;
    expect(r).toMatchObject({ borta: false, senastUtfall: "saknas" });
    expect(r.saknasForstaAt).not.toBeNull();
    expect(m.lager.avlasningsrader.get(skuFor(1))?.borta).toBe(false);

    m.flytta(25 * TIMME);
    const s = await kor();
    r = m.lager.sidrader.get(wid(1))!;
    expect(r.borta).toBe(true);
    expect(s.skrivna.borta).toBe(1);
    expect(m.lager.avlasningsrader.get(skuFor(1))).toMatchObject({ borta: true, status: "borta" });

    // Kommer sidan tillbaka nollställs borta av en giltig läsning.
    m.svar.delete(1);
    m.flytta(8 * 24 * TIMME);
    await kor();
    expect(m.lager.sidrader.get(wid(1))).toMatchObject({ borta: false, saknasForstaAt: null });
    expect(m.lager.avlasningsrader.get(skuFor(1))).toMatchObject({ borta: false, status: "i_lager" });
  });

  it("två 404 samma dygn räcker inte", async () => {
    await forstaAvlasning();
    m.svar.set(1, () => new Response(testsida({ utanProdukt: true }), { status: 404 }));
    m.flytta(24 * TIMME);
    await kor();
    const r = m.lager.sidrader.get(wid(1))!;
    m.lager.sidrader.set(wid(1), { ...r, nastaLasning: iso(m.nu()) });
    m.flytta(2 * TIMME);
    await kor();
    expect(m.lager.sidrader.get(wid(1))?.borta).toBe(false);
  });

  it("en sida som läses giltig är aldrig borta, vad kartan än säger", async () => {
    m.lager.sidrader.set(wid(1), rad(1, { iKartan: false, saknadIKartanSedan: iso(START - 3 * 24 * TIMME), saknasForstaAt: iso(START - 2 * 24 * TIMME) }));
    await kor();
    expect(m.lager.sidrader.get(wid(1))).toMatchObject({ borta: false, saknasForstaAt: null, senastUtfall: "ok" });
  });

  it("en sida utan produktdata är en signal bara när adressen saknats i kartan ett dygn", async () => {
    const utanData = () => new Response(testsida({ utanProdukt: true }), { status: 200 });
    m.lager.sidrader.set(wid(1), rad(1));
    m.lager.sidrader.set(wid(2), rad(2, { iKartan: false, saknadIKartanSedan: iso(START - 2 * 24 * TIMME) }));
    m.svar.set(1, utanData);
    m.svar.set(2, utanData);
    await kor();
    expect(m.lager.sidrader.get(wid(1))).toMatchObject({ senastUtfall: "tolkningsfel:ej_produktsida", saknasForstaAt: null });
    expect(m.lager.sidrader.get(wid(2))?.senastUtfall).toBe("saknas");
  });

  it("en flytt till en annan produktsida: den gamla får en signal och den nya läggs i kön", async () => {
    laggIKon(1);
    m.svar.set(1, () => new Response("", { status: 301, headers: { location: sokvag(9) } }));
    const s = await kor();
    expect(s.flyttade).toBe(1);
    expect(m.lager.sidrader.get(wid(1))?.saknasForstaAt).not.toBeNull();
    expect(m.lager.sidrader.get(wid(9))).toMatchObject({ klass: "katalog", sokvag: sokvag(9) });
  });
});

describe("kartan", () => {
  const xml = (antal: number, fran = 1) =>
    `<urlset>${Array.from({ length: antal }, (_, i) => `<url><loc>https://eur.vevor.com${sokvag(i + fran)}</loc></url>`).join("")}</urlset>`;

  it("nya adresser läggs i kön, högst 500 per körning, och kartan räknas klar först när alla ligger där", async () => {
    m.lager.tillstand.kartaAt = null;
    m.karta.xml = xml(5_100);
    const s1 = await kor({ maxSidor: 5 });
    expect(s1.karta).toMatchObject({ lasta: 5_100, nya: NYA_KARTRADER_PER_KORNING, kvar: 5_100 - NYA_KARTRADER_PER_KORNING });
    expect(m.lager.sidrader.size).toBe(NYA_KARTRADER_PER_KORNING);
    expect(m.lager.tillstand.kartaAt).toBeNull();
    expect(s1.giltiga).toBe(5);
  });

  it("en adress som försvinner ur kartan läses om direkt men blir inte borta för det", async () => {
    const kanda = Array.from({ length: 5_050 }, (_, i) => i + 1);
    for (const i of kanda) m.lager.sidrader.set(wid(i), rad(i, { nastaLasning: iso(START + 20 * TIMME) }));
    m.lager.tillstand.kartaAt = null;
    m.karta.xml = xml(5_049); // nummer 5 050 saknas
    const s = await kor({ maxSidor: 5 });
    expect(s.karta).toMatchObject({ borta: 1, nya: 0 });
    expect(m.lager.tillstand.kartaAt).toBe(iso(START));
    expect(m.lager.sidrader.get(wid(5_050))).toMatchObject({ iKartan: false, borta: false, senastUtfall: "ok" });
  });

  it("☠️ en karta som är mycket mindre än det vi känner rör ingenting", async () => {
    const kanda = Array.from({ length: 7_000 }, (_, i) => i + 1);
    for (const i of kanda) m.lager.sidrader.set(wid(i), rad(i, { nastaLasning: iso(START + 20 * TIMME) }));
    m.lager.tillstand.kartaAt = null;
    m.karta.xml = xml(5_100);
    const s = await kor();
    expect(s.karta?.borta).toBe(0);
    expect([...m.lager.sidrader.values()].every((r) => r.iKartan)).toBe(true);
    expect(m.larm.some((l) => l.includes("kartan"))).toBe(true);
  });

  it("☠️ en spärr på kartan fryser läsaren", async () => {
    m.lager.tillstand.kartaAt = null;
    const hamtare = m.deps.hamtare!;
    m.deps.hamtare = async (url, init) =>
      url.endsWith("sitemap-index.xml") ? new Response("", { status: 429 }) : hamtare(url, init);
    const s = await kor();
    expect(s.blockerad).toBe("429");
    expect(m.lager.tillstand.fryst?.skal).toBe("429");
  });
});

describe("prioriteringen", () => {
  it("publicerade läses var fjärde timme, lågt lager och obeställda ordrar varje timme", async () => {
    laggIKon(1, 2, 3);
    for (const i of [1, 2, 3]) m.lager.sidrader.get(wid(i))!.nastaLasning = iso(START + 20 * TIMME);
    for (const i of [1, 2, 3]) m.lager.sidrader.get(wid(i))!.senastOkAt = iso(START - 2 * TIMME);
    m.lager.avlasningsrader.set(skuFor(2), { saldo: 2, sku: skuFor(2) } as Avlasning);
    m.underlag.produkter.push(
      { wixProductId: "w1", sku: skuFor(1), publicerad: true },
      { wixProductId: "w2", sku: skuFor(2), publicerad: true },
      { wixProductId: "w3", sku: skuFor(3), publicerad: false },
    );
    m.underlag.obestallda.add("w3");
    m.lager.tillstand.prioriteradAt = null;
    const s = await kor();
    expect(s.prioritet).toEqual({ het: 2, publicerad: 1, andrade: 3 });
    expect(m.lager.sidrader.get(wid(1))).toMatchObject({ klass: "publicerad", nastaLasning: iso(START + 2 * TIMME) });
    expect(m.lager.sidrader.get(wid(2))?.klass).toBe("het");
    expect(m.lager.sidrader.get(wid(3))?.klass).toBe("het");
    expect(m.lager.tillstand.prioriteradAt).toBe(iso(START));
  });

  it("en prioritering som faller stoppar inte läsningen", async () => {
    laggIKon(1);
    m.lager.tillstand.prioriteradAt = null;
    m.deps.prioritetsunderlag = async () => {
      throw new Error("Wix svarade inte");
    };
    const s = await kor();
    expect(s.utfall).toBe("klar");
    expect(s.giltiga).toBe(1);
    expect(m.lager.tillstand.prioriteradAt).toBeNull();
  });
});

describe("robots.txt i körningen", () => {
  beforeEach(() => {
    m.lager.tillstand.robots = null;
  });

  it("läses först, i takt och ärligt, och sparas med datum", async () => {
    laggIKon(1);
    const s = await kor();
    expect(s.utfall).toBe("klar");
    expect(m.anrop[0].url).toBe("https://eur.vevor.com/robots.txt");
    expect(m.anrop[0].ua).toBe(ANVANDARAGENT);
    expect(m.anrop[1].at - m.anrop[0].at).toBeGreaterThanOrEqual(MIN_MELLANRUM_MS);
    expect(s.robots).toMatchObject({ hamtad: true, crawlDelaySek: null });
    expect(m.lager.tillstand.robots?.at).toBe(iso(START));
    expect(m.lager.tillstand.robots?.regler.length).toBeGreaterThan(0);
  });

  it("läses om först när den är ett dygn gammal", async () => {
    laggIKon(1);
    m.lager.tillstand.robots = { ...sparadRobots(), at: iso(START - 23 * TIMME) };
    await kor();
    expect(m.anrop.some((a) => a.url.endsWith("/robots.txt"))).toBe(false);
    m.lager.tillstand.robots = { ...sparadRobots(), at: iso(START - 24 * TIMME) };
    m.anrop.length = 0;
    await kor();
    expect(m.anrop[0].url).toBe("https://eur.vevor.com/robots.txt");
  });

  it("☠️ en robots.txt som inte går att läsa: ingenting läses, kön står orörd", async () => {
    laggIKon(1, 2);
    m.robots.svar = () => new Response("fel", { status: 503 });
    const fore = structuredClone([...m.lager.sidrader.values()]);
    const s = await kor();
    expect(s.utfall).toBe("stoppad");
    expect(s.skal).toBe("robots.txt gick inte att läsa");
    expect(m.anrop).toHaveLength(1);
    expect([...m.lager.sidrader.values()]).toEqual(fore);
    expect(m.lager.tillstand.robots).toBeNull();
    expect(m.lager.tillstand.stoppIFoljd).toBe(1);
  });

  it("☠️ en spärr på robots.txt fryser läsaren, också en spärrsida med status 200", async () => {
    laggIKon(1);
    m.robots.svar = () => new Response("", { status: 429 });
    expect((await kor()).blockerad).toBe("429");
    expect(m.lager.tillstand.fryst?.skal).toBe("429");

    m = miljo();
    m.lager.tillstand = { ...m.lager.tillstand, kartaAt: iso(START), prioriteradAt: iso(START) };
    laggIKon(1);
    m.robots.svar = () => new Response(`<html><body>${"x".repeat(3000)}<div class="captcha"></div></body></html>`, { status: 200 });
    expect((await kor()).blockerad).toBe("captcha");
  });

  it("en robots.txt som saknas betyder att allt är tillåtet", async () => {
    laggIKon(1);
    m.robots.svar = () => new Response("", { status: 404 });
    const s = await kor();
    expect(s.utfall).toBe("klar");
    expect(s.giltiga).toBe(1);
    expect(m.lager.tillstand.robots?.regler).toEqual([]);
  });

  it("☠️ en spärrad sida hämtas aldrig, läses om efter ett dygn, och artikeln blir okänd", async () => {
    laggIKon(1, 2);
    await kor();
    expect(m.lager.avlasningsrader.get(skuFor(2))?.misslyckadAt).toBeNull();
    m.robots.svar = () => new Response(`User-agent: *\nDisallow: /test-c_1/produkt-2-\n`, { status: 200 });
    m.lager.tillstand.robots = null;
    for (const i of [1, 2]) m.lager.sidrader.get(wid(i))!.nastaLasning = iso(m.nu());
    m.anrop.length = 0;
    m.flytta(TIMME);
    const s = await kor();
    expect(s.sparrade).toBe(1);
    expect(s.giltiga).toBe(1);
    expect(m.anrop.some((a) => a.url.includes(`p_${wid(2)}`))).toBe(false);
    const r2 = m.lager.sidrader.get(wid(2))!;
    expect(r2.senastUtfall).toBe("sparrad");
    expect(Date.parse(r2.nastaLasning) - Date.parse(r2.senastForsokAt!)).toBe(24 * TIMME);
    expect(m.lager.avlasningsrader.get(skuFor(2))?.misslyckadAt).not.toBeNull();
    expect(s.skrivna.misslyckade).toBe(1);
  });

  it("☠️ vår egen grupp gäller: Disallow: / läser ingenting, och larmet går", async () => {
    const n = Array.from({ length: 12 }, (_, i) => i + 1);
    laggIKon(...n);
    m.robots.svar = () => new Response(`User-agent: *\nDisallow:\n\nUser-agent: FyndplatsBot\nDisallow: /\n`, { status: 200 });
    const s = await kor();
    expect(s.sparrade).toBe(12);
    expect(s.lasta).toBe(0);
    expect(m.anrop).toHaveLength(1);
    expect(m.larm.some((l) => l.includes("robots.txt spärrar"))).toBe(true);
  });

  it("en Crawl-delay följs", async () => {
    laggIKon(1, 2, 3);
    m.robots.svar = () => new Response(`User-agent: *\nCrawl-delay: 4\n`, { status: 200 });
    await kor();
    for (let i = 1; i < m.anrop.length; i++) expect(m.anrop[i].at - m.anrop[i - 1].at).toBeGreaterThanOrEqual(4_000);
  });

  it("☠️ en karta som robots.txt spärrar hämtas inte", async () => {
    m.lager.tillstand.kartaAt = null;
    m.robots.svar = () => new Response(`User-agent: *\nDisallow: /sitemap/\n`, { status: 200 });
    const s = await kor();
    expect(m.anrop.some((a) => a.url.includes("sitemap"))).toBe(false);
    expect(s.karta?.lasta).toBe(0);
    expect(m.lager.tillstand.kartaAt).toBeNull();
    expect(m.larm.some((l) => l.includes("robots.txt spärrar kartan"))).toBe(true);
  });
});

describe("☠️ kontrollsidorna får inte låsa läsaren", () => {
  it("en kontrollsida som inte går att tolka stoppar körningen, byts ut och väljs inte igen", async () => {
    laggIKon(1, 2, 3, 4, 5);
    await kor();
    m.lager.tillstand.kontroller = [wid(1)];
    m.svar.set(1, sida(1, { pris: null }));
    for (const i of [1, 2, 3, 4, 5]) m.lager.sidrader.get(wid(i))!.nastaLasning = iso(m.nu());
    m.flytta(TIMME);
    const t0 = m.nu();
    const s = await kor();
    expect(s.utfall).toBe("stoppad");
    expect(s.kontroller).toMatchObject({ lasta: 1, fel: 1 });
    // Sidan 1 har fortfarande en avläsning i lager, men väljs inte igen.
    expect(m.lager.avlasningsrader.get(skuFor(1))?.status).toBe("i_lager");
    expect(m.lager.tillstand.kontroller).not.toContain(wid(1));
    expect(m.lager.tillstand.kontroller.length).toBeGreaterThan(0);
    expect(m.lager.tillstand.uteslutnaKontroller).toEqual([{ id: wid(1), at: iso(t0) }]);

    // Nästa körning: nya kontroller, och den skriver.
    m.flytta(5 * 60_000);
    expect((await kor()).utfall).toBe("klar");
    expect(m.lager.tillstand.kontroller).not.toContain(wid(1));
  });

  it("☠️ en artikel vars senaste försök misslyckades väljs inte som kontrollsida", async () => {
    laggIKon(1, 2, 3);
    await kor();
    const a = m.lager.avlasningsrader.get(skuFor(2))!;
    m.lager.avlasningsrader.set(skuFor(2), { ...a, misslyckadAt: iso(Date.parse(a.lastAt) + 60_000) });
    m.lager.tillstand.kontroller = [];
    m.flytta(5 * 60_000);
    await kor();
    expect(m.lager.tillstand.kontroller.sort()).toEqual([wid(1), wid(3)]);
  });

  it("en utesluten kontrollsida kan väljas igen efter en vecka", async () => {
    laggIKon(1);
    await kor();
    m.lager.tillstand.kontroller = [];
    m.lager.tillstand.uteslutnaKontroller = [{ id: wid(1), at: iso(m.nu() - 8 * 24 * TIMME) }];
    m.flytta(5 * 60_000);
    await kor();
    expect(m.lager.tillstand.kontroller).toEqual([wid(1)]);
    expect(m.lager.tillstand.uteslutnaKontroller).toEqual([]);
  });

  it("kontrollsidor som blivit borta i tidigare körningar byts ut utan att stoppa något", async () => {
    laggIKon(1, 2, 3, 4, 5, 6);
    for (const i of [1, 2, 3]) m.lager.sidrader.get(wid(i))!.borta = true;
    m.lager.tillstand.kontroller = [wid(1), wid(2), wid(3), wid(4)];
    const s = await kor();
    expect(s.utfall).toBe("klar");
    expect(s.kontroller).toMatchObject({ ersatta: 3, saknade: 0, ok: 1 });
  });

  it("☠️ tre kontrollsidor som saknas i samma körning stoppar den", async () => {
    laggIKon(1, 2, 3, 4);
    m.lager.tillstand.kontroller = [wid(1), wid(2), wid(3)];
    for (const i of [1, 2, 3]) m.svar.set(i, () => new Response(testsida({ utanProdukt: true }), { status: 404 }));
    const s = await kor();
    expect(s.utfall).toBe("stoppad");
    expect(s.kontroller.saknade).toBe(3);
    expect(m.lager.tillstand.kontroller).not.toEqual(expect.arrayContaining([wid(1)]));
  });

  it("en kontrollsida som sålt slut eller svarat med ett tillfälligt fel byts ut men stoppar inget", async () => {
    laggIKon(1, 2, 3, 4);
    m.lager.tillstand.kontroller = [wid(1), wid(2)];
    m.svar.set(1, sida(1, { lager: 0, tillganglighet: "https://schema.org/OutOfStock" }));
    m.svar.set(2, () => new Response("fel", { status: 502 }));
    const s = await kor();
    expect(s.utfall).toBe("klar");
    expect(s.kontroller).toMatchObject({ ok: 1, fel: 0, ersatta: 2 });
    expect(m.lager.tillstand.kontroller).not.toContain(wid(1));
    expect(m.lager.tillstand.kontroller).not.toContain(wid(2));
  });
});

describe("☠️ ett misslyckat försök gör artikeln okänd direkt", () => {
  const forst = async (...n: number[]) => {
    laggIKon(...n);
    await kor();
    for (const i of n) m.lager.sidrader.get(wid(i))!.nastaLasning = iso(m.nu());
    m.flytta(TIMME);
  };

  it("tolkningsfel, tidsgräns och en första 404 märker avläsningen, och en giltig läsning nollar det", async () => {
    const n = Array.from({ length: 40 }, (_, i) => i + 1);
    await forst(...n);
    m.svar.set(1, sida(1, { valuta: "EUR" }));
    m.svar.set(2, () => new Response("fel", { status: 502 }));
    m.svar.set(3, () => new Response(testsida({ utanProdukt: true }), { status: 404 }));
    const t0 = m.nu();
    const s = await kor();
    expect(s.utfall).toBe("klar");
    expect(s.skrivna.misslyckade).toBe(3);
    for (const i of [1, 2, 3]) {
      const a = m.lager.avlasningsrader.get(skuFor(i))!;
      expect(a.misslyckadAt).toBe(iso(t0));
      expect(vevorRad(a, m.nu(), false)?.status).toBe("okand");
    }
    expect(m.lager.avlasningsrader.get(skuFor(4))?.misslyckadAt).toBeNull();

    m.svar.clear();
    for (const i of [1, 2, 3]) m.lager.sidrader.get(wid(i))!.nastaLasning = iso(m.nu());
    m.flytta(TIMME);
    await kor();
    for (const i of [1, 2, 3]) {
      const a = m.lager.avlasningsrader.get(skuFor(i))!;
      expect(a.misslyckadAt).toBeNull();
      expect(vevorRad(a, m.nu(), false)?.status).toBe("i_lager");
    }
  });

  it("en stoppad körning märker ingenting", async () => {
    const n = Array.from({ length: 20 }, (_, i) => i + 1);
    await forst(...n);
    for (const i of [1, 2, 3]) m.svar.set(i, sida(i, { valuta: "EUR" }));
    expect((await kor()).utfall).toBe("stoppad");
    expect(m.lager.avlasningsrader.get(skuFor(1))?.misslyckadAt).toBeNull();
  });

  it("ett tolkningsfel läses om i sidans vanliga takt, inte oftare", async () => {
    laggIKon(1);
    m.lager.sidrader.get(wid(1))!.klass = "publicerad";
    m.svar.set(1, sida(1, { valuta: "EUR" }));
    await kor();
    expect(Date.parse(m.lager.sidrader.get(wid(1))!.nastaLasning) - START).toBe(4 * TIMME);
  });
});

describe("☠️ körningen skriver aldrig över strömbrytaren", () => {
  it("ett av som kommer medan körningen läser står kvar", async () => {
    laggIKon(1, 2, 3);
    m.lager.tillstand.aktiv = true;
    const hamtare = m.deps.hamtare!;
    m.deps.hamtare = async (url, init) => {
      if (url.includes(`p_${wid(2)}`)) await m.lager.uppdateraTillstand({ aktiv: false });
      return hamtare(url, init);
    };
    const s = await kor({ manuell: false });
    expect(s.utfall).toBe("klar");
    expect(m.lager.tillstand.aktiv).toBe(false);
    expect(m.lager.tillstand.senasteKorning?.utfall).toBe("klar");
  });
});

describe("sidor som aldrig får hämtas", () => {
  it("☠️ en rad på en spärrad sökväg i kön hämtas inte, och körningen faller inte", async () => {
    laggIKon(1);
    m.lager.sidrader.set("000000000099", { ...rad(99), sokvag: "/products/x-p_000000000099", webbId: "000000000099" });
    // robots.txt:s `*` spärrar inte /api/, men Leonard gör det.
    m.lager.sidrader.set("000000000098", { ...rad(98), sokvag: "/api/x-p_000000000098", webbId: "000000000098" });
    const s = await kor();
    expect(s.utfall).toBe("klar");
    expect(s.sparrade).toBe(2);
    expect(m.anrop.some((a) => a.url.includes("/products/") || a.url.includes("/api/"))).toBe(false);
  });
});
