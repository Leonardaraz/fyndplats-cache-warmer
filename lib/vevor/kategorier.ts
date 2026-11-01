// VEVOR-varor → butikens kategorier. Ren modul.
//
// Leonards ja 2026-10-31 på förslaget "Kategoriträd för VEVOR" (13 avdelningar,
// 51 nya underkategorier, fem beslut). Reglerna översätter VEVOR:s egen
// kategori (brödsmulan på produktsidan, de tre första nivåerna) och, där
// VEVOR:s kategori blandar olika varor, produktnamnet till en avdelning och en
// underkategori hos oss. Första regel som passar vinner.
//
// En regel är [sökväg, namnmönster eller null, mål]:
//
//   sökväg   VEVOR:s kategorinamn med ">" emellan, till exempel
//            "Verktyg>Elverktyg". Alla nivåer utom den sista ska vara lika;
//            den sista kan vara början av VEVOR:s namn ("Bad>Badrumssäkerhet"
//            passar "Badrumssäkerhet och …"). En sökväg som slutar med ">"
//            kräver nivån exakt. Tom sökväg passar alla varor.
//   namn     ett mönster på varans namn, eller null.
//   mål      "Avdelning/Underkategori", VAPENSKAP eller SPRITAPPARAT.
//
// Sex egenskaper som inte ska tas bort:
//
// 1. ☠️ Vapenskåpen får ingen kategori och publiceras inte (Leonards beslut 3).
//    Den som förvarar vapen behöver i regel ett skåp godkänt enligt SS 3492, och
//    VEVOR:s skåp är inte visade godkända. `klassa` svarar `vapenskap`, och
//    importen och verktyget sätter `vevorGranskning.vapenskap`, som
//    publiceringsspärren läser (lib/publicering.ts).
// 2. ☠️ Varje mål finns i TRADET, och testerna fäller ett mål som inte gör
//    det. Ett felstavat namn hade annars fått importen att leta efter en
//    kategori som inte finns.
// 3. Avdelningen "Verktyg & Maskiner" hette "Verktyg & Fordon" fram till
//    butikens meny-PR, och Bil & släp och Elbilsladdning & solenergi låg under
//    den. NAMNBYTEN och FLYTTADE låter uppslaget i Wix godta båda lägena, så att
//    importen och verktyget fungerar före och efter natten då Wix ändras.
// 4. Reglerna mättes mot alla VEVOR-artiklar i lager 2026-10-31 (12 000): 1
//    blev utan kategori och 61 vapenskåp. Stickproven per kategori ledde till
//    ett trettiotal rättade regler (617 artiklar flyttade), och testerna under
//    "auditens fynd" låser dem. Mätningen står i CLAUDE.md, "VEVOR:
//    kategorierna".
// 5. ☠️ VEVOR:s namn räknar upp vad varan passar till, så ett ord långt in i
//    namnet säger inte vad varan är. En bilramp "för rullstol och barnvagn"
//    hamnade under Baby & Småbarn och en husdomkraft ("stolpe för") under
//    avspärrningarna. Namnregler som gäller alla sökvägar och kan träffas så
//    tittar bara på huvudnamnet, före första kommatecknet (`^[^,]*`), eller på
//    ord som bara avspärrningar bär.
// 6. ☠️ Spritapparaterna får ingen kategori och publiceras inte. Alkohollagen
//    (2010:1622) 2 kap. 1 § andra stycket förbjuder att överlåta en apparat
//    "som uppenbarligen är ägnad för tillverkning av sprit" (11 kap. 2 §: böter
//    eller fängelse). Spärren tar destillatorerna som VEVOR säljer för alkohol
//    (whisky, brandy, moonshine, thumper, "Vinframställningsset") och alla
//    pannor i VEVOR:s Bryggutrustning, också de som säljs för eteriska oljor
//    och vatten: en panna på 12–70 liter med kylspiral är en sprit-panna vad
//    texten än säger. Elektriska vattendestillatorer på bänken (4–6 liter) och
//    laboratoriesatser i glas spärras inte. `klassa` svarar `spritapparat`, och
//    importen och verktyget sätter `vevorGranskning.spritapparat`.

import type { KategoriNod } from "@/lib/wix/kategoritrad";
import type { Avlasning } from "./lager";

export const VAPENSKAP = "vapenskap" as const;
export const SPRITAPPARAT = "spritapparat" as const;
/** En vara som aldrig får en kategori och aldrig publiceras. */
export type Sparr = typeof VAPENSKAP | typeof SPRITAPPARAT;

function arSparr(mal: string): mal is Sparr {
  return mal === VAPENSKAP || mal === SPRITAPPARAT;
}

const VM = "Verktyg & Maskiner";
const BG = "Bil & Garage";
const BR = "Bygg & Renovering";
const TU = "Trädgård & Utemöbler";
const KH = "Kök & Husgeråd";
const HI = "Hem & Inredning";
const MO = "Möbler";
const SF = "Sport & Fritid";
const BF = "Barn & Familj";
const HD = "Husdjur";
const SH = "Skönhet & Hälsa";
const JH = "Jul & Högtider";
const FP = "Företag & Proffs";

