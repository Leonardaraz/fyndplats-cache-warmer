// Egna kundomdömen till butikens flöde mot Google Merchant Center.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReviewStatus, StoredReview } from "@/lib/store/reviews";

let rader: StoredReview[] = [];
let kastar: Error | null = null;

vi.mock("@/lib/store/reviews", async (orig) => {
  const riktig = await orig<typeof import("@/lib/store/reviews")>();
  return {
    ...riktig,
    getReviewStore: () => ({
      listByStatus: async (status: ReviewStatus) => {
        if (kastar) throw kastar;
        return rader.filter((r) => r.status === status);
      },
    }),
  };
});

import { GET } from "./route";

function rad(över: Partial<StoredReview>): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Bra grej, kom snabbt.",
    textSwedish: "Bra grej, kom snabbt.",
    initials: "M.K.",
    hasImage: false,
    status: "approved",
    source: "customer",
    date: "2026-09-20T10:00:00.000Z",
    ...över,
  };
}

beforeEach(() => {
  rader = [];
  kastar = null;
  delete process.env.REVIEW_DISPLAY_MODE;
});
afterEach(() => vi.restoreAllMocks());

describe("egna kundomdömen", () => {
  it("bara source=customer, bara synliga statusar", async () => {
    rader = [
      rad({ reviewIdAE: "egen-godkand" }),
      rad({ reviewIdAE: "egen-redigerad", status: "edited" }),
      rad({ reviewIdAE: "egen-vantar", status: "pending" }),
      rad({ reviewIdAE: "egen-nekad", status: "rejected" }),
      rad({ reviewIdAE: "ae-import", source: undefined }),
      rad({ reviewIdAE: "aosom", source: "aosom" }),
    ];
    const body = await (await GET()).json();
    expect(body.omdomen.map((o: { reviewIdAE: string }) => o.reviewIdAE).sort()).toEqual(["egen-godkand", "egen-redigerad"]);
    expect(body.antal).toBe(2);
  });

  it("☠️ inga rånamn, inget land, inga bilder", async () => {
    rader = [rad({ customerNameRaw: "Maria Karlsson", customerCountry: "SE", imageUrl: "https://x/y.jpg", hasImage: true })];
    const s = JSON.stringify(await (await GET()).json());
    expect(s).not.toContain("Maria");
    expect(s).not.toContain("customerCountry");
    expect(s).not.toContain("imageUrl");
  });

  it("paniklaget redigerar bort initialerna", async () => {
    process.env.REVIEW_DISPLAY_MODE = "verified_buyer";
    rader = [rad({})];
    const body = await (await GET()).json();
    expect(body.omdomen[0].initials).toBe("");
  });

  it("nyast först", async () => {
    rader = [rad({ reviewIdAE: "a", date: "2026-09-01T00:00:00Z" }), rad({ reviewIdAE: "b", date: "2026-09-10T00:00:00Z" })];
    const body = await (await GET()).json();
    expect(body.omdomen.map((o: { reviewIdAE: string }) => o.reviewIdAE)).toEqual(["b", "a"]);
  });

  it("☠️ en läsning som faller är 502, inte en tom lista", async () => {
    kastar = new Error("db nere");
    const res = await GET();
    expect(res.status).toBe(502);
  });
});
