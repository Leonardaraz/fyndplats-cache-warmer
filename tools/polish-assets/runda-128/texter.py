# -*- coding: utf-8 -*-
"""Runda 128 — nio verktygsskåp, verktygsvagnar och en svetsvagn.

☠️ SKU-KROCKEN UPPSTÅR I DEN KAPADE STRÄNGEN, INTE I SLUGGEN (uppgift #473).
   Färgparet `b920d526`/`d9965552` hade som `verktygsvagn-16-lador-rod` och
   `…-bla` gett SAMMA SKU: `FP-verktygsvagn-16-lador` är 23 tecken, och
   färgordet ryms inte inom 24. Sluggarna sätter därför färgen FÖRE talet —
   `verktygsvagn-rod-16-lador` ger `FP-verktygsvagn-rod-16`. Kontrollerat mot
   de publicerade `verktygsvagn-rod-5-lador` och `verktygsvagn-rod-7-lador`,
   som kapas till `FP-verktygsvagn-rod-5` respektive `-7`.

☠️ TVÅ SPEC-BLOCK ANGER FEL MATERIALKLASS.
   `1654dd75`s säger `Kunststoff` om en stålvagn; `f2495eee`s säger
   `Edelstahl` om hela vagnen när bara BÄNKSKIVAN är rostfri. Spec-tabellen
   byggs om, aldrig av (`STEG1-5.md` §1 och §2).

☠️ `81c123fa` LOVAR LEVERANS TILL TROTTOARKANT i källan. Det är
   leverantörens villkor mot en tysk kund. Ingenting av det når sidan, och
   grinden `leveransloften` fäller det om det smyger sig in.

☠️ INGEN AV SIDORNA SKRIVER UT INNERBREDDEN. `81c123fa`s källa säger att
   skåpets innerbredd är 75 cm — lika med ytterbredden. Ett plåtskåp med
   väggar kan inte ha det. Innerhöjd och innerdjup är entydiga och räcker.

⚠️ `81c123fa` är 180 cm och tar 210 kg, och källan säger INGENTING om
   väggförankring till skillnad från de lägre skåpen. Sidan lovar därför
   ingen förankring — den säger att tyngsta lasten hör hemma längst ned.
"""

NAMN = {
    "bc2e7191": "Svetsvagn 71 cm med tre hyllplan – två kedjor för gasflaskan",
    "beeada22": "Svart plåtskåp 110 cm med ventilerade dörrar – två hyllplan",
    "1654dd75": "Verktygsvagn 96 cm med sju lådor – avtagbart sidoregal i tre plan",
    "f2495eee": "Verktygsvagn med fem lådor och rostfri bänkskiva – centrallås",
    "1db06f83": "Verktygsskåp på hjul 133 cm med hålplatta – tre lådor och skåp",
    "b920d526": "Röd verktygsvagn 113 cm med 16 lådor – överkista och underskåp",
    "d9965552": "Blå verktygsvagn 113 cm med 16 lådor – överkista och underskåp",
    "fc6fdd63": "Verktygsvagn 109 cm med 14 lådor – hålvägg, sidohylla och lock",
    "81c123fa": "Verktygsskåp 180 cm med tre låszoner – låda och två skåpdelar",
}

SLUG = {
    "bc2e7191": "svetsvagn-71-cm-tre-hyllplan",
    "beeada22": "platskap-svart-110-cm-ventilerat",
    "1654dd75": "verktygsvagn-96-cm-sju-lador",
    "f2495eee": "verktygsvagn-5-lador-rostfri-skiva",
    "1db06f83": "verktygsskap-hjul-133-cm-halplatta",
    "b920d526": "verktygsvagn-rod-16-lador",
    "d9965552": "verktygsvagn-bla-16-lador",
    "fc6fdd63": "verktygsvagn-14-lador-halvagg",
    "81c123fa": "verktygsskap-180-cm-tre-laszoner",
}

SKU = {
    "bc2e7191": "FP-svetsvagn-71-cm-tre",
    "beeada22": "FP-platskap-svart-110",
    "1654dd75": "FP-verktygsvagn-96-cm",
    "f2495eee": "FP-verktygsvagn-5-lador",
    "1db06f83": "FP-verktygsskap-hjul-133",
    "b920d526": "FP-verktygsvagn-rod-16",
    "d9965552": "FP-verktygsvagn-bla-16",
    "fc6fdd63": "FP-verktygsvagn-14-lador",
    "81c123fa": "FP-verktygsskap-180-cm",
}

# Publicerade sidor som rundan korslänkar mot. `_slug` skickar dem oförändrat.
PUBLICERAD = {
    "verktygsskap-bla-82-cm", "verktygsskap-svart-82-cm",
    "verktygsvagn-svart-5-lador", "verktygsvagn-rod-7-lador",
    "verktygsvagn-overkista", "verktygsskap-131-cm-rod",
    "verkstadsvagn-metall-70-cm-tre-plan", "verktygsskap-med-overskap",
}


def _slug(m):
    return SLUG.get(m, m)


