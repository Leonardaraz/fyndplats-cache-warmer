# -*- coding: utf-8 -*-
"""Runda 139 — all kundtext, byggd i FIL och grindad före skrivning.

☠️ TEXTEN SKRIVS ALDRIG INLINE I ETT API-ANROP. Uppmätt 2026-09-04: fem
   produkter skrivna inline gav NIO fel som nådde Wix; tre skrivna via fil
   och grind gav noll.

☠️ SPEC-TABELLEN BYGGS UR TYSKANS `Technische Daten`. Den svenska importraden
   säger `Material: Polyester` på fem av tio där källan listar tre material.

☠️ ORDET KATTLÅDA FÅR INTE FÖREKOMMA på `4faf9f4c` och `90573e36`.
   Leverantörens spec-etikett säger `Katzenklo`/`Katzentoilette`, men titeln
   och ritningen säger HÅLA — och en Ø33 × 31 cm box med 20 × 22 cm öppning
   två meter upp på en takspänd stolpe är ingen kattlåda.

☠️ Ingen CE-märkning. Det finns ingen CE-direktivsfamilj för kattmöbler.
☠️ `Artikelnummer` är ALDRIG en etikett här.
"""
import os as _os
import sys as _sys

_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import grindar as _G                                             # noqa: E402
import matt as _M                                                # noqa: E402

BAS = "https://www.fyndplats.se"
SLUG = dict(_M.SLUG)
SKU = {pid: "FP-" + _G.sku_bas(slug) for pid, slug in SLUG.items()}

NAMN = {
    "1467588a": "Klösträd 92 cm i mörkgrått – tjock sisalstam, bädd och hängande boll",
    "27b607dc": "Klöspelare 80 cm i ekfärg och krämvitt – 76 cm sisal att sträcka sig i",
    "3a96740e": "Klösträd 153 cm i krämvitt och kaffebrunt – håla, korg och hängbädd",
    "3addfbf8": "Klösträd 76 cm i ljusgrått – rund bädd, klösbräda och jutekudde",
    "4faf9f4c": "Klösträd 113 cm i ljusgrått – håla, hängmatta, bädd och ramp",
    "8d074911": "Väggklösträd i fyra delar – molnhyllor, håla, stege och klösstolpe",
    "90573e36": "Klösträd 220–240 cm i grönt och rosa – spänns mellan golv och tak",
    "a4d8feca": "Klöstunna 60 cm i naturbrunt – två våningar, ingen montering",
    "b04b5375": "Väggklösträd 73 cm i beige – två hyllplan, hängmatta och tre klivsteg",
    "b813d037": "Klösträd 104 cm i grått – fyra plan med hus och kattöron",
}

TITEL = {
    "1467588a": "Klösträd 92 cm mörkgrått – tjock sisalstam | Fyndplats",
    "27b607dc": "Klöspelare 80 cm i ekfärg – 76 cm sisal | Fyndplats",
    "3a96740e": "Klösträd 153 cm – håla, korg och hängbädd | Fyndplats",
    "3addfbf8": "Klösträd 76 cm ljusgrått – bädd och klösbräda | Fyndplats",
    "4faf9f4c": "Klösträd 113 cm – håla, hängmatta och ramp | Fyndplats",
    "8d074911": "Väggklösträd 4 delar – molnhyllor och håla | Fyndplats",
    "90573e36": "Klösträd 220–240 cm grönt – golv till tak | Fyndplats",
    "a4d8feca": "Klöstunna 60 cm naturbrun – två våningar | Fyndplats",
    "b04b5375": "Väggklösträd 73 cm beige – tre klivsteg | Fyndplats",
    "b813d037": "Klösträd 104 cm grått – fyra plan med hus | Fyndplats",
}

META = {
    "1467588a": "Klösträd 92 cm i mörkgrått och krämvitt. Stammen är Ø13,5 cm och "
                "sisallindad hela vägen, med en bädd på Ø41 cm överst. För katter "
                "upp till 5 kg. Bas 48 × 48 cm.",
    "27b607dc": "Klöspelare 80 cm i ekfärg och krämvitt med 76 cm sammanhängande "
                "sisalyta och hängande boll. Basen är 38 × 38 cm. För katter upp "
                "till 5 kg.",
    "3a96740e": "Klösträd 153 cm i krämvitt och kaffebrunt med sluten håla, rund korg "
                "och U-formad hängbädd. Golvytan är 65 × 50 cm. För katter upp till "
                "4,5 kg.",
    "3addfbf8": "Klösträd 76 cm i ljusgrått med rund bädd på Ø34 cm, klösbräda på "
                "43 × 30 cm och jutekudde. Basen mäter 60 × 30 cm. För katter upp "
                "till 5 kg.",
    "4faf9f4c": "Klösträd 113 cm i ljusgrått med sluten håla, hängmatta, toppbädd och "
                "ramp. Bär 15 kg totalt. Golvyta 60 × 40 cm, för katter upp till 5 kg.",
    "8d074911": "Väggmonterat klösträd i fyra delar: molnformade hyllplan, sluten "
                "håla, mjuk stege och klösstolpe på 84 cm. Tar ingen golvyta. För "
                "katter upp till 5 kg styck.",
    "90573e36": "Klösträd som spänns mellan golv och tak, ställbart 220–240 cm. Håla, "
                "hängmatta, ramp och tippskyddsrem. Tar 30 × 25 cm golvyta. För "
                "katter upp till 5 kg.",
    "a4d8feca": "Klöstunna Ø35 × 60 cm i naturbrun sisal med två rum innanför. Bär "
                "10 kg och behöver ingen montering – den ställs bara på golvet.",
    "b04b5375": "Väggklösträd i beige och krämvitt: en tvåvåningsdel på 40 × 28 × 73 cm "
                "med sisalstam och hängmatta, plus tre klivsteg. Tar ingen golvyta.",
    "b813d037": "Klösträd 104 cm i grått med fyra plan, slutet hus på Ø30 cm och "
                "toppbädd med kattöron. Bär 30 kg totalt, för katter upp till 4,5 kg.",
}

