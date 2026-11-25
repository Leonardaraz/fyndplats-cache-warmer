import { describe, expect, it } from "vitest";
import type { AuctionDoc } from "../auction/engine";
import type { WixAnrop } from "../polish/skrivplan";
import type { JamforUtfall, OnskatJamforpris, VariantPris } from "../wix/jamforpris";
import { DAG_MS, MAX_GLAPP_MS, TIMHISTORIK_FRAN, reaFor, type Prispunkt } from "./rea";
import {
  MAX_NYA,
  auktionslagen,
  beslutaVariant,
  korRea,
  lasIn,
  seedaHistorik,
  seedaNarvaro,
  type ReaDeps,
} from "./rea-kor";
import { TOMT_TILLSTAND, type Dagsavlasning, type Prisforlopp, type ReaLager, type ReaTillstand } from "./rea-lager";

const NU = Date.parse("2026-11-01T12:40:00.000Z");
const d = (dagar: number) => new Date(NU - dagar * DAG_MS).toISOString();
const pt = (dagar: number, p: number | null): Prispunkt => ({ t: d(dagar), p });
const SPAR = 65 * DAG_MS;
const vanta = async () => {};
const wix: WixAnrop = async () => {
  throw new Error("Wix ska inte anropas direkt här");
};

function vp(productId: string, variantId: string, prisOre: number | null, jamforOre: number | null = null, erbjuden = true): VariantPris {
  return { productId, variantId, prisOre, jamforOre, erbjuden: erbjuden && prisOre !== null };
}

class MinnesLager implements ReaLager {
  tillstand: ReaTillstand;
  forlopp = new Map<string, Prisforlopp>();
  butik: Dagsavlasning[] = [];
  las: string | null = null;
  sparaFel = false;
  sparade: Prisforlopp[] = [];
  borttagna: string[] = [];
  constructor(t: Partial<ReaTillstand> = {}) {
    this.tillstand = { ...TOMT_TILLSTAND, ...t };
  }
  async lasTillstand() {
    return structuredClone(this.tillstand);
  }
  async uppdateraTillstand(a: Partial<ReaTillstand>) {
    this.tillstand = { ...this.tillstand, ...a };
  }
  async tagLas(agare: string) {
    if (this.las) return false;
    this.las = agare;
    return true;
  }
  async slappLas(agare: string) {
    if (this.las === agare) this.las = null;
  }
  async allaForlopp() {
    return [...this.forlopp.values()].map((f) => structuredClone(f));
  }
  async sparaForlopp(rader: Prisforlopp[]) {
    if (this.sparaFel) return rader.map((r) => r.productId);
    for (const r of rader) {
      this.forlopp.set(r.productId, structuredClone(r));
      this.sparade.push(r);
    }
    return [];
  }
  async taBortForlopp(ids: string[]) {
    for (const id of ids) this.forlopp.delete(id);
    this.borttagna.push(...ids);
    return [];
  }
  async butikensHistorik() {
    return this.butik;
  }
  narvaroFragor: { ids: string[]; fran: string; till: string }[] = [];
  async butikensTidigasteDag() {
    return this.butik.map((r) => r.datum).sort()[0] ?? null;
  }
  async butikensAntalPerDag(dagar: readonly string[]) {
    return new Map(dagar.map((dag) => [dag, this.butik.filter((r) => r.datum === dag).length]));
  }
  async butikensNarvaro(ids: readonly string[], fran: string, till: string) {
    this.narvaroFragor.push({ ids: [...ids], fran, till });
    return this.butik
      .filter((r) => ids.includes(r.productId) && r.datum >= fran && r.datum <= till)
      .map((r) => ({ productId: r.productId, datum: r.datum }));
  }
  satt(pid: string, vid: string, punkter: Prispunkt[]) {
    const f = this.forlopp.get(pid) ?? { productId: pid, varianter: [] };
    f.varianter = [...f.varianter.filter((v) => v.id !== vid), { id: vid, punkter }];
    this.forlopp.set(pid, f);
  }
}

interface Skrivning {
  pid: string;
  onskat: Map<string, OnskatJamforpris>;
}

function deps(lager: MinnesLager, katalog: VariantPris[], o: { auktioner?: AuctionDoc[]; utfall?: (pid: string) => Partial<JamforUtfall>; nu?: () => number } = {}) {
  const skrivningar: Skrivning[] = [];
  const dep: ReaDeps = {
    lager,
    wix,
    lasVariantpriser: async () => katalog,
    lasAuktioner: async () => o.auktioner ?? [],
    nu: o.nu ?? (() => NU),
    vanta,
    skriv: async (_w, pid, onskat) => {
      skrivningar.push({ pid, onskat: new Map(onskat) });
      let satta = 0;
      let borttagna = 0;
      for (const x of onskat.values()) (x.jamforOre === null ? borttagna++ : satta++);
      return { productId: pid, status: "skriven", satta, borttagna, redan: 0, saknas: 0, prisAndrat: 0, ...(o.utfall?.(pid) ?? {}) };
    },
  };
  return { dep, skrivningar };
}

