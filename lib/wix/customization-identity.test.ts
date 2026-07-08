import { describe, it, expect } from "vitest";
import {
  customizationIdentityKey,
  sameCustomizationBucket,
  customizationHeadroom,
  isCustomizationNearLimit,
} from "./customization-identity";

describe("customizationIdentityKey", () => {
  it("samma namn + samma renderType → samma nyckel", () => {
    expect(customizationIdentityKey({ name: "Färg", renderType: "TEXT_CHOICES" }))
      .toBe(customizationIdentityKey({ name: "Färg", renderType: "TEXT_CHOICES" }));
  });

  // Empiriskt verifierat mot live-butiken (2026-06-30): butiken har TVÅ "Färg"-hinkar,
  // en SWATCH_CHOICES (22 val) och en TEXT_CHOICES (24 val). Render-typen MÅSTE ingå
  // i nyckeln annars slår vi ihop två oberoende Wix-hinkar.
  it("samma namn men olika renderType → OLIKA nyckel (Färg SWATCH ≠ Färg TEXT)", () => {
    const swatch = customizationIdentityKey({ name: "Färg", renderType: "SWATCH_CHOICES" });
    const text = customizationIdentityKey({ name: "Färg", renderType: "TEXT_CHOICES" });
    expect(swatch).not.toBe(text);
    expect(sameCustomizationBucket(
      { name: "Färg", renderType: "SWATCH_CHOICES" },
      { name: "Färg", renderType: "TEXT_CHOICES" },
    )).toBe(false);
  });

  it("trimmar namnet men rör inte skiftläge (Wix matchar exakt)", () => {
    expect(customizationIdentityKey({ name: "  Storlek  ", renderType: "TEXT_CHOICES" }))
      .toBe(customizationIdentityKey({ name: "Storlek", renderType: "TEXT_CHOICES" }));
    expect(customizationIdentityKey({ name: "Pro", renderType: "TEXT_CHOICES" }))
      .not.toBe(customizationIdentityKey({ name: "PRO", renderType: "TEXT_CHOICES" }));
  });

  it("kollisionssäker mellan namn med mellanslag och render-typ", () => {
    // "Färg TEXT_CHOICES" som namn får inte kollidera med name="Färg" + renderType="TEXT_CHOICES".
    const a = customizationIdentityKey({ name: "Färg TEXT_CHOICES", renderType: "X" });
    const b = customizationIdentityKey({ name: "Färg", renderType: "TEXT_CHOICES X" });
    expect(a).not.toBe(b);
  });
});

describe("customizationHeadroom / isCustomizationNearLimit", () => {
  it("headroom = 100 - antal, aldrig negativt", () => {
    expect(customizationHeadroom(24)).toBe(76);
    expect(customizationHeadroom(97)).toBe(3);
    expect(customizationHeadroom(100)).toBe(0);
    expect(customizationHeadroom(120)).toBe(0);
  });
  it("nära taket vid default 85", () => {
    expect(isCustomizationNearLimit(84)).toBe(false);
    expect(isCustomizationNearLimit(85)).toBe(true);
    expect(isCustomizationNearLimit(97)).toBe(true);
  });
});
