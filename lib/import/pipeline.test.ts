import { describe, expect, it } from "vitest";
import { orderImagesByVerdict } from "./pipeline";

describe("orderImagesByVerdict", () => {
  it("demotes warns after oks and rejects last, preserving order within groups", () => {
    const urls = ["a", "b", "c", "d", "e"];
    const verdicts = [
      { url: "a", verdict: "warn" as const, reason: "lite text" },
      { url: "b", verdict: "ok" as const, reason: "" },
      { url: "c", verdict: "reject" as const, reason: "vattenstämpel" },
      { url: "d", verdict: "ok" as const, reason: "" },
      { url: "e", verdict: "warn" as const, reason: "låg kvalitet" },
    ];
    // Rejects tas INTE bort längre — de hamnar bara sist (bug 2026-05-31).
    expect(orderImagesByVerdict(urls, verdicts)).toEqual(["b", "d", "a", "e", "c"]);
  });

  it("keeps all images even when every image is rejected (never returns empty)", () => {
    const urls = ["a", "b", "c"];
    const verdicts = [
      { url: "a", verdict: "reject" as const, reason: "x" },
      { url: "b", verdict: "reject" as const, reason: "y" },
      { url: "c", verdict: "reject" as const, reason: "z" },
    ];
    expect(orderImagesByVerdict(urls, verdicts)).toEqual(["a", "b", "c"]);
  });

  it("returns all input when no verdicts (fail-open)", () => {
    expect(orderImagesByVerdict(["a", "b"], [])).toEqual(["a", "b"]);
  });

  it("treats unknown URL verdicts as ok", () => {
    const verdicts = [{ url: "x", verdict: "reject" as const, reason: "" }];
    expect(orderImagesByVerdict(["a", "b"], verdicts)).toEqual(["a", "b"]);
  });
});
