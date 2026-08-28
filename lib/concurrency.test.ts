import { describe, it, expect } from "vitest";
import { mapWithConcurrency } from "./concurrency";

describe("mapWithConcurrency", () => {
  it("behåller ordningen — synkens rotationssortering bygger på att paren hör ihop", async () => {
    const r = await mapWithConcurrency([5, 1, 4, 2, 3], 2, async (n) => {
      await new Promise((res) => setTimeout(res, n));
      return n * 10;
    });
    expect(r).toEqual([50, 10, 40, 20, 30]);
  });

  it("har aldrig fler än `limit` i luften samtidigt — hela poängen", async () => {
    let inFlight = 0;
    let mest = 0;
    await mapWithConcurrency(Array.from({ length: 50 }, (_, i) => i), 4, async () => {
      inFlight++;
      mest = Math.max(mest, inFlight);
      await new Promise((res) => setTimeout(res, 1));
      inFlight--;
      return null;
    });
    expect(mest).toBeLessThanOrEqual(4);
    expect(mest).toBeGreaterThan(1);
  });

  it("tom lista gör inga anrop", async () => {
    let anrop = 0;
    const r = await mapWithConcurrency([], 8, async () => { anrop++; return 1; });
    expect(r).toEqual([]);
    expect(anrop).toBe(0);
  });

  it("orimliga tak faller tillbaka på ett i taget i stället för noll arbetare (skulle hänga)", async () => {
    for (const tak of [0, -3, Number.NaN]) {
      const r = await mapWithConcurrency([1, 2, 3], tak, async (n) => n + 1);
      expect(r).toEqual([2, 3, 4]);
    }
  });

  it("ett kast fäller anropet, precis som Promise.all", async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error("trasig");
        return n;
      }),
    ).rejects.toThrow("trasig");
  });
});
