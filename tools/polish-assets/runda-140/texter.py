# -*- coding: utf-8 -*-
"""Runda 140 — all kundtext, byggd i FIL och grindad före skrivning.

☠️ TEXTEN SKRIVS ALDRIG INLINE I ETT API-ANROP (batch 64: fem inline gav nio
   fel som nådde Wix, tre via fil gav noll).

☠️ DYNMÅTTET SKRIVS BARA NÄR DYNAN FÅR PLATS PÅ SITSEN. Fyra av fjorton
   källrader anger en dyna som är STÖRRE än sitsen den ska ligga på:

       9ee2fa6e / c11948ac   dyna 92 cm  mot sits 86 cm
       68f8cae9              dyna 90 cm  mot sits 80 cm
       07ac9918              dyna 63 cm  mot sits 59,5 cm

   För dem skrivs bara dynans TJOCKLEK, som är entydig. Regel 7: ett fält
   som inte går att lita på är inget fält, inte ett tal som "ser rimligt ut".

☠️ HUNDENS KROPPSLÄNGD SKRIVS INTE PÅ 68f8cae9. Tyskan säger `60 cm
   Schulterhöhe` där varje syskon säger kroppslängd — och 60 cm mankhöjd är
   en helt annan hund än 60 cm kroppslängd.

☠️ INGEN CE-MÄRKNING. Det finns ingen CE-direktivsfamilj för husdjursmöbler.
☠️ INGET PVC, INGEN VATTENAVVISNING. 07ac9918:s bild 5 påstår båda; spec-
   blocket säger plysch, skumstoppning och naturträ. Bilden går bort.
☠️ `Artikelnummer` är ALDRIG en etikett här.
☠️ INGET AVSÄNDARLAND. EU-lager-ribbonen är enda sanktionerade stället.
"""
import os as _os
import sys as _sys

_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), ".."))
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import grindar as _G                                             # noqa: E402
import matt as _M                                                # noqa: E402

BAS = "https://www.fyndplats.se"

SLUG = {
    "01fcdf1d": "hundsoffa-98-cm-ljusgra",
    "bb3cd4ed": "hundsoffa-98-cm-gron",
    "881540a6": "hundsoffa-98-cm-bla",
    "5b8162d1": "hundsoffa-64-cm-ljusgra",
    "1835c144": "hundsoffa-64-cm-petrol",
    "9ee2fa6e": "hundsoffa-snackrygg-gron",
    "c11948ac": "hundsoffa-snackrygg-gra",
    "c9ccf5a3": "hundbadd-kantstod-90-cm",
    "4c5d4687": "hundsoffa-sammet-102-cm",
    "68f8cae9": "hundbadd-96-cm-petrol",
    "ee19a8c8": "husdjurssoffa-70-cm-krem",
    "2ba6baf0": "hundsoffa-sammet-82-cm",
    "22c7de56": "husdjurssoffa-rund-gron",
    "07ac9918": "husdjurssoffa-med-forvaring",
}
SKU = {pid: "FP-" + _G.sku_bas(slug) for pid, slug in SLUG.items()}

# Den publicerade grannen — samma modell som grupp A, i en femte färg.
PUB_SLUG = "hundsoffa-stor-hund-upphojd"
PUB_NAMN = "Hundsoffa 98 cm i mörkgrått"

NAMN = {
    "01fcdf1d": "Hundsoffa 98 cm i ljusgrått – upphöjd bädd med tvättbar dyna",
    "bb3cd4ed": "Hundsoffa 98 cm i grönt – upphöjd bädd med tvättbar dyna",
    "881540a6": "Hundsoffa 98 cm i blått – upphöjd bädd med tvättbar dyna",
    "5b8162d1": "Hundsoffa 64 cm i ljusgrått – rygg runt tre sidor och björkben",
    "1835c144": "Hundsoffa 64 cm i petrolblått – rygg runt tre sidor och björkben",
    "9ee2fa6e": "Hundsoffa 98,5 cm i grönt – snäckformad rygg och tvättbar dyna",
    "c11948ac": "Hundsoffa 98,5 cm i mörkgrått – snäckformad rygg och tvättbar dyna",
    "c9ccf5a3": "Hundbädd 90 cm med kantstöd – avtagbart överdrag och furuben",
    "4c5d4687": "Hundsoffa i sammet 102 cm – 15 cm höga furuben och lös dyna",
    "68f8cae9": "Hundbädd 96 cm i petrolblått – avtagbart överdrag och furuben",
    "ee19a8c8": "Husdjurssoffa 70 cm i krämvitt – plysch och massiv fururam",
    "2ba6baf0": "Hundsoffa i sammet 82 cm – rygg runt tre sidor och svarta ben",
    "22c7de56": "Rund husdjurssoffa 65 cm i mörkgrönt – rygg runt utom ingången",
    "07ac9918": "Husdjurssoffa 76 cm med förvaring under sitsen – plysch och trä",
}

TITEL = {
    "01fcdf1d": "Hundsoffa 98 cm ljusgrå – upphöjd bädd | Fyndplats",
    "bb3cd4ed": "Hundsoffa 98 cm grön – upphöjd bädd | Fyndplats",
    "881540a6": "Hundsoffa 98 cm blå – upphöjd bädd | Fyndplats",
    "5b8162d1": "Hundsoffa 64 cm ljusgrå – hund upp till 8 kg | Fyndplats",
    "1835c144": "Hundsoffa 64 cm petrolblå – hund upp till 8 kg | Fyndplats",
    "9ee2fa6e": "Hundsoffa 98,5 cm grön – snäckformad rygg | Fyndplats",
    "c11948ac": "Hundsoffa 98,5 cm mörkgrå – snäckformad rygg | Fyndplats",
    "c9ccf5a3": "Hundbädd 90 cm med kantstöd – avtagbart överdrag | Fyndplats",
    "4c5d4687": "Hundsoffa i sammet 102 cm – höga furuben | Fyndplats",
    "68f8cae9": "Hundbädd 96 cm petrolblå – avtagbart överdrag | Fyndplats",
    "ee19a8c8": "Husdjurssoffa 70 cm krämvit – plysch och furu | Fyndplats",
    "2ba6baf0": "Hundsoffa i sammet 82 cm – rygg runt tre sidor | Fyndplats",
    "22c7de56": "Rund husdjurssoffa 65 cm mörkgrön | Fyndplats",
    "07ac9918": "Husdjurssoffa 76 cm med förvaring under sitsen | Fyndplats",
}

