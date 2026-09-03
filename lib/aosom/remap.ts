// Pekar om en Wix-produkt från AliExpress till Aosoms feed.
//
// VARFÖR MODULEN FINNS. `FyndplatsMappings` har 595 av 1 004 rader från
// "byaosom ES (EU) Store" — 59 % av katalogen är alltså Aosom-varor som köpts
// via AliExpress. Feed-importens dubblettspärr nycklar på `supplierProductId`
// och kan inte se dem: de bär ett AE-listnings-id och ser för spärren ut som
// något helt annat. Importen skapar därför en ANDRA sida för samma fysiska
// produkt, och två egna URL:er med samma foton är den dubblett Google faktiskt
// straffar (CLAUDE.md, "Den farliga dubbletten är intern").
//
// Leonards beslut 2026-09-03: äkta dubbletter ska mappa om till Aosom. Att köpa
// direkt ur feeden är dessutom vad B2B-kontot är till för — men bara när
// marginalen håller, för SE-frakten är per kolli och kan äta hela påslaget.
//
// ☠️ MODULEN MATCHAR ALDRIG SJÄLV. Paret (wixProductId, sku) kommer från en
// människa som jämfört mått, produkttyp och bilder — så gjordes de 33 i
// leverantörsjämförelsen 2026-08-27. En automatisk gissning skulle slå ihop
// varor som inte är samma, och då beställs fel artikel hem till en kund. Samma
// hållning som prisreparationens "det finns ingen kör-allt-flagga": listan med
// id:n ÄR kvitteringen på att någon läst planen.
//
// Modulen är REN: inga anrop, ingen tid, inget I/O. Anroparen matar in
// mappningsraden och feed-raden och får tillbaka en plan eller en ny rad.

import type { ProductMappingRecord } from "../store";
import { mappingSupplier } from "../store/supplier";
import { SUPPLIER_VAT_RATE } from "../import/pricing";
import { marginEfterByte } from "../sync/warehouse-failover";
import { freightShare, isShippableToSe, landedCostEur, type AosomRow } from "./feed";
import { aosomSupplierProductId, type AosomFx } from "./to-product";

/**
 * Lägsta marginal (netto mot netto) vi accepterar EFTER ommappningen.
 *
 * Samma tal som `MIN_FAILOVER_MARGIN_PCT` och av samma skäl: att sälja med
 * förlust är ett sämre utfall än status quo. Egen konstant ändå — de två
 * besluten kan behöva glida isär, och talet är en delad AVVÄGNING, inte en
 * delad sanning.
 *
 * Att golvet behövs är inte teoretiskt. Aosoms SE-frakt är per kolli och
 * viktstyrd; över feedens 6 056 rader är medianen 40 % av inköpet, och på
 * 1 283 rader kostar frakten MER än varan. En vara som gick ihop med
 * AE:s levererade EU-lagerpris kan alltså gå med förlust hos Aosom vid
 * oförändrat kundpris.
 */
export const MIN_REMAP_MARGIN_PCT = 5;

export type RemapHinder =
  | "ingen_mappning"
  | "saknas_i_feeden"
  | "ej_skeppbar_till_se"
  | "redan_aosom"
  | "skun_upptagen"
  | "flera_varianter"
  | "pris_okant"
  | "marginal_under_golv";

export interface RemapPlan {
  wixProductId: string;
  sku: string;
  /** Leverantören raden har NU. */
  frånLeverantör: string;
  /** Landad kostnad inkl. moms som raden bär nu, eller null om den saknas. */
  gammalLandadSek: number | null;
  /** Landad kostnad inkl. moms efter bytet — vara + SE-frakt, uppbruttad. */
  nyLandadSek: number;
  nyCostUsd: number;
  /** Hur stor del av det nya inköpet som är frakt (0–1). */
  fraktandel: number;
  /** Kundens pris, oförändrat — ommappningen rör aldrig priset. */
  prisSek: number | null;
  /** Marginal netto mot netto EFTER bytet. */
  nyMarginalPct: number | null;
  /** Marginalen raden hade före bytet, när den gick att räkna ut. */
  gammalMarginalPct: number | null;
  /** Wix-produkten som pensioneras som dubblett, om anroparen angav en. */
  dubblett?: string;
  /** Tomt = planen går att köra. Annars står skälen här. */
  hinder: RemapHinder[];
}

