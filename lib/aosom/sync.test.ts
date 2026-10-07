import { describe, it, expect } from "vitest";
import {
  runAosomSync,
  synligtSaldo,
  landadKostnadSek,
  medSaldaAvdragna,
  vantarPaFlodet,
  NYSS_BESTALLD_MS,
  planeraProdukt,
  LAGER_BUFFERT,
  MIN_FEED_RADER,
  MAX_PRISANDRING_PCT,
  jamforelsePris,
  aterkomnaLagerrader,
  type AosomSyncDeps,
  type SaldOrderrad,
} from "./sync";
import type { RestockUtskick } from "../restock/notify";
import { MIN_WIX_PRODUKTER, type WixProduktPris } from "../wix/v3-products";
import type { AosomRow } from "./feed";
import type { ProductMappingRecord } from "../store";
import type { PricingRules } from "../import/types";
import { computePriceWithRules } from "../import/pricing";

const FX = { eurToSek: 11.1, usdToSek: 10.5 };

/**
 * Synliga saldon för fixturens tal: standardraden har 50, och de andra
 * testerna använder 13, 60 och 125. Räknas ur `LAGER_BUFFERT`, så att testerna
 * mäter samma sak vad bufferten än är — den var 3 fram till 2026-10-01, och
 * testerna bar då talen 47, 10, 57 och 122 inskrivna.
 */
const S50 = synligtSaldo(50);
const S13 = synligtSaldo(13);
const S60 = synligtSaldo(60);
const S125 = synligtSaldo(125);

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
    // Raden så som den står i lagret när synken ska stämpla. Standard: samma
    // rad som körningen läste, alltså ingenting har hänt under körningen.
    lasMappning: async (id) => (await bas.listAosom()).find((m) => m.wixProductId === id) ?? null,
    // Inga sålda orderrader, om testet inte säger annat.
    lasSaldaOrderrader: async () => [],
    fx: FX,
    rules: REGLER,
    ...over,
  };
  return { d: bas, lager, priser, sparade };
}

describe("synligtSaldo", () => {
  it("☠️ ingen buffert: Aosoms saldo visas som det är (Leonard 2026-10-06)", () => {
    // "Ta bort den där 1 kvar bufferten." Har Aosom 1 kvar visar vi 1, inte
    // "Slutsåld". Det som hindrar att samma enhet säljs två gånger är
    // `medSaldaAvdragna`, inte bufferten.
    expect(LAGER_BUFFERT).toBe(0);
    expect(synligtSaldo(1)).toBe(1);
    expect(synligtSaldo(2)).toBe(2);
    expect(synligtSaldo(50)).toBe(50);
  });

  it("drar av bufferten", () => {
    expect(synligtSaldo(50)).toBe(50 - LAGER_BUFFERT);
    expect(synligtSaldo(100)).toBe(100 - LAGER_BUFFERT);
  });

  it("saldon på eller under bufferten visas som slutsålt", () => {
    for (let q = 0; q <= LAGER_BUFFERT; q++) expect(synligtSaldo(q)).toBe(0);
    expect(synligtSaldo(0)).toBe(0);
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
      // Oförändrat betyder att BUTIKEN också står på stämpelns tal. Skiljer de
      // sig åt är det drift, och drift skrivs (se "lagerdrift" nedan).
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, 50 - LAGER_BUFFERT)),
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
    // ☠️ Det publika id:t följer med — det är vad workflowen skriver ut.
    // Artikelnumret stannar i svaret och når aldrig den publika loggen.
    expect(s.varningar[0].wixProductId).toBe("wix-A-1");
    expect(Math.abs(s.varningar[0].andringPct)).toBeGreaterThan(MAX_PRISANDRING_PCT);
  });

  describe("godkannPrisandring — en människa släpper taket för en produkt (2026-09-30)", () => {
    // Gunghästens rosa: 1 199 kr i butiken, 699 kr enligt husets regel. Hoppet
    // är −42 %, taket stoppar det, och Leonard godkände sänkningen.
    const hopp = () =>
      deps({
        fetchFeed: async () => feedMed(rad("A-1", { wholesaleEur: 400 })),
        listAosom: async () => [mappning("A-1")],
      });

    it("ett godkänt hopp skrivs och räknas för sig", async () => {
      const { d, priser, sparade } = hopp();
      const s = await runAosomSync(d, { dryRun: false, godkannPrisandring: new Set(["wix-A-1"]) });
      expect(priser).toHaveLength(1);
      expect(s.varningar).toHaveLength(0);
      expect(s.godkandaHopp).toEqual([
        expect.objectContaining({ wixProductId: "wix-A-1", fran: BASPRIS, till: priser[0].pris }),
      ]);
      expect(Math.abs(s.godkandaHopp[0].andringPct)).toBeGreaterThan(MAX_PRISANDRING_PCT);
      // Samma skrivväg som ett vanligt pris: mappningen följer butiken.
      expect(sparade[0].variants[0].grossSek).toBe(priser[0].pris);
    });

    it("☠️ KONTROLL: ett godkännande för en ANNAN produkt släpper inte taket", async () => {
      const { d, priser } = hopp();
      const s = await runAosomSync(d, { dryRun: false, godkannPrisandring: new Set(["wix-B-2"]) });
      expect(priser).toHaveLength(0);
      expect(s.varningar).toHaveLength(1);
      expect(s.godkandaHopp).toEqual([]);
    });

    it("☠️ ett godkänt hopp bär aldrig artikelnumret — raden skrivs i en publik logg", async () => {
      const { d } = hopp();
      const s = await runAosomSync(d, { dryRun: true, godkannPrisandring: new Set(["wix-A-1"]) });
      expect(s.godkandaHopp).toHaveLength(1);
      expect(Object.values(s.godkandaHopp[0])).not.toContain("A-1");
      expect(Object.keys(s.godkandaHopp[0]).sort()).toEqual(["andringPct", "fran", "till", "wixProductId"]);
    });

    it("ett hopp under taket räknas inte som godkänt, även när produkten är godkänd", async () => {
      const { d, priser } = deps({
        fetchFeed: async () => feedMed(rad("A-1", { wholesaleEur: 45 })),
        listAosom: async () => [mappning("A-1")],
      });
      const s = await runAosomSync(d, { dryRun: false, godkannPrisandring: new Set(["wix-A-1"]) });
      expect(priser).toHaveLength(1);
      expect(s.godkandaHopp).toEqual([]);
    });
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
      // A-1 är synkad i butiken också, inte bara i stämpeln.
      lasLagerposter: async (ids) =>
        ids.map((id) => lagerpost(id, id === "wix-A-1" ? 50 - LAGER_BUFFERT : 0)),
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
      // I fas betyder att flödet, stämpeln OCH butiken säger samma tal.
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, iFas)),
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
    // wixProductId är det workflowen skriver ut — artikelnumret når aldrig loggen.
    expect(s.errors[0]).toEqual({ sku: "A-1", wixProductId: "wix-A-1", error: "INVALID_REVISION" });
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

  it("lagerDrift räknar butikens saldo mot stämpeln — en rad som ändå skrivs är ingen extra skrivning", async () => {
    // Samma frågeställning som `jamforelsePris` byggdes för på priset. Båda
    // raderna vill skrivas redan för att flödet (47) skiljer sig från
    // stämpeln, så driften lägger inte till någon skrivning här — se
    // "lagerdrift" nedan för raden där den gör det.
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
    expect(s.lagerUppdaterade).toBe(2);
    expect(s.lagerDriftRattade).toBe(0);
    expect(s.lagerDriftProdukter).toEqual([]);
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
      // aosomSyncedQty stämmer redan, i stämpeln och i butiken, så bara
      // priset vill skrivas.
      listAosom: async () => [{ ...mappning("A-1"), aosomSyncedQty: synligtSaldo(rad("A-1").qty) }],
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, synligtSaldo(rad("A-1").qty))),
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

