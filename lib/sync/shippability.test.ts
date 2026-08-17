import { describe, expect, it } from "vitest";
import { unshippableVariantIdsFor } from "./aliexpress-sync";
import type { VariantMapping } from "../import/pipeline";
import { checkMappingShippability, isShippabilityStale, NEGATIVE_CONFIRMATIONS, SHIPPABILITY_RECHECK_MS } from "./shippability";
import type { FreightQueryOutcome } from "../aliexpress/freight";

const NOW = Date.parse("2026-07-13T22:00:00.000Z");

function variant(overrides: Partial<VariantMapping>): VariantMapping {
  return {
    supplierVariantId: "sku-1",
    sku: "FP-test",
    wixVariantId: "wix-1",
    choices: { Antal: "39 Lådor" },
    costUsd: 10,
    landedCostSek: 100,
    grossSek: 199,
    ...overrides,
  };
}

const AE = [
  { skuId: "sku-1", skuProps: { Color: "39 Drawers" } },
  { skuId: "sku-2", skuProps: { Color: "22 Drawers" } },
];

function shippableOutcome(): Promise<FreightQueryOutcome> {
  return Promise.resolve({
    method: "aliexpress.ds.freight.query",
    raw: { result: { delivery_options: { delivery_option_d_t_o: [{ code: "STD" }] } } },
  });
}

function unshippableOutcome(): Promise<FreightQueryOutcome> {
  return Promise.resolve({
    method: "aliexpress.ds.freight.query",
    raw: { result: { delivery_options: { delivery_option_d_t_o: [] } } },
  });
}

describe("isShippabilityStale", () => {
  it("aldrig kontrollerad → stale; färsk kontroll → inte stale; 7+ dygn → stale", () => {
    expect(isShippabilityStale(variant({}), NOW)).toBe(true);
    expect(isShippabilityStale(variant({ shippabilityCheckedAt: new Date(NOW - 1000).toISOString() }), NOW)).toBe(false);
    expect(isShippabilityStale(variant({ shippabilityCheckedAt: new Date(NOW - SHIPPABILITY_RECHECK_MS - 1).toISOString() }), NOW)).toBe(true);
  });
});

