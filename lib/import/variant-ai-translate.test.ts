import { beforeEach, describe, expect, it, vi } from "vitest";
import { __clearMemCache } from "../llm/cache";
import { __resetLlmMemoryStore } from "../llm/storage";
import { buildVariantTranslatorAI, variantAiTranslationEnabled } from "./variant-ai-translate";

beforeEach(() => {
  __resetLlmMemoryStore();
  __clearMemCache();
  delete process.env.VARIANT_AI_TRANSLATION_ENABLED;
});

describe("variantAiTranslationEnabled", () => {
  it("default PÅ", () => {
    expect(variantAiTranslationEnabled()).toBe(true);
    expect(variantAiTranslationEnabled({})).toBe(true);
  });
  it("env=false stänger av", () => {
    process.env.VARIANT_AI_TRANSLATION_ENABLED = "false";
    expect(variantAiTranslationEnabled()).toBe(false);
  });
  it("explicit flags.translateVariants vinner över env", () => {
    process.env.VARIANT_AI_TRANSLATION_ENABLED = "false";
    expect(variantAiTranslationEnabled({ translateVariants: true })).toBe(true);
    expect(variantAiTranslationEnabled({ translateVariants: false })).toBe(false);
  });
});

describe("buildVariantTranslatorAI", () => {
  it("skickar BARA residual-engelska värden till AI; kända värden faller på tabellen", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) if (v === "Glow") out[v] = "Glöd";
      return out;
    });
    const variants = [
      { options: { Color: "Red", Effect: "Glow" } },
      { options: { Color: "Blue", Effect: "Glow" } },
    ];
    const { translator } = await buildVariantTranslatorAI(variants, { translateBatch });
    expect(translateBatch).toHaveBeenCalledTimes(1);
    const sent = translateBatch.mock.calls[0][0];
    expect(sent).toContain("Glow");
    expect(sent).not.toContain("Red"); // känt värde → aldrig till AI
    expect(sent).not.toContain("Blue");
    expect(translator.options({ Color: "Red", Effect: "Glow" })).toEqual({ Färg: "Röd", Effect: "Glöd" });
  });

  it("rapporterar olösta värden (AI gav inget svar) för polerings-flaggan", async () => {
    const translateBatch = vi.fn(async () => ({})); // AI löser inget
    const { translator, unresolved } = await buildVariantTranslatorAI(
      [{ options: { Effect: "Mystery" } }],
      { translateBatch },
    );
    expect(unresolved).toContain("Mystery");
    expect(translator.options({ Effect: "Mystery" })).toEqual({ Effect: "Mystery" }); // faller på råvärde
  });

  it("ett oförändrat AI-svar (behållet modellnamn) räknas som LÖST, inte olöst", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) out[v] = v; // Claude behåller allt som det är (kod/modell)
      return out;
    });
    const { unresolved } = await buildVariantTranslatorAI(
      [{ options: { Effect: "iPhone Pro" } }],
      { translateBatch },
    );
    expect(unresolved).toEqual([]); // behållet → inte flaggat för polering
  });

  it("cachar per värde: andra anropet skickar inte om redan översatta värden", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) if (v === "Glow") out[v] = "Glöd"; // "Mystery" förblir olöst
      return out;
    });
    const variants = [{ options: { Effect: "Glow", Style: "Mystery" } }];
    await buildVariantTranslatorAI(variants, { translateBatch });
    await buildVariantTranslatorAI(variants, { translateBatch });
    // Anrop 1: ["Glow","Mystery"]. Anrop 2: bara ["Mystery"] (Glow cachat; olöst Mystery retas).
    expect(translateBatch).toHaveBeenCalledTimes(2);
    expect(translateBatch.mock.calls[1][0]).toEqual(["Mystery"]);
  });

  it("fäller ALDRIG importen om AI kastar (failOpen → råvärde + olöst)", async () => {
    const translateBatch = vi.fn(async () => {
      throw new Error("nät nere");
    });
    const { translator, unresolved } = await buildVariantTranslatorAI(
      [{ options: { Effect: "Glow" } }],
      { translateBatch },
    );
    expect(unresolved).toContain("Glow");
    expect(translator.options({ Effect: "Glow" })).toEqual({ Effect: "Glow" });
  });
});
