import { beforeEach, describe, expect, it, vi } from "vitest";
import { __clearMemCache } from "../llm/cache";
import { __resetLlmMemoryStore } from "../llm/storage";
import { listVariantTranslations } from "../llm/variant-log";
import {
  buildVariantTranslatorAI as buildVariantTranslatorAIRaw,
  variantAiTranslationEnabled,
} from "./variant-ai-translate";

/** HERMETIK (audit M1): svenskhets-grindens DEFAULT gör riktiga API-anrop om
 *  ANTHROPIC_API_KEY råkar vara exporterad i skalet som kör vitest. Wrappa alla
 *  test-anrop med en no-op-grind (null = cacha/flagga inget); grind-testerna
 *  injicerar sin egen verifySwedish via ...opts och påverkas inte. */
const buildVariantTranslatorAI: typeof buildVariantTranslatorAIRaw = (variants, opts) =>
  buildVariantTranslatorAIRaw(variants, { verifySwedish: async () => null, ...opts });

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

  it("ett oförändrat AI-svar på kod/modellnamn MED SIFFROR räknas som LÖST, inte olöst", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) out[v] = v; // Claude behåller allt som det är (kod/modell)
      return out;
    });
    const { unresolved } = await buildVariantTranslatorAI(
      [{ options: { Effect: "iPhone 15 Pro" } }], // siffra → betrott eko (isUntrustedEcho)
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

  it("loggar INTE ett eko — och ett rent-ord-eko räknas numera som OLÖST", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) out[v] = v; // behåller allt oförändrat
      return out;
    });
    const { unresolved } = await buildVariantTranslatorAI(
      [{ options: { Effect: "Glow" } }],
      { translateBatch },
    );
    expect(translateBatch).toHaveBeenCalled(); // "Glow" ÄR en kandidat → nådde AI
    expect(await listVariantTranslations()).toEqual([]); // eko → aldrig loggat
    expect(unresolved).toContain("Glow"); // rent-ord-eko (utan siffror) → flaggat
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

describe("buildVariantTranslatorAI — eko-asymmetri för VÄRDEN (incident 2026-06-09 'Rear Wheel')", () => {
  it("rent-ord-eko (utan siffror) → OLÖST + faller på råvärde", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) out[v] = v; // ekar allt ("Shimmer" är inte i tabellen)
      return out;
    });
    const { translator, unresolved } = await buildVariantTranslatorAI(
      [{ options: { Effect: "Shimmer" } }],
      { translateBatch },
    );
    expect(unresolved).toContain("Shimmer");
    expect(translator.options({ Effect: "Shimmer" })).toEqual({ Effekt: "Shimmer" });
  });

  it("självläkning: förgiftad cache-post re-frågas nästa import och läks av svenskt svar", async () => {
    let mode: "echo" | "sv" = "echo";
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) out[v] = mode === "echo" ? v : "Skimmer";
      return out;
    });
    const variants = [{ options: { Effect: "Shimmer" } }];
    // Import 1: eko → cachas som eko-markör, OLÖST.
    const first = await buildVariantTranslatorAI(variants, { translateBatch });
    expect(translateBatch).toHaveBeenCalledTimes(1);
    expect(first.unresolved).toContain("Shimmer");
    // Import 2: cache-träffen är ett otrott eko → behandlas som MISS → re-ask → läks.
    mode = "sv";
    const second = await buildVariantTranslatorAI(variants, { translateBatch });
    expect(translateBatch).toHaveBeenCalledTimes(2);
    expect(second.unresolved).toEqual([]);
    expect(second.translator.options({ Effect: "Shimmer" })).toEqual({ Effekt: "Skimmer" });
    // Import 3: svensk cache-träff (svar ≠ råvärde) är betrodd → INGEN ny fråga.
    const third = await buildVariantTranslatorAI(variants, { translateBatch });
    expect(translateBatch).toHaveBeenCalledTimes(2);
    expect(third.unresolved).toEqual([]);
  });

  it("envist eko: re-cachas + förblir olöst — exakt EN batchad re-ask per import", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) out[v] = v; // ekar varje gång
      return out;
    });
    const variants = [{ options: { Effect: "Shimmer" } }];
    const first = await buildVariantTranslatorAI(variants, { translateBatch });
    const second = await buildVariantTranslatorAI(variants, { translateBatch });
    expect(translateBatch).toHaveBeenCalledTimes(2); // en re-ask per import, aldrig fler
    expect(first.unresolved).toContain("Shimmer");
    expect(second.unresolved).toContain("Shimmer");
  });

  it("NÄRA-eko (bara skiftläge skiljer) räknas som eko → OLÖST, betros aldrig (audit S3)", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) out[v] = v.toLowerCase(); // "Shimmer" → "shimmer" (case-eko)
      return out;
    });
    const variants = [{ options: { Effect: "Shimmer" } }];
    const first = await buildVariantTranslatorAI(variants, { translateBatch });
    expect(first.unresolved).toContain("Shimmer"); // betros INTE som översättning
    // …och cache-träffen på case-ekot självläker (re-ask), fastnar inte för alltid.
    const second = await buildVariantTranslatorAI(variants, { translateBatch });
    expect(translateBatch).toHaveBeenCalledTimes(2);
    expect(second.unresolved).toContain("Shimmer");
  });

  it("HALVÖVERSÄTTNING (svar ≠ råvärde men kvar-engelskt) → svaret används MEN flaggas", async () => {
    // Buffévärmaren 2026-06-09: "Silvery 4pcs" → "Silvery 4st" — inget eko, men
    // halv-engelska skeppades oflaggat. Nu: använd svaret (bättre än rått) + flagga.
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) if (v === "Shimmer Box") out[v] = "Shimmer låda"; // halvt
      return out;
    });
    const variants = [{ options: { Effect: "Shimmer Box" } }];
    const first = await buildVariantTranslatorAI(variants, { translateBatch });
    expect(first.translator.options({ Effect: "Shimmer Box" })).toEqual({ Effekt: "Shimmer låda" });
    expect(first.unresolved).toContain("Shimmer Box"); // flaggad trots använt svar
    // Cache-träffen är betrodd (≠ eko) → ingen re-ask, men flaggan består.
    const second = await buildVariantTranslatorAI(variants, { translateBatch });
    expect(translateBatch).toHaveBeenCalledTimes(1);
    expect(second.unresolved).toContain("Shimmer Box");
  });

  it("interpunktion gömmer INTE ett behållet engelskt ord (audit S1)", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) if (v === "Shimmer Box") out[v] = "Shimmer, låda"; // komma-gömt
      return out;
    });
    const { unresolved } = await buildVariantTranslatorAI(
      [{ options: { Effect: "Shimmer Box" } }],
      { translateBatch },
    );
    expect(unresolved).toContain("Shimmer Box");
  });

  it("ett HELSVENSKT svar flaggas inte (halvöversättnings-checken ger inga falska positiva)", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) if (v === "Shimmer") out[v] = "Skimrande";
      return out;
    });
    const { unresolved } = await buildVariantTranslatorAI(
      [{ options: { Effect: "Shimmer" } }],
      { translateBatch },
    );
    expect(unresolved).toEqual([]);
  });

  it("siffer-eko är betrott även via CACHE-träff (ingen re-ask)", async () => {
    const translateBatch = vi.fn(async (vals: string[]) => {
      const out: Record<string, string> = {};
      for (const v of vals) out[v] = v; // ekar modellnamnet
      return out;
    });
    const variants = [{ options: { Effect: "iPhone 15 Pro" } }];
    const first = await buildVariantTranslatorAI(variants, { translateBatch });
    const second = await buildVariantTranslatorAI(variants, { translateBatch });
    expect(translateBatch).toHaveBeenCalledTimes(1); // import 2 = betrodd cache-träff
    expect(first.unresolved).toEqual([]);
    expect(second.unresolved).toEqual([]);
  });
});

