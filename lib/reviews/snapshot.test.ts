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

const listVisibleAll = vi.fn<() => Promise<StoredReview[]>>();
/** Speglar Postgres `order by date desc nulls last limit 100` i listByProduct. */
const listByProduct = vi.fn(async (productId: string) =>
  (await listVisibleAll())
    .filter((r) => r.productId === productId)
    .sort((a, b) => {
      const ta = a.date ? Date.parse(a.date) : NaN;
      const tb = b.date ? Date.parse(b.date) : NaN;
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return tb - ta;
    })
    .slice(0, 100),
);
vi.mock("../store/reviews", async (original) => {
  const faktisk = await original<typeof import("../store/reviews")>();
  return { ...faktisk, getReviewStore: () => ({ listVisibleAll, listByProduct }) };
});

const { byggSnapshot, urSnapshot, arTrovardig, SNAPSHOT_TAG, SNAPSHOT_VARNING_BYTES, MAX_PER_PRODUKT } =
  await import("./snapshot");
const { snittBetyg, toPublicReview } = await import("./public-view");
const { isVisibleStatus } = await import("../store/reviews");

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
    const bild = { genereradAt: "", antal: 0, produkter: 0, perProdukt: {}, antalPerProdukt: {} };
    expect(urSnapshot(bild, "finns-inte")).toEqual([]);
  });
});

describe("bilden och lagret ger IDENTISKA svar", () => {
  beforeEach(() => listVisibleAll.mockReset());

  it("samma rader, samma ordning, samma fält — för varje produkt", async () => {
    // ☠️ DET HÄR ÄR HELA LÖFTET. Butiken ska inte kunna märka att svaret bytte
    // väg. Provet kör BÅDA vägarna mot samma data och jämför JSON rakt av:
    //   gammal väg: listByProduct → filtrera synliga → toPublicReview
    //   ny väg:     byggSnapshot → perProdukt[id]
    const rader = [
      rad({ productId: "a", reviewIdAE: "1", date: "2026-03-01T00:00:00.000Z" }),
      rad({ productId: "a", reviewIdAE: "2", date: "2026-09-01T00:00:00.000Z", rating: 3, hasImage: true, imageUrl: "https://static.wixstatic.com/media/b379ce_x~mv2.jpg" }),
      rad({ productId: "a", reviewIdAE: "3" }),
      rad({ productId: "b", reviewIdAE: "4", source: "customer", initials: "L.A." }),
      rad({ productId: "b", reviewIdAE: "5", source: "aosom", date: "2026-01-05T00:00:00.000Z" }),
      rad({ productId: "c", reviewIdAE: "6", date: "2026-07-07T00:00:00.000Z" }),
    ];
    listVisibleAll.mockResolvedValue(rader);
    const bild = await byggSnapshot();

    for (const id of ["a", "b", "c"]) {
      const gammal = (await listByProduct(id)).filter((r) => isVisibleStatus(r.status)).map(toPublicReview);
      expect(JSON.stringify(urSnapshot(bild, id)), `produkt ${id} skiljer sig`).toBe(JSON.stringify(gammal));
    }
  });

  it("taket per produkt är detsamma som lagrets — även vid 150 omdömen", async () => {
    // Utan samma tak hade en produkt med fler än hundra omdömen visat olika
    // många beroende på vilken väg svaret tog. Ingen produkt är där idag
    // (störst är 42), så provet är det enda som håller reglerna ihop.
    const manga = Array.from({ length: 150 }, (_, i) =>
      rad({ productId: "a", reviewIdAE: `r${i}`, date: new Date(2026, 0, 1 + i).toISOString() }),
    );
    listVisibleAll.mockResolvedValue(manga);
    const bild = await byggSnapshot();
    expect(urSnapshot(bild, "a")).toHaveLength(MAX_PER_PRODUKT);
    const gammal = (await listByProduct("a")).filter((r) => isVisibleStatus(r.status)).map(toPublicReview);
    expect(JSON.stringify(urSnapshot(bild, "a"))).toBe(JSON.stringify(gammal));
  });

  it("antalPerProdukt bär det SANNA antalet, även när listan kapas", async () => {
    // ☠️ Aggregatet (kortens stjärnor) räknade före bytet ALLA synliga rader.
    // Läste det längden på den kapade listan hade ett kort stannat på 100
    // medan produktsidan visade fler — tyst, och bara för de produkter som har
    // mest att visa.
    const manga = Array.from({ length: 150 }, (_, i) =>
      rad({ productId: "a", reviewIdAE: `r${i}`, date: new Date(2026, 0, 1 + i).toISOString() }),
    );
    listVisibleAll.mockResolvedValue(manga);
    const bild = await byggSnapshot();
    expect(urSnapshot(bild, "a")).toHaveLength(MAX_PER_PRODUKT);
    expect(bild.antalPerProdukt.a, "aggregatet skulle tappa 50 omdömen").toBe(150);
  });

  it("en produkt utan omdömen ger tom lista på båda vägarna", async () => {
    listVisibleAll.mockResolvedValue([rad({ productId: "a" })]);
    const bild = await byggSnapshot();
    expect(urSnapshot(bild, "finns-inte")).toEqual([]);
    expect(await listByProduct("finns-inte")).toEqual([]);
  });
});

