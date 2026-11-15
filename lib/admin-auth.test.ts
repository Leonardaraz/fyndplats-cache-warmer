import { describe, it, expect } from "vitest";
import { adminAuthDecision, parseBasicAuth } from "./admin-auth";

// btoa finns globalt i Node (test) + edge.
const basic = (u: string, p: string) => `Basic ${btoa(`${u}:${p}`)}`;

describe("parseBasicAuth", () => {
  it("tolkar giltig Basic-header", () => {
    expect(parseBasicAuth(basic("leo", "hemligt"))).toEqual({ user: "leo", pass: "hemligt" });
  });
  it("hanterar lösenord som innehåller kolon", () => {
    expect(parseBasicAuth(basic("leo", "a:b:c"))).toEqual({ user: "leo", pass: "a:b:c" });
  });
  it("returnerar null för icke-Basic / trasig header", () => {
    expect(parseBasicAuth(null)).toBeNull();
    expect(parseBasicAuth("Bearer xyz")).toBeNull();
    expect(parseBasicAuth("Basic !!!inte-base64")).toBeNull();
    expect(parseBasicAuth("Basic " + btoa("ingenkolon"))).toBeNull();
  });
});

describe("adminAuthDecision", () => {
  it("☠️ saknad inställning NEKAR: en tappad variabel öppnar inte admin", () => {
    // Förut svarade funktionen "disabled" här, och middleware släppte igenom.
    expect(adminAuthDecision(null, undefined, undefined)).toBe("misconfigured");
    expect(adminAuthDecision(null, "", "")).toBe("misconfigured");
    // Också när bara den ena saknas, och också med inloggningsuppgifter som
    // hade stämt mot den som finns.
    expect(adminAuthDecision(basic("leo", "x"), "leo", undefined)).toBe("misconfigured");
    expect(adminAuthDecision(basic("leo", "x"), undefined, "x")).toBe("misconfigured");
  });
  it("det stängda läget är förvalet: den som glömmer argumentet får inte det öppna", () => {
    expect(adminAuthDecision(null, undefined, undefined, false)).toBe("misconfigured");
    expect(adminAuthDecision(null, undefined, undefined, undefined)).toBe("misconfigured");
  });
  it("öppet läge (lokalt och i prov) släpper igenom utan inställning", () => {
    expect(adminAuthDecision(null, undefined, undefined, true)).toBe("disabled");
    expect(adminAuthDecision(basic("leo", "x"), "leo", undefined, true)).toBe("disabled");
    expect(adminAuthDecision(basic("leo", "x"), undefined, "x", true)).toBe("disabled");
  });
  it("öppet läge försvagar aldrig ett skydd som ÄR inställt", () => {
    expect(adminAuthDecision(null, "leo", "hemligt", true)).toBe("unauthorized");
    expect(adminAuthDecision(basic("leo", "fel"), "leo", "hemligt", true)).toBe("unauthorized");
    expect(adminAuthDecision(basic("leo", "hemligt"), "leo", "hemligt", true)).toBe("ok");
  });
  it("ok vid korrekta credentials", () => {
    expect(adminAuthDecision(basic("leo", "hemligt"), "leo", "hemligt")).toBe("ok");
  });
  it("unauthorized vid fel/saknad credentials när skyddet är på", () => {
    expect(adminAuthDecision(null, "leo", "hemligt")).toBe("unauthorized");
    expect(adminAuthDecision(basic("leo", "fel"), "leo", "hemligt")).toBe("unauthorized");
    expect(adminAuthDecision(basic("fel", "hemligt"), "leo", "hemligt")).toBe("unauthorized");
  });
});
