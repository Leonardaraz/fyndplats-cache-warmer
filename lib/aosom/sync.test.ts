import { describe, it, expect } from "vitest";
import {
  runAosomSync,
  synligtSaldo,
  landadKostnadSek,
  LAGER_BUFFERT,
  MIN_FEED_RADER,
  MAX_PRISANDRING_PCT,
  jamforelsePris,
  type AosomSyncDeps,
} from "./sync";
import { MIN_WIX_PRODUKTER, type WixProduktPris } from "../wix/v3-products";
import type { AosomRow } from "./feed";
import type { ProductMappingRecord } from "../store";
import type { PricingRules } from "../import/types";
import { computePriceWithRules } from "../import/pricing";

const FX = { eurToSek: 11.1, usdToSek: 10.5 };

const REGLER: PricingRules = {
  usdToSek: 10.5,
  defaultMultiplier: 1.2,
  fixedSurchargeSek: 0,
  categoryMultipliers: {},
  tiersEnabled: false,
  tiers: [],
  rounding: "charm9",
  vatRatePercent: 25,
};

function rad(sku: string, over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku,
    name: `Produkt ${sku}`,
    url: `https://www.aosom.de/item/x~${sku}.html`,
    imageUrls: [],
    category: "Haus & Wohnen",
    color: "", material: "", size: "", packageSize: "",
    weightKg: 5,
    descriptionHtml: "", bulletsHtml: "",
    qty: 50,
    normalPriceEur: 100,
    wholesaleEur: 40,
    seFreightEur: 20,
    rowIndex: 1,
    ...over,
  };
}

/** Feeden måste passera MIN_FEED_RADER, annars kastar synken med flit. */
function feedMed(...rader: AosomRow[]): AosomRow[] {
  const utfyllnad = Array.from({ length: MIN_FEED_RADER }, (_, i) => rad(`ZZ-utfyllnad-${i}`));
  return [...rader, ...utfyllnad];
}

/** Priset regeln ger för standardraden — så "oförändrat" verkligen är oförändrat. */
const BASPRIS = computePriceWithRules(
  landadKostnadSek(rad("bas"), FX.eurToSek) / FX.usdToSek,
  REGLER,
  null,
).grossSek;

function mappning(sku: string, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  const landad = landadKostnadSek(rad(sku), FX.eurToSek);
  return {
    supplierProductId: `aosom:${sku}`,
    supplier: "aosom",
    wixProductId: `wix-${sku}`,
    variants: [
      {
        supplierVariantId: sku,
        // ☠️ Wix-SKU:n måste skilja sig från Aosoms artikelnummer i fixturen.
        // Tidigare stod det bara `sku`, alltså samma sträng i båda rollerna — och
        // då kunde inget test se att synken skickade FEL nyckel till prisskrivningen
        // (den skickade feedens artikelnummer där Wix ville ha variantens egen SKU).
        // Buggen levde i produktion tills en polering jämförde mappning mot Wix.
        sku: `FP-${sku}`,
        wixVariantId: `wixvar-${sku}`,
        choices: {},
        costUsd: landad / FX.usdToSek,
        landedCostSek: landad,
        grossSek: BASPRIS,
        shipFrom: "DE",
      },
    ],
    ...over,
  };
}

/**
 * Butikens prislista. Måste passera MIN_WIX_PRODUKTER, annars kastar synken —
 * samma form som `feedMed`.
 *
 * Utan argument speglar den mappningens pris, så "oförändrad" i de gamla
 * testerna betyder fortfarande oförändrad.
 */
function wixPriser(over: Record<string, number | null> = {}): Map<string, WixProduktPris> {
  const m = new Map<string, WixProduktPris>();
  for (let i = 0; i < MIN_WIX_PRODUKTER; i++) {
    m.set(`wix-ZZ-utfyllnad-${i}`, { priceSek: BASPRIS, variantCount: 1 });
  }
  for (const id of ["wix-A-1", "wix-B-2"]) m.set(id, { priceSek: BASPRIS, variantCount: 1 });
  for (const [id, pris] of Object.entries(over)) {
    if (pris === null) m.delete(id);
    else m.set(id, { priceSek: pris, variantCount: 1 });
  }
  return m;
}

/**
 * Lagerposter för fejk-butiken. Ett produkt-id → en post, som Aosom har det.
 *
 * ☠️ Posten bär ett annat `id` än produkten, med flit. Fixturen fick tidigare
 * `setStock` produkt-id:t direkt; nu går skrivningen på LAGERPOSTENS id, och
 * en fixtur som lät de två vara samma sträng hade inte kunnat se skillnad på
 * rätt och fel nyckel. Exakt den förväxlingen lät prissynken skriva till
 * ingenting i en månad (`sku` i mappningen mot `sku` i Wix-varianten).
 */
