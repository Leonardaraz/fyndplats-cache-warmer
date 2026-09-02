// Recensionslagret i Postgres.
//
// Det som testas är inte SQL:en — den bevisas av den skarpa kopieringen — utan
// de tre reglerna som lätt går förlorade när ett lager får en tvilling:
//
//   1. Statusfallbacken och hemflytten av bilden är REGLER OM RECENSIONER, inte
//      om databasen. Båda lagren måste lyda dem, annars beror det på en
//      env-variabel om en publicerad recension pekar på leverantörens CDN.
//   2. Statusfiltret körs i DATABASEN. En väntande rad kan ha vilket AE-datum
//      som helst, så "hämta de nyaste N och filtrera efteråt" hittar den inte.
//   3. En saknad rad KASTAR. Ett tyst no-op är precis buggen link-ae-order
//      fick ett eget test för.

import { beforeEach, describe, expect, it, vi } from "vitest";

/** Fångar varje SQL-anrop så vi kan se VAD som skickades, inte bara att det gick. */
const anrop: { text: string; värden: unknown[] }[] = [];
let svar: unknown[] = [];

function tagg(strings: TemplateStringsArray, ...v: unknown[]) {
  anrop.push({ text: strings.join("?"), värden: v });
  return Promise.resolve(svar);
}

vi.mock("../db/client", () => ({ sql: () => tagg }));

// Hemflytten av bilder ska inte gå ut på nätet i ett enhetstest. Den riktiga
// funktionen testas i media-import.test.ts.
vi.mock("../wix/media-import", () => ({
  isExternalSupplierImage: (u: string) => /aliexpress|alicdn/.test(u),
  ownImageUrlForReview: async () => "https://static.wixstatic.com/media/egen.jpg",
}));

import { PostgresReviewStore } from "./reviews-postgres";
import { normaliseraFörSkrivning, type StoredReview } from "./reviews";

function rec(över: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Great",
    textSwedish: "Bra",
    initials: "M.K.",
    hasImage: false,
    status: "pending",
    ...över,
  };
}

let store: PostgresReviewStore;

beforeEach(() => {
  anrop.length = 0;
  svar = [];
  store = new PostgresReviewStore();
});

/** Sammanlagd SQL-text från alla anrop — för att leta efter fraser. */
const allSql = () => anrop.map((a) => a.text).join("\n");

describe("☠️ samma regler som Wix-lagret, inte en tvilling", () => {
  it("delar normaliseringen: status faller tillbaka på pending, aldrig approved", async () => {
    // Regeln bytte riktning 2026-08-19 när DeepL togs bort: texten är
    // källspråket tills en människa skrivit om den, så en anropare som glömmer
    // status ska hamna i modereringskön — inte på produktsidan.
    const utan = { ...rec(), status: undefined } as unknown as StoredReview;
    const normaliserad = await normaliseraFörSkrivning(utan);
    expect(normaliserad.status).toBe("pending");

    await store.upsert(utan);
    expect(anrop[0].värden).toContain("pending");
  });

  it("☠️ en pending-rad flyttar INTE hem bilden — det är normalt, inte ett fel", async () => {
    await store.upsert(rec({ status: "pending", hasImage: true, imageUrl: "https://ae01.alicdn.com/x.jpg" }));
    const data = JSON.parse(anrop[0].värden[6] as string) as StoredReview;
    // Att flytta hem bilder för rader som kanske aldrig godkänns vore slöseri
    // med både anrop och medialagring. Se CLAUDE.md om recensionsbilder.
    expect(data.imageUrl).toBe("https://ae01.alicdn.com/x.jpg");
  });

  it("en SYNLIG rad flyttar hem bilden till vår egen domän", async () => {
    await store.upsert(rec({ status: "edited", hasImage: true, imageUrl: "https://ae01.alicdn.com/x.jpg" }));
    const data = JSON.parse(anrop[0].värden[6] as string) as StoredReview;
    expect(data.imageUrl).toContain("wixstatic.com");
  });
});

describe("☠️ statusfiltret körs i databasen", () => {
  it("listByStatus skickar status som villkor, inte som efterfiltrering", async () => {
    await store.listByStatus("pending", 50);
    expect(allSql()).toMatch(/where status =/);
    expect(anrop[0].värden).toContain("pending");
  });

  it("sorteringen tål saknat datum — nulls last, aldrig bortkastade rader", async () => {
    await store.listByStatus("pending");
    // Utan `nulls last` hamnar rader utan AE-datum först i Postgres
    // (desc sorterar null högst), alltså precis tvärtom mot Wix.
    expect(allSql()).toMatch(/order by date desc nulls last/);
  });

  it("listByProduct filtrerar på produkt", async () => {
    await store.listByProduct("p-42");
    expect(allSql()).toMatch(/where product_id =/);
    expect(anrop[0].värden).toContain("p-42");
  });
});

describe("☠️ en saknad rad kastar — aldrig ett tyst no-op", () => {
  it("setStatus på en rad som inte finns", async () => {
    svar = [];
    await expect(store.setStatus("p1", "r1", "approved")).rejects.toThrow(/saknas/);
  });

  it("editText på en rad som inte finns", async () => {
    svar = [];
    await expect(store.editText("p1", "r1", "Ny text")).rejects.toThrow(/saknas/);
  });

  it("editText på en befintlig rad sätter edited", async () => {
    svar = [{ data: rec({ status: "approved" }) }];
    await store.editText("p1", "r1", "Omskriven");
    const skrivning = anrop[anrop.length - 1];
    const data = JSON.parse(skrivning.värden[6] as string) as StoredReview;
    expect(data.status).toBe("edited");
    expect(data.textSwedish).toBe("Omskriven");
  });
});

describe("Wix-metafälten följer inte med tillbaka", () => {
  it("_id och _createdDate rensas ur den lästa posten", async () => {
    svar = [{ data: { ...rec(), _id: "p1__r1", _owner: "x", _createdDate: "2026-01-01" } }];
    const [ut] = await store.listByProduct("p1");
    expect(ut).not.toHaveProperty("_id");
    expect(ut).not.toHaveProperty("_owner");
    expect(ut).not.toHaveProperty("_createdDate");
    expect(ut.productId).toBe("p1");
  });
});

describe("id:t är komposit — samma reviewIdAE kan finnas på flera produkter", () => {
  it("exists slår upp på productId__reviewIdAE", async () => {
    svar = [{ "?column?": 1 }];
    await store.exists("p1", "r1");
    expect(anrop[0].värden).toContain("p1__r1");
  });
});