/** Underkategorierna reglerna använder, per avdelning. Avdelningen först i varje mål. */
export const TRADET: Readonly<Record<string, readonly string[]>> = {
  [VM]: [
    "Elverktyg", "Verkstadsmaskiner", "Svetsning", "Kompressorer & tryckluft", "Högtryckstvättar & rengöring",
    "Verktygstillbehör", "Handverktyg", "Verktygsvagnar & verktygslådor", "Lyft & transport", "Stegar & ställningar",
    "Arbetskläder & skydd",
  ],
  [BG]: [
    "Domkrafter & billyftar", "Verkstadsutrustning", "Bilverktyg", "Garageinredning", "Bildelar", "Biltillbehör",
    "Takräcken & lastbärare", "Vinschar", "Flakboxar & pickuptillbehör", "Bil & släp", "Husbil & husvagn",
    "Elbilsladdning & solenergi",
  ],
  [BR]: [
    "VVS & vatten", "Pumpar", "El & installation", "Värme, ventilation & AC", "Badrumsrenovering",
    "Golv & golvverktyg", "Färg & tapet", "Dörrar & dörrbeslag", "Beslag & järnvaror", "Byggmaterial & byggverktyg",
    "Trall & räcken",
  ],
  [FP]: ["Storkök & restaurang", "Butik, evenemang & trafik", "Vård & labb", "Salong & spa"],
  [TU]: [
    "Pool & spa", "Trädgårdsmaskiner", "Staket & grindar", "Trädgårdsanläggning & konstgräs", "Trädgårdsskötsel & Bevattning",
    "Grill & Utekök", "Solskydd & Paviljonger", "Utemöbler", "Trädgårdsdekor & Belysning", "Växthus & Odling",
    "Odlingslådor", "Eldkorgar & eldstäder", "Redskapsbodar & förråd", "Vedställ & vedbodar", "Garagetält",
  ],
  [SF]: [
    "Hantverk & sömnad", "Camping & kylboxar", "Båt & vattensport", "Jakt & fiske", "Träning & Gym", "Bollsport",
    "Spel & bordsspel", "Hobby & musik", "Bil & Cykel", "Friluftsliv & Resa", "Boxningssäckar",
  ],
  [KH]: [
    "Glass-, is- & dessertmaskiner", "Matförvaring & köksorganisering", "Köttkvarnar & charkuteri",
    "Köksredskap & Tillbehör", "Köksmaskiner & Apparater", "Miniugnar & airfryers", "Kyl & frys",
    "Vinställ & vinkylar", "Köksöar & köksvagnar", "Vattenkokare & brödrostar", "Serveringsvagnar & rullvagnar",
  ],
  [HI]: [
    "Hemelektronik & tillbehör", "Mattor", "Kassaskåp", "Konstväxter", "Dekoration & Prydnad", "Tvätt & städ",
    "Badrum & Hemtextil", "Förvaring & Organisering", "Projektordukar", "Smart hem & säkerhet", "Elkaminer",
    "Hushållsapparater", "Belysning", "Badrumsspeglar", "Tvättkorgar", "Badrumsskåp", "Speglar", "Elementskydd",
    "Gnistskydd",
  ],
  [MO]: [
    "Kontorstillbehör", "Soffbord & småbord", "Skrivbord", "TV-bänkar", "Rumsavdelare", "Sängar & sovrum",
    "Kontorsstolar", "Garderober & klädställ", "Klädhängare & hallmöbler", "Matbord & stolar", "Soffor & bäddsoffor",
    "Skoskåp & skobänkar", "Fåtöljer", "Byråer", "Sideboards & vitrinskåp", "Barbord", "Pallar", "Bokhyllor",
    "Massagestolar", "Sittpuffar & fotpallar",
  ],
  [SH]: ["Hjälpmedel", "Kropp & Välbefinnande", "Hår & Rakning", "Massage & Återhämtning"],
  [HD]: [
    "Lek & Tillbehör för husdjur", "Hönshus & hönsgårdar", "Hundgrindar", "Hundbäddar & hundsoffor",
    "Valphagar & hundhagar", "Pälsvård & Skötsel", "Mat & Vattenskålar", "Kaninburar & marsvinsburar", "Hundvagnar",
    "Kattlådor", "Terrarier", "Katthus", "Hundburar", "Selar, Koppel & Transport", "Hundkojor", "Klösträd",
    "Hamsterburar & gnagarburar",
  ],
  [BF]: ["Leksaker & Spel", "Barnmöbler", "Utelek & Spel", "Baby & Småbarn", "Sandlådor", "Elbilar för barn"],
  [JH]: ["Juldekoration", "Kalas & Fest", "Julgranar"],
};

/** Avdelningens tidigare namn i Wix (egenskap 3). */
export const NAMNBYTEN: Readonly<Record<string, readonly string[]>> = {
  [VM]: ["Verktyg & Fordon"],
};

/** Underkategorier som flyttar mellan avdelningar: deras förra förälder (egenskap 3). */
export const FLYTTADE: Readonly<Record<string, readonly string[]>> = {
  "Bil & släp": ["Verktyg & Fordon", VM],
  "Elbilsladdning & solenergi": ["Verktyg & Fordon", VM],
};

export type Regel = readonly [sokvag: string, namn: RegExp | null, mal: string];

/**
 * Varans namn fram till första " för " eller kommatecken. VEVOR räknar upp vad
 * varan passar till ("Husdjursramp för hund och kanin"), så en produkttyp som
 * står först säger vad varan är, och en som står efter " för " gör det inte.
 */
function fore(ord: string): RegExp {
  return new RegExp(`^(?:(?! för )[^,])*?(?:${ord})`, "i");
}

