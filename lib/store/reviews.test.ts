import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StoredReview } from "./reviews";

// Bakgrund (2026-08-18): kön skriver med flit leverantörens råa bildadress och
// skjuter upp hemflytten till publiceringen — rader som aldrig godkänns ska inte
// kosta medialagring. Men hemflytten fanns bara i backfill-vägen
// (lib/import/review-import.ts), aldrig i den väg som faktiskt publicerar. 44
// publicerade recensioner låg därför kvar med `aliexpress-media.com` i
// produktsidans HTML.

vi.mock("../wix/media-import", async () => {
  const faktisk = await vi.importActual<typeof import("../wix/media-import")>("../wix/media-import");
  return { ...faktisk, ownImageUrlForReview: vi.fn() };
});

import { ownImageUrlForReview } from "../wix/media-import";
import { ReviewStore } from "./reviews";

const LEVERANTOR = "https://ae-pic-a1.aliexpress-media.com/kf/A123.jpg";
const EGEN = "https://static.wixstatic.com/media/abc~mv2.jpg";

function rad(patch: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "great",
    textSwedish: "toppen",
    initials: "A.B.",
    hasImage: true,
    imageUrl: LEVERANTOR,
    status: "approved",
    ...patch,
  };
}

/** Plockar ut den `data` som skickades till Wix i senaste anropet. */
function sparadData(spion: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const body = JSON.parse(spion.mock.calls[0][1].body as string);
  return body.dataItem.data as Record<string, unknown>;
}

let fetchSpion: ReturnType<typeof vi.fn>;
const gamlaEnv = { ...process.env };

beforeEach(() => {
  process.env.WIX_API_TOKEN = "test-token";
  fetchSpion = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" });
  vi.stubGlobal("fetch", fetchSpion);
  vi.mocked(ownImageUrlForReview).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...gamlaEnv };
});

describe("ReviewStore.upsert: kundbilden flyttas hem vid publicering", () => {
  it("byter leverantörsadressen mot vår egen när raden blir synlig", async () => {
    vi.mocked(ownImageUrlForReview).mockResolvedValue(EGEN);

    await new ReviewStore().upsert(rad());

    expect(ownImageUrlForReview).toHaveBeenCalledWith(LEVERANTOR, "r1");
    const data = sparadData(fetchSpion);
    expect(data.imageUrl).toBe(EGEN);
    expect(data.hasImage).toBe(true);
  });

  it("gäller även status 'edited' — den syns också på produktsidan", async () => {
    vi.mocked(ownImageUrlForReview).mockResolvedValue(EGEN);

    await new ReviewStore().upsert(rad({ status: "edited" }));

    expect(sparadData(fetchSpion).imageUrl).toBe(EGEN);
  });

  it("rör INTE en rad som ligger kvar i kön", async () => {
    await new ReviewStore().upsert(rad({ status: "pending", textSwedish: "" }));

    // Kön ska inte kosta medialagring för rader som kanske aldrig godkänns.
    expect(ownImageUrlForReview).not.toHaveBeenCalled();
    expect(sparadData(fetchSpion).imageUrl).toBe(LEVERANTOR);
  });

  it("gör inget extra anrop när adressen redan är vår egen", async () => {
    await new ReviewStore().upsert(rad({ imageUrl: EGEN }));

    expect(ownImageUrlForReview).not.toHaveBeenCalled();
    expect(sparadData(fetchSpion).imageUrl).toBe(EGEN);
  });

  it("behåller källadressen när hemflytten misslyckas, i stället för att radera den", async () => {
    // items/save är en helersättning och JSON.stringify tappar undefined, så ett
    // utelämnat imageUrl hade raderat den enda pekaren till kundbilden — utan
    // väg tillbaka. Ett kort avbrott hos Wix media hade då slängt varje bild som
    // godkändes i det fönstret.
    vi.mocked(ownImageUrlForReview).mockResolvedValue(undefined);

    await new ReviewStore().upsert(rad());

    const data = sparadData(fetchSpion);
    expect(data.imageUrl).toBe(LEVERANTOR);
    expect(data.hasImage).toBe(true);
  });

  it("setStatus — den faktiska publiceringsvägen — flyttar hem bilden", async () => {
    // De 44 gamla raderna publicerades via kö → godkännande → setStatus → get →
    // upsert. Alla andra test kör upsert direkt, så en regression i den
    // kopplingen hade passerat sviten orörd.
    vi.mocked(ownImageUrlForReview).mockResolvedValue(EGEN);
    const lasning = { dataItem: { data: rad({ status: "pending" }) } };
    fetchSpion
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => lasning, text: async () => JSON.stringify(lasning) })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => "" });

    await new ReviewStore().setStatus("p1", "r1", "approved");

    const sparBody = JSON.parse(fetchSpion.mock.calls[1][1].body as string);
    expect(sparBody.dataItem.data.status).toBe("approved");
    expect(sparBody.dataItem.data.imageUrl).toBe(EGEN);
  });

  it("en rad helt utan bild går igenom orörd", async () => {
    await new ReviewStore().upsert(rad({ hasImage: false, imageUrl: undefined }));

    expect(ownImageUrlForReview).not.toHaveBeenCalled();
    expect(sparadData(fetchSpion).hasImage).toBe(false);
  });
});

