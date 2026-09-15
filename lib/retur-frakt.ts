// lib/retur-frakt.ts
//
// EN KÄLLA för gränsen mellan paketgods och skrymmande gods, och för vad en
// skrymmande retur kostar kunden.
//
// VARFÖR SIFFRAN MÅSTE FINNAS. 2 kap. 2 § första stycket 11 distansavtalslagen
// kräver att konsumenten före köpet får veta
//
//   "den skyldighet konsumenten vid utövande av ångerrätten kan ha att på egen
//    bekostnad återsända varan samt, vid distansavtal, KOSTNADEN för att
//    återsända varan om den är sådan att den inte kan återsändas med post"
//
// Två olika krav alltså: för paketgods räcker det att skyldigheten står utskriven
// (den står på sex ytor sedan tidigare), men för det som inte kan gå som paket
// ska BELOPPET stå före köp. Gör det inte det slår 2 kap. 13 § första stycket
// till: kostnaden "ska bäras av näringsidkaren" om vi "inte har gett konsumenten
// information enligt 2 § första stycket 11". Utan den här modulen betalade vi
// alltså returfrakten för var femte produkt — inte som ett affärsbeslut, utan
// som påföljd.
//
// VI FÅR INTE ERBJUDA OSS ATT HÄMTA. 2 kap. 13 § andra stycket: har
// näringsidkaren "erbjudit sig att hämta varan" gäller inte första stycket, och
// då "ska näringsidkaren på egen bekostnad hämta varan". Avtryckaren är
// ERBJUDANDET, inte hämtningen — bokar kunden själv en hemhämtning händer
// ingenting, men skriver vi "vi bokar åt dig" flyttas hela notan till oss, och
// 1 kap. 4 § gör varje villkor som säger annat utan verkan. Texten nedan säger
// därför vad det kostar KUNDEN att skicka tillbaka, aldrig att vi ordnar det.
// Ett prov i retur-frakt.test.ts håller den gränsen.
//
// GRÄNSERNA — mätta, inte gissade (postnord.se, läst 2026-09-11):
//   • Privatperson skickar inrikespaket upp till 20 kg. Inte 31,5 kg — det är
//     taket för FÖRETAGSpaket, och att räkna med det hade klassat varor mellan
//     20 och 31,5 kg som "postbara" när kunden inte kan posta dem. Fel åt exakt
//     det håll som skapar ansvaret ovan.
//   • Skrymmandeavgift tillkommer över 120 cm längsta sida, och paketet taxeras
//     som skrymmande när längd + omkrets överstiger 200 cm.
//   • Postpaket inrikes avvecklades 4 maj 2026 — därför namnger texten nedan
//     ingen transportör. Ett utbud vi inte råder över ska inte stå i ett
//     bindande förköpsbesked.
//
// BELOPPET. Konsumentpriser för styckegods/pall inrikes, dörr–dörr med
// bakgavellyft vid hämtning (privatperson saknar lastkaj):
//   • Kolligo, indikativa nivåer våren 2026: halvpall 295–895 kr och EUR-pall
//     395–1 195 kr exkl. moms, bakgavellyft 200–400 kr per stopp.
//   • Offerta: inrikes 30–80 mil, dörr–dörr med bakgavellyft, 1 200–1 900 kr.
// Med moms och ett lyft i hämtänden landar spannet på ca 700–2 400 kr. Det är
// ett SPANN och inte ett pris, för kostnaden styrs av sträckan — och lagen
// kräver en uppriktig uppgift, inte en exakt. Beloppet är dessutom inte något vi
// fakturerar: kunden bokar och betalar sin egen transportör, så siffran är en
// upplysning om vad hen kommer att få betala.
//
// SIFFRAN ÄR FÄRSKVARA. Den står i ett bindande förköpsbesked. Ändras
// transportörernas priser ska KALLA_DATUM nedan följa med — annars påstår vi
// något om 2026 års marknad långt in i 2027.

/** Tyngsta inrikespaket en privatperson kan skicka. */
export const PAKET_MAX_KG = 20;

/** Längsta sida innan paketet inte längre går som vanligt paket. */
export const PAKET_MAX_SIDA_CM = 120;

/** Var uppgifterna kommer ifrån, och när de lästes. */
export const KALLA = "PostNord, Kolligo och Offerta";
export const KALLA_DATUM = "2026-09-11";

/**
 * Är varan sådan att den inte kan återsändas med post?
 *
 * BÅDA MÅTTEN MÅSTE VARA KÄNDA för att svaret ska bli nej. Saknas ettdera går
 * varan inte att friskriva: en femkilosvara kan vara en tre meter lång
 * gardinstång, och en 40 cm kartong kan väga 35 kg. Att svara "paketgods" på
 * halva uppgiften vore en gissning i ett bindande förköpsbesked.
 *
 * Det är också den säkra riktningen enligt 2 kap. 13 § första stycket: att
 * upplysa om en kostnad som inte fanns är aldrig ett lagbrott, medan att låta
 * bli att upplysa flyttar kostnaden till oss. Priset för strängheten är att en
 * produkt utan mått får en upplysning den kanske inte behöver — därför ska
 * måtten fyllas i, inte regeln mjukas upp.
 *
 * Noll, negativa tal, NaN och Infinity räknas alla som okänt.
 */
export function arSkrymmande(matt: {
  langstaSidaCm?: number | null;
  viktKg?: number | null;
}): boolean {
  const kant = (v: number | null | undefined): v is number =>
    typeof v === "number" && Number.isFinite(v) && v > 0;
  if (!kant(matt.langstaSidaCm) || !kant(matt.viktKg)) return true;
  return matt.langstaSidaCm > PAKET_MAX_SIDA_CM || matt.viktKg > PAKET_MAX_KG;
}

/** Regeln, utskriven för kunden. */
export const SKRYMMANDE_REGEL =
  `En vara räknas som skrymmande när den är längre än ${PAKET_MAX_SIDA_CM} cm eller väger mer än ${PAKET_MAX_KG} kg. Då kan den inte skickas som ett vanligt paket, utan måste gå som styckegods.`;

/**
 * Kostnadsupplysningen enligt 2 kap. 2 § första stycket 11.
 *
 * Villkorad i stället för produktspecifik: meningen är sann för hela katalogen
 * och kräver ingen märkning per produkt. Den dagen varje produkt bär sitt mått
 * kan beloppet bli exakt — tills dess är det här upplysningen, och den är
 * oändligt mycket bättre än tystnad.
 */
export const SKRYMMANDE_RETURKOSTNAD =
  `${SKRYMMANDE_REGEL} Returen bokar och betalar du själv hos valfri transportör som tar emot varans storlek och vikt. Räkna med ungefär 700–2 400 kr inklusive moms — vad det landar på styrs framför allt av sträckan och av varans mått och vikt.`;

/** Kort variant för produktsidan och mejl, där en hel förklaring inte får plats. */
export const SKRYMMANDE_RETURKOSTNAD_KORT =
  `Är varan längre än ${PAKET_MAX_SIDA_CM} cm eller tyngre än ${PAKET_MAX_KG} kg kan den inte returneras som paket. Du bokar och betalar då styckegodstransporten själv, ungefär 700–2 400 kr inklusive moms beroende på sträcka och storlek.`;
