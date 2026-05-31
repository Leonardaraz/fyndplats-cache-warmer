import { beforeEach, describe, expect, it } from "vitest";
import { __clearMemCache, getCachedResult, makeCacheKey, setCachedResult } from "./cache";
import { __resetLlmMemoryStore } from "./storage";

beforeEach(() => {
  __resetLlmMemoryStore();
  __clearMemCache();
});

describe("makeCacheKey", () => {
  it("is stable for identical inputs", () => {
    const a = makeCacheKey({ op: "x", name: "foo", description: "bar baz", dependencyFingerprint: "a,b" });
    const b = makeCacheKey({ op: "x", name: "foo", description: "bar baz", dependencyFingerprint: "a,b" });
    expect(a).toBe(b);
  });
  it("only considers first 500 chars of description", () => {
    const k1 = makeCacheKey({ op: "x", name: "n", description: "a".repeat(500) });
    const k2 = makeCacheKey({ op: "x", name: "n", description: "a".repeat(500) + "extra" });
    expect(k1).toBe(k2);
  });
  it("differs for different ops", () => {
    const k1 = makeCacheKey({ op: "a", name: "n", description: "d" });
    const k2 = makeCacheKey({ op: "b", name: "n", description: "d" });
    expect(k1).not.toBe(k2);
  });
});

describe("get/setCachedResult", () => {
  it("returns null on miss", async () => {
    expect(await getCachedResult("missing-key")).toBe(null);
  });

  it("round-trips a value with provider info", async () => {
    await setCachedResult("k1", "op-1", { foo: "bar" }, "claude");
    const got = await getCachedResult<{ foo: string }>("k1");
    expect(got?.value).toEqual({ foo: "bar" });
    expect(got?.provider).toBe("claude");
  });

  it("respects TTL", async () => {
    // ttlMs=1 → omedelbart utgången vid läsning
    await setCachedResult("k-ttl", "op", { x: 1 }, "claude", 1);
    await new Promise((r) => setTimeout(r, 5));
    expect(await getCachedResult("k-ttl")).toBe(null);
  });
});
