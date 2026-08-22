import { describe, expect, it } from "vitest";
import {
  dedupKey,
  deriveInitials,
  ensureReviewId,
  filterAndRankReviews,
  importReviewsForProduct,
  isSpam,
  scoreReview,
  type AERReview,
} from "./review-import";
import type { StoredReview } from "../store/reviews";

const NOW = new Date("2026-06-02T00:00:00Z");

function review(o: Partial<AERReview>): AERReview {
  return {
    reviewIdAE: o.reviewIdAE ?? Math.random().toString(36).slice(2),
    rating: o.rating ?? 5,
    text: o.text ?? "Helt fantastisk produkt som höll vad den lovade och mer därtill.",
    hasImage: o.hasImage,
    imageUrl: o.imageUrl,
    // Utan den här raden nådde aldrig extrabilderna importen, och testerna för
    // flerbildsfallet mätte tyst bara den första.
    imageUrls: o.imageUrls,
    customerName: o.customerName,
    customerCountry: o.customerCountry,
    date: o.date,
    language: o.language,
  };
}

describe("isSpam", () => {
  it("flaggar upprepningsspam (good good very nice nice)", () => {
    expect(isSpam("good good good good very nice nice nice good good nice")).toBe(true);
  });
  it("godkänner riktig text med tillräcklig variation", () => {
    expect(isSpam("Mycket bra kvalitet och snabb leverans, rekommenderas varmt till alla.")).toBe(false);
  });
  it("flaggar text med för få ord", () => {
    expect(isSpam("bra grej")).toBe(true);
  });
});

describe("filterAndRankReviews", () => {
  it("filtrerar bort < 3 stjärnor", () => {
    const out = filterAndRankReviews(
      [review({ rating: 2, reviewIdAE: "a" }), review({ rating: 5, reviewIdAE: "b" })],
      NOW,
    );
    expect(out.map((r) => r.reviewIdAE)).toEqual(["b"]);
  });

  it("filtrerar bort för korta och för långa texter", () => {
    const short = review({ reviewIdAE: "s", text: "kort" });
    const long = review({ reviewIdAE: "l", text: "x".repeat(400) });
    const ok = review({ reviewIdAE: "o", text: "En helt utmärkt produkt med fin passform och bra material." });
    const out = filterAndRankReviews([short, long, ok], NOW);
    expect(out.map((r) => r.reviewIdAE)).toEqual(["o"]);
  });

  it("deduplicerar identisk text (skiftläge/skiljetecken ignoreras)", () => {
    const a = review({ reviewIdAE: "a", text: "Superbra kvalitet, snabb leverans och fint emballage!" });
    const b = review({ reviewIdAE: "b", text: "superbra kvalitet snabb leverans och fint emballage" });
    const out = filterAndRankReviews([a, b], NOW);
    expect(out).toHaveLength(1);
  });

  it("rankar foto > senaste > EU > längd, deterministiskt", () => {
    const photo = review({ reviewIdAE: "photo", hasImage: true, customerCountry: "CN", text: "Bilden visar exakt hur fin produkten är i verkligheten, mycket nöjd." });
    const recent = review({ reviewIdAE: "recent", date: "2026-05-20T00:00:00Z", customerCountry: "CN", text: "Kom snabbt och fungerar precis som den ska, kan varmt rekommendera." });
    const eu = review({ reviewIdAE: "eu", customerCountry: "DE", text: "Levererades inom EU och kvaliteten kändes gedigen hela vägen igenom." });
    const out = filterAndRankReviews([eu, recent, photo], NOW);
    expect(out[0].reviewIdAE).toBe("photo");
    expect(out.map((r) => r.reviewIdAE)).toEqual(["photo", "recent", "eu"]);
  });

  it("kapar till max (default 15)", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      review({ reviewIdAE: `r${i}`, text: `Riktigt bra produkt nummer ${i} med fin kvalitet och snabb frakt.` }),
    );
    expect(filterAndRankReviews(many, NOW)).toHaveLength(15);
    expect(filterAndRankReviews(many, NOW, { max: 10 })).toHaveLength(10);
  });
});

describe("scoreReview", () => {
  it("ger foto högst enskild vikt", () => {
    expect(scoreReview(review({ hasImage: true }), NOW)).toBeGreaterThan(
      scoreReview(review({ hasImage: false, customerCountry: "DE" }), NOW),
    );
  });
});

