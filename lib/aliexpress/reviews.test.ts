import { describe, expect, it } from "vitest";
import {
  aeReviewUrl,
  fetchAeReviews,
  mapAeResponse,
  mapAeReview,
  parseAeDate,
  type AeRawReview,
} from "./reviews";

// Formen är kopierad ur ett skarpt svar 2026-08-16 (produkt 1005008887835573).
function raw(over: Partial<AeRawReview> = {}): AeRawReview {
  return {
    evaluationIdStr: "60094211285167545",
    buyerFeedback: "Good quality sonicator. I use it to clean flux from circuit boards.",
    buyerTranslationFeedback: "Good quality sonicator. I use it to clean flux from circuit boards.",
    buyerFbType: { sourceLang: "en" },
    buyerEval: 100,
    buyerName: "J***D",
    buyerCountry: "CA",
    anonymous: false,
    aigc: false,
    status: "1",
    evalDate: "04 Dec 2025",
    images: ["https://ae-pic-a1.aliexpress-media.com/kf/A429.png"],
    ...over,
  };
}

describe("mapAeReview", () => {
  it("mappar en skarp recension till vår interna form", () => {
    expect(mapAeReview(raw())).toMatchObject({
      reviewIdAE: "60094211285167545",
      rating: 5,
      language: "en",
      hasImage: true,
      imageUrl: "https://ae-pic-a1.aliexpress-media.com/kf/A429.png",
      customerName: "J***D",
      customerCountry: "CA",
    });
  });

  it("buyerEval 0–100 blir 1–5 stjärnor", () => {
    expect(mapAeReview(raw({ buyerEval: 100 }))?.rating).toBe(5);
    expect(mapAeReview(raw({ buyerEval: 80 }))?.rating).toBe(4);
    expect(mapAeReview(raw({ buyerEval: 60 }))?.rating).toBe(3);
    expect(mapAeReview(raw({ buyerEval: 20 }))?.rating).toBe(1);
    // 0 % får inte bli 0 stjärnor — skalan är 1–5.
    expect(mapAeReview(raw({ buyerEval: 0 }))?.rating).toBe(1);
  });

  // Äkthetsspärr: AE markerar själv AI-genererat innehåll. Att visa det som ett
  // kundomdöme vore att påstå att en människa skrivit det.
  it("AI-genererat innehåll (aigc) publiceras ALDRIG", () => {
    expect(mapAeReview(raw({ aigc: true }))).toBeNull();
  });

  it("opublicerad hos AE (status !== 1) släpps inte igenom", () => {
    expect(mapAeReview(raw({ status: "0" }))).toBeNull();
    expect(mapAeReview(raw({ status: "3" }))).toBeNull();
  });

  it("tom text släpps inte igenom (stjärnor utan omdöme)", () => {
    expect(mapAeReview(raw({ buyerFeedback: "", buyerTranslationFeedback: "" }))).toBeNull();
    expect(mapAeReview(raw({ buyerFeedback: "   ", buyerTranslationFeedback: "" }))).toBeNull();
  });

  it("faller tillbaka på AE:s översättning när originaltexten saknas", () => {
    const m = mapAeReview(raw({ buyerFeedback: "", buyerTranslationFeedback: "Works great, sturdy." }));
    expect(m?.text).toBe("Works great, sturdy.");
  });

  // Utan detta blir varenda anonym recension "A.S." och sidan ser förfalskad ut.
  it("anonyma får inget namn vidare — initialerna hashas ur reviewId", () => {
    expect(mapAeReview(raw({ anonymous: true }))?.customerName).toBeUndefined();
    expect(mapAeReview(raw({ anonymous: false, buyerName: "AliExpress Shopper" }))?.customerName).toBeUndefined();
    expect(mapAeReview(raw({ buyerName: "aliexpress shopper" }))?.customerName).toBeUndefined();
  });

  it("saknad bild ger hasImage false utan imageUrl", () => {
    const m = mapAeReview(raw({ images: [] }));
    expect(m?.hasImage).toBe(false);
    expect(m?.imageUrl).toBeUndefined();
  });

  it("CRLF ur AE normaliseras till \\n", () => {
    const m = mapAeReview(raw({ buyerFeedback: "Rad ett.\r\n\r\nRad två." }));
    expect(m?.text).toBe("Rad ett.\n\nRad två.");
  });
});

describe("parseAeDate", () => {
  it("tolkar AE:s engelska datumform", () => {
    expect(parseAeDate("04 Dec 2025")?.slice(0, 10)).toBe("2025-12-04");
  });
  it("tomt eller oläsbart datum ger undefined i stället för Invalid Date", () => {
    expect(parseAeDate("")).toBeUndefined();
    expect(parseAeDate(undefined)).toBeUndefined();
    expect(parseAeDate("i förrgår")).toBeUndefined();
  });
});

