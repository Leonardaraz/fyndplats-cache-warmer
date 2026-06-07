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
  it("disabled när env saknas (ingen utelåsning)", () => {
    expect(adminAuthDecision(null, undefined, undefined)).toBe("disabled");
    expect(adminAuthDecision(basic("leo", "x"), "leo", undefined)).toBe("disabled");
    expect(adminAuthDecision(basic("leo", "x"), undefined, "x")).toBe("disabled");
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
