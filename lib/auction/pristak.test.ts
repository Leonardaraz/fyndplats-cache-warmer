// Pristaket: inget fynd över 2 000 kr (Leonard 2026-11-18). Taket för sig,
// seedens avslag och vad seeden då tar bort. Tickens del står i tick.test.ts,
// skyddsräckets i seed-skyddsracke.test.ts.
import { describe, expect, it } from "vitest";
import type { AuctionDoc } from "./engine";
import { AUKTION_PRISTAK_KR, overPristak } from "./pristak";
import { assignQueueOrder, evaluateCandidate, planSeed, type SeedCandidate, type SeedInput } from "./seed";

const spar = (pris: number) => ({ wixVariantId: `v${pris}`, listPrice: pris, floorPrice: pris * 0.85, ladder: [pris] });

describe("overPristak", () => {
  it("taket är 2 000 kr", () => {
    expect(AUKTION_PRISTAK_KR).toBe(2000);
  });

  it("exakt 2 000 kr får vara med, ett öre över får det inte", () => {
    expect(overPristak({ listPrice: 1999 })).toBe(false);
    expect(overPristak({ listPrice: 2000 })).toBe(false);
    expect(overPristak({ listPrice: 2000.01 })).toBe(true);
    expect(overPristak({ listPrice: 2499 })).toBe(true);
  });

  it("☠️ varje variant räknas, inte bara den billigaste som kortet visar", () => {
    // Kortet visar 1 499 kr, men den stora storleken kostar 2 899 kr.
    expect(overPristak({ listPrice: 1499, variantPrices: [spar(1499), spar(2899)] })).toBe(true);
    expect(overPristak({ listPrice: 1499, variantPrices: [spar(1499), spar(2000)] })).toBe(false);
    expect(overPristak({ variantPrices: [{ listPrice: 2001 }] })).toBe(true);
  });

  it("en äldre rad utan spår per variant prövas på sitt enda pris", () => {
    expect(overPristak({ listPrice: 2199, variantPrices: [] })).toBe(true);
    expect(overPristak({ listPrice: 899 })).toBe(false);
  });

  it("ett pris som inte är ett tal är inte över taket: de andra grindarna tar raden", () => {
    expect(overPristak({ listPrice: Number.NaN })).toBe(false);
    expect(overPristak({})).toBe(false);
    expect(overPristak({ variantPrices: [{ listPrice: Number.NaN }, { listPrice: 500 }] })).toBe(false);
  });

  it("taket går att pröva med ett annat tal", () => {
    expect(overPristak({ listPrice: 1500 }, 1000)).toBe(true);
    expect(overPristak({ listPrice: 1500 }, 1500)).toBe(false);
  });
});

const vara = (over: Partial<SeedInput> = {}): SeedInput => ({
  productId: "p1",
  slug: "test-produkt",
  name: "Testprodukt",
  visible: true,
  inStock: true,
  hasCompareAt: false,
  // Kostnaden är låg nog att rabatten räcker: avslaget ska bero på taket.
  variants: [{ wixVariantId: "v1", listPrice: 1549, landedCostSek: 696 }],
  ...over,
});