describe("☠️ ej skeppbar rad — fraktsentinelen gatas i SYNKEN, inte bara vid importen", () => {
  // Bakgrund (2026-09-10): `isShippableToSe` hade fem anropare och synken var
  // inte en av dem. Massagebänken ‹REDIGERAT› importerades med fraktandel
  // 0,292 — helt normal frakt — och bar sedan Aosoms "skickas inte hit"-värde
  // 999,90 €. Synken speglade saldot vidare, och sidan låg publicerad och
  // köpbar för en vara vi inte kunde expediera. Samma mönster som den döda
  // AE-listningen: importen gatade, synken gjorde det inte.
  const SENTINEL = 999.9;

  it("nollar saldot och skriver INGET pris", async () => {
    const { d, lager, priser } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { seFreightEur: SENTINEL }), rad("B-2")),
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.ejSkeppbara).toBe(1);
    // Saldot nollas — sidan ligger KVAR (samma SEO-beslut som döda AE-listningar).
    expect(lager).toContainEqual({ id: "wix-A-1", antal: 0 });
    // ☠️ Och inget pris. `landedCostEur` adderar sentinelfrakten rakt av, så
    // regelpriset blir tiotusentals kronor på en vara som kostar 40 €.
    expect(priser.map((p) => p.id)).not.toContain("wix-A-1");
  });

  it("☠️ hamnar INTE i `varningar` — det är ett känt tillstånd, inte ett larm", async () => {
    // Det här är testet som fäller om grinden tas bort: utan den räknas
    // sentinelfrakten in, hoppet spränger MAX_PRISANDRING_PCT och raden dyker
    // upp som en varning varje natt. Ett falsklarm som alltid fyrar lär
    // mottagaren att sluta läsa — samma argument som bakom `regelGäller`.
    const { d } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { seFreightEur: SENTINEL }), rad("B-2")),
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.varningar).toHaveLength(0);
  });

  it("☠️ räknas INTE som slutsåld — 'Aosom har slut' och 'skickas inte hit' är olika besked", async () => {
    const { d } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { seFreightEur: SENTINEL }), rad("B-2")),
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.ejSkeppbara).toBe(1);
    expect(s.slutsalda).toBe(0);
  });

  it("en verkligt slutsåld rad räknas som slutsåld, inte som ej skeppbar", async () => {
    // Kontrollen åt andra hållet: de två räknarna får inte glida ihop.
    const { d } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 0 }), rad("B-2")),
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.slutsalda).toBe(1);
    expect(s.ejSkeppbara).toBe(0);
  });

  it("⚠️ en NORMAL frakt rörs inte av grinden — den får inte vara för bred", async () => {
    // Utan den här kontrollen kunde grinden vara skriven tvärtom och alla
    // tester ovan hade ändå gått igenom.
    const { d, lager, priser } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { seFreightEur: 20 }), rad("B-2")),
      listWixPriser: async () => wixPriser({ "wix-A-1": BASPRIS - 100 }),
    });

    const s = await runAosomSync(d, { dryRun: false });

    expect(s.ejSkeppbara).toBe(0);
    expect(lager).toContainEqual({ id: "wix-A-1", antal: 50 - LAGER_BUFFERT });
    expect(priser.map((p) => p.id)).toContain("wix-A-1");
  });
});

