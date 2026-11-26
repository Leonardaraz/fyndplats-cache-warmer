import { describe, expect, it } from "vitest";
import { planeraFlerartikel, type SaldOrderrad, type SynkDeps } from "@/lib/aosom/sync";
import { MinnesSyncMarkorLager } from "@/lib/aosom/sync-markor";
import { computePriceWithRules } from "@/lib/import/pricing";
import type { PricingRules } from "@/lib/import/types";
import type { ProductMappingRecord } from "@/lib/store";
import { VEVOR_PROFIL, type Leverantorsrad } from "@/lib/sync/leverantorsrad";
import { MIN_WIX_PRODUKTER, type WixProduktPris } from "@/lib/wix/v3-products";
import type { SynkAvlasning } from "./lager";
import { RabattFel, vevorLandadKostnadSek } from "./pris";
import { MAX_ALDER_MS } from "./rad";
import {
  HOPP_I_RADEN,
  korVevorSynk,
  MinnesVevorSynkLager,
  runVevorSync,
  synkloggrad,
  utanArtikelnummer,
  type VevorKallDeps,
} from "./synk";

// ☠️ Påhittade artikelnummer, priser och rabatt. Repot är publikt.
const sku = (n: number) => `TESTSKUSYNK${String(n).padStart(6, "0")}`;
const NU = Date.parse("2026-10-29T12:00:00.000Z");
const TIMME = 3_600_000;
const USD = 10.5;
const RABATT = 0.05;
const REGLER: PricingRules = {
  usdToSek: USD,
  defaultMultiplier: 1.2,
  fixedSurchargeSek: 0,
  categoryMultipliers: {},
  tiersEnabled: false,
  tiers: [],
  rounding: "charm99",
  vatRatePercent: 25,
};

/** Husets regelpris för ett VEVOR-pris, räknat som importen räknar det. */
const regelpris = (prisSek: number) =>
  computePriceWithRules(vevorLandadKostnadSek(prisSek, RABATT) / USD, REGLER, null).grossSek;

const BAS = 1240;

function avl(n: number, over: Partial<SynkAvlasning> = {}): SynkAvlasning {
  return {
    sku: sku(n),
    status: "i_lager",
    saldo: 12,
    prisSek: BAS,
    forraPrisSek: BAS,
    lastAt: new Date(NU - TIMME).toISOString(),
    misslyckadAt: null,
    borta: false,
    levererasTillSe: true,
    flode: "EU",
    ...over,
  };
}

function mappning(n: number, over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  const landad = vevorLandadKostnadSek(BAS, RABATT);
  return {
    supplierProductId: `vevor:${sku(n)}`,
    supplier: "vevor",
    wixProductId: `wix-${n}`,
    variants: [
      {
        supplierVariantId: sku(n),
        sku: `FP-testvara-${n}`,
        wixVariantId: `wixvar-${n}`,
        choices: {},
        costUsd: landad / USD,
        landedCostSek: landad,
        grossSek: regelpris(BAS),
      },
    ],
    draftStatus: "pending_review",
    ...over,
  };
}

interface Miljoval {
  avlasningar?: SynkAvlasning[];
  mappningar?: ProductMappingRecord[];
  fryst?: boolean;
  /** null = rabatten saknas i konfigurationen. */
  rabatt?: number | null;
  /** Butikens pris per Wix-id. Standard: regelpriset för BAS. */
  wixPris?: Record<string, number>;
  /** Butikens saldo per Wix-id. Standard: 0. */
  saldo?: Record<string, number>;
  orderrader?: SaldOrderrad[];
}

