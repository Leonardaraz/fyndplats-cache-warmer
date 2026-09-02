// Den publika per-produkt-rutten, som butikens produktsida läser sedan
// recensionerna flyttat ur Wix Data.
//
// Två saker testas, och båda kan läcka TYST om de går sönder:
// integritetsswitchen och härkomsten.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StoredReview } from "@/lib/store/reviews";

let rader: StoredReview[] = [];
vi.mock("@/lib/store/reviews", async (orig) => ({
  ...(await orig<typeof import("@/lib/store/reviews")>()),
  getReviewStore: () => ({ listByProduct: async () => rader }),
}));

import { GET } from "./route";

function rec(över: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Great",
    textSwedish: "Bra",
    initials: "M.K.",
    hasImage: false,
    status: "edited",
    ...över,
  } as StoredReview;
}

const anrop = () => GET({} as Request, { params: Promise.resolve({ productId: "p1" }) });
const SPARAT = { ...process.env };

beforeEach(() => {
  rader = [rec()];
  delete process.env.REVIEW_DISPLAY_MODE;
});
afterEach(() => {
  process.env = { ...SPARAT };
});

describe("☠️ integritetsswitchen biter på BÅDA namnfälten", () => {
  it("normalt läge: initialer följer med så butiken kan visa dem", async () => {
    const body = await (await anrop()).json();
    expect(body.reviews[0].initials).toBe("M.K.");
    expect(body.reviews[0].displayName).toBe("M.K.");
  });

  it("☠️ paniklaget redigerar bort initialerna, inte bara visningsnamnet", async () => {
    // Butiken tillämpar sin EGEN REVIEW_DISPLAY_MODE på det den får. Men de två
    // projekten har varsin miljö: en switch satt bara här hade kringgåtts av att
    // butiken läser `initials` i stället för `displayName`. Att redigera bort dem
    // HÄR gör att switchen biter oavsett vilket projekt den sitter i.
    process.env.REVIEW_DISPLAY_MODE = "verified_buyer";
    const body = await (await anrop()).json();
    expect(body.reviews[0].displayName).toBe("Verifierad köpare");
    expect(body.reviews[0].initials).toBe("");
  });

  it("☠️ rånamnet lämnar aldrig lagret", async () => {
    rader = [rec({ customerNameRaw: "Maria Karlsson", customerCountry: "ES" })];
    const serialiserat = JSON.stringify(await (await anrop()).json());
    expect(serialiserat).not.toContain("Maria Karlsson");
    expect(serialiserat).not.toContain("customerNameRaw");
  });
});

describe("☠️ härkomsten följer med — UCPD 7.6 kräver det", () => {
  it("en Aosom-recension bär source så sidan kan säga varifrån den kommer", async () => {
    rader = [rec({ source: "aosom" })];
    const body = await (await anrop()).json();
    expect(body.reviews[0].source).toBe("aosom");
    expect(body.reviews[0].firstParty).toBe(false);
  });

  it("egen kund är firstParty OCH bär source", async () => {
    rader = [rec({ source: "customer" })];
    const body = await (await anrop()).json();
    expect(body.reviews[0].firstParty).toBe(true);
    expect(body.reviews[0].source).toBe("customer");
  });

  it("en gammal AE-import saknar source — och det är inte samma sak som vår kund", async () => {
    // Alla rader före 2026-08-17 saknar fältet. firstParty räcker inte som
    // upplysning: det säger bara "inte vår kund", inte vems.
    const body = await (await anrop()).json();
    expect(body.reviews[0].source).toBeUndefined();
    expect(body.reviews[0].firstParty).toBe(false);
  });
});

describe("bara publikt synliga statusar", () => {
  it("pending och rejected visas aldrig", async () => {
    rader = [rec({ status: "pending" }), rec({ reviewIdAE: "r2", status: "rejected" })];
    const body = await (await anrop()).json();
    expect(body.count).toBe(0);
    expect(body.average).toBeNull();
  });
});
