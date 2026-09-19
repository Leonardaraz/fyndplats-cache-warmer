# -*- coding: utf-8 -*-
"""Runda 140 — alt-texter. EN PER BILD, i den NYA galleriordningen.

☠️ ALT-TEXTEN PASSERAR INGEN AV STEG-GRINDARNA. `grind.py` läser `texter.py`;
   alt-texterna finns inte där. Varje regel grinden vaktar är alltså oskyddad
   här — och det är kundtext, det Google och skärmläsaren läser. Rundans
   förbjudna-ord-lista körs därför mot dem i `altgrind.py`.

⚠️ BESKRIV VARAN, INTE STAJLINGEN. Leverantörens miljöbilder är iscensatta;
   mopsen, yorkshireterriern och rummet är inte produktinformation. Hunden
   nämns bara när den bär ett budskap som INTE går att säga utan den — här
   aldrig, så den utelämnas genomgående.

☠️ BENFÄRGEN ÄR RUNDANS FYND OCH GÄLLER OCKSÅ HÄR. `2ba6baf0`, `9ee2fa6e`,
   `c11948ac` och `07ac9918` har SVARTA ben. En alt-text som säger "ljust
   träben" om dem hade återinfört felet i den kanal ingen grind läste.

GALLERIORDNINGEN efter Steg 9 (husets konvention, se runda 139):
    hjälte · miljö · FAKTAKORT · detalj · detalj · måttritning
`07ac9918` har fyra bilder — dess bild 4 och 5 bar tysk respektive engelsk
text och är borta.
"""

