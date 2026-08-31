import { describe, expect, it } from "vitest";
import { byggSortering, byggVillkor } from "./wix-filter";

const LOGG = { id: "id", checkedAt: "checked_at", productId: "product_id", actionTaken: "action_taken" };
const STATE = { listingStatus: "listing_status", errorStreak: "error_streak", lastCheckedAt: "last_checked_at" };

describe("byggVillkor — formerna kodbasen faktiskt använder", () => {
  it("tomt filter ger inget villkor alls", () => {
    expect(byggVillkor(undefined, LOGG)).toEqual({ sql: "", värden: [] });
    expect(byggVillkor({}, LOGG)).toEqual({ sql: "", värden: [] });
  });

  it("likhet (listLogForProduct)", () => {
    const v = byggVillkor({ productId: "p1" }, LOGG);
    expect(v.sql).toBe("product_id = $1");
    expect(v.värden).toEqual(["p1"]);
  });

  it("jämförelse (pruneLogOlderThan)", () => {
    const v = byggVillkor({ checkedAt: { $lt: "2026-08-01T00:00:00Z" } }, LOGG);
    expect(v.sql).toBe("checked_at < $1");
    expect(v.värden).toEqual(["2026-08-01T00:00:00Z"]);
  });

  it("$in + $gt tillsammans (listEventLogSince)", () => {
    const v = byggVillkor(
      { actionTaken: { $in: ["hidden", "error"] }, checkedAt: { $gt: "2026-08-30T00:00:00Z" } },
      LOGG,
    );
    expect(v.sql).toBe("action_taken = any($1) and checked_at > $2");
    expect(v.värden).toEqual([["hidden", "error"], "2026-08-30T00:00:00Z"]);
  });

  it("$or med två grenar (listProblemStates)", () => {
    const v = byggVillkor(
      { $or: [{ listingStatus: { $in: ["out_of_stock", "removed"] } }, { errorStreak: { $gt: 0 } }] },
      STATE,
    );
    expect(v.sql).toBe("(listing_status = any($1) or error_streak > $2)");
    expect(v.värden).toEqual([["out_of_stock", "removed"], 0]);
  });

  it("numrerar platshållare från angivet index", () => {
    const v = byggVillkor({ productId: "p1" }, LOGG, 3);
    expect(v.sql).toBe("product_id = $3");
  });
});

describe("☠️ översättaren KASTAR i stället för att tyst tappa en term", () => {
  // Det farliga med en halvfärdig översättare är inte att den kraschar, utan
  // att den ignorerar det den inte förstår och returnerar fel rader. I
  // pruneLogOlderThan hade ett tappat datumvillkor raderat hela loggen.

  it("okänt fält", () => {
    expect(() => byggVillkor({ hittePåFält: "x" }, LOGG)).toThrow(/går inte att filtrera på/);
  });

  it("okänd operator", () => {
    expect(() => byggVillkor({ productId: { $regex: "^a" } }, LOGG)).toThrow(/stöds inte/);
  });

  it("okänd toppnivå-operator", () => {
    expect(() => byggVillkor({ $and: [{ productId: "p" }] }, LOGG)).toThrow(/stöds inte/);
  });

  it("$in som inte är en lista", () => {
    expect(() => byggVillkor({ productId: { $in: "p1" } }, LOGG)).toThrow(/inte en lista/);
  });

  it("okänt fält i en $or-gren", () => {
    expect(() => byggVillkor({ $or: [{ nonsens: 1 }] }, STATE)).toThrow(/går inte att filtrera på/);
  });
});

describe("byggSortering", () => {
  it("översätter fält och riktning", () => {
    expect(byggSortering([{ fieldName: "checkedAt", order: "DESC" }], LOGG))
      .toBe(" order by checked_at desc nulls last");
  });

  it("tom sortering ger inget fragment", () => {
    expect(byggSortering(undefined, LOGG)).toBe("");
  });

  it("☠️ kastar på okänt sorteringsfält — annars blir ordningen tyst godtycklig", () => {
    expect(() => byggSortering([{ fieldName: "nonsens", order: "ASC" }], LOGG))
      .toThrow(/Går inte att sortera/);
  });
});
