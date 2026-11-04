// Prisskrivningens nya försök (Black Week, planens del C2) mot en låtsas-Wix
// som kan strypa: 429 med och utan Retry-After, edge-spärrens HTML-sida, 409 på
// en gammal revision och 5xx. Och det som INTE ska göras om: 404 (produkten är
// raderad), 400, och en väntan som inte ryms före tickens tidsgräns.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isProductGone, patchProductPrice, PRIS_PAUS_MS, restoreListPrice, type Skrivlage } from "./store";
import type { AuctionDoc } from "./engine";

const FORRA = { token: process.env.WIX_API_TOKEN, site: process.env.WIX_SITE_ID };

beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
  process.env.WIX_SITE_ID = "s";
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  for (const [k, v] of [["WIX_API_TOKEN", FORRA.token], ["WIX_SITE_ID", FORRA.site]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type Svar = { status: number; text?: string; retryAfter?: string };
const ID = "00000001-0000-4000-8000-0000000000cc";

/** Låtsas-Wix: varje metod svarar först med sina inskrivna störningar, sedan normalt. */
function lansWix(storningar: { GET?: Svar[]; PATCH?: Svar[] } = {}) {
  let revision = 7;
  let pris = "999";
  const anrop: string[] = [];
  const ko = { GET: [...(storningar.GET ?? [])], PATCH: [...(storningar.PATCH ?? [])] };
  vi.stubGlobal("fetch", (async (_u: RequestInfo | URL, init?: RequestInit) => {
    const metod = (init?.method ?? "GET") as "GET" | "PATCH";
    anrop.push(metod);
    const s = ko[metod].shift();
    if (s) {
      return new Response(s.text ?? `{"message":"${s.status}"}`, {
        status: s.status,
        headers: s.retryAfter ? { "retry-after": s.retryAfter } : {},
      });
    }
    if (metod === "GET") {
      return new Response(
        JSON.stringify({
          product: { id: ID, revision: String(revision), variantsInfo: { variants: [{ id: "v1", price: { actualPrice: { amount: pris } } }] } },
        }),
        { status: 200 },
      );
    }
    const body = JSON.parse(String(init?.body)) as { product: { revision: string; variantsInfo: { variants: { price: { actualPrice: { amount: string } } }[] } } };
    if (body.product.revision !== String(revision)) return new Response('{"message":"revision"}', { status: 409 });
    pris = body.product.variantsInfo.variants[0].price.actualPrice.amount;
    revision++;
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch);
  return { anrop, pris: () => pris };
}

function lage(extra: Partial<Skrivlage> = {}) {
  const vantat: number[] = [];
  const l: Skrivlage & { stat: { wix429: number } } = {
    stat: { wix429: 0 },
    sov: async (ms) => {
      vantat.push(ms);
    },
    nu: () => 1_000_000,
    ...extra,
  };
  return { l, vantat };
}

describe("prisskrivningens nya försök", () => {
  it("☠️ ett 429 på skrivningen görs om med en färsk läsning, och strypningen räknas", async () => {
    const w = lansWix({ PATCH: [{ status: 429 }] });
    const { l, vantat } = lage();
    await patchProductPrice(ID, 799, 999, false, l);
    expect(w.anrop).toEqual(["GET", "PATCH", "GET", "PATCH"]);
    expect(w.pris()).toBe("799");
    expect(vantat).toEqual([PRIS_PAUS_MS[0]]);
    expect(l.stat.wix429).toBe(1);
  });

  it("Retry-After följs, men aldrig längre än 15 sekunder", async () => {
    lansWix({ PATCH: [{ status: 429, retryAfter: "2" }, { status: 429, retryAfter: "120" }] });
    const { l, vantat } = lage();
    await patchProductPrice(ID, 799, 999, false, l);
    expect(vantat).toEqual([2_000, 15_000]);
    expect(l.stat.wix429).toBe(2);
  });

  it("edge-spärrens HTML-sida räknas som en strypning och görs om, vilken status den än har", async () => {
    // En 403 på LÄSNINGEN är kostnadsfältet som nekas (läses om utan det), så
    // statusen prövas på skrivningen.
    const html = "<!DOCTYPE html><html><body>Too many requests</body></html>";
    for (const storning of [{ GET: [{ status: 429, text: html }] }, { PATCH: [{ status: 403, text: html }] }]) {
      const w = lansWix(storning);
      const { l } = lage();
      await patchProductPrice(ID, 799, 999, false, l);
      expect(l.stat.wix429).toBe(1);
      expect(w.pris()).toBe("799");
    }
  });

  it("409 (revisionen hann ändras) och 5xx görs om, men räknas inte som strypning", async () => {
    const w = lansWix({ GET: [{ status: 503 }], PATCH: [{ status: 409 }] });
    const { l, vantat } = lage();
    await patchProductPrice(ID, 799, 999, false, l);
    expect(w.anrop).toEqual(["GET", "GET", "PATCH", "GET", "PATCH"]);
    expect(vantat).toEqual([PRIS_PAUS_MS[0], PRIS_PAUS_MS[1]]);
    expect(l.stat.wix429).toBe(0);
    expect(w.pris()).toBe("799");
  });

  it("efter tre nya försök kastas felet, med trappan 1, 3 och 8 sekunder", async () => {
    const w = lansWix({ PATCH: [{ status: 429 }, { status: 429 }, { status: 429 }, { status: 429 }] });
    const { l, vantat } = lage();
    await expect(patchProductPrice(ID, 799, 999, false, l)).rejects.toThrow(/patch PATCH 429/);
    expect(w.anrop.filter((m) => m === "PATCH")).toHaveLength(4);
    expect(vantat).toEqual([...PRIS_PAUS_MS]);
    expect(l.stat.wix429).toBe(4);
    expect(w.pris()).toBe("999");
  });

  it("☠️ 404 = produkten är raderad: inget nytt försök, och självläkningen känner igen felet", async () => {
    const w = lansWix({ GET: [{ status: 404 }] });
    const { l, vantat } = lage();
    const fel = await patchProductPrice(ID, 799, 999, false, l).catch((e: unknown) => e);
    expect(isProductGone(fel)).toBe(true);
    expect(w.anrop).toEqual(["GET"]);
    expect(vantat).toEqual([]);
  });

  it("400 och 428 görs inte om — frågan är fel ställd, och blir inte rätt av att ställas igen", async () => {
    for (const status of [400, 428]) {
      const w = lansWix({ PATCH: [{ status }] });
      const { l, vantat } = lage();
      await expect(patchProductPrice(ID, 799, 999, false, l)).rejects.toThrow(new RegExp(`patch PATCH ${status}`));
      expect(w.anrop).toEqual(["GET", "PATCH"]);
      expect(vantat).toEqual([]);
    }
  });

  it("☠️ en väntan som skulle passera tickens tidsgräns görs inte — nästa tick tar produkten", async () => {
    const w = lansWix({ PATCH: [{ status: 429 }] });
    const { l, vantat } = lage({ slutMs: 1_000_000 + 500 });
    await expect(patchProductPrice(ID, 799, 999, false, l)).rejects.toThrow(/patch PATCH 429/);
    expect(w.anrop).toEqual(["GET", "PATCH"]);
    expect(vantat).toEqual([]);
    expect(l.stat.wix429).toBe(1);
  });

  it("butikens direktavslut (utan läge) får också nya försök, med riktig väntan", async () => {
    vi.useFakeTimers();
    const w = lansWix({ PATCH: [{ status: 429 }] });
    const a = { productId: ID, listPrice: 999 } as AuctionDoc;
    const klar = restoreListPrice(a);
    await vi.advanceTimersByTimeAsync(PRIS_PAUS_MS[0]);
    await klar;
    expect(w.anrop).toEqual(["GET", "PATCH", "GET", "PATCH"]);
  });
});
