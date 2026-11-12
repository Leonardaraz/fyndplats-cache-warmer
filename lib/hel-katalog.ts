// lib/hel-katalog.ts
//
// EN LISTSIDA BYGGS ALDRIG PÅ EN KATALOG SOM INTE ÄR HEL.
//
// ☠️ MÄTT 2026-11-11. Kl 12:09:40 UTC svarade Wix 504 på kataloghämtningen för
// en ny instans, också efter de tre omförsöken (lib/katalog-sidor.ts). Sex
// kategorisidor byggdes just då om i bakgrunden, på reservkatalogen: 413 gamla
// produkter utan en enda kategori. Sidorna blev tomma ("Inga produkter
// matchade dina filter"), fick `noindex` av tröskeln i lib/category-threshold.ts
// och ersatte de hela sidorna i cachen. Fem av dem låg kvar så i två timmar
// och tio minuter, tills nästa besök råkade komma.
//
// kortLivslangd() räckte inte. Den sänker sidans livslängd till fem minuter,
// men en sida byggs bara om när någon besöker den. En sällan besökt kategori
// står kvar tom tills dess, och nästa besökare kan vara Googlebot.
//
// DÄRFÖR KASTAR LISTSIDAN I STÄLLET. När en ombyggnad i bakgrunden kastar
// behåller Next den förra, hela sidan och försöker igen vid nästa besök. Det
// gäller sidor (ISR) och rutter med `revalidate`. Flödena fångar felet och
// svarar 503 som inte sparas (lib/feed/prisjakt-svar.ts), så CDN:en och läsaren
// behåller sin förra kopia.
//
// Följden vid ett BYGGE: faller kataloghämtningen medan sidorna förgenereras,
// faller bygget. Det är avsikten. Förr gick ett sådant bygge igenom och lade ut
// tomma kategorisidor utan att någon såg det. Starta om bygget.
//
// SAMMA SAK FÖR KATEGORILISTAN PÅ KATEGORISIDAN. Faller kategorihämtningen
// kommer listan hem tom, kategorin "finns inte" och sidan svarade förr med en
// 307 till /butik som sparades i den hela sidans ställe (provat lokalt med Wix
// blockerat, samma dag). Kategorisidan läser därför getHelaKategorier(), som
// kastar på en tom lista. En okänd adress ger 404 och en känd men tom kategori
// 307 som förut: de fallen har en kategorilista att fråga.
//
// PRODUKTSIDAN ANVÄNDER INTE DET HÄR. Den läser sin vara direkt ur Wix och ska
// gå att köpa från också när katalogen i minnet är reservlistan. Där gäller
// kortLivslangd() som förut. Samma sak för sidhuvudet, varukorgen och kontot.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den.

/** Det vanliga skälet: produktlistan är reservlistan eller kom inte hem hel. */
export const EJ_HEL_KATALOG = "reservkatalogen eller en kapad hämtning";
/** Kategorilistan kom hem tom. Butiken har alltid kategorier, så tomt är ett fel. */
export const TOM_KATEGORILISTA = "en tom kategorilista";

/** Felet som säger att sidan inte byggdes, och varför. Syns i körloggen. */
export class KatalogenEjHel extends Error {
  constructor(vad: string, underlag: string = EJ_HEL_KATALOG) {
    super(
      `[katalog] ${vad} byggs inte på ${underlag}. ` +
        "Den förra versionen ligger kvar, och nästa besök försöker igen.",
    );
    this.name = "KatalogenEjHel";
  }
}

/** Ger listan tillbaka när den är hel. Kastar annars, så att inget byggs på den. */
export function kravHel<T>(lista: T, degraderad: boolean, vad: string, underlag: string = EJ_HEL_KATALOG): T {
  if (degraderad) throw new KatalogenEjHel(vad, underlag);
  return lista;
}

/**
 * Sidorna och rutterna som ska läsa katalogen genom getHelaKatalogen() eller
 * getProductsFarska(), aldrig genom getProducts(). lib/hel-katalog.test.ts
 * läser källtexten för var och en.
 */
export const LISTSIDOR = [
  "app/page.tsx",
  "app/butik/page.tsx",
  "app/alla-produkter/page.tsx",
  "app/rea/page.tsx",
  "app/kategori/[slug]/page.tsx",
  "lib/seo/programmatic.ts",
  "app/api/feed/products.xml/route.ts",
  "app/api/feed/image-sitemap.xml/route.ts",
] as const;
