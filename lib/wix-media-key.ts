// lib/wix-media-key.ts
// Media-nyckeln ur en Wix-bild-URL — utbruten ur lib/wix-image.ts.
//
// VARFÖR EN EGEN FIL: wix-image.ts importerar data/image-crops.json, och en
// vanlig JSON-import går inte att ladda i node:test (den kräver ett
// import-attribut som Turbopack inte behöver). Funktionen här är ren och
// beroendefri, så den kan täckas av tester. wix-image.ts återexporterar den,
// så alla befintliga anropare är oförändrade.

/**
 * Extraherar Wix media-nyckeln ur en URL — t.ex.
 * "b379ce_b33888095996429d81f2ece12df7a49e~mv2.png".
 *
 * Släpper också igenom en NAKEN nyckel oförändrad. Listsidorna skickar
 * bilderna till klienten i den formen (se forClient i lib/products.ts):
 * värddelen "https://static.wixstatic.com/media/" är identisk för varenda bild
 * och kostade 113 330 B per /alla-produkter att upprepa 3 238 gånger. Den
 * kastas ändå bort här, och tightFillUrl bygger om URL:en från nyckeln.
 *
 * Testet är formen, inte innehållet: en nyckel har varken sökvägsdelare eller
 * schema. Allt annat — lokala /public-sökvägar, Unsplash-URL:er, data-URI:er,
 * tomma strängar — returnerar null precis som förut.
 */
export function wixMediaKey(url: string): string | null {
  if (!url) return null;
  const m = url.match(/static\.wixstatic\.com\/media\/([^/?#]+)/);
  if (m) return m[1];
  if (!url.includes("/") && !url.includes(":")) return url;
  return null;
}
