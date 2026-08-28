import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getProductMedia, setProductMedia } from "./client";

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

function fangaPatch(svar: Record<string, unknown>) {
  const kroppar: Record<string, unknown>[] = [];
  vi.stubGlobal("fetch", (async (_u: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "PATCH") kroppar.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify(svar), { status: 200 });
  }) as unknown as typeof fetch);
  return kroppar;
}

describe("setProductMedia", () => {
  it("☠️ skickar `id`, ALDRIG `url`, för en bild som redan ligger i Media Manager", async () => {
    // V3: `url` i ett media-item betyder "an external media URL", och Wix
    // IMPORTERAR OM adressen till en ny fil. Uppmätt 2026-08-28 var 591 av 595
    // granskade wixstatic-filer sådana kopior — Media Manager hade 58 160 filer
    // där hälften räckt, och lagringen tog slut mitt under en bildfix-körning.
    // Omimporten är dessutom asynkron, vilket är varför produkter kunde få fyra
    // av fem bilder trots fem lyckade uppladdningar.
    const kroppar = fangaPatch({ product: { revision: "2" } });
    await setProductMedia("p1", "1", [
      { id: "fil-1", url: "https://static.wixstatic.com/media/a~mv2.jpg" },
      { id: "fil-2", url: "https://static.wixstatic.com/media/b~mv2.jpg" },
    ]);
    const items = (kroppar[0] as { product: { media: { itemsInfo: { items: Record<string, unknown>[] } } } })
      .product.media.itemsInfo.items;
    expect(items).toEqual([{ id: "fil-1" }, { id: "fil-2" }]);
    expect(JSON.stringify(kroppar[0])).not.toContain("wixstatic");
  });

  it("faller tillbaka på `url` bara när id saknas — då ÄR adressen extern", async () => {
    const kroppar = fangaPatch({ product: { revision: "2" } });
    await setProductMedia("p1", "1", [{ url: "https://img.aosomcdn.com/x.jpg" }]);
    const items = (kroppar[0] as { product: { media: { itemsInfo: { items: Record<string, unknown>[] } } } })
      .product.media.itemsInfo.items;
    expect(items).toEqual([{ url: "https://img.aosomcdn.com/x.jpg" }]);
  });

  it("skickar INTE media.main — den är read-only i V3 och gav en extra omimport", async () => {
    const kroppar = fangaPatch({ product: { revision: "2" } });
    await setProductMedia("p1", "1", [{ id: "fil-1", url: "u" }]);
    const media = (kroppar[0] as { product: { media: Record<string, unknown> } }).product.media;
    expect("main" in media).toBe(false);
  });
});
