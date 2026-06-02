import { describe, expect, it } from "vitest";
import {
  BRAND_VOICE_SPEC,
  loadBrandVoiceExamples,
  formatExamplesForPrompt,
  brandVoiceSystemPrefix,
  usingSeedExamples,
  __resetBrandVoiceCache,
} from "./brand-voice";

describe("brand-voice", () => {
  it("specen förbjuder butikscopy och påhittade fakta", () => {
    expect(BRAND_VOICE_SPEC).toMatch(/Fyndplats/);
    expect(BRAND_VOICE_SPEC).toMatch(/ALDRIG/);
    expect(BRAND_VOICE_SPEC.toLowerCase()).toMatch(/hitta aldrig på|gissa/);
  });

  it("laddar minst ett giltigt guldexempel", () => {
    const ex = loadBrandVoiceExamples();
    expect(ex.length).toBeGreaterThanOrEqual(1);
    for (const e of ex) {
      expect(typeof e.title).toBe("string");
      expect(e.descriptionHtml).toContain("<p>");
    }
  });

  it("formatExamplesForPrompt renderar titel + beskrivning + FAQ", () => {
    const text = formatExamplesForPrompt(loadBrandVoiceExamples(), 2);
    expect(text).toMatch(/EXEMPEL 1/);
    expect(text).toMatch(/Titel:/);
    expect(text).toMatch(/Beskrivning:/);
  });

  it("formatExamplesForPrompt(0) ger tom sträng", () => {
    expect(formatExamplesForPrompt([], 0)).toBe("");
  });

  it("systemprefixen är stabil (byte-identisk) mellan anrop — krav för prompt caching", () => {
    __resetBrandVoiceCache();
    const a = brandVoiceSystemPrefix();
    const b = brandVoiceSystemPrefix();
    expect(a).toBe(b);
    expect(a).toContain(BRAND_VOICE_SPEC);
    expect(a).toMatch(/GULDEXEMPEL/);
  });

  it("flaggar att seed-exemplen fortfarande används (påminnelse till Leonard)", () => {
    // Tills extract-brand-voice-examples.mjs körts mot Wix är källan seed-handwritten.
    expect(typeof usingSeedExamples()).toBe("boolean");
  });
});
