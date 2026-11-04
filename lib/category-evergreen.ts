// lib/category-evergreen.ts
// Mönster för uppgifter i kategoritexterna som beror på SORTIMENTET och därför
// blir fel när sortimentet ändras. Används av lib/category-evergreen.test.ts.
//
// BAKGRUND (2026-11-04): nattens poleringsrunda publicerade åtta nya sidor, bland
// dem två LED-badrumsspeglar, en LED-helkroppsspegel, ett gungdjur och ett
// trädgårdsskåp i metall. Fem sökordskategorier bar då redan uppgifter som slutat
// stämma: "fyra av speglarna har Bluetooth och klocka", "ett av dem med LED", "två
// åkhästar, en på hjul och en elektrisk", "upp till 100 × 80 cm", "de högsta 180 cm",
// "bodar från 1,1 till 12,4 m²", "trädgårdsskåp i trä". Sortimentet ändras vid VARJE
// poleringsrunda, och sidorna cachas i sex timmar, så en räknad uppgift är fel
// någon gång under dagen den publiceras och sedan för alltid.
//
// Samma dag visade en avstämning mot butikens egen lista (/api/lista?k=kategori/<slug>)
// två fel till i de omskrivna texterna: "åldern står i produktnamnet" stämde för
// 18 av 24 gunghästar, och "förrådstält" fanns inte längre i Redskapsbodar & förråd
// (tältet ligger i Garagetält). Därför finns NAMN_ANGER nedan, och därför skrivs
// en kategoritext aldrig ur minnet: kontrollera den mot listan.
//
// REGEL: en kategoritext beskriver VARUTYPEN (vad den är, vad man ska tänka på vid
// köp, hur den används) och låter kunden se sortimentet i rutnätet. Den
//   - räknar inte produkterna ("fyra av speglarna", "två åkhästar", "tre stycken"),
//   - anger inte sortimentets ytterlägen eller spann ("upp till", "från–till",
//     "120 till 180 cm", "de högsta", "som störst"),
//   - rangordnar inte, och säger inte `alla`, `ingen`, `flera av dem`, `många`,
//     `vissa` eller `de flesta` om dem,
//   - nämner ingen enskild produkt med mått ("ett förrådstält på 13,4 m²"),
//   - påstår inte vad produktnamnen innehåller ("står i produktnamnet").
// Produkttyper får nämnas som exempel, med `till exempel` eller `bland annat`, så
// att listan inte låter fullständig. Ett tal får stå när det är varutypens EGET
// villkor: en IP-klass, en kelvinskala, 499 kr för fri frakt. Skriv "kontrollera
// åldern i beskrivningen" hellre än "åldern står i beskrivningen".
//
// Mönstren speglas i tools/polish-gates/gate-kategori.py (på main), så att grinden
// fäller samma saker innan texten når butiken. Ändra bara båda tillsammans, och låt
// SJALVTEST bära minst ett fall per mönster: ett mönster som aldrig kan träffa är
// ingen spärr (samma fälla som alt-grinden som fångade sitt eget fel, 2026-10-31).
//
// Svenska bokstäver ligger utanför \w, så `\b` duger inte. Gränserna nedan är
// uttryckliga.

const L0 = "(?<![\\p{L}\\p{N}_])";
const L1 = "(?![\\p{L}\\p{N}_])";
const RAKNE = "en|ett|två|tre|fyra|fem|sex|sju|åtta|nio|tio|elva|tolv|tretton|fjorton|femton|sexton|sjutton|arton|nitton|tjugo|\\d+";
const RAKNE_FLERA = "två|tre|fyra|fem|sex|sju|åtta|nio|tio|elva|tolv";
const ENHET = "cm|mm|m²|m2|m|kg|g|l|liter|W|V|K|månader|mån|år|delar|st|stycken|%|timmar|minuter|dagar";
const KVANT = "alla|samtliga|flera|många|några|vissa|de flesta";
const VERB =
  "är|har|kan|passar|står|finns|saknar|levereras|anger|klarar|ingår|fungerar|tål|hänger|väger|går|bär|kommer|ligger|sitter|följer|visar|behöver|erbjuder|ger";

export type EvergreenMonster = {
  /** Namn som visas i felmeddelandet och står i baslinjen. */
  namn: string;
  /** Vad mönstret fångar, och varför det blir fel. */
  skal: string;
  re: RegExp;
};

