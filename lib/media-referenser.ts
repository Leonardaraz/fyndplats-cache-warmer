// Varje Wix-mediafil som butikens egen kod och eget innehåll pekar på.
//
// ☠️ VARFÖR LISTAN FINNS (2026-10-14)
//
// Motorns bildstädning (lib/aosom/media-cleanup.ts på main) raderar bilder som
// ingen läsare använder. Den känner produkterna, kategorierna, recensionerna och
// färgbildstabellen, men inte butiken. Bloggen visade 215 Wix-bilder den dagen,
// och 61 av dem var Aosom-importer och 122 Wix-kopior, alltså exakt den sortens
// fil städningen tar när ingen PRODUKT bär den längre. Reservkatalogen
// (products.json) och variantbilderna (data/variant-images.json) pekar på
// ytterligare ett par tusen filer i samma bibliotek.
//
// Listan byggs ur källfilerna, inte ur en handskriven förteckning: en bild som
// läggs till i ett blogginlägg står i listan vid nästa deploy utan att någon
// behöver komma ihåg det.
//
// ☠️ TVILLING I MOTORN. Motorn har ett eget, STRIKTARE mönster för vilka
// fil-id den alls får radera (`raderbartId` i lib/aosom/media-cleanup.ts).
// Mönstret här måste fånga varje sådant id. Det är därför det är brett: det
// tar med varianter som `~mv2_d_1920_1080_s_2.jpg`, som motorn aldrig raderar.
// Ett för brett mönster här kostar en fil som får ligga kvar; ett för smalt
// kostar en bild som försvinner från bloggen.

/** Ett Wix-media-id i löpande text: adresser, `wix:image://`-URI:er och nakna id. */
const MEDIA_ID = /[0-9a-f]{6}_[0-9a-f]{32}(?:~mv2)?(?:_[a-z0-9_]+)?\.[a-z0-9]{2,5}/gi;

/**
 * Alla Wix-media-id i en text, gemener, utan dubbletter.
 *
 * `%7E` avkodas först: Next/Image och andra bildproxyer bär adressen
 * URL-kodad, och `~mv2` blir då `%7Emv2`.
 */
export function wixMediaIdn(text: string): string[] {
  const avkodad = text.replace(/%7e/gi, "~");
  const ut = new Set<string>();
  for (const m of avkodad.match(MEDIA_ID) ?? []) ut.add(m.toLowerCase());
  return [...ut];
}

/** Källor som räknas, relativt repots rot. En fil får bara en källa. */
export const KALLOR: ReadonlyArray<{ namn: string; vag: string }> = [
  { namn: "blogg", vag: "content" },
  { namn: "reservkatalog", vag: "products.json" },
  { namn: "data", vag: "data" },
  { namn: "kod", vag: "app" },
  { namn: "kod", vag: "components" },
  { namn: "kod", vag: "lib" },
  { namn: "public", vag: "public" },
];

/** Bara text. Bilderna i public/ har inga id att hitta, och de är stora. */
export const LASBARA = /\.(md|mdx|ts|tsx|js|mjs|cjs|json|html|xml|txt|css)$/i;

/**
 * Testfiler pekar på påhittade eller gamla id för att pröva tolkningen. De
 * visas aldrig för någon.
 */
export const HOPPA_OVER = /(^|\/)(node_modules|\.next)(\/|$)|\.test\.[a-z]+$|-fixtures?\//;

/**
 * Golv per källa och totalt. Under dem är listan trasig, inte tom. Rutten
 * svarar då 503 i stället för en halv lista, och motorn avbryter städningen.
 *
 * PER KÄLLA, inte bara totalt: reservkatalogen ensam bär totalen, så en lista
 * där variantbilderna (data/) fallit bort hade annars gått igenom. Det är
 * också det som fäller en lista som räknas om i en serverlös funktion, där
 * källfilerna inte finns. Uppmätt 2026-10-14: blogg 215, reservkatalog
 * 2 399, data 749, kod 5. Motorn har samma golv (lib/wix/butikens-media.ts).
 */
export const GOLV = { blogg: 100, reservkatalog: 1000, data: 300, kod: 1, totalt: 1000 } as const;

export interface Manifest {
  version: 1;
  genererad: string;
  /** Antal unika id per källa. */
  perKalla: Record<string, number>;
  /** Antal lästa filer per källa. */
  filer: Record<string, number>;
  idn: string[];
}

/** Bygger listan ur redan lästa filer. Ren, så att den går att testa. */
export function byggManifest(
  lasta: ReadonlyArray<{ kalla: string; text: string }>,
  nu: Date = new Date(),
): Manifest {
  const alla = new Set<string>();
  const perKalla: Record<string, Set<string>> = {};
  const filer: Record<string, number> = {};
  for (const { kalla, text } of lasta) {
    filer[kalla] = (filer[kalla] ?? 0) + 1;
    const set = (perKalla[kalla] ??= new Set());
    for (const id of wixMediaIdn(text)) {
      set.add(id);
      alla.add(id);
    }
  }
  return {
    version: 1,
    genererad: nu.toISOString(),
    perKalla: Object.fromEntries(Object.entries(perKalla).map(([k, s]) => [k, s.size])),
    filer,
    idn: [...alla].sort(),
  };
}

/** Är listan hel nog att lita på? `null` = ja, annars skälet. */
export function underGolv(m: Manifest): string | null {
  for (const kalla of ["blogg", "reservkatalog", "data", "kod"] as const) {
    const n = m.perKalla[kalla] ?? 0;
    if (n < GOLV[kalla]) return `${kalla} gav ${n} bilder, golvet är ${GOLV[kalla]}`;
  }
  if (m.idn.length < GOLV.totalt) {
    return `listan har ${m.idn.length} bilder, golvet är ${GOLV.totalt}`;
  }
  return null;
}