SOKORD = {
    "1467588a": ["klösträd", "klösstam", "sisal"],
    "27b607dc": ["klöspelare", "klösstolpe", "sisal"],
    "3a96740e": ["klösträd", "katthåla", "hängmatta katt"],
    "3addfbf8": ["klösträd", "kattbädd", "klösbräda"],
    "4faf9f4c": ["klösträd", "katthåla", "kattramp"],
    "8d074911": ["väggklösträd", "kattylla vägg", "klösstolpe"],
    "90573e36": ["klösträd golv till tak", "takspänt klösträd", "katthåla"],
    "a4d8feca": ["klöstunna", "kattgrotta", "sisal"],
    "b04b5375": ["väggklösträd", "klivsteg katt", "hängmatta katt"],
    "b813d037": ["klösträd", "katthus", "kattbädd"],
}

INTRO = {
    "1467588a": "Ett klösträd på 92 cm där stammen är själva poängen: Ø13,5 cm grov "
                "och lindad med sisal hela vägen, så katten får något att verkligen "
                "ta i. Överst sitter en bädd på Ø41 cm med kant runt om, och på "
                "mellanplanet lutar en klösbräda mot stammen. Basen mäter "
                "48 × 48 cm. För katter upp till 5 kg.",
    "27b607dc": "En klöspelare på 80 cm med en sammanhängande sisalyta på 76 cm — "
                "hela höjden utom topplattan. Den är gjord för katten som klöser "
                "stående och sträcker sig, inte för den som vill ligga högt: överst "
                "finns bara en liten platta på 17,5 × 17,5 cm och en hängande boll. "
                "Basen är 38 × 38 cm. För katter upp till 5 kg.",
    "3a96740e": "Ett klösträd på 153 cm med tre sätt att ligga: en sluten håla på "
                "30 × 25 cm, en rund korg på ena sidan och en U-formad hängbädd "
                "mellan två stolpar längst ner. Stammarna är Ø7,1 cm och lindade "
                "med sisal nedtill. Golvytan är 65 × 50 cm, och trädet väger 14 kg. "
                "För katter upp till 4,5 kg.",
    "3addfbf8": "Ett lågt klösträd på 76 cm för katten som hellre ligger nära golvet. "
                "Bädden är rund på Ø34 cm och vilar i ett U-format ställ, andra "
                "planet har ett hål på Ø15,5 cm att kika genom, och klösbrädan på "
                "43 × 30 cm lutar mot sidan. Basen mäter 60 × 30 cm. För katter upp "
                "till 5 kg.",
    "4faf9f4c": "Ett klösträd på 113 cm med tre liggplatser på olika höjd: en sluten "
                "håla på 40 × 30 × 27 cm med en öppning på 19 × 19 cm, en hängmatta "
                "på Ø30 cm och en toppbädd på Ø31,5 cm med kattöron. En ramp på "
                "38 × 17 cm leder upp till hålan. Trädet bär 15 kg totalt och tar "
                "60 × 40 cm av golvet.",
    "8d074911": "Ett väggmonterat klösträd i fyra delar som du placerar själv: en "
                "kattbädd på 40 × 30 cm, en molnformad klösbräda på 40 × 30 cm, en "
                "klösstolpe på 84 cm med tre plan och en sluten håla på 30 × 30 cm "
                "med mjuk stege. Eftersom delarna sätts upp var för sig bestämmer du "
                "hur rutten går uppför väggen — och hela möbeln tar noll golvyta.",
    "90573e36": "Ett klösträd som inte står på golvet utan spänns mellan golv och "
                "tak, ställbart mellan 220 och 240 cm. En sluten håla på Ø33 × 31 cm "
                "sitter nedtill med en öppning på 20 × 22 cm, och ovanför den en "
                "ramp, en hängmatta och en rund hoppyta på Ø30 cm. Fotplattan tar "
                "bara 30 × 25 cm av golvet.",
    "a4d8feca": "En klöstunna på Ø35 × 60 cm klädd i sisal utanpå och plysch inuti. "
                "Två rum ligger ovanpå varandra — det nedre Ø33 × 27 cm, det övre "
                "Ø33 × 24 cm — och katten går in genom en öppning på Ø17 cm. "
                "Toppen är en liggyta. Tunnan bär 10 kg och behöver ingen montering.",
    "b04b5375": "Ett väggklösträd i beige och krämvitt där huvuddelen är en "
                "tvåvåningsdel på 40 × 28 × 73 cm: två hyllplan med rundade kanter, "
                "en sisallindad stam emellan och en hängmatta på Ø30 cm på sidan. "
                "Till det hör tre fristående klivsteg på Ø20 × 32 cm som du sätter "
                "upp där du vill ha dem.",
    "b813d037": "Ett klösträd på 104 cm i grått med fyra plan ovanpå varandra: en "
                "rund bas på Ø48 cm, ett mellanplan på Ø30 cm, ett slutet hus på "
                "Ø30 × 25 cm och överst en bädd på Ø32 cm med kattöron. En "
                "sisallindad stolpe går längs hela höjden. Bär 30 kg totalt.",
}

