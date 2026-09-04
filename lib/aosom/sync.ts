// Lager- och prissynk för Aosom-sortimentet.
//
// VARFÖR DEN SER HELT ANNORLUNDA UT ÄN ALIEXPRESS-SYNKEN
//
// AE-synken måste ringa DS-API:t en gång per produkt, lever under `maxApiCalls`
// och roterar därför genom katalogen — ett varv tar ~20 timmar och två strikes
// ligger en hel rotation isär. Aosom är **ett enda HTTP-anrop** som ger alla
// 6 057 rader med saldo och pris. Ingen budget, ingen rotation, inga rate limits,
// ingen strike-mekanik: varje körning ser hela sanningen samtidigt.
//
// Det gör problemet mindre — men flyttar också risken. När en körning kan röra
// hela sortimentet på en gång är en trasig feed farligare än en trasig produkt.
// Därför ligger tyngdpunkten här på spärrar mot MASSFEL, inte mot enskilda fel.
//
// ☠️ EN RAD SOM FÖRSVINNER UR FEEDEN ÄR INTE UTGÅNGEN
//
// Aosoms egen B2B-guide, ordagrant: "Items with low stock may be temporarily
// removed to avoid overselling." Raden tas alltså bort SOM ETT LAGERBESKED, och
// kommer tillbaka. Rätt svar är att nolla saldot och låta produkten ligga kvar —
// aldrig att avpublicera eller radera. Nästa körning där raden är tillbaka
// återställer saldot av sig själv.
//
// VAD DEN INTE RÖR
//
// Synlighet, texter, bilder, kategorier. Bara lagersaldo, pris och de tre
// kostnadsfälten på mappningen.

import { fetchAosomFeed, landedCostEur, type AosomRow } from "./feed";
import { aosomSupplierProductId, type AosomFx } from "./to-product";
import { SUPPLIER_VAT_RATE } from "../auction/seed";
import { computePriceWithRules } from "../import/pricing";
import type { PricingRules } from "../import/types";
import type { ProductMappingRecord } from "../store";
import { MIN_WIX_PRODUKTER, type WixProduktPris } from "../wix/v3-products";

const DEFAULT_LIMIT = 400;
const DEFAULT_TIME_BUDGET_MS = 240_000;

/**
 * Under så här många rader är feeden trasig, inte sortimentet.
 *
 * Den här spärren är hela skillnaden mot AE-synken. Där kan ett API-fel nolla
 * EN produkt; här kan en halvhämtad CSV nolla HELA katalogen i en körning.
 * Feeden har legat på 6 057 rader; ett svar under en tredjedel av det är ett
 * transportfel som ska fälla körningen, inte tolkas som att lagret tagit slut.
 */
export const MIN_FEED_RADER = 2000;

/**
 * Saldon på eller under det här visas som SLUTSÅLT.
 *
 * Feeden uppdateras tre gånger per dygn, så mellan två synkar finns ett fönster
 * där Aosoms siffra är gammal. Säger de "3 kvar" och vi visar 3, säljer vi den
 * fjärde. Aosom markerar dessutom själva 276 rader med "Low Stock Alert" — de
 * vet att svansen är opålitlig. Bufferten kostar några enstaka sälj och sparar
 * en återbetalning plus en besviken kund.
 */
export const LAGER_BUFFERT = 3;

/**
 * Produkter per tugga i loopen — och därmed per Wix-anrop.
 *
 * ☠️ DET HÄR TALET ÄR HELA SKILLNADEN MOT DEN GAMLA LOOPEN. Den anropade
 * `bulk-update-inventory` — ett BULK-API som tar en array — med EN produkt i
 * taget, ~2 000 gånger per svep. Uppmätt 2026-09-02 slog det i Wix EDGE-spärr
 * efter ~600 skrivningar: 1 190 av 2 095 föll med 429 och en HTML-kropp. Den
 * spärren går enligt husets egen mätning inte att vänta ut inom ruttens 300
 * sekunder, så medicinen blev pacing (`AOSOM_WRITE_DELAY_MS`) — uthärdligt,
 * men fel lager att laga det på. Med tuggor blir samma svep ~40 anrop, och då
 * är spärren irrelevant i stället för uthärdlig.
 *
 * Femtio och inte hundra: en produkt kan ha flera varianter, alltså flera
 * lagerrader, och läsningens sida är 100 poster. Femtio produkter à två
 * varianter är precis en sida.
 */
export const CHUNK_PRODUKTER = 50;

/** En lagerpost i Wix, så som synken behöver se den. */
export interface AosomLagerpost {
  id: string;
  revision: string;
  productId: string;
  /** Saldot som FAKTISKT står i butiken. Används bara för drift-mätningen. */
  quantity?: number;
}

/** Utfallet av en bulk-lagerskrivning, per rad. */
export interface AosomLagerUtfall {
  lyckade: string[];
  misslyckade: { id: string; fel: string }[];
}