const auktion = (productId: string, status: AuctionDoc["status"], startDagar?: number, slutDagar?: number): AuctionDoc => ({
  productId,
  slug: productId,
  name: productId,
  listPrice: 1000,
  floorPrice: 900,
  ladder: [1000],
  stepMinutes: 60,
  slot: 0,
  status,
  queueOrder: 1,
  ...(startDagar !== undefined ? { startAt: d(startDagar) } : {}),
  ...(slutDagar !== undefined ? { endedAt: d(slutDagar) } : {}),
});

// ── Historiken ────────────────────────────────────────────────────────────

describe("lasIn", () => {
  it("en produkt som aldrig gått att köpa får ingen rad", () => {
    const h = lasIn([], [vp("p1", "v1", 100, null, false)], NU, SPAR);
    expect(h.attSpara).toHaveLength(0);
    expect(h.forlopp.size).toBe(0);
  });

  it("första avläsningen skapar raden, samma pris igen sparar ingenting, ett nytt pris en punkt", () => {
    const forsta = lasIn([], [vp("p1", "v1", 100)], NU, SPAR);
    expect(forsta.attSpara).toEqual([{ productId: "p1", varianter: [{ id: "v1", punkter: [{ t: d(0), p: 100 }] }] }]);
    const igen = lasIn(forsta.attSpara, [vp("p1", "v1", 100)], NU + 3_600_000, SPAR);
    expect(igen.attSpara).toHaveLength(0);
    const nytt = lasIn(forsta.attSpara, [vp("p1", "v1", 90)], NU + 3_600_000, SPAR);
    expect(nytt.attSpara[0].varianter[0].punkter).toHaveLength(2);
    expect(nytt.nyaPunkter).toBe(1);
  });

  it("en variant som försvunnit, eller en produkt som dolts, får punkten 'gick inte att köpa'", () => {
    const fore: Prisforlopp[] = [{ productId: "p1", varianter: [{ id: "v1", punkter: [pt(10, 100)] }, { id: "v2", punkter: [pt(10, 200)] }] }];
    const h = lasIn(fore, [vp("p1", "v1", 100, null, false)], NU, SPAR);
    const v = h.attSpara[0].varianter;
    expect(v.find((x) => x.id === "v1")!.punkter.at(-1)).toEqual({ t: d(0), p: null });
    expect(v.find((x) => x.id === "v2")!.punkter.at(-1)).toEqual({ t: d(0), p: null });
  });

  it("en variant som bara säger 'gick inte att köpa' sedan längre än historiken sparas glöms, och en tom rad tas bort", () => {
    const fore: Prisforlopp[] = [{ productId: "p1", varianter: [{ id: "v1", punkter: [pt(70, null)] }] }];
    const h = lasIn(fore, [], NU, SPAR);
    expect(h.attTaBort).toEqual(["p1"]);
    expect(h.attSpara).toHaveLength(0);
  });
});

describe("lasIn — en produkt som får sin första rad (2026-11-25)", () => {
  // Efter timhistorikens början: jobbet har läst varje variant varje timme, så
  // en produkt utan rad har inte gått att köpa sedan dess.
  const SENARE = Date.parse("2026-11-26T08:40:00.000Z");
  const iso = (ms: number) => new Date(ms).toISOString();

  it("☠️ börjar med 'gick inte att köpa' från timhistorikens början, före sitt första pris", () => {
    const h = lasIn([], [vp("ny", "v1", 100), vp("ny", "v2", 200), vp("ny", "v3", 300, null, false)], SENARE, SPAR);
    expect(h.attSpara).toEqual([
      {
        productId: "ny",
        varianter: [
          { id: "v1", punkter: [{ t: TIMHISTORIK_FRAN, p: null }, { t: iso(SENARE), p: 100 }] },
          { id: "v2", punkter: [{ t: TIMHISTORIK_FRAN, p: null }, { t: iso(SENARE), p: 200 }] },
        ],
      },
    ]);
    // En punkt per variant räknas: priset. Beviset är ingen avläsning.
    expect(h.nyaPunkter).toBe(2);
  });

  it("☠️ en ny variant på en produkt som redan har en rad får INTE punkten: den kan vara samma vara under nytt id", () => {
    const fore: Prisforlopp[] = [{ productId: "p1", varianter: [{ id: "gammal", punkter: [{ t: "2026-11-10T08:40:00.000Z", p: 100 }] }] }];
    const h = lasIn(fore, [vp("p1", "nytt-id", 120)], SENARE, SPAR);
    const v = h.attSpara[0].varianter;
    expect(v.find((x) => x.id === "nytt-id")!.punkter).toEqual([{ t: iso(SENARE), p: 120 }]);
    expect(v.find((x) => x.id === "gammal")!.punkter.at(-1)).toEqual({ t: iso(SENARE), p: null });
  });

  it("långt efter timhistorikens början dateras punkten så långt bak som historiken sparas", () => {
    const langtSenare = Date.parse("2027-03-01T08:40:00.000Z");
    const h = lasIn([], [vp("ny", "v1", 100)], langtSenare, SPAR);
    expect(h.attSpara[0].varianter[0].punkter).toEqual([{ t: iso(langtSenare - SPAR), p: null }, { t: iso(langtSenare), p: 100 }]);
  });

  it("före timhistorikens början finns inget bevis, och raden börjar med priset", () => {
    const fore = Date.parse(TIMHISTORIK_FRAN) - 3_600_000;
    const h = lasIn([], [vp("ny", "v1", 100)], fore, SPAR);
    expect(h.attSpara[0].varianter[0].punkter).toEqual([{ t: iso(fore), p: 100 }]);
  });

  /** Varan får sin första rad vid `forst`, och priset sänks 20 % `dygn` dygn senare. */
  const sanktEfter = (forst: number, dygn: number) => {
    const start = lasIn([], [vp("ny", "v1", 100_000)], forst, SPAR).attSpara;
    const t = forst + dygn * DAG_MS;
    const h = lasIn(start, [vp("ny", "v1", 80_000)], t, SPAR);
    return beslutaVariant(vp("ny", "v1", 80_000), h.forlopp.get("ny")!.get("v1")!, undefined, [], t);
  };

  it("raden som skapas ger rea efter sju dygn till salu, inte efter sex", () => {
    const forst = Date.parse("2026-12-10T08:40:00.000Z");
    expect(sanktEfter(forst, 6)).toMatchObject({ jamforOre: null, skal: "ny" });
    expect(sanktEfter(forst, 8)).toMatchObject({ jamforOre: 100_000, skal: "rea", nyVara: true });
  });

  it("☠️ beviset räcker bara bak till timhistorikens början: ett fönster som börjar före den ger ingen rea", () => {
    // Första raden 26 november. Sänkt 2 december börjar fönstret 1 november 08:40, sex timmar före
    // timhistoriken; sänkt 4 december börjar det 3 november.
    expect(sanktEfter(SENARE, 6)).toMatchObject({ jamforOre: null, skal: "ofullstandig" });
    expect(sanktEfter(SENARE, 8)).toMatchObject({ jamforOre: 100_000, skal: "rea", nyVara: true });
  });

  it("☠️ en lucka i fönstret ger ingen rea för en ny vara heller: under den kan varan ha sålts", () => {
    const start = lasIn([], [vp("ny", "v1", 100_000)], SENARE, SPAR).attSpara;
    const t = SENARE + 8 * DAG_MS;
    const h = lasIn(start, [vp("ny", "v1", 80_000)], t, SPAR);
    // En lucka FÖRE varans första rad: under den kan den ha börjat säljas till ett annat pris.
    const lucka = [{ fran: iso(SENARE - 3 * DAG_MS), till: iso(SENARE - 2 * DAG_MS) }];
    expect(beslutaVariant(vp("ny", "v1", 80_000), h.forlopp.get("ny")!.get("v1")!, undefined, lucka, t)).toMatchObject({ jamforOre: null, skal: "lucka" });
    expect(beslutaVariant(vp("ny", "v1", 80_000), h.forlopp.get("ny")!.get("v1")!, undefined, [], t)).toMatchObject({ skal: "rea" });
  });
});

