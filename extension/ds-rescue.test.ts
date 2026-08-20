// Utlösaren för DS-räddningen i extension/background.js.
//
// Bakgrund (Leonards rapport 2026-08-20): agent- och bulk-importer gav alla
// varianter samma inköpspris. Räddningen fanns, men var gatad på
// `!product.extractionOk` — och extractionOk är `titel && bilder && pris`.
// En DOM-fallback med titel, bild och ETT pris räknades som "bra data".
//
// Testet läser den RIKTIGA källkoden och kör den exporterade regeln, så det
// fångar om villkoret skrivs om eller om `idx-` smygs in i det.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const KÄLLA = readFileSync(join(process.cwd(), "extension/background.js"), "utf8");

/** Plockar ut harDomVarianter ur källan och kör den på riktigt. */
function harDomVarianter(product: unknown): boolean {
  const m = KÄLLA.match(/function harDomVarianter\(product\) \{[\s\S]*?\n\}/);
  if (!m) throw new Error("harDomVarianter hittades inte i background.js");
  // eslint-disable-next-line no-new-func
  const fn = new Function(`${m[0]}; return harDomVarianter;`)() as (p: unknown) => boolean;
  return fn(product);
}

const v = (id: string) => ({ supplierVariantId: id, costUsd: 22.9, included: true });

describe("harDomVarianter", () => {
  it("flaggar DOM-byggda varianter", () => {
    expect(harDomVarianter({ variants: [v("dom-0"), v("dom-1")] })).toBe(true);
  });

  // AVGÖRANDE SKILLNAD: idx- kommer från den INBÄDDADE SKU-vägen, där varje
  // variant har sitt eget pris — bara id:t saknades. Byter vi ut den listan
  // mot DS kastar vi korrekt data.
  it("flaggar INTE idx- — de har korrekta per-variant-priser", () => {
    expect(harDomVarianter({ variants: [v("idx-0"), v("idx-1")] })).toBe(false);
  });

  it("flaggar INTE riktiga SKU-id", () => {
    expect(harDomVarianter({ variants: [v("12000041"), v("12000042")] })).toBe(false);
  });

  it("en enda dom- bland riktiga räcker", () => {
    expect(harDomVarianter({ variants: [v("12000041"), v("dom-3")] })).toBe(true);
  });

  it("tål produkt utan varianter", () => {
    expect(harDomVarianter({})).toBe(false);
    expect(harDomVarianter({ variants: [] })).toBe(false);
    expect(harDomVarianter(null)).toBe(false);
  });

  it("'default' är inte dom- (enkel produkt utan varianter)", () => {
    expect(harDomVarianter({ variants: [v("default")] })).toBe(false);
  });
});

describe("inkopplingen i background.js", () => {
  // Det var precis den här gaten som var buggen. Skrivs den om till att bara
  // titta på extractionOk igen är felet tillbaka.
  it("agent-vägen triggar på BÅDE misslyckad extraktion och dom-varianter", () => {
    expect(KÄLLA).toMatch(/if \(!product\.extractionOk \|\| harDomVarianter\(product\)\)/);
  });

  it("bulk-vägen har också räddningen", () => {
    const bulk = KÄLLA.slice(KÄLLA.indexOf("async function scrapeAndImport"));
    expect(bulk.slice(0, bulk.indexOf("case \"IMPORT_PRODUCT\""))).toMatch(
      /harDomVarianter\(product\)[\s\S]{0,200}dsRescueVariants\(product\)/,
    );
  });

  // Utan detta blir variantbilderna kvar nycklade på skrapans värden medan
  // varianterna bär DS:s — och serverns backfill hoppar över, eftersom den
  // bara kickar in när kartan är HELT tom. Noll kopplade bilder.
  it("räddningen bygger om variantbilderna från DS", () => {
    const fn = KÄLLA.slice(KÄLLA.indexOf("async function dsRescueVariants"));
    expect(fn).toMatch(/swatchImageUrl/);
    expect(fn).toMatch(/ut\.swatchImages =/);
  });
});
