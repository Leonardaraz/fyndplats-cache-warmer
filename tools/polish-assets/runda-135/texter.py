# -*- coding: utf-8 -*-
"""Runda 135 — kundtexterna. En datafil; byggandet bor i bygg().

☠️ Skriv ALDRIG ut leverantörens namn, artikelnummer eller avsändarland.
   Ett av utkasten bär artikelnumret i sin egen tyska spec-rad — det är
   källan till de fyra publicerade sidor som läckt det (#414, #470).
☠️ Rör ALDRIG priset.
☠️ Mot kunden är VI leverantören — skriv aldrig "leverantören anger".
☠️ INGEN VARUVIKT. Spec-blockets `Vikt` är fraktvikten (#488).
☠️ INGEN TIPPSKYDDSUTFÄSTELSE. Ingen av de åtta levereras med väggrem eller
   takspänne; varje Lieferumfang är produkten plus en manual.
☠️ `0696efce` och `7564dcfb` är KLÖSPELARE — en stam på en sockel. Ordet
   "klösträd" får inte stå i deras namn, slug, titel eller meta, och tvärtom
   för de sex andra (#462).
"""
import os as _os
import sys as _sys

_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
import grindar as _G                                             # noqa: E402

NAMN = {
    "0696efce": "Klöspelare 87 cm i sisal – bollbana i sockeln och topplatta i trä",
    "7564dcfb": "Klöspelare 87 cm med bädd på toppen och tjock sisalstam",
    "5d64f423": "Klösträd 61,5 cm i trä och jute – bädd och hoppyta på var sin stolpe",
    "82efeeaf": "Klösträd 86 cm med klösklot i jute – bädd på toppen och rund platå",
    "bdc7e768": "Klösträd 98 cm i fårdesign – liggtunnel, klösstolpar och svansleksak",
    "e2c8b0f3": "Klösträd 98 cm med bladkrona – grön hydda, bädd och jutestammar",
    "cc5da788": "Klösträd 100 cm med flätad kupolhydda – sisalstammar och platå",
    "741c5723": "Klösträd 132 cm med borstpelare – filthus, bädd och klösmatta",
}

# ☠️ SLUGGEN VÄLJS SÅ ATT DET SOM SKILJER PRODUKTERNA ÅT RYMS FÖRE KAPNINGEN.
#    `grindar.sku_bas` kapar (#473, #489). Två par delar höjd inom rundan
#    (87 och 98 cm), så höjden ensam räcker inte — konstruktionen måste med.
SLUG = {
    "0696efce": "klospelare-87-cm-bollbana",
    "7564dcfb": "klospelare-87-cm-med-badd",
    "5d64f423": "klostrad-lagt-tra-och-jute",
    "82efeeaf": "klostrad-86-cm-klosklot",
    "bdc7e768": "klostrad-98-cm-fardesign-tunnel",
    "e2c8b0f3": "klostrad-98-cm-bladkrona",
    "cc5da788": "klostrad-100-cm-flatad-kupol",
    "741c5723": "klostrad-132-cm-borstpelare",
}

SKU = {pid: "FP-" + _G.sku_bas(slug) for pid, slug in SLUG.items()}

TITEL = {
    "0696efce": "Klöspelare 87 cm med bollbana i sockeln | Fyndplats",
    "7564dcfb": "Klöspelare 87 cm med bädd på toppen | Fyndplats",
    "5d64f423": "Klösträd 61,5 cm i trä och jute | Fyndplats",
    "82efeeaf": "Klösträd 86 cm med klösklot i jute | Fyndplats",
    "bdc7e768": "Klösträd 98 cm i fårdesign med tunnel | Fyndplats",
    "e2c8b0f3": "Klösträd 98 cm med bladkrona | Fyndplats",
    "cc5da788": "Klösträd 100 cm med flätad kupolhydda | Fyndplats",
    "741c5723": "Klösträd 132 cm med borstpelare | Fyndplats",
}

META = {
    "0696efce": ("Klöspelare 87 cm klädd i sisal, med en rullande boll i "
                 "sockeln och en liten topplatta i trä. Bär 10 kg."),
    "7564dcfb": ("Klöspelare 87 cm med en rund bädd på toppen och en Ø14 cm "
                 "tjock sisalstam. Plyschklädd sockel 45 × 45 cm."),
    "5d64f423": ("Lågt klösträd 61,5 cm med en bädd och en hoppyta på var sin "
                 "jutelindad trästolpe. Mjuk plysch och bred sockel."),
    "82efeeaf": ("Klösträd 86 cm med bädd på toppen, rund mellanplatå och "
                 "klösklot i jute på stammen. Bär 7 kg."),
    "bdc7e768": ("Klösträd 98 cm format som ett får: liggtunnel i plysch, "
                 "jutelindade klösstolpar och en svansleksak som dinglar."),
    "e2c8b0f3": ("Klösträd 98 cm med grön hydda, oval bädd och en krona av "
                 "blad högst upp. Jutestammar att klösa på."),
    "cc5da788": ("Klösträd 100 cm med en flätad kupolhydda av kaveldun på två "
                 "sisalstammar, plus en mellanplatå i plysch."),
    "741c5723": ("Klösträd 132 cm i fyra plan med filthus, bädd på toppen, "
                 "klösmatta och en borstpelare för pälsvården."),
}

