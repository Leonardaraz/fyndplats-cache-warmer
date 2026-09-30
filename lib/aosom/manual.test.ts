import { describe, expect, it } from "vitest";
import { artiklarPaSidan, manualLankar, unikaManualer } from "./manual";
import type { ProductMappingRecord } from "../store";

// Syntetiska artikelnummer — riktiga får aldrig stå i en testfil, repot är publikt.

const FEED = [
  "SKU,EAN,Name,Description,pdf",
  'A-1,,Trockner,"Zeile eins,\nZeile zwei",https://cdn.example/manual-a1.pdf',
  "A-2,,Trockner,kurz,https://cdn.example/manual-a1.pdf",
  "B-3,,Stuhl,kurz,",
  "C-4,,Lampe,kurz,https://cdn.example/manual-c4.pdf",
].join("\n");

function rad(over: Partial<ProductMappingRecord>): Pick<ProductMappingRecord, "supplierProductId" | "variants"> {
  return { supplierProductId: "aosom:A-1", variants: [], ...over };
}

describe("manualLankar", () => {
  it("läser pdf-kolumnen per artikel, också efter en beskrivning med radbrytning", () => {
    const l = manualLankar(FEED, ["A-1", "C-4"]);
    expect([...l.entries()]).toEqual([
      ["A-1", "https://cdn.example/manual-a1.pdf"],
      ["C-4", "https://cdn.example/manual-c4.pdf"],
    ]);
  });

  it("en artikel utan manual kommer inte med", () => {
    expect(manualLankar(FEED, ["B-3"]).size).toBe(0);
  });

  it("utan pdf-kolumn blir svaret tomt, inte ett fel", () => {
    expect(manualLankar("SKU,Name\nA-1,x", ["A-1"]).size).toBe(0);
  });

  it("färger som delar manual ger en post", () => {
    const l = manualLankar(FEED, ["A-1", "A-2"]);
    expect(unikaManualer(["A-1", "A-2"], l)).toEqual(["https://cdn.example/manual-a1.pdf"]);
  });
});

describe("artiklarPaSidan", () => {
  it("en vanlig rad ger radens artikel", () => {
    expect(artiklarPaSidan(rad({}))).toEqual(["A-1"]);
  });

  it("en sammanslagen sida ger en artikel per variant", () => {
    const m = rad({
      variants: [
        { supplierVariantId: "A-1", wixVariantId: "v1", sku: "FP-a", choices: {}, costUsd: 1, grossSek: 1 },
        { supplierVariantId: "A-2", wixVariantId: "v2", sku: "FP-b", choices: {}, costUsd: 1, grossSek: 1 },
      ] as ProductMappingRecord["variants"],
    });
    expect(artiklarPaSidan(m)).toEqual(["A-1", "A-2"]);
  });

  it("en pensionerad rad utan artikel ger ingenting", () => {
    expect(artiklarPaSidan(rad({ supplierProductId: "" }))).toEqual([]);
  });
});