/**
 * Tak på hur mycket ett pris får ändras i EN körning, i procent.
 *
 * Prissynken är avsiktligt tvåvägs och automatisk (Leonards beslut 2026-08-28):
 * stiger inköpet ska priset upp, sjunker det ska priset ner. Men en feed-rad med
 * en trasig siffra — en frakt som råkar bli 0, ett grossistpris med fel decimal —
 * får inte slå igenom till kund. Över taket skrivs ingenting och raden hamnar i
 * `varningar` för en människa att titta på.
 */
export const MAX_PRISANDRING_PCT = 40;

/** Priser under detta är alltid fel. Skyddar mot en tom eller nollad feed-rad. */
const MIN_RIMLIGT_PRIS_SEK = 20;

export interface AosomSyncOptions {
  /** Torrkörning. DEFAULT TRUE — samma husregel som svepet och bildfixen. */
  dryRun?: boolean;
  /**
   * Tak på antal produkter som SKRIVS, inte på antal som granskas.
   *
   * Skillnaden är vad som gör att cronen konvergerar utan sparad markör. En
   * oförändrad produkt kostar noll Wix-anrop — bara en jämförelse i minnet — så
   * den får inte äta av budgeten. Nästa körning börjar om från början, går
   * gratis förbi allt som redan är synkat och skriver de nästa `limit` styckena.
   * Efter några varv är hela sortimentet i fas och varje körning skriver noll.
   */
  limit?: number;
  timeBudgetMs?: number;
  /** Fortsätt EFTER det här artikelnumret (markören ur föregående svar). */
  after?: string;
  /** Bara dessa artikelnummer. För riktad omkörning. */
  onlySkus?: string[];
  /** Hoppa över prisdelen och synka bara lager. */
  skipPrices?: boolean;
}

export interface AosomSyncSummary {
  dryRun: boolean;
  /** Rader i feeden den här körningen — kvittot på att spärren passerades. */
  feedRader: number;
  granskade: number;
  /** Produkter vars lagersaldo skrevs om. */
  lagerUppdaterade: number;
  /** Produkter vars pris skrevs om. */
  prisUppdaterade: number;
  /** Nollade för att raden saknades i feeden (tillfälligt bortplockad hos Aosom). */
  urFeeden: number;
  /** Nollade för att saldot låg på eller under bufferten. */
  slutsalda: number;
  /** Ingen förändring — varken lager eller pris. */
  oforandrade: number;
  /**
   * Produkter där butikens pris inte gick att läsa, så prisdelen hoppades över.
   *
   * ☠️ Egen räknare, inte hopslagen med `oforandrade`. En produkt vi inte kan
   * prisjämföra är inte en produkt som stämmer — och den skillnaden är precis
   * vad som gjorde att de tjugo drivande raderna kunde ligga osedda i en månad.
   */
  utanWixPris: number;
  /**
   * Varför butikens prislista inte gick att läsa, eller null när den gjorde det.
   *
   * ☠️ Ett LÄSFEL FÄLLER INTE LAGERSYNKEN. Att sälja något vi inte har är ett
   * kundfel; att inte hinna rätta ett pris på ett osynligt utkast är det inte.
   * Prisdelen hoppas över (allt hamnar i `utanWixPris`) medan saldona synkas
   * som vanligt — men körningen får aldrig se frisk ut: fältet går ut i svaret,
   * i loggraden, i audit-raden, och fäller workflow-jobbet.
   */
  prislistaFel: string | null;
  /**
   * Produkter som skulle skrivas men saknar lagerrader i Wix.
   *
   * ☠️ EGEN RÄKNARE, för den gamla vägen gjorde det här TYST. `setStock`
   * svarade `if (poster.length === 0) return;` — inget fel, ingen räknare — och
   * loopen räknade ändå upp `lagerUppdaterade` och stämplade mappningen som
   * synkad. En produkt utan lagerrader såg alltså ut som en lyckad skrivning,
   * för alltid. Nionde gången samma klass: ett svar utan fel är inget kvitto.
   *
   * De stämplas inte längre, så de granskas om varje körning. Det kostar
   * ingenting extra — de rider med i tuggans läsning ändå.
   */
  utanLagerrader: number;
  /**
   * OBSERVATION, ingen åtgärd: produkter där butikens FAKTISKA saldo skiljer
   * sig från det mappningen tror att den skrev.
   *
   * ⚠️ Exakt samma frågeställning som `jamforelsePris` byggdes för på PRISET —
   * mappningen är vad vi TROR att kunden ser, Wix är vad kunden faktiskt ser,
   * och en trasig skrivning får de två att glida isär permanent. På priset
   * kostade den förväxlingen en månad och tjugo rader. Lagret triggas
   * fortfarande på mappningens tal, alltså har det samma teoretiska hål.
   *
   * Talet är MEDVETET bara mätt, inte åtgärdat: att byta facit vore en
   * beteendeändring med hela katalogen som blast-radie, samma dag som loopen
   * byggs om. Mät först, som huset gjorde med priserna. Är talet noll finns
   * inget hål; är det stort är nästa PR skriven åt oss.
   */
  lagerDrift: number;
  misslyckade: number;
  kvar: number;
  cursor: string | null;
  stoppedBy: "klart" | "limit" | "tidsbudget";
  errors: { sku: string; error: string }[];
  /** Prisändringar som blockerades av taket. Kräver mänskligt öga. */
  varningar: { sku: string; fran: number; till: number; andringPct: number }[];
}