export const EVERGREEN_MONSTER: EvergreenMonster[] = [
  {
    namn: "ANTAL_AV",
    skal: "räknar produkter: 'fyra av speglarna', 'ett av dem', 'två av bodarna'",
    re: new RegExp(`${L0}(?:${RAKNE})\\s+av\\s+\\p{L}+`, "iu"),
  },
  {
    namn: "KVANT_AV",
    skal: "säger hur stor del av sortimentet det gäller: 'många av växterna', 'flera av dem', 'hälften av modellerna'",
    re: new RegExp(`${L0}(?:(?:${KVANT}|hälften)\\s+av\\s+\\p{L}+|en\\s+del\\s+av\\s+(?:dem|de|våra)${L1})`, "iu"),
  },
  {
    namn: "KVANT_SUBJEKT",
    skal: "'flera har', 'många står', 'de flesta går': ett påstående om sortimentet utan siffra",
    re: new RegExp(`(?<!hur\\s)(?<!för\\s)${L0}(?:${KVANT})\\s+(?:${VERB})${L1}`, "iu"),
  },
  {
    namn: "KVANT_SUBSTANTIV",
    skal: "'alla modeller', 'samtliga produkter': en helhet som slutar stämma när något tillkommer",
    re: new RegExp(
      `${L0}(?:alla|samtliga|flera|många|några|vissa)\\s+(?:våra\\s+|dessa\\s+)?(?:modeller|produkter|artiklar)${L1}`,
      "iu"
    ),
  },
  {
    namn: "INGEN_AV",
    skal: "'ingen av dem', 'inga av': ett nekande om sortimentet",
    re: new RegExp(`${L0}(?:ingen|inga)\\s+av\\s+\\p{L}+`, "iu"),
  },
  {
    namn: "UPP_TILL",
    skal: "sortimentets tak: 'upp till 100 × 80 cm', 'upp till 180 cm'",
    re: new RegExp(`${L0}upp\\s+till\\s+\\d[\\d.,]*`, "iu"),
  },
  {
    namn: "FRAN_TILL",
    skal: "sortimentets spann: 'från 1,1 till 12,4 m²', 'från 25 upp till 60 kg'",
    re: new RegExp(`${L0}från\\s+\\d[\\d\\s.,]*\\s*(?:${ENHET})?\\s*(?:upp\\s+)?(?:till|–|-)\\s*\\d[\\d.,]*`, "iu"),
  },
  {
    namn: "INTERVALL",
    skal: "sortimentets spann som intervall: '120 till 180 cm', '12–36 månader', '75–90 cm'",
    re: new RegExp(`\\d[\\d.,]*\\s*(?:–|-|till)\\s*\\d[\\d.,]*\\s*(?:${ENHET})${L1}`, "iu"),
  },
  {
    namn: "SUPERLATIV",
    skal: "sortimentets ytterlägen: 'de högsta', 'den största modellen', 'som störst'",
    re: new RegExp(
      `${L0}(?:(?:de|den|det)\\s+(?:högsta|största|längsta|tyngsta|bredaste|smalaste|lättaste|billigaste|dyraste)|som\\s+(?:störst|högst|längst|minst|lägst))${L1}`,
      "iu"
    ),
  },
  {
    namn: "FINNS_ANTAL",
    skal: "'Här finns också två åkhästar', 'finns i två längder': en räkning av vad som finns",
    re: new RegExp(
      `${L0}(?:finns|hittar du|samlar vi|har vi|erbjuder vi)\\s+(?:(?:också|även|här|i|för|bland annat)\\s+){0,2}(?:${RAKNE_FLERA})\\s+\\p{L}+`,
      "iu"
    ),
  },
  {
    namn: "STYCKEN",
    skal: "'tre stycken', '4 st': en räkning",
    re: new RegExp(`${L0}(?:${RAKNE})\\s+(?:stycken|st)${L1}`, "iu"),
  },
  {
    namn: "STORLEK_PA_ENSKILD",
    skal: "'ett förrådstält på 13,4 m²', 'boden på 1,1 m²': en enskild produkt med mått",
    re: new RegExp(
      `${L0}(?:(?:ett|en)\\s+(?:\\p{L}+\\s+){0,2}?\\p{L}+|\\p{L}+(?:n|en|et|na|erna|arna))\\s+på\\s+\\d[\\d.,]*\\s*(?:cm|mm|m²|m2|m|kg|liter|l|W)${L1}`,
      "iu"
    ),
  },
  {
    namn: "NAMN_ANGER",
    skal: "'står i produktnamnet': produktnamnen skrivs om vid varje runda och bär inte alltid uppgiften",
    re: new RegExp(
      `${L0}(?:står|finns|anges|syns|framgår)\\s+(?:(?:oftast|ofta|alltid|redan)\\s+){0,2}(?:i|av|på)\\s+(?:produkt)?(?:namnet|titeln)${L1}`,
      "iu"
    ),
  },
];

export type EvergreenTraff = {
  namn: string;
  skal: string;
  /** Den träffade biten, och en bit text på var sida av den. */
  traff: string;
  kontext: string;
};

