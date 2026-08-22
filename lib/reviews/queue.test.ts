import { describe, expect, it, vi } from "vitest";
import { queueReviewsForProduct, isAwaitingTranslation, isCustomerReview, groupAwaitingTranslation } from "./queue";
import type { StoredReview } from "../store/reviews";
import type { AERReview } from "../import/review-import";

function rad(över: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "1",
    rating: 5,
    textOriginal: "Great product, works perfectly and arrived quickly.",
    textSwedish: "",
    initials: "A.B.",
    hasImage: false,
    status: "pending",
    ...över,
  };
}

/** Minimal butik i minnet — samma yta som queue.ts använder. */
function fakeStore() {
  const data = new Map<string, StoredReview>();
  return {
    data,
    async exists(productId: string, reviewIdAE: string) {
      return data.has(`${productId}__${reviewIdAE}`);
    },
    async upsert(r: StoredReview) {
      data.set(`${r.productId}__${r.reviewIdAE}`, r);
    },
  } as unknown as ReturnType<typeof import("../store/reviews").getReviewStore>;
}

function ae(över: Partial<AERReview> = {}): AERReview {
  return {
    reviewIdAE: "a1",
    rating: 5,
    text: "Excellent quality, assembled in twenty minutes and feels very sturdy.",
    customerName: "M***z",
    customerCountry: "ES",
    date: "2026-05-01T00:00:00.000Z",
    ...över,
  } as AERReview;
}

describe("queueReviewsForProduct", () => {
  it("köar nya recensioner som pending med TOM svensk text", async () => {
    const store = fakeStore();
    const r = await queueReviewsForProduct("p1", [ae()], { store });
    expect(r.queued).toBe(1);
    const sparad = [...(store as never as { data: Map<string, StoredReview> }).data.values()][0];
    expect(sparad.status).toBe("pending");
    expect(sparad.textSwedish).toBe("");
    expect(sparad.textOriginal).toContain("Excellent quality");
    // Initialer härleds direkt — namnet ska aldrig visas.
    expect(sparad.initials).toMatch(/^[A-ZÅÄÖ]\.[A-ZÅÄÖ]\.$/);
  });

  it("hoppar över sådant som redan finns, oavsett status", async () => {
    const store = fakeStore();
    await store.upsert(rad({ reviewIdAE: "a1", status: "approved", textSwedish: "Redan översatt." }));
    const r = await queueReviewsForProduct("p1", [ae({ reviewIdAE: "a1" })], { store });
    expect(r.queued).toBe(0);
    expect(r.skippedExisting).toBe(1);
  });

  // Utländsk marknad hör inte hemma på en svensk sida — sortera bort i kön,
  // inte i chatten, annars blir det arbete att kasta bort senare.
  it("sorterar bort omdömen om en annan marknad", async () => {
    const store = fakeStore();
    const r = await queueReviewsForProduct(
      "p1",
      [ae({ reviewIdAE: "a2", text: "Levererades snabbt till Polen, mycket bra kvalitet på produkten." })],
      { store },
    );
    expect(r.queued).toBe(0);
    expect(r.filtered).toBeGreaterThan(0);
  });

  it("kastar aldrig — en trasig butik får inte fälla importen", async () => {
    const trasig = {
      async exists() {
        throw new Error("Wix nere");
      },
      async upsert() {},
    } as unknown as ReturnType<typeof import("../store/reviews").getReviewStore>;
    const r = await queueReviewsForProduct("p1", [ae()], { store: trasig });
    expect(r).toEqual({ queued: 0, skippedExisting: 0, filtered: 0 });
  });

  it("tom indata ger tomt svar utan anrop", async () => {
    expect(await queueReviewsForProduct("p1", [])).toEqual({ queued: 0, skippedExisting: 0, filtered: 0 });
    expect(await queueReviewsForProduct("", [ae()])).toEqual({ queued: 0, skippedExisting: 0, filtered: 0 });
  });
});

