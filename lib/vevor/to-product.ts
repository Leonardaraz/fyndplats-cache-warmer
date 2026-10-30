// Adapter: en VEVOR-avläsning → pipelinens gemensamma format, och tillbaka till
// en mappningsrad. Samma väg som Aosom (lib/aosom/to-product.ts): allt
// nedströms är redan byggt och testat, och VEVOR-importen behöver bara tala
// samma språk. Ren modul.
//
// EN FAMILJ ÄR EN PRODUKT (steg 8, Leonard 2026-10-29). Syskonen i VEVOR:s
// familj blir varianter på samma utkast, en artikel per variant, när deras
// egenskaper räcker för det (lib/vevor/familj.ts). En artikel utan syskon, eller
// en familj som inte går att slå ihop, blir ett eget utkast som förut.
//
// BETYGET STOPPAR IMPORTEN under 3,8 med minst fem recensioner (Leonard
// 2026-10-29). VEVOR:s recensioner följer med som dolda rader (VEVOR har sagt
// ja till att vi använder dem), och översätts i chatten som Aosoms.
//
// TEXTEN ÄR VEVOR:S EGEN, PÅ SVENSKA. Sidan läses med `?lang=sv&currency=SEK`,
// så titel, beskrivning, punkter och specifikation är svenska redan vid
// importen. Märket tas bort ur titeln vid poleringen (Leonard 2026-10-28), inte
// här: utkastet syns inte för någon kund, och poleringen skriver titel, slug och
// SKU på nytt ändå.
//
// BESKRIVNINGEN STÄDAS VID IMPORTEN (`rensaBeskrivning`, Leonard 2026-10-30).
// VEVOR:s text upprepar stycken, och VEVOR:s egen reklam följer med: löften
// som "30-dagars gratis retur" och "snabb och säker leverans" är VEVOR:s, inte
// våra. Uppmätt på 1 200 avläsningar: 475 hade rader två gånger eller fler,
// 57 bar reklamblocket och 218 sloganen. Bara exakta rader tas bort, och
// rubrikerna står kvar. Poleringen skriver om texten ändå.
//
// ☠️ ARTIKELNUMRET BOR BARA I `supplierProductId` och variantens
// `supplierVariantId`. Det står inte i titeln, beskrivningen eller
// specifikationen på VEVOR:s sidor (mätt 2026-10-29: 0 av 34), och det här
// läggs inte dit.

import type { AliExpressProduct } from "@/lib/import/types";
import type { AERReview } from "@/lib/import/review-import";
import type { ImportResult } from "@/lib/import/pipeline";
import type { ProductMappingRecord } from "@/lib/store";
import { VEVOR_ID_PREFIX } from "@/lib/store/leverantorsprefix";
import type { Avlasning } from "./lager";
import { VART_FLODE } from "./rad";
import { sidadress } from "./sida";
import { vevorLandadKostnadSek } from "./pris";
import type { Bildval } from "./bilder";
import type { VevorGranskning } from "./granskning";

/** Äldre avläsning än så importeras inte. Läsaren läser utkasten en gång per dygn. */
export const MAX_ALDER_IMPORT_MS = 48 * 3_600_000;

/** Under det här snittet, med minst `BETYG_MIN_ANTAL` recensioner, importeras artikeln inte. */
export const BETYG_GRANS = 3.8;
export const BETYG_MIN_ANTAL = 5;

export type Hinder =
  | "ej_i_lager"
  | "ej_levererbar"
  | "borta"
  | "misslyckad"
  | "gammal"
  /** Snittet under 3,8 med minst fem recensioner. */
  | "lagt_betyg"
  /** Avläsningen är från före steg 8 och bär inget betyg: väntar på nästa läsning. */
  | "betyg_okant"
  /**
   * Avläsningen saknar både specifikation och punktlista och gjordes före
   * 2026-10-30, när läsaren inte kände VEVOR:s nya sidmall: väntar på nästa
   * läsning (`spechinder`).
   */
  | "spec_okant"
  /** Familjen finns redan som en produkt, utan den här artikeln (lib/vevor/import.ts). */
  | "syskon_finns"
  /** Ett syskon har inte lästs om med betyg, eller inte lästs alls men står i läsarens kö. */
  | "syskon_vantar";

/**
 * Betygets hinder, eller null. Saknas fältet lästes sidan före steg 8, och
 * då väntar artikeln på nästa läsning i stället för att importeras på okänt
 * betyg. Ett betyg som saknas på sidan (null) är inget hinder: en ny vara
 * har inga recensioner.
 */
export function betygshinder(a: Pick<Avlasning, "betyg">): "lagt_betyg" | "betyg_okant" | null {
  if (a.betyg === undefined) return "betyg_okant";
  if (a.betyg && a.betyg.snitt < BETYG_GRANS && a.betyg.antal >= BETYG_MIN_ANTAL) return "lagt_betyg";
  return null;
}

export function vevorSupplierProductId(sku: string): string {
  return `${VEVOR_ID_PREFIX}${sku}`;
}

