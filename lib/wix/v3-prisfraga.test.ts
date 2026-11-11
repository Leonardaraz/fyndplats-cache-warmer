// Prisfrågan på utpekade produkter (`listV3ProductPriserFor`).
//
// ☠️ Varför den finns (2026-11-11). Aosom-synken läste HELA butikens prislista
// före varje priskörning: runt 170 sidor sedan VEVOR-importen, och en körning
// på en enda produkt tog 115 sekunder. Priskörningen hann 50–100 produkter av
// 5 051, och en torrkörning visade 5 020 priser som låg fel. Här frågas bara
// efter de produkter som ska granskas.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PRISFRAGA_MAX_ID, listV3ProductPriserFor } from "./v3-products";

const FORRA = process.env.WIX_API_TOKEN;

beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
});

afterEach(() => {
  if (FORRA === undefined) delete process.env.WIX_API_TOKEN;
  else process.env.WIX_API_TOKEN = FORRA;
  vi.unstubAllGlobals();
});

async function medFalskaTimers<T>(f: () => Promise<T>): Promise<T> {
  vi.useFakeTimers();
  try {
    const utfall = f().then(
      (v) => ({ ok: true as const, v }),
      (e: unknown) => ({ ok: false as const, e }),
    );
    await vi.runAllTimersAsync();
    const u = await utfall;
    if (!u.ok) throw u.e;
    return u.v;
  } finally {
    vi.useRealTimers();
  }
}

interface Fraga {
  url: string;
  query: { filter?: { id?: { $in?: string[] } }; cursorPaging?: { limit?: number; cursor?: string } };
}

const produkt = (id: string, min: string, max = min, variantCount = 1) => ({
  id,
  actualPriceRange: { minValue: { amount: min }, maxValue: { amount: max } },
  variantSummary: { variantCount },
});

/** En butik som svarar med de efterfrågade produkterna, utom dem i `saknas`. */
function butik(over: { saknas?: string[]; svar?: (n: number) => Response | null } = {}) {
  const fragor: Fraga[] = [];
  vi.stubGlobal("fetch", (async (url: RequestInfo | URL, init?: RequestInit) => {
    const query = (JSON.parse(String(init?.body)) as { query: Fraga["query"] }).query;
    fragor.push({ url: String(url), query });
    const eget = over.svar?.(fragor.length);
    if (eget) return eget;
    const idn = (query.filter?.id?.$in ?? []).filter((id) => !over.saknas?.includes(id));
    return new Response(JSON.stringify({ products: idn.map((id) => produkt(id, "499")) }), { status: 200 });
  }) as unknown as typeof fetch);
  return fragor;
}

describe("listV3ProductPriserFor", () => {
  it("☠️ frågar bara efter de utpekade produkterna, i EN fråga", async () => {
    const fragor = butik();
    const priser = await listV3ProductPriserFor(["a", "b", "c"]);

    expect(fragor).toHaveLength(1);
    expect(fragor[0].url).toMatch(/\/stores\/v3\/products\/query$/);
    expect(fragor[0].query.filter).toEqual({ id: { $in: ["a", "b", "c"] } });
    expect(fragor[0].query.cursorPaging).toEqual({ limit: PRISFRAGA_MAX_ID });
    expect([...priser.keys()]).toEqual(["a", "b", "c"]);
    expect(priser.get("a")).toEqual({ priceSek: 499, variantCount: 1 });
  });

  it("inga id ger ingen fråga alls", async () => {
    const fragor = butik();
    expect((await listV3ProductPriserFor([])).size).toBe(0);
    expect((await listV3ProductPriserFor(["", ""])).size).toBe(0);
    expect(fragor).toHaveLength(0);
  });

  it("samma id två gånger frågas en gång", async () => {
    const fragor = butik();
    const priser = await listV3ProductPriserFor(["a", "b", "a"]);
    expect(fragor[0].query.filter?.id?.$in).toEqual(["a", "b"]);
    expect(priser.size).toBe(2);
  });

  it(`☠️ fler än ${PRISFRAGA_MAX_ID} id delas: svaret är en sida, och det som inte ryms hade försvunnit tyst`, async () => {
    const idn = Array.from({ length: 2 * PRISFRAGA_MAX_ID + 30 }, (_, i) => `p${i}`);
    const fragor = butik();
    const priser = await medFalskaTimers(() => listV3ProductPriserFor(idn));

    expect(fragor.map((f) => f.query.filter?.id?.$in?.length)).toEqual([PRISFRAGA_MAX_ID, PRISFRAGA_MAX_ID, 30]);
    expect(priser.size).toBe(idn.length);
    // Varje id frågas exakt en gång.
    expect(fragor.flatMap((f) => f.query.filter?.id?.$in ?? [])).toEqual(idn);
  });

  it("en produkt som inte finns i butiken saknas i svaret: anroparen avgör vad det betyder", async () => {
    butik({ saknas: ["b"] });
    const priser = await listV3ProductPriserFor(["a", "b", "c"]);
    expect([...priser.keys()]).toEqual(["a", "c"]);
  });

  it("☠️ ett prisspann (olika varianter har olika pris) blir null, aldrig lägsta priset", async () => {
    butik({
      svar: () =>
        new Response(JSON.stringify({ products: [produkt("a", "499", "799", 3), produkt("b", "1299.00")] }), {
          status: 200,
        }),
    });
    const priser = await listV3ProductPriserFor(["a", "b"]);
    expect(priser.get("a")).toEqual({ priceSek: null, variantCount: 3 });
    expect(priser.get("b")).toEqual({ priceSek: 1299, variantCount: 1 });
  });

  it("☠️ 429 väntas ut och frågan görs om", async () => {
    const fragor = butik({ svar: (n) => (n === 1 ? new Response("Too Many Requests", { status: 429 }) : null) });
    const priser = await medFalskaTimers(() => listV3ProductPriserFor(["a", "b"]));
    expect(fragor).toHaveLength(2);
    expect(priser.size).toBe(2);
  });

  it("☠️ ett fel som inte går över kastas: en tom karta hade sett ut som 'produkterna saknas'", async () => {
    const fragor = butik({ svar: () => new Response('{"message":"nej"}', { status: 400 }) });
    await expect(medFalskaTimers(() => listV3ProductPriserFor(["a", "b"]))).rejects.toThrow(
      /2 utpekade produkter föll.*400/,
    );
    expect(fragor).toHaveLength(1);
  });

  it("ger upp när Wix stryper hela vägen, med felet i texten", async () => {
    const fragor = butik({ svar: () => new Response("Too Many Requests", { status: 429 }) });
    await expect(medFalskaTimers(() => listV3ProductPriserFor(["a"]))).rejects.toThrow(/429/);
    // Ett första försök och ett per paus i prislistans backoff.
    expect(fragor.length).toBeGreaterThan(1);
  });
});
