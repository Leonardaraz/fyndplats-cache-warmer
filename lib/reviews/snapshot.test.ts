// Prov för recensionsbilden.
//
// Två sorters prov här, och den andra sorten är den viktiga:
//
//   1. Att bilden BYGGS rätt — gruppering, statusfilter, ordning.
//   2. Att KOSTNADSREGELN står kvar. Hela den här konstruktionen finns för att
//      Neon-computen ska få sova, och den vilar på två saker som ser ut som
//      detaljer: att cronen ligger på samma minut som de andra väckarna, och
//      att läsrutterna går via bilden i stället för lagret. Ändras något av
//      det fortsätter allt FUNGERA — det blir bara dyrt igen, tyst, tills
//      nästa mejl från Neon. Därför provas de i källkoden.

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { StoredReview } from "../store/reviews";

const rot = fileURLToPath(new URL("../../", import.meta.url));
const las = (p: string) => readFileSync(rot + p, "utf8");

function rad(over: Partial<StoredReview> = {}): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Great",
    textSwedish: "Toppen",
    initials: "M.K.",
    status: "approved",
    hasImage: false,
    importedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  } as StoredReview;
}

const listVisibleAll = vi.fn<[], Promise<StoredReview[]>>();
vi.mock("../store/reviews", async (original) => {
  const faktisk = await original<typeof import("../store/reviews")>();
  return { ...faktisk, getReviewStore: () => ({ listVisibleAll }) };
});

const { byggSnapshot, urSnapshot, hamtaSnapshot, SNAPSHOT_TAG, SNAPSHOT_VARNING_BYTES, snapshotUrl } =
  await import("./snapshot");
const { snittBetyg } = await import("./public-view");

describe("byggSnapshot", () => {
  beforeEach(() => listVisibleAll.mockReset());

  it("grupperar per produkt och räknar rätt", async () => {
    listVisibleAll.mockResolvedValue([
      rad({ productId: "a", reviewIdAE: "1" }),
      rad({ productId: "a", reviewIdAE: "2", rating: 3 }),
      rad({ productId: "b", reviewIdAE: "3" }),
    ]);
    const bild = await byggSnapshot();
    expect(bild.produkter).toBe(2);
    expect(bild.antal).toBe(3);
    expect(bild.perProdukt.a).toHaveLength(2);
    expect(bild.perProdukt.b).toHaveLength(1);
  });

  it("släpper aldrig igenom en rad som inte är publikt synlig", async () => {
    // ☠️ Lagret filtrerar redan, men bilden filtrerar OM. Två lager som båda
    // påstår sig filtrera är precis hur en avvisad recension hamnar på en
    // produktsida.
    listVisibleAll.mockResolvedValue([
      rad({ reviewIdAE: "1", status: "approved" }),
      rad({ reviewIdAE: "2", status: "pending" }),
      rad({ reviewIdAE: "3", status: "rejected" }),
      rad({ reviewIdAE: "4", status: "edited" }),
    ]);
    const bild = await byggSnapshot();
    expect(bild.antal).toBe(2);
    expect(bild.perProdukt.p1.map((r) => r.reviewIdAE)).toEqual(["1", "4"]);
  });

  it("sorterar nyast först och lägger rader utan datum sist", async () => {
    // Måste matcha `order by date desc nulls last` i båda lagren — annars
    // hoppar recensionerna omkring beroende på om svaret kom ur bilden eller
    // ur fallbacken.
    listVisibleAll.mockResolvedValue([
      rad({ reviewIdAE: "gammal", date: "2026-01-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "utan" }),
      rad({ reviewIdAE: "ny", date: "2026-09-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "skräp", date: "inte-ett-datum" }),
    ]);
    const bild = await byggSnapshot();
    expect(bild.perProdukt.p1.map((r) => r.reviewIdAE).slice(0, 2)).toEqual(["ny", "gammal"]);
    expect(bild.perProdukt.p1.slice(2).map((r) => r.reviewIdAE).sort()).toEqual(["skräp", "utan"]);
  });

  it("hoppar över rader utan productId i stället för att skapa en tom nyckel", async () => {
    listVisibleAll.mockResolvedValue([rad({ productId: "" }), rad({ productId: "a" })]);
    const bild = await byggSnapshot();
    expect(Object.keys(bild.perProdukt)).toEqual(["a"]);
  });
});

describe("urSnapshot", () => {
  it("ger tom lista för en produkt som saknas", () => {
    const bild = { genereradAt: "", antal: 0, produkter: 0, perProdukt: {} };
    expect(urSnapshot(bild, "finns-inte")).toEqual([]);
  });
});

describe("hamtaSnapshot faller alltid tillbaka, aldrig sönder", () => {
  const riktig = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = riktig;
    vi.restoreAllMocks();
  });

  it("null när svaret inte är ok", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 }) as never;
    expect(await hamtaSnapshot()).toBeNull();
  });

  it("null när svaret är 200 men saknar perProdukt", async () => {
    // ☠️ Exakt felet /api/reviews/aggregates gav 2026-09-02: 200 med fel form,
    // `res.ok` passerade, och stjärnorna försvann tyst.
    vi.spyOn(console, "warn").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as never;
    expect(await hamtaSnapshot()).toBeNull();
  });

  it("null när hämtningen kastar", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("nät nere")) as never;
    expect(await hamtaSnapshot()).toBeNull();
  });

  it("hämtar aldrig en relativ adress", () => {
    // En route handler har ingen bas att lösa "/api/..." mot. Hade den kastat
    // fångats felet av fallbacken, och vi hade tyst fortsatt fråga Postgres
    // varje gång utan att märka att fixen inte gjorde något.
    expect(snapshotUrl()).toMatch(/^https:\/\//);
  });
});