META = {
    "01fcdf1d": "Hundsoffa 98 × 67 × 25 cm i ljusgrått med furuben, 86 × 59 cm "
                "sittyta och avtagbar tvättbar dyna. För hundar upp till 30 kg "
                "och 60 cm kroppslängd.",
    "bb3cd4ed": "Hundsoffa 98 × 67 × 25 cm i grönt med furuben, 86 × 59 cm "
                "sittyta och avtagbar tvättbar dyna. För hundar upp till 30 kg "
                "och 60 cm kroppslängd.",
    "881540a6": "Hundsoffa 98 × 67 × 25 cm i blått med furuben, 86 × 59 cm "
                "sittyta och avtagbar tvättbar dyna. För hundar upp till 30 kg "
                "och 60 cm kroppslängd.",
    "5b8162d1": "Hundsoffa 64 × 45 × 36 cm i ljusgrå sammetskänsla med rygg runt "
                "tre sidor och ben i massiv björk. För hundar upp till 8 kg och "
                "35 cm kroppslängd.",
    "1835c144": "Hundsoffa 64 × 45 × 36 cm i petrolblå sammetskänsla med rygg runt "
                "tre sidor och ben i massiv björk. För hundar upp till 8 kg och "
                "35 cm kroppslängd.",
    "9ee2fa6e": "Hundsoffa 98,5 × 60,5 × 35,5 cm i grönt med snäckformad rygg, "
                "86 × 47 cm sittyta och avtagbar dyna. Bär upp till 25 kg.",
    "c11948ac": "Hundsoffa 98,5 × 60,5 × 35,5 cm i mörkgrått med snäckformad rygg, "
                "86 × 47 cm sittyta och avtagbar dyna. Bär upp till 25 kg.",
    "c9ccf5a3": "Hundbädd 90 × 78 × 25 cm i grått med stoppat kantstöd runt tre "
                "sidor, avtagbart överdrag och furuben. För hundar upp till 25 kg "
                "och 55 cm kroppslängd.",
    "4c5d4687": "Hundsoffa 102 × 58,5 × 42,5 cm i grå sammet med 15 cm höga furuben "
                "och lös dyna med tvättbart överdrag. För hundar upp till 25 kg och "
                "55 cm kroppslängd.",
    "68f8cae9": "Hundbädd 96 × 66 × 24 cm i petrolblått med kantstöd runt tre sidor, "
                "avtagbart överdrag och furuben. För hundar upp till 30 kg.",
    "ee19a8c8": "Husdjurssoffa 70 × 47 × 30 cm i krämvit plysch med massiv fururam "
                "och avtagbar dyna. Bär upp till 4,5 kg — för de allra minsta "
                "hundarna och för katt.",
    "2ba6baf0": "Hundsoffa 82 × 54 × 36 cm i ljusgrå sammet med rygg runt tre sidor, "
                "10 cm höga svarta ben och tvättbart dynöverdrag. För hundar upp till "
                "20 kg och 50 cm kroppslängd.",
    "22c7de56": "Rund husdjurssoffa 65 × 64 × 37 cm i mörkgrönt med rygg runt "
                "utom ingången och runda björkben. Bär upp till 4,5 kg — för kattens och den "
                "lilla hundens plats.",
    "07ac9918": "Husdjurssoffa 76 × 45 × 43 cm i ljusgrå plysch med ett 64 × 37,5 cm "
                "förvaringsfack under sitsen. Bär upp till 15 kg.",
}

INTRO = {
    "01fcdf1d": "En hundsoffa som ser ut som en möbel och inte som en hundplats. "
                "Den ljusgrå möbelväven går i ton med de flesta soffor, och de "
                "koniska furubenen lyfter bädden 8 cm från golvet så att luften "
                "kommer åt underifrån. Ryggen sveper från armstödens höjd ner mot "
                "en låg framkant, så hunden kan kliva i utan att kliva över.",
    "bb3cd4ed": "En hundsoffa som ser ut som en möbel och inte som en hundplats. "
                "Den gröna möbelväven ger färg åt ett rum utan att skrika, och de "
                "koniska furubenen lyfter bädden 8 cm från golvet så att luften "
                "kommer åt underifrån. Ryggen sveper från armstödens höjd ner mot "
                "en låg framkant, så hunden kan kliva i utan att kliva över.",
    "881540a6": "En hundsoffa som ser ut som en möbel och inte som en hundplats. "
                "Den mättat blå möbelväven står emot smuts bättre än en ljus, och "
                "de koniska furubenen lyfter bädden 8 cm från golvet så att luften "
                "kommer åt underifrån. Ryggen sveper från armstödens höjd ner mot "
                "en låg framkant, så hunden kan kliva i utan att kliva över.",
    "5b8162d1": "En liten soffa med rygg runt tre sidor, klädd i en ljusgrå väv med "
                "sammetskänsla och quiltat mönster. Ryggen går 11,5 cm över sitsen "
                "och ger stöd att lägga huvudet mot; benen i massiv björk lyfter "
                "bädden 9 cm från golvet. Skalan är gjord för den lilla hunden — "
                "sittytan är 54 × 40,5 cm.",
    "1835c144": "En liten soffa med rygg runt tre sidor, klädd i en petrolblå väv "
                "med sammetskänsla och quiltat mönster. Ryggen går 11,5 cm över "
                "sitsen och ger stöd att lägga huvudet mot; benen i massiv björk "
                "lyfter bädden 9 cm från golvet. Skalan är gjord för den lilla "
                "hunden — sittytan är 54 × 40,5 cm.",
    "9ee2fa6e": "Ryggen är formad i mjuka bågar som en snäcka, och det är den som "
                "ger möbeln sitt uttryck. Den gröna sammetsväven sitter på en stomme "
                "med svartlackerade ben i massiv björk, och sittytan är 86 × 47 cm — "
                "bred nog för "
                "en hund som gärna sträcker ut sig helt. Dynan är 4 cm tjock och "
                "går att ta av.",
    "c11948ac": "Ryggen är formad i mjuka bågar som en snäcka, och det är den som "
                "ger möbeln sitt uttryck. Den mörkgrå sammetsväven sitter på en "
                "stomme med svartlackerade ben i massiv björk, och sittytan är "
                "86 × 47 cm — bred "
                "nog för en hund som gärna sträcker ut sig helt. Dynan är 4 cm tjock "
                "och går att ta av.",
    "c9ccf5a3": "En bred, nästan kvadratisk bädd med stoppat kantstöd runt tre sidor "
                "— hunden får något att lägga huvudet och ryggen mot åt tre håll. "
                "Hela överdelen lyfts av och tvättas, vilket är det som skiljer den "
                "från en bädd med bara löst liggunderlag. Furubenen håller bädden "
                "8 cm ovanför golvet.",
    "4c5d4687": "En hundsoffa i grå sammet på 15 cm höga, vinklade furuben — de gör att "
                "den läser som en möbel snarare än som en bädd på golvet. Ryggen är hög i ena änden och sveper ner mot den "
                "andra, och den lösa dynan på 83,5 × 49,5 cm har ett överdrag som "
                "tas av och tvättas.",
    "68f8cae9": "En petrolblå bädd med stoppat kantstöd runt tre sidor och en tjock "
                "lös dyna i mitten. Överdraget träs över träramen med resår i "
                "kanten, så hela klädseln går av utan att bädden tas isär — det är "
                "den detaljen som gör den praktisk med en hund som fäller. "
                "Furubenen lyfter bädden 8 cm.",
    "ee19a8c8": "En liten soffa i krämvit plysch med knappar i ryggen, byggd på en "
                "ram av massiv furu. Rygg och armstöd går hela vägen runt sittytan "
                "så att det lilla djuret inte rullar ur i sömnen, och de 5 cm höga "
                "benen håller bädden från golvdraget. Sittytan är 52 × 33 cm.",
    "2ba6baf0": "En hundsoffa i ljusgrå sammet med rygg runt tre sidor och "
                "svartlackerade ben i massiv björk. Sittytan är 72 × 50 cm och ryggen går 20 cm över "
                "den, vilket ger stöd åt en hund som helst ligger hoprullad mot en "
                "kant. Dynan har ett överdrag med dragkedja som tas av och tvättas.",
    "22c7de56": "En rund soffa där ryggen löper hela vägen runt utom vid ingången, "
                "så att djuret ligger i en skål i stället för på en yta. Den "
                "mörkgröna väven har flanellkänsla, och de runda björkbenen lyfter "
                "bädden 6 cm från golvet. Ytterdiametern är 65 × 64 cm, sittytan "
                "48 × 55 cm.",
    "07ac9918": "En schäslongformad husdjurssoffa i ljusgrå plysch där hela sitsen "
                "är ett lock: under den ligger ett fack på 64 × 37,5 cm för koppel, "
                "borste och leksaker. Dynan är fäst med en elastisk snodd så att "
                "den följer med när locket fälls upp, och sitter kvar när djuret "
                "hoppar i.",
}