function lagerpost(wixProductId: string, quantity = 0) {
  return { id: `inv-${wixProductId}`, revision: "1", productId: wixProductId, quantity };
}

function deps(over: Partial<AosomSyncDeps> = {}) {
  const lager: { id: string; antal: number }[] = [];
  const priser: { id: string; pris: number; kostnad: number; variant: { wixVariantId?: string; sku?: string } }[] = [];
  const sparade: ProductMappingRecord[] = [];
  const bas: AosomSyncDeps = {
    fetchFeed: async () => feedMed(rad("A-1"), rad("B-2")),
    listWixPriser: async () => wixPriser(),
    listAosom: async () => [mappning("A-1"), mappning("B-2")],
    lasLagerposter: async (ids) => ids.map((id) => lagerpost(id)),
    skrivLager: async (updates) => {
      for (const u of updates) {
        // Bokförs under PRODUKTENS id så testerna läser som förut.
        lager.push({ id: u.id.replace(/^inv-/, ""), antal: u.quantity });
      }
      return { lyckade: updates.map((u) => u.id), misslyckade: [] };
    },
    setPrice: async (id, variant, pris, kostnad) => {
      priser.push({ id, pris, kostnad, variant });
    },
    saveMapping: async (m) => { sparade.push(m); },
    fx: FX,
    rules: REGLER,
    ...over,
  };
  return { d: bas, lager, priser, sparade };
}

describe("synligtSaldo", () => {
  it("drar av bufferten så svansen aldrig säljs", () => {
    expect(synligtSaldo(50)).toBe(50 - LAGER_BUFFERT);
    expect(synligtSaldo(100)).toBe(100 - LAGER_BUFFERT);
  });

  it("saldon på eller under bufferten visas som slutsålt", () => {
    // Feeden uppdateras 3 ggr/dygn. Säger Aosom "3 kvar" och vi visar 3 säljer vi
    // den fjärde i fönstret mellan två synkar.
    for (let q = 0; q <= LAGER_BUFFERT; q++) expect(synligtSaldo(q)).toBe(0);
  });

  it("skräpvärden blir 0, aldrig NaN eller negativt", () => {
    expect(synligtSaldo(NaN)).toBe(0);
    expect(synligtSaldo(-7)).toBe(0);
  });
});