/**
 * Varför avläsningen inte importeras, eller null när den kan importeras.
 *
 * Samma bedömning som synkens ingång (lib/vevor/rad.ts) i allt utom åldern: ett
 * utkast syns inte för kunden, och synken rättar saldot senare. En avläsning
 * som är äldre än två dygn tyder ändå på att läsaren stått still, och då
 * importeras ingenting ur den.
 */
export function importhinder(a: Avlasning, nu: number): Hinder | null {
  if (a.borta || a.status === "borta") return "borta";
  if (a.misslyckadAt && Date.parse(a.misslyckadAt) >= Date.parse(a.lastAt)) return "misslyckad";
  const alder = nu - Date.parse(a.lastAt);
  if (!Number.isFinite(alder) || alder > MAX_ALDER_IMPORT_MS || alder < -60_000) return "gammal";
  if (!a.levererasTillSe || a.flode !== VART_FLODE || a.status === "ej_levererbar") return "ej_levererbar";
  if (a.status !== "i_lager" || !(a.saldo > 0)) return "ej_i_lager";
  return betygshinder(a) ?? spechinder(a);
}

/**
 * Specifikationens hinder, eller null. VEVOR visar två sidmallar, och fram
 * till 2026-10-30 läste läsaren bara den ena (lib/vevor/sida.ts,
 * `specOchPunkter`): var femte avläsning saknade specifikation och punktlista,
 * och utkasten blev utan. En sådan avläsning väntar på nästa läsning, som sker
 * inom ett dygn. En avläsning från den lagade läsaren bär `specKalla`, och då
 * är en tom specifikation sidans egen och inget hinder.
 */
export function spechinder(a: Pick<Avlasning, "spec" | "punkter" | "specKalla">): "spec_okant" | null {
  if (a.specKalla !== undefined) return null;
  return a.spec.length === 0 && a.punkter.length === 0 ? "spec_okant" : null;
}

/**
 * Som `importhinder`, men för ett syskon som följer med en familj: en artikel
 * som är slut följer med med saldo 0, så att den inte blir en egen produkt när
 * den kommer tillbaka.
 */
export function medlemshinder(a: Avlasning, nu: number): Hinder | null {
  const h = importhinder(a, nu);
  // Familjen visar ankarets text och specifikation, aldrig syskonets, så ett
  // syskon behöver ingen specifikation för att följa med.
  return h === "ej_i_lager" || h === "spec_okant" ? betygshinder(a) : h;
}

/** Inköpet i dollar, som pipelinen räknar tillbaka till landad kostnad i kronor. */
export function kostnadUsd(a: Pick<Avlasning, "prisSek">, pris: Prisunderlag): number {
  const landadSek = vevorLandadKostnadSek(a.prisSek, pris.rabatt);
  return Math.round((landadSek / pris.usdToSek) * 100) / 100;
}

/**
 * Sidans recensioner i importens format. Namnet sparas som bevis och visas
 * aldrig (lib/import/review-import.ts härleder initialer). Språket är okänt:
 * sidan blandar spanska, tyska och engelska.
 */
export function vevorRecensioner(a: Pick<Avlasning, "recensioner">): AERReview[] {
  return (a.recensioner ?? []).map((r) => ({
    rating: r.betyg,
    text: r.text,
    ...(r.datum ? { date: r.datum } : {}),
    ...(r.namn ? { customerName: r.namn } : {}),
    ...(r.bilder && r.bilder.length > 0 ? { imageUrls: r.bilder, hasImage: true } : {}),
  }));
}

export interface Prisunderlag {
  /** PRO-rabatten som andel (lib/vevor/pris.ts). */
  rabatt: number;
  /** USD → SEK, samma kurs som prissättningen använder. */
  usdToSek: number;
}

/**
 * Den importerbara produkten.
 *
 * OM `costUsd`: pipelinen räknar landad kostnad som `costUsd × usdToSek` och
 * sparar den i `landedCostSek`. Dollarbeloppet är alltså en härledd storhet,
 * precis som för Aosom.
 */
export function vevorProdukt(a: Avlasning, pris: Prisunderlag, bilder: Bildval): AliExpressProduct {
  return {
    supplierProductId: vevorSupplierProductId(a.sku),
    sourceUrl: sidadress(a.sokvag),
    rawTitle: a.namn,
    rawDescription: rensaBeskrivning(a.beskrivning),
    descriptionHtml: textTillHtml(rensaBeskrivning(a.beskrivning)),
    imageUrls: bilder.urls,
    variants: [
      {
        supplierVariantId: a.sku,
        options: {},
        costUsd: kostnadUsd(a, pris),
        // Bufferten är 0 (Leonard 2026-10-28): VEVOR:s saldo rakt av.
        stock: a.saldo,
        included: true,
      },
    ],
    // Lagret är VEVOR:s EU-lager, men sidan säger inte vilket land. Ett påhittat
    // land hade gett varan en "EU-lager"-märkning vi inte kan stå för, och ett
    // "EU" hade klassats som ett land utanför EU. Mappningen bär i stället
    // `hasEuWarehouse` (se byggVevorMappning).
    shipsFrom: [],
    inStock: a.saldo > 0,
    specifications: specifikation(a),
    features: a.punkter,
  };
}

