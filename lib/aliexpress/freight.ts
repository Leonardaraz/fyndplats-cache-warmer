// lib/aliexpress/freight.ts
//
// Fraktbarhet till Sverige per SKU — ren tolkningslogik (ingen I/O).
//
// Bakgrund (2026-07-13, SucceBuy-lådskåpet): AliExpress produktdata visar
// LAGER för en SKU (26 st) samtidigt som kassan säger "can't be shipped to
// your address" — säljarens fraktmall täcker inte Sverige för just den SKU:n.
// Lagersynk och fraktbarhet är alltså två olika saker; denna modul tolkar
// svaret från fraktAPI:erna så synken kan nolla ofraktbara varianter.
//
// Två API-generationer förekommer (klienten provar båda, se
// queryFreightToCountry i client.ts):
//   - aliexpress.ds.freight.query           → delivery_options-lista
//   - aliexpress.logistics.buyer.freight.calculate
//                                            → aeop_freight_calculate_result_…-lista
// LÄRDOM 2026-07-14 (kod röd): API:ts NEJ-svar är INTE pålitliga per anrop.
// Nattens rotation gav DELIVERY_NOT_AVAILABLE_TO_YOUR_ADDRESS för enskilda
// färgvarianter hos säljare som bevisligen levererar (Aosom ES — samma
// säljare som hundvagnen — fick "Beige ok, Grå nej" på samma vägghylla).
// 8 produkter nollades felaktigt. Därför gäller nu: ENDAST POSITIV EVIDENS
// (icke-tom alternativlista) ger en dom. Alla nej/fel/tomma svar → unknown,
// och unknown ändrar aldrig någonting. En framtida v2 kan återinföra
// nej-domar med hårdare beviskrav (t.ex. flera oberoende nej över flera dygn
// + full adresskontext i frågan).

/** Utfall från klientens fraktanrop (rått svar ELLER felsträng). */
export interface FreightQueryOutcome {
  method: string;
  raw?: unknown;
  error?: string;
}

export interface FreightVerdict {
  /** true när svaret gick att tolka med säkerhet. */
  known: boolean;
  /** true/false när known; null när svaret inte gick att avgöra. */
  shippable: boolean | null;
  /** Antal fraktalternativ som hittades. */
  optionCount: number;
  /** Kort diagnos för logg/felsökning (aldrig kundexponerad). */
  note?: string;
  /**
   * true när svaret UTTRYCKLIGEN säger att adressen inte kan levereras till —
   * inte bara "tomt" eller "fel". Ett enskilt sådant svar är fortfarande INTE
   * en dom (`shippable` förblir null); det är en signal som måste bekräftas
   * över flera oberoende körningar innan den får nolla lager. Skiljer kod röd-
   * fallet (flaxiga nej hos säljare som bevisligen levererar) från ett äkta
   * nej: ett äkta nej upprepar sig, ett flaxigt gör det inte.
   */
  negativeSignal: boolean;
}