RUBRIK = {p: "Det här får du" for p in NAMN}

PUNKTER = {
    "1467588a": [
        "Höjd 92 cm på en bas som mäter 48 × 48 cm",
        "Sisallindad stam på Ø13,5 cm, grov nog att greppa om",
        "Bädd på Ø41 cm och 7 cm hög kant överst",
        "Mellanplan på 38 × 38 cm med lutande klösbräda",
        "Hängande boll i snöre",
        "Bädden är klädd i lammullsimitat",
        "För katter upp till 5 kg",
    ],
    "27b607dc": [
        "Höjd 80 cm på en bas som mäter 38 × 38 cm",
        "Sammanhängande sisalyta på 76 cm — nästan hela höjden",
        "Stolpen mäter 14,5 × 14,5 cm och är fyrkantig, inte rund",
        "Topplatta på 17,5 × 17,5 cm i ekfärgad finish",
        "Hängande boll i snöre",
        "För katter upp till 5 kg",
    ],
    "3a96740e": [
        "Höjd 153 cm på en golvyta som mäter 65 × 50 cm",
        "Sluten håla på 30 × 25 cm",
        "Rund korg på ena sidan och U-formad hängbädd längst ner",
        "Två plana liggytor på olika höjd",
        "Stammar på Ø7,1 cm, sisallindade nedtill",
        "Hängande plyschboll",
        "Väger 14 kg",
        "För katter upp till 4,5 kg",
    ],
    "3addfbf8": [
        "Höjd 76 cm på en bas som mäter 60 × 30 cm",
        "Rund bädd på Ø34 cm i ett U-format ställ",
        "Andra planet 45 × 30 cm med ett hål på Ø15,5 cm",
        "Klösbräda på 43 × 30 cm som lutar mot sidan",
        "Stolpar på Ø5,5 cm, sisallindade",
        "Jutekudde och två hängande bollar",
        "För katter upp till 5 kg",
    ],
    "4faf9f4c": [
        "Höjd 113 cm på en bas som mäter 60 × 40 cm",
        "Sluten håla 40 × 30 × 27 cm med öppning 19 × 19 cm",
        "Hängmatta på Ø30 cm och toppbädd på Ø31,5 cm med kattöron",
        "Ramp på 38 × 17 cm upp till hålan",
        "Rund hoppyta på Ø30 cm",
        "Stammar på Ø6,7 cm, sisallindade",
        "Bär 15 kg totalt, 10 kg på bädd och hylla, 8 kg i hängmattan",
        "För katter upp till 5 kg",
    ],
    "8d074911": [
        "Fyra separata väggdelar som placeras fritt",
        "Klösstolpe 84 cm med topplan 50 × 40 cm och två plan 30 × 30 cm",
        "Sluten håla 30 × 30 cm med rund öppning på 16 cm",
        "Mjuk stege på 61 × 30 cm fram till hålan",
        "Molnformad klösbräda 40 × 30 × 18 cm",
        "Kattbädd 40 × 30 × 8 cm",
        "Tar ingen golvyta alls",
        "För en till tre katter, var och en upp till 5 kg",
    ],
    "90573e36": [
        "Ställbar höjd mellan 220 och 240 cm — spänns mellan golv och tak",
        "Tippskyddsrem följer med",
        "Fotplattan tar 30 × 25 cm av golvet",
        "Sluten håla Ø33 × 31 cm med öppning 20 × 22 cm",
        "Ramp på 39 × 15 cm och rund hoppyta på Ø30 cm",
        "Hängmatta och hängande boll",
        "Stolpe på Ø7 cm, lindad med sisalrep",
        "Klädd i teddyfleece",
        "För en till två katter, upp till 5 kg styck",
    ],
    "a4d8feca": [
        "Ø35 cm och 60 cm hög",
        "Två rum ovanpå varandra: Ø33 × 27 cm nedtill, Ø33 × 24 cm upptill",
        "Ingång på Ø17 cm",
        "Hela utsidan är klädd i sisal — tunnan är också klösytan",
        "Plysch inuti och på toppen",
        "Bär 10 kg",
        "Ingen montering: den ställs bara på golvet",
    ],
    "b04b5375": [
        "Tvåvåningsdel 40 × 28 × 73 cm med sisallindad stam",
        "Hängmatta på Ø30 cm och 5 cm djup",
        "Tre fristående klivsteg, var och ett Ø20 × 32 cm",
        "Hyllplanen har rundade kanter",
        "Alla fyra delarna monteras var för sig, där du vill ha dem",
        "Tar ingen golvyta alls",
        "För katter upp till 5 kg",
    ],
    "b813d037": [
        "Höjd 104 cm på en rund bas med Ø48 cm",
        "Fyra plan: bas, mellanplan Ø30 cm, hus och toppbädd",
        "Slutet hus på Ø30 cm och 25 cm högt",
        "Toppbädd på Ø32 cm med 7 cm kant och kattöron",
        "Sisallindad stolpe längs hela höjden",
        "Hängande boll i snöre",
        "Bär 30 kg totalt",
        "För katter upp till 4,5 kg",
    ],
}

