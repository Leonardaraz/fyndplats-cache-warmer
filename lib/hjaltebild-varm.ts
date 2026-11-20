// Produktsidans huvudbild hämtas när man TRYCKER på ett produktkort.
//
// Mätt mot www 2026-11-20 (mobil, 4 Mbit/s, processor ÷4): efter ett tryck på
// ett kort tog sidbytet 1,0–1,2 s, och först DÅ började huvudbilden hämtas, så
// den var klar upp till 0,45 s senare. Under den tiden visade bildrutan sitt
// skimmer: "huvudbilden laddas och syns långsamt ibland" (Leonard).
// Nu hämtas bilden medan sidan hämtas, så att den ligger i webbläsarens cache
// när produktsidan ritas.
//
// Bilden begärs med galleriets egen laddare och HERO_SIZES, genom samma
// funktion som <Image> använder (getImageProps). Webbläsaren väljer då samma
// kandidat i srcset som galleriet kommer att välja, och svaret återanvänds.
//
// Vid tryck, inte vid hovring eller första beröringen: ett finger som landar
// på ett kort för att rulla sidan ska inte hämta en bild på 20–50 kB.
import { getImageProps } from "next/image";
import { HERO_SIZES } from "./bild-sizes";
import { prefersDataSaving } from "./gallery-preload";
import { wixMainLoader } from "./hjalte-loader";
import { wixMediaKey } from "./wix-media-key";

const varmade = new Set<string>();

// KORTETS BILD VISAS MEDAN HUVUDBILDEN HÄMTAS (2026-11-20). Kortet man tryckte
// på har redan samma foto i webbläsarens minne, i kortets storlek och med
// samma kvadratiska beskärning. Galleriet lägger den som bakgrund i sitt
// första lager (components/gallery.tsx), så bildrutan är aldrig tom efter ett
// tryck: först kortets bild, sedan samma bild skarp när huvudbilden kommit.
//
// Bara samma foto (samma fil-id), bara en bild som faktiskt är hämtad och
// minst 300 px bred (sökförslagens 46 px-ruta duger inte i en bildruta på
// 544 px), och bara en stund efter trycket.
const KORTBILD_GALLER_MS = 15_000;
const KORTBILD_MINSTA_BREDD = 300;
let kortbild: { nyckel: string; url: string; nar: number } | null = null;

/** Utdatabredden i en Wix-adress: sista w_ (en crop-del har sin egen w_ före). */
export function wixUtbredd(url: string): number {
  const alla = [...url.matchAll(/[/,]w_(\d+)/g)];
  return alla.length ? Number(alla[alla.length - 1][1]) : 0;
}

function kommIhagKortbild(bild: string, kortet: Element | null | undefined): void {
  const nyckel = wixMediaKey(bild);
  if (!nyckel || !kortet) return;
  for (const img of kortet.querySelectorAll("img")) {
    const url = img.currentSrc;
    if (!url || !img.complete || img.naturalWidth === 0) continue;
    if (wixMediaKey(url) !== nyckel || wixUtbredd(url) < KORTBILD_MINSTA_BREDD) continue;
    kortbild = { nyckel, url, nar: Date.now() };
    return;
  }
}

/** Kortets redan hämtade bild för samma foto, om man nyss tryckte på kortet. Annars null. */
export function kortbildFor(bild: string | null | undefined): string | null {
  if (!bild || !kortbild || Date.now() - kortbild.nar > KORTBILD_GALLER_MS) return null;
  return wixMediaKey(bild) === kortbild.nyckel ? kortbild.url : null;
}

/** srcset och sizes som galleriets huvudbild får för den här bilden. */
export function hjaltebildKandidater(bild: string): { src: string; srcSet?: string; sizes?: string } {
  // Samma mått som galleriets lager (components/gallery.tsx): med `sizes` styr
  // de inte srcset, men adressen i `src` ska vara densamma.
  const { props } = getImageProps({ src: bild, alt: "", width: 800, height: 800, sizes: HERO_SIZES, loader: wixMainLoader });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}

/**
 * Börja hämta produktsidans huvudbild. Gör ingenting utan webbläsare, för andra
 * källor än Wix eller i datasparläge. `kortet` är elementet man tryckte på: dess
 * bild visas på produktsidan medan huvudbilden hämtas (kortbildFor).
 *
 * ☠️ Listsidorna skickar bilden som en NAKEN nyckel, utan värddelen
 * (lib/wix-media-key.ts). Adressen byggs därför om från nyckeln: annars gjorde
 * förhämtningen ingenting just där den behövs mest, på korten i listorna.
 */
export function varmHjaltebild(bild: string | null | undefined, kortet?: Element | null): void {
  if (!bild || typeof window === "undefined" || typeof Image !== "function") return;
  const nyckel = wixMediaKey(bild);
  if (!nyckel) return;
  kommIhagKortbild(bild, kortet);
  if (varmade.has(nyckel)) return;
  const nat = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (prefersDataSaving(nat)) return;
  varmade.add(nyckel);
  try {
    const k = hjaltebildKandidater(`https://static.wixstatic.com/media/${nyckel}`);
    const im = new Image();
    im.decoding = "async";
    // sizes FÖRE srcset: annars väljer webbläsaren kandidat för 100vw.
    if (k.sizes) im.sizes = k.sizes;
    if (k.srcSet) im.srcset = k.srcSet;
    im.src = k.src;
  } catch {
    // En bild som inte gick att förhämta hämtas av galleriet som förut.
    varmade.delete(nyckel);
  }
}
