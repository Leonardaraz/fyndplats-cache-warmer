// Batchad lagerläsning: ETT anrop för femtio produkter i stället för femtio.
//
// ☠️ `$in` är MÄTT mot skarpa Wix 2026-09-04, inte läst i dokumentationen: fem
// produkt-id gav fem poster där ett enskilt id gav en. Huset har redan betalat
// för att lita på dev.wix.com två gånger (`paging.limit`, `MEDIA_ITEMS_INFO`).
//
// Testerna låser tre saker som alla har kostat pengar i det här repot när de
// gått sönder tyst:
//
//   1. ETT id skickas som skalär, inte som `$in` med ett element. Tre anropare
//      läser en produkt i taget och deras beteende får inte ändras av att
//      vägen byggs om.
//   2. Läsningen PAGINERAR och returnerar aldrig en halv lista utan att säga
//      till — samma hållning som `queryAll` och `listV3ProductPrices`.
//   3. Återförsök. Den gamla enproduktsläsningen hade inget, och det gick an:
//      ett fall kostade EN produkt. En batchad läsning som faller kostar
//      femtio, och de femtio ser för synken ut som "inga lagerposter".

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function svar(status: number, kropp: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (h: string) => headers[h.toLowerCase()] ?? null },
    text: async () => (typeof kropp === "string" ? kropp : JSON.stringify(kropp)),
    json: async () => kropp,
  } as unknown as Response;
}

function post(id: string, productId: string) {
  return { id, revision: "1", variantId: `v-${id}`, productId };
}

type Klient = typeof import("./client");
let klient: Klient;

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  process.env.WIX_API_TOKEN = "test";
  process.env.WIX_SITE_ID = "site";
  klient = await import("./client");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function medTimers<T>(p: Promise<T>): Promise<T> {
  const klar = p.catch((e) => e as T);
  await vi.runAllTimersAsync();
  const r = await klar;
  if (r instanceof Error) throw r;
  return r;
}

/** Filtret som skickades i anrop nummer `n` (0-indexerat). */
function filter(fetchMock: ReturnType<typeof vi.fn>, n = 0): unknown {
  const body = JSON.parse((fetchMock.mock.calls[n][1] as { body: string }).body);
  return body.query.filter;
}

describe("queryInventoryItemsByProductIds", () => {
  it("☠️ ETT id skickas som skalär productId — inte som $in med ett element", async () => {
    const fetchMock = vi.fn().mockResolvedValue(svar(200, { inventoryItems: [post("i1", "p1")] }));
    vi.stubGlobal("fetch", fetchMock);

    await medTimers(klient.queryInventoryItemsByProductIds(["p1"]));

    expect(filter(fetchMock)).toEqual({ productId: "p1" });
  });

  it("flera id skickas som $in", async () => {
    const fetchMock = vi.fn().mockResolvedValue(svar(200, {
      inventoryItems: [post("i1", "p1"), post("i2", "p2")],
    }));
    vi.stubGlobal("fetch", fetchMock);

    const poster = await medTimers(klient.queryInventoryItemsByProductIds(["p1", "p2"]));

    expect(filter(fetchMock)).toEqual({ productId: { $in: ["p1", "p2"] } });
    expect(poster.map((p) => p.id)).toEqual(["i1", "i2"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("dubbletter i inlistan skickas en gång", async () => {
    const fetchMock = vi.fn().mockResolvedValue(svar(200, { inventoryItems: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await medTimers(klient.queryInventoryItemsByProductIds(["p1", "p1", "p2", ""]));

    expect(filter(fetchMock)).toEqual({ productId: { $in: ["p1", "p2"] } });
  });

  it("tom lista gör inget anrop alls", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await klient.queryInventoryItemsByProductIds([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("☠️ pagineringen följs — en andra sida hämtas med markören", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(svar(200, {
        inventoryItems: [post("i1", "p1")],
        pagingMetadata: { cursors: { next: "MARKÖR" }, hasNext: true },
      }))
      .mockResolvedValueOnce(svar(200, {
        inventoryItems: [post("i2", "p2")],
        pagingMetadata: { hasNext: false },
      }));
    vi.stubGlobal("fetch", fetchMock);

    const poster = await medTimers(klient.queryInventoryItemsByProductIds(["p1", "p2"]));

    expect(poster.map((p) => p.id)).toEqual(["i1", "i2"]);
    const andra = JSON.parse((fetchMock.mock.calls[1][1] as { body: string }).body);
    expect(andra.query.cursorPaging.cursor).toBe("MARKÖR");
  });

  it("☠️ KASTAR vid sidtaket i stället för att returnera en halv lista", async () => {
    // Wix svarar i all evighet att det finns mer. En halv lista som ser
    // komplett ut hade fått synken att skriva mappningen för produkter vars
    // lagerposter aldrig lästes.
    const fetchMock = vi.fn().mockResolvedValue(svar(200, {
      inventoryItems: [post("i1", "p1")],
      pagingMetadata: { cursors: { next: "MER" }, hasNext: true },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(medTimers(klient.queryInventoryItemsByProductIds(["p1"])))
      .rejects.toThrow(/sidtaket/);
  });

  it("☠️ en 429 görs om — en batchad läsning som faller kostar femtio produkter", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(svar(429, "<!DOCTYPE html><html>rate limited</html>"))
      .mockResolvedValueOnce(svar(200, { inventoryItems: [post("i1", "p1")] }));
    vi.stubGlobal("fetch", fetchMock);

    const poster = await medTimers(klient.queryInventoryItemsByProductIds(["p1", "p2"]));

    expect(poster).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("en 400 görs INTE om — den blir inte bättre av att frågas igen", async () => {
    const fetchMock = vi.fn().mockResolvedValue(svar(400, { message: "INVALID_ARGUMENT" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(medTimers(klient.queryInventoryItemsByProductIds(["p1"])))
      .rejects.toThrow(/400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("queryInventoryItemsByProductId är uttryckt i den batchade vägen, inte en tvilling", async () => {
    const fetchMock = vi.fn().mockResolvedValue(svar(200, { inventoryItems: [post("i1", "p1")] }));
    vi.stubGlobal("fetch", fetchMock);

    const poster = await medTimers(klient.queryInventoryItemsByProductId("p1"));

    expect(poster.map((p) => p.id)).toEqual(["i1"]);
    expect(filter(fetchMock)).toEqual({ productId: "p1" });
  });
});