describe("checkMappingShippability", () => {
  it("nej-svar markerar INTE (unknown efter kod röd 2026-07-14); ja-svar markerar fraktbar", async () => {
    const budget = { remaining: 10 };
    const res = await checkMappingShippability({
      mapping: {
        supplierProductId: "1005012347030872",
        variants: [variant({ supplierVariantId: "sku-1" }), variant({ supplierVariantId: "sku-2", wixVariantId: "wix-2", sku: "FP-test-2" })],
      },
      aeVariants: AE,
      nowMs: NOW,
      budget,
      delayMs: 0,
      queryFn: (_pid, skuId) => (skuId === "sku-1" ? unshippableOutcome() : shippableOutcome()),
    });
    expect(res.apiCalls).toBe(2);
    expect(budget.remaining).toBe(8);
    expect(res.unshippable).toBe(0);
    // sku-1: tomt/nekande svar → orörd + fortsatt stale (ingen stämpel).
    expect(res.variants[0].shippableToSe).toBeUndefined();
    expect(res.variants[0].shippabilityCheckedAt).toBeUndefined();
    // sku-2: positiv evidens → fraktbar + stämplad.
    expect(res.variants[1]).toMatchObject({ shippableToSe: true });
    expect(res.variants[1].shippabilityCheckedAt).toBeTruthy();
  });

  it("färska varianter hoppar kontrollen — inga anrop", async () => {
    const fresh = new Date(NOW - 1000).toISOString();
    const res = await checkMappingShippability({
      mapping: {
        supplierProductId: "p",
        variants: [variant({ shippabilityCheckedAt: fresh, shippableToSe: true })],
      },
      aeVariants: AE,
      nowMs: NOW,
      budget: { remaining: 10 },
      delayMs: 0,
      queryFn: () => { throw new Error("ska inte anropas"); },
    });
    expect(res.apiCalls).toBe(0);
    expect(res.changed).toBe(false);
  });

  it("slut budget → resterande varianter lämnas orörda (stale kvar)", async () => {
    const res = await checkMappingShippability({
      mapping: {
        supplierProductId: "p",
        variants: [variant({ supplierVariantId: "sku-1" }), variant({ supplierVariantId: "sku-2", sku: "FP-2" })],
      },
      aeVariants: AE,
      nowMs: NOW,
      budget: { remaining: 1 },
      delayMs: 0,
      queryFn: () => shippableOutcome(),
    });
    expect(res.apiCalls).toBe(1);
    expect(res.variants[1].shippabilityCheckedAt).toBeUndefined();
  });

  it("unknown-svar ändrar INGENTING (varianten förblir stale)", async () => {
    const res = await checkMappingShippability({
      mapping: { supplierProductId: "p", variants: [variant({ shippableToSe: true })] },
      aeVariants: AE,
      nowMs: NOW,
      budget: { remaining: 10 },
      delayMs: 0,
      queryFn: () => Promise.resolve({ method: "x", error: "AliExpress API HTTP-fel: 502" }),
    });
    expect(res.apiCalls).toBe(1);
    expect(res.changed).toBe(false);
    expect(res.variants[0]).toMatchObject({ shippableToSe: true });
    expect(res.variants[0].shippabilityCheckedAt).toBeUndefined();
  });

  it("ingen entydig SKU-matchning → inget anrop, ingen dom", async () => {
    const res = await checkMappingShippability({
      mapping: { supplierProductId: "p", variants: [variant({ supplierVariantId: "okänd-sku" })] },
      aeVariants: AE,
      nowMs: NOW,
      budget: { remaining: 10 },
      delayMs: 0,
      queryFn: () => { throw new Error("ska inte anropas"); },
    });
    expect(res.apiCalls).toBe(0);
    expect(res.details[0].note).toContain("ingen entydig SKU-matchning");
  });

  it("fraktväg tillbaka → varianten blir fraktbar igen (självläkande)", async () => {
    const stale = new Date(NOW - SHIPPABILITY_RECHECK_MS - 1000).toISOString();
    const res = await checkMappingShippability({
      mapping: {
        supplierProductId: "p",
        variants: [variant({ shippableToSe: false, shippabilityCheckedAt: stale })],
      },
      aeVariants: AE,
      nowMs: NOW,
      budget: { remaining: 10 },
      delayMs: 0,
      queryFn: () => shippableOutcome(),
    });
    expect(res.variants[0]).toMatchObject({ shippableToSe: true });
    expect(res.unshippable).toBe(0);
  });
});

// ── Manuellt verdikt vs automatiskt (Leonards rapport 2026-08-16) ───────────
// Sparkbilen (SucceBuy) låg med ~60 i lager fast leverantörens sida sa "can't be
// shipped to your address". Den automatiska kontrollen är avstängd sedan kod röd
// 2026-07-14, så det fanns ingen väg att stoppa varan — den såldes och fick
// återbetalas. Manuella verdikt lyder därför inte under env-flaggan.
describe("unshippableVariantIdsFor", () => {
  const v = (id: string, shippableToSe?: boolean, manual?: boolean) =>
    ({ wixVariantId: id, supplierVariantId: `sku-${id}`, shippableToSe, shippabilityManual: manual }) as never;

  it("manuellt nej nollar varianten ÄVEN när env-flaggan är av", () => {
    const s = unshippableVariantIdsFor([v("a", false, true)], false);
    expect([...s]).toEqual(["a"]);
  });

  it("automatiskt nej är inert när env-flaggan är av (de 9 gamla flaggorna)", () => {
    const s = unshippableVariantIdsFor([v("a", false)], false);
    expect(s.size).toBe(0);
  });

  it("automatiskt nej biter när env-flaggan slås på", () => {
    const s = unshippableVariantIdsFor([v("a", false)], true);
    expect([...s]).toEqual(["a"]);
  });

  it("fraktbara och okontrollerade rörs aldrig", () => {
    const s = unshippableVariantIdsFor([v("a", true, true), v("b", undefined, true), v("c")], true);
    expect(s.size).toBe(0);
  });

  it("variant utan wixVariantId hoppas över (går inte att spegla)", () => {
    const s = unshippableVariantIdsFor([{ shippableToSe: false, shippabilityManual: true } as never], true);
    expect(s.size).toBe(0);
  });
});

