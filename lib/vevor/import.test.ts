import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AliExpressProduct } from "@/lib/import/types";
import type { ImportResult } from "@/lib/import/pipeline";
import { MemoryStore } from "@/lib/store/memory";
import { RabattFel } from "./pris";
import { MinnesVevorImportLager } from "./import-lager";
import { FEL_I_FOLJD, STOPP_FOR_LARM, TAK_MARGINAL, VILA_MS, WIX_MAX_PRODUKTER, korVevorImport, type ImportDeps } from "./import";
import { testAvlasning, testgalleri } from "./testsida";

// Påhittade artikelnummer, priser och rabatter.
const sku = (n: number) => `TESTSKUIMPORT${String(n).padStart(6, "0")}`;
const NU = Date.parse("2026-10-29T12:00:00.000Z");
const LASTAT = "2026-10-29T10:00:00.000Z";

let lager: MinnesVevorImportLager;
let store: MemoryStore;
let klocka: number;
let importera: ReturnType<typeof vi.fn>;
let sparaMappning: ReturnType<typeof vi.fn>;
let larma: ReturnType<typeof vi.fn>;
let prisunderlag: ReturnType<typeof vi.fn>;
let antalProdukter: ReturnType<typeof vi.fn>;

function lagg(n: number, over: Parameters<typeof testAvlasning>[0] = {}) {
  const a = testAvlasning({ sku: sku(n), bilder: testgalleri(sku(n)), lastAt: LASTAT, ...over });
  lager.avlasningar.set(a.sku, a);
}

function resultat(p: AliExpressProduct): ImportResult {
  return {
    wixProductId: `wix-${p.variants[0].supplierVariantId.slice(-6)}`,
    missadeBilder: [],
    slug: "testvagn",
    supplierProductId: p.supplierProductId,
    seo: { title: p.rawTitle, metaDescription: "", descriptionHtml: "", slug: "", suggestedCategory: "", imageAltTexts: [] },
    variantMappings: [
      { supplierVariantId: p.variants[0].supplierVariantId, sku: "FP-x", choices: {}, costUsd: 1, landedCostSek: 10, grossSek: 19 },
    ],
    imageAnalysis: [],
    categorySuggestion: { collectionSlug: null, confidence: 0, reason: "", status: "uncategorized" },
    stockQuantity: 1,
    shipsFromCountries: [],
    hasEuWarehouse: false,
    warehouseClass: "UNKNOWN",
    needsAiPolish: true,
    qualityMode: "raw",
  } as ImportResult;
}

function deps(): ImportDeps {
  return {
    lager,
    mappningarFor: (ids) => store.mappningarForLeverantorsId(ids),
    importera,
    sparaMappning,
    prisunderlag,
    antalProdukter,
    larma,
    nu: () => klocka,
  };
}

const schema = { manuell: false, dryRun: false, limit: 100_000, budgetMs: 200_000 };

beforeEach(() => {
  lager = new MinnesVevorImportLager();
  lager.tillstand.aktiv = true;
  store = new MemoryStore();
  klocka = NU;
  importera = vi.fn(async (p: AliExpressProduct) => resultat(p));
  sparaMappning = vi.fn((m) => store.saveMapping(m));
  larma = vi.fn(async () => undefined);
  prisunderlag = vi.fn(async () => ({ rabatt: 0.0425, usdToSek: 10 }));
  antalProdukter = vi.fn(async () => 6_000);
});

