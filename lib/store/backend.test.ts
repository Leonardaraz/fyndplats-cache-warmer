import { execSync } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isPersistentBackend, STORE_BACKENDS, storeBackend } from "./backend";

afterEach(() => vi.unstubAllEnvs());

describe("storeBackend", () => {
  it("default är memory — oförändrat kontrakt för dev och test", () => {
    vi.stubEnv("STORE_BACKEND", "");
    expect(storeBackend()).toBe("memory");
  });

  it.each(STORE_BACKENDS)("accepterar %s", (b) => {
    vi.stubEnv("STORE_BACKEND", b);
    expect(storeBackend()).toBe(b);
  });

  it("☠️ KASTAR på okänt värde i stället för att gissa", () => {
    // En tyst fallback gör en felstavad variabel omöjlig att skilja från ett
    // medvetet val, och priset betalas i produktion.
    vi.stubEnv("STORE_BACKEND", "postgress");
    expect(() => storeBackend()).toThrow(/Okänt STORE_BACKEND/);
  });
});

describe("isPersistentBackend", () => {
  it("☠️ är SANT för postgres — annars tystnar modulerna som ligger kvar i Wix", () => {
    // Det här är hela fyndet från auditen 2026-08-31. watchlist- och
    // bulk-import-storen jämförde mot strängen "wix-data" och hade fallit
    // tillbaka till minnet så fort Store bytte drift-databas: bulk-jobbet
    // skrivs i EN lambda och worker-cronen läser i en annan, så det hade
    // försvunnit varje minut — utan ett ord i loggen.
    vi.stubEnv("STORE_BACKEND", "postgres");
    expect(isPersistentBackend()).toBe(true);
  });

  it("är sant för wix-data och falskt för memory", () => {
    vi.stubEnv("STORE_BACKEND", "wix-data");
    expect(isPersistentBackend()).toBe(true);
    vi.stubEnv("STORE_BACKEND", "memory");
    expect(isPersistentBackend()).toBe(false);
  });
});

describe("invarianten: EN definition, ingen läser miljövariabeln själv", () => {
  it("☠️ ingen fil utanför backend.ts läser process.env.STORE_BACKEND", () => {
    // Variabeln lästes tidigare på sex ställen med tre olika semantiker, och
    // tre av dem föll tyst till minnet på allt som inte var exakt "wix-data".
    // Det testet finns för att den spridningen inte ska kunna växa tillbaka —
    // samma skäl som SHIP_AXIS_RE och EU_TULL_CODES har sina tvilling-tester.
    const träffar = execSync(
      "grep -rln 'process\\.env\\.STORE_BACKEND' --include=*.ts --include=*.tsx app lib || true",
      { encoding: "utf-8" },
    )
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean)
      .filter((f) => !f.endsWith("lib/store/backend.ts"))
      .filter((f) => !f.endsWith(".test.ts"));

    expect(träffar).toEqual([]);
  });
});