describe("konkurrentregeln — pris mot dealproffsen (2026-09-15)", () => {
  // ☠️ VARFÖR REGELN LEVER HÄR. Synken räknar om varje Aosom-pris var sjätte
  // timme, så ett handsatt pris är borta till kvällen och 900 lås hade slutat
  // följa kostnaden. Regeln ger raden ett MÅL i stället: strax under
  // dealproffsen, aldrig under husets regelpris, aldrig över 1,50 × landad.
  // Se lib/pricing/konkurrentregel.ts.

  const farskt = (pris: number) => ({ pris, hamtad: new Date().toISOString() });
  const gammalt = (pris: number) => ({
    pris,
    hamtad: new Date(Date.now() - 10 * 86_400_000).toISOString(),
  });

  it("lyfter priset mot strax under dealproffsen på en rad med grupp", async () => {
    const { d, priser } = deps({
      listAosom: async () => [
        mappning("A-1", { prisgrupp: "A", konkurrent: farskt(1200) }),
        mappning("B-2"),
      ],
    });
    const s = await runAosomSync(d, { dryRun: false });

    // BASPRIS är 999; 2 % under 1 200 är 1 176 → charm9 nedåt → 1 169.
    expect(priser).toEqual([
      expect.objectContaining({ id: "wix-A-1", pris: 1169 }),
    ]);
    expect(s.prisUppdaterade).toBe(1);
    expect(s.konkurrentMal).toBe(1);
    expect(s.varningar).toEqual([]);
  });

  it("☠️ KONTROLL: samma konkurrentpris UTAN grupp ändrar ingenting", async () => {
    // Opt-in per rad: att deploya regeln får inte röra ett enda pris.
    const { d, priser } = deps({
      listAosom: async () => [mappning("A-1", { konkurrent: farskt(1200) }), mappning("B-2")],
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(priser).toHaveLength(0);
    expect(s.konkurrentMal + s.konkurrentTak + s.konkurrentGolv + s.konkurrentFrysta).toBe(0);
  });

  it("☠️ ett gammalt konkurrentpris FRYSER raden — inget skrivs, ingen varning, och det räknas", async () => {
    // Butiken står på ett lyft pris från förra veckan. Hade regeln fallit
    // tillbaka på golvet hade synken sänkt priset 170 kr för att jämförelsen
    // stod still.
    const { d, priser } = deps({
      listAosom: async () => [mappning("A-1", { prisgrupp: "A", konkurrent: gammalt(1200) })],
      listWixPriser: async () => wixPriser({ "wix-A-1": 1169 }),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(priser).toHaveLength(0);
    expect(s.konkurrentFrysta).toBe(1);
    expect(s.varningar).toEqual([]);
  });

  it("☠️ KONTROLL: samma rad med FÄRSKT pris skrivs — frysningen är åldern, inte fixturen", async () => {
    const { d, priser } = deps({
      listAosom: async () => [mappning("A-1", { prisgrupp: "A", konkurrent: farskt(1300) })],
      listWixPriser: async () => wixPriser({ "wix-A-1": 1169 }),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(priser.map((p) => p.id)).toEqual(["wix-A-1"]);
    expect(s.konkurrentFrysta).toBe(0);
    expect(s.konkurrentMal + s.konkurrentTak).toBe(1);
  });

  it("deras pris under vårt golv → vi står kvar på regelpriset, och raden räknas som golv", async () => {
    const { d, priser } = deps({
      listAosom: async () => [mappning("A-1", { prisgrupp: "A", konkurrent: farskt(900) })],
    });
    const s = await runAosomSync(d, { dryRun: false });

    // Butiken står redan på BASPRIS = regelpriset → inget att skriva.
    expect(priser).toHaveLength(0);
    expect(s.konkurrentGolv).toBe(1);
  });

  it("målet över taket → taket gäller, och hoppet håller sig under MAX_PRISANDRING_PCT", async () => {
    // Landad 832,50 → tak 1 248,75 → charm9 nedåt 1 239. Deras 2 000 hade gett 1 960.
    const { d, priser } = deps({
      listAosom: async () => [mappning("A-1", { prisgrupp: "A", konkurrent: farskt(2000) })],
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(priser).toEqual([expect.objectContaining({ id: "wix-A-1", pris: 1239 })]);
    expect(s.konkurrentTak).toBe(1);
    expect(s.varningar).toEqual([]);
    expect((1239 - BASPRIS) / BASPRIS * 100).toBeLessThan(MAX_PRISANDRING_PCT);
  });

  it("grupp B ligger längre under än grupp A", async () => {
    const { d, priser } = deps({
      listAosom: async () => [mappning("A-1", { prisgrupp: "B", konkurrent: farskt(1200) })],
    });
    await runAosomSync(d, { dryRun: false });

    // 5 % under 1 200 är 1 140 → charm9 nedåt → 1 139.
    expect(priser).toEqual([expect.objectContaining({ id: "wix-A-1", pris: 1139 })]);
  });

  it("☠️ prisLast vinner över regeln — ett lås är ett lås", async () => {
    const { d, priser } = deps({
      listAosom: async () => [
        mappning("A-1", { prisLast: true, prisgrupp: "A", konkurrent: farskt(1200) }),
      ],
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(priser).toHaveLength(0);
    expect(s.prisLasta).toBe(1);
    expect(s.konkurrentMal).toBe(0);
  });

  it("lagret synkas ändå på en fryst rad — frysningen rör bara priset", async () => {
    const { d, lager } = deps({
      listAosom: async () => [mappning("A-1", { prisgrupp: "A", konkurrent: gammalt(1200) })],
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
    });
    await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([{ id: "wix-A-1", antal: 50 - LAGER_BUFFERT }]);
  });

  it("torrkörningen räknar samma utfall utan att skriva", async () => {
    const { d, priser } = deps({
      listAosom: async () => [mappning("A-1", { prisgrupp: "A", konkurrent: farskt(1200) })],
    });
    const s = await runAosomSync(d);

    expect(s.dryRun).toBe(true);
    expect(priser).toHaveLength(0);
    expect(s.konkurrentMal).toBe(1);
  });
});

// ── FÄRGSAMMANSLAGNA SIDOR (2026-09-27) ────────────────────────────────────
// En sammanslagen sida är EN Wix-produkt med en Aosom-artikel per färg. Varje
// färg har sitt eget saldo och sitt eget pris hos Aosom. Den gamla vägen läste
// radens artikel för hela sidan och hade skrivit den första färgens saldo på
// båda — alltså sålt en färg Aosom inte har. Se lib/aosom/artiklar.ts.

describe("färgsammanslagna sidor — en artikel per variant", () => {
  const farskt = (pris: number) => ({ pris, hamtad: new Date().toISOString() });

  /** Svart (A-1, radens artikel) och grå (G-7, det pensionerade utkastets). */
  function sammanslagen(over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
    const bas = mappning("A-1");
    const landadGra = landadKostnadSek(rad("G-7"), FX.eurToSek);
    return {
      ...bas,
      wixProductId: "wix-stol",
      variants: [
        {
          ...bas.variants[0],
          sku: "FP-stol-svart",
          wixVariantId: "wixvar-svart",
          choices: { Färg: "Svart" },
          aosomSyncedQty: S50,
        },
        {
          supplierVariantId: "G-7",
          sku: "FP-stol-gra",
          wixVariantId: "wixvar-gra",
          choices: { Färg: "Grå" },
          costUsd: landadGra / FX.usdToSek,
          landedCostSek: landadGra,
          grossSek: BASPRIS,
          aosomSyncedQty: S50,
        },
      ],
      ...over,
    };
  }

  const posterStol = (svart = S50, gra = S50) => [
    { id: "inv-svart", revision: "1", productId: "wix-stol", variantId: "wixvar-svart", quantity: svart },
    { id: "inv-gra", revision: "1", productId: "wix-stol", variantId: "wixvar-gra", quantity: gra },
  ];

  /** Feed: svart 50 i lager (S50 synligt), grå 13 (S13 synligt). */
  function stolDeps(
    over: Partial<AosomSyncDeps> = {},
    feed: AosomRow[] = [rad("A-1"), rad("G-7", { qty: 13 })],
  ) {
    return deps({
      fetchFeed: async () => feedMed(...feed),
      listAosom: async () => [sammanslagen()],
      lasLagerposter: async () => posterStol(),
      lasVariantPriser: async () =>
        new Map([["wix-stol", new Map([["wixvar-svart", BASPRIS], ["wixvar-gra", BASPRIS]])]]),
      ...over,
    });
  }

  it("☠️ varje färg får sitt EGET saldo — aldrig radens", async () => {
    const { d, lager, sparade } = stolDeps();
    const s = await runAosomSync(d, { dryRun: false });

    // Svart står redan på S50. Grå har 13 hos Aosom → S13 synligt.
    expect(lager).toEqual([{ id: "gra", antal: S13 }]);
    expect(s.flerartikelrader).toBe(1);
    expect(s.lagerUppdaterade).toBe(1);
    expect(s.okandaVarianter).toBe(0);
    expect(sparade).toHaveLength(1);
    expect(sparade[0].variants.map((v) => v.aosomSyncedQty)).toEqual([S50, S13]);
    // Radens tal är sidans totala saldo.
    expect(sparade[0].aosomSyncedQty).toBe(S50 + S13);
  });

  it("en färg som försvunnit ur feeden nollas — den andra står kvar", async () => {
    const { d, lager } = stolDeps({}, [rad("A-1")]);
    const s = await runAosomSync(d, { dryRun: false });
    expect(lager).toEqual([{ id: "gra", antal: 0 }]);
    expect(s.urFeeden).toBe(1);
  });

  it("☠️ priset skrivs per variant och mot VARIANTENS pris i butiken", async () => {
    const dyrare = rad("G-7", { qty: 13, wholesaleEur: 60 });
    const vantat = computePriceWithRules(
      landadKostnadSek(dyrare, FX.eurToSek) / FX.usdToSek,
      REGLER,
      null,
    ).grossSek;
    expect(vantat).not.toBe(BASPRIS);

    const { d, priser, sparade } = stolDeps({}, [rad("A-1"), dyrare]);
    const s = await runAosomSync(d, { dryRun: false });

    expect(priser).toEqual([
      expect.objectContaining({ id: "wix-stol", pris: vantat, variant: { wixVariantId: "wixvar-gra", sku: "FP-stol-gra" } }),
    ]);
    expect(s.prisUppdaterade).toBe(1);
    expect(sparade[0].variants[1].grossSek).toBe(vantat);
    expect(sparade[0].variants[1].landedCostSek).toBe(landadKostnadSek(dyrare, FX.eurToSek));
    // Den svarta färgens pris och kostnad är orörda.
    expect(sparade[0].variants[0].grossSek).toBe(BASPRIS);
  });

  it("☠️ ett godkänt hopp sänker den ENA färgen — och utan godkännande står taket kvar", async () => {
    // Samma form som gunghästen: en färg ligger långt över husets regel.
    const billig = rad("G-7", { qty: 13, wholesaleEur: 5, seFreightEur: 5 });
    const utan = stolDeps({}, [rad("A-1"), billig]);
    const s1 = await runAosomSync(utan.d, { dryRun: false });
    expect(utan.priser).toHaveLength(0);
    expect(s1.varningar).toEqual([expect.objectContaining({ wixProductId: "wix-stol" })]);
    expect(s1.varningar[0].andringPct).toBeLessThan(-MAX_PRISANDRING_PCT);

    const med = stolDeps({}, [rad("A-1"), billig]);
    const s2 = await runAosomSync(med.d, { dryRun: false, godkannPrisandring: new Set(["wix-stol"]) });
    expect(med.priser).toEqual([
      expect.objectContaining({ id: "wix-stol", variant: { wixVariantId: "wixvar-gra", sku: "FP-stol-gra" } }),
    ]);
    expect(s2.varningar).toEqual([]);
    expect(s2.godkandaHopp).toEqual([expect.objectContaining({ wixProductId: "wix-stol", fran: BASPRIS })]);
    // Den svarta färgen rörs inte.
    expect(med.sparade[0].variants[0].grossSek).toBe(BASPRIS);
  });

  it("☠️ konkurrentpriset gäller bara radens EGEN artikel — den andra färgen får husets regel", async () => {
    const { d, priser } = stolDeps({
      listAosom: async () => [sammanslagen({ prisgrupp: "A", konkurrent: farskt(1200) })],
    });
    const s = await runAosomSync(d, { dryRun: false });

    // Samma tal som på en vanlig rad (se konkurrentregelns test): 1 169 på den
    // svarta. Den grå står kvar på regelpriset, alltså skrivs ingenting där.
    expect(priser).toEqual([
      expect.objectContaining({ pris: 1169, variant: { wixVariantId: "wixvar-svart", sku: "FP-stol-svart" } }),
    ]);
    expect(s.konkurrentMal).toBe(1);
  });

  it("☠️ utan priser per variant skrivs inget pris på sidan — och det syns", async () => {
    const { d, priser, lager } = stolDeps(
      { lasVariantPriser: undefined },
      [rad("A-1", { wholesaleEur: 60 }), rad("G-7", { qty: 13, wholesaleEur: 60 })],
    );
    const s = await runAosomSync(d, { dryRun: false });
    expect(priser).toEqual([]);
    expect(s.utanWixPris).toBe(1);
    expect(s.prislistaFel).toMatch(/per variant/);
    // Lagret synkas ändå — ett läsfel i prisdelen får inte stoppa det.
    expect(lager).toEqual([{ id: "gra", antal: S13 }]);
  });

  it("☠️ ett prisfel på den ena färgen stämplar ändå den andras nya pris", async () => {
    const feed = [rad("A-1", { wholesaleEur: 60 }), rad("G-7", { qty: 13, wholesaleEur: 60 })];
    const vantat = computePriceWithRules(
      landadKostnadSek(feed[0], FX.eurToSek) / FX.usdToSek,
      REGLER,
      null,
    ).grossSek;
    const { d, sparade } = stolDeps({
      setPrice: async (_id, variant) => {
        if (variant.wixVariantId === "wixvar-gra") throw new Error("Wix svarade 500");
      },
    }, feed);
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.misslyckade).toBe(1);
    expect(s.prisUppdaterade).toBe(1);
    expect(sparade).toHaveLength(1);
    expect(sparade[0].variants[0].grossSek).toBe(vantat);
    expect(sparade[0].variants[1].grossSek).toBe(BASPRIS);
  });

  it("lagerdrift mäts per variant", async () => {
    const { d } = stolDeps({ lasLagerposter: async () => posterStol(S50, 30) });
    const s = await runAosomSync(d);
    expect(s.lagerDrift).toBe(1);
  });

  it("torrkörningen räknar sidan utan att skriva", async () => {
    const { d, lager, priser, sparade } = stolDeps();
    const s = await runAosomSync(d);
    expect([lager, priser, sparade]).toEqual([[], [], []]);
    expect(s.lagerUppdaterade).toBe(1);
    expect(s.flerartikelrader).toBe(1);
  });

  it("?sku= träffar sidan på den andra färgens artikel också", async () => {
    const { d } = stolDeps();
    const s = await runAosomSync(d, { onlySkus: ["G-7"] });
    expect(s.granskade).toBe(1);
  });

  describe("☠️ okända varianter — Wix har en färg som mappningen inte känner till", () => {
    // Läget efter en sammanslagning där Wix fick den nya färgen men mappningen
    // aldrig skrevs. Den gamla vägen skrev radens saldo på varje lagerrad.

    const tvaPoster = async () => [
      { id: "inv-wix-A-1", revision: "1", productId: "wix-A-1", variantId: "wixvar-A-1", quantity: 0 },
      { id: "inv-ny", revision: "1", productId: "wix-A-1", variantId: "wixvar-ny", quantity: S50 },
    ];

    it("nollas i stället för att få radens saldo — och syns", async () => {
      const { d, lager } = deps({ listAosom: async () => [mappning("A-1")], lasLagerposter: tvaPoster });
      const s = await runAosomSync(d, { dryRun: false });
      expect(lager).toEqual([
        { id: "wix-A-1", antal: S50 },
        { id: "ny", antal: 0 },
      ]);
      expect(s.okandaVarianter).toBe(1);
      expect(s.errors.map((e) => e.error)).toEqual([
        "1 variant(er) i Wix som mappningen inte känner till — deras lager nollas",
      ]);
    });

    it("nollas även när radens eget saldo redan stämmer", async () => {
      const { d, lager } = deps({
        listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 })],
        // Radens egen post står på stämpelns tal: "redan stämmer" i butiken
        // också, inte bara i mappningen.
        lasLagerposter: async () => [
          { id: "inv-wix-A-1", revision: "1", productId: "wix-A-1", variantId: "wixvar-A-1", quantity: S50 },
          { id: "inv-ny", revision: "1", productId: "wix-A-1", variantId: "wixvar-ny", quantity: S50 },
        ],
      });
      await runAosomSync(d, { dryRun: false });
      expect(lager).toEqual([{ id: "ny", antal: 0 }]);
    });

    it("står i torrkörningen också — där ska den upptäckas", async () => {
      const { d, lager } = deps({ listAosom: async () => [mappning("A-1")], lasLagerposter: tvaPoster });
      const s = await runAosomSync(d);
      expect(lager).toEqual([]);
      expect(s.okandaVarianter).toBe(1);
    });

    it("en vanlig rad med EN lagerpost skrivs som förut, vad dess id än är", async () => {
      const { d, lager } = deps({
        listAosom: async () => [mappning("A-1")],
        lasLagerposter: async () => [
          { id: "inv-wix-A-1", revision: "1", productId: "wix-A-1", variantId: "wixvar-annat", quantity: 0 },
        ],
      });
      const s = await runAosomSync(d, { dryRun: false });
      expect(lager).toEqual([{ id: "wix-A-1", antal: S50 }]);
      expect(s.okandaVarianter).toBe(0);
    });

    it("på en sammanslagen sida nollas en tredje, okänd färg", async () => {
      const { d, lager } = stolDeps({
        lasLagerposter: async () => [
          ...posterStol(S50, S13),
          { id: "inv-rod", revision: "1", productId: "wix-stol", variantId: "wixvar-rod", quantity: 5 },
        ],
      });
      const s = await runAosomSync(d, { dryRun: false });
      expect(lager).toEqual([{ id: "gra", antal: S13 }, { id: "rod", antal: 0 }]);
      expect(s.okandaVarianter).toBe(1);
    });
  });

  it("☠️ en tvetydig rad nollar lagret, skriver inget pris och stämplas aldrig", async () => {
    const tvetydig = sammanslagen();
    tvetydig.variants[1] = { ...tvetydig.variants[1], wixVariantId: undefined };
    const { d, lager, priser, sparade } = stolDeps({
      listAosom: async () => [tvetydig],
      lasLagerposter: async () => posterStol(5, 5),
    }, [rad("A-1", { wholesaleEur: 60 }), rad("G-7", { qty: 13 })]);
    const s = await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([{ id: "svart", antal: 0 }, { id: "gra", antal: 0 }]);
    expect(priser).toEqual([]);
    expect(sparade).toEqual([]);
    expect(s.tvetydiga).toBe(1);
    expect(s.errors[0].error).toMatch(/tvetydig/);
    // Skälet namnger aldrig ett artikelnummer — felen går till en publik logg.
    expect(s.errors[0].error).not.toMatch(/A-1|G-7/);
  });
});

// ── LAGERDRIFT: FACIT ÄR BUTIKEN NÄR STÄMPELN LJUGER (2026-09-30) ──────────
// Synken skrev ett saldo när flödets tal skilde sig från mappningens stämpel,
// aldrig när butikens gjorde det. Hundburen 6297606f visade varför det inte
// räcker: sammanslagningen stämplade 90 cm med flödets tal, och synken 03:20
// nollade sedan varianten i butiken som okänd — den hade läst mappningen före
// sammanslagningen. Stämpeln sa "redan skrivet", butiken sa 0, och ingen
// körning rörde varianten igen förrän Aosoms saldo på artikeln ändrades.
// `lagerDrift` räknade den hela tiden (5 av 4 486 i torrkörningen 19:5x UTC).

describe("☠️ lagerdrift — en stämpel som ljuger rättas mot butiken", () => {
  /** Hundburen: 60 cm (radens artikel A-1) och 90 cm (H-9, givarens). */
  function hundbur(): ProductMappingRecord {
    const bas = mappning("A-1");
    const landad90 = landadKostnadSek(rad("H-9"), FX.eurToSek);
    return {
      ...bas,
      wixProductId: "wix-bur",
      variants: [
        {
          ...bas.variants[0],
          sku: "FP-bur-60",
          wixVariantId: "wixvar-60",
          choices: { Storlek: "60 cm" },
          aosomSyncedQty: S50,
        },
        {
          supplierVariantId: "H-9",
          sku: "FP-bur-90",
          wixVariantId: "wixvar-90",
          choices: { Storlek: "90 cm" },
          costUsd: landad90 / FX.usdToSek,
          landedCostSek: landad90,
          grossSek: BASPRIS,
          // Stämplad med flödets tal vid sammanslagningen.
          aosomSyncedQty: S125,
        },
      ],
    };
  }

  /** Butikens saldo per storlek. */
  const posterBur = (cm60: number, cm90: number) => [
    { id: "inv-60", revision: "1", productId: "wix-bur", variantId: "wixvar-60", quantity: cm60 },
    { id: "inv-90", revision: "1", productId: "wix-bur", variantId: "wixvar-90", quantity: cm90 },
  ];

  /** Flödet säger exakt stämplarnas tal: 50 → S50 och 125 → S125 synligt. */
  function burDeps(cm60: number, cm90: number, over: Partial<AosomSyncDeps> = {}) {
    return deps({
      fetchFeed: async () => feedMed(rad("A-1"), rad("H-9", { qty: 125 })),
      listAosom: async () => [hundbur()],
      lasLagerposter: async () => posterBur(cm60, cm90),
      lasVariantPriser: async () =>
        new Map([["wix-bur", new Map([["wixvar-60", BASPRIS], ["wixvar-90", BASPRIS]])]]),
      ...over,
    });
  }

  it("☠️ hundburens 90 cm: stämpeln säger flödets tal, butiken 0 → flödets saldo skrivs", async () => {
    const { d, lager, sparade } = burDeps(S50, 0);
    const s = await runAosomSync(d, { dryRun: false });

    // Bara 90 cm. 60 cm står redan på sitt tal i butiken och rörs inte.
    expect(lager).toEqual([{ id: "90", antal: S125 }]);
    expect(s.lagerDrift).toBe(1);
    expect(s.lagerUppdaterade).toBe(1);
    expect(s.lagerDriftRattade).toBe(1);
    expect(s.lagerDriftProdukter).toEqual(["wix-bur"]);
    expect(s.misslyckade).toBe(0);
    // Stämpeln skrivs om efter den bekräftade skrivningen, per variant.
    expect(sparade).toHaveLength(1);
    expect(sparade[0].variants.map((v) => v.aosomSyncedQty)).toEqual([S50, S125]);
  });

  it("KONTROLL: samma sida där butiken stämmer rörs inte alls", async () => {
    // Utan den här raden bevisar testet ovan ingenting — skrivningen kunde ha
    // kommit av något annat än driften.
    const { d, lager, sparade } = burDeps(S50, S125);
    const s = await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([]);
    expect(sparade).toEqual([]);
    expect(s.lagerDrift).toBe(0);
    expect(s.lagerDriftRattade).toBe(0);
    expect(s.oforandrade).toBe(1);
  });

  it("torrkörningen räknar rättelsen men skriver ingenting", async () => {
    const { d, lager, priser, sparade } = burDeps(S50, 0);
    const s = await runAosomSync(d);

    expect(s.dryRun).toBe(true);
    expect([lager, priser, sparade]).toEqual([[], [], []]);
    expect(s.lagerUppdaterade).toBe(1);
    expect(s.lagerDriftRattade).toBe(1);
    expect(s.lagerDriftProdukter).toEqual(["wix-bur"]);
  });

  it("en vanlig rad som drivit skrivs — en som inte drivit rörs inte", async () => {
    const { d, lager, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 }), rad("B-2", { qty: 50 })),
      listAosom: async () => [
        mappning("A-1", { aosomSyncedQty: S50 }),
        mappning("B-2", { aosomSyncedQty: S50 }),
      ],
      // A-1 har drivit (butiken 0 mot stämpeln S50). B-2 stämmer.
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, id === "wix-A-1" ? 0 : S50)),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([{ id: "wix-A-1", antal: S50 }]);
    expect(sparade.map((m) => m.wixProductId)).toEqual(["wix-A-1"]);
    expect(sparade[0].aosomSyncedQty).toBe(S50);
    expect(s.lagerDrift).toBe(1);
    expect(s.lagerDriftRattade).toBe(1);
    expect(s.lagerDriftProdukter).toEqual(["wix-A-1"]);
    expect(s.oforandrade).toBe(1);
  });

  it("☠️ ett saldo som inte gick att läsa är okänt — ingen drift, ingen skrivning", async () => {
    // Samma hållning som `aterkomnaLagerrader`: okänt är aldrig noll.
    const { d, lager } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 })],
      lasLagerposter: async (ids) => ids.map((id) => ({ id: `inv-${id}`, revision: "1", productId: id })),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([]);
    expect(s.lagerDrift).toBe(0);
    expect(s.lagerDriftRattade).toBe(0);
  });

  it("en okänd variants saldo är ingen drift på raden — den nollas som förut", async () => {
    // Den okända posten ligger FÖRST. Mätningen läste tidigare `poster[0]`,
    // alltså den okända färgens saldo, och hade kallat raden drivande.
    const { d, lager } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 })],
      lasLagerposter: async () => [
        { id: "inv-ny", revision: "1", productId: "wix-A-1", variantId: "wixvar-ny", quantity: 5 },
        { id: "inv-wix-A-1", revision: "1", productId: "wix-A-1", variantId: "wixvar-A-1", quantity: S50 },
      ],
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([{ id: "ny", antal: 0 }]);
    expect(s.okandaVarianter).toBe(1);
    expect(s.lagerDrift).toBe(0);
    expect(s.lagerDriftRattade).toBe(0);
  });

  it("☠️ `limit` är EXAKT även för rättelserna", async () => {
    const manga = ["P-001", "P-002", "P-003"];
    const { d, lager } = deps({
      fetchFeed: async () => feedMed(...manga.map((s) => rad(s, { qty: 50 }))),
      // Alla tre har drivit: stämpeln S50, fixturens butik 0.
      listAosom: async () => manga.map((s) => mappning(s, { aosomSyncedQty: S50 })),
      listWixPriser: async () => wixPriser(
        Object.fromEntries(manga.map((s) => [`wix-${s}`, BASPRIS])),
      ),
    });
    const s = await runAosomSync(d, { dryRun: false, limit: 2 });

    expect(lager.map((l) => l.id)).toEqual(["wix-P-001", "wix-P-002"]);
    expect(s.lagerDriftRattade).toBe(2);
    expect(s.stoppedBy).toBe("limit");
    expect(s.cursor).toBe("P-002");
  });

  it("☠️ en rättelse som föll stämplas inte — nästa körning försöker igen", async () => {
    const { d, sparade } = burDeps(S50, 0, {
      skrivLager: async (u) => ({
        lyckade: [],
        misslyckade: u.map((x) => ({ id: x.id, fel: "INVALID_REVISION" })),
      }),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.misslyckade).toBe(1);
    expect(s.lagerUppdaterade).toBe(0);
    expect(s.lagerDriftRattade).toBe(0);
    expect(sparade).toEqual([]);
  });

  it("⚠️ en försäljning räknas som drift — flödets saldo skrivs tillbaka", async () => {
    // Wix drar av saldot vid köp: butiken ett under stämpeln, som säger flödets
    // tal. Regeln skiljer inte en försäljning från en nollning, så avdraget
    // skrivs över vid varje körning tills Aosoms flöde visar vår order. Det som
    // skyddar sålda men ännu inte beställda enheter är avdraget för väntande
    // orderrader (`medSaldaAvdragna`, testerna nedan) — här finns inga, alltså
    // skrivs flödets tal. Se CLAUDE.md; testet låser beteendet så att en
    // ändring av det blir ett beslut.
    const { d, lager } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 })],
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, S50 - 1)),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([{ id: "wix-A-1", antal: S50 }]);
    expect(s.lagerDriftRattade).toBe(1);
  });

  it("en sida där en storlek ändrats i flödet och en annan drivit räknas en gång", async () => {
    // 60 cm: flödet 60 → S60 mot stämpeln S50, skrivs ändå. 90 cm: bara drift.
    // Produkten skrevs alltså ändå, men driften lade till en rad — den räknas.
    const { d, lager } = burDeps(S50, 0, {
      fetchFeed: async () => feedMed(rad("A-1", { qty: 60 }), rad("H-9", { qty: 125 })),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([{ id: "60", antal: S60 }, { id: "90", antal: S125 }]);
    expect(s.lagerUppdaterade).toBe(1);
    expect(s.lagerDriftRattade).toBe(1);
    expect(s.lagerDriftProdukter).toEqual(["wix-bur"]);
  });

  it("☠️ en tvetydig rad är ingen drift — den nollas och stämplas aldrig", async () => {
    // Radens tal (169) skiljer sig från butikens S50. Utan grinden hade raden
    // räknats som drivande, trots att den nollas oavsett.
    const tvetydig = { ...hundbur(), aosomSyncedQty: 169 };
    tvetydig.variants = [tvetydig.variants[0], { ...tvetydig.variants[1], wixVariantId: undefined }];
    const { d, lager, sparade } = burDeps(S50, 0, { listAosom: async () => [tvetydig] });
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.tvetydiga).toBe(1);
    expect(s.lagerDrift).toBe(0);
    expect(s.lagerDriftRattade).toBe(0);
    expect(lager).toEqual([{ id: "60", antal: 0 }]);
    expect(sparade).toEqual([]);
  });

  it("☠️ en rättelse från 0 är en återkomst — bevakarna av 90 cm får sitt mejl", async () => {
    const utskick: { id: string; varianter: string[] }[] = [];
    const svar: RestockUtskick = { bevakare: 1, skickade: 1, ejSkickade: 0, sidan: "uppfriskad" };
    const { d } = burDeps(S50, 0, {
      bevakadeProdukter: async () => new Set(["wix-bur"]),
      mejlaBevakare: async (id, opts) => {
        utskick.push({ id, varianter: opts.varianter });
        return svar;
      },
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.aterILager).toBe(1);
    expect(utskick).toEqual([{ id: "wix-bur", varianter: ["wixvar-90"] }]);
  });
});

