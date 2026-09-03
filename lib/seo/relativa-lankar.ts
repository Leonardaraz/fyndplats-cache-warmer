// Trasiga syskonlänkar i publicerad produkttext — detektor och lagning.
//
// ☠️ VARFÖR
//
// Färgsyskon korslänkas i ingressen. Skrivs länken ROTRELATIVT skriver Wix om
// den när HTML:en sparas:
//
//   du skickar   href="/produkt/x"
//   Wix lagrar   href="https:/produkt/x"        ← EN snedstreck
//
// Enligt URL-standarden parsas `https:/produkt/x` som värdnamnet `produkt` och
// sökvägen `/x`. Länken är alltså inte "nästan rätt" — den pekar på en domän som
// inte finns. Uppmätt 2026-09-03 med en sond som skickade båda formerna i samma
// PATCH: bara den absoluta kom tillbaka hel.
//
// Felet syns varken i Wix-svaret eller i en läsning av `plainDescription` — bara
// i ett klick, eller i ett svep efter strängen `https:/produkt`.

/** Butikens kanoniska adress. Publik, inte en hemlighet — den står i varje sida. */
export const BUTIKENS_URL = "https://www.fyndplats.se";

/**
 * `https:` följt av EN snedstreck.
 *
 * ☠️ `(?!/)` är hela spärren: utan den matchar mönstret också varje korrekt
 * `https://…` och lagningen hade dubblerat värdnamnet på fungerande länkar.
 */
export const TRASIG_LANK = /href="https:\/(?!\/)([^"]*)"/g;

/** Adresserna som är trasiga. Tom lista = texten är hel. */
export function hittaTrasigaLankar(html: string): string[] {
  TRASIG_LANK.lastIndex = 0;
  return [...html.matchAll(TRASIG_LANK)].map((m) => `https:/${m[1]}`);
}

/** Sätter tillbaka värdnamnet. Rör bara `href`, aldrig löpande text. */
export function lagaTrasigaLankar(html: string, bas: string = BUTIKENS_URL): string {
  return html.replace(TRASIG_LANK, (_hela, sokvag: string) => `href="${bas}/${sokvag}"`);
}