KATT_RUBRIK = {
    "1467588a": "Stammen är tjockare än vanligt",
    "27b607dc": "För katten som klöser stående",
    "3a96740e": "Tre olika sätt att ligga",
    "3addfbf8": "Lågt, för katten som inte klättrar",
    "4faf9f4c": "Tre höjder att välja mellan",
    "8d074911": "Du ritar rutten själv",
    "90573e36": "Kontrollera takhöjden först",
    "a4d8feca": "Tunnan är själva klösytan",
    "b04b5375": "Fyra delar, fri placering",
    "b813d037": "Fyra plan på en liten yta",
}

KATT = {
    "1467588a": "De flesta klösträd har stammar runt 7–8 cm. Den här är Ø13,5 cm, "
                "vilket är märkbart grövre — katten kan sätta klorna på var sin "
                "sida utan att famna om hela stammen, och sisalen sitter på hela "
                "omkretsen. Det spelar mest roll för större katter, som annars "
                "tenderar att välja soffhörnet i stället.",
    "27b607dc": "Katter klöser helst uppåtsträckta, och då avgör den obrutna höjden "
                "hur användbar ytan är. Här går sisalen 76 cm utan avbrott. Till "
                "skillnad från ett klösträd med flera plan finns här ingenting att "
                "ligga på mer än topplattan — det är en renodlad klösyta, inte en "
                "sovplats.",
    "3a96740e": "Hålan är sluten och mörk, korgen är öppen med kant runt om, och "
                "hängbädden längst ner ger efter under katten. Tre olika känslor, "
                "och katter brukar byta mellan dem beroende på tid på dygnet. Att "
                "de sitter på olika höjd gör dessutom att två katter kan använda "
                "trädet samtidigt utan att trängas.",
    "3addfbf8": "Allt sitter under 76 cm, och bädden ligger nästan på golvet. Det "
                "passar en katt som har blivit äldre, som är i ovan miljö eller som "
                "helt enkelt inte hoppar. Hålet på Ø15,5 cm i mellanplanet är stort "
                "nog att titta genom men för litet att falla igenom.",
    "4faf9f4c": "Hålan nertill är mörk och sluten, hängmattan i mitten gungar, och "
                "toppbädden sitter högst med fri sikt. Rampen gör att katten kan gå "
                "upp till hålan i stället för att hoppa — praktiskt för en katt som "
                "börjat ta det försiktigt med tassarna.",
    "8d074911": "Ett vanligt väggklösträd är en färdig kolumn som sitter där den "
                "sitter. Här monteras de fyra delarna var för sig, så du väljer "
                "själv var stegen börjar, hur högt hålan hamnar och åt vilket håll "
                "rutten går. Den kan följa ett fönster, vika runt ett hörn eller "
                "ta sig förbi en tavla.",
    "90573e36": "Klösträdet står inte fritt — det spänns fast mellan golvet och "
                "taket, och stolpen ställs mellan 220 och 240 cm. Mät takhöjden "
                "innan du beställer: har rummet 250 cm går det inte att spänna. En "
                "tippskyddsrem följer med och fästs i väggen som extra säkring.",
    "a4d8feca": "Hela utsidan är lindad med sisal, så det finns ingen särskild "
                "klösyta att sikta på — katten klöser var som helst på tunnan. "
                "Innanför finns två rum ovanpå varandra, och eftersom väggarna är "
                "runda ligger katten instängd på det sätt katter tycker om.",
    "b04b5375": "Huvuddelen räcker som klösträd i sig: två hyllplan, en sisalstam "
                "emellan och en hängmatta på sidan. De tre klivstegen bygger ut "
                "rutten — sätt dem lågt för att katten ska komma upp, eller "
                "utspridda i en trappa längs väggen.",
    "b813d037": "Fyra plan på en bas med Ø48 cm är tätt staplat, och det är avsikten: "
                "möbeln tar en yta som ryms bredvid en fåtölj men ger katten fyra "
                "ställen att vara på. Huset i mitten är slutet och de två planen "
                "över och under det är öppna.",
}

BRUK_RUBRIK = {
    "1467588a": "Var den gör mest nytta",
    "27b607dc": "Var den gör mest nytta",
    "3a96740e": "Var den gör mest nytta",
    "3addfbf8": "Var den gör mest nytta",
    "4faf9f4c": "Var den gör mest nytta",
    "8d074911": "Så sätter du upp den",
    "90573e36": "Så spänner du den",
    "a4d8feca": "Var den gör mest nytta",
    "b04b5375": "Så sätter du upp den",
    "b813d037": "Var den gör mest nytta",
}