RUBRIK = {p: "Egenskaper" for p in NAMN}

PUNKTER = {
    "01fcdf1d": [
        "Upphöjd bädd på 8 cm höga furuben — luft under och skydd mot golvdrag.",
        "Sittyta 86 × 59 cm med en 4,5 cm tjock dyna.",
        "Dynan är avtagbar och tvättbar.",
        "Rygg och armstöd är 15,5 cm höga och 7 cm breda.",
        "Ljusgrå möbelväv på stomme av MDF och skumstoppning.",
        "Monteras med fyra ben.",
    ],
    "bb3cd4ed": [
        "Upphöjd bädd på 8 cm höga furuben — luft under och skydd mot golvdrag.",
        "Sittyta 86 × 59 cm med en 4,5 cm tjock dyna.",
        "Dynan är avtagbar och tvättbar.",
        "Rygg och armstöd är 15,5 cm höga och 7 cm breda.",
        "Grön möbelväv på stomme av MDF och skumstoppning.",
        "Monteras med fyra ben.",
    ],
    "881540a6": [
        "Upphöjd bädd på 8 cm höga furuben — luft under och skydd mot golvdrag.",
        "Sittyta 86 × 59 cm med en 4,5 cm tjock dyna.",
        "Dynan är avtagbar och tvättbar.",
        "Rygg och armstöd är 15,5 cm höga och 7 cm breda.",
        "Blå möbelväv på stomme av MDF och skumstoppning.",
        "Monteras med fyra ben.",
    ],
    "5b8162d1": [
        "Rygg runt tre sidor, 11,5 cm över sittytan.",
        "Sittyta 54 × 40,5 cm, 24,5 cm över golvet.",
        "Ben i massiv björk, 9 cm höga, med halkskydd under.",
        "Ljusgrå väv med sammetskänsla och quiltat mönster.",
        "Levereras i ett paket och monteras med fyra ben.",
    ],
    "1835c144": [
        "Rygg runt tre sidor, 11,5 cm över sittytan.",
        "Sittyta 54 × 40,5 cm, 24,5 cm över golvet.",
        "Ben i massiv björk, 9 cm höga, med halkskydd under.",
        "Petrolblå väv med sammetskänsla och quiltat mönster.",
        "Levereras i ett paket och monteras med fyra ben.",
    ],
    "9ee2fa6e": [
        "Snäckformad rygg, 19,5 cm över sittytan.",
        "Sittyta 86 × 47 cm, 16 cm över golvet.",
        "Dyna 4 cm tjock, avtagbar med tvättbart överdrag.",
        "Grön sammetsväv på stomme med svartlackerade ben i massiv björk.",
        "Bär upp till 25 kg.",
    ],
    "c11948ac": [
        "Snäckformad rygg, 19,5 cm över sittytan.",
        "Sittyta 86 × 47 cm, 16 cm över golvet.",
        "Dyna 4 cm tjock, avtagbar med tvättbart överdrag.",
        "Mörkgrå sammetsväv på stomme med svartlackerade ben i massiv björk.",
        "Bär upp till 25 kg.",
    ],
    "c9ccf5a3": [
        "Stoppat kantstöd runt tre sidor, 11 cm högt och 15 cm brett.",
        "Hela överdelen är avtagbar och tvättbar.",
        "Sittyta 70 × 63 cm med en 14 cm hög stoppning.",
        "Furuben 8 cm höga med halkskyddande fotplattor.",
        "Grå möbelväv på stomme av MDF och skumstoppning.",
    ],
    "4c5d4687": [
        "Furuben 15 cm höga och vinklade.",
        "Sittyta 83,5 × 49,5 cm, 25,5 cm över golvet.",
        "Lös dyna 83,5 × 49,5 cm, 5 cm tjock, med avtagbart överdrag.",
        "Rygg 22 cm hög, armstöd 15 cm — båda 6 cm breda.",
        "Grå sammet av 100 % polyester på stomme av lamellträ och furu.",
    ],
    "68f8cae9": [
        "Kantstöd runt tre sidor, 15,5 cm högt.",
        "Sittyta 80 × 50 cm, 14,5 cm över golvet med dynan i.",
        "Dynan är upp till 8 cm tjock.",
        "Överdraget träs över träramen med resår och går av utan verktyg.",
        "Petrolblå möbelväv på stomme av MDF och skumstoppning, furuben 8 cm.",
    ],
    "ee19a8c8": [
        "Rygg och armstöd hela vägen runt sittytan, 20 cm över golvet.",
        "Sittyta 52 × 33 cm med en avtagbar dyna på 52 × 33 × 3 cm.",
        "Ram i massiv furu, klädsel i krämvit plysch.",
        "Ben 5 cm höga.",
        "Bär upp till 4,5 kg.",
    ],
    "2ba6baf0": [
        "Rygg runt tre sidor, 20 cm över sittytan, armstöd 4,5 cm breda.",
        "Sittyta 72 × 50 cm, 16 cm över golvet.",
        "Dyna 72 × 47,5 × 4 cm med dragkedja i överdraget.",
        "Ljusgrå sammet av 100 % polyester, svartlackerade ben i björk, 10 cm.",
        "Bär en hund på upp till 20 kg.",
    ],
    "22c7de56": [
        "Rund form, 65 × 64 cm, med rygg hela vägen runt utom vid ingången.",
        "Sittyta 48 × 55 cm, 20 cm över golvet.",
        "Rund dyna 48 × 48 × 4 cm, avtagbar och tvättbar.",
        "Mörkgrön väv med flanellkänsla, runda björkben 6 cm höga.",
        "Bär upp till 4,5 kg.",
    ],
    "07ac9918": [
        "Förvaringsfack under hela sitsen: 64 × 37,5 × 9,5 cm.",
        "Sittyta 59,5 × 41 cm, 26 cm över golvet.",
        "Dynan är 5 cm tjock och fäst med en elastisk snodd.",
        "Ljusgrå plysch på ram av naturträ.",
        "Bär upp till 15 kg, och möbeln själv väger 7 kg.",
    ],
}

