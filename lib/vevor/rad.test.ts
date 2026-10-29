import { describe, expect, it } from "vitest";
import { lagerbesked, PROFILER } from "@/lib/sync/leverantorsrad";
import { MAX_ALDER_MS, vevorRad } from "./rad";
import type { Avlasning } from "./lager";
import { vevorLandadKostnadSek } from "./pris";

const NU = Date.parse("2026-10-29T12:00:00.000Z");

function avlasning(over: Partial<Avlasning> = {}): Avlasning {
  return {
    sku: "TESTSKUABCDEFGH0001",
    spu: null,
    namn: "Test",
    prisSek: 999,
    saldo: 7,
    flode: "EU",
    levererasTillSe: true,
    fraktSe: { belopp: 0, valuta: "EUR" },
    kategorier: [],
    egenskaper: [],
    spec: [],
    punkter: [],
    beskrivning: "",
    bilder: [],
    manualSokvag: null,
    syskon: [],
    webbId: "000000000001",
    sokvag: "/test-c_1/test-p_000000000001",
    lastAt: new Date(NU - 3_600_000).toISOString(),
    status: "i_lager",
    toppkategoriId: null,
    toppkategori: null,
    borta: false,
    bortaAt: null,
    misslyckadAt: null,
    ...over,
  };
}

const profil = PROFILER.vevor!;
const synligt = (s: number) => s;

describe("vevorRad", () => {
  it("en färsk avläsning i lager är i lager, med VEVOR:s saldo", () => {
    expect(vevorRad(avlasning(), NU, false)).toMatchObject({ leverantor: "vevor", status: "i_lager", saldo: 7 });
  });

  it("saldo 0 är slut", () => {
    expect(vevorRad(avlasning({ saldo: 0, status: "slut" }), NU, false)?.status).toBe("slut");
  });

  it("utan Sverige, eller från ett annat lager än EU, levereras den inte hit", () => {
    expect(vevorRad(avlasning({ levererasTillSe: false }), NU, false)?.status).toBe("ej_levererbar");
    expect(vevorRad(avlasning({ flode: "CN" }), NU, false)?.status).toBe("ej_levererbar");
  });

  it("☠️ en avläsning äldre än 12 timmar är okänd — och okänt rör aldrig lagret", () => {
    const gammal = avlasning({ lastAt: new Date(NU - MAX_ALDER_MS - 1).toISOString(), saldo: 0, status: "slut" });
    const rad = vevorRad(gammal, NU, false);
    expect(rad?.status).toBe("okand");
    expect(lagerbesked(rad, profil, synligt).kant).toBe(false);
  });

  it("☠️ en fryst läsare gör allt okänt, även en färsk avläsning", () => {
    expect(vevorRad(avlasning(), NU, true)?.status).toBe("okand");
  });

  it("borta är ett bekräftat besked och åldras inte", () => {
    const borta = avlasning({ borta: true, status: "borta", lastAt: new Date(NU - 5 * 86_400_000).toISOString() });
    const rad = vevorRad(borta, NU, false);
    expect(rad?.status).toBe("borta");
    expect(lagerbesked(rad, profil, synligt)).toMatchObject({ kant: true, synligt: 0, saknas: true });
  });

  it("☠️ ingen avläsning alls: VEVOR-profilen säger okänd, inte slut", () => {
    expect(vevorRad(undefined, NU, false)).toBeUndefined();
    expect(lagerbesked(undefined, profil, synligt).kant).toBe(false);
  });

  it("ett trasigt eller framtida datum är okänt", () => {
    expect(vevorRad(avlasning({ lastAt: "inte ett datum" }), NU, false)?.status).toBe("okand");
    expect(vevorRad(avlasning({ lastAt: new Date(NU + 3_600_000).toISOString() }), NU, false)?.status).toBe("okand");
  });

  it("☠️ senaste försöket misslyckades: okänd direkt, inte först efter tolv timmar", () => {
    const fore = new Date(NU - 3_600_000).toISOString();
    const efter = new Date(NU - 600_000).toISOString();
    const rad = vevorRad(avlasning({ lastAt: fore, misslyckadAt: efter, saldo: 0, status: "slut" }), NU, false);
    expect(rad?.status).toBe("okand");
    expect(lagerbesked(rad, profil, synligt).kant).toBe(false);
  });

  it("ett misslyckande före den giltiga läsningen spelar ingen roll", () => {
    const fore = new Date(NU - 3_600_000).toISOString();
    const efter = new Date(NU - 600_000).toISOString();
    expect(vevorRad(avlasning({ lastAt: efter, misslyckadAt: fore }), NU, false)?.status).toBe("i_lager");
  });

  it("en äldre avläsning utan fältet är som förut", () => {
    const { misslyckadAt: _, ...utan } = avlasning();
    expect(vevorRad(utan as Avlasning, NU, false)?.status).toBe("i_lager");
  });

  it("priset rörs inte än: den landade kostnaden är null", () => {
    expect(vevorRad(avlasning(), NU, false)?.landadKostnadSek).toBeNull();
  });
});

describe("vevorRad: kostnaden (steg 5)", () => {
  // ☠️ Påhittad rabatt. Nivån står aldrig i repot.
  const RABATT = 0.05;

  it("landad kostnad räknas med importens regel, och föregående avläsnings på samma sätt", () => {
    const r = vevorRad(avlasning({ prisSek: 999, forraPrisSek: 1099 }), NU, false, RABATT);
    expect(r?.landadKostnadSek).toBe(vevorLandadKostnadSek(999, RABATT));
    expect(r?.forraLandadKostnadSek).toBe(vevorLandadKostnadSek(1099, RABATT));
  });

  it("☠️ utan rabatt bär raden ingen kostnad, och då rörs priset inte", () => {
    const r = vevorRad(avlasning({ forraPrisSek: 999 }), NU, false, null);
    expect(r?.landadKostnadSek).toBeNull();
    expect(r?.forraLandadKostnadSek).toBeNull();
    expect(vevorRad(avlasning(), NU, false)?.landadKostnadSek).toBeNull();
  });

  it("ett pris som inte är ett positivt tal ger ingen kostnad, men saldot gäller", () => {
    const r = vevorRad(avlasning({ prisSek: 0, saldo: 4 }), NU, false, RABATT);
    expect(r).toMatchObject({ status: "i_lager", saldo: 4, landadKostnadSek: null });
  });

  it("ingen föregående avläsning: ingen föregående kostnad", () => {
    expect(vevorRad(avlasning({ forraPrisSek: null }), NU, false, RABATT)?.forraLandadKostnadSek).toBeNull();
    expect(vevorRad(avlasning(), NU, false, RABATT)?.forraLandadKostnadSek).toBeNull();
  });

  it("☠️ en okänd, borttagen eller ej levererbar rad bär aldrig en kostnad", () => {
    const gammal = avlasning({ lastAt: new Date(NU - MAX_ALDER_MS - 60_000).toISOString(), forraPrisSek: 999 });
    for (const a of [gammal, avlasning({ borta: true, status: "borta" }), avlasning({ levererasTillSe: false })]) {
      const r = vevorRad(a, NU, false, RABATT);
      expect(r?.landadKostnadSek).toBeNull();
      expect(r?.forraLandadKostnadSek ?? null).toBeNull();
    }
    expect(vevorRad(avlasning(), NU, true, RABATT)?.landadKostnadSek).toBeNull();
  });
});
