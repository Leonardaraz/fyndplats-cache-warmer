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
  it("☠️ osatt AUCTIONS_BACKEND går till Wix, även med STORE_BACKEND=postgres", async () => {
    vi.stubEnv("STORE_BACKEND", "postgres");
    vi.stubEnv("AUCTIONS_BACKEND", "");
    expect(auktionslager()).toBe("wix-data");
    await queryAuctions(["live", "queued"], { köHuvud: 200 });
    await senastSalda(6);
    await saveAuction(DOK);
    await saveAuctionsBulk([DOK]);
    await removeAuctionsBulk(["auction-p1"]);
    await removeAuction("auction-p1");
    for (const f of Object.values(pg)) expect(f).not.toHaveBeenCalled();
    expect(fetchAnrop.every((a) => a.includes("FyndplatsAuctions"))).toBe(true);
    expect(fetchAnrop).toHaveLength(6);
  });

  it("AUCTIONS_BACKEND=postgres går till Postgres och rör aldrig Wix Data", async () => {
    vi.stubEnv("AUCTIONS_BACKEND", "postgres");
    expect(auktionslager()).toBe("postgres");
    await queryAuctions(["live", "queued"], { köHuvud: 200 });
    await queryAuctions(["sold", "expired"]);
    await senastSalda(6);
    await saveAuction(DOK);
    await saveAuctionsBulk([DOK]);
    await removeAuctionsBulk(["auction-p1"]);
    await removeAuction("auction-p1");
    expect(pg.pgQueryAuctions.mock.calls).toEqual([[["live", "queued"], 200], [["sold", "expired"], undefined]]);
    expect(pg.pgSenastSalda).toHaveBeenCalledWith(6);
    expect(pg.pgSaveAuction).toHaveBeenCalledWith(DOK);
    expect(pg.pgSaveAuctionsBulk).toHaveBeenCalledWith([DOK]);
    expect(pg.pgRemoveAuctionsBulk).toHaveBeenCalledWith(["auction-p1"]);
    expect(pg.pgRemoveAuction).toHaveBeenCalledWith("auction-p1");
    expect(fetchAnrop).toEqual([]);
  });
});