SOKORD = {
    "0696efce": "klöspelare sisal",
    "7564dcfb": "klöspelare med bädd",
    "5d64f423": "litet klösträd",
    "82efeeaf": "klösträd 86 cm",
    "bdc7e768": "klösträd fårdesign",
    "e2c8b0f3": "klösträd 98 cm",
    "cc5da788": "klösträd 100 cm",
    "741c5723": "klösträd 132 cm",
}

INTRO = {
    "0696efce": (
        "En klöspelare som får katten att sträcka ut sig ordentligt. Den är "
        "87 cm hög och stammen är klädd i sisal hela vägen upp, så den som "
        "vill dra ut ryggen i full längd får plats. Överst sitter en topplatta "
        "i trä på 20 × 20 cm och en boll som dinglar i ett snöre. Nere i "
        "sockeln ligger en träkula i en sluten bana — katten kan peta runt "
        "den utan att den rullar bort under soffan."),
    "7564dcfb": (
        "En klöspelare med en rund bädd överst, för katten som helst gör "
        "båda sakerna på samma ställe. Stammen är Ø14 cm tjock och lindad i "
        "sisal, alltså rejält mycket klösyta i midjehöjd för katten. Bädden "
        "mäter Ø41 cm och är klädd i långluggad plysch, och sockeln på "
        "45 × 45 cm är klädd i samma material."),
    "5d64f423": (
        "Ett lågt klösträd på 61,5 cm för den som inte vill ha en tornbyggnad "
        "i vardagsrummet. Två trästolpar lindade med jute bär var sin mjuk "
        "yta: en bädd på Ø40 cm högst upp och en hoppyta på Ø30 cm bredvid, "
        "lite lägre. Sockeln är klädd i samma jute och mäter 50 × 47 cm."),
    "82efeeaf": (
        "Ett klösträd där stammen är gjord av klösklot. Tre saker staplade på "
        "varandra: en bädd på 54 × 36 cm överst, en rund platå på 40 × 37 cm "
        "i mitten och klot i jute på Ø11 cm som katten kan greppa om. "
        "Totalhöjden är 86 cm och sockeln mäter 56 × 54 cm."),
    "bdc7e768": (
        "Ett klösträd format som ett får, och formen är inte bara utseende. "
        "Kroppen är en liggtunnel på Ø26 cm och 40 cm lång, benen är fyra "
        "jutelindade klösstolpar på Ø6,6 cm, och svansen är en 31 cm lång "
        "leksak som svajar när katten petar på den. Huvudet högst upp sitter "
        "på 98 cm höjd."),
    "e2c8b0f3": (
        "Ett klösträd som ser ut som en växt. Nederst en grön hydda på "
        "30 × 30 cm med en välvd ingång, i mitten en oval bädd på 40 × 30 cm, "
        "och högst upp en krona av blad på 98 cm höjd. Stammarna är lindade "
        "i jute och de gröna ytorna är klädda i teddysammet."),
    "cc5da788": (
        "Ett klösträd med en riktig kupolhydda: flätat kaveldun i en rund "
        "form på Ø40 cm med en stor välvd öppning, upplyft på två sisalstammar "
        "till 100 cm höjd. Under den sitter en mellanplatå på 40 × 24 cm i "
        "plysch, så katten kan ta sig upp i två steg."),
    "741c5723": (
        "Ett klösträd i fyra plan, för hushåll med mer än en katt. Överst en "
        "bädd på 50 × 32 cm med uppvikt kant, under den ett hus i mörkgrå "
        "filt på 33,5 × 30 cm, och längs sidan en klösmatta på 16 × 43 cm. "
        "Vid sockeln sitter dessutom en borstpelare på Ø10 cm som katten kan "
        "gnida sig mot. Totalhöjden är 132 cm."),
}

RUBRIK = {p: "Det här får du" for p in NAMN}