export interface RemapInput {
  /** Mappningsraden för sidan vi BEHÅLLER. */
  mappning: ProductMappingRecord | null | undefined;
  /** Feed-raden vi pekar om till, eller undefined om SKU:n inte fanns. */
  rad: AosomRow | undefined;
  /** Alla mappningsrader — för att se om SKU:n redan är upptagen. */
  alla: Pick<ProductMappingRecord, "supplier" | "supplierProductId" | "wixProductId">[];
  fx: AosomFx;
  /** Wix-produkten som ska pensioneras som dubblett (valfritt). */
  dubblett?: string;
  minMarginPct?: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Landad kostnad INKL. moms för en feed-rad.
 *
 * ☠️ Uppbruttningen är inte kosmetisk. `landedCostSek` lagras enligt husets
 * konvention INKLUSIVE moms — auktionens golvbud delar med 1,25 innan det
 * räknar. Aosoms B2B-fakturor är NETTO (omvänd skattskyldighet); sparas
 * beloppet rakt av hamnar ett nettotal i ett fält som läses som brutto, och
 * golvbudet blir 20 % för lågt. Samma räkning som `toAliExpressProduct`.
 */
export function landadInklMoms(rad: AosomRow, eurToSek: number): number {
  return landedCostEur(rad) * eurToSek * (1 + SUPPLIER_VAT_RATE);
}

/** Planerar en ommappning utan att röra något. */
export function planeraOmmappning(input: RemapInput): RemapPlan {
  const { mappning, rad, alla, fx } = input;
  const hinder: RemapHinder[] = [];
  const golv = input.minMarginPct ?? MIN_REMAP_MARGIN_PCT;

  const sku = rad?.sku ?? "";
  const nyLandadSek = rad ? round2(landadInklMoms(rad, fx.eurToSek)) : 0;
  const nyCostUsd = fx.usdToSek > 0 ? round2(nyLandadSek / fx.usdToSek) : 0;

  if (!mappning) hinder.push("ingen_mappning");
  if (!rad) hinder.push("saknas_i_feeden");
  if (rad && !isShippableToSe(rad)) hinder.push("ej_skeppbar_till_se");
  if (mappning && mappingSupplier(mappning) === "aosom") hinder.push("redan_aosom");

  // En SKU som redan sitter på en ANNAN produkt betyder att vi håller på att
  // skapa exakt den dubblett ommappningen finns för att ta bort.
  if (rad) {
    const id = aosomSupplierProductId(rad.sku);
    const upptagenAv = alla.find(
      (m) => m.supplierProductId === id && m.wixProductId !== mappning?.wixProductId,
    );
    if (upptagenAv) hinder.push("skun_upptagen");
  }

  // ☠️ EN AOSOM-RAD ÄR EN ENDA ARTIKEL. En flervariantssida (färger, storlekar)
  // skulle peka varenda variant på samma artikelnummer, och då beställs fel
  // färg hem så fort kunden väljer något annat än den första. Sådana sidor
  // kräver en SKU per variant — ett annat och större jobb.
  const varianter = mappning?.variants ?? [];
  if (varianter.length > 1) hinder.push("flera_varianter");

  const prisSek = varianter[0]?.grossSek ?? null;
  const gammalLandadSek = varianter[0]?.landedCostSek ?? null;
  if (!(prisSek && prisSek > 0)) hinder.push("pris_okant");

  const nyMarginalPct = prisSek ? marginEfterByte(prisSek, nyLandadSek) : null;
  const gammalMarginalPct =
    prisSek && gammalLandadSek != null ? marginEfterByte(prisSek, gammalLandadSek) : null;

  if (nyMarginalPct != null && nyMarginalPct < golv) hinder.push("marginal_under_golv");

  return {
    wixProductId: mappning?.wixProductId ?? "",
    sku,
    frånLeverantör: mappning ? mappingSupplier(mappning) : "okänd",
    gammalLandadSek,
    nyLandadSek,
    nyCostUsd,
    fraktandel: rad ? round3(freightShare(rad)) : 0,
    prisSek,
    nyMarginalPct: nyMarginalPct == null ? null : round2(nyMarginalPct),
    gammalMarginalPct: gammalMarginalPct == null ? null : round2(gammalMarginalPct),
    ...(input.dubblett ? { dubblett: input.dubblett } : {}),
    hinder,
  };
}

/**
 * Bygger den ommappade raden.
 *
 * ☠️ SLÅ IHOP, ERSÄTT INTE. Wix items/save är en HELERSÄTTNING och
 * JSON.stringify tappar undefined, så ett objekt byggt från grunden raderar
 * allt som inte står i literalen: draftStatus, seoTitle, createdAt, priority,
 * imageAnalysis. En rad utan draftStatus matchar dessutom varken kön eller
 * "senast importerade" i /admin/queue — produkten försvinner ur admin helt.
 * Samma lärdom som createMappingAction bär i sin kommentar.
 *
 * Allt som beskriver den GAMLA AE-LISTNINGEN måste däremot bort, annars länkar
 * "Källa" till en vara vi inte längre köper, lagerlandet visar fel och synkens
 * strike-räknare fortsätter på en listning raden inte har.
 */
export function tillämpaOmmappning(
  befintlig: ProductMappingRecord,
  rad: AosomRow,
  fx: AosomFx,
): ProductMappingRecord {
  const landedCostSek = round2(landadInklMoms(rad, fx.eurToSek));
  const costUsd = fx.usdToSek > 0 ? round2(landedCostSek / fx.usdToSek) : 0;

  return {
    ...befintlig,
    supplierProductId: aosomSupplierProductId(rad.sku),
    supplier: "aosom",
    sourceUrl: rad.url,
    aosomFreightShare: round3(freightShare(rad)),

    // Kostnaden byter leverantör; PRISET rörs aldrig här. Det är Leonards
    // beslut, och en ommappning som tyst räknade om kundens pris hade dessutom
    // gjort planen omöjlig att granska — man ser marginalen i planen och
    // bestämmer sig separat.
    variants: (befintlig.variants ?? []).map((v) => ({
      ...v,
      supplierVariantId: rad.sku,
      costUsd,
      landedCostSek,
      // Fraktbarhetsverdikten gällde AE:s SKU och betyder ingenting för en
      // Aosom-artikel. Lämnas de kvar kan ett gammalt nej nolla lagret på en
      // vara som går utmärkt att skicka.
      shippableToSe: undefined,
      shippabilityCheckedAt: undefined,
      shippabilityManual: undefined,
      shippabilityNegativeStreak: undefined,
      shippabilityNegativeSince: undefined,
      // Spår efter ett lagerbyte inom AE. Betyder ingenting för en Aosom-rad.
      previousSupplierVariantId: undefined,
      shipFromSwitchedAt: undefined,
    })),

    // Per-AE-listning: skulle ljuga efter bytet.
    shipsFromCountries: undefined,
    hasEuWarehouse: undefined,
    warehouseClass: undefined,
    supplierId: undefined,
    supplierName: undefined,

    // AE-synkens tillstånd (listingStatus, removedStreak, zeroStreak,
    // errorStreak) bor INTE här utan i synkens eget state, sparat per
    // WIX-PRODUKT — det överlever alltså bytet. Det är ofarligt just för att
    // spärren är en typ: `supplier: "aosom"` gör `isAliExpressMapping` falsk,
    // AE-synken hoppar över raden och läser aldrig tillståndet igen.
    // Aosom-synken (`20 */6 * * *`) skriver lager och pris ur feeden på nästa
    // varv och äger raden därefter.

    // Recensionerna hämtades från AE-listningen och hör till den varan, inte
    // till Aosom-artikeln. Stämpeln nollas så backfillen får titta igen — utan
    // det skulle produkten stå utan omdömen i 30 dagar utan att någon vet varför.
    reviewsCheckedAt: undefined,

    // Aosom-synken skriver sina egna. Gamla värden från en annan källa skulle
    // få den att tro att produkten redan är synkad och hoppa över den.
    aosomSyncedQty: undefined,
    aosomSyncedAt: undefined,
  } as ProductMappingRecord;
}

/**
 * Pensionerar dubbletten.
 *
 * Sidan RADERAS inte. Ett osynligt utkast kostar ingenting medan det ligger,
 * och en radering går inte att ångra om matchningen visar sig vara fel.
 * `rejected` + `needsAiPolish: false` räcker: raden lämnar poleringskön, så
 * ingen skriver om en produkt vi ändå inte ska sälja. Samma vokabulär som
 * /admin/queue redan använder — ingen ny status behövs.
 */
export function pensioneraDubblett(m: ProductMappingRecord): ProductMappingRecord {
  return {
    ...m,
    draftStatus: "rejected",
    needsAiPolish: false,
    reviewedAt: new Date().toISOString(),
  };
}