describe("seeden avvisar en vara över taket", () => {
  it("en vara för 2 499 kr avvisas med skälet overPristak", () => {
    const v = evaluateCandidate(vara({ variants: [{ wixVariantId: "v1", listPrice: 2499, landedCostSek: 1100 }] }));
    expect(v).toEqual({ ok: false, reason: "overPristak" });
  });

  it("samma vara för exakt 2 000 kr och för 1 999 kr kvalar in", () => {
    for (const pris of [2000, 1999]) {
      const v = evaluateCandidate(vara({ variants: [{ wixVariantId: "v1", listPrice: pris, landedCostSek: 900 }] }));
      expect(v.ok, `${pris} kr`).toBe(true);
    }
  });

  it("☠️ en sida från 1 499 kr med en storlek för 2 899 kr avvisas", () => {
    const v = evaluateCandidate(
      vara({
        variants: [
          { wixVariantId: "liten", listPrice: 1499, landedCostSek: 650 },
          { wixVariantId: "stor", listPrice: 2899, landedCostSek: 1250 },
        ],
      }),
    );
    expect(v).toEqual({ ok: false, reason: "overPristak" });
  });

  it("en variant utan pris (0 kr) räknas inte mot taket", () => {
    const v = evaluateCandidate(
      vara({
        variants: [
          { wixVariantId: "v1", listPrice: 1549, landedCostSek: 696 },
          { wixVariantId: "v0", listPrice: 0, landedCostSek: null },
        ],
      }),
    );
    expect(v.ok).toBe(true);
  });

  it("skälen före taket vinner: en dold, slutsåld eller reasatt vara rapporteras som det", () => {
    const dyr = [{ wixVariantId: "v1", listPrice: 2499, landedCostSek: 1100 }];
    expect(evaluateCandidate(vara({ variants: dyr, visible: false }))).toEqual({ ok: false, reason: "hidden" });
    expect(evaluateCandidate(vara({ variants: dyr, inStock: false }))).toEqual({ ok: false, reason: "outOfStock" });
    expect(evaluateCandidate(vara({ variants: dyr, hasCompareAt: true }))).toEqual({ ok: false, reason: "existingSale" });
  });

  it("taket prövas före kostnaden: en dyr vara utan kostnad är över taket, inte utan kostnad", () => {
    const v = evaluateCandidate(vara({ variants: [{ wixVariantId: "v1", listPrice: 2499, landedCostSek: null }] }));
    expect(v).toEqual({ ok: false, reason: "overPristak" });
  });
});

describe("seeden tar bort köade och schemalagda rader över taket", () => {
  const NU = Date.parse("2026-11-19T02:00:00.000Z");
  const I_MORGON = "2026-11-19T06:00:00.000Z";
  const I_GAR = "2026-11-18T06:00:00.000Z";
  const rad = (id: string, over: Partial<AuctionDoc>): AuctionDoc => ({
    _id: `auction-${id}`,
    productId: id,
    slug: id,
    name: id,
    listPrice: 2499,
    floorPrice: 2129,
    ladder: [2499, 2129],
    stepMinutes: 60,
    slot: 0,
    status: "queued",
    queueOrder: 1,
    ...over,
  });
  // Urvalet efter taket: bara den billiga varan är kvar.
  const billig = evaluateCandidate(vara({ productId: "billig", slug: "billig" }));
  if (!billig.ok) throw new Error("den billiga varan ska kvala in");
  const urval: SeedCandidate[] = [billig.doc];

  const befintliga: AuctionDoc[] = [
    rad("koad-dyr", { status: "queued" }),
    rad("schemalagd-dyr", { status: "live", slot: 3, startAt: I_MORGON }),
    rad("startad-dyr", { status: "live", slot: 4, startAt: I_GAR }),
    rad("sald-dyr", { status: "sold", endedAt: "2026-10-01T12:00:00.000Z", soldPrice: 2299 }),
    rad("slut-dyr", { status: "expired", endedAt: "2026-10-02T18:00:00.000Z" }),
    rad("billig", { status: "queued", listPrice: 1549 }),
  ];
  const plan = planSeed(urval, befintliga, assignQueueOrder(urval), NU);

  it("den köade och den schemalagda tas bort, så att ticken fyller platsen före 07", () => {
    expect(plan.toRemove.map((r) => r.productId).sort()).toEqual(["koad-dyr", "schemalagd-dyr"]);
    expect(plan.liveNotRefreshed).toEqual(["schemalagd-dyr"]);
  });

  it("☠️ en startad auktion rörs aldrig mitt i sin dag, och historiken står kvar", () => {
    const rorda = [...plan.toRemove, ...plan.toSave].map((r) => r.productId);
    for (const id of ["startad-dyr", "sald-dyr", "slut-dyr"]) expect(rorda, id).not.toContain(id);
  });

  it("den billiga står kvar i kön", () => {
    expect(plan.toSave.map((r) => `${r.productId}:${r.status}`)).toEqual(["billig:queued"]);
  });
});