TITEL = {
    "bc2e7191": "Svetsvagn 71 cm med tre hyllplan | Fyndplats",
    "beeada22": "Svart plåtskåp 110 cm, ventilerade dörrar | Fyndplats",
    "1654dd75": "Verktygsvagn 96 cm, sju lådor och sidoregal | Fyndplats",
    "f2495eee": "Verktygsvagn 5 lådor, rostfri bänkskiva | Fyndplats",
    "1db06f83": "Verktygsskåp 133 cm på hjul med hålplatta | Fyndplats",
    "b920d526": "Röd verktygsvagn 113 cm med 16 lådor | Fyndplats",
    "d9965552": "Blå verktygsvagn 113 cm med 16 lådor | Fyndplats",
    "fc6fdd63": "Verktygsvagn 109 cm med 14 lådor | Fyndplats",
    "81c123fa": "Verktygsskåp 180 cm med tre låszoner | Fyndplats",
}

META = {
    "bc2e7191": "Svetsvagn 71 × 39 × 70 cm i stål med tre hyllplan, två "
                "säkerhetskedjor och fyra hjul. Tål 50 kg.",
    "beeada22": "Svart plåtskåp 75 × 33 × 110 cm med ventilerade dörrar, "
                "magnetlås och två hyllplan i 17 lägen. Tål 50 kg.",
    "1654dd75": "Verktygsvagn 96 × 33,5 × 75 cm med sju låsbara lådor och "
                "avtagbart sidoregal i tre plan. Tål 120 kg.",
    "f2495eee": "Verktygsvagn 65,5 × 34,5 × 76 cm med fem djupa lådor, "
                "rostfri bänkskiva och centrallås. Tål 80 kg.",
    "1db06f83": "Verktygsskåp på hjul, 69 × 33 × 133 cm med hålplatta, tre "
                "lådor och skåpdel med eget lås. Tål 80 kg.",
    "b920d526": "Röd verktygsvagn 61,5 × 33 × 113 cm i två delar med 16 "
                "låsbara lådor. Fyra nycklar ingår.",
    "d9965552": "Blå verktygsvagn 61,5 × 33 × 113 cm i två delar med 16 "
                "låsbara lådor. Fyra nycklar ingår.",
    "fc6fdd63": "Verktygsvagn i två delar, 109 cm hög med 14 lådor, hålvägg "
                "och sidohylla. Underskåpet tål 130 kg.",
    "81c123fa": "Verktygsskåp 75 × 40 × 180 cm i pulverlackerat stål med tre "
                "separat låsbara zoner. Tål 210 kg.",
}

SOKORD = {
    "bc2e7191": ["svetsvagn", "vagn för gasflaska", "svetsbord på hjul",
                 "verkstadsvagn"],
    "beeada22": ["plåtskåp", "metallskåp", "förvaringsskåp", "låsbart skåp"],
    "1654dd75": ["verktygsvagn", "verkstadsvagn", "verktygsvagn med lådor",
                 "verktygsvagn 7 lådor"],
    "f2495eee": ["verktygsvagn", "verktygsvagn 5 lådor", "verkstadsvagn",
                 "verktygsvagn med bänkskiva"],
    "1db06f83": ["verktygsskåp", "verktygsskåp på hjul", "hålplatta verktyg",
                 "verkstadsskåp"],
    "b920d526": ["verktygsvagn", "verktygsvagn röd", "verktygsvagn 16 lådor",
                 "verktygsvagn med överkista"],
    "d9965552": ["verktygsvagn", "verktygsvagn blå", "verktygsvagn 16 lådor",
                 "verktygsvagn med överkista"],
    "fc6fdd63": ["verktygsvagn", "verktygsvagn 14 lådor", "verktygsvagn röd",
                 "verkstadsvagn med hålvägg"],
    "81c123fa": ["verktygsskåp", "plåtskåp 180 cm", "verkstadsskåp",
                 "låsbart verktygsskåp"],
}