# pid -> lista i galleriordning. Kortet ligger på plats 3 (index 2).
ALT = {
    # ---- Grupp A: platt bädd, rullad kant, ljusa koniska furuben ----
    "01fcdf1d": [
        "Hundsoffa på 98 cm i ljusgrå möbelväv med rullad kant runt tre sidor och koniska ben i ljust trä",
        "Hundsoffan sedd snett framifrån, med den öppna framkanten vänd mot betraktaren",
        "Faktakort: hundsoffa 98 × 67 × 25 cm med sittyta 86 × 59 cm och dyna 86 × 59 × 4,5 cm",
        "Närbild av hörnet där den rullade kanten möter sitsen, och av det koniska träbenet under",
        "Den rullade kanten sedd inifrån sittytan, där stoppningen sveper i ett stycke runt hörnet",
        "Måttritning över hundsoffan med längd 98 cm, djup 67 cm, höjd 25 cm och sittyta 86 × 59 cm",
    ],
    "bb3cd4ed": [
        "Hundsoffa på 98 cm i grön möbelväv med rullad kant runt tre sidor och koniska ben i ljust trä",
        "Den gröna hundsoffan sedd snett framifrån med den öppna framkanten mot betraktaren",
        "Faktakort: hundsoffa 98 × 67 × 25 cm med sittyta 86 × 59 cm och dyna 86 × 59 × 4,5 cm",
        "Närbild av armstödet i grön väv och det koniska träbenet under det",
        "Det gröna kantstödet sett inifrån sittytan, med stoppningen i ett svep runt hörnet",
        "Måttritning över hundsoffan med längd 98 cm, djup 67 cm, höjd 25 cm och sittyta 86 × 59 cm",
    ],
    "881540a6": [
        "Hundsoffa på 98 cm i blå möbelväv med rullad kant runt tre sidor och koniska ben i ljust trä",
        "Den blå hundsoffan sedd snett framifrån med den öppna framkanten mot betraktaren",
        "Faktakort: hundsoffa 98 × 67 × 25 cm med sittyta 86 × 59 cm och dyna 86 × 59 × 4,5 cm",
        "Den blå hundsoffan i ett rum, placerad fritt på golvet intill en byrå",
        "Hundsoffan sedd rakt framifrån, där sitsens djup och kantens höjd syns i förhållande till varandra",
        "Måttritning över hundsoffan med längd 98 cm, djup 67 cm, höjd 25 cm och sittyta 86 × 59 cm",
    ],
    # ---- Grupp B: liten soffa, rutstickad väv, ljusa björkben ----
    "5b8162d1": [
        "Hundsoffa på 64 cm i ljusgrå rutstickad väv med rygg runt tre sidor och runda ben i ljus björk",
        "Den ljusgrå hundsoffan sedd snett framifrån, med den öppna framkanten mot betraktaren",
        "Faktakort: hundsoffa 64 × 45 × 36 cm med sittyta 54 × 40,5 cm och 9 cm höga björkben",
        "Hundsoffan placerad fritt på golvet i ett rum, med benen synliga hela vägen ner",
        "Sittytan sedd uppifrån, där den rutstickade väven löper över både sits och rygg",
        "Måttritning över hundsoffan med längd 64 cm, djup 45 cm, höjd 36 cm och sittyta 54 × 40,5 cm",
    ],
    "1835c144": [
        "Hundsoffa på 64 cm i petrolblå rutstickad väv med rygg runt tre sidor och runda ben i ljus björk",
        "Den petrolblå hundsoffan sedd snett framifrån med den lösa dynan på plats",
        "Faktakort: hundsoffa 64 × 45 × 36 cm med sittyta 54 × 40,5 cm och 9 cm höga björkben",
        "Närbild av benets fästplatta i trä, skruvad mot stommens undersida, med halkskydd på benänden",
        "Den petrolblå hundsoffan placerad fritt på golvet i ett rum",
        "Måttritning över hundsoffan med längd 64 cm, djup 45 cm, höjd 36 cm och sittyta 54 × 40,5 cm",
    ],
    # ---- Grupp C: snäckformad rygg, SVARTA ben ----
    "9ee2fa6e": [
        "Hundsoffa på 98,5 cm i grön sammetsväv med snäckformad rygg i mjuka bågar och svarta ben",
        "Den gröna hundsoffan sedd snett framifrån, där ryggens bågar går att räkna",
        "Faktakort: hundsoffa 98,5 × 60,5 × 35,5 cm med sittyta 86 × 47 cm och 4 cm tjock dyna",
        "Sittytan sedd uppifrån, med den lösa dynan liggande mot ryggens nedre kant",
        "Närbild av dynans dragkedja, där den gröna ovansidan möter det svarta undertyget",
        "Måttritning över hundsoffan med längd 98,5 cm, djup 60,5 cm, höjd 35,5 cm och sittyta 86 × 47 cm",
    ],
    "c11948ac": [
        "Hundsoffa på 98,5 cm i mörkgrå sammetsväv med snäckformad rygg i mjuka bågar och svarta ben",
        "Den mörkgrå hundsoffan sedd från sidan, där ryggens bågar och de svarta benen syns",
        "Faktakort: hundsoffa 98,5 × 60,5 × 35,5 cm med sittyta 86 × 47 cm och 4 cm tjock dyna",
        "Den mörkgrå hundsoffan placerad fritt på golvet i ett rum, med de svarta benen synliga",
        "Hundsoffan sedd snett bakifrån, där ryggens bågar tecknar sig mot väggen",
        "Måttritning över hundsoffan med längd 98,5 cm, djup 60,5 cm, höjd 35,5 cm och sittyta 86 × 47 cm",
    ],
    # ---- Enskilda modeller ----
    "c9ccf5a3": [
        "Hundbädd på 90 cm i grått med stoppat kantstöd runt tre sidor och en quiltad oval liggyta",
        "Hundbädden sedd snett framifrån med den öppna framkanten mot betraktaren",
        "Faktakort: hundbädd 90 × 78 × 25 cm med sittyta 70 × 63 cm och 15 cm brett kantstöd",
        "Bädden sedd rakt uppifrån, där den quiltade ovala insatsen ligger nedsänkt i kantstödet",
        "Närbild av dragkedjan i kantstödets söm, där hela överdelen går att dra av",
        "Måttritning över hundbädden med längd 90 cm, djup 78 cm, höjd 25 cm och liggyta 70 × 63 cm",
    ],
    "4c5d4687": [
        "Hundsoffa på 102 cm i grå sammet med låg genomgående rygg och höga, utåtlutande ben i furu",
        "Hundsoffan sedd snett framifrån, där benens lutning och sitsens längd syns samtidigt",
        "Faktakort: hundsoffa 102 × 58,5 × 42,5 cm med sittyta 83,5 × 49,5 cm och 15 cm höga furuben",
        "Ryggens svep sett uppifrån, där den grå sammeten löper i ett stycke från ände till ände",
        "Hela hundsoffan i profil, med den lösa dynan på plats och de höga benen under",
        "Måttritning över hundsoffan med längd 102 cm, djup 58,5 cm, höjd 42,5 cm och sittyta 83,5 × 49,5 cm",
    ],
    "68f8cae9": [
        "Hundbädd på 96 cm i petrolblått med kantstöd runt tre sidor, öppen framkant och ljusa träben",
        "Hundbädden sedd snett framifrån med den lösa kantkudden framför",
        "Faktakort: hundbädd 96 × 66 × 24 cm med sittyta 80 × 50 cm och 12 cm brett kantstöd",
        "En hand som drar överdraget över träramen underifrån, utan verktyg",
        "Närbild av överdragets resårkant där den håller tyget spänt runt ramens undersida",
        "Måttritning över hundbädden med längd 96 cm, djup 66 cm, höjd 24 cm och sittyta 80 × 50 cm",
    ],
    "ee19a8c8": [
        "Husdjurssoffa på 70 cm i krämvit plysch med knappstickad rygg som sluter sig runt hela sitsen",
        "Husdjurssoffan sedd snett framifrån, där ryggen och de låga träbenen syns",
        "Faktakort: husdjurssoffa 70 × 47 × 30 cm med sittyta 52 × 33 cm och 20 cm hög rygg",
        "Soffan rakt framifrån, där de två knapparna i ryggen och den lösa dynan syns",
        "Soffan sedd snett bakifrån, med ryggens rundade form och de korta benen i ljust trä",
        "Måttritning över husdjurssoffan med längd 70 cm, djup 47 cm, höjd 30 cm och sittyta 52 × 33 cm",
    ],
    "2ba6baf0": [
        "Hundsoffa på 82 cm i ljusgrå sammet med rygg runt tre sidor och svarta ben under stommen",
        "Hundsoffan sedd snett framifrån, där den öppna framkanten och de svarta benen syns",
        "Faktakort: hundsoffa 82 × 54 × 36 cm med sittyta 72 × 50 cm och 10 cm höga svarta ben",
        "Sittytan sedd uppifrån med den lösa dynan mot ryggens nedre kant",
        "Närbild av dynans dragkedja, där den ljusgrå ovansidan möter det svarta undertyget",
        "Måttritning över hundsoffan med längd 82 cm, djup 54 cm, höjd 36 cm och sittyta 72 × 50 cm",
    ],
    "22c7de56": [
        "Rund husdjurssoffa på 65 cm i mörkgrönt med rygg runt hela varvet utom vid ingången och runda björkben",
        "Den runda husdjurssoffan sedd snett framifrån, där ingången bryter ryggens varv",
        "Faktakort: rund husdjurssoffa 65 × 64 × 37 cm med sittyta 48 × 55 cm och rund dyna 48 × 48 × 4 cm",
        "Närbild av det runda björkbenet där det möter den mörkgröna väven",
        "Närbild av dynans dragkedja i den mörkgröna väven",
        "Måttritning över husdjurssoffan med bredd 65 cm, djup 64 cm, höjd 37 cm och rund dyna 55 och 48 cm",
    ],
    "07ac9918": [
        "Husdjurssoffa på 76 cm i ljusgrå plysch med sluten låda under sitsen och svarta ben",
        "Husdjurssoffan sedd snett framifrån, där det slutna underredet går ända ner till benen",
        "Faktakort: husdjurssoffa 76 × 45 × 43 cm med sittyta 59,5 × 41 cm och förvaringsfack 64 × 37,5 × 9,5 cm",
        "Måttritning över husdjurssoffan med längd 76 cm, djup 45 cm och förvaringsfacket 64 × 37,5 cm med 9,5 cm djup",
    ],
}
