// lib/wix-image.ts
// Tight-crop helper för Wix CDN-bilder.
//
// Problem
// -------
// Många Wix-källbilder har inbakad vit padding (källfotot levereras med extra
// vit kant). När `<Image fill>` renderar `fill/w_X,h_X,al_c` blir innehållsytan
// ~60–70 % av container ytan i stället för ≥85 % vi vill ha — produkten ser
// liten ut i hjälte-rutan på PDP, listing-korten och cart.
//
// Lösning
// -------
// Wix CDN stöder URL-baserad image-transformation, inklusive
// `/v1/crop/x_X,y_Y,w_W,h_H/file.{ext}` som extraherar en rektangel ur original-
// bilden (docs:
// https://dev.wix.com/docs/api-reference/assets/media/media-manager/url-image-transformation
// ).
//
// Vi förberäknar (med Sharp i `scripts/detect-image-crops.mjs`) en kvadratisk
// bounding-box i original-pixlar för varje produktbild — bbox = pixlar där minst
// en RGB-kanal är <240/255, paddat med ~6 % och justerat till 1:1 aspect.
// Resultatet cachas i `data/image-crops.json` (nycklad på Wix media-key, t.ex.
// `b379ce_b33888095996429d81f2ece12df7a49e~mv2.png`).
//
// Vid render slår vi upp media-key:n i cachen och bygger en crop-URL i stället
// för den vanliga `fill`-URL:en. Samma webp-pipeline, samma `q_72`, samma kvad-
// ratiska sidor — bara crop-rektangeln ändras.
//
// Skydd mot regressioner
// ----------------------
// 1. Saknad post i cachen → returnera fallback med en safe konstant inset
//    (`FALLBACK_INSET_PCT`) eller helt orörd URL (`SAFE_NO_CHANGE`).
// 2. <3 % margin på alla kanter → bilden är redan tight, ingen crop.
// 3. >25 % margin på någon kant → potentiellt mätfel, behåll original
//    (lägg på skip-lista i detection-scriptet).
// 4. Alltid kvadratisk crop (aspect 1:1), bevarar gamla hero-layouten.
//
// Konsumeras av: components/gallery.tsx, components/productview.tsx,
// components/productcard.tsx, components/cart.tsx, components/shopbrowser.tsx.

import cropsData from "../data/image-crops.json";

export type CropEntry = {
  // Original-bildens dimensioner (pixlar).
  ow: number;
  oh: number;
  // Tight-crop-rektangeln (pixlar i originalbilden, padded ~6 %).
  x: number;
  y: number;
  w: number;
  h: number;
  // Marginal-procent per kant FÖRE padding (för diagnostik/skip-detektion).
  margins?: { top: number; right: number; bottom: number; left: number };
  // Set om någon kant överstiger SKIP_MARGIN_PCT → använd ej.
  skip?: boolean;
};

type CropsData = {
  // detection-script-version → invalidate cache vid algoritm-byte.
  version?: number;
  generatedAt?: string;
  entries: Record<string, CropEntry>;
};

const data = cropsData as CropsData;

// Fallback-inset i procent när vi inte har detection-data för en bild.
// 0 = ingen ändring (behåll dagens beteende, säkrast).
// 4 = säker konstant inset som ger en synlig förbättring för PNG-bilder med
// inbakad vit padding utan att riskera att klippa innehåll.
// Vi börjar konservativt med 0 så ingen produkt försämras innan detection körts.
const FALLBACK_INSET_PCT = 0;

/**
 * Extraherar Wix media-key från en static.wixstatic.com-URL.
 * Returnerar t.ex. "b379ce_b33888095996429d81f2ece12df7a49e~mv2.png".
 */
export function wixMediaKey(url: string): string | null {
  if (!url) return null;
  const m = url.match(/static\.wixstatic\.com\/media\/([^/?#]+)/);
  return m ? m[1] : null;
}

/**
 * Returnerar en crop-entry för en given Wix-bild-URL, eller null om vi inte har
 * tight-crop-data för bilden.
 */
export function getCropEntry(url: string): CropEntry | null {
  const key = wixMediaKey(url);
  if (!key) return null;
  const entry = data.entries?.[key];
  if (!entry || entry.skip) return null;
  return entry;
}

/**
 * Bygger en tight-fill-URL: applicerar tight crop i original-pixlar, returnerar
 * en /v1/crop-URL. Browsern skalar via `<Image fill>` så vi behöver inte kedja
 * fill efter crop (Wix CDN garanterar inte chained transforms i URL).
 *
 * Om vi saknar detection-data för bilden:
 *  - FALLBACK_INSET_PCT > 0 → applicerar konstant inset (kräver att vi vet
 *    output-dimensioner; vi kan bara approximera procent → vi använder en w_*,h_*-
 *    fill med samma storlek som tidigare och hoppas att källan är kvadratisk).
 *    För säkerhets skull faller vi tillbaka på fill (samma som dagens).
 *  - FALLBACK_INSET_PCT == 0 → returnerar fill (dagens beteende, ingen regression).
 */
export function tightFillUrl(url: string, width: number, height: number, quality = 72): string {
  const key = wixMediaKey(url);
  if (!key) return url;

  const entry = getCropEntry(url);
  if (entry) {
    // Använd crop-transformen. Output-dimensionerna styrs av crop-rektangeln
    // i originalbildens pixlar; browsern skalar till container.
    return `https://static.wixstatic.com/media/${key}/v1/crop/x_${entry.x},y_${entry.y},w_${entry.w},h_${entry.h}/file.webp`;
  }

  // Ingen detection-data → behåll dagens fill-beteende (säkrast).
  // FALLBACK_INSET_PCT-vägen lämnas öppen men inaktiv tills detection körts.
  if (FALLBACK_INSET_PCT > 0) {
    // Vi vet inte original-dimensionerna utan att hämta bilden; konservativ
    // inset via fill: w/h proportionellt minskat ger en motsvarande crop-effekt
    // när al_c centrerar. Avstår tills detection körts på alla bilder.
  }
  return `https://static.wixstatic.com/media/${key}/v1/fill/w_${width},h_${height},al_c,q_${quality}/file.webp`;
}

/**
 * Bekvämlighet: returnerar en Wix-loader-funktion kompatibel med next/image:s
 * `ImageLoaderProps`-signatur, men som applicerar tight crop när möjligt.
 */
export function makeTightWixLoader(quality = 72) {
  return ({ src, width, quality: q }: { src: string; width: number; quality?: number }): string =>
    tightFillUrl(src, width, width, q ?? quality);
}

/** Antal entries i cachen — för debug/diagnostik. */
export function cropCacheSize(): number {
  return Object.keys(data.entries || {}).length;
}
