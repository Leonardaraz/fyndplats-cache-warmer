// En procentuell prishöjning på AliExpress-halvan av katalogen.
//
// Bakgrunden är en asymmetri som redan står i CLAUDE.md: Aosom-raderna räknas
// om ur kostnaden var sjätte timme, medan AE-raderna aldrig räknas om alls.
// Det gör en engångshöjning MÖJLIG här och meningslös där — en höjning på en
// Aosom-rad vore överskriven inom sex timmar, medan den på en AE-rad står kvar
// tills någon rör den igen.
//
// ☠️ FACIT ÄR BUTIKEN, INTE MAPPNINGEN. Höjningen räknas på det pris kunden
// FAKTISKT ser (`listV3ProductPrices` → `jamforelsePris`), aldrig på
// mappningens `grossSek`. Den förväxlingen är husets dyraste: prissynken
// jämförde mot mappningen i en månad, och de tjugo rader som drev isär rättades
// aldrig eftersom den trasiga skrivningen hann uppdatera mappningen först.
// Räknat på mappningen hade en rad som redan drivit isär fått en höjning som
// utgår från fel tal — och skillnaden hade cementerats.
//
// ☠️ OCH ETT OKÄNT BUTIKSPRIS HÖJS ALDRIG. En produkt som inte kom med i
// prislistan, eller vars varianter har olika pris, har inget entydigt facit.
// Att då falla tillbaka på mappningen hade återinfört exakt buggen ovan för
// just de rader där den är svårast att upptäcka. De räknas i `utanWixPris`.

import { roundPrice } from "../import/pricing";
import type { PricingConfig } from "../import/types";
import type { ProductMappingRecord } from "../store";
import { isAliExpressMapping } from "../store/supplier";
import type { WixProduktPris } from "../wix/v3-products";

/**
 * Butikens pris, när det finns ETT sådant.
 *
 * ⚠️ DEN HÄR ÄR MEDVETET INTE `jamforelsePris`, och skillnaden är inte en
 * tvilling som glidit — de svarar på olika frågor. Aosom-synkens variant
 * avvisar dessutom varje produkt med `variantCount > 1`, ett bälte-och-hängslen
 * som är gratis där (en Aosom-rad ÄR en artikel, uppmätt en variant per
 * produkt) och fel här: AE-halvan är full av färg- och storleksvarianter, och
 * den grinden hade hoppat över merparten av det höjningen gäller.
 *
 * Det som faktiskt avgör är `priceSek`: fältet är non-null bara när
 * `actualPriceRange` min === max, alltså när ALLA varianter kostar lika. Då är
 * "butikens pris" entydigt och en höjning väldefinierad för var och en av dem.
 * Kostar varianterna olika finns inget enda pris att höja, och att gissa på
 * minValue hade jämfört äpplen med päron.
 */
export function entydigtButikspris(wix: WixProduktPris | undefined): number | null {
  if (!wix) return null;
  return wix.priceSek;
}

/**
 * Tak på höjningen.
 *
 * ☠️ Spärren finns mot fettfingret, inte mot beslutet. `pct=100` i stället för
 * `pct=10` är en tangenttryckning, och utfallet når kund. Samma hållning som
 * `MAX_PRISANDRING_PCT` i Aosom-synken: en spärr mot det som inte kan vara
 * menat, inte mot det som är ovanligt.
 */
export const MAX_HOJNING_PCT = 25;

/**
 * Golv för hur många produkter prislistan måste ge.
 *
 * ☠️ Samma skäl som `MIN_WIX_PRODUKTER` i Aosom-synken: en halvläst prislista
 * ser ut som "de här produkterna saknar pris" och hade gjort hela höjningen
 * till en tyst no-op med grönt kvitto. Skillnaden mot synken är att här är
 * avbrott rätt svar — en utebliven prishöjning är ofarlig, en halv är inte.
 */
export const MIN_WIX_PRODUKTER = 500;