// Uttryckliga "går inte att leverera hit"-svar. Allt ANNAT (timeout, HTTP 502,
// oväntad svarsform, tom lista) är brus och får aldrig räknas som ett nej.
const EXPLICIT_NEGATIVE =
  /DELIVERY_NOT_AVAILABLE_TO_YOUR_ADDRESS|not\s+available\s+to\s+your\s+address|can(?:no|')t\s+be\s+shipped\s+to\s+your\s+address/i;

/** true när texten är ett uttryckligt adress-nej (inte ett generellt fel). */
export function isExplicitNegative(text: string | undefined | null): boolean {
  return Boolean(text && EXPLICIT_NEGATIVE.test(text));
}

// Nyckelmönster för listor med fraktalternativ i kända svarsformer.
const OPTION_LIST_KEY = /delivery_option|freight_calculate_result|delivery_options|logistics_service/i;


/** Plockar alla arrayer vars nyckel ser ut som en fraktalternativ-lista,
 *  inklusive en nivå singel-nyckel-wrapper ({delivery_option_d_t_o: [...]}). */
function collectOptionArrays(node: unknown, keyHint: string, out: unknown[][], depth = 0): void {
  if (depth > 8 || node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    if (OPTION_LIST_KEY.test(keyHint)) out.push(node);
    // Element kan i sin tur innehålla nästlade strukturer — men listelement i
    // en träffad lista är själva alternativen; gå inte djupare i dem.
    if (!OPTION_LIST_KEY.test(keyHint)) {
      for (const item of node) collectOptionArrays(item, keyHint, out, depth + 1);
    }
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    collectOptionArrays(value, OPTION_LIST_KEY.test(keyHint) ? keyHint : key, out, depth + 1);
  }
}

/** Letar explicit success=false + meddelande i kända svars-kuvert. */
function findFailureMessage(node: unknown, depth = 0): string | null {
  if (depth > 6 || node === null || typeof node !== "object" || Array.isArray(node)) return null;
  const obj = node as Record<string, unknown>;
  const success = obj.success ?? obj.is_success;
  if (success === false || success === "false") {
    const msg = obj.msg ?? obj.error_msg ?? obj.message ?? obj.error_message;
    return typeof msg === "string" && msg ? msg : "success=false utan meddelande";
  }
  for (const value of Object.values(obj)) {
    const hit = findFailureMessage(value, depth + 1);
    if (hit) return hit;
  }
  return null;
}

export function parseFreightOutcome(outcome: FreightQueryOutcome): FreightVerdict {
  // Fel från anropet (inkl. AliExpress "nej"-strängar) → unknown. Aldrig
  // en negativ dom på ett enskilt svar — se lärdomen i filhuvudet.
  if (outcome.error) {
    return {
      known: false,
      shippable: null,
      optionCount: 0,
      note: outcome.error.slice(0, 160),
      negativeSignal: isExplicitNegative(outcome.error),
    };
  }

  const lists: unknown[][] = [];
  collectOptionArrays(outcome.raw, "", lists);
  const optionCount = lists.reduce((s, l) => s + l.length, 0);
  if (optionCount > 0) {
    return { known: true, shippable: true, optionCount, negativeSignal: false };
  }

  const failure = findFailureMessage(outcome.raw);
  if (failure) {
    return {
      known: false,
      shippable: null,
      optionCount: 0,
      note: failure.slice(0, 160),
      negativeSignal: isExplicitNegative(failure),
    };
  }

  // Tom lista utan felindikation: API:t har visat sig ge tomma/nekande svar
  // även för fraktbara SKU:er — unknown, inte en dom.
  if (lists.length > 0) {
    // Tom lista är INTE ett nej — API:t har gett tomma svar för fraktbara
    // SKU:er. Räknas aldrig som negativ signal.
    return { known: false, shippable: null, optionCount: 0, note: "tom alternativlista — obevisat", negativeSignal: false };
  }

  // Inget alternativ-fält alls i svaret → vi VET inte (klassa aldrig som
  // ofraktbar på det). Trunkerad rå-form i noten för felsökning.
  return {
    known: false,
    shippable: null,
    optionCount: 0,
    note: `oväntad svarsform: ${JSON.stringify(outcome.raw).slice(0, 160)}`,
    negativeSignal: false,
  };
}

/**
 * Matchar en mapping-variants supplierVariantId mot AliExpress-produktens
 * SKU:er och returnerar den numeriska sku_id:n (som fraktAPI:t kräver).
 *
 * Två id-format förekommer i mappningarna:
 *   - Numerisk sku_id ("12000058218136832") → exakt likhet.
 *   - Attribut-sträng från extension-importen
 *     ("14:350853#39 Drawers;200007763:201336106") — namngivna värden ligger
 *     efter "#" per property; ships-from-egenskapen saknar "#". Matchas mot
 *     SKU:ns skuProps-VÄRDEN; kräver ENTYDIG träff (annars null — hellre
 *     ingen kontroll än fel varianters dom).
 */
/**
 * Namngivna VAL ur ett sku_attr ("14:350850#4 PCS;200007763:201336106" →
 * ["4 pcs"]). Bara delar med "#" bär ett läsbart värde; lager-axeln
 * (200007763 = "Ships From") skrivs utan "#" och faller därför bort av sig
 * själv — vilket är precis vad vi vill när samma vara ska hittas i ett annat
 * lager.
 */
export function namedValuesFromVariantId(supplierVariantId: string): string[] {
  return (supplierVariantId || "")
    .trim()
    .split(";")
    .map((part) => {
      const hash = part.indexOf("#");
      return hash >= 0 ? part.slice(hash + 1).trim().toLowerCase() : null;
    })
    .filter((v): v is string => Boolean(v));
}

export function matchAeVariant(
  supplierVariantId: string,
  aeVariants: ReadonlyArray<{ skuId: string; skuAttr?: string; skuProps: Record<string, string> }>,
): string | null {
  const id = (supplierVariantId || "").trim();
  if (!id) return null;

  // Exakt träff på numeriskt sku_id ELLER attribut-strängen (sku_attr) —
  // extension-importens supplierVariantId ÄR AliExpress sku_attr, så detta
  // är den robusta huvudvägen; värde-matchningen nedan är fallback.
  const exact = aeVariants.find((v) => v.skuId === id || (v.skuAttr && v.skuAttr.trim() === id));
  if (exact) return exact.skuId;

  const namedValues = namedValuesFromVariantId(id);

  if (namedValues.length === 0) {
    // Enproduktsgenväg: en enda SKU utan namngivna val är entydig.
    return aeVariants.length === 1 ? aeVariants[0].skuId : null;
  }

  const hits = aeVariants.filter((v) => {
    const values = Object.values(v.skuProps).map((s) => s.trim().toLowerCase());
    return namedValues.every((nv) => values.includes(nv));
  });
  return hits.length === 1 ? hits[0].skuId : null;
}


// ── Val av fraktsätt vid orderläggning ───────────────────────────────────────
//
// Bakgrund (2026-08-19): order #10021 avvisades med DELIVERY_METHOD_NOT_EXIST.
// placeOrder skickade en HÅRDKODAD tjänst, CAINIAO_ECONOMY_GLOBAL, för varje
// produkt. Den finns inte hos alla säljare, lager och destinationer — och när
// den inte gör det vägrar AliExpress hela ordern.
//
// Men "ett fraktsätt som funkar" är en för låg ambition. Samma vara ligger ofta
// i flera lager (CN, ES, PL…) med olika pris OCH olika leveranstid, och det
// valet betalar vi för på båda sidor: frakten äter marginalen direkt, och
// leveranstiden är vad kunden faktiskt upplever mot vårt löfte om 3–7
// arbetsdagar. Därför RANGORDNAS alternativen i stället för att tas i den
// ordning AliExpress råkar returnera dem.

/** Ett fraktalternativ, normaliserat ur AliExpress två svarsformer. */
export interface DeliveryOption {
  serviceName: string;
  /** Fraktkostnad i frågans valuta (vi frågar i SEK). null = okänd. */
  costSek: number | null;
  /** PESSIMISTISK leveranstid i dagar. null = okänd. */
  maxDays: number | null;
}

/**
 * Nycklar AliExpress använder för tjänstens namn — KODER FÖRST.
 *
 * Ordningen är säkerhetsbärande. En rad från ds.freight.query bär både
 * `code: "CAINIAO_STANDARD"` och `delivery_provider_name: "AliExpress Standard
 * Shipping"`. Bara koden går att skicka som logistics_service_name; skickas
 * visningsnamnet svarar AliExpress DELIVERY_METHOD_NOT_EXIST — alltså exakt
 * det fel den här modulen finns för att undvika, nu för varje kandidat i
 * listan (granskning 2026-08-19).
 */
const SERVICE_NAME_KEYS = [
  "code", "service_name", "serviceName",
  "logistics_service_name", "logisticsServiceName",
];

/**
 * Vad en extra leveransdag är värd i kronor.
 *
 * Utan ett sådant tal går "billigast" och "snabbast" inte att jämföra — de
 * pekar ofta åt olika håll och något måste avgöra. 5 kr/dag betyder att ett
 * alternativ som är tio dagar långsammare måste vara minst 50 kr billigare för
 * att vinna. Det är ungefär så avvägningen ser ut på riktigt: butiken lovar
 * 3–7 arbetsdagar, och en försening kostar i form av mejl, missnöje och returer
 * långt mer än några kronors fraktrabatt.
 *
 * Överstyrs med DELIVERY_DAY_VALUE_SEK om avvägningen visar sig fel.
 */
export const DEFAULT_DAY_VALUE_SEK = 5;

/**
 * Leveranstid som antas när alternativet inte anger någon.
 *
 * PESSIMISTISKT med flit: ett alternativ utan angiven tid ska inte vinna på
 * snabbhet bara för att det tiger. Samtidigt inte så högt att det aldrig kan
 * väljas när det är det enda som finns.
 */
export const ASSUMED_DAYS_WHEN_UNKNOWN = 30;

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
    // DATUM ÄR INTE ETT DAGINTERVALL. "2026-09-05" hade annars lästs som
    // 5–9 dagar och gjort ett 45-dagarsalternativ till ranklistans vinnare
    // (granskning 2026-08-19). AliExpress returnerar absolut datum i flera
    // svarsvarianter, så formen måste avvisas explicit.
    if (/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|[A-Za-z]{3,}\s+\d{1,2},?\s+\d{4}/.test(v)) {
      return null;
    }
    // "15-30" (dagintervall) → ta den PESSIMISTISKA änden.
    const m = v.match(/^\s*(\d{1,3})\s*[-–]\s*(\d{1,3})\s*$/);
    if (m) return Number(m[2]);
    const ett = v.match(/^\s*(\d{1,3})\b/);
    if (ett) return Number(ett[1]);
    // Sista utväg: ett tal var som helst i strängen. Tryggt här eftersom
    // datumformerna redan avvisats ovan — det här fångar valutaprefix som
    // "SEK 199.00", som annars blivit "okänd kostnad" och därmed antagits
    // gratis.
    const nagonstans = v.match(/(\d+(?:[.,]\d+)?)/);
    if (nagonstans) return Number(nagonstans[1].replace(",", "."));
  }
  return null;
}