describe("buildVariantTranslatorAI — SVENSKHETS-GRINDEN (slutlig verifiering av skeppade värden)", () => {
  const noValueAI = async () => ({});

  it("fångar heuristikens blinda fläck: VERSAL-engelska ('STRIPED') flaggas av grinden", async () => {
    // "STRIPED" är all-caps → residual-heuristiken tolkar det som akronym/kod →
    // aldrig AI-kandidat → skulle skeppas tyst. Grinden ser SLUTVÄRDET.
    const verifySwedish = vi.fn(async (vals: string[]) =>
      vals.filter((v) => v === "STRIPED"),
    );
    const { unresolved } = await buildVariantTranslatorAI(
      [{ options: { Pattern: "STRIPED" } }],
      { translateBatch: noValueAI, verifySwedish },
    );
    expect(verifySwedish).toHaveBeenCalledTimes(1);
    expect(unresolved).toContain("STRIPED");
  });

  it("skickar BARA språkbedömbara strängar (mått/koder/siffror aldrig)", async () => {
    const verifySwedish = vi.fn(async (_vals: string[]) => [] as string[]);
    await buildVariantTranslatorAI(
      [{ options: { Size: "5XL" } }, { options: { Size: "KM-6631" } }],
      { translateBatch: noValueAI, verifySwedish },
    );
    // Finals = {"5XL","KM-6631","Storlek"} — bara axelnamnet har ett 3+-bokstavsord.
    expect(verifySwedish).toHaveBeenCalledTimes(1);
    expect(verifySwedish.mock.calls[0][0]).toEqual(["Storlek"]);
  });

  it("cachar verdikt per slutvärde: andra importen frågar inte om", async () => {
    const verifySwedish = vi.fn(async () => [] as string[]);
    const variants = [{ options: { Color: "Red" } }];
    await buildVariantTranslatorAI(variants, { translateBatch: noValueAI, verifySwedish });
    await buildVariantTranslatorAI(variants, { translateBatch: noValueAI, verifySwedish });
    expect(verifySwedish).toHaveBeenCalledTimes(1); // "Färg"/"Röd" cachade som ok
  });

  it("fail-open: null/kast cachar INGET och flaggar inget — nästa import frågar igen", async () => {
    const verifySwedish = vi.fn(async () => {
      throw new Error("nät nere");
    });
    const variants = [{ options: { Color: "Red" } }];
    const first = await buildVariantTranslatorAI(variants, { translateBatch: noValueAI, verifySwedish });
    expect(first.unresolved).toEqual([]); // grinden fäller aldrig importen
    const second = await buildVariantTranslatorAI(variants, { translateBatch: noValueAI, verifySwedish });
    expect(verifySwedish).toHaveBeenCalledTimes(2); // transient fel blev INTE cachat "ok"
    expect(second.unresolved).toEqual([]);
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
