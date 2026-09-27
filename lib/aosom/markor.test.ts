// Förseglingen av svepens markör. Varför den finns står i markor.ts.
//
// ☠️ Artikelnumren här är SYNTETISKA och byggs vid körning, så att källan inte
// själv bär en sträng med artikelnummerform.

import { describe, expect, it } from "vitest";
import { forseglaMarkor, MARKOR_PREFIX, MarkorFel, oppnaMarkor } from "./markor";

const HEMLIGHET = "test-hemlighet";
/** Syntetiskt, men med artikelnummerform — det är den formen som inte får läcka. */
const ARTIKEL = ["999", "999ZZ"].join("-");

describe("forseglaMarkor / oppnaMarkor", () => {
  it("en förseglad markör öppnas till samma artikel", () => {
    const f = forseglaMarkor(ARTIKEL, HEMLIGHET);
    expect(f).not.toBeNull();
    expect(oppnaMarkor(f, HEMLIGHET)).toBe(ARTIKEL);
  });

  it("☠️ den förseglade markören bär inte artikelnumret, och är URL-säker", () => {
    const f = forseglaMarkor(ARTIKEL, HEMLIGHET)!;
    expect(f.startsWith(MARKOR_PREFIX)).toBe(true);
    expect(f).not.toContain(ARTIKEL);
    expect(f).toMatch(/^m1\.[A-Za-z0-9_-]+$/);
  });

  it("samma artikel ger olika förseglingar — ingen ordbok går att bygga", () => {
    expect(forseglaMarkor(ARTIKEL, HEMLIGHET)).not.toBe(forseglaMarkor(ARTIKEL, HEMLIGHET));
  });

  it("slut på svepet förblir null", () => {
    expect(forseglaMarkor(null, HEMLIGHET)).toBeNull();
    expect(forseglaMarkor("", HEMLIGHET)).toBeNull();
  });

  it("en handskriven markör i klartext tas emot som den är", () => {
    expect(oppnaMarkor(`  ${ARTIKEL} `, HEMLIGHET)).toBe(ARTIKEL);
  });

  it("tom eller saknad markör blir undefined — början av feeden", () => {
    expect(oppnaMarkor(null, HEMLIGHET)).toBeUndefined();
    expect(oppnaMarkor("", HEMLIGHET)).toBeUndefined();
    expect(oppnaMarkor("   ", HEMLIGHET)).toBeUndefined();
  });

  it("☠️ fel nyckel KASTAR — ett svep som tyst börjar om är fel riktning", () => {
    const f = forseglaMarkor(ARTIKEL, HEMLIGHET);
    expect(() => oppnaMarkor(f, "annan-hemlighet")).toThrow(MarkorFel);
  });

  it("☠️ en ändrad markör KASTAR", () => {
    const f = forseglaMarkor(ARTIKEL, HEMLIGHET)!;
    // Ett tecken MITT I strängen: det sista kan i base64 bära bara utfyllnads-
    // bitar, och då hade "ändringen" inte ändrat en enda byte.
    const i = MARKOR_PREFIX.length + 20;
    const nytt = f[i] === "A" ? "g" : "A";
    expect(() => oppnaMarkor(f.slice(0, i) + nytt + f.slice(i + 1), HEMLIGHET)).toThrow(MarkorFel);
    expect(() => oppnaMarkor(`${MARKOR_PREFIX}kort`, HEMLIGHET)).toThrow(MarkorFel);
  });

  it("☠️ utan hemlighet går ingenting ut — hellre ett fel än klartext", () => {
    expect(() => forseglaMarkor(ARTIKEL, "")).toThrow(MarkorFel);
    // En handskriven markör behöver ingen nyckel för att tas emot.
    expect(oppnaMarkor(ARTIKEL, "")).toBe(ARTIKEL);
  });
});