describe("körningen", () => {
  it("importerar varje avläsning som går, hoppar över resten, och avslutar varvet", async () => {
    lagg(1);
    lagg(2, { levererasTillSe: false });
    lagg(3);
    lagg(4, { status: "slut", saldo: 0 });
    lagg(5, { misslyckadAt: "2026-10-29T11:00:00.000Z" });
    const s = await korVevorImport(deps(), schema);
    expect(s).toMatchObject({ utfall: "klar", importerade: 2, fel: 0, varvKlart: true, stoppadAv: "klart" });
    expect(s.hinder).toMatchObject({ ej_levererbar: 1, misslyckad: 1 });
    // Avläsningen som är slut kommer aldrig fram: kandidaterna är bara de i lager.
    expect(s.granskade).toBe(4);
    const m = await store.mappningarForLeverantorsId([`vevor:${sku(1)}`, `vevor:${sku(3)}`]);
    expect(m.map((r) => r.supplier)).toEqual(["vevor", "vevor"]);
    expect(m.every((r) => r.draftStatus === "pending_review" && r.needsAiPolish)).toBe(true);
    expect(lager.tillstand).toMatchObject({ markor: null, varvImporterade: 0, vilaTill: null, stoppIFoljd: 0 });
    expect(lager.tillstand.senasteKorning?.importerade).toBe(2);
    expect(lager.las).toBeNull();
  });

  it("☠️ en omkörning skapar 0 nya, och ett varv utan något nytt vilar", async () => {
    lagg(1);
    lagg(2);
    await korVevorImport(deps(), schema);
    importera.mockClear();
    const s = await korVevorImport(deps(), schema);
    expect(importera).not.toHaveBeenCalled();
    expect(s).toMatchObject({ importerade: 0, redanImporterade: 2, varvKlart: true });
    expect(lager.tillstand.vilaTill).toBe(new Date(NU + VILA_MS).toISOString());
    expect((await korVevorImport(deps(), schema)).utfall).toBe("vilar");
    // För hand vilar den aldrig.
    expect((await korVevorImport(deps(), { ...schema, manuell: true })).utfall).toBe("klar");
  });

  it("☠️ ett varv utan avläsningar vilar inte: läsaren har inte hunnit läsa än", async () => {
    const s = await korVevorImport(deps(), schema);
    expect(s).toMatchObject({ utfall: "klar", granskade: 0, varvKlart: true });
    expect(lager.tillstand.vilaTill).toBeNull();
    lagg(1);
    expect((await korVevorImport(deps(), schema)).importerade).toBe(1);
  });

  it("ett varv som bara hittade hinder vilar, också när det delades på två körningar", async () => {
    lagg(1, { levererasTillSe: false });
    lagg(2, { levererasTillSe: false });
    // Förra körningen i varvet gick igenom den första och tog slut på tid.
    lager.tillstand = { ...lager.tillstand, markor: sku(1), varvGranskade: 1 };
    const s = await korVevorImport(deps(), schema);
    expect(s).toMatchObject({ varvKlart: true, importerade: 0, granskade: 1 });
    expect(lager.tillstand.vilaTill).toBe(new Date(NU + VILA_MS).toISOString());
    expect(lager.tillstand.varvGranskade).toBe(0);
  });

  it("varvet räknas över körningar: den sista kan börja vid slutet av listan och ändå vila", async () => {
    lagg(1, { levererasTillSe: false });
    // Förra körningen gick igenom båda men hann inte fråga efter fler.
    lager.tillstand = { ...lager.tillstand, markor: sku(1), varvGranskade: 1, varvImporterade: 0 };
    const s = await korVevorImport(deps(), schema);
    expect(s).toMatchObject({ varvKlart: true, granskade: 0 });
    expect(lager.tillstand.vilaTill).toBe(new Date(NU + VILA_MS).toISOString());
  });

  it("en artikel i en annan rads importSparr räknas som importerad", async () => {
    lagg(1);
    await store.saveMapping({ supplierProductId: "", importSparr: `vevor:${sku(1)}`, wixProductId: "w0", variants: [] });
    const s = await korVevorImport(deps(), schema);
    expect(s).toMatchObject({ importerade: 0, redanImporterade: 1 });
  });

  it("avstängd och schemalagd: ingenting görs och ingenting skrivs", async () => {
    lagg(1);
    lager.tillstand.aktiv = false;
    const s = await korVevorImport(deps(), schema);
    expect(s.utfall).toBe("avstangd");
    expect(importera).not.toHaveBeenCalled();
    expect(lager.tillstand.senasteKorning).toBeNull();
  });

  it("torrt prov räknar men skriver ingenting, inte ens markören", async () => {
    lagg(1);
    lagg(2);
    lager.tillstand.aktiv = false;
    const s = await korVevorImport(deps(), { ...schema, manuell: true, dryRun: true, limit: 5 });
    expect(s).toMatchObject({ utfall: "klar", dryRun: true, importerade: 2 });
    expect(s.bilder.ny).toBe(2);
    expect(s.gpsr.manualEjLast).toBe(2);
    expect(importera).not.toHaveBeenCalled();
    expect(sparaMappning).not.toHaveBeenCalled();
    expect(lager.tillstand.markor).toBeNull();
    expect(lager.tillstand.senasteKorning).toBeNull();
  });

  it("limit stoppar, och nästa körning fortsätter efter markören", async () => {
    for (let n = 1; n <= 4; n++) lagg(n);
    const s = await korVevorImport(deps(), { ...schema, limit: 2 });
    expect(s).toMatchObject({ importerade: 2, stoppadAv: "limit", varvKlart: false });
    expect(lager.tillstand.markor).toBe(sku(2));
    expect(lager.tillstand.varvImporterade).toBe(2);
    importera.mockClear();
    const s2 = await korVevorImport(deps(), schema);
    expect(s2.importerade).toBe(2);
    expect(importera.mock.calls.map(([p]) => p.supplierProductId)).toEqual([`vevor:${sku(3)}`, `vevor:${sku(4)}`]);
    // Varvet importerade något, så nästa börjar direkt i stället för att vila.
    expect(lager.tillstand.vilaTill).toBeNull();
  });

  it("tidsbudgeten prövas före varje produkt", async () => {
    for (let n = 1; n <= 4; n++) lagg(n);
    importera.mockImplementation(async (p: AliExpressProduct) => {
      klocka += 80_000;
      return resultat(p);
    });
    const s = await korVevorImport(deps(), schema);
    expect(s).toMatchObject({ importerade: 3, stoppadAv: "tidsbudget" });
  });
});

