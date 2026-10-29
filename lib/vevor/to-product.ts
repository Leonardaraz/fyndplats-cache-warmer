// Adapter: en VEVOR-avläsning → pipelinens gemensamma format, och tillbaka till
// en mappningsrad. Samma väg som Aosom (lib/aosom/to-product.ts): allt
// nedströms är redan byggt och testat, och VEVOR-importen behöver bara tala
// samma språk. Ren modul.
//
// EN ARTIKEL ÄR EN PRODUKT. VEVOR:s varianter går inte att bygga automatiskt
// (sidans attrList är tom), så varje artikel blir ett eget utkast och syskonen
// slås ihop vid poleringen, som för Aosom.
//
// TEXTEN ÄR VEVOR:S EGEN, PÅ SVENSKA. Sidan läses med `?lang=sv&currency=SEK`,
// så titel, beskrivning, punkter och specifikation är svenska redan vid
// importen. Märket tas bort ur titeln vid poleringen (Leonard 2026-10-28), inte
// här: utkastet syns inte för någon kund, och poleringen skriver titel, slug och
// SKU på nytt ändå.
//
// ☠️ ARTIKELNUMRET BOR BARA I `supplierProductId` och variantens
// `supplierVariantId`. Det står inte i titeln, beskrivningen eller
// specifikationen på VEVOR:s sidor (mätt 2026-10-29: 0 av 34), och det här
// läggs inte dit.

import type { AliExpressProduct } from "@/lib/import/types";
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

export type Hinder = "ej_i_lager" | "ej_levererbar" | "borta" | "misslyckad" | "gammal";

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
  return null;
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
  const landadSek = vevorLandadKostnadSek(a.prisSek, pris.rabatt);
  return {
    supplierProductId: vevorSupplierProductId(a.sku),
    sourceUrl: sidadress(a.sokvag),
    rawTitle: a.namn,
    rawDescription: a.beskrivning,
    descriptionHtml: textTillHtml(a.beskrivning),
    imageUrls: bilder.urls,
    variants: [
      {
        supplierVariantId: a.sku,
        options: {},
        costUsd: Math.round((landadSek / pris.usdToSek) * 100) / 100,
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
    ...(result.priceUnverified ? { priceUnverified: result.priceUnverified } : {}),
    ...(result.slugSuffix ? { slugSuffix: result.slugSuffix } : {}),
  };
}
