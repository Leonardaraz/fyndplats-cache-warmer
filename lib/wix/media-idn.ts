// Wix-media-id i löpande text, och vilka id bildstädningen alls får radera.
//
// ☠️ TVILLING I BUTIKEN. Butikens lista över de bilder den själv pekar på
// (`lib/media-referenser.ts` på grenen headless-site, serverad som
// /api/media-referenser) har samma breda mönster. Den här filen har dessutom
// det STRIKTA mönstret, `raderbartId`: bara id på den formen raderas av läget
// "allt", och det breda mönstret fångar varje sådant id. Glider de två isär åt
// fel håll försvinner en bloggbild; därför är det strikta mönstret smalt och
// det breda brett, och testerna på båda sidor använder samma exempel.

/** Ett Wix-media-id i löpande text: adresser, `wix:image://`-URI:er och nakna id. */
const MEDIA_ID = /[0-9a-f]{6}_[0-9a-f]{32}(?:~mv2)?(?:_[a-z0-9_]+)?\.[a-z0-9]{2,5}/gi;

/**
 * Alla Wix-media-id i en text, gemener, utan dubbletter.
 *
 * `%7E` avkodas först: en URL-kodad adress bär `~mv2` som `%7Emv2`.
 */
export function wixMediaIdn(text: string): string[] {
  const avkodad = text.replace(/%7e/gi, "~");
  const ut = new Set<string>();
  for (const m of avkodad.match(MEDIA_ID) ?? []) ut.add(m.toLowerCase());
  return [...ut];
}

/**
 * Får läget "allt" radera en fil med det här id:t?
 *
 * Bara den vanliga formen. En fil med ett ovanligt id kan vara refererad på
 * ett sätt som ingen läsare känner igen, och den rörs då hellre inte.
 */
export function raderbartId(id: string): boolean {
  return /^[0-9a-f]{6}_[0-9a-f]{32}~mv2\.(jpe?g|png|webp|gif|avif)$/i.test(id);
}
