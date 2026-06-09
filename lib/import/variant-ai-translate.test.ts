import { beforeEach, describe, expect, it, vi } from "vitest";
import { __clearMemCache } from "../llm/cache";
import { __resetLlmMemoryStore } from "../llm/storage";
import { listVariantTranslations } from "../llm/variant-log";
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
    expect(translator.options({ Color: "Red", Effect: "Glow" })).toEqual({ Färg: "Röd", Effekt: "Glöd" });
  });

  it("rapporterar olösta värden (AI gav inget svar) för polerings-flaggan", async () => {
    const translateBatch = vi.fn(async () => ({})); // AI löser inget
    const { translator, unresolved } = await buildVariantTranslatorAI(
      [{ options: { Effect: "Mystery" } }],
      { translateBatch },
    );
    expect(unresolved).toContain("Mystery");
    expect(translator.options({ Effect: "Mystery" })).toEqual({ Effekt: "Mystery" }); // faller på råvärde
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

  it("loggar genuina AI-översättningar för stickprov (/admin/variant-translations)", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) if (v === "Glow") out[v] = "Glöd";
      return out;
    });
    await buildVariantTranslatorAI([{ options: { Effect: "Glow" } }], {
      translateBatch,
      productTitle: "LED-list 5m",
    });
    const logged = await listVariantTranslations();
    expect(logged).toHaveLength(1);
    expect(logged[0]).toMatchObject({
      raw: "Glow",
      sv: "Glöd",
      productTitle: "LED-list 5m",
      provider: "variant-ai",
    });
  });

  it("loggar INTE när AI behåller värdet oförändrat (val === råvärde, t.ex. modellnamn)", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) out[v] = v; // behåller allt oförändrat
      return out;
    });
    await buildVariantTranslatorAI([{ options: { Effect: "Glow" } }], { translateBatch });
    expect(translateBatch).toHaveBeenCalled(); // "Glow" ÄR en kandidat → nådde AI
    expect(await listVariantTranslations()).toEqual([]); // men oförändrat → inte loggat
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
    expect(translator.options({ Effect: "Glow" })).toEqual({ Effekt: "Glow" });
  });
});

describe("buildVariantTranslatorAI — robust axel-namngivning (utöver exakt 'Color')", () => {
  // Värden som inte finns i tabellen skickas annars till den riktiga värde-Haikun;
  // stäng den med en tom translateBatch så testet isolerar AXEL-beteendet.
  const noValueAI = async () => ({});

  it("'Color Name' med typ-värden → samma felmärkt-färg-väg som 'Color' (LAYER A)", async () => {
    const nameAxes = vi.fn(async (_axes: { axis: string; values: string[] }[]) => ({ "Color Name": "Typ" }));
    const variants = [
      { options: { "Color Name": "Vertical type" } },
      { options: { "Color Name": "Horizontal type" } },
    ];
    const { translator, unresolved } = await buildVariantTranslatorAI(variants, {
      nameAxes,
      translateBatch: noValueAI,
    });
    expect(nameAxes).toHaveBeenCalledTimes(1);
    expect(nameAxes.mock.calls[0][0]).toEqual([
      { axis: "Color Name", values: ["Vertical type", "Horizontal type"] },
    ]);
    expect(translator.axisNames.get("Color Name")).toBe("Typ");
    expect(unresolved).not.toContain("Color Name");
  });

  it("'Color Name' med riktiga färger → förblir 'Färg', ingen AI, ingen flagga", async () => {
    const nameAxes = vi.fn(async () => ({}));
    const variants = [{ options: { "Color Name": "Red" } }, { options: { "Color Name": "Blue" } }];
    const { translator, unresolved } = await buildVariantTranslatorAI(variants, { nameAxes });
    expect(nameAxes).not.toHaveBeenCalled(); // isColorAxis fångar → ingen AI
    expect(translator.options({ "Color Name": "Red" })).toEqual({ Färg: "Röd" });
    expect(unresolved).not.toContain("Color Name");
  });

  it("AI EKAR ett engelskt axelnamn → OLÖST (flaggas), till skillnad från ett ekat värde", async () => {
    // No-op-asymmetrin: ett ekat värde = "behållet med flit", men ett ekat
    // (kvar-engelskt/färg-aktigt) AXELNAMN får aldrig nå kund.
    const nameAxes = vi.fn(async () => ({ "Color Name": "Color Name" }));
    const variants = [
      { options: { "Color Name": "Vertical type" } },
      { options: { "Color Name": "Horizontal type" } },
    ];
    const { translator, unresolved } = await buildVariantTranslatorAI(variants, {
      nameAxes,
      translateBatch: noValueAI,
    });
    expect(translator.axisNames.get("Color Name")).toBe("Färg"); // ingen override (eko)
    expect(unresolved).toContain("Color Name"); // men FLAGGAD
  });

  it("generellt engelskt icke-färg-namn ('Lighting Mode') → AI översätter namnet (override)", async () => {
    const nameAxes = vi.fn(async () => ({ "Lighting Mode": "Ljusläge" }));
    const variants = [
      { options: { "Lighting Mode": "Strobe" } },
      { options: { "Lighting Mode": "Fade" } },
    ];
    const { translator, unresolved } = await buildVariantTranslatorAI(variants, {
      nameAxes,
      translateBatch: noValueAI,
    });
    expect(nameAxes).toHaveBeenCalledTimes(1);
    expect(translator.axisNames.get("Lighting Mode")).toBe("Ljusläge");
    expect(unresolved).not.toContain("Lighting Mode");
  });

  it("engelskt namn AI inte kan översätta → slutnamnet kvar engelskt → flaggat", async () => {
    const nameAxes = vi.fn(async () => ({})); // inget svar
    const { translator, unresolved } = await buildVariantTranslatorAI(
      [{ options: { "Lighting Mode": "Strobe" } }],
      { nameAxes, translateBatch: noValueAI },
    );
    expect(translator.axisNames.get("Lighting Mode")).toBe("Lighting Mode");
    expect(unresolved).toContain("Lighting Mode");
  });

  it("ren svensk icke-färg-axel ('Storlek') → ingen axel-AI, ingen flagga", async () => {
    const nameAxes = vi.fn(async () => ({}));
    const { translator, unresolved } = await buildVariantTranslatorAI(
      [{ options: { Size: "XL" } }, { options: { Size: "S" } }],
      { nameAxes },
    );
    expect(nameAxes).not.toHaveBeenCalled();
    expect(translator.axisNames.get("Size")).toBe("Storlek");
    expect(unresolved).not.toContain("Size");
  });

  it("cache-poisoning-skydd: ett cachat engelskt eko fortsätter flaggas (AI ej re-anropad)", async () => {
    const nameAxes = vi.fn(async () => ({ "Lighting Mode": "Lighting Mode" })); // ekar engelska
    const variants = [{ options: { "Lighting Mode": "Strobe" } }];
    const first = await buildVariantTranslatorAI(variants, { nameAxes, translateBatch: noValueAI });
    expect(first.unresolved).toContain("Lighting Mode");
    expect(nameAxes).toHaveBeenCalledTimes(1);
    // Andra importen: cache-hit på ekot → AI ej re-anropad, men axeln ändå flaggad.
    const second = await buildVariantTranslatorAI(variants, { nameAxes, translateBatch: noValueAI });
    expect(nameAxes).toHaveBeenCalledTimes(1);
    expect(second.unresolved).toContain("Lighting Mode");
    expect(second.translator.axisNames.get("Lighting Mode")).toBe("Lighting Mode");
  });
});