describe("mapAeResponse", () => {
  it("läser lista, total och om fler sidor finns", () => {
    const r = mapAeResponse({
      data: { evaViewList: [raw(), raw({ evaluationIdStr: "2", aigc: true })], totalNum: 122, currentPage: 1, totalPage: 7 },
    });
    expect(r.reviews).toHaveLength(1); // aigc-raden är borta
    expect(r.totalNum).toBe(122);
    expect(r.hasNext).toBe(true);
  });

  it("oväntad svarsform ger tomt i stället för krasch", () => {
    expect(mapAeResponse(null)).toEqual({ reviews: [], totalNum: 0, hasNext: false });
    expect(mapAeResponse({})).toEqual({ reviews: [], totalNum: 0, hasNext: false });
    expect(mapAeResponse({ data: { evaViewList: "inte en array" } }).reviews).toEqual([]);
  });
});

describe("aeReviewUrl", () => {
  it("bygger endpointen med produkt-id och sida", () => {
    const u = new URL(aeReviewUrl("1005008887835573", 2));
    expect(u.searchParams.get("productId")).toBe("1005008887835573");
    expect(u.searchParams.get("page")).toBe("2");
    expect(u.searchParams.get("filter")).toBe("all");
  });
});

function jsonRes(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}
function errRes(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as unknown as Response;
}
const noSleep = async () => {};

describe("fetchAeReviews", () => {
  it("hämtar flera sidor och slår ihop dem", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: string) => {
      calls.push(url);
      const page = new URL(url).searchParams.get("page");
      return jsonRes({
        data: {
          evaViewList: [raw({ evaluationIdStr: `id-${page}` })],
          totalNum: 40,
          currentPage: Number(page),
          totalPage: 2,
        },
      });
    }) as unknown as typeof fetch;

    const r = await fetchAeReviews("123", { fetchImpl, delayMs: 0, sleep: noSleep });
    expect(calls).toHaveLength(2);
    expect(r.reviews.map((x) => x.reviewIdAE)).toEqual(["id-1", "id-2"]);
    expect(r.totalNum).toBe(40);
    expect(r.throttled).toBe(false);
  });

  it("slutar hämta när AE säger att det inte finns fler sidor", async () => {
    let n = 0;
    const fetchImpl = (async () => {
      n++;
      return jsonRes({ data: { evaViewList: [raw()], totalNum: 1, currentPage: 1, totalPage: 1 } });
    }) as unknown as typeof fetch;
    await fetchAeReviews("123", { pages: 5, fetchImpl, delayMs: 0, sleep: noSleep });
    expect(n).toBe(1);
  });

  it("samma recension på två sidor räknas en gång", async () => {
    const fetchImpl = (async () =>
      jsonRes({
        data: { evaViewList: [raw({ evaluationIdStr: "dubbel" })], totalNum: 40, currentPage: 1, totalPage: 2 },
      })) as unknown as typeof fetch;
    const r = await fetchAeReviews("123", { pages: 2, fetchImpl, delayMs: 0, sleep: noSleep });
    expect(r.reviews).toHaveLength(1);
  });

  // Skillnaden mellan "strypt" och "inga recensioner" avgör om produkten ska
  // försökas igen — den får aldrig suddas ut.
  it("503 efter alla omförsök flaggas som throttled, inte som tomt", async () => {
    const fetchImpl = (async () => errRes(503)) as unknown as typeof fetch;
    const r = await fetchAeReviews("123", { fetchImpl, delayMs: 0, retries: 2, sleep: noSleep });
    expect(r.reviews).toEqual([]);
    expect(r.throttled).toBe(true);
    expect(r.requests).toBe(3); // första + 2 omförsök
  });

  it("503 som läker på omförsök ger recensionerna utan throttled-flagga", async () => {
    let n = 0;
    const fetchImpl = (async () => {
      n++;
      if (n === 1) return errRes(503);
      return jsonRes({ data: { evaViewList: [raw()], totalNum: 1, currentPage: 1, totalPage: 1 } });
    }) as unknown as typeof fetch;
    const r = await fetchAeReviews("123", { fetchImpl, delayMs: 0, sleep: noSleep });
    expect(r.reviews).toHaveLength(1);
    expect(r.throttled).toBe(false);
  });

  it("404 försöks inte om igen — produkten finns inte", async () => {
    let n = 0;
    const fetchImpl = (async () => {
      n++;
      return errRes(404);
    }) as unknown as typeof fetch;
    const r = await fetchAeReviews("123", { fetchImpl, delayMs: 0, sleep: noSleep });
    expect(n).toBe(1);
    expect(r.reviews).toEqual([]);
    expect(r.throttled).toBe(false);
  });

  it("kastat nätverksfel fälls inte igenom till anroparen", async () => {
    const fetchImpl = (async () => {
      throw new Error("ECONNRESET");
    }) as unknown as typeof fetch;
    const r = await fetchAeReviews("123", { fetchImpl, delayMs: 0, retries: 1, sleep: noSleep });
    expect(r.reviews).toEqual([]);
    expect(r.throttled).toBe(true);
  });
});