PUNKTER = {
    "0696efce": [
        "87 cm hög, med sisal på stammen från sockel till topplatta",
        "Topplatta i trä på 20 × 20 cm med en boll i snöre",
        "Bollbana i sockeln, 40 × 40 cm nedre och 30 × 30 cm övre",
        "Sockel på 39,5 × 39,5 cm som håller pelaren stadig",
        "Bär 10 kg",
        "Monteras med bifogad anvisning",
    ],
    "7564dcfb": [
        "Rund bädd på Ø41 cm, 12 cm hög, med Ø35 cm liggyta invändigt",
        "Ø14 cm tjock stam lindad i sisal",
        "Plyschklädd sockel på 45 × 45 cm",
        "Total höjd 87 cm",
        "Bär 6 kg",
        "Monteras med bifogad anvisning",
    ],
    "5d64f423": [
        "Bädd på Ø40 cm, 8 cm hög, på den långa stolpen",
        "Hoppyta på Ø30 cm, 7 cm hög, på den korta stolpen",
        "Två trästolpar på Ø6,5 cm, 49 respektive 30 cm höga",
        "Jutelindning 25 cm på den långa stolpen och 15 cm på den korta",
        "Sockel på 50 × 47 cm, klädd i jute",
        "Passar katter upp till 5 kg",
    ],
    "82efeeaf": [
        "Bädd på 54 × 36 cm överst, 45 × 32 cm invändigt och 6 cm djup",
        "Rund mellanplatå på 40 × 37 cm",
        "Klösklot i jute på Ø11 cm staplade på stammen",
        "Stam på Ø7 cm och sockel på 56 × 54 cm",
        "Total höjd 86 cm, bär 7 kg",
        "Monteras med bifogad anvisning",
    ],
    "bdc7e768": [
        "Liggtunnel på Ø26 cm, 40 cm lång, med öppning på 17 × 15 cm",
        "Fyra klösstolpar på Ø6,6 cm lindade i jute",
        "Svansleksak på Ø2 cm och 31 cm längd",
        "Sockel på 48 × 34 cm, total höjd 98 cm",
        "Bär 5 kg",
        "Monteras med bifogad anvisning",
    ],
    "e2c8b0f3": [
        "Hydda på 30 × 30 cm, 28,5 cm hög, med ingång på 19 × 21 cm",
        "Oval bädd på 40 × 30 cm, 7 cm hög, 25 × 22 cm invändigt",
        "Bladkrona högst upp, bladen 30 × 14 cm och 24 × 12 cm",
        "Stammar på Ø5,8 cm lindade i jute",
        "Total höjd 98 cm, bottenyta 44 × 30 cm",
        "Passar katter upp till 5 kg",
    ],
    "cc5da788": [
        "Flätad kupolhydda på Ø40 cm, 38 cm hög, med öppning på 32 × 32 cm",
        "Mellanplatå på 40 × 24 cm i plysch",
        "Två stammar på Ø5,5 cm klädda i sisal",
        "Sockel på 48 × 40 cm, total höjd 100 cm",
        "Passar katter under 5 kg",
        "Monteras med bifogad anvisning",
    ],
    "741c5723": [
        "Bädd på 50 × 32 cm överst, 40 × 26 cm invändigt och 6 cm djup",
        "Hus i mörkgrå filt på 33,5 × 30 cm med ingång på 16 × 19 cm",
        "Klösmatta på 16 × 43 cm längs sidan",
        "Borstpelare på Ø10 cm, 25 cm hög, vid sockeln",
        "Stammar på Ø7 cm, sockel på 55 × 44 cm, total höjd 132 cm",
        "Rymmer två katter på upp till 6 kg vardera",
    ],
}

KATT_RUBRIK = {p: "Vilken katt den passar" for p in NAMN}