// ── Kontroll v2: ett nej måste BEVISAS (2026-08-16) ────────────────────────
// Före v2 kunde kedjan bara sätta shippableToSe:true — parseFreightOutcome
// returnerade aldrig false. Insamlingen var alltså säker men värdelös: den
// hade aldrig fångat sparkbilen. v2 återinför nejet med kod rödens lärdom
// inbyggd: upprepning över dygn, och aldrig bredvid ett fraktbart syskon.

function explicitNoOutcome(): Promise<FreightQueryOutcome> {
  return Promise.resolve({
    method: "aliexpress.ds.freight.query",
    raw: { result: { success: false, msg: "DELIVERY_NOT_AVAILABLE_TO_YOUR_ADDRESS" } },
  });
}
const DAY = 24 * 60 * 60 * 1000;
const one = (v: Partial<VariantMapping>) => ({ supplierProductId: "p1", variants: [variant(v)] });

describe("kontroll v2 — beviskrav för automatiskt nej", () => {
  it("ETT uttryckligt nej dömer inte — det startar bara en serie", async () => {
    const r = await checkMappingShippability({
      mapping: one({}), aeVariants: AE, nowMs: NOW,
      budget: { remaining: 5 }, queryFn: explicitNoOutcome, delayMs: 0,
    });
    expect(r.variants[0].shippableToSe).toBeUndefined();
    expect(r.variants[0].shippabilityNegativeStreak).toBe(1);
    expect(r.unshippable).toBe(0);
  });

  it("två nej spridda över ett dygn ger dom → lagret får nollas", async () => {
    const r = await checkMappingShippability({
      mapping: one({ shippabilityNegativeStreak: 1, shippabilityNegativeSince: new Date(NOW - DAY - 1).toISOString() }),
      aeVariants: AE, nowMs: NOW, budget: { remaining: 5 }, queryFn: explicitNoOutcome, delayMs: 0,
    });
    expect(r.variants[0].shippableToSe).toBe(false);
    expect(r.unshippable).toBe(1);
  });

  it("två nej för tätt inpå varandra dömer INTE (kräver oberoende observationer)", async () => {
    const r = await checkMappingShippability({
      mapping: one({ shippabilityNegativeStreak: 1, shippabilityNegativeSince: new Date(NOW - 60_000).toISOString() }),
      aeVariants: AE, nowMs: NOW, budget: { remaining: 5 }, queryFn: explicitNoOutcome, delayMs: 0,
    });
    expect(r.variants[0].shippableToSe).toBeUndefined();
    expect(r.variants[0].shippabilityNegativeStreak).toBe(2);
  });

  // Exakt kod röd-mönstret: Aosom-hyllan fick "Beige ok, Grå nej" och nollades.
  it("nej bredvid ett fraktbart syskon dömer ALDRIG — kod röd 2026-07-14", async () => {
    const mapping = {
      supplierProductId: "p1",
      variants: [
        variant({ supplierVariantId: "sku-1", sku: "FP-a", wixVariantId: "wix-a",
          shippabilityNegativeStreak: 1, shippabilityNegativeSince: new Date(NOW - DAY - 1).toISOString() }),
        variant({ supplierVariantId: "sku-2", sku: "FP-b", wixVariantId: "wix-b" }),
      ],
    };
    const r = await checkMappingShippability({
      mapping, aeVariants: AE, nowMs: NOW, budget: { remaining: 5 }, delayMs: 0,
      queryFn: (_p, skuId) => (skuId === "sku-1" ? explicitNoOutcome() : shippableOutcome()),
    });
    expect(r.variants[0].shippableToSe).toBeUndefined();
    expect(r.variants[1].shippableToSe).toBe(true);
    expect(r.unshippable).toBe(0);
  });

  it("ett ja nollar serien och läker varianten", async () => {
    const r = await checkMappingShippability({
      mapping: one({ shippableToSe: false, shippabilityNegativeStreak: 5, shippabilityNegativeSince: new Date(NOW - 9 * DAY).toISOString() }),
      aeVariants: AE, nowMs: NOW, budget: { remaining: 5 }, queryFn: shippableOutcome, delayMs: 0,
    });
    expect(r.variants[0].shippableToSe).toBe(true);
    expect(r.variants[0].shippabilityNegativeStreak).toBeUndefined();
  });

  it("HTTP-fel och tom lista är BRUS — startar ingen serie", async () => {
    for (const q of [
      () => Promise.resolve({ method: "x", error: "AliExpress API HTTP-fel: 502" }),
      unshippableOutcome,
    ]) {
      const r = await checkMappingShippability({
        mapping: one({}), aeVariants: AE, nowMs: NOW, budget: { remaining: 5 }, queryFn: q, delayMs: 0,
      });
      expect(r.variants[0].shippabilityNegativeStreak).toBeUndefined();
      expect(r.variants[0].shippableToSe).toBeUndefined();
    }
  });

  it("öppen nej-serie kontrolleras om efter ett dygn, inte efter sju", () => {
    const nyss = new Date(NOW - 2 * DAY).toISOString();
    expect(isShippabilityStale(variant({ shippabilityCheckedAt: nyss }), NOW)).toBe(false);
    expect(isShippabilityStale(variant({ shippabilityCheckedAt: nyss, shippabilityNegativeStreak: 1 }), NOW)).toBe(true);
  });
});