describe("buildVariantTranslatorAI — AI namnger felmärkta 'Color'-axlar", () => {
  it("material under 'Color' → AI ger axelnamnet (värdena översätts via tabellen)", async () => {
    const nameAxes = vi.fn(async () => ({ Color: "Material" }));
    const variants = [{ options: { Color: "Cotton" } }, { options: { Color: "Polyester" } }];
    const { translator } = await buildVariantTranslatorAI(variants, { nameAxes });
    expect(nameAxes).toHaveBeenCalledTimes(1);
    expect(translator.options({ Color: "Cotton" })).toEqual({ Material: "Bomull" });
  });

  it("AI 'räddar' exotiska färger → axeln förblir 'Färg' (ingen override)", async () => {
    const nameAxes = vi.fn(async () => ({ Color: "Färg" }));
    const variants = [{ options: { Color: "Champagne" } }, { options: { Color: "Ivory" } }];
    const { translator } = await buildVariantTranslatorAI(variants, { nameAxes });
    expect(translator.options({ Color: "Champagne" })).toEqual({ Färg: "Champagne" });
  });

  it("AI kan inte namnge → axeln flaggas (unresolved) och förblir 'Färg'", async () => {
    const nameAxes = vi.fn(async () => ({})); // inget svar
    const variants = [{ options: { Color: "Cotton" } }, { options: { Color: "Polyester" } }];
    const { translator, unresolved } = await buildVariantTranslatorAI(variants, { nameAxes });
    expect(unresolved).toContain("Color");
    expect(translator.options({ Color: "Cotton" })).toEqual({ Färg: "Bomull" });
  });

  it("riktiga färger + känd klass (storlek) → ingen axel-AI alls", async () => {
    const nameAxes = vi.fn(async () => ({}));
    await buildVariantTranslatorAI([{ options: { Color: "Red" } }, { options: { Color: "Blue" } }], { nameAxes });
    await buildVariantTranslatorAI([{ options: { Color: "42 inch" } }], { nameAxes });
    expect(nameAxes).not.toHaveBeenCalled();
  });

  it("cachar axelnamnet: andra importen frågar inte AI igen", async () => {
    const nameAxes = vi.fn(async () => ({ Color: "Material" }));
    const variants = [{ options: { Color: "Cotton" } }, { options: { Color: "Polyester" } }];
    await buildVariantTranslatorAI(variants, { nameAxes });
    await buildVariantTranslatorAI(variants, { nameAxes });
    expect(nameAxes).toHaveBeenCalledTimes(1); // cachat per axel+värdemängd
  });

  it("namngivnings-fel fäller aldrig importen (failOpen → 'Färg' + flagga)", async () => {
    const nameAxes = vi.fn(async () => {
      throw new Error("nät nere");
    });
    const variants = [{ options: { Color: "Cotton" } }, { options: { Color: "Polyester" } }];
    const { translator, unresolved } = await buildVariantTranslatorAI(variants, { nameAxes });
    expect(unresolved).toContain("Color");
    expect(translator.options({ Color: "Cotton" })).toEqual({ Färg: "Bomull" });
  });
});