// ── Beslutet ──────────────────────────────────────────────────────────────

describe("beslutaVariant", () => {
  const historik = [pt(60, 100_000), pt(5, 80_000)];
  it("en sänkning ger jämförpriset", () => {
    expect(beslutaVariant(vp("p1", "v1", 80_000), historik, undefined, [], NU)).toMatchObject({ rorInte: false, jamforOre: 100_000, skal: "rea" });
  });
  it("☠️ en levande auktion (också en schemalagd) rörs inte alls", () => {
    const lage = auktionslagen([auktion("p1", "live", -1)]).get("p1");
    expect(beslutaVariant(vp("p1", "v1", 80_000, 120_000), historik, lage, [], NU)).toEqual({ rorInte: true });
  });
  it("☠️ en avslutad auktion i fönstret ger ingen automatisk rea", () => {
    const lage = auktionslagen([auktion("p1", "sold", 20, 19.5)]).get("p1");
    expect(beslutaVariant(vp("p1", "v1", 80_000), historik, lage, [], NU)).toMatchObject({ jamforOre: null, skal: "auktion" });
    const gammal = auktionslagen([auktion("p1", "expired", 50, 49.5)]).get("p1");
    expect(beslutaVariant(vp("p1", "v1", 80_000), historik, gammal, [], NU)).toMatchObject({ jamforOre: 100_000 });
  });
  it("☠️ en avslutad auktion utan start räknas som att den aldrig slutar", () => {
    const lage = auktionslagen([auktion("p1", "sold")]).get("p1");
    expect(beslutaVariant(vp("p1", "v1", 80_000), historik, lage, [], NU)).toMatchObject({ jamforOre: null, skal: "auktion" });
  });
  it("☠️ en lucka i fönstret ger ingen rea", () => {
    expect(beslutaVariant(vp("p1", "v1", 80_000), historik, undefined, [{ fran: d(20), till: d(19) }], NU)).toMatchObject({ jamforOre: null, skal: "lucka" });
  });
  it("en variant som inte går att köpa ska inte ha något jämförpris", () => {
    expect(beslutaVariant(vp("p1", "v1", 80_000, 100_000, false), historik, undefined, [], NU)).toMatchObject({ jamforOre: null, skal: "inte_utbjuden" });
  });
  it("en ny vara bär märket nyVara, en vara med priser över hela fönstret gör det inte", () => {
    const ny = [pt(60, null), pt(32, 100_000), pt(5, 80_000)];
    expect(beslutaVariant(vp("p1", "v1", 80_000), ny, undefined, [], NU)).toMatchObject({ jamforOre: 100_000, skal: "rea", nyVara: true });
    expect(beslutaVariant(vp("p1", "v1", 80_000), historik, undefined, [], NU)).not.toHaveProperty("nyVara");
  });
  it("☠️ en auktion sedan en ny vara började säljas ger ingen automatisk rea", () => {
    const ny = [pt(60, null), pt(32, 100_000), pt(5, 80_000)];
    const lage = auktionslagen([auktion("p1", "sold", 20, 19.5)]).get("p1");
    expect(beslutaVariant(vp("p1", "v1", 80_000), ny, lage, [], NU)).toMatchObject({ jamforOre: null, skal: "auktion" });
  });
});