// ── Granskning 2026-08-16: gör domen faktiskt något? ───────────────────────
// Fyndet: en v2-dom satte shippableToSe:false men INTE shippabilityManual, och
// grinden krävde manual ELLER env-flaggan. v2 var alltså helt inert — domen
// skrevs men nollade aldrig lager. Och att slå på env-flaggan för att laga det
// hade samtidigt aktiverat de 13 kvarvarande v1-flaggorna från kod röd.
// Bevisserien ÄR grinden; v1-flaggorna saknar serie och förblir inerta.
describe("bevisad v2-dom nollar utan env-flaggan; v1-flaggor gör det inte", () => {
  const v = (id: string, extra: Partial<VariantMapping>) =>
    ({ wixVariantId: id, supplierVariantId: `s-${id}`, shippableToSe: false, ...extra }) as VariantMapping;

  it("bevisad serie (≥2) nollar även när env-flaggan är av", () => {
    const s = unshippableVariantIdsFor([v("a", { shippabilityNegativeStreak: NEGATIVE_CONFIRMATIONS })], false);
    expect([...s]).toEqual(["a"]);
  });

  it("påbörjad men obekräftad serie (1) nollar INTE", () => {
    const s = unshippableVariantIdsFor([v("a", { shippabilityNegativeStreak: 1 })], false);
    expect(s.size).toBe(0);
  });

  it("gammal v1-flagga utan serie förblir inert utan env-flaggan", () => {
    const s = unshippableVariantIdsFor([v("a", {})], false);
    expect(s.size).toBe(0);
  });

  it("…men aktiveras när env-flaggan uttryckligen slås på", () => {
    const s = unshippableVariantIdsFor([v("a", {})], true);
    expect([...s]).toEqual(["a"]);
  });
});

// ── Lager-failover (stödbenen 2026-08-17) ─────────────────────────────────
// Bästsäljaren "Stödben för husvagn" nollades på två nej. Listningen var
// levande hela tiden: säljaren hade lagt ner DE-lagret vi sparade vid import
// och skickade från ES/FR/CZ/PL. Ett nej på VÅR SKU är inte ett nej på varan.

