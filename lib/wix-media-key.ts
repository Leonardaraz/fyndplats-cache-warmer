// lib/wix-media-key.ts
// Media-nyckeln ur en Wix-bild-URL, och adresserna som byggs ur den — utbrutet
// ur lib/wix-image.ts.
//
// VARFÖR EN EGEN FIL: wix-image.ts importerar data/image-crops.json, och en
// vanlig JSON-import går inte att ladda i node:test (den kräver ett
// import-attribut som Turbopack inte behöver). Funktionerna här är rena och
// beroendefria, så de kan täckas av tester. wix-image.ts återexporterar
// wixMediaKey, så alla befintliga anropare är oförändrade.

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

/** Längsta sidan på den förstorade bilden. Lightboxen visar max 88vh/92vw. */
export const FIT_KANT = 1400;

/**
 * Samma bild, oskuren och stor — adressen en lightbox ska visa.
 *
 * VARFÖR DEN MÅSTE BYGGAS OM. Miniatyrerna på omdömessidan bär en KVADRATISK
 * fill-transform (w_168,h_168) därför att rutan i kortet är 84×84 med
 * object-fit:cover: beskärningen sker ändå, och görs den hos Wix slipper
 * besökaren pixlar som aldrig syns. Men just den beskärningen är fel när man
 * klickar för att se bilden STÖRRE — då vill man se hela bilden, inte en
 * uppförstorad kvadrat ur mitten. `fit` skalar in bilden i rutan utan att
 * beskära, så porträtt förblir porträtt.
 *
 * Adresser som inte är Wix-media returneras oförändrade: ReviewPhoto.src får
 * enligt sin egen dokumentation vara en /public-sökväg, och en sådan har ingen
 * transform att byta ut.
 */
export function wixFitUrl(url: string, kant: number = FIT_KANT): string {
  const nyckel = url.includes("static.wixstatic.com") ? wixMediaKey(url) : null;
  if (!nyckel) return url;
  return `https://static.wixstatic.com/media/${nyckel}/v1/fit/w_${kant},h_${kant},q_85/file.jpg`;
}
