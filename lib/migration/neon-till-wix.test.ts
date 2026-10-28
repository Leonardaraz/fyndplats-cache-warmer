import { describe, expect, it } from "vitest";
import { godkand, jamforbar, skiljandeFalt, synka, type Kalla, type KallRad, type WixPost, type WixSida } from "./neon-till-wix";

// En Neon-tabell i minnet.
function neon(namn: string, rader: KallRad[]): Kalla {
  const sorterade = [...rader].sort((a, b) => (a.id < b.id ? -1 : 1));
  return {
    namn,
    kollektion: `K_${namn}`,
    async lasNeon(efter, antal) {
      return sorterade.filter((r) => efter === null || r.id > efter).slice(0, antal);
    },
    async raknaNeon() {
      return sorterade.length;
    },
    async finnsINeon(idn) {
      return new Set(idn.filter((id) => sorterade.some((r) => r.id === id)));
    },
  };
}

// Wix i minnet, med systemfält som stämplas vid varje skrivning.
function wixMinne(start: Record<string, WixPost[]> = {}, klocka = () => "2026-10-29T10:00:00.000Z") {
  const data = new Map<string, Map<string, WixPost>>();
  for (const [k, rader] of Object.entries(start)) data.set(k, new Map(rader.map((r) => [r._id, r])));
  const kol = (k: string) => data.get(k) ?? data.set(k, new Map()).get(k)!;
  const sida: WixSida = {
    async hamtaIdn(k, idn) {
      return idn.map((id) => kol(k).get(id)).filter((r): r is WixPost => Boolean(r));
    },
    async sidaEfter(k, efter, antal) {
      return [...kol(k).values()].sort((a, b) => (a._id < b._id ? -1 : 1)).filter((r) => efter === null || r._id > efter).slice(0, antal);
    },
    async rakna(k) {
      return kol(k).size;
    },
    async spara(k, rader) {
      for (const r of rader) {
        const fore = kol(k).get(r.id);
        kol(k).set(r.id, { ...r.data, _id: r.id, _createdDate: fore?._createdDate ?? klocka(), _updatedDate: klocka() });
      }
      return { sparade: rader.length, fel: [] };
    },
    async taBort(k, idn) {
      for (const id of idn) kol(k).delete(id);
      return { borttagna: idn.length, fel: [] };
    },
  };
  return { sida, data, kol };
}

describe("jämförelsen", () => {
  it("bryr sig inte om systemfält, nyckelordning eller {$date}", () => {
    expect(jamforbar({ _id: "a", _updatedDate: "x", anspraksToken: "k", at: { $date: "2026-01-01T00:00:00.000Z" }, b: { y: 1, x: 2 } })).toEqual({
      at: "2026-01-01T00:00:00.000Z",
      b: { y: 1, x: 2 },
    });
    expect(skiljandeFalt({ a: 1, b: { x: 1, y: 2 } }, { _id: "z", b: { y: 2, x: 1 }, a: 1 })).toEqual([]);
    expect(skiljandeFalt({ a: 1, v: [1, 2] }, { a: 1, v: [2, 1] })).toEqual(["v"]);
  });
});

describe("kopiera", () => {
  it("skriver det som saknas och det som skiljer, och raderar aldrig", async () => {
    const w = wixMinne({ K_t: [{ _id: "b", v: 1 }, { _id: "c", v: 9 }, { _id: "x", v: 0 }] });
    const s = await synka(
      [neon("t", [{ id: "a", data: { v: 1 } }, { id: "b", data: { v: 1 } }, { id: "c", data: { v: 2 } }])],
      w.sida,
      { lage: "kopiera", dryRun: false },
    );
    const t = s.tabeller[0];
    expect([t.granskade, t.lika, t.saknas, t.olika, t.skrivna]).toEqual([3, 1, 1, 1, 2]);
    expect(t.olikaFalt).toEqual({ v: 1 });
    expect(w.kol("K_t").get("a")?.v).toBe(1);
    expect(w.kol("K_t").get("c")?.v).toBe(2);
    // ☠️ "x" saknas i Neon men ligger kvar: kopiera raderar aldrig.
    expect(w.kol("K_t").has("x")).toBe(true);
  });

  it("är torr som default", async () => {
    const w = wixMinne();
    const s = await synka([neon("t", [{ id: "a", data: { v: 1 } }])], w.sida, { lage: "kopiera" });
    expect(s.dryRun).toBe(true);
    expect(s.tabeller[0].saknas).toBe(1);
    expect(w.kol("K_t").size).toBe(0);
  });
});

describe("verifiera", () => {
  it("skriver ingenting och godkänner bara en exakt kopia", async () => {
    const w = wixMinne({ K_t: [{ _id: "a", v: 1 }, { _id: "x", v: 0 }] });
    const s = await synka([neon("t", [{ id: "a", data: { v: 1 } }, { id: "b", data: { v: 2 } }])], w.sida, {
      lage: "verifiera",
      dryRun: false,
    });
    expect(s.dryRun).toBe(true);
    expect(s.tabeller[0]).toMatchObject({ lika: 1, saknas: 1, extra: 1, skrivna: 0, borttagna: 0 });
    expect(godkand(s)).toBe(false);
    expect(w.kol("K_t").size).toBe(2);

    const exakt = wixMinne({ K_t: [{ _id: "a", v: 1 }] });
    expect(godkand(await synka([neon("t", [{ id: "a", data: { v: 1 } }])], exakt.sida, { lage: "verifiera" }))).toBe(true);
  });
});