export type HojningRad = {
  wixProductId: string;
  /** Butikens pris före höjningen — facit. */
  fran: number;
  /** Efter höjning och husets avrundning. */
  till: number;
  /** Vad mappningen TRODDE att kunden såg. `null` = fältet saknas. */
  mappningensPris: number | null;
  /** Sant när mappningen och butiken redan hade glidit isär. */
  drift: boolean;
  /** Wix-variant-id:n som ska skrivas — ALLA produktens varianter, eller ingen. */
  variantIds: string[];
};

export type HojningPlan = {
  granskade: number;
  ejAliExpress: number;
  prisLasta: number;
  utanWixPris: number;
  /** Mappningens variant-id:n täcker inte produktens varianter — hoppas över. */
  variantavvikelse: number;
  /** Redan höjd i DENNA kampanj. Det som gör omkörning ofarlig. */
  redanHojda: number;
  /** Det avrundade priset slutade inte på 9 — skrivs ALDRIG. Se grinden nedan. */
  ejNiokrona: number;
  /** Avrundningen gav samma tal — ingen skrivning behövs. */
  oforandrade: number;
  /**
   * Butikens pris ÄR redan exakt den här kampanjens höjning av mappningens —
   * alltså höjd en gång med stämpeln förlorad. Höjs ALDRIG. Se grinden nedan.
   */
  redanHojdUtanStampel: number;
  /**
   * Vilka de är. ☠️ Ett tal utan id är en oro, inte ett beslut — och de här
   * raderna kan ingen annan mätning hitta i efterhand: de har varken stämpel
   * eller drift kvar att känna igen dem på. Publikt ofarligt: ett Wix-id och
   * två priser är redan synliga på produktsidan.
   */
  redanHojdaIder: string[];
  rader: HojningRad[];
  /** Kontrollsumma över planen. Se `planSumma`. */
  summa: string;
  /** Rader där mappningen och butiken redan var oense. Bara MÄTT. */
  drivande: number;
};

export class OgiltigHojning extends Error {}

/**
 * ☠️ `pct` HAR INGEN DEFAULT. Ett utelämnat fält avvisas.
 *
 * Samma fälla som `last` i prislåset och GitHubs tomma workflow-input, som
 * publicerade utkast i tolv timmar: att tyst tolka tystnad som ett tal är fel
 * riktning att fela åt när utfallet är kundens pris.
 */
export function validateraPct(raa: string | null): number {
  if (raa === null || raa.trim() === "") {
    throw new OgiltigHojning("pct saknas — ange höjningen uttryckligen, t.ex. ?pct=10");
  }
  const pct = Number(raa);
  if (!Number.isFinite(pct)) {
    throw new OgiltigHojning(`pct "${raa}" är inte ett tal.`);
  }
  if (pct <= 0) {
    throw new OgiltigHojning(`pct ${pct} är inte en höjning. Rutten sänker aldrig ett pris.`);
  }
  if (pct > MAX_HOJNING_PCT) {
    throw new OgiltigHojning(
      `pct ${pct} överstiger taket ${MAX_HOJNING_PCT} %. Höj taket medvetet om det är menat.`,
    );
  }
  return pct;
}

/**
 * Kontrollsumma över planen.
 *
 * ☠️ Den ersätter prisreparationens "det finns ingen kör-allt-flagga". Där är
 * listan med id:n kvitteringen på att en människa läst planen; här är listan
 * tusen rader lång och en uppräkning vore teater. Kontrollsumman gör samma
 * jobb mekaniskt: du kan bara godkänna den plan du faktiskt fick se, och har
 * katalogen rört sig sedan dess stämmer inte summan och skrivningen vägrar.
 *
 * Samma form som transkriberingsspärren i poleringen — och av samma skäl:
 * spärren måste räknas om i SAMMA anrop som skriver, annars bevisar den bara
 * att någon tidigare plan såg rätt ut.
 */
export function planSumma(rader: readonly HojningRad[]): string {
  let h = 0;
  for (const r of rader) {
    for (const c of `${r.wixProductId}:${r.fran}:${r.till};`) {
      h = (h * 31 + (c.codePointAt(0)! & 0xffff)) % 1000000007;
    }
  }
  return `${rader.length}-${h}`;
}