describe("deriveInitials", () => {
  it("flera namn-tokens → första + sista initial", () => {
    expect(deriveInitials("Maria Karlsson", "x")).toBe("M.K.");
    expect(deriveInitials("anna k", "x")).toBe("A.K.");
  });
  it("maskerat AE-namn (M***a) → första + sista bokstaven", () => {
    expect(deriveInitials("M***a", "x")).toBe("M.A.");
  });
  it("en bokstav (u****6543) → bokstav + deterministisk andra", () => {
    const out = deriveInitials("u****6543", "rev1");
    expect(out).toMatch(/^U\.[A-Z]\.$/);
    expect(deriveInitials("u****6543", "rev1")).toBe(out); // deterministiskt
  });
  it("inget namn → två deterministiska bokstäver ur reviewIdAE", () => {
    const out = deriveInitials(undefined, "rev-abc");
    expect(out).toMatch(/^[A-Z]\.[A-Z]\.$/);
    expect(deriveInitials("", "rev-abc")).toBe(out);
    // Olika reviewIdAE → (oftast) olika initialer, men ALLTID stabilt per id.
    expect(deriveInitials(undefined, "rev-abc")).toBe(out);
  });
  it("visar aldrig hela namnet eller siffror", () => {
    expect(deriveInitials("Maria Karlsson", "x")).not.toContain("aria");
    expect(deriveInitials("u****6543", "x")).not.toMatch(/\d/);
  });
});

describe("ensureReviewId", () => {
  it("behåller befintligt id", () => {
    expect(ensureReviewId(review({ reviewIdAE: "abc" }))).toBe("abc");
  });
  it("härleder stabilt id ur texten när det saknas", () => {
    const r = review({ reviewIdAE: "", text: "Samma text ger samma id varje gång helt deterministiskt." });
    expect(ensureReviewId(r)).toBe(ensureReviewId({ ...r }));
    expect(ensureReviewId(r)).toMatch(/^gen-/);
  });
});

// --- Orchestrering (fakeade beroenden) -------------------------------------


class FakeReviewStore {
  saved: StoredReview[] = [];
  existing = new Set<string>();
  async exists(productId: string, reviewIdAE: string): Promise<boolean> {
    return this.existing.has(`${productId}__${reviewIdAE}`);
  }
  async upsert(r: StoredReview): Promise<void> {
    this.saved.push(r);
  }
}

describe("importReviewsForProduct", () => {
  it("sparar som pending med kalltexten, satter initialer och anonymiserar", async () => {
    const store = new FakeReviewStore();
    const res = await importReviewsForProduct(
      "prod1",
      [
        review({ reviewIdAE: "a", text: "Excellent product, fast shipping and great quality overall here.", customerName: "Maria Karlsson", customerCountry: "DE" }),
        review({ reviewIdAE: "b", text: "Very happy with this purchase, works perfectly and looks premium too." }),
      ],
      { now: NOW, reviewStore: store as never },
    );
    expect(res.imported).toBe(2);
    // KALLTEXTEN sparas som svensk text tills nagon skrivit om den i
    // /admin/reviews. DeepL togs bort 2026-08-19 — allt poleras i chatten.
    expect(store.saved[0].textSwedish).toBe(store.saved[0].textOriginal);
    // Visningsnamn = initialer; landet/namnet LAGRAS men visas aldrig.
    expect(store.saved[0].initials).toBe("M.K.");
    expect(store.saved[0].customerNameRaw).toBe("Maria Karlsson");
    expect(store.saved[0].customerCountry).toBe("DE");
    // ALLTID pending: en ooversatt recension far aldrig na produktsidan.
    expect(store.saved[0].status).toBe("pending");
    expect(store.saved[1].status).toBe("pending");
    expect(store.saved[1].initials).toMatch(/^[A-Z]\.[A-Z]\.$/);
  });

  it("hoppar över redan importerade recensioner (dedup mot store)", async () => {
    const store = new FakeReviewStore();
    store.existing.add("prod1__a");
    const res = await importReviewsForProduct(
      "prod1",
      [review({ reviewIdAE: "a", text: "Bra produkt med fin kvalitet och snabb leverans verkligen toppen." })],
      { now: NOW, reviewStore: store as never },
    );
    expect(res.imported).toBe(0);
    expect(res.skippedExisting).toBe(1);
  });

  it("returnerar tomt utan recensioner som passerar filtret", async () => {
    const res = await importReviewsForProduct("prod1", [review({ rating: 1 })], {
      now: NOW,
      reviewStore: new FakeReviewStore() as never,
    });
    expect(res.imported).toBe(0);
    expect(res.reviews).toHaveLength(0);
  });
});