export const REGLER: readonly Regel[] = [
  // ☠️ Vapenskåp i alla sökvägar, före allt annat (Leonards beslut 3, SS 3492).
  // Granskningen 2026-10-31 fann regeln bara i Kassaskåp; ett vapenskåp under
  // Jakt eller med ett annat ord ("bösskåp") hade fått en kategori och kunnat
  // publiceras. Hellre ett skåp för mycket som spärras än ett för lite.
  ["", /^[^,]*(?:(?:vapen|gevärs?|pistol|jakt)(?:skåp|kassaskåp|säkerhetsskåp)|bös+skåp)|^[^,]*(?:skåp|kassaskåp)\b[^,]*\bför\b[^,]*(?:gevär|vapen|pistol|bössor)|gun ?(?:safe|cabinet)/i, VAPENSKAP],
  // ☠️ Spritapparater (alkohollagen 2 kap. 1 §, egenskap 6), före allt annat
  // utom vapenskåpen. Mätt 2026-10-31 på 15 246 avläsningar: en destillator som
  // säljs för alkohol står i Bryggutrustning, utom en vattendestillator under
  // Vattenkokare som säljs som "Vinframställningsset". Alkohollampan i en
  // laboratoriesats och alkoholbrännaren under en dryckesdispenser är värme,
  // inte sprit.
  ["", /^(?=.*(?:destill|distill|\bstill\b))(?=.*(?:alkohol(?!lampa|brännare)|whisky|vodka|brandy|moonshine|hem(?:ma)?bränt|brännvin|\bsprit\b|vinframställ|thumper|grappa))/i, SPRITAPPARAT],
  ["Kök>Bordsartiklar och bardisk>Bryggutrustning", /destill|distill|\bstill\b/i, SPRITAPPARAT],
  ["", /^(?![^,]*(?:hund|katt|husdjur|djur))[^,]*(?:barnvagn|bröstpump|amningsväska)/i, BF + "/Baby & Småbarn"],
  ["", /köavspärr|kökontroll|folkmass|publikkontroll|avspärrning|sammetsrep|sammetslin|stolpar för kö|kö-?stolp/i, FP + "/Butik, evenemang & trafik"],
  ["", /^(?!.*(?:bröllop|kalas|\bfest|ballong|födelsedag)).*(?:banner|reklamflagg|backdrop|step and repeat|displaybakgrund|öppna flaggor)/i, FP + "/Butik, evenemang & trafik"],
  ["", /medicinsk vagn/i, FP + "/Vård & labb"],
  ["", /bimini/i, SF + "/Båt & vattensport"],
  // Utomhus
  ["Utomhus>Trädgårdscenter>Trädgårdsredskap", /höns/i, HD + "/Hönshus & hönsgårdar"],
  ["Utomhus>Trädgårdscenter>Trädgårdsredskap", null, TU + "/Trädgårdsskötsel & Bevattning"],
  ["Utomhus>Trädgårdscenter>Landskapsarkitekturtillbehör", null, TU + "/Trädgårdsanläggning & konstgräs"],
  ["Utomhus>Trädgårdscenter>Utomhusdekor", /bågformad|bakgrundsstativ|ballongbåge|bröllop/i, JH + "/Kalas & Fest"],
  ["Utomhus>Trädgårdscenter>Utomhusdekor", /väderstation/i, HI + "/Hemelektronik & tillbehör"],
  ["Utomhus>Trädgårdscenter>Utomhusdekor", /simbassäng|pool/i, TU + "/Pool & spa"],
  ["Utomhus>Trädgårdscenter>Utomhusdekor", null, TU + "/Trädgårdsdekor & Belysning"],
  ["Utomhus>Trädgårdscenter>Växthus", null, TU + "/Växthus & Odling"],
  ["Utomhus>Trädgårdscenter>Hydroponisk", null, TU + "/Växthus & Odling"],
  ["Utomhus>Trädgårdscenter>Växtstöd", null, TU + "/Växthus & Odling"],
  ["Utomhus>Trädgårdscenter>Planteringskärl", null, TU + "/Odlingslådor"],
  ["Utomhus>Trädgårdscenter>Upphöjda", null, TU + "/Odlingslådor"],
  ["Utomhus>Trädgårdscenter>Trädgårdsstängsel", null, TU + "/Staket & grindar"],
  ["Utomhus>Trädgårdscenter>Dammar", null, TU + "/Trädgårdsanläggning & konstgräs"],
  ["Utomhus>Trädgårdscenter>Konstgräs", null, TU + "/Trädgårdsanläggning & konstgräs"],
  ["Utomhus>Trädgårdscenter", null, TU + "/Trädgårdsskötsel & Bevattning"],
  ["Utomhus>Djurtillbehör", /hundtvätt|hundbad|husdjursbad|husdjursdusch|tvättstation/i, HD + "/Pälsvård & Skötsel"],
  ["Utomhus>Djurtillbehör och djurliv>Reptil", /./, HD + "/Terrarier"],
  ["Utomhus>Djurtillbehör", /barngrind|babygrind/i, BF + "/Baby & Småbarn"],
  ["Utomhus>Djurtillbehör", /flygbolag|rullande husdjursbur|kattbur med hjul/i, HD + "/Selar, Koppel & Transport"],
  ["Utomhus>Djurtillbehör", /^[^,]*(?:hamster|gnagare|chinchilla)/i, HD + "/Hamsterburar & gnagarburar"],
  // Produkttypen före egenskaperna: "Hönshus med ramp", "Klösträd med kattbädd"
  // och "Kaninbur med matskål" är hönshus, klösträd och kaninbur
  // (granskningen 2026-10-31). Bara typen före " för " räknas (fore).
  ["Utomhus>Djurtillbehör", fore("hönshus|hönsgård|hönsbur|kycklingbur|kycklinghus|kycklinggård|ankhus|fjäderfägård"), HD + "/Hönshus & hönsgårdar"],
  ["Utomhus>Djurtillbehör", fore("kaninbur|kaninhus|kaninhage|kaningård|marsvinsbur|marsvinshus"), HD + "/Kaninburar & marsvinsburar"],
  ["Utomhus>Djurtillbehör", fore("klösträd|klöspelare|kattträd|katträd"), HD + "/Klösträd"],
  ["Utomhus>Djurtillbehör", fore("katthus|kattkoja|kattgård"), HD + "/Katthus"],
  ["Utomhus>Djurtillbehör", fore("kattlåd|kattoalett"), HD + "/Kattlådor"],
  ["Utomhus>Djurtillbehör", fore("hundkoja|hundhus"), HD + "/Hundkojor"],
  ["Utomhus>Djurtillbehör", fore("hundvagn|husdjursvagn|djurvagn|barnvagn"), HD + "/Hundvagnar"],
  ["Utomhus>Djurtillbehör", /^[^,]*(?:fågelbur|rullstol|ramp|trappa)/i, HD + "/Lek & Tillbehör för husdjur"],
  ["Utomhus>Djurtillbehör", /hundhage|valphage|hundgård|kennel|lekhage|husdjurshage/i, HD + "/Valphagar & hundhagar"],
  ["Utomhus>Djurtillbehör", /hundbur|transportbur|husdjursbur/i, HD + "/Hundburar"],
  ["Utomhus>Djurtillbehör", /hundkoja|hundhus/i, HD + "/Hundkojor"],
  ["Utomhus>Djurtillbehör", /grind/i, HD + "/Hundgrindar"],
  ["Utomhus>Djurtillbehör", /hundvagn|husdjursvagn|djurvagn|cykelkärra/i, HD + "/Hundvagnar"],
  ["Utomhus>Djurtillbehör", /bädd|soffa/i, HD + "/Hundbäddar & hundsoffor"],
  ["Utomhus>Djurtillbehör", /matstation|skål|matare|vattenautomat|fågelbad/i, HD + "/Mat & Vattenskålar"],
  ["Utomhus>Djurtillbehör", /klösträd|klöspelare/i, HD + "/Klösträd"],
  ["Utomhus>Djurtillbehör", /kattlåd|kattoalett/i, HD + "/Kattlådor"],
  ["Utomhus>Djurtillbehör", /katthus|kattkoja|kattgård/i, HD + "/Katthus"],
  ["Utomhus>Djurtillbehör", /höns|kyckling|ankhus/i, HD + "/Hönshus & hönsgårdar"],
  ["Utomhus>Djurtillbehör", /kanin|marsvin/i, HD + "/Kaninburar & marsvinsburar"],
  ["Utomhus>Djurtillbehör", /hamster|gnagare|chinchilla/i, HD + "/Hamsterburar & gnagarburar"],
  // \borm: "plattform" och "formad" är inga ormar.
  ["Utomhus>Djurtillbehör", /terrari|reptil|ödl|\borm/i, HD + "/Terrarier"],
  ["Utomhus>Djurtillbehör", /trim|päls|grooming|klipp|bad för/i, HD + "/Pälsvård & Skötsel"],
  ["Utomhus>Djurtillbehör", /koppel|sele|transportväska/i, HD + "/Selar, Koppel & Transport"],
  ["Utomhus>Djurtillbehör och djurliv>Reptil", null, HD + "/Terrarier"],
  ["Utomhus>Djurtillbehör", null, HD + "/Lek & Tillbehör för husdjur"],
  ["Utomhus>Utomhusmatlagning", /kyl|frys/i, SF + "/Camping & kylboxar"],
  ["Utomhus>Utomhusmatlagning", null, TU + "/Grill & Utekök"],
  ["Utomhus>Utomhusutrustning för kraft>Högtryckstvättar", null, VM + "/Högtryckstvättar & rengöring"],
  ["Utomhus>Utomhusutrustning för kraft", /högtryck/i, VM + "/Högtryckstvättar & rengöring"],
  ["Utomhus>Utomhusutrustning för kraft", /cylinder ?domkraft|hydraulcylinder/i, BG + "/Domkrafter & billyftar"],
  ["Utomhus>Utomhusutrustning för kraft", null, TU + "/Trädgårdsmaskiner"],
  ["Utomhus>Pooler", null, TU + "/Pool & spa"],
  ["Utomhus>Hemma-spa", null, TU + "/Pool & spa"],
  ["Utomhus>Utemöbler", null, TU + "/Utemöbler"],
  ["Utomhus>Utomhusvärme>Vedställ", null, TU + "/Vedställ & vedbodar"],
  ["Utomhus>Utomhusvärme", null, TU + "/Eldkorgar & eldstäder"],
  // Verktyg
  ["Verktyg>Elverktyg>Metallbearbetningsverktyg", null, VM + "/Verkstadsmaskiner"],
  ["Verktyg>Elverktyg", null, VM + "/Elverktyg"],
  ["Verktyg>Träbearbetningsverktyg", null, VM + "/Verkstadsmaskiner"],
  ["Verktyg>Handverktyg", null, VM + "/Handverktyg"],
  ["Verktyg>Säkerhet och trygghet>Kassaskåp", /pistol|vapen|gevär|hagel/i, VAPENSKAP],
  ["Verktyg>Säkerhet och trygghet>Kassaskåp", /hårt fodral|hårda fodral|torrfodral/i, VM + "/Verktygsvagnar & verktygslådor"],
  ["Verktyg>Säkerhet och trygghet>Kassaskåp", null, HI + "/Kassaskåp"],
  ["Verktyg>Säkerhet och trygghet>Hemsäkerhet", /småbarn|spädbarn|baby|barnsäng|barngrind|trappgrind|sänggrind|lekhage|barnsäker/i, BF + "/Baby & Småbarn"],
  ["Verktyg>Säkerhet och trygghet", null, HI + "/Smart hem & säkerhet"],
  ["Verktyg>Svetsning", /\bdent|buckl/i, BG + "/Bilverktyg"],
  ["Verktyg>Svetsning", null, VM + "/Svetsning"],
  ["Verktyg>Tillbehör för elverktyg", null, VM + "/Verktygstillbehör"],
  ["Verktyg>Verktyg för luftkompressor", /luftgevär/i, SF + "/Jakt & fiske"],
  ["Verktyg>Verktyg för luftkompressor", null, VM + "/Kompressorer & tryckluft"],
  ["Verktyg>Verktygsförvaring", null, VM + "/Verktygsvagnar & verktygslådor"],
  // Bil
  ["Bil>Butiksutrustning>Utrustning för vätskeöverföring", /olj/i, BG + "/Verkstadsutrustning"],
  ["Bil>Butiksutrustning>Utrustning för vätskeöverföring", null, BR + "/Pumpar"],
  ["Bil>Butiksutrustning>Domkrafter", null, BG + "/Domkrafter & billyftar"],
  ["Bil>Butiksutrustning>Motorlyftar", null, BG + "/Domkrafter & billyftar"],
  ["Bil>Butiksutrustning>Tillbehör för billyft", null, BG + "/Domkrafter & billyftar"],
  ["Bil>Butiksutrustning>ATV- och motorcykellyftar", null, BG + "/Domkrafter & billyftar"],
  ["Bil>Butiksutrustning>Underlyftstativ", null, BG + "/Domkrafter & billyftar"],
  ["Bil>Butiksutrustning>Motorstöd", null, BG + "/Domkrafter & billyftar"],
  ["Bil>Butiksutrustning>Lyftstödarm", null, BG + "/Domkrafter & billyftar"],
  ["Bil>Butiksutrustning>Bilhissar", null, BG + "/Domkrafter & billyftar"],
  ["Bil>Butiksutrustning", null, BG + "/Verkstadsutrustning"],
  ["Bil>Mekaniska verktyg", null, BG + "/Bilverktyg"],
  ["Bil>Däcktillbehör", /navkaps|hjulkaps/i, BG + "/Biltillbehör"],
  ["Bil>Däcktillbehör", null, BG + "/Bilverktyg"],
  ["Bil>Bogseringsutrustning", /kajak|kanot/i, SF + "/Båt & vattensport"],
  ["Bil>Bogseringsutrustning", /cykelvagn|cykelsläp|cykelkärra/i, SF + "/Bil & Cykel"],
  ["Bil>Bogseringsutrustning", null, BG + "/Bil & släp"],
  ["Bil>Lastbilstillbehör", null, BG + "/Flakboxar & pickuptillbehör"],
  ["Bil>Bildelar", null, BG + "/Bildelar"],
  ["Bil>Reservdelar", null, BG + "/Bildelar"],
  ["Bil>Lastbärare>Cykelställ", /reparation|arbetsställ|monteringsställ/i, SF + "/Bil & Cykel"],
  ["Bil>Lastbärare", null, BG + "/Takräcken & lastbärare"],
  ["Automotive>Cargo Carriers", null, BG + "/Takräcken & lastbärare"],
  ["Bil>Exteriöra biltillbehör>Vinsch", null, BG + "/Vinschar"],
  ["Bil>Husbilstillbehör", null, BG + "/Husbil & husvagn"],
  ["Bil>", null, BG + "/Biltillbehör"],
  // Sport och friluftsliv
  ["Sport och friluftsliv>Utomhussporter", null, SF + "/Bollsport"],
  ["Sport och friluftsliv>Fältutrustning", null, SF + "/Bollsport"],
  ["Sport och friluftsliv>Träningsutrustning", null, SF + "/Träning & Gym"],
  ["Sport och friluftsliv>Gymnastikutrustning", null, SF + "/Träning & Gym"],
  ["Sport och friluftsliv>Dansutrustning", null, SF + "/Träning & Gym"],
  ["Sport och friluftsliv>Yogautrustning", null, SF + "/Träning & Gym"],
  ["Sport och friluftsliv>Boxningsutrustning", null, SF + "/Boxningssäckar"],
  ["Sport och friluftsliv>Campingutrustning>Tält", /partytält|nattklubb/i, JH + "/Kalas & Fest"],
  ["Sport och friluftsliv>Campingutrustning>Tält", /pop.?up|paviljong/i, TU + "/Solskydd & Paviljonger"],
  ["Sport och friluftsliv>Campingutrustning", null, SF + "/Camping & kylboxar"],
  ["Sport och friluftsliv>Friluftsliv", null, SF + "/Camping & kylboxar"],
  ["Sport och friluftsliv>Tailgating-utrustning>Kylare", /kommersiell|bardisk/i, FP + "/Storkök & restaurang"],
  ["Sport och friluftsliv>Tailgating-utrustning>Kylare", null, SF + "/Camping & kylboxar"],
  ["Sport och friluftsliv>Tailgating-utrustning", null, TU + "/Solskydd & Paviljonger"],
  ["Sport och friluftsliv>Spel", null, SF + "/Spel & bordsspel"],
  ["Sport och friluftsliv>Barnleksaker", null, BF + "/Leksaker & Spel"],
  ["Sport och friluftsliv>Båtliv", null, SF + "/Båt & vattensport"],
  ["Sport och friluftsliv>Vattensporter", null, SF + "/Båt & vattensport"],
  ["Sport och friluftsliv>Jaktutrustning", null, SF + "/Jakt & fiske"],
  ["Sport och friluftsliv>Fiskeutrustning", null, SF + "/Jakt & fiske"],
  ["Sport och friluftsliv>Cykelutrustning>Barnbilar", /elbil|eldriven|elektrisk|batteri|\d ?v\b/i, BF + "/Elbilar för barn"],
  ["Sport och friluftsliv>Cykelutrustning>Barnbilar", null, BF + "/Utelek & Spel"],
  ["Sport och friluftsliv>Cykelutrustning", null, SF + "/Bil & Cykel"],
  ["Sport och friluftsliv>Sportskyddsutrustning", null, SF + "/Bil & Cykel"],
  ["Sport och friluftsliv>Trampoliner", null, BF + "/Utelek & Spel"],
  ["Sport och friluftsliv>Friluftshobbyer", null, SF + "/Friluftsliv & Resa"],
  ["Sport och friluftsliv>Fritidsfordon", null, BG + "/Biltillbehör"],
  ["Sport och friluftsliv>Utrustning för vattenrekreation", null, TU + "/Pool & spa"],
  ["Sports & Outdoors", null, BF + "/Leksaker & Spel"],
  // Vitvaror
  ["Vitvaror>Små köksapparater>Dessertmakare", null, KH + "/Glass-, is- & dessertmaskiner"],
  ["Vitvaror>Små köksapparater>Kött- och fågelverktyg", null, KH + "/Köttkvarnar & charkuteri"],
  ["Vitvaror>Små köksapparater>Fritöser", null, KH + "/Miniugnar & airfryers"],
  ["Vitvaror>Små köksapparater>Brödrostugnar", null, KH + "/Miniugnar & airfryers"],
  ["Vitvaror>Små köksapparater>Elektriska stekpannor", null, KH + "/Miniugnar & airfryers"],
  ["Vitvaror>Små köksapparater>Vattenkokare", /destill/i, KH + "/Köksmaskiner & Apparater"],
  ["Vitvaror>Små köksapparater>Vattenkokare", null, KH + "/Vattenkokare & brödrostar"],
  ["Vitvaror>Små köksapparater>Matvärmare", null, FP + "/Storkök & restaurang"],
  ["Vitvaror>Små köksapparater>Utrustning för varmkorv", null, FP + "/Storkök & restaurang"],
  ["Vitvaror>Små köksapparater", null, KH + "/Köksmaskiner & Apparater"],
  ["Vitvaror>Hantverk och sömnad", null, SF + "/Hantverk & sömnad"],
  ["Appliances>Crafts", null, SF + "/Hantverk & sömnad"],
  ["Vitvaror>Ismaskiner", /kommersiell|industriell/i, FP + "/Storkök & restaurang"],
  ["Vitvaror>Ismaskiner", null, KH + "/Glass-, is- & dessertmaskiner"],
  ["Appliances>Ice Makers", /kommersiell|industriell/i, FP + "/Storkök & restaurang"],
  ["Appliances>Ice Makers", null, KH + "/Glass-, is- & dessertmaskiner"],
  ["Vitvaror>Apparatdelar", /rattställ|rattfäste|rattstativ|racing|simulator/i, HI + "/Hemelektronik & tillbehör"],
  ["Vitvaror>Apparatdelar", null, HI + "/Hushållsapparater"],
  ["Vitvaror>Dryckeskylare", null, KH + "/Kyl & frys"],
  ["Vitvaror>Frysar", /kommersiell/i, FP + "/Storkök & restaurang"],
  ["Vitvaror>Frysar", null, KH + "/Kyl & frys"],
  ["Vitvaror>kylskåp", /kommersiell/i, FP + "/Storkök & restaurang"],
  ["Vitvaror>kylskåp", null, KH + "/Kyl & frys"],
  ["Vitvaror>Spishällar", null, KH + "/Köksmaskiner & Apparater"],
  ["Vitvaror>Väggugnar", null, FP + "/Storkök & restaurang"],
  ["Vitvaror>Köksfläktar", null, FP + "/Storkök & restaurang"],
  ["Vitvaror>", null, HI + "/Tvätt & städ"],
  // Möbler
  ["Möbler>Köks- och matrumsmöbler>Vagnar och verktygsbord", /köksvagn|rullvagn|serveringsvagn|trådvagn/i, KH + "/Serveringsvagnar & rullvagnar"],
  ["Möbler>Köks- och matrumsmöbler>Vagnar och verktygsbord", /rostfri|arbetsbord|förberedelsebord|diskbänk/i, FP + "/Storkök & restaurang"],
  ["Möbler>Köks- och matrumsmöbler>Vagnar och verktygsbord", /hylla|hyllor/i, HI + "/Förvaring & Organisering"],
  ["Möbler>Köks- och matrumsmöbler>Vagnar och verktygsbord", null, KH + "/Serveringsvagnar & rullvagnar"],
  ["Möbler>Köks- och matrumsmöbler>Överdrag", /stolsband|rosett|spandex|stolsöverdrag/i, JH + "/Kalas & Fest"],
  ["Möbler>Köks- och matrumsmöbler>Överdrag", null, TU + "/Utemöbler"],
  ["Möbler>Köks- och matrumsmöbler>Köksöar", null, KH + "/Köksöar & köksvagnar"],
  ["Möbler>Köks- och matrumsmöbler>Bagarställ", null, FP + "/Storkök & restaurang"],
  ["Möbler>Köks- och matrumsmöbler>Skafferiskåp", null, HI + "/Förvaring & Organisering"],
  ["Möbler>Köks- och matrumsmöbler>Stående skåp", null, HI + "/Förvaring & Organisering"],
  ["Möbler>Köks- och matrumsmöbler", null, MO + "/Matbord & stolar"],
  ["Möbler>Vardagsrumsmöbler>TV-bänkar", null, MO + "/TV-bänkar"],
  ["Möbler>Vardagsrumsmöbler>Medielagring", null, MO + "/TV-bänkar"],
  ["Möbler>Vardagsrumsmöbler>Accentbord", null, MO + "/Soffbord & småbord"],
  ["Möbler>Vardagsrumsmöbler>Akrylbord", null, MO + "/Soffbord & småbord"],
  ["Möbler>Vardagsrumsmöbler>Soffbord", null, MO + "/Soffbord & småbord"],
  ["Möbler>Vardagsrumsmöbler>Vardagsrumsbordsset", null, MO + "/Soffbord & småbord"],
  ["Möbler>Vardagsrumsmöbler>Accentskåp", null, MO + "/Sideboards & vitrinskåp"],
  ["Möbler>Vardagsrumsmöbler>Stående hörnhylla", null, MO + "/Sideboards & vitrinskåp"],
  ["Möbler>Vardagsrumsmöbler>Massagestolar", null, MO + "/Massagestolar"],
  ["Möbler>Vardagsrumsmöbler>Ottomaner", null, MO + "/Sittpuffar & fotpallar"],
  ["Möbler>Vardagsrumsmöbler>Provrum", null, FP + "/Butik, evenemang & trafik"],
  ["Möbler>Vardagsrumsmöbler>Stolar", null, MO + "/Fåtöljer"],
  ["Möbler>Vardagsrumsmöbler", null, MO + "/Soffor & bäddsoffor"],
  ["Möbler>Möbler för hemmakontor>Skrivbord", null, MO + "/Skrivbord"],
  ["Möbler>Möbler för hemmakontor>Kontorsstolar", null, MO + "/Kontorsstolar"],
  ["Möbler>Möbler för hemmakontor>Bokhyllor", null, MO + "/Bokhyllor"],
  ["Möbler>Möbler för hemmakontor", null, MO + "/Kontorstillbehör"],
  ["Möbler>Barnmöbler", null, BF + "/Barnmöbler"],
  ["Möbler>Möbeltillbehör", /murphy|väggsäng/i, MO + "/Sängar & sovrum"],
  ["Möbler>Möbeltillbehör", null, BR + "/Beslag & järnvaror"],
  ["Möbler>Sovrumsmöbler>Byrå", null, MO + "/Byråer"],
  ["Möbler>Sovrumsmöbler>Smyckesskåp", null, HI + "/Speglar"],
  ["Möbler>Sovrumsmöbler", null, MO + "/Sängar & sovrum"],
  ["Möbler>Barmöbler>Vin", null, KH + "/Vinställ & vinkylar"],
  ["Möbler>Barmöbler>Barstolar", null, MO + "/Pallar"],
  ["Möbler>Barmöbler>Barvagnar", null, KH + "/Serveringsvagnar & rullvagnar"],
  ["Möbler>Barmöbler", null, MO + "/Barbord"],
  ["Möbler>Möbler för entrén", null, MO + "/Klädhängare & hallmöbler"],
  ["Möbler>Salong", /undersökning/i, FP + "/Vård & labb"],
  ["Möbler>Salong", null, FP + "/Salong & spa"],
  // Förvaring
  ["Förvaring och organisering>Garageförvaring>Kundvagnar", /köksvagn/i, KH + "/Serveringsvagnar & rullvagnar"],
  ["Förvaring och organisering>Garageförvaring>Kundvagnar", null, VM + "/Lyft & transport"],
  ["Förvaring och organisering>Garageförvaring", null, BG + "/Garageinredning"],
  ["Storage & Organization", null, BG + "/Garageinredning"],
  ["Förvaring och organisering>Utomhusförvaring>Skuggstrukturer", null, TU + "/Solskydd & Paviljonger"],
  ["Förvaring och organisering>Utomhusförvaring>Utomhusförvaring för bilar", null, TU + "/Garagetält"],
  ["Förvaring och organisering>Utomhusförvaring", null, TU + "/Redskapsbodar & förråd"],
  ["Förvaring och organisering>Kontorsmaterial", /labb|destill/i, FP + "/Vård & labb"],
  ["Förvaring och organisering>Kontorsmaterial", /pengar|faktura|sedel|mynt/i, FP + "/Butik, evenemang & trafik"],
  ["Förvaring och organisering>Kontorsmaterial", null, MO + "/Kontorstillbehör"],
  ["Förvaring och organisering>Förvaring och organisering av kontoret", null, MO + "/Kontorstillbehör"],
  ["Förvaring och organisering>Hyllor>Restauranghyllor", null, FP + "/Storkök & restaurang"],
  ["Förvaring och organisering>Förvaring i tvättstugan>Tvätt", null, HI + "/Tvättkorgar"],
  ["Förvaring och organisering>Förvaring i tvättstugan", null, HI + "/Tvätt & städ"],
  ["Förvaring och organisering>Garderobsorganisatörer>Tvätthyllor", null, HI + "/Tvätt & städ"],
  ["Förvaring och organisering>Garderobsorganisatörer", null, MO + "/Garderober & klädställ"],
  ["Förvaring och organisering>Skoförvaring", null, MO + "/Skoskåp & skobänkar"],
  ["Förvaring och organisering>Flyttmaterial", null, VM + "/Lyft & transport"],
  ["Förvaring och organisering>Förvaring av hantverk", null, SF + "/Hantverk & sömnad"],
  ["Förvaring och organisering>Hopfällbara möbler", null, MO + "/Matbord & stolar"],
  ["Förvaring och organisering", null, HI + "/Förvaring & Organisering"],
  // Byggnadsmaterial
  ["Byggnadsmaterial>Materialhanteringsutrustning>Säkerhet", null, FP + "/Butik, evenemang & trafik"],
  ["Byggnadsmaterial>Materialhanteringsutrustning", /strand|fiskevagn/i, SF + "/Camping & kylboxar"],
  ["Byggnadsmaterial>Materialhanteringsutrustning", null, VM + "/Lyft & transport"],
  ["Byggnadsmaterial>Stegar", null, VM + "/Stegar & ställningar"],
  ["Byggnadsmaterial>Byggnadsställningar", null, VM + "/Stegar & ställningar"],
  ["Byggnadsmaterial>Byggnadsbeslag", null, BR + "/Beslag & järnvaror"],
  ["Byggnadsmaterial>Ventilation", null, BR + "/Värme, ventilation & AC"],
  ["Byggnadsmaterial>Båtbryggor", null, SF + "/Båt & vattensport"],
  ["Byggnadsmaterial", null, BR + "/Byggmaterial & byggverktyg"],
  // Kök
  ["Kök>Köksutrustning>Restaurangskyltar", null, FP + "/Storkök & restaurang"],
  ["Kök>Köksutrustning", /kommersiell/i, FP + "/Storkök & restaurang"],
  ["Kök>Köksutrustning", null, KH + "/Köksredskap & Tillbehör"],
  ["Kök>Bordsartiklar och bardisk", /kommersiell|skavsk|chafing|varmfack|varmhållning|buffé/i, FP + "/Storkök & restaurang"],
  ["Kök>Bordsartiklar och bardisk", null, KH + "/Köksredskap & Tillbehör"],
  ["Kök>Köksförvaring och organisering", null, KH + "/Matförvaring & köksorganisering"],
  ["Kök>Köksvaskar>Kommersiella", null, FP + "/Storkök & restaurang"],
  ["Kök>Köksblandare", null, FP + "/Storkök & restaurang"],
  ["Kök>Köksvaskar", null, BR + "/VVS & vatten"],
  ["Kök>Vattenautomater", null, KH + "/Köksmaskiner & Apparater"],
  ["Kök>Köksskåp", null, BR + "/Beslag & järnvaror"],
  // Elektrisk
  ["Elektrisk>Elektronik>TV- och hemmabiotillbehör", /projektor|filmduk|filmskärm|projektionsduk/i, HI + "/Projektordukar"],
  ["Elektrisk>Elektronik>Kabelhantering", /fart|trafik|kabelskydd|kabelbrygga/i, FP + "/Butik, evenemang & trafik"],
  ["Elektrisk>Elektronik", null, HI + "/Hemelektronik & tillbehör"],
  ["Elektrisk>Förnybar energi", null, BG + "/Elbilsladdning & solenergi"],
  ["Elektrisk>Porttelefoner", /restaurang|personsökare|kösignal/i, FP + "/Storkök & restaurang"],
  ["Elektrisk", null, BR + "/El & installation"],
  // VVS
  ["VVS>Vattenpumpar", null, BR + "/Pumpar"],
  ["VVS>Avvattningspump", null, BR + "/Pumpar"],
  ["VVS>Hydrauliska pumpar", /utombord|båt/i, SF + "/Båt & vattensport"],
  ["VVS>Hydrauliska pumpar", null, BR + "/Pumpar"],
  ["VVS>Vakuumpump>Luftpistolpump", null, SF + "/Jakt & fiske"],
  ["VVS>Vakuumpump", null, BR + "/Pumpar"],
  ["VVS", null, BR + "/VVS & vatten"],
  ["Plumbing", null, BR + "/VVS & vatten"],
  // Heminredning
  ["Heminredning>Konstgjorda växter", null, HI + "/Konstväxter"],
  ["Heminredning>Rumsavdelare", null, MO + "/Rumsavdelare"],
  ["Heminredning>Strö", null, HI + "/Badrum & Hemtextil"],
  ["Heminredning>Läsningskudde", null, HI + "/Badrum & Hemtextil"],
  ["Heminredning>Bagage", null, SF + "/Friluftsliv & Resa"],
  ["Heminredning>Tapet", null, BR + "/Färg & tapet"],
  ["Heminredning>Speglar", null, HI + "/Speglar"],
  ["Heminredning", /bröllop/i, JH + "/Kalas & Fest"],
  ["Heminredning", null, HI + "/Dekoration & Prydnad"],
  // Trä, hårdvara
  ["Trä och kompositer>Trädäck", null, BR + "/Trall & räcken"],
  ["Trä och kompositer>Staket", null, TU + "/Staket & grindar"],
  ["Hårdvara>Kedjor och rep", null, VM + "/Lyft & transport"],
  ["Hårdvara>Surrband", null, VM + "/Lyft & transport"],
  ["Hårdvara>Dörrbeslag", null, BR + "/Dörrar & dörrbeslag"],
  ["Hårdvara>Tätningslister", null, BR + "/Dörrar & dörrbeslag"],
  ["Hårdvara", null, BR + "/Beslag & järnvaror"],
  // VVS-värme
  ["Uppvärmning, ventilation och kylning>Värmare>Värmartillbehör", /golvlist|värmarskydd/i, HI + "/Elementskydd"],
  ["Uppvärmning, ventilation och kylning>Värmare", /härdning|färgtork|sprutbox|värmelampa|infraröd lampa/i, BG + "/Verkstadsutrustning"],
  ["Uppvärmning, ventilation och kylning>Eldstäder", /^[^,]*(?:tält|camping)/i, SF + "/Camping & kylboxar"],
  ["Uppvärmning, ventilation och kylning>Eldstäder", /galler/i, HI + "/Gnistskydd"],
  ["Uppvärmning, ventilation och kylning>Eldstäder>Tillbehör", /skorsten|sotar/i, BR + "/Värme, ventilation & AC"],
  ["Uppvärmning, ventilation och kylning>Eldstäder>Tillbehör", null, HI + "/Gnistskydd"],
  ["Uppvärmning, ventilation och kylning>Eldstäder>Öppen spisdörr", null, HI + "/Gnistskydd"],
  ["Uppvärmning, ventilation och kylning>Eldstäder", /tält|camping/i, SF + "/Camping & kylboxar"],
  ["Uppvärmning, ventilation och kylning>Eldstäder", null, HI + "/Elkaminer"],
  ["Uppvärmning, ventilation och kylning", null, BR + "/Värme, ventilation & AC"],
  // Golv
  ["Golv>Gymgolv", null, SF + "/Träning & Gym"],
  ["Golv>Garagegolv", /evenemang/i, FP + "/Butik, evenemang & trafik"],
  ["Golv>Garagegolv>Golv för evenemang", null, FP + "/Butik, evenemang & trafik"],
  ["Golv>Garagegolv", null, BG + "/Garageinredning"],
  ["Golv>Mattor", /salong/i, FP + "/Salong & spa"],
  ["Golv>Mattor", /dränering|kommersiell/i, BR + "/Golv & golvverktyg"],
  ["Golv>Mattor", null, HI + "/Mattor"],
  ["Golv>Matta", /dränering|kommersiell/i, BR + "/Golv & golvverktyg"],
  ["Golv>Matta", null, HI + "/Mattor"],
  ["Golv>Golvmaterial>Golvverktyg", /duschkar/i, BR + "/Badrumsrenovering"],
  ["Golv", null, BR + "/Golv & golvverktyg"],
  // Bad
  ["Bad>Badrumssäkerhet", null, SH + "/Hjälpmedel"],
  ["Bad>Badrumsspeglar", null, HI + "/Badrumsspeglar"],
  ["Bad>Badrumsförvaring", null, HI + "/Badrumsskåp"],
  ["Bad>Badrumstillbehör", null, HI + "/Badrum & Hemtextil"],
  ["Bad", null, BR + "/Badrumsrenovering"],
  ["Bath", null, BR + "/Badrumsrenovering"],
  // Dörrar och fönster
  ["Dörrar och fönster>Markiser", null, TU + "/Solskydd & Paviljonger"],
  ["Dörrar och fönster>Ytterdörrar>Husdjursdörrar", null, HD + "/Lek & Tillbehör för husdjur"],
  ["Dörrar och fönster>Tillbehör för garageportar", null, BG + "/Garageinredning"],
  ["Dörrar och fönster>Garageportsöppnare", null, BG + "/Garageinredning"],
  ["Dörrar och fönster", null, BR + "/Dörrar & dörrbeslag"],
  // Måla
  ["Måla>Färgtillbehör>Uppblåsbar målarbås", null, BG + "/Verkstadsutrustning"],
  ["Måla", null, BR + "/Färg & tapet"],
  ["Paint", null, BR + "/Färg & tapet"],
  // Hälsa
  ["Hälsa och välbefinnande>Medicinska förnödenheter>Människokroppens", null, FP + "/Vård & labb"],
  ["Hälsa och välbefinnande>Medicinska förnödenheter", null, SH + "/Hjälpmedel"],
  ["Hälsa och välbefinnande>Mobilitetshjälpmedel", null, SH + "/Hjälpmedel"],
  ["Hälsa och välbefinnande>Personliga hygienapparater>Babyvård", null, BF + "/Baby & Småbarn"],
  ["Hälsa och välbefinnande>Personliga hygienapparater>Hårstyling", null, SH + "/Hår & Rakning"],
  ["Hälsa och välbefinnande>Personliga hygienapparater>Massage", null, SH + "/Massage & Återhämtning"],
  ["Hälsa och välbefinnande>Personlig vård>Självständigt", null, SH + "/Hjälpmedel"],
  ["Hälsa och välbefinnande", null, SH + "/Kropp & Välbefinnande"],
  // Övrigt
  ["Musikinstrument", null, SF + "/Hobby & musik"],
  ["Rengöring>Rengöringsverktyg>Ultraljud", null, VM + "/Högtryckstvättar & rengöring"],
  ["Rengöring", /kundkorg|kundvagn/i, FP + "/Butik, evenemang & trafik"],
  ["Rengöring", null, HI + "/Tvätt & städ"],
  ["Arbetskläder", null, VM + "/Arbetskläder & skydd"],
  ["Lekplatsset>Kommersiell", null, TU + "/Utemöbler"],
  ["Lekplatsset>Sandlådor", null, BF + "/Sandlådor"],
  ["Lekplatsset", null, BF + "/Utelek & Spel"],
  ["Säkerhetsutrustning>Trafik", null, FP + "/Butik, evenemang & trafik"],
  ["Säkerhetsutrustning>Testinstrument", null, FP + "/Vård & labb"],
  ["Säkerhetsutrustning", null, VM + "/Arbetskläder & skydd"],
  ["Belysning>Utomhusbelysning", null, TU + "/Trädgårdsdekor & Belysning"],
  ["Belysning>Takfläktar", null, BR + "/Värme, ventilation & AC"],
  ["Belysning>LED-växtlampor", null, TU + "/Växthus & Odling"],
  ["Belysning", /cold spark|gnistmaskin|fyrverkeri|rökmaskin|dimmaskin/i, FP + "/Butik, evenemang & trafik"],
  ["Belysning", null, HI + "/Belysning"],
  ["Industriell och vetenskaplig", null, FP + "/Vård & labb"],
  ["Fönsterbehandlingar", null, HI + "/Badrum & Hemtextil"],
  ["Juldekorationer>Juldekorationer>Julgranar", null, JH + "/Julgranar"],
  ["Juldekorationer>Säsong", null, JH + "/Kalas & Fest"],
  ["Juldekorationer", /tåg|leksak/i, BF + "/Leksaker & Spel"],
  ["Juldekorationer", null, JH + "/Juldekoration"],
  ["Outdoors", null, TU + "/Trädgårdsdekor & Belysning"],];

