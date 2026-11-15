// Mjuka bindestreck (U+00AD) vid ordfogen i långa kategorinamn i menyn.
//
// VARFÖR. Datorns meny har spalter om 172 px, och namnet får 130 px bredvid
// bilden. "Trädgårdsanläggning" och "Verkstadsutrustning" fick inte plats på en
// rad och bröts mitt i ordet ("Verkstadsutrustnin" / "g"), mätt 2026-11-15 i
// 960, 1280 och 1440 px. Namnet har overflow-wrap:anywhere, som bryter var som
// helst när ordet saknar en annan brytpunkt. Ett mjukt bindestreck vid fogen är
// en sådan brytpunkt: "Verkstads-" / "utrustning". Strecket syns bara när raden
// bryts just där, skärmläsare läser ordet som vanligt, och overflow-wrap står
// kvar som reserv för ord utan känd fog.
//
// HUR. Bara ord om minst 13 tecken. Fogen läggs före ordets sista led, ur
// listan EFTERLEDER (den längsta som passar), och bara om förleden har minst
// tre tecken. En fog per ord. Ett ord som redan har ett mjukt bindestreck
// lämnas orört, så att funktionen kan köras två gånger.
//
// Inga bakåtblickande uttryck: modulen går till webbläsaren med menyerna, och
// Safari före 16.4 kan inte läsa dem (se lib/stycken.ts).

/** Det mjuka bindestrecket. Syns bara där raden bryts. */
export const MJUKT_BINDESTRECK = "­";

/** Kortare ord än så får plats i menyns spalt och lämnas orörda. */
export const MINSTA_ORD = 13;

/** Förleden ska ha minst så många tecken, så att ingen rad börjar eller slutar med två bokstäver. */
export const MINSTA_FORLED = 3;

/**
 * Sista leden i menyns sammansatta kategorinamn, med gemener. De flesta står i
 * menyn i dag (2026-11-15); några vanliga till finns med så att en ny kategori
 * med samma efterled bryts rätt från början. Den längsta som passar vinner, så
 * "Hörnskrivbord" blir "Hörn-skrivbord" och inte "Hörnskriv-bord", fast
 * både "skrivbord" och "bord" passar.
 */
export const EFTERLEDER: readonly string[] = [
  "anläggning", "apparater", "befinnande", "belysning", "bänkar", "bodar", "bord", "burar",
  "cyklar", "dekor", "dekoration", "dukar", "fåtöljer", "förvaring", "gardiner",
  "hyllor", "inredning", "kläder", "laddning", "leksaker", "lådor", "maskiner",
  "mattor", "möbler", "organisering", "renovering", "säckar", "skötsel",
  "skrivbord", "speglar", "stolar", "tillbehör", "utrustning", "vagnar", "värmare",
];

const LANGST_FORST = [...EFTERLEDER].sort((a, b) => b.length - a.length);

/** Ett ord med fogen utsatt, eller ordet som det var. */
function fogat(ord: string): string {
  if (ord.length < MINSTA_ORD || ord.includes(MJUKT_BINDESTRECK)) return ord;
  for (const led of LANGST_FORST) {
    const fog = ord.length - led.length;
    if (fog < MINSTA_FORLED) continue;
    if (ord.slice(fog).toLowerCase() === led) return ord.slice(0, fog) + MJUKT_BINDESTRECK + ord.slice(fog);
  }
  return ord;
}

/**
 * Kategorinamnet med mjuka bindestreck i de långa sammansatta orden.
 * Används bara i synlig text, aldrig i aria-label, title eller adresser.
 */
export function mjukaBindestreck(namn: string): string {
  return namn.replace(/\S+/g, (ord) => fogat(ord));
}
