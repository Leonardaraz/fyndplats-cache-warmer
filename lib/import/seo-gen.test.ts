import { describe, expect, it } from "vitest";
import { pickBest, type SeoMetaResult } from "./seo-gen";

const FALLBACK: SeoMetaResult = { chosen: "fallback meta", variants: [], reason: "fail-open" };

describe("seo-gen — pickBest", () => {
  it("väljer angivet bestIndex", () => {
    const r = pickBest({ variants: ["a", "b", "c"], bestIndex: 1, reason: "B vinner" }, FALLBACK);
    expect(r.chosen).toBe("b");
    expect(r.variants).toEqual(["a", "b", "c"]);
    expect(r.reason).toBe("B vinner");
  });

  it("defaultar till första varianten vid ogiltigt index", () => {
    expect(pickBest({ variants: ["a", "b"], bestIndex: 9 }, FALLBACK).chosen).toBe("a");
    expect(pickBest({ variants: ["a", "b"], bestIndex: -1 }, FALLBACK).chosen).toBe("a");
  });

  it("faller tillbaka när inga varianter finns", () => {
    expect(pickBest({ variants: [] }, FALLBACK)).toBe(FALLBACK);
    expect(pickBest({}, FALLBACK)).toBe(FALLBACK);
  });

  it("filtrerar bort tomma varianter", () => {
    const r = pickBest({ variants: ["", "  ", "riktig"], bestIndex: 0 }, FALLBACK);
    expect(r.variants).toEqual(["riktig"]);
    expect(r.chosen).toBe("riktig");
  });

  it("klampar variant till ≤160 tecken på ordgräns", () => {
    const long = "Lorem ipsum dolor sit amet ".repeat(10); // >160
    const r = pickBest({ variants: [long], bestIndex: 0 }, FALLBACK);
    expect(r.chosen.length).toBeLessThanOrEqual(160);
    expect(r.chosen.endsWith(" ")).toBe(false);
  });
});