INTRO = {
    "bc2e7191": "En vagn som håller ihop svetsen, gasflaskan och det som hör "
                "till på ett och samma ställe. Det översta hyllplanet lutar "
                "något, så en svets står stadigt även när du rullar vagnen "
                "över en verkstadsgolvfog.",
    "beeada22": "Ett svart plåtskåp som varken är kontorsmöbel eller "
                "garageinredning utan fungerar på båda ställena. Dörrarna har "
                "ventilationsspringor, så det som står inne får luft utan att "
                "synas utifrån.",
    "1654dd75": "Nittiosex centimeter bred, och nästan en tredjedel av den "
                "bredden är ett sidoregal som går att skruva bort. Kvar står "
                "en sjulådors verkstadsvagn på 62 centimeter — du väljer själv "
                "vilken av de två vagnarna du vill ha.",
    "f2495eee": "Fem djupa lådor och en bänkskiva i rostfritt som tål att man "
                "lägger ifrån sig en het bit stål på den. Lådorna går på "
                "kullagrade skenor och har EVA-mattor i botten som håller "
                "verktygen på plats när vagnen rullar.",
    "1db06f83": "Hålplatta, lådor och skåp i en och samma pelare på hjul. "
                "Hålplattan tar det du vill ha framme, lådorna det du vill ha "
                "sorterat och skåpet det som är skrymmande — och lådorna och "
                "skåpet har var sitt lås.",
    "b920d526": "Sexton lådor fördelade på en överkista och ett underskåp som "
                "går att använda var för sig. Den röda plåten är lätt att se "
                "i en full verkstad, och handtaget sitter på 70 centimeters "
                "höjd så du drar vagnen utan att böja dig.",
    "d9965552": "Sexton lådor fördelade på en överkista och ett underskåp som "
                "går att använda var för sig. Den blå plåten är lätt att se i "
                "en full verkstad, och handtaget sitter på 70 centimeters "
                "höjd så du drar vagnen utan att böja dig.",
    "fc6fdd63": "Två delar som är byggda för att sitta ihop men fungerar var "
                "för sig: en bärbar överkista med lock och ett underskåp på "
                "hjul. Tillsammans blir de 109 centimeter höga och har "
                "fjorton lådor, en hålvägg på sidan och en sidohylla.",
    "81c123fa": "Etthundraåttio centimeter högt och uppdelat i tre zoner med "
                "var sitt lås: ett överskåp, en låda i midjehöjd och ett "
                "underskåp. Du kan alltså låsa in det värdefulla i en zon och "
                "låta resten stå öppet för den som ska jobba.",
}

RUBRIK = {
    "bc2e7191": "Tre plan och två kedjor",
    "beeada22": "Ventilerat, låsbart och justerbart",
    "1654dd75": "Sidoregalet går att ta bort",
    "f2495eee": "Rostfri skiva, fem djupa lådor",
    "1db06f83": "Hålplatta, lådor och skåp i ett",
    "b920d526": "Sexton lådor i två delar",
    "d9965552": "Sexton lådor i två delar",
    "fc6fdd63": "Fjorton lådor, hålvägg och lock",
    "81c123fa": "Tre zoner, tre lås",
}

PUNKTER = {
    "bc2e7191": [
        "Tre hyllplan: översta 45 × 28 centimeter och något lutande, "
        "mellersta 39 × 28 och nedersta 70 × 29 med 5 centimeters kant",
        "Två kedjor på 108 centimeter som håller gasflaskan mot ramen",
        "71 centimeter bred, 39 djup och 70 hög",
        "Fyra hjul, så vagnen rullar dit arbetet är",
        "Ram i stål med 1,2 millimeters plåt och pulverlackerad yta",
        "Tål 50 kilo sammanlagt",
    ],
    "beeada22": [
        "Två dörrar i plåt med ventilationsspringor – innehållet får luft utan "
        "att synas",
        "Magnetlås i dörrarna, så de går igen med ett tryck",
        "Två hyllplan som kan flyttas mellan 17 fasta lägen",
        "Tål 10 kilo per hyllplan och 50 kilo sammanlagt",
        "75 centimeter bred, 33 djup och 110 hög",
        "Justerbara fötter och 7,7 centimeters frigång mot golvet",
        "Kan skruvas fast i väggen om du vill ha den extra tryggheten",
    ],
    "1654dd75": [
        "Sju lådor: de grunda 4 centimeter djupa invändigt, de stora 7, alla "
        "50 × 28 centimeter",
        "Sidoregalet är avtagbart och har tre fack på 26,5 × 32,5 centimeter "
        "med 30 centimeter mellan planen",
        "Med regalet är vagnen 96 centimeter bred, utan det 62",
        "Ett centrallås stänger alla sju lådorna, och två nycklar följer med",
        "Två fasta hjul och två länkhjul med broms, 10 centimeter i diameter",
        "Tål 120 kilo sammanlagt, 10 kilo per låda och 10 kilo per hyllplan",
        "Kullagrade skenor och EVA-mattor i lådbottnarna",
    ],
    "f2495eee": [
        "Fem djupa lådor, invändigt 51 × 27 centimeter och 10 centimeter höga",
        "Bänkskiva i rostfritt stål – stommen är pulverlackerat stål",
        "Ett centrallås stänger alla fem lådorna samtidigt",
        "Fyra hjul varav två med broms, plus handtag på sidan",
        "Tål 80 kilo sammanlagt, 30 kilo på bänkskivan och 10 kilo per låda",
        "Två vagnar kan kopplas ihop till en längre arbetsyta",
        "65,5 centimeter bred, 34,5 djup och 76 hög",
    ],
    "1db06f83": [
        "Hålplatta på 61,5 × 58 centimeter överst för det du vill ha framme",
        "Tre lådor invändigt 51 × 27 centimeter och 6,5 centimeter höga",
        "Skåpdel med två dörrar, invändigt 51 × 30 × 30 centimeter, och ett "
        "hyllplan som kan flyttas mellan tre lägen",
        "Separata lås till lådorna och till skåpet",
        "Kabelgenomföring på 5 centimeter i diameter",
        "Fyra hjul varav två med broms, och 9 centimeters frigång mot golvet",
        "Tål 80 kilo sammanlagt, 20 kilo på arbetsytan, 8 kilo per låda och "
        "5 kilo per krok på hålplattan",
    ],
    "b920d526": [
        "Sexton lådor: sex små på 15 × 22,5 centimeter, fyra mellanlådor och "
        "sex stora på 51 centimeters bredd",
        "Överkistan är 60 × 25,5 × 38,5 centimeter och underskåpet "
        "61,5 × 33 × 76 – de går att använda var för sig",
        "Båda delarna låses, och fyra nycklar följer med, två till varje lås",
        "Rundhandtag på 70 centimeters höjd",
        "Fyra hjul: två fasta och två som både svänger och låses",
        "Tål 10 kilo i en liten låda och 20 kilo i en mellan- eller stor låda",
        "Stålplåt i rött, 41,7 kilo sammanlagt",
    ],
    "d9965552": [
        "Sexton lådor: sex små på 15 × 22,5 centimeter, fyra mellanlådor och "
        "sex stora på 51 centimeters bredd",
        "Överkistan är 60 × 25,5 × 38,5 centimeter och underskåpet "
        "61,5 × 33 × 76 – de går att använda var för sig",
        "Båda delarna låses, och fyra nycklar följer med, två till varje lås",
        "Rundhandtag på 70 centimeters höjd",
        "Fyra hjul: två fasta och två som både svänger och låses",
        "Tål 10 kilo i en liten låda och 20 kilo i en mellan- eller stor låda",
        "Stålplåt i blått, 41,7 kilo sammanlagt",
    ],
    "fc6fdd63": [
        "Fjorton lådor: nio i överkistan och fem i underskåpet",
        "Under överkistans lock finns ett öppet fack på 59,5 × 23,5 centimeter",
        "Överkistan är 60 × 26 × 34 centimeter och underskåpet 76 × 33 × 75 – "
        "tillsammans 109 centimeter höga",
        "Hålvägg på sidan och en sidohylla på 31,5 × 7 centimeter",
        "Båda delarna låses var för sig, och fyra nycklar följer med",
        "EVA-mattor i lådorna suger upp olja och håller verktygen still",
        "Tål 130 kilo i underskåpet, 50 kilo i överkistan, 15 kilo i en stor "
        "låda och 5 kilo i en liten",
    ],
    "81c123fa": [
        "Tre zoner med var sitt lås: överskåp, låda och underskåp",
        "Lådan är 68 centimeter bred och 31 djup invändigt",
        "Över- och underskåpet är 74 centimeter höga och 37,5 djupa invändigt",
        "Uttagbara hyllplan som flyttas i steg om 1,5 centimeter",
        "Tål 210 kilo sammanlagt, 50 kilo per hyllplan och 10 kilo i lådan",
        "Pulverlackerat stål, 75 × 40 × 180 centimeter",
    ],
}