describe("runAosomSync", () => {
  it("torrkörning är default och skriver ingenting", async () => {
    const { d, lager, priser, sparade } = deps();
    const s = await runAosomSync(d);
    expect(s.dryRun).toBe(true);
    expect(lager).toHaveLength(0);
    expect(priser).toHaveLength(0);
    expect(sparade).toHaveLength(0);
  });

  it("☠️ en trunkerad feed KASTAR i stället för att nolla katalogen", async () => {
    // Det här är hela skillnaden mot AE-synken: där kan ett fel nolla en produkt,
    // här kan en halvhämtad CSV nolla allt på en gång.
    const { d, lager } = deps({ fetchFeed: async () => [rad("A-1")] });
    await expect(runAosomSync(d, { dryRun: false })).rejects.toThrow(/1 rader/);
    expect(lager).toHaveLength(0);
  });

  it("speglar lagersaldot med buffert avdragen", async () => {
    const { d, lager } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 }), rad("B-2", { qty: 9 })),
    });
    await runAosomSync(d, { dryRun: false });
    expect(lager).toEqual([
      { id: "wix-A-1", antal: 50 - LAGER_BUFFERT },
      { id: "wix-B-2", antal: 9 - LAGER_BUFFERT },
    ]);
  });

  it("rad som FÖRSVUNNIT ur feeden nollas — men produkten rörs inte i övrigt", async () => {
    // Aosoms B2B-guide: "Items with low stock may be temporarily removed to avoid
    // overselling." Raden är ett lagerbesked, inte en avpublicering.
    const { d, lager, priser } = deps({ fetchFeed: async () => feedMed(rad("A-1")) });
    const s = await runAosomSync(d, { dryRun: false });
    expect(lager).toContainEqual({ id: "wix-B-2", antal: 0 });
    expect(s.urFeeden).toBe(1);
    // Inget pris skrivs för en rad som inte finns — det finns inget att räkna på.
    expect(priser.some((p) => p.id === "wix-B-2")).toBe(false);
  });

  it("saldot kommer tillbaka av sig självt när raden gör det", async () => {
    const utan = deps({
      fetchFeed: async () => feedMed(rad("A-1")),
      listAosom: async () => [mappning("B-2", { aosomSyncedQty: 47 })],
    });
    await runAosomSync(utan.d, { dryRun: false });
    expect(utan.lager).toEqual([{ id: "wix-B-2", antal: 0 }]);

    const med = deps({
      fetchFeed: async () => feedMed(rad("B-2", { qty: 50 })),
      listAosom: async () => [mappning("B-2", { aosomSyncedQty: 0 })],
    });
    await runAosomSync(med.d, { dryRun: false });
    expect(med.lager).toEqual([{ id: "wix-B-2", antal: 50 - LAGER_BUFFERT }]);
  });

  it("oförändrat saldo rör inte Wix alls", async () => {
    const { d, lager } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: 50 - LAGER_BUFFERT })],
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(lager).toHaveLength(0);
    expect(s.oforandrade).toBe(1);
  });

  it("priset följer kostnaden UPPÅT", async () => {
    const { d, priser } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { wholesaleEur: 60 })),
      listAosom: async () => [mappning("A-1")],
    });
    await runAosomSync(d, { dryRun: false });
    expect(priser).toHaveLength(1);
    expect(priser[0].pris).toBeGreaterThan(BASPRIS);
  });

  it("priset följer kostnaden NEDÅT — tvåvägs, per Leonards beslut", async () => {
    const { d, priser } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { wholesaleEur: 35, seFreightEur: 15 })),
      listAosom: async () => [mappning("A-1")],
    });
    await runAosomSync(d, { dryRun: false });
    expect(priser).toHaveLength(1);
    expect(priser[0].pris).toBeLessThan(BASPRIS);
  });

  // ☠️ REGRESSIONSTEST för buggen som gjorde hela tvåvägs-prissynken verkningslös
  // (hittad 2026-08-29 under en polering, inte av ett larm). Synken skickade loopens
  // `sku` — feedens artikelnummer — till prisskrivningen, som matchar mot WIX-variantens
  // egen SKU. De kan aldrig vara samma sträng, så updateV3VariantPrices hittade ingen
  // variant, hoppade över PATCH:en och returnerade tyst. Synken räknade ändå upp
  // `prisUppdaterade` och skrev mappningen. Resultat: mappningen sa 3 529 kr medan
  // kunden såg 4 539 kr, och produkten stod kvar på revision 1 — aldrig rörd.
  //
  // `setStock` tog samma argument men ignorerade det (`_sku`) och slog upp på
  // produkt-id. Därför fungerade lagret, och därför såg felet ut som om det inte fanns.
  it("prisskrivningen får WIX-variantens identitet, aldrig Aosoms artikelnummer", async () => {
    const { d, priser } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { wholesaleEur: 60 })),
      listAosom: async () => [mappning("A-1")],
    });
    await runAosomSync(d, { dryRun: false });
    expect(priser).toHaveLength(1);
    expect(priser[0].variant.wixVariantId).toBe("wixvar-A-1");
    expect(priser[0].variant.sku).toBe("FP-A-1");
    // Artikelnumret är feedens nyckel och hör inte hemma i en Wix-variantsökning.
    expect(priser[0].variant.sku).not.toBe("A-1");
    expect(priser[0].variant.wixVariantId).not.toBe("A-1");
  });

  it("ett prishopp över taket BLOCKERAS och rapporteras", async () => {
    // En frakt som råkat bli 0 eller ett grossistpris med fel decimal får aldrig
    // nå kund. Automatiken är tvåvägs, inte blind.
    const { d, priser } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { wholesaleEur: 400 })),
      listAosom: async () => [mappning("A-1")],
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(priser).toHaveLength(0);
    expect(s.varningar).toHaveLength(1);
    expect(s.varningar[0].sku).toBe("A-1");
    expect(Math.abs(s.varningar[0].andringPct)).toBeGreaterThan(MAX_PRISANDRING_PCT);
  });

  it("skriver alla tre kostnadsfälten på mappningen, aldrig bara priset", async () => {
    // Lönsamhetsöversikten och auktionens golvbud läser landedCostSek. Rättas bara
    // priset ser marginalen fantastisk ut och auktionen kan sälja under inköp.
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { wholesaleEur: 60 })),
      listAosom: async () => [mappning("A-1")],
    });
    await runAosomSync(d, { dryRun: false });
    const v = sparade[0].variants[0];
    expect(v.grossSek).toBeGreaterThan(BASPRIS);
    expect(v.landedCostSek).toBeCloseTo(landadKostnadSek(rad("A-1", { wholesaleEur: 60 }), FX.eurToSek), 5);
    expect(v.costUsd).toBeCloseTo(v.landedCostSek / FX.usdToSek, 5);
  });

  it("mappningen stämplas FÖRST efter att skrivningen gått igenom", async () => {
    // Stämplas den före hade ett misslyckat anrop bokförts som synkat och
    // produkten hoppats över för alltid.
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listAosom: async () => [mappning("A-1")],
      skrivLager: async () => { throw new Error("Wix svarade 500"); },
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(s.misslyckade).toBe(1);
    expect(sparade).toHaveLength(0);
  });

  it("ett fel på en produkt stoppar inte de andra", async () => {
    const { d } = deps({
      // Per-rad-utfall: A-1:s rad faller, B-2:s går igenom. Det är hela
      // skälet till att skrivningen svarar per rad — med ett aggregerat svar
      // hade B-2 antingen fällts med A-1 eller bokförts som skriven fast den
      // inte var det.
      skrivLager: async (updates) => ({
        lyckade: updates.filter((u) => u.id !== "inv-wix-A-1").map((u) => u.id),
        misslyckade: updates
          .filter((u) => u.id === "inv-wix-A-1")
          .map((u) => ({ id: u.id, fel: "Wix svarade 500" })),
      }),
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 }), rad("B-2", { qty: 50 })),
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(s.misslyckade).toBe(1);
    expect(s.errors[0].sku).toBe("A-1");
    expect(s.lagerUppdaterade).toBe(1);
  });

  it("markören går att fortsätta från, i artikelnummerordning", async () => {
    const { d } = deps();
    const forsta = await runAosomSync(d, { dryRun: false, limit: 1 });
    expect(forsta.cursor).toBe("A-1");
    expect(forsta.stoppedBy).toBe("limit");

    const andra = await runAosomSync(d, { dryRun: false, after: forsta.cursor! });
    expect(andra.cursor).toBeNull();
    expect(andra.granskade).toBe(1);
  });

  it("`limit` tar av SKRIVNINGAR, inte av granskningar — därför konvergerar cronen", async () => {
    // En redan synkad produkt kostar noll Wix-anrop. Åt den av budgeten skulle
    // varje körning fastna på samma första hundra och aldrig nå slutet, eftersom
    // Vercel-cronen inte kan skicka med en markör.
    const synkad = mappning("A-1", { aosomSyncedQty: 50 - LAGER_BUFFERT });
    const osynkad = mappning("B-2");
    const { d, lager } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 }), rad("B-2", { qty: 50 })),
      listAosom: async () => [synkad, osynkad],
    });
    const s = await runAosomSync(d, { dryRun: false, limit: 1 });
    expect(s.oforandrade).toBe(1);              // A-1 gick gratis förbi
    expect(lager).toEqual([{ id: "wix-B-2", antal: 50 - LAGER_BUFFERT }]);
    expect(s.stoppedBy).toBe("klart");          // budgeten räckte hela vägen
  });

  it("skipPrices synkar bara lagret", async () => {
    const { d, lager, priser } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50, wholesaleEur: 60 })),
      listAosom: async () => [mappning("A-1")],
    });
    await runAosomSync(d, { dryRun: false, skipPrices: true });
    expect(lager).toHaveLength(1);
    expect(priser).toHaveLength(0);
  });

  it("rapporterar feedens storlek — kvittot på att spärren passerades", async () => {
    const { d } = deps();
    const s = await runAosomSync(d);
    expect(s.feedRader).toBeGreaterThanOrEqual(MIN_FEED_RADER);
  });
});