describe("spärrarna", () => {
  it("☠️ utan rabatt i konfigurationen importeras ingenting", async () => {
    lagg(1);
    prisunderlag.mockRejectedValue(new RabattFel("VEVOR PRO-rabatten saknas i konfigurationen (FyndplatsAppConfig, vevorProRabatt)"));
    const s = await korVevorImport(deps(), schema);
    expect(s.utfall).toBe("stoppad");
    expect(s.skal).toContain("saknas");
    expect(importera).not.toHaveBeenCalled();
    expect(lager.tillstand.stoppIFoljd).toBe(1);
  });

  it("☠️ Wix tak: ingenting när katalogen är nära, och körningen stannar vid taket", async () => {
    lagg(1);
    antalProdukter.mockResolvedValue(WIX_MAX_PRODUKTER - TAK_MARGINAL);
    const s = await korVevorImport(deps(), schema);
    expect(s).toMatchObject({ utfall: "stoppad", stoppadAv: "tak" });
    expect(importera).not.toHaveBeenCalled();

    for (let n = 2; n <= 4; n++) lagg(n);
    antalProdukter.mockResolvedValue(WIX_MAX_PRODUKTER - TAK_MARGINAL - 2);
    const s2 = await korVevorImport(deps(), schema);
    expect(s2).toMatchObject({ importerade: 2, stoppadAv: "tak" });
  });

  it("☠️ står läsaren fryst efter en spärr står importen också still", async () => {
    lagg(1);
    lager.fryst = { at: "2026-10-29T11:00:00.000Z", skal: "403" };
    const s = await korVevorImport(deps(), { ...schema, manuell: true });
    expect(s.utfall).toBe("fryst");
    expect(importera).not.toHaveBeenCalled();
  });

  it("en körning som redan pågår håller låset", async () => {
    lagg(1);
    lager.las = { agare: "annan", utgar: NU + 60_000 };
    expect((await korVevorImport(deps(), schema)).utfall).toBe("upptagen");
    expect(importera).not.toHaveBeenCalled();
  });
});