function miljo(o: Miljoval = {}) {
  const mappningar = o.mappningar ?? [mappning(1)];
  const lager: { id: string; antal: number }[] = [];
  const priser: { id: string; pris: number; kostnad: number }[] = [];
  const sparade: ProductMappingRecord[] = [];
  const wixPriser = () => {
    const m = new Map<string, WixProduktPris>();
    for (let i = 0; i < MIN_WIX_PRODUKTER; i++) m.set(`wix-utfyllnad-${i}`, { priceSek: 999, variantCount: 1 });
    for (const x of mappningar) {
      m.set(x.wixProductId, { priceSek: o.wixPris?.[x.wixProductId] ?? regelpris(BAS), variantCount: 1 });
    }
    return m;
  };
  const synk: SynkDeps = {
    listMappningar: async () => mappningar.map((m) => structuredClone(m)),
    listWixPriser: async () => wixPriser(),
    lasLagerposter: async (ids) =>
      ids.map((id) => ({ id: `inv-${id}`, revision: "1", productId: id, quantity: o.saldo?.[id] ?? 0 })),
    skrivLager: async (u) => {
      for (const x of u) lager.push({ id: x.id.replace(/^inv-/, ""), antal: x.quantity });
      return { lyckade: u.map((x) => x.id), misslyckade: [] };
    },
    setPrice: async (id, _variant, pris, kostnad) => {
      priser.push({ id, pris, kostnad });
    },
    sparaMappningar: async (rader) => {
      sparade.push(...rader);
      return { fel: [] };
    },
    lasMappningar: async (ids) =>
      new Map(mappningar.filter((m) => ids.includes(m.wixProductId)).map((m) => [m.wixProductId, structuredClone(m)])),
    lasSaldaOrderrader: async () => o.orderrader ?? [],
    lasAuktionsprodukter: async () => new Set<string>(),
    fx: { usdToSek: USD },
    rules: REGLER,
    now: () => NU,
  };
  const kalla: VevorKallDeps = {
    lasAvlasningar: async () => o.avlasningar ?? [avl(1)],
    lasarensFrysning: async () => (o.fryst ? { at: new Date(NU - TIMME).toISOString(), skal: "spärr" } : null),
    lasRabatt: async () => {
      if (o.rabatt === null) throw new RabattFel("VEVOR PRO-rabatten saknas i konfigurationen");
      return o.rabatt ?? RABATT;
    },
    now: () => NU,
  };
  return { synk, kalla, lager, priser, sparade };
}

const skarp = { dryRun: false } as const;

