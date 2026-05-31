import { describe, expect, it } from "vitest";
import { isFresh, CACHE_TTL_DAYS } from "./alternative-cache";

describe("isFresh", () => {
  const now = new Date("2026-05-31T12:00:00.000Z");

  it("true inom TTL", () => {
    const recent = new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString();
    expect(isFresh(recent, now)).toBe(true);
  });

  it("false bortom TTL", () => {
    const old = new Date(now.getTime() - (CACHE_TTL_DAYS + 1) * 24 * 3600 * 1000).toISOString();
    expect(isFresh(old, now)).toBe(false);
  });

  it("false vid ogiltig timestamp", () => {
    expect(isFresh("inte-ett-datum", now)).toBe(false);
  });
});
