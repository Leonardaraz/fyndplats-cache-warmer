// ASCII-slug för kategorisidan, räknad ur kategorinamnet i Wix. Wix egna slugar
// innehåller å/ä/ö ("kök", "hörlurar"), och det hanterar Next.js dynamiska
// rutter dåligt (404). Sluggen är bara ett internt URL-id: produkterna matchas
// mot kategorin på collectionId, inte på sluggen.
//
// é, ü och andra accenter tas bort med NFD, inte bara å/ä/ö. Utan det blev
// "Skärmtak & entrétak" (runda S13, 2026-09-24) till skarmtak-entr-tak, medan
// texterna och Google-flödet var nycklade på skarmtak-entretak. Sidan
// renderades med den generiska mallen, och /kategori/skarmtak-entretak gav 404.
// Mätt samma dag på alla 128 kategorinamn i Wix: den nya regeln ändrar bara
// den kategorins slug och ger inga krockar.
//
// Enda definitionen. Menyn (fetchCollections) och listan över kända slugar
// (fetchAllCategorySlugs) läser båda den här.

export function asciiSlug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[åä]/g, "a").replace(/ö/g, "o")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