describe("isAwaitingTranslation", () => {
  it("bara pending UTAN svensk text väntar", () => {
    expect(isAwaitingTranslation(rad())).toBe(true);
    expect(isAwaitingTranslation(rad({ textSwedish: "Klar." }))).toBe(false);
    expect(isAwaitingTranslation(rad({ status: "approved" }))).toBe(false);
    // Blanksteg räknas inte som översättning.
    expect(isAwaitingTranslation(rad({ textSwedish: "   " }))).toBe(true);
  });

  // De två skrivvägarna valde olika form, och båda är rimliga: kön lämnar
  // textSwedish tom, importen skriver in KÄLLTEXTEN så /admin/reviews har
  // något att visa i redigeringsrutan. Fram till 2026-08-19 kände den här
  // funktionen bara igen kö-formen — det spelade ingen roll så länge importen
  // översatte via DeepL, men utan DeepL blev varje importerad rad oöversatt
  // OCH osynlig för kön: exakt de rader den finns till för att hitta.
  it("känner igen importens form: svensk text = originaltexten", () => {
    const engelska = "Great product, works exactly as described.";
    expect(
      isAwaitingTranslation(rad({ textOriginal: engelska, textSwedish: engelska })),
    ).toBe(true);
    // Omskriven → inte längre i kön.
    expect(
      isAwaitingTranslation(rad({ textOriginal: engelska, textSwedish: "Toppenprodukt." })),
    ).toBe(false);
  });

  it("bryr sig inte om omgivande blanksteg vid jämförelsen", () => {
    expect(isAwaitingTranslation(rad({ textOriginal: "Nice.", textSwedish: " Nice. " }))).toBe(true);
  });
});

describe("groupAwaitingTranslation", () => {
  it("grupperar per produkt så översättningen ser rätt vara", () => {
    const g = groupAwaitingTranslation([
      rad({ productId: "p1", reviewIdAE: "1" }),
      rad({ productId: "p1", reviewIdAE: "2" }),
      rad({ productId: "p2", reviewIdAE: "3" }),
      rad({ productId: "p2", reviewIdAE: "4", status: "approved", textSwedish: "Klar." }),
    ]);
    expect(g.get("p1")).toHaveLength(2);
    expect(g.get("p2")).toHaveLength(1);
  });

  it("tar inte med redan översatta", () => {
    const g = groupAwaitingTranslation([rad({ textSwedish: "Klar.", status: "approved" })]);
    expect(g.size).toBe(0);
  });
});

describe("fetchAndQueueForImport", () => {
  it("ger upp inom tidsgränsen i stället för att hålla upp importen", async () => {
    const { fetchAndQueueForImport } = await import("./queue");
    // Modulen laddas dynamiskt inuti funktionen; vi mockar hämtningen så att
    // den aldrig svarar och kontrollerar att vi ändå släpper igenom snabbt.
    vi.doMock("../aliexpress/reviews", () => ({
      fetchAeReviews: () => new Promise(() => {}),
    }));
    vi.resetModules();
    const { fetchAndQueueForImport: fn } = await import("./queue");
    const start = Date.now();
    const r = await fn("p1", "123", { timeoutMs: 60 });
    expect(r.timedOut).toBe(true);
    expect(r.queued).toBe(0);
    expect(Date.now() - start).toBeLessThan(1500);
    vi.doUnmock("../aliexpress/reviews");
    vi.resetModules();
    expect(typeof fetchAndQueueForImport).toBe("function");
  });

  it("utan produkt-id eller leverantörs-id görs ingenting", async () => {
    const { fetchAndQueueForImport } = await import("./queue");
    expect(await fetchAndQueueForImport("", "123")).toEqual({ queued: 0, skippedExisting: 0, filtered: 0, timedOut: false });
    expect(await fetchAndQueueForImport("p1", "")).toEqual({ queued: 0, skippedExisting: 0, filtered: 0, timedOut: false });
  });
});

describe("queueReviewsForProduct — minLength (återsvep efter rättat filter)", () => {
  const långText =
    "Levererades inom en vecka och emballaget var helt oskadat. Monteringen tog " +
    "ungefär tjugo minuter helt själv, alla skruvar låg märkta i separata påsar " +
    "och instruktionen hade tydliga bilder utan text. Materialet känns rejält, " +
    "ytan repades inte när jag drog den över golvet, och den står stadigt även " +
    "på mattan. Färgen stämmer med bilderna, aningen mörkare i dagsljus.";

  it("släpper bara igenom det gamla 300-teckenstaket kastade", async () => {
    const store = fakeStore();
    const r = await queueReviewsForProduct(
      "p1",
      [
        ae({ reviewIdAE: "kort", text: "Bra kvalitet, snabb leverans och stabil konstruktion rakt igenom." }),
        ae({ reviewIdAE: "lang", text: långText }),
      ],
      { store, minLength: 301 },
    );

    expect(r.queued).toBe(1);
    const sparat = (store as never as { data: Map<string, StoredReview> }).data;
    expect(sparat.has("p1__lang")).toBe(true);
    expect(sparat.has("p1__kort")).toBe(false);
  });

  it("utan minLength köas båda som vanligt", async () => {
    const store = fakeStore();
    const r = await queueReviewsForProduct(
      "p1",
      [
        ae({ reviewIdAE: "kort", text: "Bra kvalitet, snabb leverans och stabil konstruktion rakt igenom." }),
        ae({ reviewIdAE: "lang", text: långText }),
      ],
      { store },
    );

    expect(r.queued).toBe(2);
  });
});

