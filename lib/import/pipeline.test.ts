import { describe, expect, it } from "vitest";
import { orderImagesByVerdict } from "./pipeline";

describe("orderImagesByVerdict", () => {
  it("filters rejects and demotes warns after oks, preserving order within groups", () => {
    const urls = ["a", "b", "c", "d", "e"];
    const verdicts = [
      { url: "a", verdict: "warn" as const, reason: "lite text" },
      { url: "b", verdict: "ok" as const, reason: "" },
      { url: "c", verdict: "reject" as const, reason: "vattenstämpel" },
      { url: "d", verdict: "ok" as const, reason: "" },
      { url: "e", verdict: "warn" as const, reason: "låg kvalitet" },
    ];
    expect(orderImagesByVerdict(urls, verdicts)).toEqual(["b", "d", "a", "e"]);
  });

  it("returns all input when no verdicts (fail-open)", () => {
    expect(orderImagesByVerdict(["a", "b"], [])).toEqual(["a", "b"]);
  });

  it("treats unknown URL verdicts as ok", () => {
    const verdicts = [{ url: "x", verdict: "reject" as const, reason: "" }];
    expect(orderImagesByVerdict(["a", "b"], verdicts)).toEqual(["a", "b"]);
  });
});