/**
 * Första fältet som ger ett tal.
 *
 * `??` duger inte: den hoppar bara över null/undefined, så ett fält som finns
 * men är TOMT ("") kortsluter kedjan innan ett ifyllt senare fält nås —
 * och AliExpress returnerar rutinmässigt tomma strängar för fält den inte kan
 * fylla (granskning 2026-08-19).
 */
function firstNum(rad: Record<string, unknown>, nycklar: string[]): number | null {
  for (const n of nycklar) {
    const v = num(rad[n]);
    if (v !== null) return v;
  }
  return null;
}

function costOf(rad: Record<string, unknown>): number | null {
  // Formen från ds.freight.query anger ören/cent i frågans valuta.
  const cent = firstNum(rad, ["shipping_fee_cent", "shippingFeeCent"]);
  if (cent !== null) return cent / 100;
  // freight.calculate anger ett belopp direkt, ibland som sträng ("0.00").
  const frakt = rad.freight ?? rad.freightAmount;
  if (frakt && typeof frakt === "object") {
    const a = num((frakt as Record<string, unknown>).amount);
    if (a !== null) return a;
  }
  return firstNum(rad, [
    "shipping_fee", "shippingFee", "freightAmount",
    // Formaterad avgift ("SEK 199.00") förekommer i DS-svar. Utan den blir
    // kostnaden okänd → antas gratis → ett 199-kronorsalternativ rankas som
    // billigast, precis den marginalläcka rankningen skulle stoppa.
    "shipping_fee_format", "shippingFeeFormat",
  ]);
}