describe("en tom bild är ett fel, inte ett svar", () => {
  it("noll recensioner i hela katalogen räknas som INGEN bild", () => {
    // ☠️ Hittat på preview 2026-09-17: miljön saknade REVIEWS_BACKEND, läste
    // ett annat lager, och bilden byggdes utan att kasta. Formen var giltig,
    // så läsrutterna hoppade över sin fallback och svarade count: 0 för
    // VARENDA produkt. Inget fel i loggen. Tredje gången samma fälla i det här
    // repot — spårningssidan 2026-09-01, aggregatet 2026-09-02.
    expect(arTrovardig({ genereradAt: "x", antal: 0, produkter: 0, perProdukt: {}, antalPerProdukt: {} })).toBe(false);
  });

  it("en bild med rader duger", () => {
    expect(arTrovardig({ genereradAt: "x", antal: 1, produkter: 1, perProdukt: { a: [] }, antalPerProdukt: { a: 1 } })).toBe(true);
  });

  it("rutten vägrar servera den, och låter den aldrig cachas", () => {
    const rutt = las("app/api/reviews-snapshot/route.ts");
    expect(rutt).toMatch(/if \(!bild\)/);
    expect(rutt).toMatch(/status: 503/);
    expect(rutt, "en tom bild får ALDRIG ligga kvar i CDN:en").toMatch(/"Cache-Control": "no-store"/);
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

  it("cronen kräver CRON_SECRET, precis som syskonen", () => {
    // ☠️ Rutten släpper cachen, och nästa läsare bygger om bilden ur Postgres.
    // Öppen är den en knapp som väcker databasen på begäran, hur ofta som
    // helst — exakt den kostnad hela konstruktionen finns för att ta bort.
    //
    // Provet greppar efter SJÄLVA GRINDEN, inte efter orden. Första versionen
    // letade bara "CRON_SECRET" och "401" — och överlevde en mutation som
    // gjorde grinden oåtkomlig, eftersom båda strängarna stod kvar i
    // kommentaren och i den döda returen.
    const cron = las("app/api/cron/reviews-snapshot/route.ts");
    expect(cron, "hemligheten läses inte ur miljön").toMatch(
      /const secret = process\.env\.CRON_SECRET;/,
    );
    expect(cron, "grinden anropas inte i GET").toMatch(/if \(!isCronAuthorized\(req\)\) \{/);
    // ☠️ FAIL CLOSED. Motorns egen regel (lib/cron-auth.test.ts): ingen rutt
    // får svara `if (!secret) return true`. Jag skrev först precis det, kopierat
    // från butikens svagare konvention — auditen fällde det.
    expect(cron, "failar inte stängt utan hemlighet").toMatch(/if \(!secret\) return false;/);
    expect(cron).toMatch(/status: 401/);
  });

  it("läsvägen går ALDRIG över HTTP till den egna deployen", () => {
    // ☠️ Första versionen lät läsrutterna fetch:a /api/reviews-snapshot. Det
    // fungerade i produktion och gick sönder på varje preview (Vercels
    // inloggningsskydd svarade med HTML), utan att någonting SÅG trasigt ut —
    // fallbacken räddade svaret medan varenda förfrågan läste databasen.
    const modul = las("lib/reviews/snapshot.ts");
    expect(modul).toMatch(/unstable_cache/);
    expect(modul, "själv-hämtning över HTTP är tillbaka").not.toMatch(/fetch\(/);
    expect(modul, "VERCEL_URL hör inte hemma i läsvägen").not.toMatch(/VERCEL_URL/);
  });

  it("visningsläget ingår i cachenyckeln — killswitchen måste bita direkt", () => {
    const modul = las("lib/reviews/snapshot.ts");
    expect(modul).toMatch(/\["reviews-snapshot", "v1", reviewDisplayMode\(\)\]/);
  });

  it("taggen är en enda sträng, delad av alla", () => {
    expect(SNAPSHOT_TAG).toBe("reviews-snapshot");
  });
});