// ── Körningen ─────────────────────────────────────────────────────────────

describe("korRea", () => {
  const medHistorik = (t: Partial<ReaTillstand>) => {
    const l = new MinnesLager({ senast: d(1 / 24), ...t });
    l.satt("rea", "v1", [pt(60, 100_000), pt(5, 80_000)]);
    l.satt("utan", "v1", [pt(60, 50_000)]);
    return l;
  };
  const katalog = () => [vp("rea", "v1", 80_000), vp("utan", "v1", 50_000, 70_000), vp("ny", "v1", 30_000)];

  it("torrt: ingenting sparas eller skrivs, och planen räknas", async () => {
    const l = medHistorik({ seedKlar: true, skriv: true });
    const { dep, skrivningar } = deps(l, katalog());
    const r = await korRea(dep, { torr: true, deadline: NU + 60_000 });
    expect(r).toMatchObject({ torr: true, skrevInte: "torr", plan: { nya: 1, borttagningar: 1, produkter: 2 } });
    expect(r.medRea).toEqual(["rea"]);
    expect(l.sparade).toHaveLength(0);
    expect(skrivningar).toHaveLength(0);
    expect(l.las).toBeNull();
  });

  it("rapporten säger hur många av reaskyltarna som är nya varor", async () => {
    const l = medHistorik({ seedKlar: true, skriv: true });
    l.satt("nyvara", "v1", [pt(60, null), pt(32, 100_000), pt(5, 80_000)]);
    const { dep } = deps(l, [...katalog(), vp("nyvara", "v1", 80_000)]);
    const r = await korRea(dep, { torr: true, deadline: NU + 60_000 });
    expect(r.beslut).toMatchObject({ rea: 2, nyaVaror: 1 });
    expect(r.medRea).toEqual(["nyvara", "rea"]);
  });

  it("☠️ före bakåtfyllningen förs historiken, men inga jämförpriser skrivs", async () => {
    const l = medHistorik({ seedKlar: false, skriv: true });
    const { dep, skrivningar } = deps(l, katalog());
    const r = await korRea(dep, { torr: false, deadline: NU + 60_000 });
    expect(r.skrevInte).toBe("seed_saknas");
    expect(skrivningar).toHaveLength(0);
    expect(l.forlopp.has("ny")).toBe(true);
    expect(l.tillstand.senast).toBe(d(0));
    expect(l.las).toBeNull();
  });

  it("☠️ med strömbrytaren av förs historiken, men inga jämförpriser skrivs", async () => {
    const l = medHistorik({ seedKlar: true, skriv: false });
    const { dep, skrivningar } = deps(l, katalog());
    const r = await korRea(dep, { torr: false, deadline: NU + 60_000 });
    expect(r.skrevInte).toBe("strombrytaren_av");
    expect(skrivningar).toHaveLength(0);
  });

  it("skarpt: sätter jämförpriset där priset sänkts, och tar bort det där inget belägger det", async () => {
    const l = medHistorik({ seedKlar: true, skriv: true });
    const { dep, skrivningar } = deps(l, katalog());
    const r = await korRea(dep, { torr: false, deadline: NU + 60_000 });
    expect(skrivningar).toEqual([
      { pid: "rea", onskat: new Map([["v1", { jamforOre: 100_000, prisOre: 80_000 }]]) },
      { pid: "utan", onskat: new Map([["v1", { jamforOre: null, prisOre: 50_000 }]]) },
    ]);
    expect(r.skrivet).toMatchObject({ produkter: 2, satta: 1, borttagna: 1 });
    expect(r.stoppad).toBe(false);
  });

  it("☠️ föll sparandet av historiken rörs inga priser, och `senast` står kvar så att nästa körning ser luckan", async () => {
    const l = medHistorik({ seedKlar: true, skriv: true });
    l.sparaFel = true;
    const fore = l.tillstand.senast;
    const { dep, skrivningar } = deps(l, katalog());
    const r = await korRea(dep, { torr: false, deadline: NU + 60_000 });
    expect(r.skrevInte).toBe("historiken_sparades_inte");
    expect(skrivningar).toHaveLength(0);
    expect(l.tillstand.senast).toBe(fore);
  });

  it("☠️ en lång paus sedan förra körningen blir en lucka, och en rea vars fönster täcker den tas bort", async () => {
    const l = medHistorik({ seedKlar: true, skriv: true, senast: d(10) });
    const k = [vp("rea", "v1", 80_000, 100_000)];
    const { dep, skrivningar } = deps(l, k);
    const r = await korRea(dep, { torr: false, deadline: NU + 60_000 });
    expect(r.historik.nyLucka).toEqual({ fran: d(10), till: d(0) });
    expect(l.tillstand.luckor).toEqual([{ fran: d(10), till: d(0) }]);
    expect(skrivningar[0].onskat.get("v1")).toEqual({ jamforOre: null, prisOre: 80_000 });
  });

  it("☠️ masspärren: fler nya än taket skrivs inte, men borttagningarna går", async () => {
    const l = new MinnesLager({ seedKlar: true, skriv: true, senast: d(1 / 24) });
    const k: VariantPris[] = [];
    for (let i = 0; i < 3; i++) {
      l.satt(`p${i}`, "v1", [pt(60, 100_000), pt(5, 80_000)]);
      k.push(vp(`p${i}`, "v1", 80_000));
    }
    k.push(vp("x", "v1", 50_000, 70_000));
    const { dep, skrivningar } = deps(l, k);
    const r = await korRea(dep, { torr: false, deadline: NU + 60_000, maxNya: 2 });
    expect(r.plan.nyaSparrade).toBe(true);
    expect(skrivningar.map((s) => s.pid)).toEqual(["x"]);
    expect(MAX_NYA).toBe(200);
  });

  it("☠️ en levande auktion rörs inte, inte ens när dess jämförpris saknar belägg", async () => {
    const l = medHistorik({ seedKlar: true, skriv: true });
    const { dep, skrivningar } = deps(l, [vp("utan", "v1", 50_000, 70_000)], { auktioner: [auktion("utan", "live", 0.1)] });
    const r = await korRea(dep, { torr: false, deadline: NU + 60_000 });
    expect(r.beslut.auktionLevande).toBe(1);
    expect(skrivningar).toHaveLength(0);
  });

  it("☠️ en avvikelse stoppar körningen", async () => {
    const l = medHistorik({ seedKlar: true, skriv: true });
    const { dep, skrivningar } = deps(l, katalog(), { utfall: () => ({ status: "avvikelse", avvikelser: ["lagret ändrades"] }) });
    const r = await korRea(dep, { torr: false, deadline: NU + 60_000 });
    expect(r).toMatchObject({ stoppad: true, stoppadAv: "avvikelse", ejNadda: 1 });
    expect(skrivningar).toHaveLength(1);
    expect(r.produkter[0]).toMatchObject({ id: "rea", status: "avvikelse" });
  });

  it("☠️ fem fel i följd stoppar körningen", async () => {
    const l = new MinnesLager({ seedKlar: true, skriv: true, senast: d(1 / 24) });
    const k: VariantPris[] = [];
    for (let i = 0; i < 8; i++) k.push(vp(`p${i}`, "v1", 50_000, 70_000));
    const { dep, skrivningar } = deps(l, k, { utfall: () => ({ status: "fel", fel: "Wix 500" }) });
    const r = await korRea(dep, { torr: false, deadline: NU + 60_000 });
    expect(r).toMatchObject({ stoppad: true, stoppadAv: "fel_i_foljd" });
    expect(skrivningar).toHaveLength(5);
  });

  it("tidsbudgeten: inga nya produkter efter deadline", async () => {
    const l = medHistorik({ seedKlar: true, skriv: true });
    let klocka = NU;
    const { dep, skrivningar } = deps(l, katalog(), { nu: () => (klocka += 40_000) });
    const r = await korRea(dep, { torr: false, deadline: NU + 100_000 });
    expect(r).toMatchObject({ stoppad: true, stoppadAv: "tidsbudget" });
    expect(skrivningar.length).toBeLessThan(2);
  });

  it("provet: bara de angivna produkterna skrivs, historiken förs för alla", async () => {
    const l = medHistorik({ seedKlar: true, skriv: true });
    const { dep, skrivningar } = deps(l, katalog());
    await korRea(dep, { torr: false, deadline: NU + 60_000, ids: ["utan"] });
    expect(skrivningar.map((s) => s.pid)).toEqual(["utan"]);
    expect(l.forlopp.has("ny")).toBe(true);
  });

  it("☠️ ett upptaget lås stoppar körningen innan något läses eller skrivs", async () => {
    const l = medHistorik({ seedKlar: true, skriv: true });
    l.las = "någon annan";
    const { dep, skrivningar } = deps(l, katalog());
    const r = await korRea(dep, { torr: false, deadline: NU + 60_000 });
    expect(r).toMatchObject({ stoppad: true, stoppadAv: "las" });
    expect(skrivningar).toHaveLength(0);
    expect(l.sparade).toHaveLength(0);
    expect(l.las).toBe("någon annan");
  });
});