# ── Steg 2: den avgörande gränsen får EGEN RUBRIK, skriven positivt ──────
HUND_RUBRIK = {
    "01fcdf1d": "För hundar upp till 30 kg",
    "bb3cd4ed": "För hundar upp till 30 kg",
    "881540a6": "För hundar upp till 30 kg",
    "5b8162d1": "För hundar upp till 8 kg",
    "1835c144": "För hundar upp till 8 kg",
    "9ee2fa6e": "För hundar upp till 25 kg",
    "c11948ac": "För hundar upp till 25 kg",
    "c9ccf5a3": "För hundar upp till 25 kg",
    "4c5d4687": "För hundar upp till 25 kg",
    "68f8cae9": "För hundar upp till 30 kg",
    "ee19a8c8": "För husdjur upp till 4,5 kg",
    "2ba6baf0": "För hundar upp till 20 kg",
    "22c7de56": "För husdjur upp till 4,5 kg",
    "07ac9918": "För husdjur upp till 15 kg",
}

_MAT = ("Mät hunden från nosen till svansroten medan den står, och jämför med "
        "sittytan innan du beställer. ")

HUND = {
    "01fcdf1d": _MAT + "Bädden är gjord för hundar upp till 30 kg med en "
                "kroppslängd på högst 60 cm, och sittytan är 86 × 59 cm.",
    "bb3cd4ed": _MAT + "Bädden är gjord för hundar upp till 30 kg med en "
                "kroppslängd på högst 60 cm, och sittytan är 86 × 59 cm.",
    "881540a6": _MAT + "Bädden är gjord för hundar upp till 30 kg med en "
                "kroppslängd på högst 60 cm, och sittytan är 86 × 59 cm.",
    "5b8162d1": _MAT + "Soffan är gjord för hundar upp till 8 kg med en "
                "kroppslängd på högst 35 cm. Sittytan är 54 × 40,5 cm, alltså "
                "avsedd för en tax, en chihuahua eller en katt — inte för en "
                "mellanstor hund.",
    "1835c144": _MAT + "Soffan är gjord för hundar upp till 8 kg med en "
                "kroppslängd på högst 35 cm. Sittytan är 54 × 40,5 cm, alltså "
                "avsedd för en tax, en chihuahua eller en katt — inte för en "
                "mellanstor hund.",
    "9ee2fa6e": _MAT + "Soffan bär upp till 25 kg och är avsedd för hundar med "
                "en kroppslängd på högst 55 cm. Sittytan är 86 × 47 cm.",
    "c11948ac": _MAT + "Soffan bär upp till 25 kg och är avsedd för hundar med "
                "en kroppslängd på högst 55 cm. Sittytan är 86 × 47 cm.",
    "c9ccf5a3": _MAT + "Bädden är gjord för hundar upp till 25 kg med en "
                "kroppslängd på högst 55 cm, och sittytan är 70 × 63 cm.",
    "4c5d4687": _MAT + "Soffan är gjord för hundar upp till 25 kg med en "
                "kroppslängd på högst 55 cm, och sittytan är 83,5 × 49,5 cm.",
    "68f8cae9": _MAT + "Bädden är gjord för hundar upp till 30 kg, och sittytan "
                "är 80 × 50 cm.",
    "ee19a8c8": _MAT + "Soffan bär upp till 4,5 kg och är avsedd för djur med en "
                "kroppslängd på högst 35 cm — alltså en katt eller en av de allra "
                "minsta hundraserna. Den är för liten och för lätt byggd för en "
                "mellanstor hund, hur stor den än ser ut på bild.",
    "2ba6baf0": _MAT + "Soffan är gjord för hundar upp till 20 kg med en "
                "kroppslängd på högst 50 cm, och sittytan är 72 × 50 cm.",
    "22c7de56": _MAT + "Soffan bär upp till 4,5 kg och är avsedd för djur med en "
                "kroppslängd på högst 30 cm — alltså en katt eller en av de allra "
                "minsta hundraserna. Ytterdiametern på 65 cm gör att den ser "
                "rymligare ut än den bär.",
    "07ac9918": _MAT + "Soffan bär upp till 15 kg, och sittytan är 59,5 × 41 cm.",
}

KORS_INGRESS = {p: "Passar inte den här?" for p in NAMN}
KORS_TEXT = {p: "Fler hundbäddar och husdjurssoffor hos oss:" for p in NAMN}