/**
 * Priset det nyräknade ska jämföras MOT — butikens, aldrig bokföringens.
 *
 * ☠️ HELA BUGGEN BODDE I EN RAD: `const gammalt = variant.grossSek`. Det är
 * mappningens tal, alltså vad vi TROR att kunden ser. Prisskrivningen var
 * trasig i en månad (2026-08-29) men hann ändå uppdatera mappningen, så nästa
 * körning räknade fram exakt det tal som redan stod där, såg ingen skillnad och
 * hoppade över produkten. Tjugo rader kunde därför aldrig självläka: rätt pris
 * i böckerna, fel pris i butiken, och en synk som rapporterade allt friskt.
 *
 * Utfallen är tre, och de är MEDVETET olika:
 *   - `{ pris }`      butiken svarade entydigt → jämför mot det.
 *   - `"saknas"`      produkten fanns inte i svaret. Orörd i Wix, kanske
 *                     raderad, kanske föräldralös mappning. Vi vet inte vad
 *                     kunden ser, så vi skriver INGET pris.
 *   - `"flera"`       produkten har varianter med olika pris. `actualPriceRange`
 *                     är då ett spann, inte ett pris, och synken skriver bara
 *                     variant[0] — att jämföra mot spannets botten hade kunnat
 *                     skriva ner en dyrare variant. Aosom har en variant per
 *                     produkt, så det här ska aldrig hända; händer det är det
 *                     ett besked, inte något att gissa förbi.
 */
export function jamforelsePris(
  wix: WixProduktPris | undefined,
): { pris: number } | "saknas" | "flera" {
  if (!wix) return "saknas";
  if (wix.priceSek === null) return "flera";
  if (wix.variantCount > 1) return "flera";
  return { pris: wix.priceSek };
}

/** Lagersaldot vi faktiskt visar för kund, givet leverantörens siffra. */
export function synligtSaldo(leverantorensSaldo: number): number {
  const q = Math.trunc(leverantorensSaldo);
  if (!Number.isFinite(q) || q <= LAGER_BUFFERT) return 0;
  return q - LAGER_BUFFERT;
}

/** Landad kostnad INKLUSIVE moms, husets konvention för `landedCostSek`. */
export function landadKostnadSek(row: AosomRow, eurToSek: number): number {
  return landedCostEur(row) * eurToSek * (1 + SUPPLIER_VAT_RATE);
}

export interface AosomSyncDeps {
  fetchFeed: () => Promise<AosomRow[]>;
  /**
   * Butikens priser i bulk, `wixProductId` → pris.
   *
   * ☠️ FACIT ÄR WIX, INTE MAPPNINGEN. Se `jamforelsePris` nedan.
   */
  listWixPriser: () => Promise<Map<string, WixProduktPris>>;
  /** Alla Aosom-mappningar. */
  listAosom: () => Promise<ProductMappingRecord[]>;
  /**
   * Lagerposter för FLERA produkter i ETT anrop.
   *
   * ☠️ Ersätter den gamla `setStock`, som slog upp posterna själv per produkt.
   * Uppslaget låg då inne i skrivningen och var därför lika många anrop som
   * skrivningarna: ~900 läsningar plus ~900 skrivningar per svep. `$in` på
   * productId är uppmätt mot skarpa Wix 2026-09-04 (fem id gav fem poster mot
   * ett för ett enskilt id) — inte läst i dokumentationen, som huset redan
   * betalat för att lita på två gånger.
   */
  lasLagerposter: (wixProductIds: string[]) => Promise<AosomLagerpost[]>;
  /**
   * Skriver absoluta lagersaldon i klump och svarar PER RAD.
   *
   * ☠️ PER RAD ÄR INTE EN BEKVÄMLIGHET. "Wix före mappningen" är en garanti
   * PER PRODUKT: en mappning får bara skrivas när just den produktens saldo
   * bevisligen nådde butiken. Med femtio produkter i ett anrop måste utfallet
   * alltså tillbaka till rätt produkt, och det går bara för att Wix svar bär
   * radens id (uppmätt 2026-09-04, både vid framgång och fel). Vore svaret
   * aggregerat hade en enda revisionskonflikt antingen fällt hela tuggan eller
   * bokförts på fel produkt — tyst.
   */
  skrivLager: (
    updates: { id: string; revision: string; quantity: number }[],
  ) => Promise<AosomLagerUtfall>;
  /** Skriver variantpriset OCH inköpskostnaden i Wix. Får aldrig röra synlighet. */
  /**
   * ☠️ Tar variantens WIX-identitet, inte Aosoms artikelnummer.
   *
   * Den här signaturen sa tidigare `sku: string`, och anroparen skickade
   * loopens `sku` — som är feedens artikelnummer ("839-835V01CG"), nyckeln
   * till feed-raden. Wix-variantens SKU är något helt annat
   * ("FP-schlafsofa-2er-sofa-mit"), så matchningen kunde aldrig lyckas.
   * `setStock` tog samma argument men IGNORERADE det (`_sku`) och slog upp
   * lagerposterna på produkt-id — därför fungerade lagret, och därför såg
   * felet ut som om det inte fanns.
   */
  setPrice: (
    wixProductId: string,
    variant: { wixVariantId?: string; sku?: string },
    grossSek: number,
    landedCostSek: number,
  ) => Promise<void>;
  saveMapping: (m: ProductMappingRecord) => Promise<void>;
  fx: AosomFx;
  rules: PricingRules;
  now?: () => number;
}

