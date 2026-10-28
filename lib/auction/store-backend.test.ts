// ☠️ Lagret väljs av AUCTIONS_BACKEND och ingenting annat.
//
// Default är Wix, även när STORE_BACKEND=postgres (produktionens läge). Hade
// auktionerna följt drift-datans växel hade ticken läst en TOM tabell i samma
// sekund som koden deployades — och påfyllningen hade sett "inget att främja".

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pg = vi.hoisted(() => ({
  pgQueryAuctions: vi.fn(async (..._a: unknown[]) => []),
  pgSenastSalda: vi.fn(async (..._a: unknown[]) => []),
  pgSaveAuction: vi.fn(async (..._a: unknown[]) => {}),
  pgSaveAuctionsBulk: vi.fn(async (..._a: unknown[]) => [] as string[]),
  pgRemoveAuctionsBulk: vi.fn(async (..._a: unknown[]) => [] as string[]),
  pgRemoveAuction: vi.fn(async (..._a: unknown[]) => {}),
}));
vi.mock("./store-postgres", () => pg);

import {
  auktionslager,
  queryAuctions,
  removeAuction,
  removeAuctionsBulk,
  saveAuction,
  saveAuctionsBulk,
  senastSalda,
} from "./store";
import type { AuctionDoc } from "./engine";

const DOK = { _id: "auction-p1", productId: "p1", slug: "s", status: "queued" } as AuctionDoc;

let fetchAnrop: string[] = [];

beforeEach(() => {
  fetchAnrop = [];
  for (const f of Object.values(pg)) f.mockClear();
  vi.stubEnv("WIX_API_TOKEN", "t");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: { body?: string }) => {
      fetchAnrop.push(`${url} ${init?.body ?? ""}`);
      return new Response(JSON.stringify({ dataItems: [], bulkActionMetadata: { totalFailures: 0 } }), { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("auktionernas lager", () => {
  it("☠️ AUCTIONS_BACKEND=wix-data går till Wix och rör aldrig Postgres", async () => {
    vi.stubEnv("STORE_BACKEND", "postgres");
    vi.stubEnv("AUCTIONS_BACKEND", "wix-data");
    expect(auktionslager()).toBe("wix-data");
    await queryAuctions(["live", "queued"], { köHuvud: 200 });
    await senastSalda(6);
    await saveAuction(DOK);
    await saveAuctionsBulk([DOK]);
    await removeAuctionsBulk(["auction-p1"]);
    await removeAuction("auction-p1");
    for (const f of Object.values(pg)) expect(f).not.toHaveBeenCalled();
    expect(fetchAnrop.every((a) => a.includes("FyndplatsAuctions"))).toBe(true);
    // Sju anrop: köns huvud och de levande läses var för sig (köHuvud gäller
    // bara kön, som i Postgres), sedan sålda, en save, en massave och två borttagningar.
    expect(fetchAnrop).toHaveLength(7);
  });

  it("☠️ AUCTIONS_BACKEND=postgres går till Wix sedan flytten tillbaka 2026-10-29, och rör aldrig Postgres", async () => {
    // Vercel låter oss inte ändra AUCTIONS_BACKEND (403). Växeln DRIFTEN_I_WIX
    // gör att postgres betyder Wix, så auktionerna följer resten av drift-datan.
    vi.stubEnv("AUCTIONS_BACKEND", "postgres");
    expect(auktionslager()).toBe("wix-data");
    await queryAuctions(["live", "queued"], { köHuvud: 200 });
    await senastSalda(6);
    await saveAuction(DOK);
    await saveAuctionsBulk([DOK]);
    await removeAuctionsBulk(["auction-p1"]);
    await removeAuction("auction-p1");
    for (const f of Object.values(pg)) expect(f).not.toHaveBeenCalled();
    expect(fetchAnrop.every((a) => a.includes("FyndplatsAuctions"))).toBe(true);
  });
});