describe("jamforelsePris — facit är butiken, inte bokföringen", () => {
  it("entydigt pris på en envariantsprodukt används", () => {
    expect(jamforelsePris({ priceSek: 3449, variantCount: 1 })).toEqual({ pris: 3449 });
  });

  it("☠️ produkt som saknas i butikens svar ger 'saknas' — aldrig en gissning", () => {
    expect(jamforelsePris(undefined)).toBe("saknas");
  });

  it("☠️ prisSPANN över flera varianter är inget pris", () => {
    // actualPriceRange min ≠ max → listV3ProductPrices sätter priceSek null.
    expect(jamforelsePris({ priceSek: null, variantCount: 2 })).toBe("flera");
  });

  it("☠️ flera varianter diskvalificerar även när spannet råkar vara entydigt", () => {
    // Två varianter som just nu kostar lika mycket är fortfarande inte "en
    // produkts pris" — synken skriver bara variant[0].
    expect(jamforelsePris({ priceSek: 3449, variantCount: 2 })).toBe("flera");
  });

  it("pris 0 är ett pris, inte ett saknat värde", () => {
    expect(jamforelsePris({ priceSek: 0, variantCount: 1 })).toEqual({ pris: 0 });
  });
});

describe("☠️ prissynken jämför mot Wix, inte mot mappningen", () => {
  it("de tjugo drivande raderna: mappning och butik oense → butiken rättas", async () => {
    // Det verkliga fallet (CLAUDE.md, 2026-08-29): den trasiga skrivningen hann
    // uppdatera mappningen, så mappningen bär det NYA priset medan Wix har kvar
    // det gamla. Mot mappningen är allt "oförändrat" — mot Wix är det drift.
    const { d, priser } = deps({
      listWixPriser: async () => wixPriser({ "wix-A-1": BASPRIS + 400 }),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.prisUppdaterade).toBe(1);
    expect(priser).toHaveLength(1);
    expect(priser[0].id).toBe("wix-A-1");
    expect(priser[0].pris).toBe(BASPRIS);
    // B-2 stämmer mot butiken och rörs inte.
    expect(priser.some((p) => p.id === "wix-B-2")).toBe(false);
  });

  it("stämmer butiken redan skrivs ingenting — körningen konvergerar", async () => {
    // Äkta konvergerat läge: lagret redan i fas OCH butikens pris lika med
    // regelpriset. Då ska körningen inte röra en enda produkt — det är den
    // egenskapen som gör att cronen kan gå var sjätte timme utan markör.
    const iFas = synligtSaldo(rad("A-1").qty);
    const { d, priser, lager, sparade } = deps({
      listAosom: async () => [
        mappning("A-1", { aosomSyncedQty: iFas }),
        mappning("B-2", { aosomSyncedQty: iFas }),
      ],
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(priser).toHaveLength(0);
    expect(lager).toHaveLength(0);
    expect(sparade).toHaveLength(0);
    expect(s.prisUppdaterade).toBe(0);
    expect(s.oforandrade).toBe(2);
  });

  it("☠️ taket räknas mot BUTIKENS pris, inte mappningens", async () => {
    // Butiken ligger så lågt att vägen tillbaka till regelpriset är ett stort
    // hopp. Det ska hamna i varningar för mänskligt öga, inte skrivas rakt av.
    const lagt = Math.round(BASPRIS * 0.5);
    const { d, priser } = deps({
      listWixPriser: async () => wixPriser({ "wix-A-1": lagt }),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(priser).toHaveLength(0);
    expect(s.varningar).toHaveLength(1);
    expect(s.varningar[0].sku).toBe("A-1");
    expect(s.varningar[0].fran).toBe(lagt);
    expect(Math.abs(s.varningar[0].andringPct)).toBeGreaterThan(MAX_PRISANDRING_PCT);
  });

  it("☠️ en produkt som saknas i butiken får INGET pris skrivet", async () => {
    const { d, priser } = deps({
      listWixPriser: async () => wixPriser({ "wix-A-1": null }),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.utanWixPris).toBe(1);
    expect(priser.some((p) => p.id === "wix-A-1")).toBe(false);
  });

  it("☠️ en handfull produkter från butiken är ett LÄSFEL — inget pris skrivs", async () => {
    // Speglar MIN_FEED_RADER. Utan spärren hade varenda produkt sett ut att
    // sakna butikspris, och prissynken hade tystnat helt utan att någon märkte.
    const { d, priser } = deps({
      // Priset avviker 10 % från det synken räknar fram — utan spärren hade
      // den här produkten definitivt fått ett nytt pris skrivet (10 % ligger
      // under MAX_PRISANDRING_PCT). Med spärren skrivs ingenting.
      listWixPriser: async () =>
        new Map([["wix-A-1", { priceSek: Math.round(BASPRIS * 1.1), variantCount: 1 }]]),
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: 0 })],
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(priser).toHaveLength(0);
    expect(s.prisUppdaterade).toBe(0);
    expect(s.prislistaFel).toMatch(/läsfel|minst/i);
  });

  it("☠️ ett läsfel i prislistan fäller INTE lagersynken", async () => {
    // Skillnaden mot MIN_FEED_RADER, och hela skälet till att den här spärren
    // inte kastar: att sälja något vi inte har är ett kundfel, att inte hinna
    // rätta ett pris på ett osynligt utkast är det inte.
    const { d, lager, priser } = deps({
      listWixPriser: async () => { throw new Error("Wix svarade 429"); },
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: 0 })],
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(lager).toHaveLength(1);
    expect(s.lagerUppdaterade).toBe(1);
    expect(priser).toHaveLength(0);
    expect(s.prisUppdaterade).toBe(0);
  });

  it("☠️ men körningen får inte se frisk ut — felet bärs i svaret", async () => {
    const { d } = deps({
      listWixPriser: async () => { throw new Error("Wix svarade 429"); },
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.prislistaFel).toContain("429");
    // Varje produkt räknas som oprisjämförd, inte som "stämmer".
    expect(s.utanWixPris).toBe(2);
  });

  it("en läsbar prislista lämnar prislistaFel null", async () => {
    const { d } = deps();
    const s = await runAosomSync(d, { dryRun: false });
    expect(s.prislistaFel).toBeNull();
  });

  it("skipPrices ger inget prislistefel — läsningen var aldrig tänkt att ske", async () => {
    const { d } = deps({ listWixPriser: async () => { throw new Error("ska aldrig anropas"); } });
    const s = await runAosomSync(d, { dryRun: false, skipPrices: true });
    expect(s.prislistaFel).toBeNull();
  });

  it("skipPrices hoppar över butiksläsningen helt — lagret synkas ändå", async () => {
    let last = false;
    const { d, lager, priser } = deps({
      listWixPriser: async () => { last = true; return wixPriser(); },
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: 0 })],
    });
    const s = await runAosomSync(d, { dryRun: false, skipPrices: true });

    expect(last).toBe(false);
    expect(priser).toHaveLength(0);
    expect(lager).toHaveLength(1);
    expect(s.lagerUppdaterade).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BATCHNINGEN (2026-09-04)
//
// Loopen anropade `bulk-update-inventory` — ett BULK-API som tar en array —
// med EN produkt i taget, ~2 000 gånger per svep. Uppmätt 2026-09-02 slog det
// i Wix EDGE-spärr efter ~600 skrivningar. Pacingen gjorde det uthärdligt;
// tuggorna gör spärren irrelevant.
//
// Det som INTE fick gå förlorat i omskrivningen står nedan, och varje test
// motsvarar en rad som redan kostat pengar i det här repot.
// ═══════════════════════════════════════════════════════════════════════════

describe("runAosomSync — tuggor", () => {
  it("femtio produkter läses i ETT anrop, inte femtio", async () => {
    const manga = Array.from({ length: 50 }, (_, i) => `P-${String(i).padStart(3, "0")}`);
    const lasningar: string[][] = [];
    const skrivningar: number[] = [];
    const { d } = deps({
      fetchFeed: async () => feedMed(...manga.map((s) => rad(s, { qty: 50 }))),
      listAosom: async () => manga.map((s) => mappning(s)),
      listWixPriser: async () => wixPriser(
        Object.fromEntries(manga.map((s) => [`wix-${s}`, BASPRIS])),
      ),
      lasLagerposter: async (ids) => {
        lasningar.push(ids);
        return ids.map((id) => ({ id: `inv-${id}`, revision: "1", productId: id, quantity: 0 }));
      },
      skrivLager: async (u) => {
        skrivningar.push(u.length);
        return { lyckade: u.map((x) => x.id), misslyckade: [] };
      },
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.lagerUppdaterade).toBe(50);
    expect(lasningar).toHaveLength(1);
    expect(lasningar[0]).toHaveLength(50);
    expect(skrivningar).toEqual([50]);
  });

  it("☠️ ett radfel fäller BARA sin produkt — de andra mappningarna skrivs", async () => {
    // Hela skälet till att skrivningen svarar per rad. Med ett aggregerat svar
    // hade en enda revisionskonflikt antingen fällt hela tuggan eller bokförts
    // på fel produkt — och "Wix före mappningen" är en garanti PER PRODUKT.
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 }), rad("B-2", { qty: 50 })),
      skrivLager: async (u) => ({
        lyckade: u.filter((x) => x.id !== "inv-wix-A-1").map((x) => x.id),
        misslyckade: u
          .filter((x) => x.id === "inv-wix-A-1")
          .map((x) => ({ id: x.id, fel: "INVALID_REVISION" })),
      }),
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.misslyckade).toBe(1);
    expect(s.errors[0]).toEqual({ sku: "A-1", error: "INVALID_REVISION" });
    expect(s.lagerUppdaterade).toBe(1);
    expect(sparade.map((m) => m.supplierProductId)).toEqual(["aosom:B-2"]);
  });

  it("☠️ en produkt med FLERA lagerrader skrivs bara om ALLA går igenom", async () => {
    // Halvskrivet lager är svårare att upptäcka än orört: mappningen hade
    // sagt "synkad" medan en variant stod kvar på gammalt saldo.
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listAosom: async () => [mappning("A-1")],
      lasLagerposter: async (ids) =>
        ids.flatMap((id) => [
          { id: `inv-${id}-a`, revision: "1", productId: id, quantity: 0 },
          { id: `inv-${id}-b`, revision: "1", productId: id, quantity: 0 },
        ]),
      skrivLager: async (u) => ({
        lyckade: u.filter((x) => x.id.endsWith("-a")).map((x) => x.id),
        misslyckade: u.filter((x) => x.id.endsWith("-b")).map((x) => ({ id: x.id, fel: "föll" })),
      }),
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.misslyckade).toBe(1);
    expect(s.lagerUppdaterade).toBe(0);
    expect(sparade).toHaveLength(0);
  });

  it("☠️ en produkt UTAN lagerrader räknas — och stämplas INTE som synkad", async () => {
    // Den gamla vägen svarade tyst `return` här och bokförde ändå produkten
    // som synkad, för alltid. Nionde gången samma klass: ett svar utan fel är
    // inget kvitto.
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listAosom: async () => [mappning("A-1")],
      lasLagerposter: async () => [],
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.utanLagerrader).toBe(1);
    expect(s.lagerUppdaterade).toBe(0);
    expect(sparade).toHaveLength(0);
  });

  it("ett läsfel bokförs på varje drabbad produkt, inte som ett tyst hopp", async () => {
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 }), rad("B-2", { qty: 50 })),
      lasLagerposter: async () => { throw new Error("Wix svarade 503"); },
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.misslyckade).toBe(2);
    expect(s.errors.every((e) => e.error.includes("503"))).toBe(true);
    expect(sparade).toHaveLength(0);
  });

  it("☠️ `limit` är EXAKT — tuggan kapas mot det som återstår", async () => {
    // Utan kapningen hade `limit: 1` skrivit hela den första tuggan. `limit`
    // finns för att hålla en serverless-rutt innanför sina 300 sekunder.
    const manga = Array.from({ length: 30 }, (_, i) => `P-${String(i).padStart(3, "0")}`);
    const { d } = deps({
      fetchFeed: async () => feedMed(...manga.map((s) => rad(s, { qty: 50 }))),
      listAosom: async () => manga.map((s) => mappning(s)),
      listWixPriser: async () => wixPriser(
        Object.fromEntries(manga.map((s) => [`wix-${s}`, BASPRIS])),
      ),
    });

    const s = await runAosomSync(d, { dryRun: false, limit: 3 });

    expect(s.lagerUppdaterade).toBe(3);
    expect(s.granskade).toBe(3);
    expect(s.stoppedBy).toBe("limit");
    expect(s.cursor).toBe("P-002");
  });

  it("⚠️ lagerDrift MÄTS men åtgärdas inte — butikens saldo mot bokföringens", async () => {
    // Samma frågeställning som `jamforelsePris` byggdes för på priset. Talet
    // är medvetet bara mätt: att byta facit vore en beteendeändring med hela
    // katalogen som blast-radie.
    const { d } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 }), rad("B-2", { qty: 50 })),
      listAosom: async () => [
        { ...mappning("A-1"), aosomSyncedQty: 9 },
        { ...mappning("B-2"), aosomSyncedQty: 4 },
      ],
      // Butiken säger 9 för A-1 (stämmer) och 0 för B-2 (drivit isär).
      lasLagerposter: async (ids) =>
        ids.map((id) => ({
          id: `inv-${id}`,
          revision: "1",
          productId: id,
          quantity: id === "wix-A-1" ? 9 : 0,
        })),
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.lagerDrift).toBe(1);
  });

  it("torrkörningen LÄSER lagret men skriver inget", async () => {
    // En torrkörning ska säga sanningen om vad en skarp skulle göra, och
    // `utanLagerrader` går inte att veta utan att titta. Läsningar ändrar
    // ingenting.
    let last = 0;
    let skrivet = 0;
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listAosom: async () => [mappning("A-1")],
      lasLagerposter: async (ids) => {
        last++;
        return ids.map((id) => ({ id: `inv-${id}`, revision: "1", productId: id, quantity: 0 }));
      },
      skrivLager: async (u) => { skrivet++; return { lyckade: u.map((x) => x.id), misslyckade: [] }; },
    });

    const s = await runAosomSync(d, { dryRun: true });

    expect(last).toBe(1);
    expect(skrivet).toBe(0);
    expect(sparade).toHaveLength(0);
    expect(s.lagerUppdaterade).toBe(1);
  });

  it("☠️ skrevs bara PRISET stämplas inte aosomSyncedQty", async () => {
    // Annars hade nästa körning trott att saldot redan speglats.
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { wholesaleEur: 60 })),
      // aosomSyncedQty stämmer redan, så bara priset vill skrivas.
      listAosom: async () => [{ ...mappning("A-1"), aosomSyncedQty: synligtSaldo(rad("A-1").qty) }],
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.lagerUppdaterade).toBe(0);
    expect(s.prisUppdaterade).toBe(1);
    expect(sparade[0].aosomSyncedQty).toBe(synligtSaldo(rad("A-1").qty));
  });
});