const AE_LAGER = [
  { skuId: "de", skuAttr: "14:350850#4 PCS;200007763:201336106", skuProps: { Color: "4 PCS", "Ships From": "Germany" }, shipFrom: "DE", stock: 0 },
  { skuId: "es", skuAttr: "14:350850#4 PCS;200007763:201336104", skuProps: { Color: "4 PCS", "Ships From": "Spain" }, shipFrom: "ES", stock: 12 },
  { skuId: "pl", skuAttr: "14:350850#4 PCS;200007763:203372089", skuProps: { Color: "4 PCS", "Ships From": "Poland" }, shipFrom: "PL", stock: 4 },
];
const enLagervariant = (v: Partial<VariantMapping> = {}) => ({
  supplierProductId: "p1",
  variants: [variant({ supplierVariantId: "de", choices: { Antal: "4 st" }, ...v })],
});
/** Nej för allt utom de skuId:n som listas. */
const nejUtom = (ja: string[]) => (_p: string, skuId: string) =>
  ja.includes(skuId) ? shippableOutcome() : explicitNoOutcome();

describe("lager-failover", () => {
  it("vårt lager säger nej, ett annat säger ja → varianten är fraktbar", async () => {
    const r = await checkMappingShippability({
      mapping: enLagervariant(), aeVariants: AE_LAGER, nowMs: NOW,
      budget: { remaining: 5 }, queryFn: nejUtom(["es"]), delayMs: 0,
    });
    expect(r.variants[0].shippableToSe).toBe(true);
    expect(r.unshippable).toBe(0);
    expect(r.variants[0].shippabilityNegativeStreak).toBeUndefined();
  });

  it("varianten pekas om till lagret som svarade ja — annars frågar vi den döda SKU:n för alltid", async () => {
    const r = await checkMappingShippability({
      mapping: enLagervariant(), aeVariants: AE_LAGER, nowMs: NOW,
      budget: { remaining: 5 }, queryFn: nejUtom(["es"]), delayMs: 0,
    });
    expect(r.variants[0].supplierVariantId).toBe("14:350850#4 PCS;200007763:201336104");
    expect(r.variants[0].previousSupplierVariantId).toBe("de");
    expect(r.variants[0].shipFromSwitchedAt).toBe(new Date(NOW).toISOString());
  });

  it("lagret med saldo provas först — ett anrop räcker", async () => {
    const r = await checkMappingShippability({
      mapping: enLagervariant(), aeVariants: AE_LAGER, nowMs: NOW,
      budget: { remaining: 5 }, queryFn: nejUtom(["es"]), delayMs: 0,
    });
    expect(r.apiCalls).toBe(2); // vår egen SKU + första alternativet
  });

  it("säger ALLA lager nej står domen kvar — serien eskalerar som förut", async () => {
    const r = await checkMappingShippability({
      mapping: enLagervariant({
        shippabilityNegativeStreak: 1,
        shippabilityNegativeSince: new Date(NOW - DAY - 1).toISOString(),
      }),
      aeVariants: AE_LAGER, nowMs: NOW,
      budget: { remaining: 5 }, queryFn: nejUtom([]), delayMs: 0,
    });
    expect(r.variants[0].shippableToSe).toBe(false);
    expect(r.unshippable).toBe(1);
    expect(r.variants[0].supplierVariantId).toBe("de"); // ingen ompekning på ett nej
  });

  it("slut budget → inga failover-anrop, ingen dom smygs in", async () => {
    const r = await checkMappingShippability({
      mapping: enLagervariant(), aeVariants: AE_LAGER, nowMs: NOW,
      budget: { remaining: 1 }, queryFn: nejUtom(["es"]), delayMs: 0,
    });
    expect(r.apiCalls).toBe(1);
    expect(r.variants[0].shippableToSe).toBeUndefined();
    expect(r.variants[0].supplierVariantId).toBe("de");
  });
});
