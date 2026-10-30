import { describe, expect, it, vi } from "vitest";
import {
  dedupKey,
  deriveInitials,
  deriveUniqueInitials,
  ensureReviewId,
  filterAndRankReviews,
  importReviewsForProduct,
  isSpam,
  lasUpptagnaInitialer,
  scoreReview,
  type AERReview,
} from "./review-import";
import type { StoredReview } from "../store/reviews";
import { GILTIGA_PAR, bristerIInitialer, nyckelForInitialer, slumpaUnika } from "../reviews/initialer";

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
  it("en bokstav (u****6543) → bokstav + slumpad andra som inte följer efter den", () => {
    const out = deriveInitials("u****6543", "rev1");
    expect(out).toMatch(/^U\.[A-PR-VÅÖ]\.$/u);
    expect(deriveInitials("u****6543", "rev1")).toBe(out); // deterministiskt
    for (let i = 0; i < 500; i++) expect(deriveInitials("u****6543", `rev${i}`)).not.toBe("U.V.");
  });
  it("inget namn → två slumpade bokstäver ur reviewIdAE", () => {
    const out = deriveInitials(undefined, "rev-abc");
    expect(out).toMatch(/^[A-PR-VÅÖ]\.[A-PR-VÅÖ]\.$/u);
    expect(deriveInitials("", "rev-abc")).toBe(out);
    // Olika reviewIdAE → (oftast) olika initialer, men ALLTID stabilt per id.
    expect(deriveInitials(undefined, "rev-abc")).toBe(out);
  });
  it("visar aldrig hela namnet eller siffror", () => {
    expect(deriveInitials("Maria Karlsson", "x")).not.toContain("aria");
    expect(deriveInitials("u****6543", "x")).not.toMatch(/\d/);
  });

  // ☠️ Felet som Leonard såg 2026-10-30: den andra bokstaven räknades fram som
  // hashLetter(id, 1), som är exakt ett mer än hashLetter(id, 0). Varenda recension
  // utan läsbart namn (alla Aosom-recensioner) fick därför A.B., B.C., … W.X., Z.A.
  // Id:na i testet skiljer sig bara på sista tecknet, som de gör i drift.
  it("inget läsbart namn ger ALDRIG bokstavsordning eller Q/W/X/Y/Z", () => {
    for (let i = 0; i < 5000; i++) {
      for (const namn of [undefined, "", "   ", "****", "12345"]) {
        const out = deriveInitials(namn, `gen-${i.toString(36)}`);
        expect(bristerIInitialer(out), `${JSON.stringify(namn)} ${out}`).toBeNull();
      }
    }
  });
  it("initialer med förbjudna bokstäver ur ett namn slumpas i stället", () => {
    for (const namn of ["Wolfgang Weber", "W***n", "Xavier Zhang", "q****1", "Yvonne Z"]) {
      expect(bristerIInitialer(deriveInitials(namn, "rev1")), namn).toBeNull();
    }
    // Bara den förbjudna bokstaven byts; den andra behålls.
    expect(deriveInitials("Wolfgang Karlsson", "rev1")).toMatch(/^[A-PR-VÅÖ]\.K\.$/u);
  });
  it("ett namn som råkar ge bokstavsordning slumpas om", () => {
    const out = deriveInitials("Klaus Lang", "rev1");
    expect(out).not.toBe("K.L.");
    expect(bristerIInitialer(out)).toBeNull();
  });
  it("vanliga namn rörs inte", () => {
    expect(deriveInitials("Siegfried K.", "rev1")).toBe("S.K.");
    expect(deriveInitials("Leonard Araz", "rev1")).toBe("L.A.");
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
  /** Rader som redan låg i lagret före importen (för listByProduct). */
  fanns: StoredReview[] = [];
  /** Antal gånger en produkts rader lästes. */
  lasningar = 0;
  /** Sätts för att simulera ett läsfel. */
  lasFel: Error | null = null;
  async exists(productId: string, reviewIdAE: string): Promise<boolean> {
    return this.existing.has(`${productId}__${reviewIdAE}`);
  }
  async upsert(r: StoredReview): Promise<void> {
    this.saved.push(r);
  }
  async listByProduct(productId: string): Promise<StoredReview[]> {
    this.lasningar++;
    if (this.lasFel) throw this.lasFel;
    return [...this.fanns, ...this.saved].filter((r) => r.productId === productId);
  }
}

function lagrad(över: Partial<StoredReview>): StoredReview {
  return {
    productId: "prod1",
    reviewIdAE: "fanns-1",
    rating: 5,
    textOriginal: "x",
    textSwedish: "x",
    initials: "M.K.",
    hasImage: false,
    status: "pending",
    ...över,
  };
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
      { now: NOW, reviewStore: store as never, source: "aosom" },
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
      { now: NOW, reviewStore: store as never, source: "aosom" },
    );
    expect(res.imported).toBe(0);
    expect(res.skippedExisting).toBe(1);
  });

  it("returnerar tomt utan recensioner som passerar filtret", async () => {
    const res = await importReviewsForProduct("prod1", [review({ rating: 1 })], {
      now: NOW,
      reviewStore: new FakeReviewStore() as never, source: "aosom",
    });
    expect(res.imported).toBe(0);
    expect(res.reviews).toHaveLength(0);
  });
});