KORSLANK = {
    "01fcdf1d": [(SLUG["bb3cd4ed"], "samma soffa i grönt"),
                 (SLUG["881540a6"], "samma soffa i blått"),
                 (PUB_SLUG, "samma soffa i mörkgrått")],
    "bb3cd4ed": [(SLUG["01fcdf1d"], "samma soffa i ljusgrått"),
                 (SLUG["881540a6"], "samma soffa i blått"),
                 (PUB_SLUG, "samma soffa i mörkgrått")],
    "881540a6": [(SLUG["01fcdf1d"], "samma soffa i ljusgrått"),
                 (SLUG["bb3cd4ed"], "samma soffa i grönt"),
                 (PUB_SLUG, "samma soffa i mörkgrått")],
    "5b8162d1": [(SLUG["1835c144"], "samma soffa i petrolblått"),
                 (SLUG["22c7de56"], "en rund modell för djur upp till 4,5 kg")],
    "1835c144": [(SLUG["5b8162d1"], "samma soffa i ljusgrått"),
                 (SLUG["22c7de56"], "en rund modell för djur upp till 4,5 kg")],
    "9ee2fa6e": [(SLUG["c11948ac"], "samma soffa i mörkgrått"),
                 (SLUG["01fcdf1d"], "en bredare bädd för hundar upp till 30 kg")],
    "c11948ac": [(SLUG["9ee2fa6e"], "samma soffa i grönt"),
                 (SLUG["01fcdf1d"], "en bredare bädd för hundar upp till 30 kg")],
    "c9ccf5a3": [(SLUG["68f8cae9"], "en bädd med avtagbart överdrag i petrolblått"),
                 (SLUG["01fcdf1d"], "en soffa med öppen framkant i ljusgrått")],
    "4c5d4687": [(SLUG["2ba6baf0"], "en mindre sammetssoffa i ljusgrått"),
                 (SLUG["9ee2fa6e"], "en modell med snäckformad rygg i grönt")],
    "68f8cae9": [(SLUG["c9ccf5a3"], "en bredare bädd med kantstöd i grått"),
                 (SLUG["881540a6"], "en soffa med öppen framkant i blått")],
    "ee19a8c8": [(SLUG["22c7de56"], "en rund modell i mörkgrönt"),
                 (SLUG["5b8162d1"], "en modell för hundar upp till 8 kg")],
    "2ba6baf0": [(SLUG["4c5d4687"], "en längre sammetssoffa med höga ben"),
                 (SLUG["5b8162d1"], "en mindre modell för hundar upp till 8 kg")],
    "22c7de56": [(SLUG["ee19a8c8"], "en krämvit modell i plysch"),
                 (SLUG["5b8162d1"], "en modell för hundar upp till 8 kg")],
    "07ac9918": [(SLUG["2ba6baf0"], "en sammetssoffa utan förvaringsfack"),
                 (SLUG["ee19a8c8"], "en mindre modell i krämvit plysch")],
}

_A_SPEC = lambda farg: [
    ("Mått", "98 × 67 × 25 cm (L × B × H)"),
    ("Sittyta", "86 × 59 cm, 14 cm över golvet"),
    ("Dyna", "86 × 59 × 4,5 cm, avtagbar och tvättbar"),
    ("Rygg och armstöd", "7 cm breda, 15,5 cm höga"),
    ("Benhöjd", "8 cm"),
    ("Material", "polyester, MDF, skumstoppning och furu"),
    ("Färg", farg),
    ("Rekommenderad hund", "upp till 30 kg, kroppslängd högst 60 cm"),
    ("Paketmått", "78 × 17,5 × 65 cm"),
    ("Fraktvikt", "11,5 kg"),
    ("Ingår", "soffa och bruksanvisning"),
    ("Montering", "krävs"),
]
_B_SPEC = lambda farg: [
    ("Mått", "64 × 45 × 36 cm (L × B × H)"),
    ("Sittyta", "54 × 40,5 cm, 24,5 cm över golvet"),
    ("Ryggens höjd över sittytan", "11,5 cm"),
    ("Benhöjd", "9 cm, massiv björk med halkskydd"),
    ("Material", "polyester med sammetskänsla, skumstoppning och björk"),
    ("Färg", farg),
    ("Rekommenderad hund", "upp till 8 kg, kroppslängd högst 35 cm"),
    ("Paketmått", "65 × 48 × 31 cm"),
    ("Fraktvikt", "7,8 kg"),
    ("Leverans", "ett paket"),
    ("Montering", "krävs"),
]
_C_SPEC = lambda farg: [
    ("Mått", "98,5 × 60,5 × 35,5 cm (L × B × H)"),
    ("Sittyta", "86 × 47 cm, 16 cm över golvet"),
    ("Dyna", "4 cm tjock, avtagbar och tvättbar"),
    ("Ryggens höjd över sittytan", "19,5 cm"),
    ("Material", "polyester, skumstoppning och björk"),
    ("Färg", farg),
    ("Bärförmåga", "25 kg"),
    ("Rekommenderad hund", "upp till 25 kg, kroppslängd högst 55 cm"),
    ("Paketmått", "101 × 62 × 27,5 cm"),
    ("Fraktvikt", "10,7 kg"),
    ("Ingår", "soffa och bruksanvisning"),
    ("Montering", "krävs"),
]