export interface Mal {
  avdelning: string;
  kategori: string;
}

export type Klass =
  | { typ: "kategori"; mal: Mal; regel: number }
  | { typ: Sparr; regel: number }
  | { typ: "omappad" };

/**
 * Underkategorin där Leonard granskar varje vara före publiceringen (beslut 4,
 * 2026-10-31). En vara som hamnar här får `vevorGranskning.medicinteknik`, som
 * poleringen stannar på och flaggar till Leonard. Granskningen 2026-10-31: 36 av
 * 119 utkast hit saknade flaggan (duschstolar, toalettförhöjare,
 * förflyttningsbänkar, stödhandtag, inkontinensunderlägg).
 */
export const HJALPMEDEL: Mal = { avdelning: SH, kategori: "Hjälpmedel" };

export function arHjalpmedel(k: Klass): boolean {
  return k.typ === "kategori" && k.mal.avdelning === HJALPMEDEL.avdelning && k.mal.kategori === HJALPMEDEL.kategori;
}

/** Målet i en regel som avdelning och underkategori, eller en spärr (VAPENSKAP, SPRITAPPARAT). */
export function tolkaMal(mal: string): Mal | Sparr {
  if (arSparr(mal)) return mal;
  const i = mal.indexOf("/");
  if (i <= 0 || i === mal.length - 1) throw new Error(`målet saknar avdelning eller underkategori: ${mal}`);
  return { avdelning: mal.slice(0, i), kategori: mal.slice(i + 1) };
}

