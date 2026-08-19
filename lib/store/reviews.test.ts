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
    fetchSpion
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ dataItem: { data: rad({ status: "pending" }) } }) })
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