/** Vad som ska hända med EN produkt. Räknas fram utan ett enda API-anrop. */
export interface Produktplan {
  sku: string;
  m: ProductMappingRecord;
  variant: ProductMappingRecord["variants"][number] | undefined;
  /** Saldot som ska SKRIVAS, eller null när butiken redan har rätt tal. */
  nyttSaldo: number | null;
  /** Saldot vi vill att produkten ska ha, skrivet eller ej. */
  onskatSaldo: number;
  nyttPris: number | null;
  nyLandad: number | null;
  urFeeden: boolean;
  slutsald: boolean;
  utanWixPris: boolean;
  varning: { sku: string; fran: number; till: number; andringPct: number } | null;
}

/**
 * Räknar fram planen för en produkt — REN, utan I/O.
 *
 * ☠️ ATT DEN ÄR REN ÄR VAD SOM GÖR BATCHNINGEN MÖJLIG. Ska femtio produkters
 * saldon skickas i ett anrop måste vi veta vilka rader som ska med INNAN
 * anropet görs. Den gamla loopen vävde ihop räkning och skrivning, så varje
 * produkt var ett eget anrop av nödvändighet.
 *
 * Logiken är oförändrad — samma feedtolkning, samma `jamforelsePris`, samma
 * tak och samma golv som förut. Bara utflyttad.
 */
export function planeraProdukt(
  m: ProductMappingRecord,
  sku: string,
  row: AosomRow | undefined,
  wixPris: WixProduktPris | undefined,
  deps: Pick<AosomSyncDeps, "fx" | "rules">,
  opts: Pick<AosomSyncOptions, "skipPrices">,
): Produktplan {
  const variant = m.variants?.[0];

  // ── LAGER ──────────────────────────────────────────────────────────────
  // Saknad rad = tillfälligt bortplockad hos Aosom, inte utgången. Nolla
  // saldot, lämna sidan. Se filhuvudet.
  const onskatSaldo = row ? synligtSaldo(row.qty) : 0;

  const plan: Produktplan = {
    sku,
    m,
    variant,
    nyttSaldo: m.aosomSyncedQty !== onskatSaldo ? onskatSaldo : null,
    onskatSaldo,
    nyttPris: null,
    nyLandad: null,
    urFeeden: !row,
    slutsald: !!row && onskatSaldo === 0,
    utanWixPris: false,
    varning: null,
  };

  // ── PRIS ───────────────────────────────────────────────────────────────
  // Bara när raden finns: utan rad finns inget nytt pris att räkna på, och ett
  // gammalt pris på en slutsåld vara skadar ingen.
  if (!row || opts.skipPrices || !variant) return plan;

  const nyLandad = landadKostnadSek(row, deps.fx.eurToSek);
  const costUsd = nyLandad / deps.fx.usdToSek;
  // Kategorin är null: Aosom-utkast är okategoriserade tills poleringen sätter
  // den, och prisregeln har ändå inga kategorimultiplikatorer (rensade
  // 2026-08-27 — "Husdjur: 2,5" hade satt 60 % marginal på hela
  // PawHut-sortimentet utan att någon regel sa det).
  const pris = computePriceWithRules(costUsd, deps.rules, null).grossSek;

  // ☠️ FACIT ÄR BUTIKEN. Se jamforelsePris — mappningens grossSek är vad vi
  // TROR att kunden ser, och de två kan ha glidit isär.
  const facit = jamforelsePris(wixPris);
  const gammalt = typeof facit === "object" ? facit.pris : -1;

  if (typeof facit === "string") {
    // Vet vi inte vad kunden ser skriver vi inget pris. Lagret ovan är redan
    // planerat — det uppslaget går på produkt-id och berörs inte.
    plan.utanWixPris = true;
    return plan;
  }
  if (pris < MIN_RIMLIGT_PRIS_SEK) {
    plan.varning = { sku, fran: gammalt, till: pris, andringPct: 0 };
    return plan;
  }
  if (gammalt > 0) {
    const andringPct = ((pris - gammalt) / gammalt) * 100;
    if (Math.abs(andringPct) > MAX_PRISANDRING_PCT) {
      // Tvåvägssynken är medvetet automatisk, men ett hopp av den här
      // storleken är oftare en trasig feed-rad än en verklig prisändring.
      plan.varning = { sku, fran: gammalt, till: pris, andringPct: Math.round(andringPct) };
      return plan;
    }
    if (pris !== gammalt) {
      plan.nyttPris = pris;
      plan.nyLandad = nyLandad;
    }
    return plan;
  }
  if (pris > 0) {
    plan.nyttPris = pris;
    plan.nyLandad = nyLandad;
  }
  return plan;
}