// ── EN RAD SOM ÄNDRATS UNDER KÖRNINGEN SKRIVS INTE ÖVER (2026-09-30) ───────
// Synken läser alla mappningar när den startar och sparade tillbaka hela raden
// som den såg ut då. En körning tar minuter, och allt som skrevs på raden under
// tiden försvann tyst. Spegeln 4117e161 tappade sin sammanslagning så 03:20
// den 2026-09-30 (B71 i tools/polish-gates/FLAGGADE.md), och nästa
// sammanslagning vägrades. Nu läses raden om strax före stämpeln.

describe("☠️ en rad som ändrats under körningen skrivs inte över", () => {
  /** Stolen: svart (A-1, radens artikel) och grå (G-7). */
  function stol(): ProductMappingRecord {
    const bas = mappning("A-1");
    const landadGra = landadKostnadSek(rad("G-7"), FX.eurToSek);
    return {
      ...bas,
      wixProductId: "wix-stol",
      variants: [
        { ...bas.variants[0], sku: "FP-stol-svart", wixVariantId: "wixvar-svart", choices: { Färg: "Svart" }, aosomSyncedQty: S50 },
        {
          supplierVariantId: "G-7", sku: "FP-stol-gra", wixVariantId: "wixvar-gra", choices: { Färg: "Grå" },
          costUsd: landadGra / FX.usdToSek, landedCostSek: landadGra, grossSek: BASPRIS, aosomSyncedQty: S50,
        },
      ],
    };
  }

  it("☠️ en sammanslagning under körningen skrivs inte över — stämpeln väntar", async () => {
    const fore = mappning("A-1");
    const efter: ProductMappingRecord = {
      ...fore,
      variants: [
        { ...fore.variants[0], choices: { Färg: "Svart" } },
        {
          supplierVariantId: "G-7", sku: "FP-gra", wixVariantId: "wixvar-gra", choices: { Färg: "Grå" },
          costUsd: fore.variants[0].costUsd, landedCostSek: fore.variants[0].landedCostSek,
          grossSek: BASPRIS, aosomSyncedQty: S13,
        },
      ],
    };
    const { d, lager, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1"), rad("G-7", { qty: 13 })),
      listAosom: async () => [fore],
      lasMappning: async () => efter,
    });
    const s = await runAosomSync(d, { dryRun: false });

    // Wix skrevs på det synken såg när körningen läste.
    expect(lager).toEqual([{ id: "wix-A-1", antal: S50 }]);
    expect(s.lagerUppdaterade).toBe(1);
    // Men raden skrivs inte tillbaka med ögonblicksbilden från körningens start.
    expect(sparade).toEqual([]);
    expect(s.stampelHoppade).toBe(1);
    expect(s.misslyckade).toBe(0);
    expect(s.errors.map((e) => e.error)).toEqual([expect.stringMatching(/ändrades under körningen/)]);
  });

  it("☠️ fält som synken inte äger står kvar — poleringens status och SKU", async () => {
    const fore = mappning("A-1", { needsAiPolish: true, draftStatus: "pending_review" });
    const efter: ProductMappingRecord = {
      ...fore,
      needsAiPolish: false,
      draftStatus: "published",
      variants: [{ ...fore.variants[0], sku: "FP-polerad-sku" }],
    };
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1")),
      listAosom: async () => [fore],
      lasMappning: async () => efter,
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.stampelHoppade).toBe(0);
    expect(sparade).toHaveLength(1);
    expect(sparade[0]).toMatchObject({ needsAiPolish: false, draftStatus: "published", aosomSyncedQty: S50 });
    expect(sparade[0].variants[0].sku).toBe("FP-polerad-sku");
  });

  it("en ommappning under körningen stämplas inte — stämpeln hör till den gamla artikeln", async () => {
    const fore = mappning("A-1");
    const efter: ProductMappingRecord = {
      ...fore,
      supplierProductId: "aosom:Z-9",
      variants: [{ ...fore.variants[0], supplierVariantId: "Z-9" }],
    };
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1")),
      listAosom: async () => [fore],
      lasMappning: async () => efter,
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(sparade).toEqual([]);
    expect(s.stampelHoppade).toBe(1);
  });

  it("☠️ en rad som raderats under körningen återuppstår inte", async () => {
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1")),
      listAosom: async () => [mappning("A-1")],
      lasMappning: async () => null,
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(sparade).toEqual([]);
    expect(s.stampelHoppade).toBe(1);
  });

  it("en sammanslagen sida som fått en färg till: de kända stämplas, den nya står kvar", async () => {
    const fore = stol();
    // Den nya färgen ligger FÖRST: en stämpel som matchade på plats i listan
    // hade lagt svarts och gråts tal på fel varianter.
    const efter: ProductMappingRecord = {
      ...fore,
      variants: [
        {
          supplierVariantId: "R-5", sku: "FP-stol-rod", wixVariantId: "wixvar-rod", choices: { Färg: "Röd" },
          costUsd: fore.variants[1].costUsd, landedCostSek: fore.variants[1].landedCostSek,
          grossSek: BASPRIS, aosomSyncedQty: 8,
        },
        ...fore.variants,
      ],
    };
    const { d, lager, sparade } = deps({
      // Svart 50 → S50 (oförändrad), grå 13 → S13 (ska skrivas).
      fetchFeed: async () => feedMed(rad("A-1"), rad("G-7", { qty: 13 })),
      listAosom: async () => [fore],
      lasMappning: async () => efter,
      // Den röda fanns inte när synken läste lagret.
      lasLagerposter: async () => [
        { id: "inv-svart", revision: "1", productId: "wix-stol", variantId: "wixvar-svart", quantity: S50 },
        { id: "inv-gra", revision: "1", productId: "wix-stol", variantId: "wixvar-gra", quantity: S50 },
      ],
      lasVariantPriser: async () =>
        new Map([["wix-stol", new Map([["wixvar-svart", BASPRIS], ["wixvar-gra", BASPRIS]])]]),
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([{ id: "gra", antal: S13 }]);
    expect(s.stampelHoppade).toBe(0);
    expect(sparade).toHaveLength(1);
    expect(sparade[0].variants.map((v) => [v.wixVariantId, v.aosomSyncedQty])).toEqual([
      ["wixvar-rod", 8],
      ["wixvar-svart", S50],
      ["wixvar-gra", S13],
    ]);
    // Radens tal är summan över den färska radens varianter.
    expect(sparade[0].aosomSyncedQty).toBe(8 + S50 + S13);
  });

  it("torrkörningen läser inte om raden — den stämplar ingenting", async () => {
    let lasningar = 0;
    const { d, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1")),
      listAosom: async () => [mappning("A-1")],
      lasMappning: async () => {
        lasningar++;
        return mappning("A-1");
      },
    });
    const s = await runAosomSync(d);

    expect(s.lagerUppdaterade).toBe(1);
    expect(lasningar).toBe(0);
    expect(sparade).toEqual([]);
  });

  it("ett läsfel vid omläsningen fäller bara sin produkt", async () => {
    const { d, sparade } = deps({
      lasMappning: async (id) => {
        if (id === "wix-A-1") throw new Error("Postgres svarade inte");
        return mappning("B-2");
      },
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.lagerUppdaterade).toBe(2);
    expect(s.misslyckade).toBe(1);
    expect(s.errors).toEqual([
      { sku: "A-1", wixProductId: "wix-A-1", error: expect.stringMatching(/Postgres/) },
    ]);
    expect(sparade.map((m) => m.wixProductId)).toEqual(["wix-B-2"]);
  });
});

