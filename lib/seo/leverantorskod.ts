// Leverantörskoder i publicerad produkttext — detektor och sax.
//
// ☠️ VARFÖR DEN FINNS
//
// dealproffsen.se publicerar Aosoms artikelnummer som `sku`/`mpn` i sin JSON-LD.
// Står samma sträng i vår produkttext går våra sidor att joina mot deras — och
// därmed mot vad vi betalar. Numret får därför aldrig nå en publicerad sida.
//
// Läckan har hittats tre gånger: 33 produktKORT (bilder) 2026-09-02, fyra sidor
// samma dag, och 51 sidor till 2026-09-03 när svepets regex rättats. Varje gång
// har fyndet gjorts av ett svep, aldrig av en spärr. Den här filen är spärren:
// en testad detektor som `seo-kod-repair` kör över hela katalogen.
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

/**
 * Etiketter som i huset har burit ett leverantörsnummer.
 *
 * ☠️ LÄNGST FÖRST. Regex-alternation tar det FÖRSTA alternativ som matchar, så
 * `Referens` före `Artikelreferens` hade matchat de nio sista tecknen och lämnat
 * `Artikel` utanför — och då stämmer inte `<li><p>` omedelbart före etiketten,
 * så hela raden går fri. Fyra publicerade sidor bar `Artikelreferens:` av precis
 * det skälet (2026-09-03).
 */
const ETIKETTER = [
  "Artikelreferens",
  "Artikelnummer",
  "Modellreferens",
  "Modellnummer",
  "Artikelnr",
  "Art\\.nr",
  "Referens",
].join("|");

/**
 * Ingen etikett får matcha inne i ett längre ord. Utan den här gränsen fångade
 * `Referens` slutet av `Artikelreferens` — vilket råkade vara nyttigt i
 * rapporten men gjorde saxen oförutsägbar: den träffade i löptexten och missade
 * som rad. En etikett som ska klippas ska stå i listan, inte hittas av misstag.
 */
const ORDSTART = "(?<![A-Za-zÅÄÖåäö])";

/**
 * Leverantörskodens form: tre tecken, bindestreck, tre till fjorton tecken
 * (`Z00-777`, `Z90-222V00BK`, `Z30-666V00BN`), och ibland ett längre numeriskt
 * prefix (`Z00110-555BG`). Två koder kan stå på samma rad, åtskilda med
 * snedstreck.
 *
 * ☠️ BÅDA SKIFTLÄGENA. Prefixet var `[0-9A-Z]` fram till 2026-09-03 — bara
 * VERSALER — och regexen saknade `i`. Formen var "mätt, inte gissad", men mätt
 * på ett urval där varje kod råkade vara versal. Nitton publicerade sidor bar
 * samtidigt en GEMEN kod (`d30-670v00yl`, `84h-070v00cr`, `a20-287v00cg`), och
 * svepet rapporterade `medKod: 0` över hela katalogen medan de låg live.
 * En spärr mot husets farligaste läcka som är blind för halva teckenrymden är
 * värre än ingen spärr: den ger ett grönt kvitto på en läcka som pågår.
 *
 * ☠️ MEN GEMENER ÖPPNAR EN NY RISK, och den är saxens värsta: ett vanligt
 * bindestrecksord. `Referens: bruks-anvisning` hade matchat `[0-9A-Za-z]{2,7}-…`
 * och raden hade klippts bort. Därför kräver båda halvorna nu **minst en
 * siffra** — det gör varje äkta kod träffad (alla nio uppmätta formerna har
 * siffror i båda halvorna) och varje rent bokstavsord omöjligt.
 */
/** Alfanumerisk grupp på 2–`max` tecken som innehåller MINST EN SIFFRA. */
const alnumMedSiffra = (max: number) =>
  `(?=[0-9A-Za-z]{2,${max}}(?![0-9A-Za-z]))[A-Za-z]*[0-9][0-9A-Za-z]*`;
const KOD = `${alnumMedSiffra(7)}-${alnumMedSiffra(14)}`;
/**
 * En eller flera koder på samma rad. Mellan dem kan stå en kort parentes med
 * färgnamnet — `370-281V90GN (grön) / 370-281V90RD (röd)` låg så på två
 * publicerade sidor.
 */
const PARENTES = "(?:\\s*\\([^)]{1,20}\\))?";
const KODER = `${KOD}${PARENTES}(?:\\s*/\\s*${KOD}${PARENTES})*`;

/**
 * En hel spec-rad som bara innehåller etikett + leverantörskod.
 *
 * `<li><p>` är Wix normaliserade form — Wix slår in varje `<li>` i ett `<p>` och
 * strippar radbrytningar när HTML:en sparas, så en regex skriven mot källkoden
 * du skickade in matchar inte det som faktiskt ligger där.
 */
export const LEVERANTORSKOD_RAD = new RegExp(
  `<li><p>(?:<span style="font-weight: ?\\d+">)?\\s*${ORDSTART}(?:${ETIKETTER})\\s*:?\\s*(?:</span>)?\\s*${KODER}\\s*</p></li>`,
  "gi",
);

/** Fristående kodförekomst i löpande text (rubrik, slug, meta) — bara för rapport. */
export const LEVERANTORSKOD_TEXT = new RegExp(
  `${ORDSTART}(?:${ETIKETTER})\\s*:?\\s*(?:</span>)?\\s*(${KODER})`,
  "gi",
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
