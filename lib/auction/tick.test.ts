// Ticken med 100 fynd mot låtsade beroenden (Black Week, planens del C2):
// högst fyra Wix-anrop samtidigt, ett massanrop per steg, tidsbudgeten,
// synkfönstret för främjanden, och de fall där en vara annars hade fått fel
// pris — en såld eller avslutad auktion får aldrig sänkas.

import { describe, expect, it } from "vitest";
import { buildLadder, priceAt, type AuctionDoc } from "./engine";
import { korTick, SAMTIDIGA, type Order, type TickBeroenden } from "./tick";
import type { Skrivlage } from "./store";

// Tisdag 10 november 2026: vintertid, dagen startar 07:00 svensk tid = 06:00 UTC.
const START = "2026-11-10T06:00:00.000Z";
const T = (iso: string) => Date.parse(iso);
const LADDER = buildLadder(1000, 850);

function auktion(i: number, over: Partial<AuctionDoc> = {}): AuctionDoc {
  return {
    _id: `auction-p${i}`,
    productId: `p${i}`,
    slug: `s${i}`,
    name: `Vara ${i}`,
    listPrice: 1000,
    floorPrice: 850,
    ladder: LADDER,
    stepMinutes: 60,
    slot: 0,
    status: "queued",
    queueOrder: i,
    ...over,
  };
}

/** n live-auktioner som startade 07:00, med steg `steg` redan skrivet. */
function live(n: number, steg: number): AuctionDoc[] {
  return Array.from({ length: n }, (_, i) =>
    auktion(i + 1, { status: "live", slot: i + 1, startAt: START, lastPatchedStep: steg, lastPatchedPrice: LADDER[steg] }),
  );
}

function ko(n: number, fran = 1000): AuctionDoc[] {
  return Array.from({ length: n }, (_, i) => auktion(fran + i, { queueOrder: i + 1 }));
}

const sov = () => new Promise<void>((r) => setTimeout(r, 1));

interface Varld {
  d: TickBeroenden;
  klocka: { t: number };
  sparningar: AuctionDoc[][];
  stegade: string[];
  aterstallda: string[];
  borttagna: string[];
  maxSamtidiga: () => number;
  butiken: string[][];
}

function varld(opts: {
  nu: string;
  rader: AuctionDoc[];
  avslutade?: AuctionDoc[];
  ordrar?: Order[] | Error;
  /** Hur många ms klockan går per Wix-skrivning. */
  msPerSkrivning?: number;
  stegaFel?: (a: AuctionDoc) => Error | undefined;
  aterstallFel?: (a: AuctionDoc) => Error | undefined;
  finns?: (productId: string) => boolean;
  /** Varans pris i Wix per variant. Saknas den gäller radens egna priser (oförändrat sedan seeden). */
  priser?: (productId: string) => ReadonlyMap<string, number> | null;
  sparaFel?: (docs: AuctionDoc[]) => { id: string; fel: string }[];
  strypningar?: number;
}): Varld {
  const klocka = { t: T(opts.nu) };
  const sparningar: AuctionDoc[][] = [];
  const stegade: string[] = [];
  const aterstallda: string[] = [];
  const borttagna: string[] = [];
  const butiken: string[][] = [];
  let iLuften = 0;
  let max = 0;
  const skrivning = async <R>(f: () => R): Promise<R> => {
    iLuften++;
    max = Math.max(max, iLuften);
    try {
      await sov();
      return f();
    } finally {
      iLuften--;
      klocka.t += opts.msPerSkrivning ?? 0;
    }
  };
  const d: TickBeroenden = {
    nu: () => klocka.t,
    lasAuktioner: async (statusar) =>
      structuredClone(statusar.includes("live") ? opts.rader.filter((r) => statusar.includes(r.status)) : opts.avslutade ?? []),
    hamtaOrdrar: async () => {
      if (opts.ordrar instanceof Error) throw opts.ordrar;
      return opts.ordrar ?? [];
    },
    aterstall: (a, lage: Skrivlage) =>
      skrivning(() => {
        const fel = opts.aterstallFel?.(a);
        if (fel) throw fel;
        aterstallda.push(a.slug);
        if (lage.stat && opts.strypningar) lage.stat.wix429 += opts.strypningar;
      }),
    stega: (a, _nu, lage: Skrivlage) =>
      skrivning(() => {
        const fel = opts.stegaFel?.(a);
        if (fel) throw fel;
        stegade.push(a.slug);
        if (lage.stat && opts.strypningar) lage.stat.wix429 += opts.strypningar;
      }),
    produktNu: (productId) =>
      skrivning(() => {
        if (!(opts.finns?.(productId) ?? true)) return { finns: false as const };
        if (opts.priser) return { finns: true as const, priser: opts.priser(productId) };
        const rad = [...opts.rader, ...(opts.avslutade ?? [])].find((x) => x.productId === productId);
        const priser = new Map<string, number>(
          rad?.variantPrices?.length ? rad.variantPrices.map((t) => [t.wixVariantId, t.listPrice]) : [[`v-${productId}`, rad?.listPrice ?? 1000]],
        );
        return { finns: true as const, priser };
      }),
    taBort: async (id) => {
      borttagna.push(id);
    },
    spara: async (docs) => {
      sparningar.push(structuredClone(docs));
      return opts.sparaFel?.(docs) ?? [];
    },
    uppdateraButiken: async (p) => {
      butiken.push(p.map((x) => x.id));
      return { utfall: "uppdaterad" };
    },
  };
  return { d, klocka, sparningar, stegade, aterstallda, borttagna, maxSamtidiga: () => max, butiken };
}