describe("prisLast — låst pris", () => {
  // ☠️ VARFÖR LÅSET FINNS. Synken tillämpar husets regel (1,20 × landedCostSek)
  // på varje Aosom-rad var sjätte timme. Det är rätt för sortimentet i stort,
  // men en rad kan ha ett pris som satts av något annat än kostnaden — t.ex.
  // kontorsstolen f13cd415 (2026-09-05), som stod på 1 299 kr som
  // AliExpress-vara och efter ommappningen till Aosom hade fått 1 099 kr av
  // regeln. Sänkningen kom av att vi bytte LEVERANTÖR, inte av att marknaden
  // rört sig, och kunderna betalar redan 1 299.
  //
  // Utan låset finns ingen väg dit: nästa körning skriver tillbaka regelpriset
  // och det ser ut som om ändringen "inte tog".

  /** Butikens pris ligger 200 kr under regelns — utan lås SKA synken skriva. */
  const LÅGT = BASPRIS - 200;

  it("skriver INTE priset på en låst rad", async () => {
    const { d, priser } = deps({
      listAosom: async () => [mappning("A-1", { prisLast: true }), mappning("B-2")],
      listWixPriser: async () => wixPriser({ "wix-A-1": LÅGT, "wix-B-2": LÅGT }),
    });
    const s = await runAosomSync(d, { dryRun: false });

    // Bara den olåsta raden fick sitt pris skrivet.
    expect(priser.map((p) => p.id)).toEqual(["wix-B-2"]);
    expect(s.prisUppdaterade).toBe(1);
  });

  it("KONTROLL: samma fixtur utan lås skriver båda priserna", async () => {
    // Utan den här raden bevisar testet ovan ingenting — en tom prislista ser
    // likadan ut vare sig grinden fungerar eller fixturen är fel byggd.
    const { d, priser } = deps({
      listAosom: async () => [mappning("A-1"), mappning("B-2")],
      listWixPriser: async () => wixPriser({ "wix-A-1": LÅGT, "wix-B-2": LÅGT }),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(priser.map((p) => p.id).sort()).toEqual(["wix-A-1", "wix-B-2"]);
    expect(s.prisUppdaterade).toBe(2);
  });

  it("☠️ lagret synkas ÄNDÅ — låset rör bara priset", async () => {
    // Att sluta spegla saldot hade betytt att vi säljer något vi inte har, och
    // det är ett kundfel medan ett oförändrat pris inte är det.
    const { d, lager } = deps({
      listAosom: async () => [mappning("A-1", { prisLast: true })],
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listWixPriser: async () => wixPriser({ "wix-A-1": LÅGT }),
    });
    await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([{ id: "wix-A-1", antal: 50 - LAGER_BUFFERT }]);
  });

  it("⚠️ låsta rader RÄKNAS, de hoppas inte tyst över", async () => {
    // Ett låst pris slutar följa kostnaden — stiger Aosoms frakt äts marginalen
    // tyst. Talet i summeringen är det som gör låset synligt igen.
    const { d } = deps({
      listAosom: async () => [mappning("A-1", { prisLast: true }), mappning("B-2")],
      listWixPriser: async () => wixPriser({ "wix-A-1": LÅGT, "wix-B-2": LÅGT }),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.prisLasta).toBe(1);
    expect(s.granskade).toBe(2);
  });

  it("☠️ en låst rad hamnar ALDRIG i varningar", async () => {
    // Grinden ligger FÖRE uträkningen med flit. Ett pris vi ändå inte tänker
    // skriva ska inte kunna larma för ett hopp som aldrig skulle blivit av —
    // ett falsklarm som alltid fyrar lär mottagaren att sluta läsa, och då är
    // även det äkta larmet borta.
    const LÅNGT_BORT = BASPRIS * 3; // > MAX_PRISANDRING_PCT åt endera hållet
    const låst = deps({
      listAosom: async () => [mappning("A-1", { prisLast: true })],
      listWixPriser: async () => wixPriser({ "wix-A-1": LÅNGT_BORT }),
    });
    const s = await runAosomSync(låst.d, { dryRun: false });
    expect(s.varningar).toEqual([]);
    expect(s.prisLasta).toBe(1);

    // KONTROLL: utan låset ÄR det en varning — annars mäter testet ingenting.
    const olåst = deps({
      listAosom: async () => [mappning("A-1")],
      listWixPriser: async () => wixPriser({ "wix-A-1": LÅNGT_BORT }),
    });
    const s2 = await runAosomSync(olåst.d, { dryRun: false });
    expect(s2.varningar).toHaveLength(1);
    expect(Math.abs(s2.varningar[0].andringPct)).toBeGreaterThan(MAX_PRISANDRING_PCT);
  });

  it("låset gäller BARA sin egen rad", async () => {
    const { d, priser } = deps({
      listAosom: async () => [mappning("A-1", { prisLast: true }), mappning("B-2", { prisLast: false })],
      listWixPriser: async () => wixPriser({ "wix-A-1": LÅGT, "wix-B-2": LÅGT }),
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(priser).toHaveLength(1);
    expect(priser[0].id).toBe("wix-B-2");
    expect(s.prisLasta).toBe(1);
  });
});