/**
 * De mönster som träffar texten (första träffen per mönster), i listans ordning.
 *
 * `undantag` är exakta fraser ur texten (se TILLATNA): en träff som ligger helt
 * inne i en sådan fras räknas inte. Fraserna byts mot ett tecken som varken är
 * bokstav eller siffra, så att texten runt om inte ändrar vad som träffar.
 */
export function evergreenDetaljer(text: string, undantag: readonly string[] = []): EvergreenTraff[] {
  let t = text;
  for (const fras of undantag) t = t.split(fras).join("·".repeat(fras.length));
  const ut: EvergreenTraff[] = [];
  for (const m of EVERGREEN_MONSTER) {
    const r = m.re.exec(t);
    if (!r) continue;
    const a = Math.max(0, r.index - 30);
    const b = r.index + r[0].length + 30;
    ut.push({ namn: m.namn, skal: m.skal, traff: r[0], kontext: text.slice(a, b) });
  }
  return ut;
}

/** Namnen på de mönster som träffar texten, i listans ordning. */
export function evergreenTraffar(text: string, undantag: readonly string[] = []): string[] {
  return evergreenDetaljer(text, undantag).map((x) => x.namn);
}

/**
 * Tillåtna fraser: meningar som träffar ett mönster utan att säga något om
 * sortimentet. Håll listan kort. Varje post ska ha ett skäl, och testet fäller
 * en post vars fras inte längre står i kategorins text eller inte behövs.
 * Allt som faktiskt beror på sortimentet hör hemma i BASLINJEN, inte här.
 */
export const TILLATNA: { slug: string; fras: string; skal: string }[] = [
  {
    slug: "bil-cykel",
    fras: "Lasta det tyngsta längst ner",
    skal: "råd om kundens egen last, ingen jämförelse inom sortimentet",
  },
  {
    slug: "hundgrindar",
    fras: "det smalaste stället",
    skal: "råd om hur kunden mäter sin egen öppning",
  },
  {
    slug: "hushallsapparater",
    fras: "det största föremålet",
    skal: "råd om hur kunden väljer storlek efter sitt eget föremål",
  },
];

/**
 * Ett fall per mönster som MÅSTE träffa, och meningar som är sanna för varutypen
 * och INTE får träffa. Testet kör båda.
 */
export const SJALVTEST: { traffar: Record<string, string>; rent: string[] } = {
  traffar: {
    ANTAL_AV: "Fyra av speglarna har också Bluetooth och klocka.",
    KVANT_AV: "Många av växterna passar både inne och ute.",
    KVANT_SUBJEKT: "Flera har justerbara hyllplan, och de flesta går att låsa.",
    KVANT_SUBSTANTIV: "Samtliga modeller levereras med bruksanvisning.",
    INGEN_AV: "Ingen av dem har golv.",
    UPP_TILL: "Storlekarna går upp till 100 × 80 cm.",
    FRAN_TILL: "Bodar i galvad plåt från 1,1 till 12,4 m².",
    INTERVALL: "Helkroppsspeglarna är 120 till 180 cm höga.",
    SUPERLATIV: "Konstväxter, de högsta 180 cm, och häck på rulle.",
    FINNS_ANTAL: "Här finns också två åkhästar i plysch, en på hjul och en elektrisk.",
    STYCKEN: "Spegeln levereras med tre stycken fästen.",
    STORLEK_PA_ENSKILD: "Här finns ett förrådstält på 13,4 m² och bodar i plåt.",
    NAMN_ANGER: "Åldern står i produktnamnet, så du hittar rätt modell.",
  },
  rent: [
    "Ljusets färg anges i kelvin: runt 3 000 K ger ett varmt sken, runt 6 000 K liknar dagsljus.",
    "IP44 tål vattenstänk, men placera ändå spegeln så att duschen inte sprutar direkt på den.",
    "Du handlar tryggt med Klarna, får fri frakt över 499 kr och har 30 dagars öppet köp.",
    "Åldern och maxvikten ska du kontrollera i beskrivningen och följa.",
    "Alla barn behöver en vuxen som har uppsikt när de gungar.",
    "Det finns skjutdörrar som inte behöver någon plats framför boden.",
    "Ingen skötsel behövs, och växterna behöver varken vattnas eller beskäras.",
    "En klassisk gunghäst kräver att barnet kan hålla balansen själv.",
    "Ställ spegeln där ljuset kommer in från sidan, till exempel vid ett fönster.",
    "Hur många kan spela med pokersetet?",
    "Domkraften lyfter bara en del av bilen, så välj en som klarar bilens vikt.",
    "Soffborden med LED har en ljuslist i flera färger som styrs med fjärrkontroll.",
    "Här samlar vi leksakskök för barn från tre år, i trä och plast.",
    "Produktnamnet säger vad varan är, och beskrivningen visar måtten.",
  ],
};