KORSLANK = {
    "bc2e7191": [("verkstadsvagn-metall-70-cm-tre-plan",
                  "Behöver du inte bära gasflaska? Se verkstadsvagnen i "
                  "metall med tre plan"),
                 ("1db06f83",
                  "Vill du ha lådor och skåp i stället? Se verktygsskåpet på "
                  "hjul med hålplatta")],
    "beeada22": [("81c123fa",
                  "Behöver du något högre? Se verktygsskåpet på 180 "
                  "centimeter med tre låszoner"),
                 ("verktygsskap-med-overskap",
                  "Vill du ha lådor i stället för hyllplan? Se "
                  "verktygsskåpet med överskåp")],
    "1654dd75": [("f2495eee",
                  "Räcker fem lådor och en rostfri skiva? Se den smalare "
                  "verktygsvagnen"),
                 ("verktygsvagn-rod-7-lador",
                  "Vill du ha samma lådantal i rött? Se den röda "
                  "verktygsvagnen med sju lådor")],
    "f2495eee": [("1654dd75",
                  "Behöver du sju lådor och ett sidoregal? Se den bredare "
                  "verktygsvagnen"),
                 ("verktygsvagn-svart-5-lador",
                  "Vill du ha samma lådantal billigare? Se den svarta "
                  "verktygsvagnen med fem lådor")],
    "1db06f83": [("verktygsskap-131-cm-rod",
                  "Vill du ha en överkista i stället för hålplatta? Se det "
                  "röda verktygsskåpet på 131 centimeter"),
                 ("f2495eee",
                  "Räcker en vagn i bänkhöjd? Se verktygsvagnen med rostfri "
                  "bänkskiva")],
    "b920d526": [("d9965552", "Samma vagn i blått utförande"),
                 ("verktygsskap-svart-82-cm",
                  "Behöver du bara underskåpet? Se det svarta verktygsskåpet "
                  "på 82 centimeter")],
    "d9965552": [("b920d526", "Samma vagn i rött utförande"),
                 ("verktygsskap-bla-82-cm",
                  "Behöver du bara underskåpet? Se det blå verktygsskåpet på "
                  "82 centimeter")],
    "fc6fdd63": [("b920d526",
                  "Vill du ha två lådor till och en smalare vagn? Se den "
                  "röda vagnen med 16 lådor"),
                 ("verktygsvagn-overkista",
                  "Behöver du bara en överkista? Se den fristående "
                  "överkistan")],
    "81c123fa": [("beeada22",
                  "Räcker 110 centimeter? Se det svarta plåtskåpet med "
                  "ventilerade dörrar"),
                 ("1db06f83",
                  "Vill du kunna rulla skåpet? Se verktygsskåpet på hjul med "
                  "hålplatta")],
}

