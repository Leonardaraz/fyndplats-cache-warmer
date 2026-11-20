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

const varmade = new Set<string>();

/** srcset och sizes som galleriets huvudbild får för den här bilden. */
export function hjaltebildKandidater(bild: string): { src: string; srcSet?: string; sizes?: string } {
  // Samma mått som galleriets lager (components/gallery.tsx): med `sizes` styr
  // de inte srcset, men adressen i `src` ska vara densamma.
  const { props } = getImageProps({ src: bild, alt: "", width: 800, height: 800, sizes: HERO_SIZES, loader: wixMainLoader });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}

/** Börja hämta produktsidans huvudbild. Gör ingenting utan webbläsare, för andra källor än Wix eller i datasparläge. */
export function varmHjaltebild(bild: string | null | undefined): void {
  if (!bild || typeof window === "undefined" || typeof Image !== "function") return;
  if (!bild.includes("static.wixstatic.com") || varmade.has(bild)) return;
  const nat = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (prefersDataSaving(nat)) return;
  varmade.add(bild);
  try {
    const k = hjaltebildKandidater(bild);
    const im = new Image();
    im.decoding = "async";
    // sizes FÖRE srcset: annars väljer webbläsaren kandidat för 100vw.
    if (k.sizes) im.sizes = k.sizes;
    if (k.srcSet) im.srcset = k.srcSet;
    im.src = k.src;
  } catch {
    // En bild som inte gick att förhämta hämtas av galleriet som förut.
    varmade.delete(bild);
  }
}