KATT = {
    "0696efce": (
        "Den här är byggd för att klösa, inte för att sova i. En vuxen katt "
        "som gärna sträcker sig högt när den vässar klorna får 87 cm att dra "
        "ut sig längs, och topplattan är för liten att lägga sig på — den är "
        "ett avlägg, inte en bädd. Bollen i sockeln gör att kattungar och "
        "leksugna vuxna har något att göra på golvnivå samtidigt. Har du en "
        "katt som hellre ligger än klättrar finns bädd på flera av våra andra "
        "klösmöbler."),
    "7564dcfb": (
        "Passar katter upp till 6 kg, och bädden på Ø41 cm rymmer en katt "
        "som gärna rullar ihop sig. Höjden på 87 cm räcker för att katten "
        "ska kunna sträcka ut sig helt när den klöser, och den tjocka stammen "
        "på Ø14 cm ger ett bra grepp för stora tassar. Två katter samsas "
        "däremot inte om en enda bädd — då är ett klösträd med flera plan "
        "ett bättre val."),
    "5d64f423": (
        "En bra första klösmöbel, och ett bra val till äldre katter. Höjden "
        "på 61,5 cm gör att en katt som inte längre hoppar så högt kommer upp "
        "utan besvär, och de två ytorna ligger på olika nivå så att språnget "
        "mellan dem blir kort. Bärförmågan är 5 kg. Har du en tung eller "
        "mycket aktiv katt håller den inte i längden."),
    "82efeeaf": (
        "Bädden på 54 × 36 cm är ovanligt rymlig för ett klösträd i den här "
        "höjden, och kanten är uppvikt runt om så att katten kan luta huvudet "
        "mot något. Bärförmågan är 7 kg, alltså räcker den även till en "
        "storvuxen katt. Klösklotet i jute sitter i den höjd där en katt som "
        "reser sig på bakbenen kommer åt det."),
    "bdc7e768": (
        "Tunneln är Ø26 cm i diameter, vilket passar en katt under 5 kg som "
        "gärna ligger inne i något i stället för på det. Kattungar använder "
        "hela möbeln som en lekplats: tunneln att gömma sig i, benen att "
        "klösa på och svansen att jaga. En stor eller tung katt får det "
        "trångt i tunneln och bör få något bredare."),
    "e2c8b0f3": (
        "Två vilolägen i samma möbel: hyddan nere för katten som vill vara "
        "ifred, bädden ovanpå för den som vill ha uppsikt. Båda är gjorda för "
        "katter upp till 5 kg. Ingången på 19 × 21 cm är i minsta laget för "
        "en riktigt kraftig katt, så mät gärna över bröstkorgen först om du "
        "är osäker."),
    "cc5da788": (
        "Kupolhyddan sitter högt, och det är hela poängen: katter som vill "
        "kunna se rummet utan att synas själva söker sig dit. Öppningen på "
        "32 × 32 cm är generös, så katten kommer in och ut utan att kröka "
        "sig. Den är gjord för katter under 5 kg. Mellanplatån gör att även "
        "en mindre vig katt tar sig upp i två korta steg i stället för ett "
        "långt."),
    "741c5723": (
        "Rymmer två katter på upp till 6 kg vardera, och de fyra planen gör "
        "att de kan hålla avstånd utan att lämna möbeln. Huset nere och "
        "bädden överst är två helt skilda platser, vilket brukar räcka för "
        "att två katter som inte gillar att ligga tätt ska kunna dela möbel. "
        "Borstpelaren vid sockeln är till för katter som gillar att gnida "
        "sig — den fångar upp lös päls på köpet."),
}

BRUK_RUBRIK = {p: "Att tänka på" for p in NAMN}

BRUK = {
    "0696efce": (
        "Pelaren står på en sockel på 39,5 × 39,5 cm och är stadig på ett "
        "plant golv. Den är hög i förhållande till sockeln, så ställ den mot "
        "en vägg eller i ett hörn i stället för fritt mitt i rummet, och låt "
        "den inte stå på en tjock matta som kan ge vika åt ena hållet. I "
        "kartongen ligger pelaren och en monteringsanvisning."),
    "7564dcfb": (
        "Bädden sitter överst på en enda stam, alltså vilar all vikt på "
        "sockeln. Ställ den på ett plant och hårt underlag och skjut den mot "
        "en vägg om katten brukar hoppa upp med fart. I kartongen ligger "
        "pelaren och en monteringsanvisning. Dra åt skruvarna i sockeln en "
        "gång till efter ett par veckors användning."),
    "5d64f423": (
        "Låg och bred, alltså den stadigaste konstruktionen i den här "
        "storleken. Den behöver inget väggstöd, men den vill stå på ett "
        "plant golv — på en ojämn matta kommer den att vagga när katten "
        "landar på den höga bädden."),
    "82efeeaf": (
        "Klösklotet sitter trätt på stammen, och det är den delen som får "
        "mest kraft när katten drar i den. Kontrollera att muttern under "
        "sockeln är åtdragen vid monteringen och känn efter igen efter någon "
        "månad. I kartongen ligger klösträdet och en monteringsanvisning."),
    "bdc7e768": (
        "Tunneln bärs upp av fyra stolpar och blir mjuk i kanten när katten "
        "hoppar in i den — det är tyget som ger efter, inte konstruktionen. "
        "Svansleksaken sitter i ett snöre; klipp bort den om du lämnar katten "
        "ensam långa stunder. I kartongen ligger klösträdet och en "
        "monteringsanvisning."),
    "e2c8b0f3": (
        "Bottenytan är 44 × 30 cm mot en höjd på 98 cm, alltså smal i "
        "förhållande till höjden. Ställ den mot en vägg. Bladkronan är "
        "dekoration och tål inte att en katt hänger i den — den sitter på "
        "toppen av en stam, inte på en plattform."),
    "cc5da788": (
        "Hyddan sitter högt och väger en del när katten ligger i den, så "
        "sockeln på 48 × 40 cm gör bäst nytta mot en vägg. Det flätade "
        "kaveldunet är ett naturmaterial: det tål att torkas av med en "
        "fuktig trasa, men ska inte blötläggas."),
    "741c5723": (
        "Den högsta i den här gruppen, 132 cm på en sockel på 55 × 44 cm. "
        "Ställ den mot en vägg eller i ett hörn, och helst inte på ett "
        "ställe där katten kan hoppa från ett bord ner på den översta "
        "bädden. I kartongen ligger klösträdet och en monteringsanvisning."),
}