function daysOf(rad: Record<string, unknown>): number | null {
  // Max före min: kunden upplever den pessimistiska änden, och det är den
  // vårt 3–7-dagarslöfte måste hålla mot.
  return firstNum(rad, [
    "max_delivery_days", "maxDeliveryDays",
    "delivery_time", "deliveryTime",
    "estimated_delivery_time", "estimatedDeliveryTime",
    "min_delivery_days", "minDeliveryDays",
  ]);
}

/** Alternativen ur ett fraktsvar, i svarets egen ordning. */
export function parseDeliveryOptions(outcome: FreightQueryOutcome): DeliveryOption[] {
  if (outcome.error) return [];
  const lists: unknown[][] = [];
  collectOptionArrays(outcome.raw, "", lists);
  // Samma tjänstenamn kan förekomma flera gånger i svaret (olika kuvert,
  // olika prisnivåer). Vi behåller den BÄST rankade raden per namn i stället
  // för den först påträffade.
  //
  // NOT: det här väljer inte LAGER. Olika lager är olika SKU:er hos
  // AliExpress, och både fraktfrågan och ordern går på ett bestämt sku_id —
  // ett annat lager kräver en annan SKU, vilket koden inte byter. En tidigare
  // kommentar påstod motsatsen (granskning 2026-08-19).
  const bast = new Map<string, DeliveryOption>();
  for (const lista of lists) {
    for (const alt of lista) {
      if (!alt || typeof alt !== "object") continue;
      const rad = alt as Record<string, unknown>;
      let namn = "";
      for (const nyckel of SERVICE_NAME_KEYS) {
        const v = rad[nyckel];
        if (typeof v === "string" && v.trim()) { namn = v.trim(); break; }
      }
      if (!namn) continue;
      const kandidat: DeliveryOption = {
        serviceName: namn,
        costSek: costOf(rad),
        maxDays: daysOf(rad),
      };
      const nuvarande = bast.get(namn);
      if (!nuvarande || deliveryScore(kandidat) < deliveryScore(nuvarande)) {
        bast.set(namn, kandidat);
      }
    }
  }
  return [...bast.values()];
}

