// Leverantörskoder i publicerad produkttext — detektor och sax.
//
// ☠️ VARFÖR DEN FINNS
//
// dealproffsen.se publicerar Aosoms artikelnummer som `sku`/`mpn` i sin JSON-LD.
// Står samma sträng i vår produkttext går våra sidor att joina mot deras — och
// därmed mot vad vi betalar. Numret får därför aldrig nå en publicerad sida.
//
// Läckan har hittats fyra gånger: 33 produktKORT (bilder) 2026-09-02, fyra sidor
// samma dag, 51 sidor till 2026-09-03 när svepets regex rättats — och samma dag
// en rad som svepet påstod inte fanns (se DEKOR nedan). Varje gång har fyndet
// gjorts av ett svep, aldrig av en spärr. Den här filen är spärren: en testad
// detektor som `seo-kod-repair` kör över hela katalogen.
//
// FORMEN ÄR MÄTT, INTE GISSAD. Över de 51 sidor som hittades 2026-09-03 finns
// exakt två varianter, båda som en rad i spec-listan:
//
//   <li><p>Artikelnummer: Z00-111V00XX</p></li>                                (29 st)
//   <li><p><span style="font-weight: 700">Referens:</span> Z90-222V00BK</p></li> (22 st)
//
// (Koderna ovan och i testerna är PÅHITTADE — bara formen är verklig. Repot är
// publikt, och en samling äkta artikelnummer här vore samma läcka en gång till,
// på det mest varaktiga stället som finns.)
//
// ☠️ VÄRDET MÅSTE SE UT SOM EN KOD, inte bara etiketten stämma. En rad
// "Referens: se bruksanvisningen" eller "Standard: EN 1930" är legitim text och
// ska stå kvar. Utan värdemönstret hade saxen klippt bort dem också — och en
// sax som tar för mycket är farligare än läckan den lagar.

/** Etiketter som i huset har burit ett leverantörsnummer. */
const ETIKETTER = [
  "Artikelnummer",
  "Artikelnr",
  "Art\\.nr",
  "Modellnummer",
  "Modellreferens",
  "Referens",
].join("|");

/**
 * Leverantörskodens form: tre tecken, bindestreck, tre till fjorton tecken
 * (`Z00-777`, `Z90-222V00BK`, `Z30-666V00BN`), och ibland ett längre numeriskt
 * prefix (`Z00110-555BG`). Två koder kan stå på samma rad, åtskilda med
 * snedstreck.
 *
 * ☠️ `FP-` ÄR VÅRT EGET, och undantaget är inte kosmetiskt.
 *
 * Husets SKU:er börjar alltid `FP-` (`lib/import/sku.ts`), och raden
 * `Artikelnummer: FP-julgran-210-pynt` är en LEGITIM rad på vår egen sida —
 * kundens referens vid en reklamation. Ingen leverantörskod ser ut så: Aosoms
 * är `83D-188V00WT`, `D30-371`, `B71-089V00BK`.
 *
 * Utan undantaget gjorde formen två fel, ett i varje riktning:
 *
 *   1. **Saxen kunde radera vår egen rad.** En kort SKU som `FP-sideboard`
 *      matchar `[0-9A-Z]{2,7}-[0-9A-Za-z]{2,14}` rakt av och hade klippts bort.
 *      Bara svansens längd räddade de flesta — ren tur, inte konstruktion.
 *   2. **Larmet drunknade i sitt eget brus.** `kodIText` flaggade 20 sidor
 *      2026-09-03 vars enda "kod" var deras egen FP-SKU. Ett larm där tre av
 *      fyra är falska slutar läsas, och då är även det äkta borta — samma
 *      argument som mot att varna vid 48 h på token-förnyelsen.
 */
const KOD = "(?!FP-)[0-9A-Z]{2,7}-[0-9A-Za-z]{2,14}";
const KODER = `${KOD}(?:\\s*/\\s*${KOD})*`;