SPEC = {
    "bc2e7191": [
        ("Mått", "71 × 39 × 70 cm (bredd × djup × höjd)"),
        ("Hyllplan", "Tre – 45 × 28 cm (övre, lutande), 39 × 28 cm "
                     "(mellersta), 70 × 29 cm med 5 cm kant (nedre)"),
        ("Kedjor", "Två stycken, 108 cm"),
        ("Maxlast", "50 kg totalt"),
        ("Material", "Stål med 1,2 mm plåt, järn och gummi"),
        ("Färg", "Svart"),
        ("Hjul", "Fyra"),
        ("Vikt", "12,7 kg"),
        ("Paketmått", "79 × 36 × 9 cm"),
        ("Ingår", "Svetsvagn och monteringsanvisning"),
        ("Montering", "Krävs"),
    ],
    "beeada22": [
        ("Mått", "75 × 33 × 110 cm (bredd × djup × höjd)"),
        ("Dörrar", "Två i plåt med ventilationsspringor, magnetlås"),
        ("Hyllplan", "Två justerbara, 17 fasta lägen"),
        ("Maxlast", "10 kg per hyllplan, 50 kg totalt"),
        ("Frigång", "7,7 cm mot golvet, justerbara fötter"),
        ("Material", "Metall"),
        ("Färg", "Svart"),
        ("Vikt", "24 kg"),
        ("Paketmått", "47 × 20 × 117,5 cm"),
        ("Ingår", "Skåp och monteringsanvisning"),
        ("Montering", "Krävs"),
    ],
    "1654dd75": [
        ("Mått", "96 × 33,5 × 75 cm med sidoregal, 62 × 33,5 × 64 cm utan "
                 "(bredd × djup × höjd)"),
        ("Lådor", "Sju – grunda 50 × 28 × 4 cm, stora 50 × 28 × 7 cm"),
        ("Sidoregal", "Avtagbart, tre fack på 26,5 × 32,5 × 5 cm, 30 cm "
                      "mellan planen"),
        ("Lås", "Centrallås för alla sju lådorna, två nycklar ingår"),
        ("Maxlast", "120 kg totalt, 10 kg per låda, 10 kg per hyllplan"),
        ("Hjul", "Två fasta och två länkhjul med broms, Ø 10 cm"),
        ("Frigång", "12 cm mot golvet"),
        ("Material", "Pulverlackerat stål med EVA-mattor"),
        ("Färg", "Svart"),
        ("Vikt", "29,7 kg"),
        ("Paketmått", "68 × 39,5 × 73 cm"),
        ("Ingår", "Verktygsvagn, två nycklar och handbok"),
        ("Montering", "Krävs"),
    ],
    "f2495eee": [
        ("Mått", "65,5 × 34,5 × 76 cm (bredd × djup × höjd)"),
        ("Skåpdel", "61,6 × 33 × 66 cm utan hjul, handtag och bänkskiva"),
        ("Lådor", "Fem djupa, invändigt 51 × 27 × 10 cm"),
        ("Bänkskiva", "Rostfritt stål"),
        ("Lås", "Centrallås för alla fem lådorna"),
        ("Maxlast", "80 kg totalt, 30 kg på bänkskivan, 10 kg per låda"),
        ("Hjul", "Fyra, två med broms"),
        ("Material", "Pulverlackerat stål, bänkskiva i rostfritt"),
        ("Färg", "Svart med skiva i silverton"),
        ("Vikt", "25 kg"),
        ("Paketmått", "72,5 × 41,5 × 73,5 cm"),
        ("Ingår", "Verktygsvagn och handbok"),
        ("Montering", "Krävs"),
    ],
    "1db06f83": [
        ("Mått", "69 × 33 × 133 cm (bredd × djup × höjd)"),
        ("Hålplatta", "61,5 cm bred och 58 cm hög"),
        ("Skåpdel", "66,5 × 33 × 76 cm med hjul och handtag"),
        ("Lådor", "Tre, invändigt 51 × 27 × 6,5 cm"),
        ("Skåp invändigt", "51 × 30 × 30 cm, hyllplan i tre lägen"),
        ("Lås", "Separata lås till lådorna och till skåpet"),
        ("Kabelhål", "Ø 5 cm"),
        ("Maxlast", "80 kg totalt, 20 kg arbetsyta, 8 kg per låda, 5 kg per "
                    "krok på hålplattan"),
        ("Hjul", "Fyra, två med broms"),
        ("Material", "Pulverlackerat stål"),
        ("Färg", "Svart"),
        ("Vikt", "28 kg"),
        ("Paketmått", "67,5 × 40 × 88 cm"),
        ("Ingår", "Verktygsskåp och monteringsanvisning"),
        ("Montering", "Krävs"),
    ],
    "b920d526": [
        ("Mått", "61,5 × 33 × 113 cm (bredd × djup × höjd)"),
        ("Överkista", "60 × 25,5 × 38,5 cm"),
        ("Underskåp", "61,5 × 33 × 76 cm"),
        ("Lådor", "Sexton – nio i överkistan, sju i underskåpet"),
        ("Låda invändigt", "15 × 22,5 × 4 cm (liten), 51 × 22,5 × 8,5 cm "
                           "(stor i kistan), 51 × 27,5 × 8,5 cm (stor i skåpet)"),
        ("Lås", "Ett per del, fyra nycklar ingår"),
        ("Maxlast", "10 kg liten låda, 20 kg mellan- och stor låda"),
        ("Handtag", "Rundhandtag på 70 cm höjd"),
        ("Hjul", "Fyra – två fasta, två svängbara med lås"),
        ("Material", "Stålplåt"),
        ("Färg", "Röd"),
        ("Vikt", "41,7 kg"),
        ("Paketmått", "68 × 38,5 × 73 cm"),
        ("Ingår", "Överkista, underskåp och fyra nycklar"),
        ("Montering", "Krävs"),
    ],
    "d9965552": [
        ("Mått", "61,5 × 33 × 113 cm (bredd × djup × höjd)"),
        ("Överkista", "60 × 25,5 × 38,5 cm"),
        ("Underskåp", "61,5 × 33 × 76 cm"),
        ("Lådor", "Sexton – nio i överkistan, sju i underskåpet"),
        ("Låda invändigt", "15 × 22,5 × 4 cm (liten), 51 × 22,5 × 8,5 cm "
                           "(stor i kistan), 51 × 27,5 × 8,5 cm (stor i skåpet)"),
        ("Lås", "Ett per del, fyra nycklar ingår"),
        ("Maxlast", "10 kg liten låda, 20 kg mellan- och stor låda"),
        ("Handtag", "Rundhandtag på 70 cm höjd"),
        ("Hjul", "Fyra – två fasta, två svängbara med lås"),
        ("Material", "Stålplåt"),
        ("Färg", "Blå"),
        ("Vikt", "41,7 kg"),
        ("Paketmått", "68 × 38,5 × 73 cm"),
        ("Ingår", "Överkista, underskåp och fyra nycklar"),
        ("Montering", "Krävs"),
    ],
    "fc6fdd63": [
        ("Mått", "76 × 33 × 109 cm ihopsatt (bredd × djup × höjd)"),
        ("Överkista", "60 × 26 × 34 cm"),
        ("Underskåp", "76 × 33 × 75 cm"),
        ("Lådor", "Fjorton – nio i överkistan, fem i underskåpet"),
        ("Lockfack", "59,5 × 23,5 × 6 cm under locket"),
        ("Låda invändigt", "15 × 22 × 3 cm (liten), 50,5 × 22 × 7,5 cm (stor "
                           "i kistan), 51 × 27,3 × 10,4 cm (underskåpet)"),
        ("Sidohylla", "31,5 × 7 × 6,5 cm, plus hålvägg"),
        ("Lås", "Ett per del, fyra nycklar ingår"),
        ("Maxlast", "130 kg underskåp, 50 kg överkista, 15 kg stor låda, "
                    "5 kg liten låda"),
        ("Hjul", "Fyra, två med broms"),
        ("Material", "Pulverlackerat stål med EVA-mattor"),
        ("Färg", "Röd med svart"),
        ("Vikt", "41,1 kg"),
        ("Paketmått", "71,5 × 40 × 84 cm"),
        ("Ingår", "Överkista, rullskåp, fyra nycklar och handbok"),
        ("Montering", "Krävs"),
    ],
    "81c123fa": [
        ("Mått", "75 × 40 × 180 cm (bredd × djup × höjd)"),
        ("Zoner", "Tre – överskåp, låda och underskåp, var och en låsbar"),
        ("Låda invändigt", "68 × 31 × 8 cm"),
        ("Skåp invändigt", "37,5 cm djupt och 74 cm högt"),
        ("Hyllplan", "Uttagbara, flyttas i steg om 1,5 cm"),
        ("Lås", "Tre separata, ett per zon"),
        ("Maxlast", "210 kg totalt, 50 kg per hyllplan, 10 kg i lådan"),
        ("Material", "Pulverlackerat stål"),
        ("Färg", "Svart"),
        ("Vikt", "36,2 kg"),
        ("Paketmått", "193 × 50,5 × 17 cm"),
        ("Ingår", "Verktygsskåp och bruksanvisning"),
        ("Montering", "Krävs"),
    ],
}