SPEC = {
    "01fcdf1d": _A_SPEC("ljusgrå med naturträ"),
    "bb3cd4ed": _A_SPEC("grön med naturträ"),
    "881540a6": _A_SPEC("blå med naturträ"),
    "5b8162d1": _B_SPEC("ljusgrå med naturträ"),
    "1835c144": _B_SPEC("petrolblå med naturträ"),
    "9ee2fa6e": _C_SPEC("grön med svarta ben"),
    "c11948ac": _C_SPEC("mörkgrå med svarta ben"),
    "c9ccf5a3": [
        ("Mått", "90 × 78 × 25 cm (L × B × H)"),
        ("Sittyta", "70 × 63 cm, 14 cm över golvet"),
        ("Kantstöd", "15 cm brett, 11 cm högt, runt tre sidor"),
        ("Överdrag", "avtagbart och tvättbart"),
        ("Benhöjd", "8 cm, med halkskyddande fotplattor"),
        ("Material", "polyester, MDF, skumstoppning och furu"),
        ("Färg", "grå med naturträ"),
        ("Rekommenderad hund", "upp till 25 kg, kroppslängd högst 55 cm"),
        ("Paketmått", "98 × 18 × 65 cm"),
        ("Fraktvikt", "10,6 kg"),
        ("Ingår", "bädd och bruksanvisning"),
        ("Montering", "krävs"),
    ],
    "4c5d4687": [
        ("Mått", "102 × 58,5 × 42,5 cm (L × B × H)"),
        ("Sittyta", "83,5 × 49,5 cm, 25,5 cm över golvet"),
        ("Dyna", "83,5 × 49,5 × 5 cm, med avtagbart överdrag"),
        ("Rygg", "22 cm hög, 6 cm bred"),
        ("Armstöd", "15 cm högt, 6 cm brett"),
        ("Benhöjd", "15 cm"),
        ("Material", "sammet av 100 % polyester, skumstoppning, furu, "
                     "lamellträ och fiberduk"),
        ("Färg", "grå med naturträ"),
        ("Rekommenderad hund", "upp till 25 kg, kroppslängd högst 55 cm"),
        ("Paketmått", "88 × 24,5 × 52,5 cm"),
        ("Fraktvikt", "10,9 kg"),
        ("Ingår", "soffa, dyna och bruksanvisning"),
        ("Montering", "krävs, fyra ben"),
    ],
    "68f8cae9": [
        ("Mått", "96 × 66 × 24 cm (L × B × H)"),
        ("Sittyta", "80 × 50 cm, 14,5 cm över golvet med dynan i"),
        ("Dyna", "upp till 8 cm tjock"),
        ("Kantstöd", "12 cm brett, 15,5 cm högt, runt tre sidor"),
        ("Överdrag", "träs över ramen med resår, går av utan verktyg"),
        ("Benhöjd", "8 cm"),
        ("Material", "polyester, MDF, skumstoppning och furu"),
        ("Färg", "petrolblå med naturträ"),
        ("Rekommenderad hund", "upp till 30 kg"),
        ("Paketmått", "74 × 16 × 59 cm"),
        ("Fraktvikt", "10,2 kg"),
        ("Ingår", "bädd och bruksanvisning"),
        ("Montering", "krävs"),
    ],
    "ee19a8c8": [
        ("Mått", "70 × 47 × 30 cm (L × B × H)"),
        ("Sittyta", "52 × 33 cm, 14 cm över golvet"),
        ("Dyna", "52 × 33 × 3 cm, avtagbar"),
        ("Rygg", "20 cm över golvet, 6 cm djup"),
        ("Benhöjd", "5 cm"),
        ("Material", "plysch, skumstoppning och massiv furu"),
        ("Färg", "krämvit med naturträ"),
        ("Bärförmåga", "4,5 kg"),
        ("Rekommenderat djur", "upp till 4,5 kg, kroppslängd högst 35 cm"),
        ("Paketmått", "72 × 27 × 49 cm"),
        ("Fraktvikt", "5,5 kg"),
        ("Ingår", "soffa och bruksanvisning"),
        ("Montering", "krävs"),
    ],
    "2ba6baf0": [
        ("Mått", "82 × 54 × 36 cm (L × B × H)"),
        ("Sittyta", "72 × 50 cm, 16 cm över golvet"),
        ("Dyna", "72 × 47,5 × 4 cm, överdrag med dragkedja"),
        ("Ryggens höjd över sittytan", "20 cm"),
        ("Armstöd", "4,5 cm breda"),
        ("Benhöjd", "10 cm, svartlackerad massiv björk"),
        ("Material", "sammet av 100 % polyester, skumstoppning och björk"),
        ("Färg", "ljusgrå med svarta ben"),
        ("Rekommenderad hund", "upp till 20 kg, kroppslängd högst 50 cm"),
        ("Paketmått", "83,5 × 55,5 × 28 cm"),
        ("Fraktvikt", "9 kg"),
        ("Ingår", "soffa och bruksanvisning"),
        ("Montering", "krävs"),
    ],
    "22c7de56": [
        ("Mått", "65 × 64 × 37 cm (L × B × H)"),
        ("Sittyta", "48 × 55 cm, 20 cm över golvet"),
        ("Dyna", "48 × 48 × 4 cm, avtagbar"),
        ("Benhöjd", "6 cm, runda björkben"),
        ("Material", "polyester med flanellkänsla, skumstoppning och björk"),
        ("Färg", "mörkgrön med naturträ"),
        ("Bärförmåga", "4,5 kg"),
        ("Rekommenderat djur", "upp till 4,5 kg, kroppslängd högst 30 cm"),
        ("Paketmått", "66,5 × 66,5 × 33 cm"),
        ("Fraktvikt", "8,5 kg"),
        ("Ingår", "soffa och bruksanvisning"),
        ("Montering", "krävs"),
    ],
    "07ac9918": [
        ("Mått", "76 × 45 × 43 cm (L × B × H)"),
        ("Sittyta", "59,5 × 41 cm, 26 cm över golvet"),
        ("Förvaringsfack", "64 × 37,5 × 9,5 cm, under hela sitsen"),
        ("Dyna", "5 cm tjock, fäst med elastisk snodd"),
        ("Material", "naturträ, plysch och skumstoppning"),
        ("Färg", "ljusgrå med svarta ben"),
        ("Bärförmåga", "15 kg"),
        ("Vikt", "7 kg"),
        ("Paketmått", "74 × 48,5 × 16,5 cm"),
        ("Fraktvikt", "8,4 kg"),
        ("Ingår", "soffa och bruksanvisning"),
        ("Montering", "krävs"),
    ],
}

_LUKT = (" En svag lukt av nytt tyg de första dagarna är normal; låt möbeln stå "
         "luftigt ett dygn eller två så försvinner den.")

_SKOTSEL_DYNA = ("Dra åt benskruvarna efter första månaden och sedan en gång om "
                 "året — det är de som håller möbeln stadig. Ta av dynans överdrag "
                 "och tvätta enligt tvättrådet i sömmen. Dammsug väven med "
                 "möbelmunstycke och torka av träbenen med en lätt fuktad trasa.")

