import { describe, expect, it } from "vitest";
import {
  AOSOM_PROFIL,
  lagerbesked,
  PROFILER,
  VEVOR_PROFIL,
  type Leverantorsprofil,
  type Leverantorsrad,
} from "./leverantorsrad";

// ☠️ Påhittade artikelnummer. Inga riktiga nummer i ett publikt repo.
const rad = (over: Partial<Leverantorsrad> = {}): Leverantorsrad => ({
  leverantor: "aosom",
  artikel: "TEST-0001",
  status: "i_lager",
  saldo: 5,
  landadKostnadSek: 1000,
  lastAt: "2026-10-21T06:00:00Z",
  ...over,
});
const SLUT_OM_SAKNAS: Leverantorsprofil = { ...AOSOM_PROFIL, saknadRad: "slut" };
const OKANT_OM_SAKNAS: Leverantorsprofil = { ...VEVOR_PROFIL, saknadRad: "okand" };
const utanBuffert = (n: number) => Math.max(0, Math.trunc(n));
const medBuffertTva = (n: number) => Math.max(0, Math.trunc(n) - 2);

describe("lagerbesked", () => {
  it("i lager: saldot efter bufferten, och priset kan räknas", () => {
    expect(lagerbesked(rad({ saldo: 5 }), SLUT_OM_SAKNAS, utanBuffert)).toEqual({
      kant: true, synligt: 5, ejLevererbar: false, saknas: false, slut: false, landad: 1000, forraLandad: null,
    });
  });

  it("☠️ slut räknas ur det SYNLIGA saldot — en buffert kan göra ett litet saldo till 0", () => {
    expect(lagerbesked(rad({ saldo: 2 }), SLUT_OM_SAKNAS, medBuffertTva).slut).toBe(true);
    expect(lagerbesked(rad({ status: "slut", saldo: 0 }), SLUT_OM_SAKNAS, utanBuffert).slut).toBe(true);
  });

  it("☠️ ej levererbar nollas men räknas inte som slut, och priset rörs inte", () => {
    const b = lagerbesked(rad({ status: "ej_levererbar", saldo: 0 }), SLUT_OM_SAKNAS, utanBuffert);
    expect(b).toMatchObject({ kant: true, ejLevererbar: true, slut: false, landad: null });
  });

  it("en saknad rad med regeln slut: saldo 0, räknas som saknad, inget pris", () => {
    expect(lagerbesked(undefined, SLUT_OM_SAKNAS, utanBuffert)).toEqual({
      kant: true, synligt: 0, ejLevererbar: false, saknas: true, slut: false, landad: null, forraLandad: null,
    });
  });

  it("☠️ en saknad rad med regeln okänd: VI VET INTE — ingenting ska röras", () => {
    const b = lagerbesked(undefined, OKANT_OM_SAKNAS, utanBuffert);
    expect(b.kant).toBe(false);
    expect(b.landad).toBeNull();
  });

  it("☠️ ett okänt besked är okänt oavsett profil, och oavsett saldot på raden", () => {
    for (const profil of [SLUT_OM_SAKNAS, OKANT_OM_SAKNAS]) {
      expect(lagerbesked(rad({ status: "okand", saldo: 9 }), profil, utanBuffert).kant).toBe(false);
    }
  });

  it("borta: saldo 0 och räknas som saknad", () => {
    expect(lagerbesked(rad({ status: "borta", saldo: 9 }), OKANT_OM_SAKNAS, utanBuffert)).toMatchObject({
      kant: true, synligt: 0, saknas: true, landad: null,
    });
  });

  it("en rad utan känd kostnad prissätts inte, men lagret gäller", () => {
    const b = lagerbesked(rad({ landadKostnadSek: null }), SLUT_OM_SAKNAS, utanBuffert);
    expect(b).toMatchObject({ kant: true, synligt: 5, landad: null });
  });
});

const TIMME = 3_600_000;

describe("PROFILER", () => {
  it("Aosom: samma tal som före steg 5 — saknad rad är slut, buffert 0, 2 000 rader, tolv timmar", () => {
    expect(PROFILER.aosom).toEqual({
      saknadRad: "slut",
      konkurrentregel: true,
      prefix: "aosom:",
      buffert: 0,
      minRader: 2000,
      bestalldOsynligMs: 12 * TIMME,
      prisKraverTvaAvlasningar: false,
    });
  });

  it("☠️ VEVOR: saknad avläsning är okänd, ingen konkurrentregel, ingen buffert, två avläsningar för ett nytt pris", () => {
    expect(PROFILER.vevor).toEqual({
      saknadRad: "okand",
      konkurrentregel: false,
      prefix: "vevor:",
      buffert: 0,
      minRader: null,
      bestalldOsynligMs: 12 * TIMME,
      prisKraverTvaAvlasningar: true,
    });
  });

  it("föregående avläsnings kostnad följer med ett känt besked, aldrig ett okänt", () => {
    expect(lagerbesked(rad({ forraLandadKostnadSek: 900 }), SLUT_OM_SAKNAS, utanBuffert).forraLandad).toBe(900);
    expect(lagerbesked(rad({ status: "okand", forraLandadKostnadSek: 900 }), OKANT_OM_SAKNAS, utanBuffert).forraLandad)
      .toBeNull();
    expect(lagerbesked(rad({ status: "ej_levererbar", forraLandadKostnadSek: 900 }), SLUT_OM_SAKNAS, utanBuffert).forraLandad)
      .toBeNull();
  });

  it("AliExpress och okänd leverantör synkas inte här", () => {
    expect(PROFILER.aliexpress).toBeNull();
    expect(PROFILER.okand).toBeNull();
  });
});