BRUK = {
    "1467588a": "Ställ den där katten redan klöser — vid soffhörnet eller intill "
                "dörrposten. En klösyta som står på fel plats används inte, hur bra "
                "den än är. Basen på 48 × 48 cm behöver plant golv för att stå "
                "stadigt när katten tar sats.",
    "27b607dc": "Den är smal och tar 38 × 38 cm, så den får plats i en hall eller "
                "bredvid en soffa utan att ta över rummet. Eftersom höjden är hela "
                "poängen ska den stå fritt: katten måste kunna sträcka sig upp "
                "längs hela stolpen utan att slå i något.",
    "3a96740e": "Med 153 cm höjd och 65 × 50 cm golvyta är det en möbel man planerar "
                "in, inte ställer i en vrå. Den passar intill en vägg — då har "
                "katten fri sikt ut i rummet från toppen och trädet får stöd i "
                "ryggen.",
    "3addfbf8": "Låg höjd gör att den fungerar bredvid en säng eller under ett "
                "fönster utan att skymma. Basen är 60 cm bred men bara 30 cm djup, "
                "så den kan stå längs en vägg i ett smalt rum.",
    "4faf9f4c": "Ställ den så att rampen har fritt utrymme framför sig, annars går "
                "det inte att gå upp den. Golvytan är 60 × 40 cm, och toppbädden "
                "hamnar på 113 cm — ungefär i höjd med en fönsterbräda, vilket är "
                "just var många katter helst ligger.",
    "8d074911": "Delarna skruvas i väggen var för sig. Välj skruv och plugg efter "
                "väggtypen — en katt som landar från ett hopp belastar infästningen "
                "med mer än sin egen vikt, så sätt dem i regel eller betong, inte "
                "enbart i gipsskiva. Börja med den lägsta delen och arbeta uppåt, "
                "så ser du att stegen mellan delarna blir lagom.",
    "90573e36": "Mät takhöjden först: stolpen räcker från 220 till 240 cm. Ställ "
                "fotplattan på plant golv, dra ut stolpen till taket och spänn. "
                "Tippskyddsremmen fästs sedan i väggen. Kontrollera spänningen "
                "efter någon vecka — golv och tak rör sig, och en stolpe som "
                "glappat blir ostadig.",
    "a4d8feca": "Ingen montering behövs — den ställs bara ner. Det gör den lätt att "
                "flytta mellan rum, vilket är praktiskt om du inte vet var katten "
                "vill ha den. Den väger under sju kilo, så det går att bära den med "
                "en hand.",
    "b04b5375": "Huvuddelen bär hängmattan och tål mest, så börja med den och sätt "
                "den på den höjd du vill att katten ska landa. Klivstegen sätts "
                "sedan i en stigande linje fram till den. Välj skruv och plugg efter "
                "väggtypen, och skruva i regel eller betong — inte enbart i "
                "gipsskiva.",
    "b813d037": "Basen är rund på Ø48 cm och tar därför lite plats i förhållande "
                "till höjden. Den fungerar i ett hörn eller bredvid en byrå. Med "
                "fyra plan på 104 cm är stegen mellan våningarna korta, så katten "
                "kan gå uppför i stället för att hoppa.",
}

KORS_INGRESS = {p: "Passar inte den här?" for p in NAMN}
KORS_TEXT = {p: "Fler klösmöbler hos oss:" for p in NAMN}

# ☠️ KORSLÄNKARNA LIGGER FÖRE FÖRSTA FLIKRUBRIKEN. Butikens flikdelare är en
#    allowlist på fyra strängar; allt EFTER en träff hamnar i den fliken.
KORSLANK = {
    "1467588a": [("klostrad-104-cm-fyra-plan-grat", "klösträd på 104 cm med fyra plan"),
                 ("klospelare-80-cm-ek-och-cremevit", "klöspelare i ekfärg"),
                 ("klostrad-90-cm-gratt", "klösträd på 90 cm i grått")],
    "27b607dc": [("klostrad-92-cm-hangande-boll", "klösträd på 92 cm med tjock stam"),
                 ("klospelare-91-ljusbrun", "klöspelare på 91 cm i ljusbrunt"),
                 ("klospelare-87-cm-bollbana", "klöspelare med bollbana")],
    "3a96740e": [("klostrad-113-cm-hala-badd-ramp", "klösträd på 113 cm med ramp"),
                 ("klostrad-150-cm-tva-flatade-kojor", "klösträd på 150 cm med flätade kojor"),
                 ("klostrad-152-cm-bred-bas", "klösträd på 152 cm med bred bas")],
    "3addfbf8": [("klostrad-53-cm-tradstamsform", "lågt klösträd på 53 cm"),
                 ("klostrad-79-cm-korgkoja", "klösträd på 79 cm med korgkoja"),
                 ("klostrad-lagt-tra-och-jute", "lågt klösträd i trä och jute")],
    "4faf9f4c": [("klostrad-104-cm-tunnel", "klösträd på 104 cm med tunnel"),
                 ("klostrad-109-cm-tunna-badd", "klösträd på 109 cm med tunna och bädd"),
                 ("klostrad-153-cm-hala-och-hangmatta", "högre klösträd med håla och hängbädd")],
    "8d074911": [("vaggklostrad-73-cm-tre-klivsteg", "väggklösträd med tre klivsteg"),
                 ("vaggklostrad-4-delar-plattformar-stege", "väggklösträd i grått med stege"),
                 ("vaggmonterat-klostrad-180-cm-klospelare-4-plattformar",
                  "väggklösträd på 180 cm med klöspelare")],
    "90573e36": [("klostrad-takspant-220-265-cm", "takspänt klösträd 220–265 cm"),
                 ("klospelare-220-260-cm-tva-liggytor", "takspänd klöspelare med två liggytor"),
                 ("klostrad-230-275-cm-gront-katthus", "grönt takspänt klösträd med katthus")],
    "a4d8feca": [("klostunna-60-cm-ljusgra", "samma tunna i ljusgrått"),
                 ("klostunna-74-cm-beige", "klöstunna på 74 cm i beige"),
                 ("klostunna-49-cm-sjogras", "klöstunna på 49 cm i sjögräs")],
    "b04b5375": [("vaggklostrad-moln-hala-och-stege", "väggklösträd i fyra delar med håla"),
                 ("vaggklostrad-4-delar-plattformar-stege", "väggklösträd i grått med stege"),
                 ("klostrad-vaggmonterat-137-cm", "väggmonterat klösträd på 137 cm")],
    "b813d037": [("klostrad-92-cm-hangande-boll", "klösträd på 92 cm med tjock stam"),
                 ("klostrad-100-cm-flatad-kupol", "klösträd på 100 cm med flätad kupol"),
                 ("klostorn-100-cm-halor", "klöstorn på 100 cm med hålor")],
}

