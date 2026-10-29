import { describe, expect, it } from "vitest";
import { kanVaraMedicinteknik, vevorGranskning } from "./granskning";
import { TESTSKU, testAvlasning } from "./testsida";

describe("kanVaraMedicinteknik", () => {
  it("en kategori i listan, var i brödsmulan den än står", () => {
    const a = testAvlasning({ kategorier: [{ id: "40163", namn: "Hjälpmedel för rörlighet" }, { id: "1", namn: "Övrigt" }] });
    expect(kanVaraMedicinteknik(a)).toBe(true);
    expect(kanVaraMedicinteknik(testAvlasning({ kategorier: [{ id: "1", namn: "Övrigt" }, { id: "40976", namn: "X" }] }))).toBe(true);
  });

  it("ett kategorinamn eller produktnamn som pekar på vård", () => {
    const utanLista = [{ id: "1", namn: "Hem" }];
    expect(kanVaraMedicinteknik({ kategorier: [{ id: "2", namn: "Sjukvårdsutrustning" }], namn: "X" })).toBe(true);
    expect(kanVaraMedicinteknik({ kategorier: utanLista, namn: "Elektrisk rullstol, hopfällbar" })).toBe(true);
    expect(kanVaraMedicinteknik({ kategorier: utanLista, namn: "Patientlyft med sele" })).toBe(true);
  });

  it("medicinskåp och medicinbollar är inte vård, och vanliga varor flaggas inte", () => {
    const utanLista = [{ id: "1", namn: "Badrum" }];
    expect(kanVaraMedicinteknik({ kategorier: utanLista, namn: "Medicinskåp med spegel" })).toBe(false);
    expect(kanVaraMedicinteknik({ kategorier: [{ id: "1", namn: "Träning" }], namn: "Medicinboll 5 kg" })).toBe(false);
    expect(kanVaraMedicinteknik(testAvlasning())).toBe(false);
  });
});

describe("vevorGranskning", () => {
  it("GPSR-status ur manualen, och bildmönstret", () => {
    expect(vevorGranskning(testAvlasning(), { monster: "ny", granskas: false })).toEqual({
      gpsr: "manual_ej_last",
      medicinteknik: false,
      bildmonster: "ny",
      bildgranskning: false,
    });
    expect(vevorGranskning(testAvlasning({ manualSokvag: null }), { monster: "okant", granskas: true })).toMatchObject({
      gpsr: "ingen_manual",
      bildgranskning: true,
    });
  });

  it("☠️ bär inga identifierare: varken artikelnumret eller manualens adress", () => {
    const g = JSON.stringify(vevorGranskning(testAvlasning(), { monster: "ny", granskas: false }));
    expect(g).not.toContain(TESTSKU);
    expect(g).not.toContain("TESTMANUAL01");
    expect(g).not.toContain("/pages/");
  });
});
