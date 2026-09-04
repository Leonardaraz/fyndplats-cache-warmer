// ☠️ Lagerskrivningen hade inget återförsök alls, och det syntes först i drift.
//
// Uppmätt 2026-09-02: ett skarpt Aosom-svep försökte 2 095 lagerskrivningar i
// rad och fick 1 190 stycken 429 — med en HTML-kropp, alltså Wix EDGE-spärr.
// En kort körning (40 skrivningar) gav noll fel. Skrivvägen sprang helt enkelt
// fortare än Wix tillåter, och gav upp vid första avvisning.
//
// Testerna låser två saker: att ett övergående fel görs om, och att ett
// PERMANENT fel INTE görs om. Det andra är lika viktigt — en 400 blir inte
// bättre av att frågas igen, den bara fördröjer felet tre gånger om.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ☠️ FORMEN ÄR UPPMÄTT MOT SKARPA WIX 2026-09-04, inte påhittad. Fixturen sa
// tidigare bara `{success: true}` — en minimal stubb av något API:t aldrig
// svarar. Den skillnaden var inte kosmetisk: när utfallet började tolkas PER
// RAD (batchningen) blev en rad utan `id` omöjlig att knyta till den post som
// skickades, och regeln "en skickad rad Wix inte nämner räknas som
// misslyckad" fällde de här tre testerna. Regeln var rätt; fixturen ljög.
//
// Riktigt svar, båda utfallen:
//   {"results":[{"itemMetadata":{"id":"…","originalIndex":0,"success":true}}],
//    "bulkActionMetadata":{"totalSuccesses":1,"totalFailures":0,"undetailedFailures":0}}
const OK_KROPP = {
  results: [{ itemMetadata: { id: "inv-1", originalIndex: 0, success: true } }],
  bulkActionMetadata: { totalSuccesses: 1, totalFailures: 0, undetailedFailures: 0 },
};

function svar(status: number, kropp: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (h: string) => headers[h.toLowerCase()] ?? null },
    text: async () => (typeof kropp === "string" ? kropp : JSON.stringify(kropp)),
    json: async () => kropp,
  } as unknown as Response;
}

const UPPDATERING = [{ id: "inv-1", revision: "1", quantity: 5 }];

let bulkUpdateInventoryQuantities: typeof import("./client")["bulkUpdateInventoryQuantities"];

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  process.env.WIX_API_TOKEN = "test";
  process.env.WIX_SITE_ID = "site";
  process.env.SYNC_DRY_RUN = "false";
  ({ bulkUpdateInventoryQuantities } = await import("./client"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Kör ett löfte som väntar på timers till slut. */
async function medTimers<T>(p: Promise<T>): Promise<T> {
  const klar = p.catch((e) => e as T);
  await vi.runAllTimersAsync();
  const r = await klar;
  if (r instanceof Error) throw r;
  return r;
}

describe("☠️ bulkUpdateInventoryQuantities gör om övergående fel", () => {
  it("en 429 följs av ett nytt försök som lyckas", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(svar(429, "<!DOCTYPE html><html>rate limited</html>"))
      .mockResolvedValueOnce(svar(200, OK_KROPP));
    vi.stubGlobal("fetch", fetchMock);

    await medTimers(bulkUpdateInventoryQuantities(UPPDATERING));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ger upp efter sista steget och bär statusen i felet", async () => {
    const fetchMock = vi.fn().mockResolvedValue(svar(429, "<!DOCTYPE html>"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(medTimers(bulkUpdateInventoryQuantities(UPPDATERING))).rejects.toThrow(/429/);
    // Fyra försök: ett direkt plus tre steg i trappan.
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("ett nätverksfel görs också om", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(svar(200, OK_KROPP));
    vi.stubGlobal("fetch", fetchMock);

    await medTimers(bulkUpdateInventoryQuantities(UPPDATERING));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("☠️ ett PERMANENT fel görs INTE om — en 400 blir inte bättre av att upprepas", async () => {
    const fetchMock = vi.fn().mockResolvedValue(svar(400, { message: "ogiltig revision" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(medTimers(bulkUpdateInventoryQuantities(UPPDATERING))).rejects.toThrow(/400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("en lyckad första skrivning gör bara ETT anrop", async () => {
    const fetchMock = vi.fn().mockResolvedValue(svar(200, OK_KROPP));
    vi.stubGlobal("fetch", fetchMock);

    await medTimers(bulkUpdateInventoryQuantities(UPPDATERING));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
