/**
 * Gör en cover-adress absolut för strukturerad data och Open Graph.
 *
 * ☠️ BLOGGOMSLAG SOM BOR I /public SKRIVS RELATIVT ("/blog-x.jpg"), med flit.
 * En hårdkodad https://www.fyndplats.se-adress pekar på PRODUKTION även när
 * sidan renderas på en preview-deploy eller lokalt — då hämtas en fil som inte
 * finns där ännu, och previewen visar trasiga bilder fastän ändringen är rätt.
 * Innehållet ska vara värd-agnostiskt; domänen läggs på HÄR, och bara där en
 * full URL faktiskt krävs.
 *
 * <Image> klarar den relativa formen som den är. Det gör INTE JSON-LD:ns
 * `image` eller Open Graph — och JSON-LD byggs för hand, så metadataBase
 * resolvar den inte. En relativ adress där är ogiltig för Googles Article.
 */
export function absolutCover(cover: string): string {
  if (!cover) return "";
  if (/^https?:\/\//i.test(cover)) return cover;
  return `https://www.fyndplats.se${cover.startsWith("/") ? "" : "/"}${cover}`;
}

