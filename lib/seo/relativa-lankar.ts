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

/**
 * Wix-editorns sökvägar, översatta till butikens egna. ENBART UPPMÄTTA PAR.
 *
 * ☠️ Poleringen skriver ibland den sökväg Wix-editorn visar i stället för den
 * headless-butiken svarar på. Uppmätt mot skarpa www.fyndplats.se 2026-09-03:
 *
 *   /product-page/<slug>   308 → /produkt/<slug>     fungerar, men via ett hopp
 *   /category/<slug>       404                        DÖD
 *   /kategori/<slug>       200
 *
 * Rättningen gäller BARA hrefs som ändå ska skrivas om för att de saknar
 * värdnamn. En sida där länken redan är absolut och hel rörs inte — blast-
 * radien ska vara exakt defekten, samma regel som prisreparationens
 * "oförändrat inköpspris → varianten rörs inte alls".
 *
 * ⚠️ Lägg aldrig till ett par här utan att först mäta båda sidorna. En gissad
 * sökväg byter en död länk mot en intern 404, vilket är sämre: den blir
 * dessutom crawlad.
 */
export const SOKVAGSRATTNINGAR: ReadonlyArray<readonly [string, string]> = [
  ["product-page/", "produkt/"],
  ["category/", "kategori/"],
];

/** Byter ut ett uppmätt felaktigt prefix. Okända sökvägar lämnas orörda. */
export function rattaSokvag(sokvag: string): string {
  for (const [fel, ratt] of SOKVAGSRATTNINGAR) {
    if (sokvag.startsWith(fel)) return ratt + sokvag.slice(fel.length);
  }
  return sokvag;
}

/** Sätter tillbaka värdnamnet. Rör bara `href`, aldrig löpande text. */
export function lagaTrasigaLankar(html: string, bas: string = BUTIKENS_URL): string {
  return html.replace(TRASIG_LANK, (_hela, sokvag: string) => `href="${bas}/${rattaSokvag(sokvag)}"`);
}