// ── Unika initialer per produkt (Leonard 2026-10-30) ──────────────────────
describe("deriveUniqueInitials", () => {
  it("ger samma initialer som deriveInitials när platsen är ledig, och upptar den", () => {
    const upptagna = new Set<string>();
    expect(deriveUniqueInitials("Maria Karlsson", "a", "prod1", upptagna)).toBe("M.K.");
    expect(upptagna.has("M.K.")).toBe(true);
    const slumpade = deriveUniqueInitials(undefined, "rev-abc", "prod1", new Set());
    expect(slumpade).toBe(deriveInitials(undefined, "rev-abc"));
  });

  it("väljer andra bokstäver när platsen är upptagen, och upptar den nya", () => {
    const upptagna = new Set(["M.K."]);
    const ut = deriveUniqueInitials("Maria Karlsson", "a", "prod1", upptagna);
    expect(ut).not.toBe("M.K.");
    expect(bristerIInitialer(ut)).toBeNull();
    expect(upptagna.has(nyckelForInitialer(ut))).toBe(true);
    expect(upptagna.size).toBe(2);
  });

  it("dras med samma frö som bulkverktyget (produkt#recension), så de två är överens", () => {
    const upptagna = new Set(["M.K."]);
    const ut = deriveUniqueInitials("Maria Karlsson", "rev-7", "prod-9", new Set(upptagna));
    expect(ut).toBe(slumpaUnika("prod-9#rev-7", upptagna));
  });

  it("tjugo recensioner med samma namn i rad får tjugo olika initialer", () => {
    const upptagna = new Set<string>();
    const ut = Array.from({ length: 20 }, (_, i) => deriveUniqueInitials("Maria Karlsson", `r${i}`, "prod1", upptagna));
    expect(new Set(ut.map(nyckelForInitialer)).size).toBe(20);
    expect(ut[0]).toBe("M.K.");
    for (const i of ut) expect(bristerIInitialer(i), i).toBeNull();
  });

  it("fyller en hel produkt: 510 recensioner utan namn, 510 olika par", () => {
    const upptagna = new Set<string>();
    const ut = Array.from({ length: GILTIGA_PAR.length }, (_, i) => deriveUniqueInitials(undefined, `gen-${i}`, "prod1", upptagna));
    expect(new Set(ut).size).toBe(GILTIGA_PAR.length);
  });

  it("ger reglerna företräde när varje par redan är upptaget", () => {
    const upptagna = new Set(GILTIGA_PAR);
    const ut = deriveUniqueInitials(undefined, "gen-1", "prod1", upptagna);
    expect(ut).toBe(deriveInitials(undefined, "gen-1"));
    expect(bristerIInitialer(ut)).toBeNull();
  });
});

describe("lasUpptagnaInitialer", () => {
  it("samlar platserna för väntande och synliga rader, men inte avvisade", async () => {
    const store = new FakeReviewStore();
    store.fanns = [
      lagrad({ reviewIdAE: "1", initials: "M.K.", status: "pending" }),
      lagrad({ reviewIdAE: "2", initials: "a.r.", status: "approved" }),
      lagrad({ reviewIdAE: "3", initials: "S.L.", status: "edited" }),
      lagrad({ reviewIdAE: "4", initials: "J.B.", status: "rejected" }),
      lagrad({ productId: "annan", reviewIdAE: "5", initials: "O.G.", status: "approved" }),
    ];
    const platser = await lasUpptagnaInitialer(store, "prod1");
    expect([...platser].sort()).toEqual(["A.R.", "M.K.", "S.L."]);
  });

  it("☠️ ett läsfel kastar inte: importen går vidare utan unikhetskoll", async () => {
    const store = new FakeReviewStore();
    store.lasFel = new Error("Wix nere");
    const varna = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const platser = await lasUpptagnaInitialer(store, "prod1");
      expect(platser.size).toBe(0);
      expect(varna).toHaveBeenCalled();
    } finally {
      varna.mockRestore();
    }
  });
});