describe("aterkomnaLagerrader — slut i butiken före, i lager efter", () => {
  const post = (id: string, quantity?: number) => ({ id, revision: "1", productId: "p", variantId: `v-${id}`, quantity });
  const idn = (x: ReturnType<typeof aterkomnaLagerrader>) => x?.map((r) => r.id) ?? null;

  it("noll före och mer än noll efter", () => {
    expect(idn(aterkomnaLagerrader([post("a", 0)], new Map([["a", 4]])))).toEqual(["a"]);
  });

  it("lager före är ingen återkomst", () => {
    expect(aterkomnaLagerrader([post("a", 2)], new Map([["a", 6]]))).toBeNull();
  });

  it("☠️ en färg som kommer tillbaka räknas, också när en annan färg fanns hela tiden", () => {
    // Formuläret visas när den VALDA färgen är slut. Bevakaren av vitt
    // sängbord väntade medan ekdekor fanns (2026-09-30).
    expect(idn(aterkomnaLagerrader([post("svart", 5), post("gra", 0)], new Map([["gra", 3]])))).toEqual(["gra"]);
  });

  it("bara raderna som kom tillbaka räknas", () => {
    const rader = [post("svart", 0), post("gra", 0), post("rod", 0)];
    expect(idn(aterkomnaLagerrader(rader, new Map([["gra", 3], ["rod", 0]])))).toEqual(["gra"]);
  });

  it("☠️ ett saldo som inte gick att läsa är okänt, aldrig noll", () => {
    expect(aterkomnaLagerrader([post("a", undefined)], new Map([["a", 4]]))).toBeNull();
    expect(aterkomnaLagerrader([post("a", 0), post("b", undefined)], new Map([["a", 4]]))).toBeNull();
  });

  it("utan lagerposter finns inget att avgöra", () => {
    expect(aterkomnaLagerrader([], new Map())).toBeNull();
  });

  it("noll förblir noll", () => {
    expect(aterkomnaLagerrader([post("a", 0)], new Map([["a", 0]]))).toBeNull();
  });
});

