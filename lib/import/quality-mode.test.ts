import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  resolveQualityMode,
  aiEnabledForMode,
  isPremiumMode,
  isQualityMode,
  estimatedCostOre,
  publishesDirectly,
} from "./quality-mode";

const ENV_KEYS = ["AI_QUALITY_MODE", "AI_ENRICHMENT_ENABLED"] as const;

describe("quality-mode", () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k];
    for (const k of ENV_KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  describe("resolveQualityMode — defaults", () => {
    it("defaultar till standard utan flaggor/env", () => {
      expect(resolveQualityMode()).toBe("standard");
      expect(resolveQualityMode({})).toBe("standard");
    });
  });

  describe("resolveQualityMode — explicit flags.qualityMode vinner", () => {
    it("respekterar premium även mot env=standard", () => {
      process.env.AI_QUALITY_MODE = "standard";
      expect(resolveQualityMode({ qualityMode: "premium" })).toBe("premium");
    });
    it("respekterar raw även mot env=premium", () => {
      process.env.AI_QUALITY_MODE = "premium";
      expect(resolveQualityMode({ qualityMode: "raw" })).toBe("raw");
    });
  });

  describe("resolveQualityMode — env AI_QUALITY_MODE", () => {
    it("läser premium/raw/standard", () => {
      process.env.AI_QUALITY_MODE = "premium";
      expect(resolveQualityMode()).toBe("premium");
      process.env.AI_QUALITY_MODE = "raw";
      expect(resolveQualityMode()).toBe("raw");
      process.env.AI_QUALITY_MODE = "STANDARD";
      expect(resolveQualityMode()).toBe("standard");
    });
    it("ignorerar skräpvärden → standard", () => {
      process.env.AI_QUALITY_MODE = "ultra";
      expect(resolveQualityMode()).toBe("standard");
    });
  });

  describe("resolveQualityMode — legacy bakåtkompatibilitet", () => {
    it("AI_ENRICHMENT_ENABLED=false → raw", () => {
      process.env.AI_ENRICHMENT_ENABLED = "false";
      expect(resolveQualityMode()).toBe("raw");
    });
    it("flags.enableAI=false → raw (vinner över env)", () => {
      process.env.AI_QUALITY_MODE = "premium";
      expect(resolveQualityMode({ enableAI: false })).toBe("raw");
    });
    it("flags.enableAI=true → minst standard (vinner över AI_ENRICHMENT_ENABLED=false)", () => {
      process.env.AI_ENRICHMENT_ENABLED = "false";
      expect(resolveQualityMode({ enableAI: true })).toBe("standard");
    });
    it("flags.enableAI=true respekterar env-premium", () => {
      process.env.AI_QUALITY_MODE = "premium";
      expect(resolveQualityMode({ enableAI: true })).toBe("premium");
    });
  });

  describe("härledare", () => {
    it("aiEnabledForMode: raw av, övriga på", () => {
      expect(aiEnabledForMode("raw")).toBe(false);
      expect(aiEnabledForMode("standard")).toBe(true);
      expect(aiEnabledForMode("premium")).toBe(true);
    });
    it("isPremiumMode bara för premium", () => {
      expect(isPremiumMode("premium")).toBe(true);
      expect(isPremiumMode("standard")).toBe(false);
      expect(isPremiumMode("raw")).toBe(false);
    });
    it("publishesDirectly bara för premium", () => {
      expect(publishesDirectly("premium")).toBe(true);
      expect(publishesDirectly("standard")).toBe(false);
    });
    it("estimatedCostOre stiger raw < standard < premium", () => {
      expect(estimatedCostOre("raw")).toBe(0);
      expect(estimatedCostOre("standard")).toBeLessThan(estimatedCostOre("premium"));
    });
    it("isQualityMode validerar", () => {
      expect(isQualityMode("premium")).toBe(true);
      expect(isQualityMode("nope")).toBe(false);
      expect(isQualityMode(undefined)).toBe(false);
    });
  });
});