SKOTSEL = {
    "bc2e7191": "Torka av plåten med en fuktad trasa och milt rengöringsmedel. "
                "Lacken skyddar stålet så länge den är hel, så bättra på ett "
                "djupt jack med lackstift innan kanten hinner rosta. Spänn "
                "kedjorna runt flaskan innan du rullar vagnen, och lägg det "
                "tyngsta på det nedersta planet – det är både bredast och har "
                "kant.",
    "beeada22": "Torka av med en fuktad trasa och milt rengöringsmedel. Lacken "
                "skyddar stålet så länge den är hel; bättra på jack med "
                "lackstift. Skruva fötterna så att skåpet står stadigt innan "
                "du lastar det, och lägg tyngsta innehållet på det nedersta "
                "hyllplanet. Håll dig under 10 kilo per plan.",
    "1654dd75": "Torka av plåten med en fuktad trasa och milt rengöringsmedel, "
                "och bättra på jack i lacken med lackstift. EVA-mattorna går "
                "att lyfta ur och skölja. Lås de två bromsade hjulen när du "
                "drar ut en full låda, och lasta de nedre lådorna tyngst – "
                "en vagn med tyngdpunkten högt blir ostadig när lådan är ute.",
    "f2495eee": "Torka av bänkskivan med en fuktad trasa; rostfritt tål väta "
                "men inte stålull, som lämnar partiklar som rostar. Stommens "
                "lack skyddar så länge den är hel. Lås de två bromsade hjulen "
                "innan du drar ut en låda, och lasta nedifrån och upp.",
    "1db06f83": "Torka av med en fuktad trasa och milt rengöringsmedel, och "
                "bättra på jack i lacken med lackstift. Krokarna på hålplattan "
                "tål 5 kilo var – den som hänger en slipmaskin där belastar "
                "en krok gjord för en tång. Lås hjulen innan du drar ut en "
                "låda, och kontrollera skruvarna i hålplattans fäste efter "
                "första veckans användning.",
    "b920d526": "Torka av plåten med en fuktad trasa och milt rengöringsmedel; "
                "lacken skyddar stålet så länge den är hel. Vagnen väger 41,7 "
                "kilo tom, så lyft av överkistan innan du bär den i trappa. "
                "Lås de två svängbara hjulen när du drar ut en full låda, och "
                "lasta underskåpet tyngre än kistan.",
    "d9965552": "Torka av plåten med en fuktad trasa och milt rengöringsmedel; "
                "lacken skyddar stålet så länge den är hel. Vagnen väger 41,7 "
                "kilo tom, så lyft av överkistan innan du bär den i trappa. "
                "Lås de två svängbara hjulen när du drar ut en full låda, och "
                "lasta underskåpet tyngre än kistan.",
    "fc6fdd63": "Torka av med en fuktad trasa och milt rengöringsmedel, och "
                "bättra på jack i lacken med lackstift. EVA-mattorna suger "
                "upp olja och går att lyfta ur och torka av. Underskåpet tål "
                "130 kilo och överkistan 50 – lasta därför tungt lågt. Lås de "
                "bromsade hjulen innan du drar ut en låda.",
    "81c123fa": "Torka av den pulverlackerade ytan med en fuktad trasa; den "
                "är slät och samlar varken olja eller damm i skarvar. Bättra "
                "på ett djupt jack med lackstift. Skåpet är 180 centimeter "
                "högt, så lägg det tyngsta i underskåpet och det lätta överst "
                "– ett högt skåp med tyngden upptill är ostadigt när båda "
                "dörrarna står öppna.",
}

