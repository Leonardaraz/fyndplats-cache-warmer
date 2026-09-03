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

function deps(over: Partial<AosomSyncDeps> = {}) {
  const lager: { id: string; antal: number }[] = [];
  const priser: { id: string; pris: number; kostnad: number; variant: { wixVariantId?: string; sku?: string } }[] = [];
  const sparade: ProductMappingRecord[] = [];
  const bas: AosomSyncDeps = {
    fetchFeed: async () => feedMed(rad("A-1"), rad("B-2")),
    listWixPriser: async () => wixPriser(),
    listAosom: async () => [mappning("A-1"), mappning("B-2")],
    setStock: async (id, _sku, antal) => { lager.push({ id, antal }); },
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
      setStock: async () => { throw new Error("Wix svarade 500"); },
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(s.misslyckade).toBe(1);
    expect(sparade).toHaveLength(0);
  });

  it("ett fel på en produkt stoppar inte de andra", async () => {
    const { d } = deps({
      setStock: async (id) => { if (id === "wix-A-1") throw new Error("Wix svarade 500"); },
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
