import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, isTerminal } from "./status";

describe("canTransition", () => {
  it("allows the normal fulfillment path", () => {
    expect(canTransition("pending", "ordered")).toBe(true);
    expect(canTransition("ordered", "shipped")).toBe(true);
  });

  it("allows cancelling before shipping", () => {
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("ordered", "cancelled")).toBe(true);
  });

  it("forbids cancelling or changing a shipped task", () => {
    expect(canTransition("shipped", "cancelled")).toBe(false);
    expect(canTransition("shipped", "ordered")).toBe(false);
  });

  it("forbids skipping straight from pending to shipped", () => {
    expect(canTransition("pending", "shipped")).toBe(false);
  });

  it("treats cancelled as terminal", () => {
    expect(canTransition("cancelled", "ordered")).toBe(false);
  });
});

describe("assertTransition", () => {
  it("throws on an illegal transition", () => {
    expect(() => assertTransition("shipped", "cancelled")).toThrow(/Otillåten/);
  });
  it("does not throw on a legal transition", () => {
    expect(() => assertTransition("pending", "ordered")).not.toThrow();
  });
});

describe("isTerminal", () => {
  it("identifies terminal states", () => {
    expect(isTerminal("shipped")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("pending")).toBe(false);
  });
});
