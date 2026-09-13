# -*- coding: utf-8 -*-
"""Runda 139 — alt-texter. EN PER BILD, i galleriordning.

☠️ ALT-TEXTEN PASSERAR INGEN AV STEG-GRINDARNA. `grind.py` läser `texter.py`;
   alt-texterna finns inte där. Varje regel grinden vaktar är alltså oskyddad
   här — och det är kundtext, det Google och skärmläsaren läser. Runda 106:
   fem sidor vars brödtext sa "säljs inte som kaninbostad" hade "kaniner" i
   alt-texten. Rundans förbjudna-ord-lista körs därför mot dem nedan.

⚠️ BESKRIV VARAN, INTE STAJLINGEN. Leverantörens miljöbild är iscensatt;
   katten, barnet och soffan är inte produktinformation. Utelämnas de är
   texten fortfarande sann och fullständig för sitt syfte.

⚠️ KORTETS alt börjar med "Faktakort: " och beskriver FAKTA, inte kortet.
   Inte "Fyndplats-kort: …" — det lägger vårt varumärke i ett fält som ska
   beskriva innehåll.
"""

# pid -> lista i galleriordning. Kortet ligger på plats 3 (index 2).
ALT = {
    "1467588a": [
        "Klösträd på 92 cm i mörkgrått och krämvitt, med rund bädd överst och en sisalklädd klösbräda lutad mot basen",
        "Klösträdet uppställt vid ett fönster, med bädden i ungefär samma höjd som fönsterbrädan",
        "Faktakort: klösträd 48 × 48 × 92 cm med bädd på Ø41 cm och sisallindad stam på Ø13,5 cm",
        "Bädden på Ø41 cm sedd uppifrån, med 7 cm hög kant runt hela kanten",
        "Basplattan på 48 × 48 cm med den sisalklädda klösbrädan lutad mot stammen",
        "Måttritning över klösträdet med höjd 92 cm, basplatta 48 × 48 cm och bädd på Ø41 cm",
    ],
    "27b607dc": [
        "Klöspelare på 80 cm med fyrkantig sisalstolpe och ekfärgad träplatta överst, på en träbas",
        "Klöspelaren uppställd i ett vardagsrum, där höjden går att jämföra med möblerna omkring",
        "Faktakort: klöspelare 38 × 38 × 80 cm med 76 cm sammanhängande sisalyta och topplatta på 17,5 × 17,5 cm",
        "Topplattan i ekfärgat trä och den hängande bollen sedda på nära håll",
        "Sisalytan på stolpen i närbild, med repvarven tätt lindade runt de fyra sidorna",
        "Måttritning över klöspelaren med höjd 80 cm, bas 38 × 38 cm och topplatta 17,5 × 17,5 cm",
    ],
    "3a96740e": [
        "Klösträd på 153 cm i krämvitt och kaffebrunt med sluten håla, rund korg och U-formad hängbädd längst ner",
        "Klösträdet uppställt i ett vardagsrum, där hålan och hängbädden syns i förhållande till golvet",
        "Faktakort: klösträd 65 × 50 × 153 cm med håla på 30 × 25 cm och sisallindade stammar på Ø7,1 cm",
        "Hålans öppning på 30 × 25 cm i närbild, med krämvit plysch runt kanten",
        "Bottenplattan i kaffebrunt och sisallindningen längst ner på stammen",
        "Måttritning över klösträdet med höjd 153 cm, golvyta 65 × 50 cm och håla på 30 × 25 cm",
    ],
    "3addfbf8": [
        "Lågt klösträd på 76 cm i ljusgrått med U-formad bädd överst, rund bädd nertill och klösbräda lutad mot sidan",
        "Klösträdet uppställt på ett golv intill en vägg, där den låga höjden syns mot rummet",
        "Faktakort: klösträd 60 × 30 × 76 cm med U-formad toppbädd på 45 × 25 × 12,5 cm och rund bädd på Ø34 cm",
        "Den runda bädden på Ø34 cm på bottenplattan, med mellanplanets hål på Ø15,5 cm ovanför",
        "Sisallindad stolpe på Ø5,5 cm med hängande boll i snöre",
    ],
    "4faf9f4c": [
        "Klösträd på 113 cm i ljusgrått med sluten håla, ramp, hängmatta och toppbädd med kattöron",
        "Klösträdet uppställt i ett rum bredvid en krukväxt, där höjden går att jämföra med möblerna omkring",
        "Faktakort: klösträd 60 × 40 × 113 cm med håla på 40 × 30 × 27 cm och bärförmåga 15 kg totalt",
        "Toppbädden på Ø31,5 cm med kattöron och 7 cm hög kant, sedd snett uppifrån",
        "Hängmattan på Ø30 cm spänd mellan stolparna, med tyget svankande i mitten",
        "Måttritning över klösträdet med höjd 113 cm, bas 60 × 40 cm och håla på 40 × 30 × 27 cm",
    ],
    "8d074911": [
        "Väggmonterat klösträd i fyra delar: kattbädd, molnformad klösbräda, klösstolpe med tre plan och sluten håla med mjuk stege",
        "De fyra delarna uppsatta på en vägg, med stegen som en svank mellan hålan och hyllplanet",
        "Faktakort: väggklösträd i fyra delar med klösstolpe på 84 cm och håla på 30 × 30 cm med 16 cm öppning",
        "Samma vägg sedd snett från sidan, där avstånden mellan de fyra delarna syns",
    ],
    "90573e36": [
        "Klösträd på 220 till 240 cm i grönt och rosa som spänns mellan golv och tak, med sluten håla nertill",
        "Klösträdet uppspänt mot taket i ett rum, där stolpen går hela vägen från golv till tak",
        "Faktakort: klösträd 30 × 25 cm golvyta, ställbart 220–240 cm, med håla på Ø33 × 31 cm",
        "Klösträdet i ett annat rum, med den gröna hålan och de blomformade planen i profil",
        "Måttritning över klösträdet med höjd 220–240 cm, håla Ø33 × 31 cm och öppning 20 × 22 cm",
    ],
    "a4d8feca": [
        "Klöstunna på Ø35 × 60 cm klädd i naturbrun sisal, med två runda ingångar ovanför varandra",
        "Klöstunnan uppställd på ett golv intill en vägg, där höjden går att jämföra med möblerna omkring",
        "Faktakort: klöstunna Ø35 × 60 cm med två rum, ingång på Ø17 cm och bärförmåga 10 kg",
        "Den övre ingången på Ø17 cm i närbild, med krämvit plyschkant runt hålet",
        "Sisalväven på tunnans utsida i närbild, med repvarven tätt lagda intill varandra",
        "Måttritning över klöstunnan med höjd 60 cm, diameter 35 cm och ingång på Ø17 cm",
    ],
    "b04b5375": [
        "Väggklösträd i beige och krämvitt med en tvåvåningsdel på 40 × 28 × 73 cm och tre fristående klivsteg",
        "Delarna uppsatta på en vägg, med klivstegen i en stigande linje fram till huvuddelen",
        "Faktakort: väggklösträd med huvuddel 40 × 28 × 73 cm, klösstam Ø20 × 32 cm och hängmatta Ø30 cm",
        "Huvuddelens två hyllplan med rundade kanter, sisalstammen emellan och hängmattan på sidan",
        "De tre klivstegen på väggen, vart och ett Ø20 cm och 32 cm djupt",
        "Måttritning över väggklösträdet med huvuddel 40 × 28 × 73 cm och klivsteg på Ø20 × 32 cm",
    ],
    "b813d037": [
        "Klösträd på 104 cm i grått med fyra plan, slutet hus i mitten och toppbädd med kattöron",
        "Klösträdet uppställt på en matta i ett vardagsrum, där de fyra planen syns i profil",
        "Faktakort: klösträd 48 × 48 × 104 cm med hus på Ø30 × 25 cm och bärförmåga 30 kg totalt",
        "Toppbädden på Ø32 cm med kattöron och 7 cm hög kant, sedd snett uppifrån",
        "Mellanplanet på Ø30 cm ovanför huset, med den sisallindade stolpen bredvid",
        "Måttritning över klösträdet med höjd 104 cm, bas Ø48 cm och hus på Ø30 × 25 cm",
    ],
}