/** Specifikationstabellen, sedan variantens egna värden som inte redan står där. */
export function specifikation(a: Pick<Avlasning, "spec" | "egenskaper">): Record<string, string> {
  const ut: Record<string, string> = {};
  const sedda = new Set<string>();
  for (const [k, v] of [...a.spec, ...a.egenskaper]) {
    const nyckel = k.trim();
    const varde = v.trim();
    if (!nyckel || !varde || sedda.has(nyckel.toLowerCase())) continue;
    sedda.add(nyckel.toLowerCase());
    ut[nyckel] = varde;
  }
  return ut;
}

/**
 * VEVOR:s egen reklam, rad för rad, som den står på de svenska sidorna (uppmätt
 * 2026-10-30). Jämförs med hela raden i gemener och med mellanslagen rensade.
 */
const VEVOR_REKLAM: readonly string[] = [
  "varför välja vevor?",
  "premium tuff kvalitet",
  "otroligt låga priser",
  "snabb och säker leverans",
  "30-dagars gratis retur",
  "24/7 uppmärksam service",
  "prestanda på proffsnivå utan kostnad",
];
/** Reklamstycket om VEVOR själva. Det börjar alltid så och handlar aldrig om varan. */
const VEVOR_REKLAM_BORJAN = "vevor är ett ledande varumärke";

const jamforbar = (rad: string) => rad.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Beskrivningen utan VEVOR:s reklam och utan rader som redan stått en gång.
 * Bara hela rader tas bort; en rad som bara liknar reklamen står kvar.
 */
export function rensaBeskrivning(text: string): string {
  const sedda = new Set<string>();
  const ut: string[] = [];
  for (const rad of text.split(/\n+/)) {
    const r = rad.replace(/\s+/g, " ").trim();
    if (!r) continue;
    const j = jamforbar(r);
    if (VEVOR_REKLAM.includes(j) || j.startsWith(VEVOR_REKLAM_BORJAN)) continue;
    if (sedda.has(j)) continue;
    sedda.add(j);
    ut.push(r);
  }
  return ut.join("\n");
}

const HTML_ESCAPE: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/** Beskrivningens text som stycken. Texten är redan ren (lib/vevor/sida.ts); här escapas den bara. */
export function textTillHtml(text: string): string {
  return text
    .split(/\n+/)
    .map((rad) => rad.trim())
    .filter(Boolean)
    .map((rad) => `<p>${rad.replace(/[&<>"]/g, (c) => HTML_ESCAPE[c])}</p>`)
    .join("");
}

/**
 * Varje artikel produkten bär, med prefix: radens egen och varianternas. För
 * dubblettspärren, som frågar efter fältet (Store.mappningarForLeverantorsId):
 * en artikel som sitter som variant på en familj är lika upptagen som en som
 * har en egen rad.
 */
export function vevorArtiklarFor(result: Pick<ImportResult, "supplierProductId" | "variantMappings">): string[] {
  return [
    ...new Set([
      result.supplierProductId,
      ...result.variantMappings.map((v) => vevorSupplierProductId(v.supplierVariantId)),
    ]),
  ];
}

/**
 * Mappningsraden. Som Aosoms, med tre skillnader:
 *
 *   supplier: "vevor"      håller raden utanför AE-synken och Aosom-synken
 *                          (lib/store/supplier.ts). Steg 5 ger VEVOR en egen synk.
 *   hasEuWarehouse: true   VEVOR skickar från sitt EU-lager, och importen tar
 *                          bara artiklar i det flödet. Landet är okänt, så
 *                          `shipsFromCountries` är tom och Wix får ingen
 *                          "EU-lager"-märkning vid importen.
 *   vevorGranskning        GPSR, möjlig medicinteknik och bildgranskning
 *                          (lib/vevor/granskning.ts).
 *
 * needsAiPolish sätts ovillkorligt: titeln bär märket, och texten är VEVOR:s.
 */
export function byggVevorMappning(
  a: Avlasning,
  result: ImportResult,
  granskning: VevorGranskning,
  nu: string,
): ProductMappingRecord {
  return {
    supplierProductId: result.supplierProductId,
    supplier: "vevor",
    wixProductId: result.wixProductId,
    variants: result.variantMappings,
    draftStatus: "pending_review",
    createdAt: nu,
    seoTitle: result.seo.title,
    sourceUrl: sidadress(a.sokvag),
    shipsFromCountries: [],
    hasEuWarehouse: true,
    warehouseClass: "EU",
    needsAiPolish: true,
    vevorGranskning: granskning,
    vevorArtiklar: vevorArtiklarFor(result),
    ...(result.priceUnverified ? { priceUnverified: result.priceUnverified } : {}),
    ...(result.slugSuffix ? { slugSuffix: result.slugSuffix } : {}),
  };
}