describe("importReviewsForProduct — unika initialer", () => {
  const text = (n: number) => `Mycket nöjd med köp nummer ${n}, kvaliteten är gedigen och leveransen gick fort.`;
  const importera = (store: FakeReviewStore, recensioner: AERReview[], produkt = "prod1") =>
    importReviewsForProduct(produkt, recensioner, { now: NOW, reviewStore: store as never, source: "vevor" });

  it("ger två recensioner med samma namn olika initialer på samma produkt", async () => {
    const store = new FakeReviewStore();
    await importera(store, [
      review({ reviewIdAE: "a", text: text(1), customerName: "Maria Karlsson" }),
      review({ reviewIdAE: "b", text: text(2), customerName: "Maria Karlsson" }),
    ]);
    const initialer = store.saved.map((r) => r.initials);
    expect(initialer).toHaveLength(2);
    expect(new Set(initialer.map(nyckelForInitialer)).size).toBe(2);
    expect(initialer).toContain("M.K.");
    for (const i of initialer) expect(bristerIInitialer(i), i).toBeNull();
    // Namnet bevaras som bevis, oavsett vilka initialer raden fick.
    expect(store.saved.every((r) => r.customerNameRaw === "Maria Karlsson")).toBe(true);
  });

  it("ger tolv recensioner med samma maskerade namn tolv olika initialer", async () => {
    const store = new FakeReviewStore();
    await importera(
      store,
      Array.from({ length: 12 }, (_, i) => review({ reviewIdAE: `r${i}`, text: text(i), customerName: "A***r" })),
    );
    expect(store.saved).toHaveLength(12);
    expect(new Set(store.saved.map((r) => nyckelForInitialer(r.initials))).size).toBe(12);
  });

  it("☠️ undviker initialer som redan finns på produkten, också på väntande rader", async () => {
    const store = new FakeReviewStore();
    store.fanns = [lagrad({ reviewIdAE: "fanns-1", initials: "M.K.", status: "pending" })];
    await importera(store, [review({ reviewIdAE: "a", text: text(1), customerName: "Maria Karlsson" })]);
    expect(store.saved[0].initials).not.toBe("M.K.");
    expect(bristerIInitialer(store.saved[0].initials)).toBeNull();
  });

  it("samma namn på en annan produkt är ingen krock, och en avvisad rad upptar ingen plats", async () => {
    const store = new FakeReviewStore();
    store.fanns = [
      lagrad({ productId: "annan", initials: "M.K.", status: "approved" }),
      lagrad({ reviewIdAE: "avvisad", initials: "M.K.", status: "rejected" }),
    ];
    await importera(store, [review({ reviewIdAE: "a", text: text(1), customerName: "Maria Karlsson" })]);
    expect(store.saved[0].initials).toBe("M.K.");
  });

  it("☠️ ett läsfel hos lagret stoppar inte importen: raden sparas med vanliga initialer", async () => {
    const store = new FakeReviewStore();
    store.lasFel = new Error("Wix nere");
    const varna = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const res = await importera(store, [review({ reviewIdAE: "a", text: text(1), customerName: "Maria Karlsson" })]);
      expect(res.imported).toBe(1);
      expect(store.saved[0].initials).toBe("M.K.");
    } finally {
      varna.mockRestore();
    }
  });

  it("läser produktens rader en gång per import, och inte alls när allt redan finns", async () => {
    const store = new FakeReviewStore();
    await importera(store, [
      review({ reviewIdAE: "a", text: text(1), customerName: "Maria Karlsson" }),
      review({ reviewIdAE: "b", text: text(2), customerName: "Peter Svensson" }),
      review({ reviewIdAE: "c", text: text(3) }),
    ]);
    expect(store.lasningar).toBe(1);

    const allt = new FakeReviewStore();
    allt.existing.add("prod1__a");
    await importera(allt, [review({ reviewIdAE: "a", text: text(1), customerName: "Maria Karlsson" })]);
    expect(allt.lasningar).toBe(0);
  });

  it("en andra import av samma produkt ser den förstas rader", async () => {
    const store = new FakeReviewStore();
    await importera(store, [review({ reviewIdAE: "a", text: text(1), customerName: "Maria Karlsson" })]);
    await importera(store, [review({ reviewIdAE: "b", text: text(2), customerName: "Maria Karlsson" })]);
    expect(store.saved).toHaveLength(2);
    expect(store.saved[0].initials).toBe("M.K.");
    expect(store.saved[1].initials).not.toBe("M.K.");
  });
});

// ── Bilduppladdningen ─────────────────────────────────────────────────────
// Slingan var HELT otestad fram till 2026-08-22, och det var just den som
// tappade bilder tyst: misslyckades uppladdningen slängdes bilden utan logg,
// raden sparades med hasImage:false, och källadressen bevarades ingenstans —
// alltså omöjlig att både upptäcka och reparera i efterhand.
describe("importReviewsForProduct — inga nya AliExpress-recensioner (2026-10-06)", () => {
  it("☠️ utan källa (AliExpress) sparas ingenting", async () => {
    const store = new FakeReviewStore();
    const res = await importReviewsForProduct(
      "prod1",
      [review({ reviewIdAE: "a", text: "Excellent product, fast shipping and great quality overall here." })],
      { now: NOW, reviewStore: store as never },
    );
    expect(res.imported).toBe(0);
    expect(store.saved).toEqual([]);
  });

  it("☠️ inte heller med källan uttryckligen satt till aliexpress", async () => {
    const store = new FakeReviewStore();
    const res = await importReviewsForProduct(
      "prod1",
      [review({ reviewIdAE: "a", text: "Excellent product, fast shipping and great quality overall here." })],
      { now: NOW, reviewStore: store as never, source: "aliexpress" },
    );
    expect(res.imported).toBe(0);
  });
});

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
      reviewStore: store as never, source: "aosom",
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
      reviewStore: store as never, source: "aosom",
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
      reviewStore: store as never, source: "aosom",
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
      reviewStore: store as never, source: "aosom",
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
        reviewStore: store as never, source: "aosom",
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