// ── Bakåtfyllningen ───────────────────────────────────────────────────────

describe("seedaHistorik", () => {
  const dagar = Array.from({ length: 46 }, (_, i) => new Date(Date.parse("2026-09-17T00:00:00.000Z") + i * DAG_MS).toISOString().slice(0, 10));
  const butik = (): Dagsavlasning[] => {
    const ut: Dagsavlasning[] = [];
    for (const datum of dagar) {
      ut.push({ productId: "en", datum, prisOre: datum < "2026-10-20" ? 100_000 : 80_000 });
      ut.push({ productId: "flera", datum, prisOre: 50_000 });
      for (let i = 0; i < 8; i++) ut.push({ productId: `fyll${i}`, datum, prisOre: 1000 });
    }
    return ut;
  };
  const katalog = [vp("en", "v1", 80_000), vp("flera", "a", 50_000), vp("flera", "b", 60_000)];

  it("torrt: räknar men sparar ingenting", async () => {
    const l = new MinnesLager();
    l.butik = butik();
    const { dep } = deps(l, katalog);
    const r = await seedaHistorik(dep, { torr: true });
    expect(r).toMatchObject({ torr: true, dagar: 46, fullstandigaDagar: 46, envariant: 1, flervariantHoppade: 1, seedade: 1, punkter: 2 });
    expect(l.sparade).toHaveLength(0);
    expect(l.tillstand.seedKlar).toBe(false);
  });

  it("☠️ bara produkter med EN variant fylls bakåt; flervariantsprodukter börjar vid första körningen", async () => {
    const l = new MinnesLager();
    l.butik = butik();
    const { dep } = deps(l, katalog);
    const r = await seedaHistorik(dep, { torr: false });
    expect(r.sparadeFel).toBe(0);
    expect(l.forlopp.get("en")!.varianter[0].punkter).toEqual([
      { t: "2026-09-17T02:30:00.000Z", p: 100_000 },
      { t: "2026-10-20T02:30:00.000Z", p: 80_000 },
    ]);
    expect(l.forlopp.has("flera")).toBe(false);
    expect(l.tillstand.seedKlar).toBe(true);
    expect(l.las).toBeNull();
  });

  it("☠️ timavläsningen som redan gjorts skrivs aldrig över: inga dagspunkter efter den första timpunkten", async () => {
    const l = new MinnesLager();
    l.butik = butik();
    l.satt("en", "v1", [{ t: "2026-10-25T10:40:00.000Z", p: 85_000 }]);
    const { dep } = deps(l, katalog);
    await seedaHistorik(dep, { torr: false });
    expect(l.forlopp.get("en")!.varianter[0].punkter).toEqual([
      { t: "2026-09-17T02:30:00.000Z", p: 100_000 },
      { t: "2026-10-20T02:30:00.000Z", p: 80_000 },
      { t: "2026-10-25T10:40:00.000Z", p: 85_000 },
    ]);
  });

  it("görs en gång: en andra körning säger att den redan är gjord, utom med `igen`", async () => {
    const l = new MinnesLager({ seedKlar: true });
    l.butik = butik();
    const { dep } = deps(l, katalog);
    expect((await seedaHistorik(dep, { torr: false })).redanGjord).toBe(true);
    expect((await seedaHistorik(dep, { torr: false, igen: true })).redanGjord).toBe(false);
  });

  it("☠️ en dag där butikens avläsning föll blir en lucka", async () => {
    const l = new MinnesLager();
    l.butik = butik().filter((r) => r.datum !== "2026-10-25");
    const { dep } = deps(l, katalog);
    const r = await seedaHistorik(dep, { torr: false });
    expect(r.luckor).toBe(1);
    expect(l.tillstand.luckor).toEqual([{ fran: "2026-10-24T02:30:00.000Z", till: "2026-10-26T02:30:00.000Z" }]);
  });
});