KORS_INGRESS = {p: "Passar inte den här?" for p in NAMN}
KORS_TEXT = {p: "Fler klösmöbler hos oss:" for p in NAMN}

KORSLANK = {
    "0696efce": [("klospelare-87-cm-med-badd", "klöspelare med bädd på toppen"),
                 ("klospelare-81-cm-sisal", "klöspelare 81 cm med lekboll")],
    "7564dcfb": [("klospelare-87-cm-bollbana", "klöspelare med bollbana i sockeln"),
                 ("klospelare-81-cm-sisal", "klöspelare 81 cm med lekboll")],
    "5d64f423": [("klospelare-87-cm-med-badd", "klöspelare med bädd på toppen"),
                 ("klostrad-53-cm-tradstamsform", "klösträd 53 cm i trädstamsform")],
    "82efeeaf": [("klostrad-lagt-tra-och-jute", "lågt klösträd i trä och jute"),
                 ("klostrad-132-cm-borstpelare", "klösträd 132 cm med borstpelare")],
    "bdc7e768": [("klostrad-98-cm-bladkrona", "klösträd 98 cm med bladkrona"),
                 ("klostrad-101-cm-giraff-med-tunnel", "klösträd 101 cm i giraffform")],
    "e2c8b0f3": [("klostrad-98-cm-fardesign-tunnel", "klösträd 98 cm i fårdesign"),
                 ("klostrad-100-cm-flatad-kupol", "klösträd 100 cm med kupolhydda")],
    "cc5da788": [("klostrad-98-cm-bladkrona", "klösträd 98 cm med bladkrona"),
                 ("klostrad-rotting-95-cm", "klösträd i rotting 95 cm")],
    "741c5723": [("klostrad-86-cm-klosklot", "klösträd 86 cm med klösklot"),
                 ("klostrad-140-cm", "klösträd 140 cm med hängmatta")],
}