SKOTSEL = {
    "01fcdf1d": _SKOTSEL_DYNA + _LUKT,
    "bb3cd4ed": _SKOTSEL_DYNA + _LUKT,
    "881540a6": _SKOTSEL_DYNA + _LUKT,
    "5b8162d1": ("Dra åt benskruvarna efter första månaden och sedan en gång om "
                 "året. Dammsug den quiltade väven med möbelmunstycke i sömmarnas "
                 "riktning och torka av björkbenen med en lätt fuktad trasa. "
                 "Ta fläckar direkt, med ljummet vatten och en urvriden "
                 "trasa."),
    "1835c144": ("Dra åt benskruvarna efter första månaden och sedan en gång om "
                 "året. Dammsug den quiltade väven med möbelmunstycke i sömmarnas "
                 "riktning och torka av björkbenen med en lätt fuktad trasa. "
                 "Ta fläckar direkt, med ljummet vatten och en urvriden "
                 "trasa."),
    "9ee2fa6e": _SKOTSEL_DYNA,
    "c11948ac": _SKOTSEL_DYNA,
    "c9ccf5a3": ("Lyft av hela överdelen och tvätta den enligt tvättrådet i sömmen "
                 "— det är den delen som tar upp päls och smuts. Dammsug kantstödet "
                 "med möbelmunstycke och torka av furubenen med en lätt fuktad "
                 "trasa. Kontrollera fotplattornas halkskydd om bädden börjar "
                 "glida."),
    "4c5d4687": _SKOTSEL_DYNA,
    "68f8cae9": ("Dra av överdraget från träramen — resåren i kanten gör att hela "
                 "klädseln lossnar utan att bädden tas isär — och tvätta det enligt "
                 "tvättrådet i sömmen. Dammsug dynan med möbelmunstycke och torka "
                 "av furubenen med en lätt fuktad trasa."),
    "ee19a8c8": ("Borsta plyschen med en torr klädborste i lugghårets riktning; "
                 "dammsugning på högt läge drar i luggen. Ta av dynan och tvätta "
                 "den enligt tvättrådet i sömmen. Torka av fururamen med en lätt "
                 "fuktad trasa."),
    "2ba6baf0": ("Dra åt benskruvarna efter första månaden och sedan en gång om "
                 "året. Öppna dragkedjan, ta av dynöverdraget och tvätta det enligt "
                 "tvättrådet i sömmen. Dammsug sammeten med möbelmunstycke och "
                 "torka av benen med en lätt fuktad trasa."),
    "22c7de56": ("Ta ut den runda dynan och tvätta den enligt tvättrådet i sömmen. "
                 "Dammsug den runda ryggen med möbelmunstycke och torka av "
                 "björkbenen med en lätt fuktad trasa."),
    "07ac9918": ("Fäll upp sitsen och vädra förvaringsfacket med jämna mellanrum; "
                 "ett stängt fack med fuktiga leksaker i börjar lukta. Borsta "
                 "plyschen med en torr klädborste och torka av träramen med en lätt "
                 "fuktad trasa. Dra åt gångjärnsskruvarna om locket börjar glappa."),
}

_FAQ_A = lambda farg: [
    ("Hur stor hund passar soffan?",
     "Hundar upp till 30 kg med en kroppslängd på högst 60 cm. Sittytan är "
     "86 × 59 cm, så en hund som gärna sträcker ut sig helt behöver ligga på "
     "diagonalen."),
    ("Går dynan att tvätta?",
     "Ja. Dynan lyfts ur och överdraget tvättas enligt tvättrådet i sömmen."),
    ("Vad är benen gjorda av?",
     "Furu. De är koniska, 8 cm höga, och skruvas fast i botten."),
    ("Varför är bädden upphöjd?",
     "Luften kommer åt underifrån, vilket håller bädden torrare, och hunden "
     "slipper golvdraget. Åtta centimeter räcker för båda delarna."),
    ("Vilken färg är soffan?",
     "Den är " + farg + " med ben i obehandlad furu. Modellen finns i fyra "
     "färger — se länkarna högre upp."),
]
_FAQ_B = lambda farg: [
    ("Hur stor hund passar soffan?",
     "Hundar upp till 8 kg med en kroppslängd på högst 35 cm. Sittytan är "
     "54 × 40,5 cm — mät hunden innan du beställer."),
    ("Går den bra till katt?",
     "Ja. Ryggen runt tre sidor är precis vad en katt söker, och viktgränsen "
     "ligger långt över en normalstor katt."),
    ("Hur hög är den?",
     "36 cm totalt, varav 24,5 cm upp till sittytan. Benen är 9 cm."),
    ("Är väven sammet?",
     "Den är polyester med sammetskänsla och ett quiltat mönster, inte vävd "
     "sammet."),
    ("Vilken färg är soffan?",
     "Den är " + farg + ". Modellen finns i två färger — se länkarna "
     "högre upp."),
]
_FAQ_C = lambda farg: [
    ("Hur stor hund passar soffan?",
     "Den bär upp till 25 kg och är avsedd för hundar med en kroppslängd på "
     "högst 55 cm. Sittytan är 86 × 47 cm."),
    ("Vad menas med snäckformad rygg?",
     "Ryggstycket är sytt i mjuka bågar som liknar en snäcka. Det är en ren "
     "formdetalj — höjden över sittytan är 19,5 cm hela vägen."),
    ("Går dynan att tvätta?",
     "Ja. Den lyfts ur och överdraget tvättas enligt tvättrådet i sömmen."),
    ("Vad är benen gjorda av?",
     "Massiv björk, svartlackerad."),
    ("Vilken färg är soffan?",
     "Den är " + farg + ". Modellen finns i två färger — se länkarna "
     "högre upp."),
]