const raderad = () => new Error("patch GET 404: product not found");

describe("prissteget med 100 fynd", () => {
  it("☠️ alla 100 stegas med högst fyra anrop samtidigt, och sparas i ETT massanrop", async () => {
    const w = varld({ nu: "2026-11-10T09:00:30Z", rader: live(100, 2) });
    const r = await korTick(w.d);
    expect(r.priced).toHaveLength(100);
    expect(w.stegade).toHaveLength(100);
    expect(w.maxSamtidiga()).toBe(SAMTIDIGA);
    expect(w.sparningar).toHaveLength(1);
    expect(w.sparningar[0]).toHaveLength(100);
    const nu = T("2026-11-10T09:00:30Z");
    for (const doc of w.sparningar[0]) {
      expect(doc.lastPatchedStep).toBe(3);
      expect(doc.lastPatchedPrice).toBe(priceAt(doc, nu));
      expect(doc.status).toBe("live");
    }
    expect(r).toMatchObject({ ok: true, klar: true, liveCount: 100, mal: 10 });
    expect(w.butiken).toEqual([w.sparningar[0].map((x) => x.productId)]);
  });

  it("ett steg som redan är skrivet skrivs inte igen", async () => {
    const w = varld({ nu: "2026-11-10T09:20:00Z", rader: live(10, 3) });
    const r = await korTick(w.d);
    expect(r.priced).toHaveLength(0);
    expect(w.sparningar).toHaveLength(0);
    expect(w.butiken).toHaveLength(0);
  });

  it("☠️ tidsbudgeten: ingen skrivning startar efter den, och resten står i kvar till nästa tick", async () => {
    const w = varld({ nu: "2026-11-10T09:00:30Z", rader: live(100, 2), msPerSkrivning: 3_000 });
    const r = await korTick(w.d, { budgetMs: 60_000 });
    expect(r.priced.length).toBeGreaterThan(0);
    expect(r.kvar.prissteg).toBeGreaterThan(0);
    expect(r.priced.length + r.kvar.prissteg).toBe(100);
    // Fyra i luften när budgeten tar slut får skriva klart; ingen ny startar efter.
    expect(r.priced.length).toBeLessThanOrEqual(60_000 / 3_000 + SAMTIDIGA);
    expect(r.klar).toBe(false);
    expect(r.ok).toBe(true);
    // Det som hann skrivas sparas — annars skrivs samma pris om i nästa tick.
    expect(w.sparningar[0]).toHaveLength(r.priced.length);
  });

  it("strypningarna räknas i rapporten", async () => {
    const w = varld({ nu: "2026-11-10T09:00:30Z", rader: live(5, 2), strypningar: 2 });
    const r = await korTick(w.d);
    expect(r.wix429).toBe(10);
  });

  it("en raderad produkt tas bort ur auktionen, och platsen fylls samma tick", async () => {
    const rader = [...live(10, 2), ...ko(5)];
    const w = varld({
      nu: "2026-11-10T09:00:30Z",
      rader,
      stegaFel: (a) => (a.slug === "s4" ? raderad() : undefined),
    });
    const r = await korTick(w.d);
    expect(r.removedDead).toEqual(["s4"]);
    expect(w.borttagna).toEqual(["auction-p4"]);
    expect(r.promoted).toEqual([{ slug: "s1000", slot: 4, startAt: "2026-11-11T06:00:00.000Z" }]);
    expect(r.ok).toBe(true);
  });
});