// ── Bilduppladdningen ─────────────────────────────────────────────────────
// Slingan var HELT otestad fram till 2026-08-22, och det var just den som
// tappade bilder tyst: misslyckades uppladdningen slängdes bilden utan logg,
// raden sparades med hasImage:false, och källadressen bevarades ingenstans —
// alltså omöjlig att både upptäcka och reparera i efterhand.
describe("importReviewsForProduct — kundbilder", () => {
  const medBild = (id: string, urls: string[]) =>
    review({
      reviewIdAE: id,
      text: "Väldigt nöjd med köpet, kvaliteten känns gedigen och leveransen gick fort.",
      hasImage: true,
      imageUrl: urls[0],
      imageUrls: urls,
    });

  const AE = "https://ae-pic-a1.aliexpress-media.com/kf/Aabc.jpg";
  const AE2 = "https://ae-pic-a1.aliexpress-media.com/kf/Adef.jpg";
  const EGEN = "https://static.wixstatic.com/media/egen1~mv2.jpg";
  const EGEN2 = "https://static.wixstatic.com/media/egen2~mv2.jpg";

  it("lyckad uppladdning sparar VÅR adress, inte leverantörens", async () => {
    const store = new FakeReviewStore();
    const res = await importReviewsForProduct("prod1", [medBild("a", [AE])], {
      now: NOW,
      reviewStore: store as never,
      importImage: async () => EGEN,
    });
    expect(res.bildmissar).toBe(0);
    expect(store.saved[0].imageUrl).toBe(EGEN);
    expect(store.saved[0].hasImage).toBe(true);
  });

  // KÄRNAN. Tidigare försvann bilden här och raden blev hasImage:false.
  it("misslyckad uppladdning BEHÅLLER källadressen i stället för att slänga bilden", async () => {
    const store = new FakeReviewStore();
    const res = await importReviewsForProduct("prod1", [medBild("a", [AE])], {
      now: NOW,
      reviewStore: store as never,
      importImage: async () => undefined,
    });
    expect(res.bildmissar).toBe(1);
    // Bilden finns kvar — raden är pending och når aldrig produktsidan så här,
    // och repairImages kan hitta den eftersom adressen är leverantörens.
    expect(store.saved[0].hasImage).toBe(true);
    expect(store.saved[0].imageUrl).toBe(AE);
  });

  it("delvis misslyckad: båda bilderna bevaras, bara missen räknas", async () => {
    const store = new FakeReviewStore();
    const res = await importReviewsForProduct("prod1", [medBild("a", [AE, AE2])], {
      now: NOW,
      reviewStore: store as never,
      importImage: async (kalla: string | undefined) => (kalla === AE ? EGEN : undefined),
    });
    expect(res.bildmissar).toBe(1);
    expect(store.saved[0].imageUrls).toEqual([EGEN, AE2]);
  });

  it("flera bilder får unika filnamn så de inte skriver över varandra", async () => {
    const store = new FakeReviewStore();
    const namn: string[] = [];
    await importReviewsForProduct("prod1", [medBild("a", [AE, AE2])], {
      now: NOW,
      reviewStore: store as never,
      importImage: async (_k: string | undefined, n: string) => {
        namn.push(n);
        return EGEN;
      },
    });
    expect(namn).toEqual(["a", "a-2"]);
  });

  it("recension utan bild rör aldrig uppladdningen", async () => {
    const store = new FakeReviewStore();
    let anrop = 0;
    const res = await importReviewsForProduct(
      "prod1",
      [review({ reviewIdAE: "a", text: "Bra produkt med fin kvalitet och snabb leverans verkligen toppen." })],
      {
        now: NOW,
        reviewStore: store as never,
        importImage: async () => {
          anrop++;
          return EGEN;
        },
      },
    );
    expect(anrop).toBe(0);
    expect(res.bildmissar).toBe(0);
    expect(store.saved[0].hasImage).toBe(false);
  });
});

describe("dedupKey", () => {
  it("normaliserar skiljetecken och whitespace", () => {
    expect(dedupKey("  Hej,   Världen!! ")).toBe("hej världen");
  });
});

