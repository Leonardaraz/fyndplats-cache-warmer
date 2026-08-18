import { describe, expect, it } from "vitest";
import { isRateLimitError, rateLimitWaitMs, RATE_LIMIT_MAX_RETRIES } from "./rate-limit";

// Det riktiga svaret ur auditen 2026-08-17 23:00 (order 10019, badrumsfläkten).
const SKARPT = {
  type: "ISV",
  code: "ApiCallLimit",
  msg: "Api access frequency exceeds the limit. this ban will last 1 seconds",
  request_id: "212a73a517870076598066532",
};

describe("isRateLimitError", () => {
  it("känner igen den skarpa frekvensspärren", () => {
    expect(isRateLimitError(SKARPT)).toBe(true);
  });

  it("retryar ALDRIG på affärs- eller parameterfel", () => {
    // De här stod för alla spårningsfel i juli. En retry hade bara fördröjt
    // ett fel som ändå kommer — och för order.create dessutom riskerat en
    // dubbelorder om koden vore fel.
    expect(isRateLimitError({ type: "ISV", code: "MissingParameter", msg: "…ae_order_id…" })).toBe(false);
    expect(isRateLimitError({ code: "IllegalAccessToken" })).toBe(false);
    expect(isRateLimitError({ code: 15 })).toBe(false);
  });

  it("tål trasig eller saknad form utan att kasta", () => {
    for (const x of [undefined, null, "", 0, "ApiCallLimit", [], {}]) {
      expect(isRateLimitError(x)).toBe(false);
    }
  });
});

describe("rateLimitWaitMs", () => {
  it("läser spärrens längd ur AE:s egen text och lägger på marginal", () => {
    expect(rateLimitWaitMs(SKARPT.msg)).toBe(1250);
    expect(rateLimitWaitMs("this ban will last 3 seconds")).toBe(3250);
  });

  it("faller tillbaka på standardvärdet när längden saknas", () => {
    expect(rateLimitWaitMs("Api access frequency exceeds the limit.")).toBe(1200);
    expect(rateLimitWaitMs(undefined)).toBe(1200);
  });

  it("väntar aldrig längre än taket — cron-körningen har en maxDuration", () => {
    expect(rateLimitWaitMs("this ban will last 600 seconds")).toBe(5000);
  });

  it("orimliga värden ger standardvärdet, aldrig 0 eller negativt", () => {
    expect(rateLimitWaitMs("this ban will last 0 seconds")).toBe(1200);
    expect(rateLimitWaitMs("this ban will last -5 seconds")).toBe(1200);
  });

  it("antalet omförsök är bundet", () => {
    expect(RATE_LIMIT_MAX_RETRIES).toBeGreaterThan(0);
    expect(RATE_LIMIT_MAX_RETRIES).toBeLessThanOrEqual(3);
  });
});

// --- Integration: att callApi faktiskt gör om anropet -----------------------
//
// Enhetstesten ovan låser besluten; det här beviset gäller själva loopen —
// utan den räckte en 1-sekundersspärr för att kosta en hel pollcykel.

import { afterEach, beforeEach, vi } from "vitest";
import { getTracking } from "./client";

const STRYPT = {
  error_response: {
    type: "ISV",
    code: "ApiCallLimit",
    msg: "Api access frequency exceeds the limit. this ban will last 1 seconds",
  },
};
const SVAR = {
  aliexpress_ds_order_tracking_get_response: {
    rsp_code: "200",
    result: {
      logistics_order_list: [{ tracking_number: "SE123456789SE", logistics_company: "PostNord" }],
      order_status: "SHIPPED",
    },
  },
};

function svara(...bodies: unknown[]) {
  const f = vi.fn();
  for (const b of bodies) f.mockResolvedValueOnce({ ok: true, json: async () => b });
  return f;
}

describe("callApi retryar strypta anrop", () => {
  beforeEach(() => {
    vi.stubEnv("ALIEXPRESS_APP_KEY", "k");
    vi.stubEnv("ALIEXPRESS_APP_SECRET", "s");
    vi.stubEnv("ALIEXPRESS_ACCESS_TOKEN", "t");
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("en strypning följs av ett lyckat omförsök — anroparen märker ingenting", async () => {
    const fetchMock = svara(STRYPT, SVAR);
    vi.stubGlobal("fetch", fetchMock);

    const p = getTracking("3075388484793058");
    await vi.runAllTimersAsync();
    const r = await p;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(r.trackingNumber).toBe("SE123456789SE");
  });

  it("ger upp efter taket i stället för att snurra", async () => {
    const fetchMock = svara(STRYPT, STRYPT, STRYPT);
    vi.stubGlobal("fetch", fetchMock);

    const p = getTracking("3075388484793058");
    const väntad = expect(p).rejects.toThrow(/ApiCallLimit/);
    await vi.runAllTimersAsync();
    await väntad;

    expect(fetchMock).toHaveBeenCalledTimes(RATE_LIMIT_MAX_RETRIES + 1);
  });

  it("parameterfel görs ALDRIG om", async () => {
    const fetchMock = svara({
      error_response: { type: "ISV", code: "MissingParameter", msg: "…ae_order_id…" },
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(getTracking("3075388484793058")).rejects.toThrow(/MissingParameter/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