# ☠️ Ingen etikett heter Artikelnummer, Modellreferens, Artikelnr eller Referens.
SPEC = {
    "1467588a": [
        ("Mått", "48 × 48 × 92 cm (L × B × H)"),
        ("Bädd", "Ø41 cm, 7 cm hög kant"),
        ("Övre plan", "38 × 38 cm"),
        ("Stam", "Ø13,5 cm, sisallindad"),
        ("Material", "spånskiva, sisal och lammullsimitat"),
        ("Färg", "mörkgrått och krämvitt"),
        ("Rekommenderad kattvikt", "upp till 5 kg"),
        ("Montering", "krävs"),
    ],
    "27b607dc": [
        ("Mått", "38 × 38 × 80 cm (L × B × H)"),
        ("Sisalyta", "76 cm sammanhängande"),
        ("Stolpe", "14,5 × 14,5 cm"),
        ("Topplatta", "17,5 × 17,5 cm"),
        ("Material", "spånskiva och sisal"),
        ("Färg", "ekfärgat och krämvitt"),
        ("Rekommenderad kattvikt", "upp till 5 kg"),
        ("Montering", "krävs"),
    ],
    "3a96740e": [
        ("Mått", "65 × 50 × 153 cm (L × B × H)"),
        ("Håla", "30 × 25 cm"),
        ("Stam", "Ø7,1 cm"),
        ("Vikt", "14 kg"),
        ("Material", "spånskiva, plysch och sisal"),
        ("Färg", "krämvitt och kaffebrunt"),
        ("Rekommenderad kattvikt", "upp till 4,5 kg"),
        ("Montering", "krävs"),
    ],
    "3addfbf8": [
        ("Mått", "60 × 30 × 76 cm (L × B × H)"),
        ("Bädd", "Ø34 cm"),
        ("Andra planet", "45 × 30 cm med Ø15,5 cm hål"),
        ("Klösbräda", "43 × 30 cm"),
        ("Stolpe", "Ø5,5 cm"),
        ("Material", "spånskiva, plysch och sisal"),
        ("Färg", "ljusgrått"),
        ("Rekommenderad kattvikt", "upp till 5 kg"),
        ("Montering", "krävs"),
    ],
    "4faf9f4c": [
        ("Mått", "60 × 40 × 113 cm (L × B × H)"),
        ("Håla", "40 × 30 × 27 cm, öppning 19 × 19 cm"),
        ("Toppbädd", "Ø31,5 cm, 7 cm hög kant"),
        ("Hängmatta", "Ø30 × 5 cm"),
        ("Plan", "Ø30 cm"),
        ("Ramp", "38 × 17 cm"),
        ("Stam", "Ø6,7 cm"),
        ("Bärförmåga", "15 kg totalt, 10 kg på bädd och hylla, 8 kg i hängmattan"),
        ("Material", "spånskiva, plysch och sisal"),
        ("Färg", "ljusgrått"),
        ("Rekommenderad kattvikt", "upp till 5 kg"),
        ("Montering", "krävs"),
    ],
    "8d074911": [
        ("Antal delar", "4"),
        ("Klösstolpe", "84 cm, topplan 50 × 40 cm, två plan 30 × 30 cm"),
        ("Håla", "30 × 30 cm, öppning 16 cm"),
        ("Mjuk stege", "61 × 30 cm"),
        ("Klösbräda", "40 × 30 × 18 cm"),
        ("Kattbädd", "40 × 30 × 8 cm"),
        ("Material", "spånskiva, plysch och sisal"),
        ("Färg", "beige och grått"),
        ("Rekommenderad kattvikt", "1–3 katter, upp till 5 kg styck"),
        ("Montering", "krävs, väggmonteras"),
    ],
    "90573e36": [
        ("Mått", "30 × 25 × 220–240 cm (L × B × H)"),
        ("Takhöjd", "220–240 cm"),
        ("Håla", "Ø33 × 31 cm, öppning 20 × 22 cm"),
        ("Hoppyta", "Ø30 cm"),
        ("Ramp", "39 × 15 cm"),
        ("Stolpe", "Ø7 cm"),
        ("Material", "spånskiva, teddyfleece och sisal"),
        ("Färg", "grönt och rosa"),
        ("Rekommenderad kattvikt", "1–2 katter, upp till 5 kg styck"),
        ("Montering", "krävs, spänns mellan golv och tak"),
    ],
    "a4d8feca": [
        ("Mått", "Ø35 × 60 cm"),
        ("Nedre rum", "Ø33 × 27 cm"),
        ("Övre rum", "Ø33 × 24 cm"),
        ("Ingång", "Ø17 cm"),
        ("Bärförmåga", "10 kg"),
        ("Material", "spånskiva, plysch, PP-bomull och sisal"),
        ("Färg", "naturbrunt med krämvit kant"),
        ("Montering", "ingen montering"),
    ],
    "b04b5375": [
        ("Huvuddel", "40 × 28 × 73 cm (L × B × H)"),
        ("Antal delar", "4"),
        ("Klösstam", "Ø20 × 32 cm"),
        ("Hängmatta", "Ø30 × 5 cm"),
        ("Klivsteg", "3 stycken"),
        ("Material", "spånskiva, plysch och sisal"),
        ("Färg", "beige och krämvitt"),
        ("Rekommenderad kattvikt", "upp till 5 kg"),
        ("Montering", "krävs, väggmonteras"),
    ],
    "b813d037": [
        ("Mått", "48 × 48 × 104 cm (L × B × H)"),
        ("Bas", "Ø48 cm"),
        ("Hus", "Ø30 × 25 cm"),
        ("Andra våningen", "Ø30 cm"),
        ("Toppbädd", "Ø32 cm, 7 cm hög kant"),
        ("Bärförmåga", "30 kg totalt"),
        ("Material", "spånskiva, sisal och plysch"),
        ("Färg", "grått"),
        ("Rekommenderad kattvikt", "upp till 4,5 kg"),
        ("Montering", "krävs"),
    ],
}