// Torktumlaren 2026-08-18: en rysk recension skriven utan blanksteg efter punkt
// klistrades ihop av dedupKey ("отлично.быстрая" → ett ord) och föll på
// isSpam:s fyra-ords-krav. Att skriva tätt efter punkt är inte spam.
describe("dedupKey och isSpam vid text utan blanksteg efter punkt", () => {
  it("skiljetecken separerar ord i stället för att klistra ihop dem", () => {
    expect(dedupKey("Bra produkt.Snabb leverans")).toBe("bra produkt snabb leverans");
  });

  it("en vettig recension utan blanksteg efter punkt klassas inte som spam", () => {
    expect(isSpam("отлично.быстрая доставка.работает.спасибо продавцу.рекомендую")).toBe(false);
    expect(isSpam("Bra kvalitet.Snabb frakt.Fungerar precis som beskrivet")).toBe(false);
  });

  it("riktig upprepningsspam fastnar fortfarande", () => {
    expect(isSpam("bra bra bra bra bra bra")).toBe(true);
    expect(isSpam("nice")).toBe(true);
  });
});

describe("filterAndRankReviews — minLength-överdraget (återsvep)", () => {
  // Bakgrund: längdtaket var 300 tecken fram till 2026-08-19. Allt däröver
  // kastades och finns kvar hos AliExpress. Ett vanligt omsvep hämtar dem
  // INTE hem, av en icke-uppenbar anledning: topp-N-urvalet körs över hela
  // den hämtade mängden INNAN dedupen mot det som redan är sparat, och
  // längdpoängen i scoreReview är maxad redan vid 300 tecken
  // (Math.min(len / 150, 2)). En 1200-teckens recension får alltså exakt
  // samma poäng som en 300-teckens och kan inte tränga undan den.
  // Måste ha nog med UNIKA ord för att passera isSpam — en upprepad fras
  // filtreras bort som spam och testet hade då mätt fel sak.
  const lång = (n: number) =>
    review({
      reviewIdAE: `lång-${n}`,
      text:
        `Recension ${n}: levererades inom en vecka och emballaget var helt oskadat. ` +
        "Monteringen tog ungefär tjugo minuter helt själv, alla skruvar låg märkta " +
        "i separata påsar och instruktionen hade tydliga bilder utan text. Materialet " +
        "känns rejält, ytan repades inte när jag drog den över golvet, och den står " +
        "stadigt även på mattan i vardagsrummet. Färgen stämmer med bilderna här, " +
        "aningen mörkare i dagsljus. Enda anmärkningen är att sladden kunde varit " +
        "längre, annars ingenting att klaga på för priset.",
      date: "2026-01-01T00:00:00.000Z",
    });
  const kort = (n: number) =>
    review({
      reviewIdAE: `kort-${n}`,
      text: `Recension ${n}: bra kvalitet, snabb leverans och stabil konstruktion rakt igenom.`,
      hasImage: true,
      customerCountry: "ES",
      date: "2026-05-01T00:00:00.000Z",
    });

  it("visar problemet: långa recensioner trängs undan utan överdraget", () => {
    const hämtat = [...Array.from({ length: 8 }, (_, i) => kort(i)), lång(1), lång(2)];
    const utan = filterAndRankReviews(hämtat, NOW, { max: 8 });
    expect(utan).toHaveLength(8);
    expect(utan.every((r) => r.reviewIdAE?.startsWith("kort"))).toBe(true);
  });

  it("med minLength=301 kommer bara de långa med", () => {
    const hämtat = [...Array.from({ length: 8 }, (_, i) => kort(i)), lång(1), lång(2)];
    const med = filterAndRankReviews(hämtat, NOW, { max: 8, minLength: 301 });
    expect(med.map((r) => r.reviewIdAE).sort()).toEqual(["lång-1", "lång-2"]);
  });

  it("golvet på 50 tecken går inte att sänka bort", () => {
    const stump = review({ reviewIdAE: "stump", text: "Bra grej, fungerar fint och kom snabbt." });
    expect(filterAndRankReviews([stump], NOW, { minLength: 1 })).toHaveLength(0);
    expect(filterAndRankReviews([stump], NOW, { minLength: 0 })).toHaveLength(0);
  });

  it("ett orimligt högt värde sveper ingenting i stället för allt", () => {
    const hämtat = [lång(1), kort(1)];
    expect(filterAndRankReviews(hämtat, NOW, { minLength: 99999 })).toHaveLength(0);
  });

  it("utan överdrag gäller det vanliga golvet", () => {
    const hämtat = [lång(1), kort(1)];
    expect(filterAndRankReviews(hämtat, NOW)).toHaveLength(2);
  });
});