describe("VEVOR-synken: lagret", () => {
  it("en färsk avläsning skrivs rakt av, utan buffert, och stämplas", async () => {
    const m = miljo({ avlasningar: [avl(1, { saldo: 1 })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.lager).toEqual([{ id: "wix-1", antal: 1 }]);
    expect(s.lagerUppdaterade).toBe(1);
    expect(m.sparade.map((r) => r.aosomSyncedQty)).toEqual([1]);
    expect(s.feedRader).toBe(1);
  });

  it("☠️ en avläsning äldre än tolv timmar är okänd: ingenting skrivs, ingenting stämplas", async () => {
    // Butiken skiljer sig från stämpeln (5 mot 3): utan sorteringen av okänt
    // hade rättelsen mot butiken skrivit avläsningens 0.
    const m = miljo({
      avlasningar: [avl(1, { saldo: 0, status: "slut", lastAt: new Date(NU - MAX_ALDER_MS - 60_000).toISOString() })],
      mappningar: [mappning(1, { aosomSyncedQty: 5 })],
      saldo: { "wix-1": 3 },
    });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.lager).toEqual([]);
    expect(m.sparade).toEqual([]);
    expect(s.okantBesked).toBe(1);
    expect(s.okantBeskedProdukter).toEqual(["wix-1"]);
    expect(s.leverantorOense).toBe(0);
  });

  it("☠️ KONTROLL: samma avläsning en minut färskare nollar lagret", async () => {
    const m = miljo({
      avlasningar: [avl(1, { saldo: 0, status: "slut", lastAt: new Date(NU - MAX_ALDER_MS + 60_000).toISOString() })],
      saldo: { "wix-1": 5 },
    });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.lager).toEqual([{ id: "wix-1", antal: 0 }]);
    expect(s.okantBesked).toBe(0);
  });

  it("☠️ en saknad avläsning är okänd, aldrig 0", async () => {
    const m = miljo({ avlasningar: [], saldo: { "wix-1": 5 } });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.lager).toEqual([]);
    expect(s.okantBesked).toBe(1);
  });

  it("☠️ en fryst läsare gör varje avläsning okänd", async () => {
    const m = miljo({ avlasningar: [avl(1, { saldo: 0, status: "slut" }), avl(2)], mappningar: [mappning(1), mappning(2)], fryst: true });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.lager).toEqual([]);
    expect(m.priser).toEqual([]);
    expect(s.okantBesked).toBe(2);
  });

  it("☠️ ett misslyckat försök efter avläsningen gör den okänd", async () => {
    const m = miljo({ avlasningar: [avl(1, { saldo: 0, misslyckadAt: new Date(NU - 60_000).toISOString() })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.lager).toEqual([]);
    expect(s.okantBesked).toBe(1);
  });

  it("en vara som inte skickas hit nollas, och räknas som ej skeppbar, inte som slutsåld", async () => {
    const m = miljo({ avlasningar: [avl(1, { levererasTillSe: false, saldo: 30 })], saldo: { "wix-1": 30 } });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.lager).toEqual([{ id: "wix-1", antal: 0 }]);
    expect(s.ejSkeppbara).toBe(1);
    expect(s.slutsalda).toBe(0);
  });

  it("en bekräftat borttagen vara nollas", async () => {
    const m = miljo({ avlasningar: [avl(1, { borta: true, status: "borta" })], saldo: { "wix-1": 3 } });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.lager).toEqual([{ id: "wix-1", antal: 0 }]);
    expect(s.urFeeden).toBe(1);
  });

  it("☠️ en rad med prefixet vevor: men supplier-fältet aosom rörs inte, och räknas som oense", async () => {
    const m = miljo({ mappningar: [mappning(1, { supplier: "aosom" })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.lager).toEqual([]);
    expect(s.okantBesked).toBe(1);
    expect(s.leverantorOense).toBe(1);
  });

  it("☠️ en såld men obeställd enhet dras av, och en beställd dras av inom fönstret", async () => {
    const m = miljo({
      avlasningar: [avl(1, { saldo: 3 })],
      orderrader: [
        { wixCatalogItemId: "wix-1", variantChoices: {}, quantity: 1, status: "pending" },
        {
          wixCatalogItemId: "wix-1",
          variantChoices: {},
          quantity: 1,
          status: "ordered",
          orderedAt: new Date(NU - 11 * TIMME).toISOString(),
        },
      ],
    });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.lager).toEqual([{ id: "wix-1", antal: 1 }]);
    expect(s.saldaAvdragna).toBe(2);
  });

  it("torrkörningen skriver ingenting men säger vad en skarp skulle skriva", async () => {
    const m = miljo({ avlasningar: [avl(1, { saldo: 4 })] });
    const s = await runVevorSync(m.synk, m.kalla, { dryRun: true });
    expect(m.lager).toEqual([]);
    expect(m.sparade).toEqual([]);
    expect(s.lagerUppdaterade).toBe(1);
  });
});

describe("☠️ VEVOR:s fönster för beställda enheter räcker längre än en avläsning", () => {
  // En avläsning tagen FÖRE ordern är antingen yngre än tolv timmar, och då
  // dras ordern av, eller okänd. Ett kortare fönster hade släppt en order som
  // en gammal men giltig avläsning inte visar.
  it("fönstret är minst avläsningens livstid", () => {
    expect(VEVOR_PROFIL.bestalldOsynligMs).toBeGreaterThanOrEqual(MAX_ALDER_MS);
  });
});