SPEC = {
    "0696efce": [("Mått", "39,5 × 39,5 × 87 cm"), ("Sockel", "39,5 × 39,5 cm"),
                 ("Topplatta", "20 × 20 cm, 1,5 cm tjock"),
                 ("Stam", "14,5 × 14,5 cm i tvärsnitt, 40 cm per sektion"),
                 ("Bollbana", "40 × 40 cm nedre, 30 × 30 cm övre"),
                 ("Boll", "Ø2,5 cm"), ("Maxlast", "10 kg"),
                 ("Material", "MDF och sisal"),
                 ("Färg", "ljus ek mot gräddvit sisal"),
                 ("Montering", "krävs")],
    "7564dcfb": [("Mått", "45 × 45 × 87 cm"), ("Sockel", "45 × 45 cm"),
                 ("Bädd", "Ø41 cm, 12 cm hög"),
                 ("Liggyta invändigt", "Ø35 cm, 10 cm djup"),
                 ("Stam", "Ø14 cm"), ("Kattens vikt", "upp till 6 kg"),
                 ("Material", "spånskiva, sisal och långluggad polyester"),
                 ("Färg", "brungrå melerad plysch mot gräddvit sisal"),
                 ("Montering", "krävs")],
    "5d64f423": [("Mått", "50 × 47 × 61,5 cm"), ("Sockel", "50 × 47 cm"),
                 ("Bädd", "Ø40 cm, 8 cm hög"),
                 ("Hoppyta", "Ø30 cm, 7 cm hög"),
                 ("Stolpar", "Ø6,5 cm — 49 cm respektive 30 cm höga"),
                 ("Jutelindning", "25 cm på den långa stolpen, 15 cm på den korta"),
                 ("Kattens vikt", "upp till 5 kg"),
                 ("Material", "spånskiva, trästolpar, jute och polyester"),
                 ("Färg", "gräddvit plysch mot ljust trä och naturfärgad jute"),
                 ("Montering", "krävs")],
    "82efeeaf": [("Mått", "56 × 54 × 86 cm"), ("Sockel", "56 × 54 cm"),
                 ("Bädd", "54 × 36 cm, 8 cm hög"),
                 ("Liggyta invändigt", "45 × 32 cm, 6 cm djup"),
                 ("Mellanplatå", "40 × 37 cm"), ("Stam", "Ø7 cm"),
                 ("Klösklot", "Ø11 cm"), ("Maxlast", "7 kg"),
                 ("Material", "spånskiva, jute och polyester"),
                 ("Färg", "ljusbrun plysch mot naturfärgad jute"),
                 ("Montering", "krävs")],
    "bdc7e768": [("Mått", "48 × 34 × 98 cm"), ("Sockel", "48 × 34 cm"),
                 ("Liggtunnel", "Ø26 cm, 40 cm lång"),
                 ("Öppning", "17 × 15 cm"), ("Klösstolpar", "Ø6,6 cm"),
                 ("Svansleksak", "Ø2 cm, 31 cm lång"),
                 ("Kattens vikt", "under 5 kg"),
                 ("Material", "spånskiva, jute, plast och polyester"),
                 ("Färg", "ljusbrun och gräddvit plysch med svart huvud"),
                 ("Montering", "krävs")],
    "e2c8b0f3": [("Mått", "44 × 30 × 98 cm"),
                 ("Hydda", "30 × 30 cm, 28,5 cm hög"),
                 ("Ingång", "19 × 21 cm"), ("Bädd", "40 × 30 cm, 7 cm hög"),
                 ("Liggyta invändigt", "25 × 22 cm, 6 cm djup"),
                 ("Stammar", "Ø5,8 cm"),
                 ("Blad", "30 × 14 cm de stora, 24 × 12 cm de små"),
                 ("Kattens vikt", "upp till 5 kg"),
                 ("Material", "spånskiva, jute och teddysammet"),
                 ("Färg", "grön teddysammet mot beige bädd och jutestammar"),
                 ("Montering", "krävs")],
    "cc5da788": [("Mått", "48 × 40 × 100 cm"), ("Sockel", "48 × 40 cm"),
                 ("Kupolhydda", "Ø40 cm, 38 cm hög"),
                 ("Öppning", "32 × 32 cm"), ("Mellanplatå", "40 × 24 cm"),
                 ("Stammar", "Ø5,5 cm"), ("Kattens vikt", "under 5 kg"),
                 ("Material", "MDF, sisal, flätat kaveldun och plysch"),
                 ("Färg", "beige"), ("Montering", "krävs")],
    "741c5723": [("Mått", "55 × 44 × 132 cm"), ("Sockel", "55 × 44 cm"),
                 ("Bädd", "50 × 32 cm, 7 cm hög"),
                 ("Liggyta invändigt", "40 × 26 cm, 6 cm djup"),
                 ("Hus", "33,5 × 30 cm, 30 cm högt"),
                 ("Ingång", "16 × 19 cm"), ("Klösmatta", "16 × 43 cm"),
                 ("Borstpelare", "Ø10 cm, 25 cm hög"), ("Stammar", "Ø7 cm"),
                 ("Kattens vikt", "två katter på upp till 6 kg vardera"),
                 ("Material", "spånskiva, sisal och polyester"),
                 ("Färg", "ljusgrå plysch mot gräddvita sisalstammar och mörkgrått filthus"),
                 ("Montering", "krävs")],
}

SKOTSEL = {
    "0696efce": (
        "Dammsug sisalen med möbelmunstycket när det lossnat fibrer, och "
        "klipp av lösa trådar i stället för att dra i dem — drar du lossnar "
        "hela varvet. Trädelarna torkas av med en lätt fuktad trasa. "
        "Träkulan i banan går att ta ur om det samlas damm under den."),
    "7564dcfb": (
        "Bädden är fast monterad och tvättas därför på plats: borsta ur "
        "pälsen med en gummiborste och torka av med en väl urvriden trasa. "
        "Sisalen på stammen dammsugs. Blir en bit av lindningen lös kan du "
        "linda tillbaka den och fästa med ett par klamrar under bädden."),
    "5d64f423": (
        "Juten på stolparna och sockeln tål att dammsugas. De två plyschytorna "
        "borstas ur med en gummiborste; en fläck tas med ljummet vatten och en "
        "väl urvriden trasa, klappande och aldrig gnuggande. Trästolparna "
        "torkas av torrt."),
    "82efeeaf": (
        "Klösklotet i jute blir luddigt med tiden och det är meningen — klipp "
        "bort de längsta trådarna med en sax. Bädden och platån borstas ur "
        "med en gummiborste. Dra åt muttern under sockeln om klotet börjar "
        "vrida sig runt stammen."),
    "bdc7e768": (
        "Tunneln går inte att ta av, så borsta ur den med en gummiborste och "
        "vänd möbeln upp och ner så att det som samlats inuti trillar ur. "
        "Juten på benen dammsugs. Svansleksaken kan tvättas för hand i "
        "ljummet vatten och lufttorkas."),
    "e2c8b0f3": (
        "Teddysammeten samlar päls och tar bäst emot en gummiborste — en "
        "klädrulle river upp luggen. Hyddan vänds upp och ner för att tömmas. "
        "Bladen är av plast och torkas av med en fuktig trasa; de tål inte "
        "att böjas fram och tillbaka många gånger."),
    "cc5da788": (
        "Det flätade kaveldunet dammsugs på låg effekt, och en fuktig trasa "
        "räcker för fläckar — blötlägg det inte, naturfibern behöver torka "
        "snabbt. Plyschen på platån och sockeln borstas ur med en "
        "gummiborste. Sisalen på stammarna dammsugs."),
    "741c5723": (
        "Filthuset dammsugs invändigt genom ingången; det går inte att ta "
        "isär. Bädden och plattformarna borstas ur med en gummiborste. "
        "Klösmattan och sisalstammarna dammsugs. Borstpelaren sköljs av "
        "under ljummet vatten och får torka helt innan katten använder den "
        "igen."),
}