_SKOTSEL_GOLV = ("Dra åt skruvarna efter första månaden — det är då de sätter sig — "
                 "och sedan en gång om året. Dammsug plyschen med möbelmunstycke. "
                 "Klipp av lösa sisaltrådar i stället för att dra i dem, annars "
                 "nystar de upp sig vidare.")
_SKOTSEL_VAGG = ("Kontrollera infästningarna efter första månaden och sedan en gång "
                 "om året. Dammsug plyschen med möbelmunstycke. Klipp av lösa "
                 "sisaltrådar i stället för att dra i dem.")

SKOTSEL = {
    "1467588a": _SKOTSEL_GOLV,
    "27b607dc": ("Dra åt skruvarna efter första månaden och sedan en gång om året. "
                 "Torka av den ekfärgade topplattan med lätt fuktad trasa. Klipp av "
                 "lösa sisaltrådar i stället för att dra i dem."),
    "3a96740e": _SKOTSEL_GOLV,
    "3addfbf8": _SKOTSEL_GOLV,
    "4faf9f4c": _SKOTSEL_GOLV,
    "8d074911": _SKOTSEL_VAGG,
    "90573e36": ("Kontrollera spänningen mot taket efter någon vecka och sedan med "
                 "jämna mellanrum — golv och tak rör sig med årstiderna. Se samtidigt "
                 "till att tippskyddsremmen sitter fast. Dammsug teddyfleecen med "
                 "möbelmunstycke och klipp av lösa sisaltrådar."),
    "a4d8feca": ("Dammsug sisalen med möbelmunstycke och vänd tunnan då och då så den "
                 "nöts jämnt. Klipp av lösa trådar i stället för att dra i dem. Det "
                 "inre plyschfodret går att borsta rent med en torr klädborste."),
    "b04b5375": _SKOTSEL_VAGG,
    "b813d037": _SKOTSEL_GOLV,
}