/** Lägre är bättre: fraktkostnad plus tiden omräknad i kronor. */
export function deliveryScore(
  o: DeliveryOption,
  dayValueSek = DEFAULT_DAY_VALUE_SEK,
  assumedDays = ASSUMED_DAYS_WHEN_UNKNOWN,
): number {
  // Okänd kostnad antas vara noll snarare än oändlig: DS-svaren utelämnar ofta
  // avgiften för fri frakt. Att straffa tystnad hade sorterat bort just de
  // billigaste alternativen.
  const kostnad = o.costSek ?? 0;
  const dagar = o.maxDays ?? assumedDays;
  return kostnad + dagar * dayValueSek;
}

/**
 * Alternativen billigast-och-snabbast först.
 *
 * Poängen väger ihop de två i stället för att välja den ena: ett alternativ
 * som är en krona billigare men tio dagar långsammare ska inte vinna, och ett
 * som är två dagar snabbare men hundra kronor dyrare ska inte heller det.
 *
 * Vid lika poäng vinner det snabbare — leveranstiden är det kunden märker.
 * Sorteringen är stabil på namn så ordningen inte hoppar mellan körningar.
 */
export function rankDeliveryOptions(
  options: DeliveryOption[],
  dayValueSek = DEFAULT_DAY_VALUE_SEK,
): DeliveryOption[] {
  return [...options].sort((a, b) => {
    const d = deliveryScore(a, dayValueSek) - deliveryScore(b, dayValueSek);
    if (Math.abs(d) > 1e-9) return d;
    const da = a.maxDays ?? ASSUMED_DAYS_WHEN_UNKNOWN;
    const db = b.maxDays ?? ASSUMED_DAYS_WHEN_UNKNOWN;
    if (da !== db) return da - db;
    return a.serviceName.localeCompare(b.serviceName);
  });
}

/** AliExpress svar när det begärda fraktsättet inte finns för produkten. */
const DELIVERY_METHOD_MISSING = /DELIVERY_METHOD_NOT_EXIST/i;

/**
 * true när felet är "fel fraktsätt", alltså värt ett omförsök med ett annat.
 *
 * Läs FELKODEN i första hand. createOrder bygger sin aeError som
 * `error_msg || felkod ...`, så en läsbar text från AliExpress ("The delivery
 * method is not available for this product") döljer koden helt — och då hade
 * omförsöket aldrig fyrat, vilket gjort hela fixen till en no-op (granskning
 * 2026-08-19). Texten kollas ändå som reserv för äldre svar.
 */
export function isDeliveryMethodMissing(
  text: string | undefined | null,
  code?: string | null,
): boolean {
  if (code && DELIVERY_METHOD_MISSING.test(code)) return true;
  return Boolean(text && DELIVERY_METHOD_MISSING.test(text));
}

/**
 * Fraktsätten att försöka med, bäst först — och `undefined` sist.
 *
 * `undefined` betyder "skicka inte fältet alls, låt AliExpress välja". Det är
 * den STARKASTE reserven vi har, och den var länge frånvarande: koden skickade
 * i stället alltid CAINIAO_ECONOMY_GLOBAL, vilket är en gissning som avvisar
 * hela ordern när den är fel (order #10021).
 *
 * Att den gissningen var fel bevisades 2026-08-19: AliExpress egen produktsida
 * för samma vara erbjöd frakt från Tjeckien, Frankrike OCH Spanien, alla med
 * spårning — medan vår order avvisades för att "fraktsättet inte finns".
 * Utelämnar man fältet väljer AliExpress bland just de alternativen.
 *
 * `dayValueSek` styr avvägningen kostnad mot tid i rankningen.
 */
export function deliveryCandidates(
  options: DeliveryOption[],
  dayValueSek = DEFAULT_DAY_VALUE_SEK,
): (string | undefined)[] {
  const rankade = rankDeliveryOptions(options, dayValueSek).map((o) => o.serviceName);
  return [...rankade, undefined];
}