describe("queueReviewsForProduct — torrläge räknar men skriver inte", () => {
  // Rutten hoppade tidigare över hela köanropet i torrläge, så `köade` var
  // strukturellt alltid 0. En torrkörning kunde alltså aldrig svara på den
  // enda fråga man ställer den — hur mycket skulle svepet lägga i kön? — och
  // rapporterade "0 köade" på 40 produkter som om ingenting fanns att hämta.
  it("räknar det som SKULLE köas utan att spara", async () => {
    const store = fakeStore();
    const r = await queueReviewsForProduct(
      "p1",
      [ae({ reviewIdAE: "a1" }), ae({ reviewIdAE: "a2", text: "Mycket bra kvalitet, snabb leverans och stabil konstruktion." })],
      { store, dryRun: true },
    );

    expect(r.queued).toBe(2);
    expect((store as never as { data: Map<string, StoredReview> }).data.size).toBe(0);
  });

  it("räknar inte sådant som redan finns", async () => {
    const store = fakeStore();
    await store.upsert(rad({ reviewIdAE: "a1", status: "approved" }));
    const r = await queueReviewsForProduct("p1", [ae({ reviewIdAE: "a1" })], { store, dryRun: true });

    expect(r.queued).toBe(0);
    expect(r.skippedExisting).toBe(1);
  });
});

// ── Kundomdömen ska ALDRIG in i översättningskön ──────────────────────────
// Butikens egna kunder skriver på svenska. Raden sparas med
// textSwedish === textOriginal — inte för att den väntar på översättning, utan
// för att den aldrig ska översättas. Utan undantaget returnerade
// isAwaitingTranslation alltid true för dem, och kundens välskrivna svenska
// mening flaggades "⚠️ Oöversatt" med knappen "Godkänn ändå".
describe("isAwaitingTranslation — förstahandsdata", () => {
  const bas = {
    productId: "p1",
    reviewIdAE: "kund-10019-p1",
    rating: 5,
    initials: "S.T.",
    hasImage: false,
    status: "pending" as const,
  };

  it("kundomdöme väntar ALDRIG på översättning", () => {
    expect(
      isAwaitingTranslation({
        ...bas,
        source: "customer",
        textOriginal: "Kanonbra kvalitet, kom på tre dagar.",
        textSwedish: "Kanonbra kvalitet, kom på tre dagar.",
      } as never),
    ).toBe(false);
  });

  // MOTVIKTEN: undantaget får inte tömma kön på det den finns till för.
  it("importerad rad med samma text väntar fortfarande", () => {
    expect(
      isAwaitingTranslation({
        ...bas,
        textOriginal: "Very good quality, arrived in three days.",
        textSwedish: "Very good quality, arrived in three days.",
      } as never),
    ).toBe(true);
  });

  it("okänt source-värde behandlas som importerat", () => {
    expect(
      isAwaitingTranslation({
        ...bas,
        source: "aliexpress",
        textOriginal: "Same text",
        textSwedish: "Same text",
      } as never),
    ).toBe(true);
  });

  it("ett godkänt kundomdöme ligger inte heller i kön", () => {
    expect(
      isAwaitingTranslation({
        ...bas,
        status: "approved",
        source: "customer",
        textOriginal: "Bra",
        textSwedish: "Bra",
      } as never),
    ).toBe(false);
  });
});

describe("isCustomerReview", () => {
  it("bara exakt 'customer' räknas", () => {
    expect(isCustomerReview({ source: "customer" })).toBe(true);
    expect(isCustomerReview({ source: "Customer" })).toBe(false);
    expect(isCustomerReview({ source: undefined })).toBe(false);
    expect(isCustomerReview({})).toBe(false);
  });
});