FAQ = {
    "1467588a": [
        ("Hur grov är stammen?", "Ø13,5 cm, vilket är märkbart grövre än de 7–8 cm "
         "som är vanligast. Hela omkretsen är lindad med sisal."),
        ("Hur stor katt passar den?", "Den är gjord för katter upp till 5 kg. En norsk "
         "skogkatt eller maine coon väger ofta mer än så."),
        ("Vad är bädden klädd i?", "Lammullsimitat, alltså ett mjukt lockigt "
         "konstmaterial. Stommen är spånskiva."),
        ("Behöver den monteras?", "Ja. Delarna skruvas ihop, och verktyg och "
         "anvisning följer med."),
    ],
    "27b607dc": [
        ("Går det att ligga på den?", "Bara på topplattan, som mäter "
         "17,5 × 17,5 cm. Det här är en klösyta, inte en sovplats."),
        ("Hur hög är sisalytan?", "76 cm sammanhängande, av totalt 80 cm."),
        ("Står den stadigt?", "Basen är 38 × 38 cm och behöver plant golv. Ställ "
         "den fritt så katten kan sträcka sig hela vägen upp."),
        ("Hur stor katt passar den?", "Den är gjord för katter upp till 5 kg."),
    ],
    "3a96740e": [
        ("Hur många liggplatser finns det?", "Fem: hålan, den runda korgen, "
         "hängbädden och två plana ytor."),
        ("Hur stor är hålan?", "30 × 25 cm."),
        ("Hur mycket väger trädet?", "14 kg. Det gör det stadigt, men också "
         "otympligt att flytta ensam."),
        ("Hur stor katt passar det?", "Upp till 4,5 kg, vilket är lägre än "
         "på de flesta klösträd."),
    ],
    "3addfbf8": [
        ("Varför är den så låg?", "Allt sitter under 76 cm, så katten kan använda "
         "den utan att hoppa. Det passar en äldre katt eller en som är ovan."),
        ("Vad är hålet i mellanplanet till?", "Det är Ø15,5 cm och går att titta "
         "ner genom. Det är för litet att falla igenom."),
        ("Hur stor är bädden?", "Ø34 cm, och den vilar i ett U-format ställ."),
        ("Hur stor katt passar den?", "Den är gjord för katter upp till 5 kg."),
    ],
    "4faf9f4c": [
        ("Vad är det för utrymme nertill?", "En sluten håla på 40 × 30 × 27 cm med "
         "en fyrkantig öppning på 19 × 19 cm. Katten sover där."),
        ("Hur mycket bär den?", "15 kg totalt, 10 kg på bädd och hylla och 8 kg i "
         "hängmattan."),
        ("Vad är rampen till?", "Den går upp till hålan, 38 × 17 cm, så katten kan "
         "gå i stället för att hoppa."),
        ("Hur stor katt passar den?", "Den är gjord för katter upp till 5 kg."),
    ],
    "8d074911": [
        ("Vad ingår?", "Fyra delar: klösstolpe på 84 cm, sluten håla med mjuk "
         "stege, molnformad klösbräda och en kattbädd."),
        ("Vilken vägg krävs?", "En som bär en katt som landar från ett hopp. Skruva "
         "i regel eller betong, inte enbart i gipsskiva. Välj skruv och plugg efter "
         "väggtypen."),
        ("Hur mycket golvyta tar det?", "Ingen. Alla fyra delarna är väggmonterade."),
        ("Hur många katter passar det?", "En till tre katter, var och en upp "
         "till 5 kg."),
    ],
    "90573e36": [
        ("Vilken takhöjd krävs?", "Mellan 220 och 240 cm. Har rummet 250 cm i tak "
         "går stolpen inte att spänna."),
        ("Måste den skruvas i väggen?", "Nej, den spänns mellan golv och tak. En "
         "tippskyddsrem följer med och fästs i väggen som extra säkring."),
        ("Vad är utrymmet nertill?", "En sluten håla på Ø33 × 31 cm med en öppning "
         "på 20 × 22 cm."),
        ("Hur mycket golvyta tar den?", "30 × 25 cm."),
    ],
    "a4d8feca": [
        ("Behöver den monteras?", "Nej. Den ställs bara på golvet."),
        ("Hur många rum finns det?", "Två, ovanpå varandra: Ø33 × 27 cm nedtill och "
         "Ø33 × 24 cm upptill."),
        ("Var klöser katten?", "Var som helst — hela utsidan är lindad med sisal."),
        ("Hur mycket bär den?", "10 kg."),
    ],
    "b04b5375": [
        ("Vad ingår?", "Fyra delar: en tvåvåningsdel på 40 × 28 × 73 cm med "
         "sisalstam och hängmatta, samt tre klivsteg på Ø20 × 32 cm."),
        ("Vilken vägg krävs?", "En som bär en katt som landar från ett hopp. Skruva "
         "i regel eller betong, inte enbart i gipsskiva. Välj skruv och plugg efter "
         "väggtypen."),
        ("Hur stor är hängmattan?", "Ø30 cm och 5 cm djup."),
        ("Hur stor katt passar det?", "Det är gjort för katter upp till 5 kg."),
    ],
    "b813d037": [
        ("Hur många plan finns det?", "Fyra: basen, ett mellanplan på Ø30 cm, "
         "huset och toppbädden."),
        ("Är huset slutet?", "Ja, det är Ø30 cm och 25 cm högt med en öppning i "
         "sidan."),
        ("Hur mycket bär trädet?", "30 kg totalt."),
        ("Hur stor katt passar det?", "Upp till 4,5 kg per katt."),
    ],
}


def _p(t):
    return "<p>" + t + "</p>"


def bygg(pid):
    """Bygger plainDescription.

    ☠️ ORDNINGEN ÄR INTE FRI. Butikens flikdelare är en allowlist på fyra
       strängar; allt EFTER en träff hamnar i den fliken. Korslänkarna måste
       därför ligga FÖRE `Tekniska specifikationer`.
    """
    d = [_p(INTRO[pid])]

    d.append("<h2>" + RUBRIK[pid] + "</h2>")
    d.append("<ul>" + "".join("<li>" + x + "</li>" for x in PUNKTER[pid]) + "</ul>")

    d.append("<h2>" + KATT_RUBRIK[pid] + "</h2>")
    d.append(_p(KATT[pid]))

    d.append("<h2>" + BRUK_RUBRIK[pid] + "</h2>")
    d.append(_p(BRUK[pid]))

    d.append("<h2>" + KORS_INGRESS[pid] + "</h2>")
    # ☠️ ABSOLUT URL, ALDRIG ROTRELATIV: "/produkt/…" skrivs om av Wix till
    #    "https:/produkt/…" — ETT snedstreck, alltså död länk.
    lankar = ", ".join('<a href="{}/produkt/{}">{}</a>'.format(BAS, s, t)
                       for s, t in KORSLANK[pid])
    d.append(_p(KORS_TEXT[pid] + " " + lankar + "."))

    d.append("<h2>Tekniska specifikationer</h2>")
    d.append("<ul>" + "".join("<li><strong>{}:</strong> {}</li>".format(e, v)
                              for e, v in SPEC[pid]) + "</ul>")

    d.append("<h2>Användning och skötsel</h2>")
    d.append(_p(SKOTSEL[pid]))

    d.append("<h2>Vanliga frågor</h2>")
    for f, s in FAQ[pid]:
        d.append("<p><strong>" + f + "</strong></p>")
        d.append(_p(s))

    return "".join(d)
