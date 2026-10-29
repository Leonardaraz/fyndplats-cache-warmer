import { describe, expect, it } from "vitest";
import { lagerbesked, PROFILER } from "@/lib/sync/leverantorsrad";
import { MAX_ALDER_MS, vevorRad } from "./rad";
import type { Avlasning } from "./lager";

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