describe("VEVOR-synken: priset", () => {
  it("två avläsningar i rad med samma regelpris: det nya priset skrivs", async () => {
    const m = miljo({ avlasningar: [avl(1, { prisSek: 1500, forraPrisSek: 1500 })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser).toEqual([{ id: "wix-1", pris: regelpris(1500), kostnad: vevorLandadKostnadSek(1500, RABATT) }]);
    expect(s.prisUppdaterade).toBe(1);
    expect(s.prisVantar).toBe(0);
    // Alla tre kostnadsfälten på mappningen, aldrig bara priset.
    const v = m.sparade[0].variants[0];
    expect(v.grossSek).toBe(regelpris(1500));
    expect(v.landedCostSek).toBe(vevorLandadKostnadSek(1500, RABATT));
    expect(v.costUsd).toBeCloseTo(vevorLandadKostnadSek(1500, RABATT) / USD, 6);
  });

  it("☠️ ett pris som skiljer sig från föregående avläsning väntar, och skrivs inte", async () => {
    const m = miljo({ avlasningar: [avl(1, { prisSek: 1500, forraPrisSek: BAS })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser).toEqual([]);
    expect(s.prisVantar).toBe(1);
    expect(s.varningar).toEqual([]);
  });

  it("☠️ utan föregående avläsning väntar ett nytt pris också", async () => {
    const m = miljo({ avlasningar: [avl(1, { prisSek: 1500, forraPrisSek: null })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser).toEqual([]);
    expect(s.prisVantar).toBe(1);
  });

  it("det är REGELPRISET som ska vara lika, inte VEVOR:s pris", async () => {
    // Två priser som avrundas till samma regelpris.
    const a = 1500;
    const b = 1501;
    expect(regelpris(a)).toBe(regelpris(b));
    expect(regelpris(a)).not.toBe(regelpris(BAS));
    const m = miljo({ avlasningar: [avl(1, { prisSek: a, forraPrisSek: b })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser.map((p) => p.pris)).toEqual([regelpris(a)]);
    expect(s.prisVantar).toBe(0);
  });

  it("stämmer butiken redan väntar ingenting och skrivs ingenting", async () => {
    const m = miljo({
      avlasningar: [avl(1, { prisSek: BAS, forraPrisSek: 1500 })],
      mappningar: [mappning(1, { aosomSyncedQty: 12 })],
      saldo: { "wix-1": 12 },
    });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser).toEqual([]);
    expect(s.prisVantar).toBe(0);
    expect(s.oforandrade).toBe(1);
  });

  it("☠️ utan rabatt skrivs inga priser, men lagret synkas och felet syns", async () => {
    const m = miljo({ avlasningar: [avl(1, { prisSek: 1500, forraPrisSek: 1500, saldo: 7 })], rabatt: null });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser).toEqual([]);
    expect(m.lager).toEqual([{ id: "wix-1", antal: 7 }]);
    expect(s.prislistaFel).toMatch(/rabatten saknas/);
  });

  it("☠️ konkurrentregeln gäller inte VEVOR: grupp och färskt konkurrentpris ändrar ingenting", async () => {
    const m = miljo({
      mappningar: [
        mappning(1, { prisgrupp: "A", konkurrent: { pris: regelpris(1500) + 3000, hamtad: new Date(NU - TIMME).toISOString() } }),
      ],
      avlasningar: [avl(1, { prisSek: 1500, forraPrisSek: 1500 })],
    });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser.map((p) => p.pris)).toEqual([regelpris(1500)]);
    expect(s.konkurrentMal + s.konkurrentTak + s.konkurrentGolv + s.konkurrentFrysta).toBe(0);
  });

  it("☠️ VEVOR har inget tak (Leonard 2026-11-25): ett stabilt hopp på 200 % skrivs, och står i storaHopp", async () => {
    const m = miljo({ avlasningar: [avl(1, { prisSek: BAS * 3, forraPrisSek: BAS * 3 })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser.map((p) => [p.id, p.pris])).toEqual([["wix-1", regelpris(BAS * 3)]]);
    expect(s.varningar).toEqual([]);
    expect(s.godkandaHopp).toEqual([]);
    expect(s.storaHopp).toEqual([
      { wixProductId: "wix-1", fran: regelpris(BAS), till: regelpris(BAS * 3), andringPct: Math.round(((regelpris(BAS * 3) - regelpris(BAS)) / regelpris(BAS)) * 100) },
    ]);
  });

  it("en halvering skrivs också, och står i storaHopp med minustecken", async () => {
    const m = miljo({ avlasningar: [avl(1, { prisSek: BAS / 2, forraPrisSek: BAS / 2 })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser.map((p) => p.pris)).toEqual([regelpris(BAS / 2)]);
    expect(s.storaHopp).toHaveLength(1);
    expect(s.storaHopp[0].andringPct).toBeLessThan(-40);
  });

  it("ett hopp på högst 40 % skrivs utan att stå i storaHopp", async () => {
    const m = miljo({ avlasningar: [avl(1, { prisSek: BAS * 1.2, forraPrisSek: BAS * 1.2 })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser.map((p) => p.pris)).toEqual([regelpris(BAS * 1.2)]);
    expect(s.storaHopp).toEqual([]);
  });

  it("☠️ utan tak är två lika avläsningar spärren som är kvar: ett hopp i EN avläsning skrivs inte och står inte i storaHopp", async () => {
    const m = miljo({ avlasningar: [avl(1, { prisSek: BAS * 3, forraPrisSek: BAS })] });
    const s = await runVevorSync(m.synk, m.kalla, skarp);
    expect(m.priser).toEqual([]);
    expect(s.prisVantar).toBe(1);
    expect(s.storaHopp).toEqual([]);
  });
});

describe("en VEVOR-sida med två artiklar: varje variant för sig, utan tak", () => {
  const landad = (prisSek: number) => vevorLandadKostnadSek(prisSek, RABATT);
  const variant = (n: number, farg: string) => ({
    supplierVariantId: sku(n),
    sku: `FP-testvara-${n}`,
    wixVariantId: `wixvar-${n}`,
    choices: { Färg: farg },
    costUsd: landad(BAS) / USD,
    landedCostSek: landad(BAS),
    grossSek: regelpris(BAS),
  });
  const m = mappning(1, { variants: [variant(1, "Grå"), variant(2, "Brun")] });
  const bild = {
    typ: "flera" as const,
    artikel: sku(1),
    varianter: [1, 2].map((n, index) => ({
      index,
      artikel: sku(n),
      wixVariantId: `wixvar-${n}`,
      sku: `FP-testvara-${n}`,
      choices: { Färg: index === 0 ? "Grå" : "Brun" },
    })),
  };
  const rad = (n: number, prisSek: number, forraSek: number): Leverantorsrad => ({
    leverantor: "vevor",
    artikel: sku(n),
    status: "i_lager",
    saldo: 5,
    landadKostnadSek: landad(prisSek),
    forraLandadKostnadSek: landad(forraSek),
    lastAt: new Date(NU - TIMME).toISOString(),
  });
  const butik = new Map([["wixvar-1", regelpris(BAS)], ["wixvar-2", regelpris(BAS)]]);
  const deps = { fx: { usdToSek: USD }, rules: REGLER, now: () => NU };

  it("☠️ den ena färgens pris tredubblas och skrivs, och hoppet står i planens storaHopp", () => {
    const perSku = new Map([[sku(1), rad(1, BAS, BAS)], [sku(2), rad(2, BAS * 3, BAS * 3)]]);
    const plan = planeraFlerartikel(m, bild, perSku, butik, deps, {});
    expect(plan.varning).toBeNull();
    expect(plan.varianter?.map((v) => v.nyttPris)).toEqual([null, regelpris(BAS * 3)]);
    expect(plan.storaHopp).toEqual([expect.objectContaining({ fran: regelpris(BAS), till: regelpris(BAS * 3) })]);
    expect(plan.godkandaHopp).toBeUndefined();
  });

  it("utan stora hopp bär planen inget storaHopp", () => {
    const perSku = new Map([[sku(1), rad(1, BAS, BAS)], [sku(2), rad(2, BAS * 1.1, BAS * 1.1)]]);
    const plan = planeraFlerartikel(m, bild, perSku, butik, deps, {});
    expect(plan.varianter?.map((v) => v.nyttPris)).toEqual([null, regelpris(BAS * 1.1)]);
    expect(plan.storaHopp).toBeUndefined();
  });
});

describe("korVevorSynk: strömbrytaren, låset och markören", () => {
  function korDeps(o: Miljoval = {}) {
    const m = miljo(o);
    const lager = new MinnesVevorSynkLager();
    const markorer = new MinnesSyncMarkorLager();
    let motorLast = 0;
    return {
      m,
      lager,
      markorer,
      motorLast: () => motorLast,
      deps: {
        lager,
        markorer,
        motor: async () => {
          motorLast++;
          return { synk: m.synk, kalla: m.kalla };
        },
        nu: () => NU,
      },
    };
  }
  const val = { limit: 1200, budgetMs: 240_000 };

  it("☠️ schemat gör ingenting när synken är avstängd, och läser inte ens källan", async () => {
    const k = korDeps();
    const u = await korVevorSynk(k.deps, { ...val, manuell: false, dryRun: false });
    expect(u.utfall).toBe("avstangd");
    expect(k.motorLast()).toBe(0);
  });

  it("schemat kör skarpt när synken är påslagen, och sparar markören", async () => {
    const k = korDeps({
      avlasningar: [avl(1), avl(2), avl(3)],
      mappningar: [mappning(1), mappning(2), mappning(3)],
    });
    k.lager.tillstand.aktiv = true;
    const u = await korVevorSynk(k.deps, { ...val, manuell: false, dryRun: false, limit: 1 });
    expect(u.utfall).toBe("klar");
    expect(u.markor).toBe("borjade");
    expect(await k.markorer.las("vevor")).toBe(sku(1));
    // Nästa schemalagda körning fortsätter efter den.
    const u2 = await korVevorSynk(k.deps, { ...val, manuell: false, dryRun: false, limit: 1 });
    expect(u2.markor).toBe("fortsatte");
    expect(await k.markorer.las("vevor")).toBe(sku(2));
    expect(k.lager.tillstand.senasteKorning?.granskade).toBe(1);
  });

  it("☠️ en körning för hand flyttar inte schemats markör, inte heller en skarp", async () => {
    const k = korDeps({ avlasningar: [avl(1), avl(2), avl(3)], mappningar: [mappning(1), mappning(2), mappning(3)] });
    // Schemat står efter den andra. Körningen för hand börjar från början och
    // stannar efter den första: hade den sparat sin markör stod den på sku(1).
    await k.markorer.spara("vevor", sku(2));
    const u = await korVevorSynk(k.deps, { ...val, manuell: true, dryRun: false, limit: 1 });
    expect(u.summary?.cursor).toBe(sku(1));
    expect(await k.markorer.las("vevor")).toBe(sku(2));
    expect(k.lager.tillstand.senasteKorning?.manuell).toBe(true);
  });

  it("☠️ en torr körning flyttar inte heller markören", async () => {
    const k = korDeps({ avlasningar: [avl(1), avl(2), avl(3)], mappningar: [mappning(1), mappning(2), mappning(3)] });
    k.lager.tillstand.aktiv = true;
    await k.markorer.spara("vevor", sku(2));
    await korVevorSynk(k.deps, { ...val, manuell: false, dryRun: true, limit: 1 });
    expect(await k.markorer.las("vevor")).toBe(sku(2));
  });

  it("☠️ Aosoms markörer rörs inte av VEVOR-synken", async () => {
    const k = korDeps({ avlasningar: [avl(1), avl(2)], mappningar: [mappning(1), mappning(2)] });
    k.lager.tillstand.aktiv = true;
    await k.markorer.spara("lager", "AOSOM-MARKOR");
    await korVevorSynk(k.deps, { ...val, manuell: false, dryRun: false, limit: 1 });
    expect(await k.markorer.las("lager")).toBe("AOSOM-MARKOR");
  });

  // Två rader vars pris tredubblats hos VEVOR, i två avläsningar i rad. Före 2026-11-25 stoppade taket båda.
  const tvaHopp = (): Miljoval => ({
    avlasningar: [avl(1, { prisSek: BAS * 3, forraPrisSek: BAS * 3 }), avl(2, { prisSek: BAS * 3, forraPrisSek: BAS * 3 })],
    mappningar: [mappning(1), mappning(2)],
  });
  const badaSkrivna = [["wix-1", regelpris(BAS * 3)], ["wix-2", regelpris(BAS * 3)]];

  it("☠️ schemat skriver hoppen av sig självt: ingen behöver godkänna", async () => {
    const k = korDeps(tvaHopp());
    k.lager.tillstand.aktiv = true;
    const u = await korVevorSynk(k.deps, { ...val, manuell: false, dryRun: false });
    expect(k.m.priser.map((p) => [p.id, p.pris])).toEqual(badaSkrivna);
    expect(u.summary?.varningar).toEqual([]);
    expect(u.summary?.storaHopp.map((h) => h.wixProductId)).toEqual(["wix-1", "wix-2"]);
    expect(u.summary?.godkandaHopp).toEqual([]);
  });

  it("en körning för hand skriver dem också, med eller utan godkannPrisandring: utan tak finns inget att godkänna", async () => {
    for (const godkannPrisandring of [undefined, new Set(["wix-1"])]) {
      const k = korDeps(tvaHopp());
      const u = await korVevorSynk(k.deps, { ...val, manuell: true, dryRun: false, godkannPrisandring });
      expect(k.m.priser.map((p) => [p.id, p.pris])).toEqual(badaSkrivna);
      expect(u.summary?.varningar).toEqual([]);
      expect(u.summary?.godkandaHopp).toEqual([]);
      expect(u.summary?.storaHopp).toHaveLength(2);
    }
  });

  it("en torrkörning skriver ingenting men säger vilka hopp den skulle skriva", async () => {
    const k = korDeps(tvaHopp());
    const u = await korVevorSynk(k.deps, { ...val, manuell: true, dryRun: true });
    expect(k.m.priser).toEqual([]);
    expect(u.summary?.storaHopp.map((h) => h.wixProductId)).toEqual(["wix-1", "wix-2"]);
  });

  it("☠️ ett pris som väntar på sin andra avläsning skrivs inte, inte heller med ett godkännande", async () => {
    const k = korDeps({ avlasningar: [avl(1, { prisSek: BAS * 3, forraPrisSek: BAS })] });
    const u = await korVevorSynk(k.deps, { ...val, manuell: true, dryRun: false, godkannPrisandring: new Set(["wix-1"]) });
    expect(k.m.priser).toEqual([]);
    expect(u.summary?.prisVantar).toBe(1);
    expect(u.summary?.godkandaHopp).toEqual([]);
    expect(u.summary?.storaHopp).toEqual([]);
  });

  it("ett upptaget lås ger upptagen, och ingen körning", async () => {
    const k = korDeps();
    await k.lager.tagLas("annan", NU, 300_000);
    const u = await korVevorSynk(k.deps, { ...val, manuell: true, dryRun: true });
    expect(u.utfall).toBe("upptagen");
    expect(k.motorLast()).toBe(0);
  });

  it("låset släpps efter körningen, även när den faller", async () => {
    const k = korDeps();
    k.deps.motor = async () => {
      throw new Error("Wix svarade inte");
    };
    await expect(korVevorSynk(k.deps, { ...val, manuell: true, dryRun: true })).rejects.toThrow();
    expect(k.lager.las).toBeNull();
  });
});

describe("☠️ svaret och loggen bär inga artikelnummer", () => {
  it("utanArtikelnummer tar bort sku ur fel och varningar, och markören", async () => {
    const m = miljo({ avlasningar: [avl(1, { prisSek: BAS * 3, forraPrisSek: BAS * 3 })] });
    const s = await runVevorSync(m.synk, m.kalla, { dryRun: true });
    s.errors.push({ sku: sku(1), wixProductId: "wix-1", error: "ett fel" });
    s.varningar.push({ sku: sku(1), wixProductId: "wix-1", fran: 10, till: 5, andringPct: 0 });
    s.cursor = sku(1);
    const ut = utanArtikelnummer(s);
    const text = JSON.stringify(ut);
    expect(text).not.toContain(sku(1));
    expect(text).toContain("wix-1");
    // De stora hoppen följer med ut, utan artikelnummer.
    expect(ut.storaHopp).toEqual(s.storaHopp);
    expect(Object.keys(ut.storaHopp[0]).sort()).toEqual(["andringPct", "fran", "till", "wixProductId"]);
  });

  it("☠️ loggraden säger vilka priser som hoppade mer än 40 %: Wix-id och butikspriset före och efter", async () => {
    const m = miljo({ avlasningar: [avl(1, { prisSek: BAS * 3, forraPrisSek: BAS * 3 })] });
    const s = await runVevorSync(m.synk, m.kalla, { dryRun: false });
    const rad = synkloggrad({ utfall: "klar", summary: s, markor: null, markorFel: null });
    expect(rad).toContain(`0 varningar, 1 prishopp över 40 % (wix-1 ${regelpris(BAS)}→${regelpris(BAS * 3)}), `);
    expect(rad).not.toMatch(/TESTSKUSYNK/);
    expect(rad).not.toMatch(/godkända prishopp/);
  });

  it("loggraden säger vilka hopp taket höll kvar och vilka som godkändes, för en leverantör som har ett tak", async () => {
    const m = miljo();
    const s = await runVevorSync(m.synk, m.kalla, { dryRun: true });
    s.varningar = [{ sku: sku(1), wixProductId: "wix-1", fran: 100, till: 300, andringPct: 200 }];
    s.godkandaHopp = [{ wixProductId: "wix-2", fran: 100, till: 300, andringPct: 200 }];
    const rad = synkloggrad({ utfall: "klar", summary: s, markor: null, markorFel: null });
    expect(rad).toContain("1 varningar (wix-1 100→300), 1 godkända prishopp (wix-2 100→300), ");
    expect(rad).not.toMatch(/TESTSKUSYNK/);
    expect(rad).not.toMatch(/prishopp över/);
  });

  it("fler stoppade hopp än raden rymmer räknas, de försvinner inte", async () => {
    const m = miljo();
    const s = await runVevorSync(m.synk, m.kalla, { dryRun: true });
    s.varningar = Array.from({ length: HOPP_I_RADEN + 7 }, (_, i) => ({
      sku: sku(i + 1),
      wixProductId: `wix-${i + 1}`,
      fran: 100,
      till: 200,
      andringPct: 100,
    }));
    const rad = synkloggrad({ utfall: "klar", summary: s, markor: null, markorFel: null });
    expect(rad).toContain(`${HOPP_I_RADEN + 7} varningar (wix-1 100→200, `);
    expect(rad).toContain(`wix-${HOPP_I_RADEN} 100→200 … 7 till), `);
    expect(rad).not.toContain(`wix-${HOPP_I_RADEN + 1} `);
    expect(rad).not.toMatch(/TESTSKUSYNK/);
  });

  it("utan stoppade hopp är raden som förut", async () => {
    const m = miljo();
    const s = await runVevorSync(m.synk, m.kalla, { dryRun: true });
    const rad = synkloggrad({ utfall: "klar", summary: s, markor: null, markorFel: null });
    expect(rad).toContain("0 varningar, 0 misslyckade, ");
  });

  it("loggraden bär bara antal", async () => {
    const m = miljo({ avlasningar: [avl(1), avl(2, { lastAt: "2020-01-01T00:00:00.000Z" })], mappningar: [mappning(1), mappning(2)] });
    const s = await runVevorSync(m.synk, m.kalla, { dryRun: true });
    const rad = synkloggrad({ utfall: "klar", summary: s, markor: null, markorFel: null });
    expect(rad).not.toMatch(/TESTSKUSYNK/);
    expect(rad).toMatch(/1 med okänt besked/);
  });
});
