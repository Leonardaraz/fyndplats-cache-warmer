// lib/category-filter.ts
//
// Ren regel för när kategorimenyns "dölj tomma kategorier"-filter får användas.
// Ligger separat (utan Wix-SDK-import) så den går att enhetstesta.
//
// Bakgrund (Leonards rapport 2026-08-16): startsidan och /alla-produkter visade
// "0 kategorier", och det kom och gick mellan sidladdningar. Orsaken var att
// filtret byggs ur produkternas collectionIds — och när produktlistan kommer
// tillbaka UTAN dem (nödkatalogen har alltid tomma collectionIds, och SDK:ns
// queryProducts har visat sig tappa fält) blev mängden tom och då sållades
// ALLA kategorier bort. Hela navigationen försvann.
//
// Skillnaden regeln fångar: "vi vet inte vilka kategorier som används" är inte
// samma sak som "ingen kategori används".

/**
 * true när produktdatan faktiskt bär kategoriinformation, dvs. när det går att
 * lita på att en kategori utan träffar verkligen är tom.
 *
 * Noll observerade kategorianvändningar betyder i praktiken alltid trasig eller
 * degraderad produktdata — en katalog med hundratals produkter där INGEN ligger
 * i någon kategori finns inte. Då är filtret meningslöst och ska hoppas över.
 */
export function categorySignalIsUsable(usedCategoryIdCount: number): boolean {
  return usedCategoryIdCount > 0;
}

/**
 * Ska den här kategorin visas? `used` är mängden kategori-id som minst en
 * köpbar produkt ligger i.
 *
 * Utan användbar signal visas alla kategorier — hellre en kategori som råkar
 * vara tom än ingen navigation alls.
 */
export function keepCategory(categoryId: string, used: ReadonlySet<string>): boolean {
  if (!categorySignalIsUsable(used.size)) return true;
  return used.has(categoryId);
}
