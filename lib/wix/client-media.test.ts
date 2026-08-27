import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getProductMedia } from "./client";

const FORRA = { token: process.env.WIX_API_TOKEN, site: process.env.WIX_SITE_ID };

beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
  process.env.WIX_SITE_ID = "s";
});

afterEach(() => {
  if (FORRA.token === undefined) delete process.env.WIX_API_TOKEN;
  else process.env.WIX_API_TOKEN = FORRA.token;
  if (FORRA.site === undefined) delete process.env.WIX_SITE_ID;
  else process.env.WIX_SITE_ID = FORRA.site;
  vi.unstubAllGlobals();
});

function stubba(svar: Response) {
  const urlar: string[] = [];
  vi.stubGlobal("fetch", (async (u: RequestInfo | URL) => {
    urlar.push(String(u));
    return svar;
  }) as unknown as typeof fetch);
  return () => urlar;
}

const produkt = (items: unknown[]) =>
  new Response(
    JSON.stringify({ product: { id: "p1", revision: "7", media: { main: { url: "m" }, itemsInfo: { items } } } }),
    { status: 200 },
  );

describe("getProductMedia", () => {
  it("BEGÄR fields=MEDIA_ITEMS_INFO — utan det svarar V3 med tom items-lista", async () => {
    // Uppmätt 2026-08-27: samma produkt gav 0 bilder utan fältet och 5 med.
    // Två buggar föll ut av det, båda tysta — se kommentaren i client.ts.
    const urlar = stubba(produkt([]));
    await getProductMedia("p1");
    expect(urlar()[0]).toContain("fields=MEDIA_ITEMS_INFO");
  });

  it("läser bilderna ur itemsInfo.items", async () => {
    stubba(produkt([
      { image: { url: "https://static.wixstatic.com/a.jpg", altText: "A", id: "ia" } },
      { url: "https://static.wixstatic.com/b.jpg", id: "ib" },
    ]));
    const snap = await getProductMedia("p1");
    expect(snap?.revision).toBe("7");
    expect(snap?.media.map((m) => m.url)).toEqual([
      "https://static.wixstatic.com/a.jpg",
      "https://static.wixstatic.com/b.jpg",
    ]);
    expect(snap?.media[0].altText).toBe("A");
  });

  it("borttagen produkt ger null, inte ett tomt svar", async () => {
    stubba(new Response("", { status: 404 }));
    await expect(getProductMedia("p1")).resolves.toBeNull();
  });

  it("kastar vid riktigt fel", async () => {
    stubba(new Response("nej", { status: 500 }));
    await expect(getProductMedia("p1")).rejects.toThrow(/500/);
  });
});