/** Mappningens tro om kundens pris — första varianten som bär ett tal. */
function mappningensPris(m: ProductMappingRecord): number | null {
  for (const v of m.variants ?? []) {
    const p = Number(v.grossSek);
    if (Number.isFinite(p) && p > 0) return p;
  }
  return null;
}

/**
 * Bygger höjningsplanen. Ren funktion — ingen IO, inga skrivningar.
 */
export function planeraPrishojning(
  mappningar: readonly ProductMappingRecord[],
  wixPriser: ReadonlyMap<string, WixProduktPris>,
  pct: number,
  avrundning: PricingConfig["rounding"],
  kampanj: string,
): HojningPlan {
  const plan: HojningPlan = {
    granskade: 0,
    ejAliExpress: 0,
    prisLasta: 0,
    utanWixPris: 0,
    variantavvikelse: 0,
    redanHojda: 0,
    ejNiokrona: 0,
    oforandrade: 0,
    redanHojdUtanStampel: 0,
    redanHojdaIder: [],
    rader: [],
    summa: "",
    drivande: 0,
  };

  for (const m of mappningar) {
    plan.granskade++;

    // ☠️ Bara AliExpress-rader. En Aosom-rad som höjdes här hade skrivits
    // tillbaka av `aosom-sync` inom sex timmar — höjningen syns, försvinner,
    // och ingen förstår varför. Spärren är den delade `isAliExpressMapping`,
    // inte en egen kopia: en rad UTAN `supplier`-fält räknas som AliExpress,
    // vilket är rätt för hela den katalog som fanns före 2026-08-27.
    if (!isAliExpressMapping(m)) {
      plan.ejAliExpress++;
      continue;
    }

    // ☠️ REDAN HÖJD I DENNA KAMPANJ → rör den inte.
    //
    // Det här är det som gör en omkörning ofarlig, och utan den är hela
    // rutten en fälla: 1 000 produkter ryms inte i 300 sekunder, så den
    // KOMMER att köras om. En plan som inte kan skilja "ännu inte höjd" från
    // "redan höjd" tar 599 → 659 → 725 vid andra försöket, och svaret ser
    // likadant ut båda gångerna.
    //
    // Stämpeln nycklas på kampanjnamnet, inte på ett datum: en ny höjning
    // senare ska kunna röra samma rad igen.
    if (m.prishojning?.kampanj === kampanj) {
      plan.redanHojda++;
      continue;
    }

    // ☠️ Ett låst pris är ett medvetet beslut om att priset ska stå still.
    // Låset finns just för att hindra automatisk omprissättning; att en
    // MANUELL höjning kringgår det hade gjort låset till en rekommendation.
    // De räknas, de hoppas inte tyst över — ett lås ingen ser glöms bort.
    if (m.prisLast === true) {
      plan.prisLasta++;
      continue;
    }

    const wix = wixPriser.get(m.wixProductId);
    const fran = entydigtButikspris(wix);
    if (fran === null || fran <= 0) {
      plan.utanWixPris++;
      continue;
    }

    // ☠️ ALLA VARIANTER ELLER INGEN. `updateV3VariantPrices` rör bara de
    // varianter som står i skrivningen, och mappningen är vår enda källa till
    // variant-id:n. Täcker den inte alla varianter produkten har i Wix skulle
    // höjningen SPLITTA priset: några varianter 659 kr, resten 599. Ett halvt
    // höjt pris är svårare att upptäcka än ett orört — samma skäl som
    // prisreparationens marginalgolv blockerar HELA produkten, aldrig en
    // enskild variant, och samma skäl som lagersynken bara stämplar en produkt
    // vars ALLA lagerrader gick igenom.
    const variantIds = (m.variants ?? [])
      .map((v) => v.wixVariantId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    const wixVarianter = wix?.variantCount ?? 0;
    if (variantIds.length === 0 || (wixVarianter > 0 && variantIds.length !== wixVarianter)) {
      plan.variantavvikelse++;
      continue;
    }

    const trodde = mappningensPris(m);

    // ☠️ EN HÖJNING SOM REDAN SKETT MEN TAPPAT SIN STÄMPEL HÖJS ALDRIG IGEN.
    //
    // Uppmätt 2026-09-13, och det var aritmetiken som avslöjade det: 478 redan
    // höjda + 201 skrivna skulle ge 679, men nästa plan sa 678 — och en rad
    // mer att höja. Exakt en produkt hade fått sitt PRIS skrivet utan att få
    // sin STÄMPEL. Skrivfönstret (17:58–18:02) låg rakt över AE-synkens
    // `0 */2 * * *`, och synken gör läs-ändra-skriv på samma mappningsrad.
    //
    // Stämpeln är hela idempotensen, och en stämpel som kan gå förlorad är en
    // idempotens som kan gå förlorad. Nästa körning hade räknat på det NYA
    // butikspriset och tagit raden 499 → 549 → 609: exakt 599 → 659 → 725,
    // felet stämpeln byggdes mot, genom en annan dörr.
    //
    // ☠️ GRINDEN ÄR ARITMETISK, INTE EN RIKTNING — och det första utkastet var
    // fel på just den punkten. Det gatade på "butiken högre än mappningen",
    // vilket fällde `räknar på BUTIKEN`-testet och hade rätt i det: butiken
    // HÖGRE är också signaturen för husets DOKUMENTERADE drift, där
    // bäddsoffan bar `grossSek: 3529` mot 4 539 kr i Wix. En sådan rad har
    // aldrig höjts och SKA höjas.
    //
    // Det som skiljer är att en tappad stämpel lämnar butikspriset på EXAKT
    // det tal den här kampanjen skulle ha skrivit. Grinden räknar därför om
    // höjningen ur mappningens tal och kräver exakt träff, ur samma
    // `roundPrice` som planen själv använder — så den kan inte drifta från
    // regeln. En lagg-rad landar i praktiken aldrig på den siffran.
    //
    // Raden räknas, den hoppas inte tyst över: ett tal som växer är ett besked
    // om att stämplar tappas, inte brus.
    if (trodde !== null && fran > trodde
        && roundPrice(trodde * (1 + pct / 100), avrundning) === fran) {
      plan.redanHojdUtanStampel++;
      if (plan.redanHojdaIder.length < 50) plan.redanHojdaIder.push(m.wixProductId);
      continue;
    }

    const till = roundPrice(fran * (1 + pct / 100), avrundning);

    // Avrundningen kan landa på samma tal som redan står där — en höjning på
    // 10 % av 599 kr blir 659, men på ett pris nära ett avrundningssteg kan
    // den bli noll. En skrivning som inte ändrar något är ett Wix-anrop utan
    // verkan; de räknas i stället.
    if (till <= fran) {
      plan.oforandrade++;
      continue;
    }

    // ☠️ PRISET MÅSTE SLUTA PÅ 9 — Leonards krav 2026-09-13, och en GRIND, inte
    // en förhoppning.
    //
    // Husets `charm9`/`charm99` ger redan det, så i normal drift fäller den
    // aldrig. Men avrundningsstrategin bor i `FyndplatsPricingConfig`, alltså
    // UTANFÖR den här koden: ett efterföljande blanksteg i configraden har
    // redan en gång tyst stängt av charm-prissättningen för hela katalogen och
    // börjat skriva örespriser (uppmätt: `roundPrice(541.85, "charm99 ")` =
    // `541.85`). Med bara `roundPrice` att luta sig mot hade höjningen tyst
    // skrivit 658,90 kr till kund.
    //
    // En regel utan grind glider — samma lärdom som `SHIP_AXIS_RE` och
    // `EU_TULL_CODES`. Raden hoppas över och RÄKNAS, så ett trasigt
    // configvärde syns som ett stort `ejNiokrona` i stället för som ett
    // sortiment med örespriser.
    if (!Number.isInteger(till) || till % 10 !== 9) {
      plan.ejNiokrona++;
      continue;
    }

    const drift = trodde !== null && trodde !== fran;
    if (drift) plan.drivande++;

    plan.rader.push({
      wixProductId: m.wixProductId,
      fran,
      till,
      mappningensPris: trodde,
      drift,
      variantIds,
    });
  }

  plan.summa = planSumma(plan.rader);
  return plan;
}