/**
 * Dekoration före etiketten — bock, punkt, streck, hårt mellanslag.
 *
 * ☠️ DET HÄR ÄR RÅIMPORTENS FORM, och utan ledet var detektorn blind för den.
 * Aosoms egna specrader kommer in som `<li><p>✔ Farbe: Mehrfarbig</p></li>`, så
 * en OPOLERAD rad bär `<li><p>✔ Artikelnummer: …</p></li>`. Uppmätt 2026-09-03:
 * `hittaKodrader` gav **0** träffar på den raden och **1** på samma rad utan
 * bocken — alltså gav svepet ett falskt friskintyg för hela katalogen ("5 485
 * lästa, 0 träffar") medan koden stod kvar i ett utkast. Samma klass av bugg som
 * det saknade `</span>?` en runda tidigare: detektorn såg en form och missade
 * grannformen.
 *
 * Klassen är MEDVETET smal — bara skiljetecken och blanksteg, aldrig bokstäver
 * eller siffror. Ett `.{0,4}` hade släppt in "Se Artikelnummer:" och gjort saxen
 * till en gissning, och en sax som tar för mycket är farligare än läckan.
 */
const DEKOR =
  "(?:[\\s\\u00a0\\u2022\\u00b7\\u2023\\u25aa\\u25cf\\u25e6\\u2013\\u2014\\-*\\u2713\\u2714\\u2611\\u2705]"
  + "|&nbsp;|&#160;|&bull;)*";

/**
 * En hel spec-rad som bara innehåller etikett + leverantörskod.
 *
 * `<li><p>` är Wix normaliserade form — Wix slår in varje `<li>` i ett `<p>` och
 * strippar radbrytningar när HTML:en sparas, så en regex skriven mot källkoden
 * du skickade in matchar inte det som faktiskt ligger där.
 *
 * ⚠️ Formen är `(?:DEKOR<span…>)?DEKOR`, inte `DEKOR(?:<span…>)?DEKOR`. Den
 * andra formen ser naturligare ut och kostar KVADRATISKT på en dekorationssvans
 * som ändå inte matchar: två stjärnkvantifierade grupper i rad kan dela svansen
 * på n+1 sätt, och varje delning provas. Uppmätt i V8 2026-09-03, samma indata:
 *
 *     tecken      förankrad     tvetydig
 *      1 000         0 ms         13 ms
 *      4 000         1 ms        219 ms
 *     16 000         1 ms      3 136 ms
 *     64 000         3 ms     49 705 ms
 *
 * Här förankras den första DEKOR:en av ett OBLIGATORISKT `<span`, så uppdelningen
 * är entydig och kostnaden linjär. ⚠️ Det är alltså INTE den exponentiella ReDoS
 * ett `X* Y? X*` ser ut att vara vid en snabb blick — den kräver nästlade
 * kvantifierare. En specrad blir heller aldrig 64 000 tecken dekoration. Formen
 * är vald för att den är entydig och gratis, inte för att den avvärjer ett
 * angrepp; talen står här för att nästa läsare inte ska behöva mäta om det.
 */
export const LEVERANTORSKOD_RAD = new RegExp(
  `<li><p>(?:${DEKOR}<span style="font-weight: ?\\d+">)?${DEKOR}`
    + `(?:${ETIKETTER})\\s*:?\\s*(?:</span>)?\\s*${KODER}\\s*</p></li>`,
  "g",
);

/** Fristående kodförekomst i löpande text (rubrik, slug, meta) — bara för rapport. */
export const LEVERANTORSKOD_TEXT = new RegExp(
  `(?:${ETIKETTER})\\s*:?\\s*(?:</span>)?\\s*(${KODER})`,
  "g",
);

/** Raderna som ska bort. Tom lista = sidan är ren. */
export function hittaKodrader(html: string): string[] {
  return html.match(LEVERANTORSKOD_RAD) ?? [];
}

/** Samma sax som `hittaKodrader` beskriver — tar bort raderna, rör inget annat. */
export function taBortKodrader(html: string): string {
  return html.replace(LEVERANTORSKOD_RAD, "");
}

/**
 * Bär texten fortfarande en leverantörskod någonstans?
 *
 * Används som KVITTO efter en skrivning, inte som detektor före: ett svar utan
 * fel är inget bevis på att skrivningen tog (huset har brunnit på det fyra
 * gånger). Kollar hela fältet, inte bara `<li>`-formen, så en kod som flyttat
 * in i brödtexten också syns.
 */
export function barKod(...falt: (string | undefined | null)[]): boolean {
  for (const f of falt) {
    if (!f) continue;
    LEVERANTORSKOD_TEXT.lastIndex = 0;
    if (LEVERANTORSKOD_TEXT.test(f)) return true;
  }
  return false;
}
