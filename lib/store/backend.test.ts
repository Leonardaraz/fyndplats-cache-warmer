import { execSync } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AUCTION_BACKENDS, auctionsBackend, isPersistentBackend, reviewsBackend, STORE_BACKENDS, storeBackend } from "./backend";

afterEach(() => vi.unstubAllEnvs());

describe("storeBackend", () => {
  it("default är memory — oförändrat kontrakt för dev och test", () => {
    vi.stubEnv("STORE_BACKEND", "");
    expect(storeBackend()).toBe("memory");
  });

  it.each(STORE_BACKENDS)("accepterar %s (postgres betyder Wix sedan växlingen 2026-10-29)", (b) => {
    vi.stubEnv("STORE_BACKEND", b);
    expect(storeBackend()).toBe(b === "postgres" ? "wix-data" : b);
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

describe("auctionsBackend", () => {
  it("☠️ default är Wix sedan flytten tillbaka 2026-10-29 (Postgres 2026-09-30 till 10-29)", () => {
    // Auktionerna flyttade till Postgres 2026-09-30, i koden eftersom Vercel
    // nekade att skapa variabeln (403). Tillbaka till Wix 2026-10-29 genom
    // DRIFTEN_I_WIX, av samma skäl.
    vi.stubEnv("STORE_BACKEND", "postgres");
    vi.stubEnv("AUCTIONS_BACKEND", "");
    expect(auctionsBackend()).toBe("wix-data");
    vi.stubEnv("STORE_BACKEND", "wix-data");
    expect(auctionsBackend()).toBe("wix-data");
  });

  it("AUCTIONS_BACKEND=wix-data är vägen tillbaka och vinner över defaulten", () => {
    vi.stubEnv("AUCTIONS_BACKEND", "wix-data");
    expect(auctionsBackend()).toBe("wix-data");
  });

  it.each(AUCTION_BACKENDS)("accepterar %s (postgres betyder Wix sedan växlingen 2026-10-29)", (b) => {
    vi.stubEnv("AUCTIONS_BACKEND", b);
    expect(auctionsBackend()).toBe(b === "postgres" ? "wix-data" : b);
  });

  it("☠️ KASTAR på okänt värde, även memory (motorn har inget minneslager)", () => {
    vi.stubEnv("AUCTIONS_BACKEND", "postgress");
    expect(() => auctionsBackend()).toThrow(/Okänt AUCTIONS_BACKEND/);
    vi.stubEnv("AUCTIONS_BACKEND", "memory");
    expect(() => auctionsBackend()).toThrow(/Okänt AUCTIONS_BACKEND/);
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

  it("☠️ ingen fil utanför backend.ts läser process.env.AUCTIONS_BACKEND", () => {
    const träffar = execSync(
      "grep -rln 'process\\.env\\.AUCTIONS_BACKEND' --include=*.ts --include=*.tsx app lib || true",
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

describe("DRIFTEN_I_WIX", () => {
  it("☠️ är SANN sedan växlingen 2026-10-29: postgres i miljön betyder Wix", async () => {
    // Steg 4 av flytten tillbaka. Kopian verifierades rad för rad före
    // växlingen (alla 20 tabeller lika). Vercel låter oss inte ändra
    // STORE_BACKEND, REVIEWS_BACKEND eller AUCTIONS_BACKEND (403), så de står
    // kvar på postgres och betyder Wix så länge växeln är sann.
    const { DRIFTEN_I_WIX } = await import("./backend");
    expect(DRIFTEN_I_WIX).toBe(true);
    vi.stubEnv("STORE_BACKEND", "postgres");
    expect(storeBackend()).toBe("wix-data");
    vi.stubEnv("REVIEWS_BACKEND", "postgres");
    expect(reviewsBackend()).toBe("wix-data");
    vi.stubEnv("AUCTIONS_BACKEND", "");
    expect(auctionsBackend()).toBe("wix-data");
  });
});