FAQ = {
    "0696efce": [
        ("Hur mycket tål pelaren?",
         "Den bär 10 kg. Topplattan på 20 × 20 cm är ett avlägg för tassarna, "
         "inte en liggyta — en katt får inte plats att lägga sig där."),
        ("Rullar bollen bort?",
         "Nej. Träkulan på Ø2,5 cm ligger i en sluten bana i sockeln och kan "
         "petas runt men inte ut. Det finns två banor, en på 40 × 40 cm och "
         "en på 30 × 30 cm."),
        ("Går sisalen att byta?",
         "Nej, lindningen sitter fast på stammen. Klipp av lösa trådar "
         "efterhand i stället för att dra i dem."),
    ],
    "7564dcfb": [
        ("Hur stor är bädden?",
         "Ø41 cm utvändigt och 12 cm hög, med en liggyta på Ø35 cm och 10 cm "
         "djup invändigt. Den rymmer en katt som rullar ihop sig."),
        ("Hur tjock är klösstammen?",
         "Ø14 cm, vilket är i den grövre änden för en klöspelare. Stora tassar "
         "får ett bättre grepp om en tjock stam än om en smal."),
        ("Passar den två katter?",
         "Bädden rymmer en katt i taget. Ska två katter dela möbel behövs "
         "flera liggytor på olika nivå."),
    ],
    "5d64f423": [
        ("Är de två plyschytorna lika stora?",
         "Nej. Bädden på den långa stolpen är Ø40 cm och 8 cm hög, hoppytan "
         "på den korta är Ø30 cm och 7 cm hög."),
        ("Hur högt sitter den övre ytan?",
         "Möbeln är 61,5 cm hög totalt, och den långa stolpen är 49 cm. Den "
         "korta är 30 cm, så steget mellan ytorna är kort."),
        ("Hur mycket tål den?",
         "5 kg. Den är byggd låg och bred och är stadig i den vikten, men den "
         "är inte gjord för en tung katt."),
    ],
    "82efeeaf": [
        ("Hur stor är bädden?",
         "54 × 36 cm utvändigt med en liggyta på 45 × 32 cm och 6 cm djup. "
         "Kanten är uppvikt runt om."),
        ("Vad är klösklotet till för?",
         "Det är klösyta i den höjd där katten kommer åt den stående på "
         "bakbenen. Kloten är Ø11 cm och klädda i jute."),
        ("Hur mycket tål den?",
         "7 kg, vilket räcker även till en storvuxen katt."),
    ],
    "bdc7e768": [
        ("Hur stor är tunneln?",
         "Ø26 cm i diameter och 40 cm lång, med en öppning på 17 × 15 cm. "
         "Den passar en katt under 5 kg."),
        ("Sitter svansen fast?",
         "Den hänger i ett snöre och är 31 cm lång. Vill du inte ha den "
         "hängande går den att klippa bort."),
        ("Vad är benen klädda med?",
         "Jute, lindad kring fyra stolpar på Ø6,6 cm. Det är de ytorna katten "
         "ska klösa på."),
    ],
    "e2c8b0f3": [
        ("Hur stor är ingången till hyddan?",
         "19 × 21 cm. Det räcker för en katt upp till 5 kg, men är i minsta "
         "laget för en riktigt kraftig katt."),
        ("Vad är bladen gjorda av?",
         "Plast. De stora mäter 30 × 14 cm och de små 24 × 12 cm, och de är "
         "dekoration — de tål inte att en katt hänger i dem."),
        ("Hur många liggplatser finns det?",
         "Två: hyddan nere på 30 × 30 cm och den ovala bädden ovanför på "
         "40 × 30 cm."),
    ],
    "cc5da788": [
        ("Vad är hyddan gjord av?",
         "Flätat kaveldun kring en stomme, med plysch på insidan. Den är "
         "Ø40 cm och 38 cm hög."),
        ("Hur stor är öppningen?",
         "32 × 32 cm, alltså större än på de flesta hyddor i den här "
         "storleken. Katten behöver inte kröka sig för att komma in."),
        ("Kommer katten upp i ett hopp?",
         "Den behöver inte. Mellanplatån på 40 × 24 cm sitter mellan golvet "
         "och hyddan, så vägen upp går i två korta steg."),
    ],
    "741c5723": [
        ("Hur mycket tål den?",
         "Två katter på upp till 6 kg vardera. Talet gäller möbeln som helhet, "
         "inte varje enskild yta."),
        ("Vad är borstpelaren till för?",
         "Katten gnider sig mot den, och borsten fångar upp lös päls. Den är "
         "Ø10 cm och 25 cm hög och sitter vid sockeln."),
        ("Hur stort är huset?",
         "33,5 × 30 cm och 30 cm högt, med en ingång på 16 × 19 cm. Det är "
         "klätt i mörkgrå filt."),
    ],
}

