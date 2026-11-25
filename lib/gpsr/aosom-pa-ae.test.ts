import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AOSOM_VARA_PA_AE_SIDA, arAosomVaraPaAeSida } from "./aosom-pa-ae";

const WIX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("AOSOM_VARA_PA_AE_SIDA", () => {
  it("bär bara Wix-produkt-id i gemener, inget annat", () => {
    expect(AOSOM_VARA_PA_AE_SIDA.size).toBeGreaterThan(0);
    for (const id of AOSOM_VARA_PA_AE_SIDA) expect(id).toMatch(WIX_ID);
  });

  it("☠️ filen nämner aldrig ett artikelnummer eller en aosom:-rad (repot är publikt)", () => {
    const kalla = readFileSync(join(__dirname, "aosom-pa-ae.ts"), "utf8");
    expect(kalla).not.toMatch(/aosom:[0-9A-Z]/);
    expect(kalla).not.toMatch(/\b\d{3}-[0-9A-Z]{5,}\b/);
  });

  it("loungesetet i rotting står med", () => {
    expect(arAosomVaraPaAeSida("58c5bc3a-d26e-4d42-8b42-1d2461397fc4")).toBe(true);
  });
});

describe("arAosomVaraPaAeSida", () => {
  it("är skiftlägesokänslig, som rutten som släpper in versaler i id:t", () => {
    expect(arAosomVaraPaAeSida("58C5BC3A-D26E-4D42-8B42-1D2461397FC4")).toBe(true);
  });

  it("svarar nej för ett id som inte står i listan, och för ett tomt id", () => {
    expect(arAosomVaraPaAeSida("6a31ffa8-1ca8-44d1-9c8f-fef2c55c5971")).toBe(false);
    expect(arAosomVaraPaAeSida("")).toBe(false);
  });
});
