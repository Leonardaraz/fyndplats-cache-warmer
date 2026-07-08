import { describe, expect, it } from "vitest";
import { buildPolishPrompt } from "./polish-button";

// Regression-vakt: polerings-prompten drev tidigare ur synk med runbooken (den
// listade bara Steg 1b/3b/3c + publicera och missade sökordsvalidering, SKU-
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
    expect(prompt).toMatch(/sökord/i); // Steg 0 – sökordsvalidering
    expect(prompt).toMatch(/bilder/i); // Steg 1b – bildanalys
    expect(prompt).toMatch(/SKU/); // Steg 2b – re-synk
    expect(prompt).toMatch(/kategori/i); // Steg 4
    expect(prompt).toMatch(/variant/i); // Steg 6
    expect(prompt).toMatch(/publicera/i); // Steg 5
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