FAQ = {
    "01fcdf1d": _FAQ_A("ljusgrå"),
    "bb3cd4ed": _FAQ_A("grön"),
    "881540a6": _FAQ_A("blå"),
    "5b8162d1": _FAQ_B("ljusgrå"),
    "1835c144": _FAQ_B("petrolblå"),
    "9ee2fa6e": _FAQ_C("grön"),
    "c11948ac": _FAQ_C("mörkgrå"),
    "c9ccf5a3": [
        ("Hur stor hund passar bädden?",
         "Hundar upp till 25 kg med en kroppslängd på högst 55 cm. Sittytan är "
         "70 × 63 cm, alltså nästan kvadratisk — den passar en hund som helst "
         "ligger hoprullad."),
        ("Vad är det som går att ta av?",
         "Hela överdelen. Den lyfts av stommen och tvättas, till skillnad från "
         "en bädd där bara ett löst liggunderlag går att ta bort."),
        ("Hur högt är kantstödet?",
         "11 cm över sittytan och 15 cm brett, runt tre sidor. Framkanten är "
         "öppen så hunden kan kliva i."),
        ("Står den stadigt på parkett?",
         "Fotplattorna under furubenen har halkskydd. Kontrollera dem om bädden "
         "börjar glida."),
        ("Vilken färg är den?",
         "Grå väv med ben i obehandlad furu."),
    ],
    "4c5d4687": [
        ("Hur stor hund passar soffan?",
         "Hundar upp till 25 kg med en kroppslängd på högst 55 cm. Sittytan är "
         "83,5 × 49,5 cm."),
        ("Varför är benen så höga?",
         "Benhöjden på 15 cm gör att möbeln läser som en fåtölj snarare än som "
         "en bädd på golvet, och den ger plats att dammsuga under."),
        ("Går dynan att tvätta?",
         "Ja. Överdraget tas av och tvättas enligt tvättrådet i sömmen."),
        ("Är ryggen lika hög runt om?",
         "Nej. Ryggen är 22 cm hög i ena änden och sveper ner mot armstödet, "
         "som är 15 cm."),
        ("Vilken färg är soffan?",
         "Grå sammet med ben i obehandlad furu."),
    ],
    "68f8cae9": [
        ("Hur stor hund passar bädden?",
         "Hundar upp till 30 kg. Sittytan är 80 × 50 cm — mät hunden från nosen "
         "till svansroten och jämför."),
        ("Hur tar man av klädseln?",
         "Överdraget är fäst med resår runt träramens underkant. Dra av det "
         "hela vägen runt; bädden behöver inte tas isär."),
        ("Hur tjock är dynan?",
         "Upp till 8 cm."),
        ("Hur högt är kantstödet?",
         "15,5 cm, runt tre sidor. Framkanten är öppen."),
        ("Vilken färg är den?",
         "Petrolblå väv med ben i obehandlad furu."),
    ],
    "ee19a8c8": [
        ("Hur stort djur passar soffan?",
         "Den bär upp till 4,5 kg och är avsedd för djur med en kroppslängd på "
         "högst 35 cm. Det är en katt eller en av de allra minsta hundraserna — "
         "inte en mellanstor hund."),
        ("Vad är den klädd i?",
         "Plysch, på en ram av massiv furu med skumstoppning emellan."),
        ("Går dynan att ta ur?",
         "Ja, dynan på 52 × 33 × 3 cm lyfts ur."),
        ("Hur hög är ryggen?",
         "20 cm räknat från golvet, och den går hela vägen runt sittytan så att "
         "djuret inte rullar ur i sömnen."),
        ("Vilken färg är soffan?",
         "Krämvit med ben i obehandlad furu."),
    ],
    "2ba6baf0": [
        ("Hur stor hund passar soffan?",
         "Hundar upp till 20 kg med en kroppslängd på högst 50 cm. Sittytan är "
         "72 × 50 cm."),
        ("Går dynöverdraget att ta av?",
         "Ja, det har dragkedja. Tvätta enligt tvättrådet i sömmen."),
        ("Hur högt sitter sittytan?",
         "16 cm över golvet, och benen är 10 cm av det."),
        ("Vad är benen gjorda av?",
         "Massiv björk, svartlackerad."),
        ("Vilken färg är soffan?",
         "Ljusgrå sammet med svarta ben."),
    ],
    "22c7de56": [
        ("Hur stort djur passar soffan?",
         "Den bär upp till 4,5 kg och är avsedd för djur med en kroppslängd på "
         "högst 30 cm. Ytterdiametern på 65 cm gör att den ser rymligare ut än "
         "den bär."),
        ("Varför är den rund?",
         "Ryggen löper hela vägen runt utom vid ingången, så djuret ligger i en "
         "skål i stället för på en yta. Katter och små hundar som sover "
         "hoprullade söker den formen."),
        ("Går dynan att tvätta?",
         "Ja. Den runda dynan på 48 × 48 × 4 cm lyfts ur och tvättas enligt "
         "tvättrådet i sömmen."),
        ("Vad är väven för material?",
         "Polyester med flanellkänsla."),
        ("Vilken färg är soffan?",
         "Mörkgrön med runda ben i obehandlad björk."),
    ],
    "07ac9918": [
        ("Hur stort djur passar soffan?",
         "Den bär upp till 15 kg. Sittytan är 59,5 × 41 cm."),
        ("Hur stort är förvaringsfacket?",
         "64 × 37,5 cm och 9,5 cm djupt. Det rymmer koppel, borste och "
         "leksaker — inte en säck foder."),
        ("Följer dynan med när locket öppnas?",
         "Ja. Den är fäst med en elastisk snodd, så den sitter kvar både när "
         "locket fälls upp och när djuret hoppar i."),
        ("Vad är soffan klädd i?",
         "Plysch, på en ram av naturträ med skumstoppning emellan."),
        ("Vilken färg är soffan?",
         "Ljusgrå med svarta ben."),
    ],
}


def _p(t):
    return "<p>" + t + "</p>"


def bygg(pid):
    """Bygger plainDescription.

    ☠️ ORDNINGEN ÄR INTE FRI. Butikens flikdelare är en allowlist; allt EFTER
       en träff hamnar i den fliken. Korslänkarna måste ligga FÖRE
       `Tekniska specifikationer`.
    """
    d = [_p(INTRO[pid])]

    d.append("<h2>" + RUBRIK[pid] + "</h2>")
    d.append("<ul>" + "".join("<li>" + x + "</li>" for x in PUNKTER[pid]) + "</ul>")

    d.append("<h2>" + HUND_RUBRIK[pid] + "</h2>")
    d.append(_p(HUND[pid]))

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


SOKORD = {
    "01fcdf1d": ["hundsoffa stor hund", "hundbädd 98 cm", "upphöjd hundsoffa"],
    "bb3cd4ed": ["hundsoffa grön", "hundbädd 98 cm", "upphöjd hundsoffa"],
    "881540a6": ["hundsoffa blå", "hundbädd 98 cm", "upphöjd hundsoffa"],
    "5b8162d1": ["hundsoffa liten hund", "hundbädd 64 cm", "hundsoffa ljusgrå"],
    "1835c144": ["hundsoffa liten hund", "hundbädd 64 cm", "hundsoffa petrolblå"],
    "9ee2fa6e": ["hundsoffa med snäckrygg", "hundbädd med rygg", "hundsoffa grön"],
    "c11948ac": ["hundsoffa mörkgrå", "hundbädd med rygg", "hundsoffa med snäckrygg"],
    "c9ccf5a3": ["hundbädd med kantstöd", "hundbädd 90 cm",
                 "hundbädd avtagbart överdrag"],
    "4c5d4687": ["hundsoffa i sammet", "hundsoffa med höga ben", "hundbädd 102 cm"],
    "68f8cae9": ["hundbädd avtagbart överdrag", "hundbädd 96 cm",
                 "hundbädd petrolblå"],
    "ee19a8c8": ["kattsoffa", "husdjurssoffa liten", "hundsoffa 70 cm"],
    "2ba6baf0": ["hundsoffa i sammet 82 cm", "hundsoffa 20 kg", "hundbädd med rygg"],
    "22c7de56": ["rund kattsoffa", "husdjurssoffa rund", "kattbädd med rygg"],
    "07ac9918": ["husdjurssoffa med förvaring", "hundsoffa med förvaring",
                 "kattsoffa med förvaring"],
}