// ── Beviset ur butikens dagliga avläsning ────────────────────────────────

describe("seedaNarvaro (2026-11-25)", () => {
  // Körs efter timhistorikens början. Butikens avläsning har kvar 2026-10-11 och
  // framåt, så beviset börjar dagen efter: 2026-10-12 02:30 UTC.
  const NU2 = Date.parse("2026-11-26T02:10:00.000Z");
  const BEVIS = "2026-10-12T02:30:00.000Z";
  const dagarna = (fran: string, till: string) => {
    const ut: string[] = [];
    for (let t = Date.parse(`${fran}T00:00:00.000Z`); t <= Date.parse(`${till}T00:00:00.000Z`); t += DAG_MS) ut.push(new Date(t).toISOString().slice(0, 10));
    return ut;
  };
  /** Butikens avläsning: tio andra produkter varje dag, så att dagarna är fullständiga. */
  function lager(extra: Dagsavlasning[] = [], utanDag?: string) {
    const l = new MinnesLager({ seedKlar: true, skriv: true });
    for (const dag of dagarna("2026-10-11", "2026-11-25")) {
      if (dag === utanDag) continue;
      for (let i = 0; i < 10; i++) l.butik.push({ productId: `fyllnad-${i}`, datum: dag, prisOre: 1000 });
    }
    l.butik.push(...extra);
    return l;
  }
  const dep = (l: MinnesLager) => ({ lager: l, nu: () => NU2 });
  const P = (t: string, p: number | null): Prispunkt => ({ t, p });

  it("☠️ en vara som började säljas efter timhistorikens början får punkten, daterad till bevisets början", async () => {
    const l = lager([{ productId: "ny", datum: "2026-11-14", prisOre: 100_000 }]);
    l.satt("ny", "v1", [P("2026-11-13T14:40:09.000Z", 100_000), P("2026-11-24T16:40:09.000Z", 92_000)]);
    const r = await seedaNarvaro(dep(l), { torr: false });
    expect(r).toMatchObject({ torr: false, bevisFran: "2026-10-12", dagar: 21, ofullstandigaDagar: [], kandidater: 1, fannsFore: 0, markta: 1, marktaVarianter: 1, sparadeFel: 0 });
    expect(l.forlopp.get("ny")!.varianter[0].punkter).toEqual([P(BEVIS, null), P("2026-11-13T14:40:09.000Z", 100_000), P("2026-11-24T16:40:09.000Z", 92_000)]);
    expect(l.las).toBeNull();
    // Och regeln ger nu varan rea mot priset den såldes för i elva dygn.
    const b = reaFor(l.forlopp.get("ny")!.varianter[0].punkter, 92_000, NU2);
    expect(b).toMatchObject({ rea: true, tidigareOre: 100_000, nyVara: true });
  });

  it("torrt: räknar men sparar ingenting och tar inget lås", async () => {
    const l = lager();
    l.satt("ny", "v1", [P("2026-11-13T14:40:09.000Z", 100_000)]);
    const r = await seedaNarvaro(dep(l));
    expect(r).toMatchObject({ torr: true, kandidater: 1, markta: 1 });
    expect(l.sparade).toHaveLength(0);
    expect(l.forlopp.get("ny")!.varianter[0].punkter).toHaveLength(1);
  });

  it("☠️ en produkt som stod i butikens avläsning före sin första punkt såldes före, och rörs inte", async () => {
    // En flervariantsprodukt som fanns när timjobbet startade: första punkten vid timhistorikens början.
    const l = lager(dagarna("2026-10-12", "2026-11-25").map((datum) => ({ productId: "gammal", datum, prisOre: 50_000 })));
    l.satt("gammal", "v1", [P(TIMHISTORIK_FRAN, 50_000)]);
    l.satt("gammal", "v2", [P(TIMHISTORIK_FRAN, 60_000)]);
    // Och en som var dold när timjobbet startade men såldes en dag i oktober.
    l.butik.push({ productId: "dold", datum: "2026-10-20", prisOre: 70_000 });
    l.satt("dold", "v1", [P("2026-11-10T09:40:09.000Z", 90_000)]);
    const r = await seedaNarvaro(dep(l), { torr: false });
    expect(r).toMatchObject({ kandidater: 2, fannsFore: 2, markta: 0 });
    expect(l.sparade).toHaveLength(0);
    expect(l.forlopp.get("dold")!.varianter[0].punkter).toEqual([P("2026-11-10T09:40:09.000Z", 90_000)]);
  });

  it("☠️ en avläsning högst tre timmar före den första punkten räknas inte: timjobbet ser en ny produkt en körning sent", async () => {
    // Publicerad 01:50, butikens avläsning 02:30 ser den, timjobbet 02:40.
    const l = lager([{ productId: "natt", datum: "2026-11-13", prisOre: 100_000 }]);
    l.satt("natt", "v1", [P("2026-11-13T02:40:09.000Z", 100_000)]);
    // Samma sak med mer än tre timmar emellan är en vara som såldes före.
    l.butik.push({ productId: "fore", datum: "2026-11-13", prisOre: 100_000 });
    l.satt("fore", "v1", [P(new Date(Date.parse("2026-11-13T02:30:00.000Z") + MAX_GLAPP_MS + 60_000).toISOString(), 100_000)]);
    const r = await seedaNarvaro(dep(l), { torr: false });
    expect(r).toMatchObject({ kandidater: 2, fannsFore: 1, markta: 1 });
    expect(l.forlopp.get("natt")!.varianter[0].punkter[0]).toEqual(P(BEVIS, null));
    expect(l.forlopp.get("fore")!.varianter[0].punkter[0].p).toBe(100_000);
  });

  it("☠️ bara varianter vars första punkt är produktens första får punkten", async () => {
    const l = lager();
    l.satt("ny", "v1", [P("2026-11-13T14:40:09.000Z", 100_000)]);
    l.satt("ny", "senare", [P("2026-11-20T10:40:09.000Z", 120_000)]);
    l.satt("ny", "aldrig", []);
    const r = await seedaNarvaro(dep(l), { torr: false });
    expect(r).toMatchObject({ markta: 1, marktaVarianter: 1 });
    const v = l.forlopp.get("ny")!.varianter;
    expect(v.find((x) => x.id === "v1")!.punkter[0]).toEqual(P(BEVIS, null));
    expect(v.find((x) => x.id === "senare")!.punkter).toEqual([P("2026-11-20T10:40:09.000Z", 120_000)]);
    expect(v.find((x) => x.id === "aldrig")!.punkter).toEqual([]);
  });

  it("☠️ en historik som redan börjar med 'gick inte att köpa', eller före beviset, rörs inte: körningen går att göra om", async () => {
    const l = lager();
    l.satt("ny", "v1", [P("2026-11-13T14:40:09.000Z", 100_000)]);
    l.satt("seedad", "v1", [P("2026-09-17T02:30:00.000Z", null), P("2026-10-20T02:30:00.000Z", 80_000)]);
    l.satt("gammal", "v1", [P("2026-09-17T02:30:00.000Z", 80_000)]);
    l.satt("blandad", "v1", [P("2026-11-13T14:40:09.000Z", 100_000)]);
    l.satt("blandad", "v2", [P("2026-11-13T14:40:09.000Z", null), P("2026-11-14T14:40:09.000Z", 100_000)]);
    const forsta = await seedaNarvaro(dep(l), { torr: false });
    expect(forsta).toMatchObject({ produkter: 4, kandidater: 1, markta: 1 });
    const igen = await seedaNarvaro(dep(l), { torr: false });
    expect(igen).toMatchObject({ kandidater: 0, markta: 0 });
    expect(l.forlopp.get("ny")!.varianter[0].punkter).toHaveLength(2);
  });

  it("☠️ en dag där butikens avläsning föll bevisar ingenting: då görs ingenting alls", async () => {
    const l = lager([], "2026-10-20");
    l.satt("ny", "v1", [P("2026-11-13T14:40:09.000Z", 100_000)]);
    const r = await seedaNarvaro(dep(l), { torr: false });
    expect(r).toMatchObject({ stoppadAv: "ofullstandig_dag", ofullstandigaDagar: ["2026-10-20"], markta: 0 });
    expect(l.sparade).toHaveLength(0);
    expect(l.las).toBeNull();
  });

  it("☠️ den tidigaste dagen räknas inte: gallringen kan ha tagit rader ur den", async () => {
    const l = lager();
    // Varan stod bara i den tidigaste dagen: det säger ingenting om dagen efter.
    l.butik.push({ productId: "ny", datum: "2026-10-11", prisOre: 100_000 });
    l.satt("ny", "v1", [P("2026-11-13T14:40:09.000Z", 100_000)]);
    const r = await seedaNarvaro(dep(l), { torr: false });
    expect(r).toMatchObject({ bevisFran: "2026-10-12", markta: 1 });
    expect(l.narvaroFragor[0]).toMatchObject({ fran: "2026-10-12", till: "2026-11-13" });
  });

  it("☠️ när butikens avläsning inte når bak till före timhistoriken finns inget att hämta", async () => {
    const l = new MinnesLager();
    for (const dag of dagarna("2026-11-05", "2026-11-25")) l.butik.push({ productId: "x", datum: dag, prisOre: 1000 });
    l.satt("ny", "v1", [P("2026-11-13T14:40:09.000Z", 100_000)]);
    expect(await seedaNarvaro(dep(l), { torr: false })).toMatchObject({ stoppadAv: "inget_underlag", markta: 0 });
    expect(await seedaNarvaro(dep(new MinnesLager()), { torr: false })).toMatchObject({ stoppadAv: "inget_underlag" });
  });

  it("☠️ fönstret får inte nå före beviset: en sänkning vars fönster börjar före 12 oktober ger ingen rea", async () => {
    const l = lager();
    l.satt("tidig", "v1", [P("2026-11-02T10:40:09.000Z", 100_000), P("2026-11-10T10:40:09.000Z", 90_000)]);
    await seedaNarvaro(dep(l), { torr: false });
    // Sänkt 10 november: fönstret börjar 10 oktober, två dygn före beviset.
    expect(reaFor(l.forlopp.get("tidig")!.varianter[0].punkter, 90_000, NU2)).toMatchObject({ rea: false, skal: "ofullstandig" });
  });

  it("frågar butikens avläsning i buntar om hundra, sorterade efter första punkten", async () => {
    const l = lager();
    for (let i = 0; i < 150; i++) {
      const dag = 10 + (i % 15);
      l.satt(`p${String(i).padStart(3, "0")}`, "v1", [P(`2026-11-${dag}T10:40:09.000Z`, 100_000)]);
    }
    const r = await seedaNarvaro(dep(l));
    expect(r).toMatchObject({ kandidater: 150, markta: 150 });
    expect(l.narvaroFragor.map((f) => f.ids.length)).toEqual([100, 50]);
    // Tio produkter per dag 10–24 november: de hundra första slutar 19 november.
    expect(l.narvaroFragor.map((f) => f.till)).toEqual(["2026-11-19", "2026-11-24"]);
  });

  it("☠️ en bunt frågar till och med sin SENASTE första punkt, i vilken ordning produkterna än kommer", async () => {
    // "sen" började 20 november men stod i butikens avläsning 15 november: den såldes före.
    const l = lager([{ productId: "sen", datum: "2026-11-15", prisOre: 100_000 }]);
    l.satt("sen", "v1", [P("2026-11-20T10:40:09.000Z", 100_000)]);
    l.satt("tidig", "v1", [P("2026-11-05T10:40:09.000Z", 100_000)]);
    const r = await seedaNarvaro(dep(l), { torr: false });
    expect(l.narvaroFragor).toEqual([{ ids: ["tidig", "sen"], fran: "2026-10-12", till: "2026-11-20" }]);
    expect(r).toMatchObject({ kandidater: 2, fannsFore: 1, markta: 1 });
    expect(l.forlopp.get("sen")!.varianter[0].punkter[0].p).toBe(100_000);
  });

  it("☠️ ett upptaget lås stoppar den skarpa körningen innan något läses", async () => {
    const l = lager();
    l.las = "annan";
    l.satt("ny", "v1", [P("2026-11-13T14:40:09.000Z", 100_000)]);
    expect(await seedaNarvaro(dep(l), { torr: false })).toMatchObject({ stoppadAv: "las", produkter: 0 });
    expect(l.sparade).toHaveLength(0);
  });

  it("ett fel när raderna sparas syns i rapporten", async () => {
    const l = lager();
    l.sparaFel = true;
    l.satt("ny", "v1", [P("2026-11-13T14:40:09.000Z", 100_000)]);
    expect(await seedaNarvaro(dep(l), { torr: false })).toMatchObject({ markta: 1, sparadeFel: 1 });
  });
});