SOKORDSLISTA = {
    "0696efce": ["klöspelare sisal", "klösstolpe katt", "klöspelare 87 cm",
                 "hög klöspelare", "klösmöbel med boll"],
    "7564dcfb": ["klöspelare med bädd", "klösstolpe med liggyta",
                 "klöspelare 87 cm", "tjock klösstam", "kattmöbel plysch"],
    "5d64f423": ["litet klösträd", "klösträd 61 cm", "lågt klösträd",
                 "klösträd trä och jute", "klösträd äldre katt"],
    "82efeeaf": ["klösträd 86 cm", "klösträd med klösklot", "klösträd stor katt",
                 "klösträd jute", "klösmöbel bred bädd"],
    "bdc7e768": ["klösträd fårdesign", "klösträd med tunnel", "klösträd 98 cm",
                 "klösmöbel djurform", "kattunnel möbel"],
    "e2c8b0f3": ["klösträd 98 cm", "klösträd med bladkrona", "grönt klösträd",
                 "klösträd med hydda", "klösmöbel växtdesign"],
    "cc5da788": ["klösträd 100 cm", "klösträd med hydda", "flätad kattkupol",
                 "klösträd naturfiber", "klösmöbel med kupol"],
    "741c5723": ["klösträd 132 cm", "klösträd två katter", "klösträd med hus",
                 "klösträd med borste", "högt klösträd fyra plan"],
}

BAS = "https://www.fyndplats.se"


def _p(t):
    return "<p>" + t + "</p>"


def bygg(pid):
    """Bygger plainDescription. Ordningen speglar runda 134 exakt.

    ☠️ BLOCKORDNINGEN ÄR INTE FRI. Butikens flikdelare är en allowlist på fyra
       strängar (`grindar.FLIKAR_SOM_KRAVS`); allt efter en träff hamnar i den
       fliken. Korslänkarna måste därför ligga FÖRE `Tekniska specifikationer`.
    """
    d = []
    d.append(_p(INTRO[pid]))

    d.append("<h2>" + RUBRIK[pid] + "</h2>")
    d.append("<ul>" + "".join("<li>" + x + "</li>" for x in PUNKTER[pid]) + "</ul>")

    d.append("<h2>" + KATT_RUBRIK[pid] + "</h2>")
    d.append(_p(KATT[pid]))

    d.append("<h2>" + BRUK_RUBRIK[pid] + "</h2>")
    d.append(_p(BRUK[pid]))

    d.append("<h2>" + KORS_INGRESS[pid] + "</h2>")
    # ☠️ ABSOLUT URL, ALDRIG ROTRELATIV (uppmätt runda 132): en href som börjar
    #    på "/produkt/" skrivs om av Wix till "https:/produkt/…".
    lankar = ", ".join(
        '<a href="{}/produkt/{}">{}</a>'.format(BAS, s, t)
        for s, t in KORSLANK[pid]
    )
    d.append(_p(KORS_TEXT[pid] + " " + lankar + "."))

    d.append("<h2>Tekniska specifikationer</h2>")
    d.append("<ul>" + "".join(
        "<li><strong>{}:</strong> {}</li>".format(e, v) for e, v in SPEC[pid]
    ) + "</ul>")

    d.append("<h2>Användning och skötsel</h2>")
    d.append(_p(SKOTSEL[pid]))

    d.append("<h2>Vanliga frågor</h2>")
    for f, s in FAQ[pid]:
        d.append("<p><strong>" + f + "</strong></p>")
        d.append(_p(s))

    return "".join(d)