describe("ReviewStore.upsert: statusfallbacken", () => {
  // Hela poängen med borttagningen av DeepL är att ingenting publiceras utan
  // att en människa skrivit svensk text. Fallbacken var "approved" fram till
  // 2026-08-19 — rimligt när varje rad översattes innan den skrevs, men nu det
  // enda stället där en glömsk anropare kan lägga engelsk text på en svensk
  // produktsida.
  it("saknad status blir pending, inte approved", async () => {
    const utanStatus = { ...rad(), status: undefined } as unknown as StoredReview;

    await new ReviewStore().upsert(utanStatus);

    expect(sparadData(fetchSpion).status).toBe("pending");
    // Och eftersom pending inte är synlig ska ingen bild flyttas hem.
    expect(ownImageUrlForReview).not.toHaveBeenCalled();
  });
});

describe("ReviewStore: listorna läser med markör", () => {
  /** Svar med `n` rader från `start`, och nästa markör om det finns en. */
  function sida(n: number, start: number, nasta?: string) {
    const kropp = {
      // Wix bär alltid radens `_id` (produkt__recension), och det är på den som dubbletter känns igen.
      dataItems: Array.from({ length: n }, (_, i) => ({
        data: { _id: `p1__r${start + i}`, ...rad({ productId: "p1", reviewIdAE: `r${start + i}` }) },
      })),
      pagingMetadata: { cursors: nasta ? { next: nasta } : {} },
    };
    return { ok: true, status: 200, json: async () => kropp, text: async () => JSON.stringify(kropp) };
  }

  function query(call: number) {
    return JSON.parse(fetchSpion.mock.calls[call][1].body as string).query;
  }

  // Kollektionen hade 1932 rader 2026-08-19 och 14 973 när datan flyttade
  // tillbaka till Wix (2026-10-29). Wix tar max 1000 per fråga. Utan markör
  // var listningen tyst kapad: /admin/reviews fick de nyaste och fick aldrig
  // veta att resten fanns — och den sidan är enda vägen från `pending` till
  // publicerad.
  it("följer markören till slutet, nyast först", async () => {
    fetchSpion
      .mockResolvedValueOnce(sida(1000, 0, "c1"))
      .mockResolvedValueOnce(sida(1000, 1000, "c2"))
      .mockResolvedValueOnce(sida(120, 2000));

    const alla = await new ReviewStore().listAll();

    expect(alla).toHaveLength(2120);
    expect(fetchSpion).toHaveBeenCalledTimes(3);
    expect(query(0).sort).toEqual([{ fieldName: "date", order: "DESC" }]);
    expect(query(1)).toEqual({ cursorPaging: { limit: 1000, cursor: "c1" } });
    expect(query(2)).toEqual({ cursorPaging: { limit: 1000, cursor: "c2" } });
  });

  it("en lista upp till 1 000 är EN fråga med limit", async () => {
    fetchSpion.mockResolvedValueOnce(sida(12, 0));

    expect(await new ReviewStore().listByProduct("p1")).toHaveLength(12);
    expect(fetchSpion).toHaveBeenCalledTimes(1);
    expect(query(0).paging).toEqual({ limit: 100 });
    expect(query(0).filter).toEqual({ productId: "p1" });
  });

  it("dedupar rader som dyker upp i två sidor", async () => {
    fetchSpion
      .mockResolvedValueOnce(sida(1000, 0, "c1"))
      .mockResolvedValueOnce(sida(1000, 999)); // r999 igen

    const alla = await new ReviewStore().listAll();

    expect(alla).toHaveLength(1999);
    expect(new Set(alla.map((r) => r.reviewIdAE)).size).toBe(1999);
  });

  it("listByStatus filtrerar hos Wix, inte hos oss", async () => {
    fetchSpion.mockResolvedValueOnce(sida(3, 0));

    await new ReviewStore().listByStatus("pending");

    expect(query(0).filter).toEqual({ status: "pending" });
  });

  it("respekterar taket", async () => {
    fetchSpion.mockResolvedValueOnce(sida(1000, 0, "c1")).mockResolvedValueOnce(sida(1000, 1000));

    const alla = await new ReviewStore().listAll(1500);

    expect(alla).toHaveLength(1500);
  });

  it("☠️ betygen grupperas sida för sida — fler än 1 000 produkter tappas inte", async () => {
    const grupper = (n: number, start: number) => {
      const kropp = { results: Array.from({ length: n }, (_, i) => ({ productId: `p${start + i}`, antal: 2, snitt: 4.55 })) };
      return { ok: true, status: 200, json: async () => kropp, text: async () => JSON.stringify(kropp) };
    };
    fetchSpion.mockResolvedValueOnce(grupper(1000, 0)).mockResolvedValueOnce(grupper(250, 1000));

    const betyg = await new ReviewStore().aggregateByProduct();

    expect(betyg).toHaveLength(1250);
    expect(betyg[0]).toEqual({ productId: "p0", antal: 2, snitt: 4.6 });
    const andra = JSON.parse(fetchSpion.mock.calls[1][1].body as string);
    expect(andra.paging).toEqual({ limit: 1000, offset: 1000 });
  });
});