describe("delta — efter växlingen", () => {
  const KOPIERAD = "2026-10-29T09:00:00.000Z";
  const VAXLING = "2026-10-29T09:30:00.000Z";
  const fore = "2026-10-29T09:10:00.000Z"; // kopieringens skrivning
  const efter = "2026-10-29T09:45:00.000Z"; // driftens skrivning efter växlingen

  it("☠️ en rad drift rört efter växlingen vinner över Neon", async () => {
    const w = wixMinne({ K_t: [{ _id: "a", v: "wix", _createdDate: fore, _updatedDate: efter }] });
    const s = await synka([neon("t", [{ id: "a", data: { v: "neon" }, andrad: Date.parse("2026-10-29T09:20:00Z") }])], w.sida, {
      lage: "delta",
      dryRun: false,
      vaxling: VAXLING,
      kopieradSedan: KOPIERAD,
    });
    expect(s.tabeller[0].wixNyare).toBe(1);
    expect(w.kol("K_t").get("a")?.v).toBe("wix");
  });

  it("en rad Neon ändrat efter kopieringen, som Wix bara har i kopians form, skrivs", async () => {
    const w = wixMinne({ K_t: [{ _id: "a", v: "gammal", _createdDate: fore, _updatedDate: fore }] });
    await synka([neon("t", [{ id: "a", data: { v: "ny" }, andrad: Date.parse("2026-10-29T09:20:00Z") }])], w.sida, {
      lage: "delta",
      dryRun: false,
      vaxling: VAXLING,
      kopieradSedan: KOPIERAD,
    });
    expect(w.kol("K_t").get("a")?.v).toBe("ny");
  });

  it("en rad Neon skapade efter kopieringen skrivs till Wix", async () => {
    const w = wixMinne();
    const s = await synka([neon("t", [{ id: "ny", data: { v: 1 }, andrad: Date.parse("2026-10-29T09:20:00Z") }])], w.sida, {
      lage: "delta",
      dryRun: false,
      vaxling: VAXLING,
      kopieradSedan: KOPIERAD,
    });
    expect(s.tabeller[0].saknas).toBe(1);
    expect(w.kol("K_t").has("ny")).toBe(true);
  });

  it("☠️ en rad drift tagit bort efter växlingen väcks inte till liv", async () => {
    // Raden fanns före kopieringen (andrad < KOPIERAD), kopierades, och drift
    // tog bort den efter växlingen. Neon har den fortfarande.
    const w = wixMinne();
    const s = await synka([neon("t", [{ id: "borta", data: { v: 1 }, andrad: Date.parse("2026-10-28T12:00:00Z") }])], w.sida, {
      lage: "delta",
      dryRun: false,
      vaxling: VAXLING,
      kopieradSedan: KOPIERAD,
    });
    expect(s.tabeller[0].borttagenIWix).toBe(1);
    expect(w.kol("K_t").has("borta")).toBe(false);
  });

  it("☠️ en Wix-rad som saknas i Neon tas bort bara om kopieringen skapade den", async () => {
    const w = wixMinne({
      K_t: [
        { _id: "kopia", v: 1, _createdDate: fore, _updatedDate: fore }, // Neon tog bort den mellan kopiering och växling
        { _id: "ny-i-drift", v: 2, _createdDate: efter, _updatedDate: efter },
        { _id: "rord-i-drift", v: 3, _createdDate: fore, _updatedDate: efter },
      ],
    });
    const s = await synka([neon("t", [])], w.sida, { lage: "delta", dryRun: false, vaxling: VAXLING, kopieradSedan: KOPIERAD });
    expect(s.tabeller[0]).toMatchObject({ extra: 1, nyaIWix: 2, borttagna: 1 });
    expect([...w.kol("K_t").keys()].sort()).toEqual(["ny-i-drift", "rord-i-drift"]);
  });

  it("kräver vaxling och kopieradSedan, i rätt ordning", async () => {
    const w = wixMinne();
    await expect(synka([], w.sida, { lage: "delta", kopieradSedan: KOPIERAD })).rejects.toThrow(/vaxling/);
    await expect(synka([], w.sida, { lage: "delta", vaxling: VAXLING })).rejects.toThrow(/kopieradSedan/);
    await expect(synka([], w.sida, { lage: "delta", vaxling: KOPIERAD, kopieradSedan: VAXLING })).rejects.toThrow(/före/);
  });
});

describe("markören", () => {
  it("stannar på tidsbudgeten och fortsätter där den slutade", async () => {
    const rader = Array.from({ length: 1200 }, (_, i) => ({ id: `r${String(i).padStart(4, "0")}`, data: { i } }));
    const w = wixMinne();
    let t = 0;
    const forsta = await synka([neon("t", rader)], w.sida, {
      lage: "kopiera",
      dryRun: false,
      tidsbudgetMs: 1,
      now: () => (t += 1),
    });
    expect(forsta.stoppadAv).toBe("tidsbudget");
    expect(forsta.markor).toEqual({ tabell: "t", fas: "fram", efter: "r0499" });
    const andra = await synka([neon("t", rader)], w.sida, { lage: "kopiera", dryRun: false, efter: forsta.markor });
    expect(andra.stoppadAv).toBe("klart");
    expect(w.kol("K_t").size).toBe(1200);
  });
});

describe("jämförelsens normalisering", () => {
  it("null och saknat är samma sak, men ett värde mot null skiljer", () => {
    expect(skiljandeFalt({ a: null, b: { c: null, d: 1 } }, { b: { d: 1 } })).toEqual([]);
    expect(skiljandeFalt({ a: 1 }, { a: null })).toEqual(["a"]);
  });

  it("ett Wix-datum utan millisekunder är samma tid", () => {
    expect(skiljandeFalt({ at: "2026-10-28T10:00:00.000Z" }, { at: { $date: "2026-10-28T10:00:00Z" } })).toEqual([]);
  });
});
