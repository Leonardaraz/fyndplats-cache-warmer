import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitUrls, pingProductSlugs, indexNowConfigured } from "./indexnow";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.INDEXNOW_KEY = "testkey123";
  delete process.env.INDEXNOW_ENABLED;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

describe("indexNowConfigured", () => {
  it("true när nyckel finns och inte avstängd", () => {
    expect(indexNowConfigured()).toBe(true);
  });
  it("false när nyckel saknas", () => {
    delete process.env.INDEXNOW_KEY;
    expect(indexNowConfigured()).toBe(false);
  });
  it("false när explicit avstängd", () => {
    process.env.INDEXNOW_ENABLED = "false";
    expect(indexNowConfigured()).toBe(false);
  });
});

describe("submitUrls", () => {
  it("no-op (utan fetch) när inte konfigurerad", async () => {
    delete process.env.INDEXNOW_KEY;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await submitUrls(["https://www.fyndplats.se/products/a"]);
    expect(res.skipped).toBe("not-configured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("no-op när inga URL:er", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await submitUrls([]);
    expect(res.skipped).toBe("no-urls");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("POSTar rätt payload (host/key/keyLocation/urlList) och deduplicerar", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    const res = await submitUrls([
      "https://www.fyndplats.se/products/a",
      "https://www.fyndplats.se/products/a", // dubblett
      "https://www.fyndplats.se/products/b",
    ]);
    expect(res.ok).toBe(true);
    expect(res.submitted).toBe(2);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.indexnow.org/indexnow");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.host).toBe("www.fyndplats.se");
    expect(body.key).toBe("testkey123");
    expect(body.keyLocation).toBe("https://www.fyndplats.se/testkey123.txt");
    expect(body.urlList).toEqual([
      "https://www.fyndplats.se/products/a",
      "https://www.fyndplats.se/products/b",
    ]);
  });

  it("KASTAR ALDRIG vid fetch-fel — returnerar ok:false", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("nät nere"));
    const res = await submitUrls(["https://www.fyndplats.se/products/a"]);
    expect(res.ok).toBe(false);
    expect(res.error).toContain("nät nere");
  });

  it("kastar inte vid icke-2xx — loggar och fortsätter", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 422 }));
    const res = await submitUrls(["https://www.fyndplats.se/products/a"]);
    expect(res.ok).toBe(true);
    expect(res.status).toBe(422);
  });
});

describe("pingProductSlugs", () => {
  it("bygger produkt-URL:er ur slugs och filtrerar tomma", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    await pingProductSlugs(["slug-a", "", "slug-b"]);
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.urlList).toEqual([
      "https://www.fyndplats.se/products/slug-a",
      "https://www.fyndplats.se/products/slug-b",
    ]);
  });
});
