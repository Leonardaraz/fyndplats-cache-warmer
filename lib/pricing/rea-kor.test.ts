import { describe, expect, it } from "vitest";
import type { AuctionDoc } from "../auction/engine";
import type { WixAnrop } from "../polish/skrivplan";
import type { JamforUtfall, OnskatJamforpris, VariantPris } from "../wix/jamforpris";
import { DAG_MS, type Prispunkt } from "./rea";
import {
  MAX_NYA,
  auktionslagen,
  beslutaVariant,
  korRea,
  lasIn,
  seedaHistorik,
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
