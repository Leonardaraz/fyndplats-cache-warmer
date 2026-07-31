// Alt-texter för produktbilder — beroendefri modul.
//
// Bor SEPARAT från lib/products.ts med flit: galleriet (components/gallery.tsx)
// är en klientkomponent, och en import från products.ts hade dragit in Wix-SDK:n
// i webbläsarpaketet. Här finns bara ren strängbearbetning → enhetstestbar och
// gratis att importera från både server och klient.

/**
 * Wix mediafil-id ur en bild-URL ("…/media/<FIL-ID>/v1/fill/…" → "<FIL-ID>").
 * Används som stabil nyckel för alt-texter och variantägare: samma foto kan
 * förekomma med olika transform-parametrar, men fil-id:t är detsamma.
 */
export function imgKey(url: string): string {
  return (url || "").match(/\/media\/([^/?]+)/)?.[1] || url || "";
}

/**
 * Alt-text för en produktbild. Föredrar Wix egen alt-text (merchant-skriven,
 * beskriver faktiskt motivet) och faller annars tillbaka på produktnamnet —
 * numrerat för bild 2 och framåt, så skärmläsare och Google Bilder kan skilja
 * galleribilderna åt i stället för att möta tomma alt="".
 *
 * `index` är 0-baserat galleriindex. Ren funktion (ingen I/O).
 */
export function altForImage(
  url: string,
  index: number,
  productName: string,
  imageAlts?: Record<string, string>,
): string {
  const wixAlt = imageAlts?.[imgKey(url)]?.trim();
  if (wixAlt) return wixAlt;
  const name = (productName || "").trim() || "Produktbild";
  return index > 0 ? `${name} – bild ${index + 1}` : name;
}