describe("snittBetyg", () => {
  it("avrundar till en decimal", () => {
    expect(snittBetyg([{ rating: 5 }, { rating: 4 }, { rating: 4 }])).toBe(4.3);
  });
  it("null för tom lista", () => {
    expect(snittBetyg([])).toBeNull();
  });
});

describe("kostnadsregeln i källkoden", () => {
  it("cronen ligger på minut :25 — samma väckningsfönster som de andra", () => {
    // ☠️ DET HÄR ÄR HELA BESPARINGEN, INTE EN DETALJ.
    //
    // Neon debiterar tiden databasen är vaken och somnar efter fem minuters
    // tystnad. `order-backfill` och `health-check` väcker den redan :25.
    // Flyttas recensionsbilden till en annan minut betalar vi för ett ANDRA
    // fönster i timmen — varje timme, för all framtid — och ingenting går
    // sönder, så ingen märker det förrän potten är slut igen.
    const crons = JSON.parse(las("vercel.json")).crons as { path: string; schedule: string }[];
    const bild = crons.find((c) => c.path.includes("reviews-snapshot"));
    expect(bild, "cronjobbet för recensionsbilden saknas i vercel.json").toBeTruthy();
    expect(bild!.schedule).toBe("25 * * * *");

    const minut = (p: string) => crons.find((c) => c.path.includes(p))?.schedule.split(" ")[0];
    expect(minut("reviews-snapshot")).toBe(minut("order-backfill"));
    expect(minut("reviews-snapshot")).toBe(minut("health-check"));
  });

  it("läsrutterna går via bilden och har kvar sin fallback", () => {
    // Går någon tillbaka till att läsa lagret direkt blir sajten inte trasig
    // — bara dyr igen. Det är därför regeln provas här och inte i beteendet.
    const perProdukt = las("app/api/reviews/[productId]/route.ts");
    expect(perProdukt).toMatch(/hamtaSnapshot\(\)/);
    expect(perProdukt, "fallbacken till lagret är borta").toMatch(/listByProduct/);

    const aggregat = las("app/api/review-aggregates/route.ts");
    expect(aggregat).toMatch(/hamtaSnapshot\(\)/);
    expect(aggregat, "fallbacken till lagret är borta").toMatch(/aggregateByProduct\(\)/);
  });

  it("modereringen släpper bilden, annars syns ett godkänt omdöme först nästa timme", () => {
    const actions = las("app/admin/reviews/actions.ts");
    expect(actions).toMatch(/SNAPSHOT_TAG/);
    // Tvåargsformen: enargs `revalidateTag(tag)` är deprecated i Next 16.2.
    expect(actions).toMatch(/revalidateTag\(SNAPSHOT_TAG,\s*"max"\)/);
  });

  it("varningströskeln ligger under Vercels svarsgräns med marginal", () => {
    const VERCEL_TAK = 4_500_000;
    expect(SNAPSHOT_VARNING_BYTES).toBeLessThan(VERCEL_TAK);
    // Minst 20 % kvar att agera på när varningen kommer. Uppmätt 2026-09-17
    // låg bilden på 2,06 MB och katalogen växte snabbt.
    expect(VERCEL_TAK - SNAPSHOT_VARNING_BYTES).toBeGreaterThan(VERCEL_TAK * 0.2);
  });

  it("taggen är en enda sträng, delad av alla", () => {
    expect(SNAPSHOT_TAG).toBe("reviews-snapshot");
  });
});
