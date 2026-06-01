import { describe, expect, it } from "vitest";
import { buildFocusKeywordEntries, deriveFocusKeyword } from "./focus-keyword";

describe("deriveFocusKeyword", () => {
  it("klipper vid en-dash och tar huvuddelen", () => {
    expect(deriveFocusKeyword("Sverige Fotboll T-shirt Herr – 3D-tryckt Sommarplagg")).toBe(
      "sverige fotboll t-shirt herr",
    );
    expect(deriveFocusKeyword("Automatisk Tvåldispenser – Touchless Sensor, Skum & Vätska")).toBe(
      "automatisk tvåldispenser",
    );
  });

  it("bevarar interna bindestreck (T-shirt, LED-skärm, 8-i-1)", () => {
    expect(deriveFocusKeyword("Elektrisk Rengöringsborste 8-i-1 – Sladdlös")).toBe(
      "elektrisk rengöringsborste 8-i-1",
    );
    expect(deriveFocusKeyword("RGB LED-slinga med App & Fjärrkontroll – Färgskiftande")).toBe(
      "rgb led-slinga med app",
    );
  });

  it("trimmar efterföljande spec-nummer (360°, 2000lm, lösa siffror)", () => {
    expect(deriveFocusKeyword("Roterande sminkförvaring 360° – borsthållare")).toBe(
      "roterande sminkförvaring",
    );
    expect(deriveFocusKeyword("Taktisk LED-ficklampa 2000LM – USB-laddbar")).toBe(
      "taktisk led-ficklampa",
    );
    expect(deriveFocusKeyword("Massagepistol med LED-skärm & 6 massagehuvuden")).toBe(
      "massagepistol med led-skärm",
    );
  });

  it("behåller ledande nummer (de hör till produktidentiteten)", () => {
    expect(deriveFocusKeyword("12-pack Hjärteballonger – Röda & Peach")).toBe(
      "12-pack hjärteballonger",
    );
    expect(deriveFocusKeyword("3D Stickers – Fjärilar & Blommor")).toBe("3d stickers");
    expect(deriveFocusKeyword("550 ml Reseflaska i Härdat Glas – Stöttålig")).toBe(
      "550 ml reseflaska",
    );
  });

  it("hanterar titlar utan separator", () => {
    expect(deriveFocusKeyword("Svart Multifunktionell Makeupborste")).toBe(
      "svart multifunktionell makeupborste",
    );
    expect(deriveFocusKeyword("Hållningskorrigerare")).toBe("hållningskorrigerare");
  });

  it("hanterar mellanslags-bindestreck som separator", () => {
    expect(deriveFocusKeyword("Universal TV-Fjärrkontroll - LG Smart TV MR20GA")).toBe(
      "universal tv-fjärrkontroll",
    );
    expect(deriveFocusKeyword("Nackkudde för Bil - Memory Foam (Universal)")).toBe(
      "nackkudde för bil",
    );
  });

  it("är deterministisk och case-insensitiv (idempotent)", () => {
    const a = deriveFocusKeyword("JBL Flip 5 Bluetooth-högtalare – vattentålig IPX7");
    expect(a).toBe(deriveFocusKeyword("JBL Flip 5 Bluetooth-högtalare – vattentålig IPX7"));
    expect(a).toBe("jbl flip 5 bluetooth-högtalare");
  });

  it("tål tom/skräp-input utan att krascha", () => {
    expect(deriveFocusKeyword("")).toBe("");
    expect(deriveFocusKeyword("   ")).toBe("");
    expect(deriveFocusKeyword("– – –")).toBe("");
    // @ts-expect-error medvetet fel typ
    expect(deriveFocusKeyword(null)).toBe("");
  });
});

describe("buildFocusKeywordEntries", () => {
  it("bygger en isMain:true-post i Wix-format", () => {
    expect(buildFocusKeywordEntries("Astronaut Stjärnprojektor – Galax-nattlampa")).toEqual([
      { term: "astronaut stjärnprojektor", isMain: true, origin: "USER" },
    ]);
  });

  it("returnerar tom array när inget ord kan härledas", () => {
    expect(buildFocusKeywordEntries("")).toEqual([]);
    expect(buildFocusKeywordEntries("   ")).toEqual([]);
  });
});
