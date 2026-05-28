import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getStore — STORE_BACKEND-val", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("default (env saknas) → MemoryStore", async () => {
    delete process.env.STORE_BACKEND;
    const { getStore } = await import("./factory");
    const { MemoryStore } = await import("./memory");
    expect(getStore()).toBeInstanceOf(MemoryStore);
  });

  it("STORE_BACKEND=memory → MemoryStore", async () => {
    vi.stubEnv("STORE_BACKEND", "memory");
    const { getStore } = await import("./factory");
    const { MemoryStore } = await import("./memory");
    expect(getStore()).toBeInstanceOf(MemoryStore);
  });

  it("STORE_BACKEND=wix-data → WixDataStore", async () => {
    vi.stubEnv("STORE_BACKEND", "wix-data");
    const { getStore } = await import("./factory");
    const { WixDataStore } = await import("./wix-data");
    expect(getStore()).toBeInstanceOf(WixDataStore);
  });

  it("Okänt STORE_BACKEND-värde kastar (typo-skydd)", async () => {
    vi.stubEnv("STORE_BACKEND", "wixdata"); // typo: ska vara wix-data
    const { getStore } = await import("./factory");
    expect(() => getStore()).toThrow(/Okänt STORE_BACKEND/);
  });
});
