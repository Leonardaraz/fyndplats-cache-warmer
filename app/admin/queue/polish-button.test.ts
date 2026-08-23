import { describe, expect, it } from "vitest";
import { buildPolishPrompt } from "./polish-button";

// Regression-vakt: polerings-prompten drev tidigare ur synk med runbooken (den
// listade ett par steg vid nummer och missade sökordsvalidering, SKU-
// resync, kategori och varianter). Dessa tester låser att prompten pekar på
// runbooken som sanningskälla OCH täcker de lätt-missade momenten.
describe("buildPolishPrompt — hålls i synk med seo-polish-runbook", () => {
  const prompt = buildPolishPrompt("WID-123", "Rå titel", "https://ali/item.html");

  it("pekar på runbooken som sanningskälla + kräver ALLA steg i ordning", () => {
    expect(prompt).toContain("docs/seo-polish-runbook.md");
    expect(prompt).toMatch(/läs HELA/i);
    expect(prompt).toMatch(/ALLA steg/i);
    expect(prompt).toMatch(/hoppa inte över/i);
  });

  it("påminner om de tidigare missade momenten (drift-regression)", () => {
    expect(prompt).toMatch(/sökord/i); // sökordsvalidering
    expect(prompt).toMatch(/bilder/i); // bildanalys
    expect(prompt).toMatch(/SKU/); // SKU-resynk
    expect(prompt).toMatch(/kategori/i); // kategori
    expect(prompt).toMatch(/variant/i); // varianter
    expect(prompt).toMatch(/publicera/i); // publicering
  });

  it("hårdkodar INTE stegnummer (undviker samma nummer-drift igen)", () => {
    expect(prompt).not.toMatch(/Steg\s*1b/i);
    expect(prompt).not.toMatch(/Steg\s*3[bc]/i);
  });

  it("tar med produkt-id/titel/källa och utelämnar tomma fält", () => {
    expect(prompt).toContain("Wix-produkt-ID: WID-123");
    expect(prompt).toContain("Titel (rå): Rå titel");
    expect(prompt).toContain("AliExpress-källa: https://ali/item.html");
    const bare = buildPolishPrompt("WID-9");
    expect(bare).toContain("Wix-produkt-ID: WID-9");
    expect(bare).not.toMatch(/Titel \(rå\)/);
    expect(bare).not.toMatch(/AliExpress-källa/);
  });
});