/** VEVOR:s kategorinamn, de tre första nivåerna. */
export function sokvagFor(kategorier: readonly { namn: string }[]): string[] {
  return kategorier.slice(0, 3).map((k) => k.namn);
}

/** Passar regelns sökväg varans? Se modulens huvud för reglerna. */
export function sokvagPassar(regel: string, vag: readonly string[]): boolean {
  if (regel === "") return true;
  const exakt = regel.endsWith(">");
  const delar = (exakt ? regel.slice(0, -1) : regel).split(">");
  if (vag.length < delar.length) return false;
  for (let i = 0; i < delar.length; i++) {
    const sista = i === delar.length - 1;
    if (sista && !exakt) {
      if (!vag[i].startsWith(delar[i])) return false;
    } else if (vag[i] !== delar[i]) {
      return false;
    }
  }
  return true;
}

/** Varans plats hos oss, ur VEVOR:s kategori och namnet. */
export function klassa(a: Pick<Avlasning, "kategorier" | "namn">): Klass {
  const vag = sokvagFor(a.kategorier);
  const namn = a.namn ?? "";
  for (let i = 0; i < REGLER.length; i++) {
    const [sokvag, monster, mal] = REGLER[i];
    if (!sokvagPassar(sokvag, vag)) continue;
    if (monster && !monster.test(namn)) continue;
    const m = tolkaMal(mal);
    return typeof m === "string" ? { typ: m, regel: i } : { typ: "kategori", mal: m, regel: i };
  }
  return { typ: "omappad" };
}

