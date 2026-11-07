// ☠️ Auktionerna bor i Wix, oavsett vad miljön säger.
//
// Raderna bodde i Postgres 2026-09-30 till 2026-10-29, och Postgres-vägen togs
// bort 2026-11-05. Vercel låter oss inte ändra variablerna (403), så
// STORE_BACKEND står kvar på postgres i produktion. Ingen variabel får kunna
// skicka ticken till ett lager som inte finns: den hade sett "inget att främja".

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

async function allaAnrop() {
  await queryAuctions(["live", "queued"], { köHuvud: 200 });
  await senastSalda(6);
  await saveAuction(DOK);
  await saveAuctionsBulk([DOK]);
  await removeAuctionsBulk(["auction-p1"]);
  await removeAuction("auction-p1");
}

describe("auktionernas lager", () => {
  it.each([
    ["STORE_BACKEND=postgres (produktionens värde)", { STORE_BACKEND: "postgres" }],
    ["AUCTIONS_BACKEND=postgres", { AUCTIONS_BACKEND: "postgres" }],
    ["AUCTIONS_BACKEND=wix-data", { AUCTIONS_BACKEND: "wix-data" }],
    ["inga variabler", {}],
  ])("☠️ %s: allt går till FyndplatsAuctions i Wix", async (_namn, miljo) => {
    for (const [k, v] of Object.entries(miljo)) vi.stubEnv(k, v);
    expect(auktionslager()).toBe("wix-data");
    await allaAnrop();
    expect(fetchAnrop.every((a) => a.includes("FyndplatsAuctions"))).toBe(true);
    // Sju anrop: köns huvud och de levande läses var för sig (köHuvud gäller
    // bara kön), sedan sålda, en save, en massave och två borttagningar.
    expect(fetchAnrop).toHaveLength(7);
  });
});
