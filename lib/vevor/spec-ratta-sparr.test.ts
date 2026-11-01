// ☠️ Spärren i specifikationsverktyget om radfiltret och modellnummerkontrollen
// glider isär igen. Radfiltret låtsas här släppa igenom allt, så att en ny flik
// fortfarande fälls av kontrollen. Med två regler skrevs 21 sidor om vid varje
// körning utan att bli rätta (2026-11-01); nu räknas en sådan sida och lämnas.

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/polish/modellnummer", async (orig) => {
  const riktig = await orig<typeof import("@/lib/polish/modellnummer")>();
  return { ...riktig, radHarModellnummer: () => false };
});

import type { ProductMappingRecord } from "@/lib/store";
import type { WixAnrop } from "@/lib/polish/skrivplan";
import type { Avlasning } from "./lager";
import { flikHarModellnummer, korSpec, planeraSpec, type SpecProdukt } from "./spec-ratta";
import { testAvlasning } from "./testsida";

// Påhittade artikelnummer, id och kod.
const SKU = "TESTSKUSPARR000001";
const PID = "00000000-0000-4000-8000-000000000901";
const RAA = "<p>Testtext.</p>";
const KOD: [string, string] = ["Modell", "TEST999A-9 Hydraulisk styrsats"];

const avl = (): Avlasning =>
  testAvlasning({ sku: SKU, spec: [KOD, ["Material", "Stål"]], specKalla: "data", egenskaper: [], syskon: [] } as Partial<Avlasning>);
const rad = {
  supplier: "vevor",
  supplierProductId: `vevor:${SKU}`,
  wixProductId: PID,
  needsAiPolish: true,
  variants: [{ supplierVariantId: SKU, sku: "FP-test-1", wixVariantId: "v1", choices: {}, costUsd: 30, landedCostSek: 300, grossSek: 399 }],
} as unknown as ProductMappingRecord;
const sida = (beskrivning: string): SpecProdukt => ({ id: PID, revision: "2", synlig: false, beskrivning });
const karta = () => new Map([[SKU, avl()]]);

describe("☠️ en ny flik som fortfarande har ett modellnummer skrivs inte", () => {
  it("en sida utan flik: planen räknar den som hinder i stället för att lägga till en flik med numret", () => {
    expect(planeraSpec(rad, sida(RAA), karta())).toEqual({ typ: "hinder", hinder: "modellnummer_kvar" });
  });

  it("en sida vars flik har numret: planen byter inte fliken mot en som också har det", () => {
    const gammal = `${RAA}<h2>Tekniska specifikationer</h2><ul><li>${KOD[0]}: ${KOD[1]}</li></ul>`;
    expect(flikHarModellnummer(gammal)).toBe(true);
    expect(planeraSpec(rad, sida(gammal), karta())).toEqual({ typ: "hinder", hinder: "modellnummer_kvar" });
  });

  it("körningen räknar sidan som hinder och skriver ingenting", async () => {
    const anrop: string[] = [];
    const wix: WixAnrop = async (metod, vag) => {
      anrop.push(metod);
      if (metod === "POST" && vag === "/stores/v3/products/search") {
        return { products: [{ id: PID, revision: "2", visible: false, plainDescription: RAA }] };
      }
      throw new Error(`oväntat anrop ${metod} ${vag}`);
    };
    const svar = await korSpec(
      { wix, mappningar: async () => [rad], avlasningar: async () => karta(), vanta: async () => {} },
      { dryRun: false, bekrafta: 1, budgetMs: 240_000 },
    );
    expect(svar.attRatta).toBe(0);
    expect(svar.hinder.modellnummer_kvar).toBe(1);
    expect(svar.skrivna).toBe(0);
    expect(anrop).toEqual(["POST"]);
  });
});