FAQ = {
    "bc2e7191": [
        ("Ingår svetsen och gasflaskan?",
         "Nej. I paketet finns vagnen och en monteringsanvisning. Utrustningen "
         "på bilderna visar hur vagnen används."),
        ("Hur stor gasflaska får plats?",
         "Det nedersta planet är 70 × 29 centimeter med 5 centimeters kant, "
         "och kedjorna är 108 centimeter långa. Mät din flaska mot de talen."),
        ("Varför lutar det översta planet?",
         "För att en svets ska stå stadigt och luta något mot dig när du "
         "läser av den."),
    ],
    "beeada22": [
        ("Vad är springorna i dörrarna till för?",
         "De ventilerar skåpet. Det du ställer in får luft utan att synas "
         "utifrån – bra för verktyg som annars samlar fukt."),
        ("Kan hyllplanen flyttas?",
         "Ja, båda två, mellan 17 fasta lägen. Varje plan tål 10 kilo."),
        ("Måste skåpet skruvas i väggen?",
         "Nej, det står på egna justerbara fötter. Det går att skruva fast om "
         "du vill ha extra trygghet."),
    ],
    "1654dd75": [
        ("Går sidoregalet verkligen att ta bort?",
         "Ja. Med regalet är vagnen 96 centimeter bred, utan det 62. Det är "
         "samma vagn i två bredder."),
        ("Låses lådorna var för sig?",
         "Nej, ett centrallås stänger alla sju samtidigt. Två nycklar följer "
         "med."),
        ("Hur mycket tål ett fack i regalet?",
         "10 kilo, samma som en låda. Hela vagnen tål 120 kilo."),
    ],
    "f2495eee": [
        ("Är hela vagnen i rostfritt?",
         "Nej, det är bänkskivan som är rostfri. Stommen är pulverlackerat "
         "stål."),
        ("Kan jag ställa två vagnar bredvid varandra?",
         "Ja, de går att koppla ihop till en längre arbetsyta."),
        ("Hur mycket tål bänkskivan?",
         "30 kilo. Hela vagnen tål 80 kilo och varje låda 10."),
    ],
    "1db06f83": [
        ("Kan delarna användas var för sig?",
         "Ja. Hålplattan, lådkistan och skåpet är separata delar som skruvas "
         "ihop till en pelare."),
        ("Hur mycket tål en krok på hålplattan?",
         "5 kilo per krok. Arbetsytan tål 20 kilo och varje låda 8."),
        ("Har lådorna och skåpet samma lås?",
         "Nej, de har var sitt. Du kan alltså låsa lådorna och lämna skåpet "
         "öppet."),
    ],
    "b920d526": [
        ("Går delarna att använda var för sig?",
         "Ja. Överkistan är 60 × 25,5 × 38,5 centimeter och underskåpet "
         "61,5 × 33 × 76, och båda är låsbara."),
        ("Hur många nycklar följer med?",
         "Fyra – två till varje lås."),
        ("Finns den i någon annan färg?",
         "Ja, samma vagn finns i blått utförande. Länken står under "
         "beskrivningen."),
    ],
    "d9965552": [
        ("Går delarna att använda var för sig?",
         "Ja. Överkistan är 60 × 25,5 × 38,5 centimeter och underskåpet "
         "61,5 × 33 × 76, och båda är låsbara."),
        ("Hur många nycklar följer med?",
         "Fyra – två till varje lås."),
        ("Finns den i någon annan färg?",
         "Ja, samma vagn finns i rött utförande. Länken står under "
         "beskrivningen."),
    ],
    "fc6fdd63": [
        ("Hur hög är den ihopsatt?",
         "109 centimeter – överkistan är 34 och underskåpet 75."),
        ("Vad är lockfacket?",
         "Överkistans lock går att fälla upp, och under det ligger ett öppet "
         "fack på 59,5 × 23,5 centimeter."),
        ("Hur mycket tål underskåpet?",
         "130 kilo. Överkistan tål 50, en stor låda 15 och en liten 5."),
    ],
    "81c123fa": [
        ("Kan zonerna låsas var för sig?",
         "Ja, alla tre zonerna har egna lås. Du kan alltså låsa in det "
         "värdefulla och lämna resten öppet."),
        ("Hur höga saker får plats?",
         "Både över- och underskåpet är 74 centimeter höga invändigt, och "
         "hyllplanen går att ta ut helt."),
        ("Hur ska skåpet lastas?",
         "Tyngst längst ned. Skåpet är 180 centimeter högt, så ett tungt "
         "överskåp gör det ostadigt när båda dörrarna står öppna."),
    ],
}