/** Alla mål reglerna kan ge, som avdelning och underkategori. */
export function allaMal(): Mal[] {
  const sett = new Map<string, Mal>();
  for (const [, , mal] of REGLER) {
    const m = tolkaMal(mal);
    if (typeof m !== "string") sett.set(`${m.avdelning}/${m.kategori}`, m);
  }
  return [...sett.values()];
}

/** Målets avdelning och underkategori som id i Wix. */
export interface MalIdn {
  avdelning: string;
  kategori: string;
}

/**
 * Målet i Wix-trädet, eller varför det inte går. Avdelningen är en rotkategori
 * med målets namn eller ett tidigare namn (NAMNBYTEN). Underkategorin finns en
 * gång i trädet och ligger under avdelningen, eller under sin förra avdelning
 * när den flyttar (FLYTTADE).
 */
export function losMal(trad: readonly KategoriNod[], mal: Mal): MalIdn | { fel: string } {
  const avdNamn = [mal.avdelning, ...(NAMNBYTEN[mal.avdelning] ?? [])];
  const avd = trad.filter((k) => k.foralder === null && avdNamn.includes(k.namn));
  if (avd.length !== 1) return { fel: `avdelningen ${mal.avdelning} finns ${avd.length} gånger` };
  const kat = trad.filter((k) => k.namn === mal.kategori);
  if (kat.length !== 1) return { fel: `underkategorin ${mal.kategori} finns ${kat.length} gånger` };
  const k = kat[0];
  if (k.foralder !== avd[0].id) {
    const foralder = trad.find((n) => n.id === k.foralder);
    if (!foralder || !(FLYTTADE[mal.kategori] ?? []).includes(foralder.namn)) {
      return { fel: `underkategorin ${mal.kategori} ligger inte under ${mal.avdelning}` };
    }
  }
  return { avdelning: avd[0].id, kategori: k.id };
}

/** Alla regelmål i trädet. Ett enda fel betyder att ingenting ska kopplas. */
export function byggUppslag(trad: readonly KategoriNod[]): { idn: Map<string, MalIdn>; fel: string[] } {
  const idn = new Map<string, MalIdn>();
  const fel: string[] = [];
  for (const m of allaMal()) {
    const r = losMal(trad, m);
    if ("fel" in r) fel.push(r.fel);
    else idn.set(malNyckel(m), r);
  }
  return { idn, fel };
}

export function malNyckel(m: Mal): string {
  return `${m.avdelning}/${m.kategori}`;
}