describe("restock-mejl i Aosom-synken (2026-09-30)", () => {
  function restockDeps(over: Partial<AosomSyncDeps> = {}, bevakade = ["wix-A-1"]) {
    const utskick: { id: string; visaPris: boolean; varianter: string[] }[] = [];
    let lasningar = 0;
    const svar: RestockUtskick = { bevakare: 2, skickade: 2, ejSkickade: 0, sidan: "uppfriskad" };
    const x = deps({
      bevakadeProdukter: async () => {
        lasningar++;
        return new Set(bevakade);
      },
      mejlaBevakare: async (id, opts) => {
        utskick.push({ id, visaPris: opts.visaPris, varianter: opts.varianter });
        return svar;
      },
      ...over,
    });
    return { ...x, utskick, lasningar: () => lasningar };
  }

  it("☠️ en produkt som går från noll till lager i butiken mejlar sina bevakare", async () => {
    // Butiken står på noll (fixturens lagerpost) och feeden har 50 → S50 skrivs.
    const { d, utskick } = restockDeps();
    const s = await runAosomSync(d, { dryRun: false });

    expect(s.aterILager).toBe(2);
    // Fixturens lagerpost bär inget variant-id: då gäller mejlet hela produkten.
    expect(utskick).toEqual([{ id: "wix-A-1", visaPris: true, varianter: [] }]);
    expect(s.restockMejl).toBe(2);
    expect(s.restockEjSkickade).toBe(0);
    expect(s.restockUtskick).toEqual([
      { wixProductId: "wix-A-1", bevakare: 2, skickade: 2, ejSkickade: 0, sidan: "uppfriskad" },
    ]);
  });

  it("en produkt som redan hade lager i butiken är ingen återkomst", async () => {
    const { d, utskick } = restockDeps({
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, 10)),
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(s.aterILager).toBe(0);
    expect(utskick).toEqual([]);
  });

  it("torrkörningen räknar återkomsterna men mejlar ingen och läser inga bevakare", async () => {
    const { d, utskick, lasningar } = restockDeps();
    const s = await runAosomSync(d);
    expect(s.aterILager).toBe(2);
    expect(utskick).toEqual([]);
    expect(lasningar()).toBe(0);
  });

  it("☠️ en lagerskrivning som föll mejlar ingen — varan finns inte i butiken", async () => {
    const { d, utskick } = restockDeps({
      skrivLager: async (updates) => ({
        lyckade: updates.filter((u) => u.id !== "inv-wix-A-1").map((u) => u.id),
        misslyckade: [{ id: "inv-wix-A-1", fel: "INVALID_REVISION" }],
      }),
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(s.aterILager).toBe(1);
    expect(utskick).toEqual([]);
  });

  it("bevakningarna läses en gång per körning, och bara när något kommit tillbaka", async () => {
    const tva = restockDeps({}, ["wix-A-1", "wix-B-2"]);
    await runAosomSync(tva.d, { dryRun: false });
    expect(tva.lasningar()).toBe(1);
    expect(tva.utskick.map((u) => u.id)).toEqual(["wix-A-1", "wix-B-2"]);

    const ingen = restockDeps({ lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, 47)) });
    await runAosomSync(ingen.d, { dryRun: false });
    expect(ingen.lasningar()).toBe(0);
  });

  it("☠️ ett pris som skrevs i samma körning visas inte i mejlet", async () => {
    // Wix läsning släpar efter en skrivning. Mejlet får inte säga ett annat
    // pris än sidan.
    const { d, utskick, priser } = restockDeps({
      listWixPriser: async () => wixPriser({ "wix-A-1": BASPRIS + 100 }),
    });
    await runAosomSync(d, { dryRun: false });
    expect(priser.map((p) => p.id)).toEqual(["wix-A-1"]);
    expect(utskick).toEqual([{ id: "wix-A-1", visaPris: false, varianter: [] }]);
  });

  it("☠️ en sammanslagen sida: färgen som kom tillbaka följer med till mejlet", async () => {
    const bas = mappning("A-1");
    const landadGra = landadKostnadSek(rad("G-7"), FX.eurToSek);
    const stol: ProductMappingRecord = {
      ...bas,
      wixProductId: "wix-stol",
      variants: [
        { ...bas.variants[0], sku: "FP-stol-svart", wixVariantId: "wixvar-svart", choices: { Färg: "Svart" }, aosomSyncedQty: 0 },
        {
          supplierVariantId: "G-7", sku: "FP-stol-gra", wixVariantId: "wixvar-gra", choices: { Färg: "Grå" },
          costUsd: landadGra / FX.usdToSek, landedCostSek: landadGra, grossSek: BASPRIS, aosomSyncedQty: 0,
        },
      ],
    };
    const poster = (svart: number, gra: number) => [
      { id: "inv-svart", revision: "1", productId: "wix-stol", variantId: "wixvar-svart", quantity: svart },
      { id: "inv-gra", revision: "1", productId: "wix-stol", variantId: "wixvar-gra", quantity: gra },
    ];
    const kor = (svart: number) =>
      restockDeps(
        {
          // Svart har LAGER_BUFFERT hos Aosom (på bufferten, alltså 0), grå 13 → S13.
          fetchFeed: async () => feedMed(rad("A-1", { qty: LAGER_BUFFERT }), rad("G-7", { qty: 13 })),
          listAosom: async () => [{ ...stol, variants: stol.variants.map((v, i) => (i === 0 ? { ...v, aosomSyncedQty: svart } : v)) }],
          lasLagerposter: async () => poster(svart, 0),
          lasVariantPriser: async () =>
            new Map([["wix-stol", new Map([["wixvar-svart", BASPRIS], ["wixvar-gra", BASPRIS]])]]),
        },
        ["wix-stol"],
      );

    // Båda färgerna var slut, grå kom tillbaka.
    const bada = kor(0);
    const s1 = await runAosomSync(bada.d, { dryRun: false });
    expect(s1.aterILager).toBe(1);
    expect(bada.utskick).toEqual([{ id: "wix-stol", visaPris: true, varianter: ["wixvar-gra"] }]);

    // Svart stod på 5 hela tiden. Bevakaren väntade på grå, och får sitt mejl.
    const enFanns = kor(5);
    const s2 = await runAosomSync(enFanns.d, { dryRun: false });
    expect(s2.aterILager).toBe(1);
    expect(enFanns.utskick).toEqual([{ id: "wix-stol", visaPris: true, varianter: ["wixvar-gra"] }]);
  });

  it("en färg som tar slut är ingen återkomst", async () => {
    const { d, utskick } = restockDeps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 1 }), rad("B-2", { qty: 1 })),
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, 12)),
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(s.aterILager).toBe(0);
    expect(utskick).toEqual([]);
  });

  it("☠️ bevakningar som inte går att läsa fäller inte synken, men syns", async () => {
    const { d, lager } = restockDeps({
      bevakadeProdukter: async () => {
        throw new Error("Wix Data svarade 500");
      },
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(lager).toHaveLength(2);
    expect(s.misslyckade).toBe(0);
    expect(s.restockMejl).toBe(0);
    expect(s.restockFel).toMatch(/500/);
  });

  it("ett utskick som kastar fäller inte synken, och felet syns", async () => {
    const { d } = restockDeps({
      mejlaBevakare: async () => {
        throw new Error("Wix Data svarade 503");
      },
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(s.misslyckade).toBe(0);
    expect(s.restockFel).toMatch(/wix-A-1: .*503/);
  });

  it("bevakare som inte fick sitt mejl räknas", async () => {
    const { d } = restockDeps({
      mejlaBevakare: async () => ({ bevakare: 3, skickade: 0, ejSkickade: 3, stopp: "dold" }),
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(s.restockEjSkickade).toBe(3);
    expect(s.restockUtskick[0]).toMatchObject({ wixProductId: "wix-A-1", stopp: "dold" });
  });

  it("utan utskicksdeps mejlas ingen — som förut", async () => {
    const { d } = deps();
    const s = await runAosomSync(d, { dryRun: false });
    expect(s.aterILager).toBe(2);
    expect(s.restockMejl).toBe(0);
    expect(s.restockFel).toBeNull();
  });
});

// ── SÅLT MEN INTE I FLÖDET DRAS AV (2026-10-01) ──────────────────────────────
// Leonard: "visa en mindre än Aosom, inte 3". Med 3 i buffert var det bufferten
// som hindrade att synken lade tillbaka ett sålt exemplar innan Aosoms flöde
// visat vår beställning (lagerdriften ovan skriver flödets tal efter en
// försäljning). Med 1 gör avdraget det jobbet: väntande orderrader, och
// beställda i `NYSS_BESTALLD_MS` efter att de markerats.
// Golvlampan 65ca6f6d: 4 hos Aosom, en såld men obeställd.

describe("☠️ sålt men inte i Aosoms flöde dras av", () => {
  /** En väntande orderrad. Nollan som variant-id, som på en produkt utan optioner. */
  const order = (wixProductId: string, antal = 1, over: Partial<SaldOrderrad> = {}): SaldOrderrad => ({
    wixCatalogItemId: wixProductId,
    wixVariantId: "00000000-0000-0000-0000-000000000000",
    variantChoices: {},
    quantity: antal,
    status: "pending",
    ...over,
  });
  const plan = (m: ProductMappingRecord, qty = 50) =>
    planeraProdukt(m, "A-1", rad("A-1", { qty }), { priceSek: BASPRIS, variantCount: 1 }, { fx: FX, rules: REGLER }, {});
  const T0 = Date.parse("2026-10-01T06:00:00Z");
  const timmarFore = (h: number) => new Date(T0 - h * 60 * 60 * 1000).toISOString();

  describe("vantarPaFlodet", () => {
    it("en väntande orderrad dras alltid av", () => {
      expect(vantarPaFlodet({ status: "pending" }, T0)).toBe(true);
    });

    it("en beställd rad dras av tills fönstret gått ut", () => {
      expect(vantarPaFlodet({ status: "ordered", orderedAt: timmarFore(0) }, T0)).toBe(true);
      expect(vantarPaFlodet({ status: "ordered", orderedAt: timmarFore(11.9) }, T0)).toBe(true);
      expect(vantarPaFlodet({ status: "ordered", orderedAt: new Date(T0 - NYSS_BESTALLD_MS).toISOString() }, T0)).toBe(false);
      expect(vantarPaFlodet({ status: "ordered", orderedAt: timmarFore(13) }, T0)).toBe(false);
    });

    it("☠️ en beställd rad utan tid dras inte av — den är från före fältet, eller AliExpress", () => {
      expect(vantarPaFlodet({ status: "ordered" }, T0)).toBe(false);
      expect(vantarPaFlodet({ status: "ordered", orderedAt: "inte ett datum" }, T0)).toBe(false);
    });

    it("skickade, avbrutna och AliExpress-betalningar dras aldrig av", () => {
      for (const status of ["shipped", "cancelled", "pending_payment"] as const) {
        expect(vantarPaFlodet({ status, orderedAt: timmarFore(1) }, T0)).toBe(false);
      }
    });
  });

  it("en vanlig rad: flödets saldo minus bufferten minus det sålda", () => {
    const p = medSaldaAvdragna(plan(mappning("A-1", { aosomSyncedQty: S50 })), [order("wix-A-1", 2)]);
    expect(p.onskatSaldo).toBe(S50 - 2);
    expect(p.nyttSaldo).toBe(S50 - 2);
    expect(p.saldaAvdragna).toBe(2);
  });

  it("aldrig under noll", () => {
    const p = medSaldaAvdragna(plan(mappning("A-1"), 4), [order("wix-A-1", 7)]);
    expect(p.onskatSaldo).toBe(0);
  });

  it("KONTROLL: utan orderrader är planen orörd", () => {
    const fore = plan(mappning("A-1", { aosomSyncedQty: S50 }));
    const efter = medSaldaAvdragna(fore, []);
    expect(efter).toBe(fore);
    expect(efter.nyttSaldo).toBeNull();
  });

  it("en orderrad med noll eller negativt antal dras inte av", () => {
    const fore = plan(mappning("A-1", { aosomSyncedQty: S50 }));
    expect(medSaldaAvdragna(fore, [order("wix-A-1", 0), order("wix-A-1", -3)])).toBe(fore);
  });

  it("☠️ golvlampan: 4 hos Aosom och en såld → 2 skrivs, inte 3", async () => {
    // Stämpeln 1 och butiken 1: läget efter lagerkörningen 22:44 UTC, med den
    // gamla bufferten.
    const { d, lager, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 4 })),
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: 1 })],
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, 1)),
      lasSaldaOrderrader: async () => [order("wix-A-1")],
    });
    const s = await runAosomSync(d, { dryRun: false });

    expect(lager).toEqual([{ id: "wix-A-1", antal: synligtSaldo(4) - 1 }]);
    expect(sparade[0].aosomSyncedQty).toBe(synligtSaldo(4) - 1);
    expect(s.saldaAvdragna).toBe(1);
    expect(s.saldaAvdragnaProdukter).toEqual(["wix-A-1"]);
  });

  it("KONTROLL: samma lampa utan väntande order får flödets tal minus bufferten", async () => {
    const { d, lager } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 4 })),
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: 1 })],
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, 1)),
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(lager).toEqual([{ id: "wix-A-1", antal: synligtSaldo(4) }]);
    expect(s.saldaAvdragna).toBe(0);
  });

  it("☠️ en försäljning läggs INTE tillbaka när ordern väntar — till skillnad från lagerdriften ensam", async () => {
    // Butiken ett under stämpeln efter köpet. Utan avdraget hade driften skrivit
    // flödets tal och sålt samma exemplar igen (se testet ovan om försäljning).
    const { d, lager, sparade } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 })],
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, S50 - 1)),
      lasSaldaOrderrader: async () => [order("wix-A-1")],
    });
    const s = await runAosomSync(d, { dryRun: false });

    // Samma tal som butiken redan har: skrivet och stämplat, aldrig S50.
    expect(lager).toEqual([{ id: "wix-A-1", antal: S50 - 1 }]);
    expect(sparade[0].aosomSyncedQty).toBe(S50 - 1);
    expect(s.lagerDriftRattade).toBe(0);
  });

  it("☠️ en försäljning MITT I körningen läggs inte tillbaka — raderna läses efter lagret", async () => {
    // Köpet landar efter att körningen startat men innan tuggans lager läses:
    // Wix har redan dragit av, och orderraden finns. Lästes raderna en gång vid
    // start hade avdraget saknats och driften skrivit S50 — samma exemplar till
    // salu igen.
    const rader: SaldOrderrad[] = [];
    const { d, lager } = deps({
      fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 })],
      lasLagerposter: async (ids) => {
        rader.push(order("wix-A-1"));
        return ids.map((id) => lagerpost(id, S50 - 1));
      },
      lasSaldaOrderrader: async () => [...rader],
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(lager).toEqual([{ id: "wix-A-1", antal: S50 - 1 }]);
    expect(s.lagerDriftRattade).toBe(0);
  });

  it("☠️ en nyss beställd order dras av tills flödet hunnit visa den, sedan inte", async () => {
    const korning = (orderedAt: string) =>
      deps({
        now: () => T0,
        fetchFeed: async () => feedMed(rad("A-1", { qty: 50 })),
        listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 - 2 })],
        lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, S50 - 2)),
        lasSaldaOrderrader: async () => [order("wix-A-1", 2, { status: "ordered", orderedAt })],
      });

    // Två timmar sedan: flödet visar kanske inte ordern än. Oförändrat.
    const nyss = korning(timmarFore(2));
    const s1 = await runAosomSync(nyss.d, { dryRun: false });
    expect(nyss.lager).toEqual([]);
    expect(s1.saldaAvdragna).toBe(2);

    // Tretton timmar sedan: flödet har exporterats minst en gång efter ordern.
    const sen = korning(timmarFore(13));
    const s2 = await runAosomSync(sen.d, { dryRun: false });
    expect(sen.lager).toEqual([{ id: "wix-A-1", antal: S50 }]);
    expect(s2.saldaAvdragna).toBe(0);
  });

  it("en skickad eller avbruten orderrad dras inte av", async () => {
    const { d, lager } = deps({
      now: () => T0,
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 })],
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, S50)),
      lasSaldaOrderrader: async () => [
        order("wix-A-1", 1, { status: "shipped", orderedAt: timmarFore(1) }),
        order("wix-A-1", 1, { status: "cancelled" }),
      ],
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(lager).toEqual([]);
    expect(s.saldaAvdragna).toBe(0);
  });

  it("en orderrad på en annan produkt rör inte den här", async () => {
    const { d, lager } = deps({
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 }), mappning("B-2", { aosomSyncedQty: S50 })],
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, S50)),
      lasSaldaOrderrader: async () => [order("wix-B-2", 2), order("wix-okand", 5), { ...order(""), wixCatalogItemId: undefined }],
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(lager).toEqual([{ id: "wix-B-2", antal: S50 - 2 }]);
    expect(s.saldaAvdragna).toBe(2);
    expect(s.saldaAvdragnaProdukter).toEqual(["wix-B-2"]);
  });

  it("torrkörningen räknar avdraget men skriver ingenting", async () => {
    const { d, lager, sparade } = deps({
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 })],
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, S50)),
      lasSaldaOrderrader: async () => [order("wix-A-1", 2)],
    });
    const s = await runAosomSync(d);
    expect([lager, sparade]).toEqual([[], []]);
    expect(s.lagerUppdaterade).toBe(1);
    expect(s.saldaAvdragna).toBe(2);
  });

  it("☠️ går orderraderna inte att läsa skrivs inget lager — och det syns", async () => {
    // Utan avdraget hade varje såld enhet lagts tillbaka. Samma svar som när
    // lagret inte går att läsa: tuggans lager står kvar, och varje produkt som
    // ville skrivas räknas som misslyckad.
    const { d, lager } = deps({
      listAosom: async () => [mappning("A-1", { aosomSyncedQty: S50 }), mappning("B-2")],
      lasLagerposter: async (ids) => ids.map((id) => lagerpost(id, S50)),
      lasSaldaOrderrader: async () => {
        throw new Error("Postgres svarade inte");
      },
    });
    const s = await runAosomSync(d, { dryRun: false });
    expect(lager).toEqual([]);
    expect(s.misslyckade).toBe(1);
    expect(s.errors.map((e) => [e.wixProductId, e.error])).toEqual([
      ["wix-B-2", "de sålda orderraderna gick inte att läsa: Postgres svarade inte"],
    ]);
  });

  describe("en sammanslagen sida: varje orderrad dras från sin egen färg", () => {
    /** Svart (A-1, radens artikel) och grå (G-7). Båda i fas med flödet. */
    function stol(): ProductMappingRecord {
      const bas = mappning("A-1");
      const landadGra = landadKostnadSek(rad("G-7"), FX.eurToSek);
      return {
        ...bas,
        wixProductId: "wix-stol",
        variants: [
          { ...bas.variants[0], sku: "FP-stol-svart", wixVariantId: "wixvar-svart", choices: { Färg: "Svart" }, aosomSyncedQty: S50 },
          {
            supplierVariantId: "G-7", sku: "FP-stol-gra", wixVariantId: "wixvar-gra", choices: { Färg: "Grå" },
            costUsd: landadGra / FX.usdToSek, landedCostSek: landadGra, grossSek: BASPRIS, aosomSyncedQty: S13,
          },
        ],
      };
    }
    const stolDeps = (rader: SaldOrderrad[], butik = { svart: S50, gra: S13 }) =>
      deps({
        fetchFeed: async () => feedMed(rad("A-1"), rad("G-7", { qty: 13 })),
        listAosom: async () => [stol()],
        lasLagerposter: async () => [
          { id: "inv-svart", revision: "1", productId: "wix-stol", variantId: "wixvar-svart", quantity: butik.svart },
          { id: "inv-gra", revision: "1", productId: "wix-stol", variantId: "wixvar-gra", quantity: butik.gra },
        ],
        lasVariantPriser: async () =>
          new Map([["wix-stol", new Map([["wixvar-svart", BASPRIS], ["wixvar-gra", BASPRIS]])]]),
        lasSaldaOrderrader: async () => rader,
      });

    it("på variant-id:t", async () => {
      const { d, lager } = stolDeps([order("wix-stol", 2, { wixVariantId: "wixvar-gra" })]);
      await runAosomSync(d, { dryRun: false });
      expect(lager).toEqual([{ id: "gra", antal: S13 - 2 }]);
    });

    it("en order från före sammanslagningen (nollan) matchas på SKU:n", async () => {
      const { d, lager } = stolDeps([order("wix-stol", 1, { sku: "FP-stol-svart" })]);
      await runAosomSync(d, { dryRun: false });
      expect(lager).toEqual([{ id: "svart", antal: S50 - 1 }]);
    });

    it("☠️ en orderrad som inte går att knyta till en färg dras från ALLA färger", async () => {
      const { d, lager, sparade } = stolDeps([order("wix-stol", 1)]);
      const s = await runAosomSync(d, { dryRun: false });
      expect(lager).toEqual([{ id: "svart", antal: S50 - 1 }, { id: "gra", antal: S13 - 1 }]);
      expect(sparade[0].variants.map((v) => v.aosomSyncedQty)).toEqual([S50 - 1, S13 - 1]);
      expect(s.saldaAvdragna).toBe(1);
    });

    it("☠️ försäljningen av en färg läggs inte tillbaka av driften", async () => {
      // Grått såldes: butiken ett under stämpeln på den färgen. Driften hade
      // skrivit flödets tal för grått; avdraget håller den på butikens tal, och
      // svart rörs inte.
      const { d, lager, sparade } = stolDeps(
        [order("wix-stol", 1, { wixVariantId: "wixvar-gra" })],
        { svart: S50, gra: S13 - 1 },
      );
      const s = await runAosomSync(d, { dryRun: false });
      expect(lager).toEqual([{ id: "gra", antal: S13 - 1 }]);
      expect(sparade[0].variants.map((v) => v.aosomSyncedQty)).toEqual([S50, S13 - 1]);
      expect(s.lagerDriftRattade).toBe(0);
    });
  });
});