describe("fel", () => {
  it("☠️ en produkt utan mappningsrad spärrar artikeln, så nästa varv inte skapar den igen", async () => {
    lagg(1);
    lagg(2);
    sparaMappning.mockImplementationOnce(async () => {
      throw new Error("WDE0014");
    });
    const s = await korVevorImport(deps(), schema);
    expect(s).toMatchObject({ importerade: 1, fel: 1 });
    expect(s.foraldralosa).toEqual(["wix-000001"]);
    expect(lager.tillstand.foraldralosa.map((f) => f.wixProductId)).toEqual(["wix-000001"]);
    importera.mockClear();
    const s2 = await korVevorImport(deps(), { ...schema, manuell: true });
    expect(importera).not.toHaveBeenCalled();
    expect(s2.redanImporterade).toBe(2);
  });

  it("☠️ fem fel i följd stoppar körningen, och markören står kvar före felen", async () => {
    for (let n = 1; n <= 8; n++) lagg(n);
    importera.mockImplementation(async (p: AliExpressProduct) => {
      if (p.supplierProductId === `vevor:${sku(1)}`) return resultat(p);
      throw new Error("Wix svarar 503");
    });
    const s = await korVevorImport(deps(), schema);
    expect(s).toMatchObject({ utfall: "stoppad", stoppadAv: "fel_i_foljd", importerade: 1, fel: FEL_I_FOLJD });
    expect(lager.tillstand.markor).toBe(sku(1));
    expect(lager.tillstand.stoppIFoljd).toBe(1);
  });

  it("ett enstaka fel flyttar markören, och artikeln prövas igen i nästa varv", async () => {
    lagg(1);
    lagg(2);
    importera.mockImplementationOnce(async () => {
      throw new Error("en trasig bild");
    });
    const s = await korVevorImport(deps(), schema);
    expect(s).toMatchObject({ utfall: "klar", importerade: 1, fel: 1, varvKlart: true });
    importera.mockClear();
    await korVevorImport(deps(), schema);
    expect(importera.mock.calls.map(([p]) => p.supplierProductId)).toEqual([`vevor:${sku(1)}`]);
  });

  it("larmet går vid tredje stoppet i följd, och högst en gång per dygn", async () => {
    lagg(1);
    prisunderlag.mockRejectedValue(new RabattFel("VEVOR PRO-rabatten saknas i konfigurationen"));
    for (let i = 0; i < STOPP_FOR_LARM - 1; i++) await korVevorImport(deps(), schema);
    expect(larma).not.toHaveBeenCalled();
    await korVevorImport(deps(), schema);
    expect(larma).toHaveBeenCalledTimes(1);
    await korVevorImport(deps(), schema);
    expect(larma).toHaveBeenCalledTimes(1);
    // En lyckad körning nollar räkningen.
    prisunderlag.mockResolvedValue({ rabatt: 0.0425, usdToSek: 10 });
    await korVevorImport(deps(), schema);
    expect(lager.tillstand.stoppIFoljd).toBe(0);
  });
});

describe("☠️ svaret", () => {
  it("bär inga artikelnummer, bara antal och Wix-id", async () => {
    lagg(1);
    lagg(2);
    sparaMappning.mockImplementationOnce(async () => {
      throw new Error(`mappningen för vevor:${sku(1)} föll`);
    });
    const s = await korVevorImport(deps(), schema);
    const text = JSON.stringify(s);
    expect(text).not.toMatch(/TESTSKUIMPORT/);
    expect(text).toContain("wix-000001");
  });
});