describe("dagslutet kl 19", () => {
  it("☠️ 100 återställs med högst fyra samtidigt, sparas i ett massanrop, och morgondagens tio främjas", async () => {
    const w = varld({ nu: "2026-11-10T18:00:30Z", rader: [...live(100, 11), ...ko(20)] });
    const r = await korTick(w.d);
    expect(r.expired).toHaveLength(100);
    expect(w.maxSamtidiga()).toBeLessThanOrEqual(SAMTIDIGA);
    const [utgangna, framjade] = w.sparningar;
    expect(utgangna).toHaveLength(100);
    for (const doc of utgangna) expect(doc).toMatchObject({ status: "expired", endedAt: "2026-11-10T18:00:30.000Z" });
    expect(framjade).toHaveLength(10);
    expect(framjade.map((x) => x.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const doc of framjade) expect(doc).toMatchObject({ status: "live", startAt: "2026-11-11T06:00:00.000Z", lastPatchedStep: 0 });
    expect(r).toMatchObject({ ok: true, klar: true, mal: 10, liveCount: 10 });
  });

  it("☠️ en auktion vars återställning föll sänks inte till golvet efter kl 19", async () => {
    const rader = live(3, 10); // steg 10 skrivet, steg 11 (golvet) aldrig
    const w = varld({
      nu: "2026-11-10T18:00:30Z",
      rader,
      aterstallFel: (a) => (a.slug === "s2" ? new Error("patch PATCH 500: boom") : undefined),
    });
    const r = await korTick(w.d);
    expect(r.expired).toEqual(expect.arrayContaining(["s1", "s3"]));
    expect(r.errors).toEqual([expect.stringContaining("expire s2")]);
    expect(w.stegade).toEqual([]);
    expect(r.priced).toEqual([]);
  });

  it("☠️ ett sparfel på dagslutet stoppar främjandena — lagret säger att raden fortfarande är live", async () => {
    const w = varld({
      nu: "2026-11-10T18:00:30Z",
      rader: [...live(10, 11), ...ko(20)],
      sparaFel: (docs) => (docs[0]?.status === "expired" ? [{ id: "auction-p3", fel: "WDE0014" }] : []),
    });
    const r = await korTick(w.d);
    expect(r.framjandenVantar).toBe("sparfel");
    expect(r.promoted).toEqual([]);
    expect(r.kvar.framjanden).toBe(10);
    expect(r.errors).toEqual(["spara expire auction-p3: WDE0014"]);
    expect(r.ok).toBe(false);
  });
});

describe("synkfönstret", () => {
  it("☠️ främjanden startar inte i fönstret, men återställningen kl 19 väntar aldrig", async () => {
    const w = varld({ nu: "2026-11-10T18:15:00Z", rader: [...live(10, 11), ...ko(20)] });
    const r = await korTick(w.d);
    expect(r.expired).toHaveLength(10);
    expect(r.promoted).toEqual([]);
    expect(r.framjandenVantar).toBe("synkfonster");
    expect(r.kvar.framjanden).toBe(10);
    expect(r.klar).toBe(false);
    expect(r.ok).toBe(true);
  });

  it("och inte heller så nära fönstret att en minut inte ryms", async () => {
    const w = varld({ nu: "2026-11-10T18:11:30Z", rader: [...live(10, 11), ...ko(20)] });
    const r = await korTick(w.d);
    expect(r.framjandenVantar).toBe("synkfonster");
    expect(r.promoted).toEqual([]);
  });

  it("efter fönstret främjas de", async () => {
    const w = varld({ nu: "2026-11-10T18:30:05Z", rader: [...live(0, 0), ...ko(20)] });
    const r = await korTick(w.d);
    expect(r.promoted).toHaveLength(10);
    expect(r.framjandenVantar).toBeUndefined();
  });
});

describe("såld-kollen", () => {
  const order = (productId: string, iso: string): Order => ({
    _createdDate: iso,
    lineItems: [{ catalogReference: { catalogItemId: productId }, quantity: 1 }],
  });

  it("en såld återställs och sparas som sold; resten stegas", async () => {
    const w = varld({ nu: "2026-11-10T09:00:30Z", rader: live(5, 2), ordrar: [order("p2", "2026-11-10T08:30:00Z")] });
    const r = await korTick(w.d);
    expect(r.sold).toEqual([{ slug: "s2", soldPrice: LADDER[2] }]);
    expect(w.aterstallda).toEqual(["s2"]);
    expect(w.stegade.sort()).toEqual(["s1", "s3", "s4", "s5"]);
    expect(w.sparningar[0]).toEqual([expect.objectContaining({ slug: "s2", status: "sold", soldPrice: LADDER[2] })]);
  });

  it("☠️ en såld vars återställning föll sänks inte vidare, och avslutas inte som expired", async () => {
    const w = varld({
      nu: "2026-11-10T18:00:30Z",
      rader: live(3, 10),
      ordrar: [order("p1", "2026-11-10T17:30:00Z")],
      aterstallFel: (a) => (a.slug === "s1" ? new Error("patch PATCH 503: upptagen") : undefined),
    });
    const r = await korTick(w.d);
    expect(r.sold).toEqual([]);
    expect(r.expired.sort()).toEqual(["s2", "s3"]);
    expect(w.stegade).toEqual([]);
    expect(r.errors).toEqual([expect.stringContaining("sold s1")]);
  });

  it("☠️ mitt på dagen: en såld vars återställning föll får inget lägre pris", async () => {
    const w = varld({
      nu: "2026-11-10T09:00:30Z",
      rader: live(3, 2),
      ordrar: [order("p2", "2026-11-10T08:30:00Z")],
      aterstallFel: (a) => (a.slug === "s2" ? new Error("patch PATCH 503: upptagen") : undefined),
    });
    const r = await korTick(w.d);
    expect(w.stegade.sort()).toEqual(["s1", "s3"]);
    expect(r.errors).toEqual([expect.stringContaining("sold s2")]);
    // Raden står kvar som live i lagret, så platsen räknas som upptagen.
    expect(r.liveCount).toBe(3);
  });

  it("☠️ går ordrarna inte att läsa står det i rapporten, och resten av ticket går ändå", async () => {
    const w = varld({ nu: "2026-11-10T09:00:30Z", rader: live(4, 2), ordrar: new Error("Wix orders/search misslyckades (403)") });
    const r = await korTick(w.d);
    expect(r.errors).toEqual([expect.stringContaining("ordrarna gick inte att läsa")]);
    expect(r.priced).toHaveLength(4);
    expect(r.ok).toBe(false);
  });

  it("ett köp före auktionens start räknas inte", async () => {
    const w = varld({ nu: "2026-11-10T09:00:30Z", rader: live(2, 2), ordrar: [order("p1", "2026-11-10T05:59:00Z")] });
    const r = await korTick(w.d);
    expect(r.sold).toEqual([]);
  });
});

describe("påfyllningen", () => {
  it("existensen kollas fyra i taget, och en raderad kandidat hoppas över och tas bort", async () => {
    const w = varld({ nu: "2026-11-10T19:05:00Z", rader: ko(15), finns: (id) => id !== "p1003" });
    const r = await korTick(w.d);
    expect(r.promoted.map((p) => p.slug)).toEqual(["s1000", "s1001", "s1002", "s1004", "s1005", "s1006", "s1007", "s1008", "s1009", "s1010"]);
    expect(r.removedDead).toEqual(["s1003"]);
    expect(w.maxSamtidiga()).toBeLessThanOrEqual(SAMTIDIGA);
  });

  it("en främjning som inte sparades räknas inte som främjad", async () => {
    const w = varld({
      nu: "2026-11-10T19:05:00Z",
      rader: ko(10),
      sparaFel: (docs) => (docs[0]?.status === "live" ? [{ id: "auction-p1002", fel: "WDE0014" }] : []),
    });
    const r = await korTick(w.d);
    expect(r.promoted).toHaveLength(9);
    expect(r.promoted.map((p) => p.slug)).not.toContain("s1002");
    expect(r.errors).toEqual(["promote auction-p1002: WDE0014"]);
    expect(r.liveCount).toBe(9);
  });

  it("tar kön slut är det inget kvar — nästa tick har inget mer att främja", async () => {
    const w = varld({ nu: "2026-11-10T19:05:00Z", rader: ko(4) });
    const r = await korTick(w.d);
    expect(r.promoted).toHaveLength(4);
    expect(r.kvar.framjanden).toBe(0);
    expect(r.klar).toBe(true);
  });
});

describe("☠️ främjandet kräver varans pris just nu (fynden 12–14/11)", () => {
  // 20:00 svensk tid: dagens fynd är slut, och tio ska schemaläggas till i morgon.
  const KVALL = "2026-11-10T19:05:00Z";

  it("en rad vars pris ändrats sedan seeden främjas inte, och nästa i kön tar platsen", async () => {
    const w = varld({
      nu: KVALL,
      rader: ko(12),
      priser: (id) => new Map([[`v-${id}`, id === "p1000" || id === "p1003" ? 900 : 1000]]),
    });
    const r = await korTick(w.d);
    expect(r.promoted.map((x) => x.slug)).toEqual(["s1001", "s1002", "s1004", "s1005", "s1006", "s1007", "s1008", "s1009", "s1010", "s1011"]);
    expect(r.prisHoppade).toEqual([
      { slug: "s1000", skal: "pris_andrat" },
      { slug: "s1003", skal: "pris_andrat" },
    ]);
    // Raderna står kvar i kön: ingenting raderas, och de sparas inte som live.
    expect(w.borttagna).toEqual([]);
    const sparade = w.sparningar.flat().map((x) => x.slug);
    expect(sparade).not.toContain("s1000");
    expect(sparade).not.toContain("s1003");
    expect(r.errors).toEqual([]);
  });

  it("ett pris som inte går att läsa: raden står kvar, raderas inte och främjas inte", async () => {
    const w = varld({ nu: KVALL, rader: ko(11), priser: (id) => (id === "p1000" ? null : new Map([[`v-${id}`, 1000]])) });
    const r = await korTick(w.d);
    expect(r.prisHoppade).toEqual([{ slug: "s1000", skal: "pris_okant" }]);
    expect(r.promoted).toHaveLength(10);
    expect(r.promoted.map((x) => x.slug)).not.toContain("s1000");
    expect(w.borttagna).toEqual([]);
  });

  it("☠️ Wix stryper läsningarna: ticken slutar läsa, och resten väntar till nästa tick", async () => {
    let lasta = 0;
    const w = varld({
      nu: KVALL,
      rader: ko(40),
      priser: () => {
        lasta++;
        return null;
      },
    });
    const r = await korTick(w.d);
    // En omgång om tio (de lediga platserna) felar helt: inte hela kön läses.
    expect(lasta).toBe(10);
    expect(r.promoted).toEqual([]);
    expect(r.prisHoppade).toHaveLength(10);
    expect(r.prisHoppade?.every((x) => x.skal === "pris_okant")).toBe(true);
    expect(r.kvar.framjanden).toBe(10);
    expect(r.klar).toBe(false);
    expect(w.borttagna).toEqual([]);
  });

  it("ett oläsbart pris när kön tar slut är kvar till nästa tick, inte en tom kö", async () => {
    const w = varld({ nu: KVALL, rader: ko(10), priser: (id) => (id === "p1000" ? null : new Map([[`v-${id}`, 1000]])) });
    const r = await korTick(w.d);
    expect(r.promoted).toHaveLength(9);
    expect(r.kvar.framjanden).toBe(1);
    expect(r.klar).toBe(false);
  });

  it("en raderad produkt slängs som förut", async () => {
    const w = varld({ nu: KVALL, rader: ko(11), finns: (id) => id !== "p1000" });
    const r = await korTick(w.d);
    expect(r.removedDead).toContain("s1000");
    expect(r.promoted).toHaveLength(10);
    expect(r.prisHoppade).toBeUndefined();
  });

  it("räcker inte kön med rätt pris: färre fynd, aldrig ett med fel pris", async () => {
    const w = varld({ nu: KVALL, rader: ko(12), priser: (id) => new Map([[`v-${id}`, Number(id.slice(1)) % 2 === 0 ? 1000 : 1100]]) });
    const r = await korTick(w.d);
    expect(r.promoted).toHaveLength(6);
    expect(r.promoted.every((x) => Number(x.slug.slice(1)) % 2 === 0)).toBe(true);
    expect(r.prisHoppade).toHaveLength(6);
    // Kön tog slut: inget "kvar" (raderna väntar på nästa natts seed).
    expect(r.kvar.framjanden).toBe(0);
  });
});

describe("☠️ pristaket: ingen rad över 2 000 kr främjas (Leonard 2026-11-18)", () => {
  // 20:00 svensk tid: dagens fynd är slut, och tio ska schemaläggas till i morgon.
  const KVALL = "2026-11-10T19:05:00Z";
  const dyrtSpar = (id: string) => [
    { wixVariantId: `liten-${id}`, listPrice: 1499, floorPrice: 1279, ladder: buildLadder(1499, 1279) },
    { wixVariantId: `stor-${id}`, listPrice: 2899, floorPrice: 2469, ladder: buildLadder(2899, 2469) },
  ];

  it("en köad rad över taket främjas inte, läses inte i Wix och står kvar i kön", async () => {
    const rader = ko(12);
    rader[0] = { ...rader[0], listPrice: 2499, floorPrice: 2129, ladder: buildLadder(2499, 2129) };
    // Kortet visar 1 499 kr, men den stora storleken kostar 2 899 kr.
    rader[3] = { ...rader[3], listPrice: 1499, floorPrice: 1279, ladder: buildLadder(1499, 1279), variantPrices: dyrtSpar("p1003") };
    const lasta: string[] = [];
    const w = varld({ nu: KVALL, rader });
    const produktNu = w.d.produktNu;
    w.d.produktNu = (id) => {
      lasta.push(id);
      return produktNu(id);
    };
    const r = await korTick(w.d);
    expect(r.promoted.map((x) => x.slug)).toEqual(["s1001", "s1002", "s1004", "s1005", "s1006", "s1007", "s1008", "s1009", "s1010", "s1011"]);
    expect(lasta).not.toContain("p1000");
    expect(lasta).not.toContain("p1003");
    // Raderna står kvar tills nattens seed tar bort dem: inget raderas här.
    expect(w.borttagna).toEqual([]);
    const sparade = w.sparningar.flat().map((x) => x.slug);
    expect(sparade).not.toContain("s1000");
    expect(sparade).not.toContain("s1003");
    expect(r.prisHoppade).toBeUndefined();
    expect(r.errors).toEqual([]);
  });

  it("exakt 2 000 kr främjas", async () => {
    const rader = ko(10);
    rader[0] = { ...rader[0], listPrice: 2000, floorPrice: 1709, ladder: buildLadder(2000, 1709) };
    const r = await korTick(varld({ nu: KVALL, rader }).d);
    expect(r.promoted).toHaveLength(10);
    expect(r.promoted[0].slug).toBe("s1000");
  });

  it("☠️ en avslutad rad över taket återvinns inte när kön sinar", async () => {
    // Seeden rör inte avslutade rader, så taket måste prövas här.
    const gammal = "2026-09-01T17:00:00.000Z";
    const avslutade = [
      auktion(1, { status: "expired", endedAt: gammal, listPrice: 2499, floorPrice: 2129, ladder: buildLadder(2499, 2129) }),
      auktion(2, { status: "sold", endedAt: gammal }),
      auktion(3, { status: "expired", endedAt: gammal, listPrice: 1499, floorPrice: 1279, ladder: buildLadder(1499, 1279), variantPrices: dyrtSpar("p3") }),
    ];
    const w = varld({ nu: KVALL, rader: ko(8), avslutade });
    const r = await korTick(w.d);
    expect(r.promoted).toHaveLength(9);
    expect(r.promoted.map((x) => x.slug)).toContain("s2");
    expect(r.promoted.map((x) => x.slug)).not.toContain("s1");
    expect(r.promoted.map((x) => x.slug)).not.toContain("s3");
    expect(r.recycled).toEqual(["s2"]);
  });

  it("bara rader över taket i kön: färre fynd, aldrig ett över taket", async () => {
    const rader = ko(12).map((a, i) => (i % 2 === 0 ? { ...a, listPrice: 2499, floorPrice: 2129, ladder: buildLadder(2499, 2129) } : a));
    const r = await korTick(varld({ nu: KVALL, rader }).d);
    expect(r.promoted).toHaveLength(6);
    expect(r.promoted.every((x) => Number(x.slug.slice(1)) % 2 === 1)).toBe(true);
    // Kön tog slut: inget "kvar" (taket ändras inte till nästa tick).
    expect(r.kvar.framjanden).toBe(0);
  });
});