/**
 * Kör en tugga av lager- och prissynken.
 *
 * Ordningen är artikelnummer stigande, samma som svepet och bildfixen, så
 * markören betyder samma sak i alla tre.
 */
export async function runAosomSync(
  deps: AosomSyncDeps,
  opts: AosomSyncOptions = {},
): Promise<AosomSyncSummary> {
  const dryRun = opts.dryRun !== false;
  const limit = Math.max(1, opts.limit ?? DEFAULT_LIMIT);
  const timeBudgetMs = opts.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS;
  const now = deps.now ?? (() => Date.now());
  const start = now();

  const feed = await deps.fetchFeed();

  // ☠️ MASSFEL-SPÄRREN. Kollas FÖRE allt annat och kastar — en halvhämtad feed
  // får aldrig se ut som att sortimentet tagit slut.
  if (feed.length < MIN_FEED_RADER) {
    throw new Error(
      `Aosom-feeden gav bara ${feed.length} rader (minst ${MIN_FEED_RADER} krävs). `
        + `Körningen avbryts — det här är ett hämtningsfel, inte ett lagerbesked.`,
    );
  }

  // ☠️ BUTIKENS PRISER, EN GÅNG. ~54 anrop för hela katalogen — se
  // `listV3ProductPrices`. Hämtas FÖRE loopen så en produkt aldrig jämförs mot
  // ett facit som hunnit ändras mitt i körningen.
  //
  // Massfel-spärren speglar MIN_FEED_RADER: svarar Wix med en handfull
  // produkter är det ett läsfel, och alternativet vore att tolka det som "de
  // här produkterna finns inte i butiken" och sluta prisjämföra hela
  // sortimentet — tyst, och exakt den sortens fel som redan kostat en månad.
  //
  // ☠️ OCH DEN FÄLLER INTE KÖRNINGEN, till skillnad från MIN_FEED_RADER.
  // Skillnaden är vad felet KOSTAR. En trasig feed nollar lagersaldon över hela
  // katalogen — där är avbrott enda säkra svaret. En oläsbar prislista kan
  // ingenting förstöra: `jamforelsePris` svarar "saknas" och då skrivs inget
  // pris. Att ändå avbryta hade stoppat LAGERSYNKEN i sex timmar för ett fel i
  // prisdelen, och att sälja något vi inte har är ett kundfel medan ett orättat
  // pris på ett osynligt utkast inte är det.
  //
  // Priset för att fortsätta är att körningen inte får se frisk ut: felet går
  // ut i `prislistaFel` → svaret, loggraden, audit-raden och workflow-jobbet.
  let wixPriser = new Map<string, WixProduktPris>();
  let prislistaFel: string | null = null;
  if (!opts.skipPrices) {
    try {
      wixPriser = await deps.listWixPriser();
      if (wixPriser.size < MIN_WIX_PRODUKTER) {
        throw new Error(
          `butikens prislista gav bara ${wixPriser.size} produkter (minst ${MIN_WIX_PRODUKTER} krävs) `
            + `— det här är ett läsfel, inte en tom katalog`,
        );
      }
    } catch (err) {
      prislistaFel = err instanceof Error ? err.message : String(err);
      // Tom karta → varje produkt blir "saknas" → utanWixPris. Inget pris
      // skrivs, och det syns i räknaren i stället för att gissas förbi.
      wixPriser = new Map();
    }
  }

  const perSku = new Map(feed.map((r) => [r.sku, r]));
  const onlySkus = opts.onlySkus?.length ? new Set(opts.onlySkus) : null;

  const mappningar = (await deps.listAosom())
    .filter((m) => !!m.wixProductId)
    .map((m) => ({ m, sku: (m.supplierProductId ?? "").slice(aosomSupplierProductId("").length) }))
    .filter((x) => x.sku && (!onlySkus || onlySkus.has(x.sku)))
    .filter((x) => !opts.after || x.sku.localeCompare(opts.after) > 0)
    .sort((a, b) => a.sku.localeCompare(b.sku));

  const summary: AosomSyncSummary = {
    dryRun,
    feedRader: feed.length,
    granskade: 0,
    lagerUppdaterade: 0,
    prisUppdaterade: 0,
    urFeeden: 0,
    slutsalda: 0,
    oforandrade: 0,
    utanWixPris: 0,
    prislistaFel,
    utanLagerrader: 0,
    lagerDrift: 0,
    misslyckade: 0,
    kvar: mappningar.length,
    cursor: null,
    stoppedBy: "klart",
    errors: [],
    varningar: [],
  };

  /** Antal produkter vi FAKTISKT skrivit. Det är den här `limit` gäller. */
  let skrivna = 0;

  // ── LOOPEN GÅR I TUGGOR, INTE EN PRODUKT I TAGET ────────────────────────
  // Ordningen inom tuggan är oförändrad artikelnummerordning, och HELA tuggan
  // granskas innan markören flyttas — så `?after=` betyder exakt samma sak som
  // förut.
  //
  // ☠️ TUGGAN KAPAS MOT DET SOM ÅTERSTÅR AV `limit`. En tugga med N produkter
  // kan aldrig ge fler än N skrivningar, så `min(CHUNK, limit - skrivna)` gör
  // `limit` EXAKT i stället för ungefärlig. Utan kapningen hade en körning med
  // `limit: 1` skrivit hela den första tuggan — och `limit` finns för att
  // hålla en serverless-rutt innanför sina 300 sekunder, inte som en
  // riktlinje. Ett test på markören fångade just det.
  for (let i = 0; i < mappningar.length; ) {
    if (skrivna >= limit) {
      summary.stoppedBy = "limit";
      break;
    }
    // Budgeten kollas FÖRE varje tugga — aldrig mitt i, där lagret hunnit
    // skrivas men mappningen inte.
    if (now() - start >= timeBudgetMs) {
      summary.stoppedBy = "tidsbudget";
      break;
    }

    const tuggstorlek = Math.max(1, Math.min(CHUNK_PRODUKTER, limit - skrivna));
    const tugga = mappningar.slice(i, i + tuggstorlek);
    i += tugga.length;

    // ── FAS 1: PLANERA (ren, ingen I/O) ──────────────────────────────────
    // Allt underlag ligger redan i minnet — feeden och butikens prislista
    // hämtades före loopen. Att räkna först och skriva sedan är vad som gör
    // batchningen möjlig: vi vet vilka rader som ska med i anropet innan vi
    // gör det.
    const planer = tugga.map(({ m, sku }) =>
      planeraProdukt(m, sku, perSku.get(sku), wixPriser.get(m.wixProductId), deps, opts),
    );

    summary.granskade += tugga.length;
    summary.kvar -= tugga.length;
    summary.cursor = tugga[tugga.length - 1].sku;
    for (const p of planer) {
      if (p.urFeeden) summary.urFeeden++;
      if (p.slutsald) summary.slutsalda++;
      if (p.utanWixPris) summary.utanWixPris++;
      if (p.varning) summary.varningar.push(p.varning);
    }

    // ── FAS 2: LÄS LAGERPOSTERNA FÖR HELA TUGGAN, I ETT ANROP ────────────
    // Läses även i torrläge, till skillnad från förr. En torrkörning ska säga
    // sanningen om vad en skarp skulle göra, och `utanLagerrader` går inte att
    // veta utan att titta. Läsningar ändrar ingenting.
    const idn = planer.map((p) => p.m.wixProductId);
    let posterPerProdukt = new Map<string, AosomLagerpost[]>();
    let lasfel: string | null = null;
    try {
      for (const post of await deps.lasLagerposter(idn)) {
        const lista = posterPerProdukt.get(post.productId);
        if (lista) lista.push(post);
        else posterPerProdukt.set(post.productId, [post]);
      }
    } catch (err) {
      lasfel = err instanceof Error ? err.message : String(err);
      posterPerProdukt = new Map();
    }

    // ⚠️ OBSERVATION, ingen åtgärd. Se `lagerDrift` i summeringen: butikens
    // faktiska saldo mot det mappningen tror att den skrev.
    if (!lasfel) {
      for (const p of planer) {
        const poster = posterPerProdukt.get(p.m.wixProductId) ?? [];
        const iButiken = poster[0]?.quantity;
        if (
          typeof iButiken === "number"
          && typeof p.m.aosomSyncedQty === "number"
          && iButiken !== p.m.aosomSyncedQty
        ) {
          summary.lagerDrift++;
        }
      }
    }

    // ── FAS 3: SKRIV SALDONA I KLUMP ─────────────────────────────────────
    /** wixProductId → lagerskrivningen gick igenom (eller behövdes inte). */
    const lagerOk = new Map<string, boolean>();
    const rader: { id: string; revision: string; quantity: number; produkt: string }[] = [];

    for (const p of planer) {
      if (p.nyttSaldo === null) continue;
      if (lasfel) {
        lagerOk.set(p.m.wixProductId, false);
        continue;
      }
      const poster = posterPerProdukt.get(p.m.wixProductId) ?? [];
      if (poster.length === 0) {
        // ☠️ Räknas, stämplas inte. Den gamla vägen svarade tyst `return` här
        // och bokförde ändå produkten som synkad — för alltid.
        summary.utanLagerrader++;
        lagerOk.set(p.m.wixProductId, false);
        continue;
      }
      for (const post of poster) {
        rader.push({
          id: post.id,
          revision: post.revision,
          quantity: p.nyttSaldo,
          produkt: p.m.wixProductId,
        });
      }
    }

    if (rader.length > 0 && !dryRun) {
      try {
        const utfall = await deps.skrivLager(
          rader.map(({ id, revision, quantity }) => ({ id, revision, quantity })),
        );
        const fallna = new Map(utfall.misslyckade.map((f) => [f.id, f.fel]));
        const felPerProdukt = new Map<string, string>();
        for (const r of rader) {
          const fel = fallna.get(r.id);
          if (fel && !felPerProdukt.has(r.produkt)) felPerProdukt.set(r.produkt, fel);
        }
        // ☠️ En produkt är OK bara när INGEN av dess rader föll. Halvskrivet
        // lager är svårare att upptäcka än orört: mappningen hade sagt
        // "synkad" medan en variant stod kvar på gammalt saldo.
        for (const produkt of new Set(rader.map((r) => r.produkt))) {
          lagerOk.set(produkt, !felPerProdukt.has(produkt));
        }
        for (const [produkt, fel] of felPerProdukt) {
          const p = planer.find((x) => x.m.wixProductId === produkt);
          summary.misslyckade++;
          summary.errors.push({ sku: p?.sku ?? produkt, error: fel });
        }
      } catch (err) {
        // Hela anropet föll (nätverk, 4xx/5xx efter återförsök). Ingen rad är
        // bevisat skriven, alltså är ingen produkt det heller.
        const fel = err instanceof Error ? err.message : String(err);
        for (const r of rader) lagerOk.set(r.produkt, false);
        for (const produkt of new Set(rader.map((r) => r.produkt))) {
          const p = planer.find((x) => x.m.wixProductId === produkt);
          summary.misslyckade++;
          summary.errors.push({ sku: p?.sku ?? produkt, error: fel });
        }
      }
    } else {
      // Torrläge, eller inga saldon att skriva: allt som skulle skrivas räknas
      // som lyckat, precis som förr.
      for (const produkt of new Set(rader.map((r) => r.produkt))) lagerOk.set(produkt, true);
    }

    // Lässkadan bokförs en gång per drabbad produkt, efter att raderna räknats.
    if (lasfel) {
      for (const p of planer) {
        if (p.nyttSaldo === null) continue;
        summary.misslyckade++;
        summary.errors.push({ sku: p.sku, error: `lagerposterna gick inte att läsa: ${lasfel}` });
      }
    }

    // ── FAS 4 + 5: PRISET, SEDAN MAPPNINGEN — PER PRODUKT ────────────────
    // Priset är per produkt hos Wix (`updateV3VariantPrices` tar ett
    // produkt-id), så den delen kan inte batchas. Den är också den lilla
    // delen: efter konvergens vill nästan inga priser skrivas.
    for (const p of planer) {
      const skrevLager = p.nyttSaldo !== null;
      if (skrevLager && lagerOk.get(p.m.wixProductId) !== true) continue;

      try {
        if (skrevLager) summary.lagerUppdaterade++;

        let skrevPris = false;
        if (p.nyttPris !== null && p.nyLandad !== null && p.variant) {
          if (!dryRun) {
            await deps.setPrice(
              p.m.wixProductId,
              { wixVariantId: p.variant.wixVariantId, sku: p.variant.sku },
              p.nyttPris,
              p.nyLandad,
            );
          }
          summary.prisUppdaterade++;
          skrevPris = true;
        }

        if (!skrevLager && !skrevPris) {
          summary.oforandrade++;
          continue;
        }
        skrivna++;

        // ── MAPPNINGEN SIST ──────────────────────────────────────────────
        // Wix skrivs FÖRE mappningen, samma ordning och samma skäl som
        // price-repair: går bara den ena igenom står kunden inför rätt pris
        // medan bokföringen är gammal, och nästa körning rättar det. Omvänd
        // ordning hade gjort mappningen "synkad" medan kunden köper till fel
        // pris — och då hittar ingen felet igen.
        //
        // ☠️ `aosomSyncedQty` stämplas BARA när saldot faktiskt skrevs. Skrevs
        // bara priset behåller fältet sitt gamla värde, så nästa körning
        // fortfarande ser att saldot vill skrivas.
        if (!dryRun) {
          const uppdaterad: ProductMappingRecord = {
            ...p.m,
            ...(skrevLager
              ? { aosomSyncedQty: p.onskatSaldo, aosomSyncedAt: new Date(now()).toISOString() }
              : {}),
            variants: (p.m.variants ?? []).map((v, idx) =>
              idx === 0 && p.nyttPris !== null && p.nyLandad !== null
                ? {
                    ...v,
                    grossSek: p.nyttPris,
                    landedCostSek: p.nyLandad,
                    costUsd: p.nyLandad / deps.fx.usdToSek,
                  }
                : v,
            ),
          };
          await deps.saveMapping(uppdaterad);
        }
      } catch (err) {
        summary.misslyckade++;
        summary.errors.push({ sku: p.sku, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }

  if (summary.kvar <= 0) summary.cursor = null;
  return summary;
}

/**
 * Paus mellan två Wix-SKRIVNINGAR i skarpt läge.
 *
 * ☠️ UPPMÄTT, INTE GISSAT (2026-09-02). Ett skarpt svep försökte 2 095
 * lagerskrivningar i rad och fick 1 190 stycken **429 med en HTML-kropp** —
 * Wix EDGE-spärr, inte API-nivåns JSON-fel. Skalan:
 *
 *   |  försökta skrivningar | fel  |
 *   |----------------------:|-----:|
 *   |                    40 |    0 |
 *   |                 1 150 |  521 |
 *   |                 2 095 | 1190 |
 *
 * Återförsök räcker inte mot den spärren — huset har redan mätt att den inte
 * går att vänta ut inom ruttens 300 sekunder (media-städningen, 2026-08-28).
 * Det som håller den borta är att inte springa. Samma medicin som
 * `MEDIA_UPLOAD_DELAY_MS` och `FREIGHT_CALL_DELAY_MS`, av samma skäl.
 *
 * Ligger i `liveDeps`, inte i loopen: pacing hör till den skarpa skrivvägen,
 * och testerna injicerar sina egna deps och ska inte bli långsamma av den.
 */
export function aosomSkrivPausMs(): number {
  const n = Number(process.env.AOSOM_WRITE_DELAY_MS);
  return Number.isFinite(n) && n >= 0 ? n : 120;
}

/** Standard-deps mot skarpa systemet. Bryts ut så testerna slipper mocka moduler. */
export async function liveDeps(): Promise<AosomSyncDeps> {
  const [{ getStore }, { getPricingRules }, { eurToSekFromEnv }, wix, v3] = await Promise.all([
    import("../store/factory"),
    import("../store/pricing-config"),
    import("../config"),
    import("../wix/client"),
    import("../wix/v3-products"),
  ]);
  const rules = await getPricingRules();
  const store = getStore();

  const pausMs = aosomSkrivPausMs();
  const pausa = () => (pausMs > 0 ? new Promise((r) => setTimeout(r, pausMs)) : Promise.resolve());

  return {
    fetchFeed: () => fetchAosomFeed(),
    listWixPriser: () => v3.listV3ProductPrices(),
    listAosom: async () =>
      (await store.listMappings()).filter((m) =>
        (m.supplierProductId ?? "").startsWith(aosomSupplierProductId("")),
      ),
    lasLagerposter: (ids) => wix.queryInventoryItemsByProductIds(ids),
    // Pacingen ligger kvar trots att anropen är ~40 i stället för ~2 000.
    // Den kostar fem sekunder på ett helt svep och är den enda kuren mot en
    // strypning som utlöses av tempo — se `aosomSkrivPausMs`.
    skrivLager: async (updates) => {
      await pausa();
      return wix.bulkUpdateInventoryQuantitiesPerRad(updates);
    },
    // updateV3VariantPrices skickar tillbaka `visible` oförändrad — utan det
    // publicerar en variantsInfo-PATCH utkastet (uppmätt 2026-08-28).
    setPrice: async (wixProductId, variant, grossSek, landedCostSek) => {
      await pausa();
      // ☠️ SVARET MÅSTE LÄSAS. updateV3VariantPrices returnerar {updated, missing}
      // och KASTAR INTE när ingen variant matchade — den hoppar över PATCH:en och
      // returnerar tyst. Det gamla anropet slängde returvärdet, så synken räknade
      // upp `prisUppdaterade` och skrev mappningen med det nya priset medan Wix
      // behöll det gamla. Uppmätt 2026-08-29 på bäddsoffan `efaa0c7b`: mappningen
      // sa 3 529 kr, kunden såg 4 539 kr, och produkten stod kvar på revision 1.
      //
      // Sjunde gången samma lärdom i det här repot: ett svar utan fel är inget
      // kvitto. Räkna efter.
      const resultat = await v3.updateV3VariantPrices(wixProductId, [
        {
          ...(variant.wixVariantId ? { wixVariantId: variant.wixVariantId } : {}),
          ...(variant.sku ? { sku: variant.sku } : {}),
          actualPrice: grossSek,
          costAmount: Math.round(landedCostSek),
        },
      ]);
      if (resultat.updated === 0) {
        throw new Error(
          `prisskrivningen matchade ingen variant på ${wixProductId} `
          + `(sökte ${resultat.missing.join(", ") || "utan nyckel"}) — priset i Wix är oförändrat`,
        );
      }
    },
    saveMapping: (m) => store.saveMapping(m),
    fx: { eurToSek: eurToSekFromEnv(), usdToSek: rules.usdToSek },
    rules,
  };
}