def bygg(pid):
    ut = [f"<p>{INTRO[pid]}</p>"]
    ut.append(f"<h2>{RUBRIK[pid]}</h2><ul>")
    ut += [f"<li>{p}</li>" for p in PUNKTER[pid]]
    ut.append("</ul>")

    # ☠️ KORSLÄNKARNA LIGGER FÖRE FÖRSTA FLIKRUBRIKEN, med flit.
    lankar = " ".join(
        f'<a href="https://www.fyndplats.se/produkt/{_slug(m)}">{t}</a>.'
        for m, t in KORSLANK[pid])
    ut.append("<h2>Passar inte den här?</h2>")
    ut.append(f"<p>{lankar}</p>")

    ut.append("<h2>Tekniska specifikationer</h2><ul>")
    ut += [f"<li><strong>{e}:</strong> {v}</li>" for e, v in SPEC[pid]]
    ut.append("</ul>")

    # ☠️ RUBRIKEN MÅSTE HETA "Användning och skötsel" — ORDAGRANT.
    ut.append("<h2>Användning och skötsel</h2>")
    ut.append(f"<p>{SKOTSEL[pid]}</p>")

    ut.append("<h2>Vanliga frågor</h2>")
    for f, s in FAQ[pid]:
        ut.append(f"<p><strong>{f}</strong></p><p>{s}</p>")
    return "".join(ut)


if __name__ == "__main__":
    import json
    import re

    def _text(html):
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()

    d = {}
    for pid in NAMN:
        html = bygg(pid)
        t = _text(html)
        d[pid] = {"namn": NAMN[pid], "slug": SLUG[pid], "titel": TITEL[pid],
                  "meta": META[pid], "sokord": SOKORD[pid], "sku": SKU[pid],
                  "html": html, "ord": len(t.split()),
                  "synliga_tecken": len(t), "ordsumma": sum(ord(c) for c in t)}
    json.dump(d, open("skrivning.json", "w"), ensure_ascii=False, indent=1)
    for pid, v in d.items():
        print(f"{pid}  {v['ord']:4d} ord  {v['synliga_tecken']:5d} tecken  "
              f"titel {len(v['titel']):3d}  meta {len(v['meta']):3d}  "
              f"namn {len(v['namn']):3d}  sku {len(v['sku']):2d}")
