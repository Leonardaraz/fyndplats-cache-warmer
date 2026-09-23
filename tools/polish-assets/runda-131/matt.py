# -*- coding: utf-8 -*-
"""Runda 131 — ALLT uppmätt ur leverantörens `Technische Daten` eller ur
BILDEN. Ingenting härlett, ingenting från titeln.

☠️ PRODUKTTYPEN AVGÖRS AV BILDEN — OCH KONTAKTARKET RÄCKER INTE.
   Rundan bytte typ på fem av sju produkter under arbetets gång, i BÅDA
   riktningarna, och varje byte kom av en ny förstoring:

   | id8        | Steg 3 sa  | Steg 4 (ark) sa | Steg 5 (zoom) sa  |
   |------------|------------|-----------------|-------------------|
   | `2166c50f` | ramp       | TRAPPA, 8 steg  | **TRAPPA, 10 steg** |
   | `9a513e9a` | ramp       | TRAPPA, 8 steg  | **TRAPPA, 10 steg** |
   | `c2be0f30` | ramp       | TRAPPA, 8 steg  | **TRAPPA, 10 steg** |
   | `15e4c7a7` | ramp       | TRAPPA, 6 steg  | **RAMP med halkbattar** |

   Den sista är den dyraste lärdomen: en HALKBATT på en ramp och en NOSNING
   på en trappa ser exakt likadana ut i miniatyr. Det som skiljer dem är om
   ytan MELLAN listerna är sammanhängande (ramp) eller avsatsad (trappa),
   och det syns först i förstoring. Steg 3 hade rätt hela tiden;
   `Lieferumfang: 1 x Haustier-Rampe` var korrekt och kontaktarket kullkastade
   ett riktigt svar med ett felaktigt.

☠️ ANTALET STEG: 10, INTE 8. Leverantörens EGEN slug bär
   `hundetreppe-mit-10-stufen`, och en uppmärkt räkning på den svarta
   modellen (`markerade-steg.jpg`) ger samma tal. Steg 4:s "8" var en
   miniatyrräkning och var fel. TVÅ oberoende källor ger 10 — det är husets
   krav för att skriva ut ett tal.

⚠️ HALKLISTERNA ÄR FYRA, MEKANISKT RÄKNADE på alla tre färgsyskonen
   (sammanhängande gula klumpar > 800 px: 4, 4, 4). Första mätningen gav
   4/0/0 — tröskeln var satt efter den GRÅA modellens klara gula, och
   syskonens lister är blekare. En färgtröskel är inte en mätning förrän
   den prövats på varje syskon.

⚠️ MAXLASTEN ÄR RUNDANS VIKTIGASTE SIFFRA. Den spänner 15–50 kg på varor
   som ser likadana ut, och den avgör om kunden kan använda varan alls.
   Den står i NAMNET på alla sju.
"""

# id8 -> uppmätt. `last` = kg.
RAMPER = {
    # ☠️ FÄLLD AV DUBBLETTGRINDEN — ÄR publicerade `hundramp-bil-155-cm`
    #    (911818e3), som sedan 2026-09-11 är ommappad till Aosom och
    #    utkastet pensionerat. Ligger kvar som mätning, poleras inte.
    "11c2b7e8": dict(
        typ="bilramp", fälld="dubblett av hundramp-bil-155-cm",
        farg_de="Schwarz+Grün", material="Kunststoff",
        matt="155L x 38,5B x 15,5H cm", hopfalld="78L x 48,5B x 17,5H cm",
        rampbredd="33 cm", last=90, pris=829,
        leverans=["1 x Hunderampe für Autos", "1 x Bedienungsanleitung"]),

    # --- FÄRGSYSKON: samma modell i tre färger. TRAPPA, inte ramp. ---
    "2166c50f": dict(
        typ="biltrappa", farg="grå", farg_de="Grau", material="Kunststoff, TPR",
        matt="154L x 40B x 7,5H cm", hopfalld="79L x 40B x 13H cm",
        halkleist="22,8L x 5B cm", halklister=4, steg=10, steg_matt="34,5L x 8B cm",
        maxhojd="82H cm", last=25, pris=759,
        leverans=["1 x Hunderampe", "1 x Bedienungsanleitung"]),
    "9a513e9a": dict(
        typ="biltrappa", farg="brun", farg_de="Braun", material="Kunststoff, TPR",
        matt="154L x 40B x 7,5H cm", hopfalld="79L x 40B x 13H cm",
        halkleist="22,8L x 5B cm", halklister=4, steg=10, steg_matt="34,5L x 8B cm",
        maxhojd="82H cm", last=25, pris=759,
        leverans=["1 x Hunderampe", "1 x Bedienungsanleitung"]),
    "c2be0f30": dict(
        typ="biltrappa", farg="svart", farg_de="Schwarz", material="Kunststoff, TPR",
        matt="154L x 40B x 7,5H cm", hopfalld="79L x 40B x 13H cm",
        halkleist="22,8L x 5B cm", halklister=4, steg=10, steg_matt="34,5L x 8B cm",
        maxhojd="82H cm", last=25, pris=839,
        leverans=["1 x Hunderampe", "1 x Bedienungsanleitung"]),

    # --- MÖBELRAMPER: fyra olika konstruktioner, inga syskon. ---
    "ed1ea8dc": dict(
        typ="mobelramp", farg="naturträ och svart", farg_de="Naturholz+Schwarz",
        material="Kiefernholz, Teppich",
        matt="83,5L x 35B x 47,5H cm", hopfalld="80L x 35B x 5H cm",
        hojder="24/32,5/40/47,5 cm", lutning="15/22/28/35°",
        last=15, pris=799,
        leverans=["1 x Haustier-Rampe", "1 x Anleitung"]),
    "15e4c7a7": dict(
        typ="mobelramp", farg="natur och grå", farg_de="Natur+Grau",
        material="Mehrschichtenplatte, Tannenholz, Polyester",
        matt="90L x 40B x 45H cm", halkavstand="10 cm",
        last=40, pris=979,
        leverans=["1 x Haustier-Rampe", "1 x Handbuch"],
        anm="☠️ RAMP, inte trappa. Kontaktarket läste halkbattarna som "
            "nosningar; förstoringen visar att mattan löper SAMMANHÄNGANDE "
            "under dem. `Lieferumfang` hade rätt, titeln fel."),
    "935cd17b": dict(
        typ="mobelramp", farg="svart och naturträ", farg_de="Schwarz+Naturholz",
        material="Kiefernholz, Polyester",
        matt="90L x 40B x 61H cm", transport="100L x 40B x 7H cm",
        hojder="26/39/50/61 cm",
        last=40, last_angiven_hog=75, pris=959,
        leverans=["1 x Haustierrampe", "1 x Anleitung"],
        anm="TVÅ laster: Belastbarkeit 75 kg OCH Empfohlenes Gewicht <= 40 kg. "
            "Den konservativa gäller (runda 66:s regel). ⚠️ Axelordningen är "
            "`90B x 40T x 61H` i källan; familjens övriga tre är L x B x H med "
            "35-40 cm GÅNGBREDD, så 90 är längden och 40 bredden."),
    "1b64abde": dict(
        typ="mobelramp_plattform", farg="vit och grå", farg_de="Weiß+Grau",
        material="Kiefernholz, Polyester",
        matt="125L x 40B x 35,5H cm", ramp="89L x 40B cm",
        plattform="29,5L x 30B cm", last=50, pris=1149,
        leverans=["1 x Haustierrampe", "1 x Anleitung"],
        anm="Har en PLAN PLATTFORM högst upp — syns i bild 1, där hunden går "
            "ner från den. Det är vad som skiljer den från de tre andra."),
}

# ---- PUBLICERADE GRANNAR, lästa ur Wix 2026-09-11. Korslänkarnas facit. ----
# ☠️ En korslänk bär MÅLETS tal, aldrig våra egna. Talen nedan är de som får
#    stå i en mening som innehåller en länk hit.
GRANNAR = {
    "hundramp-bil-155-cm": dict(
        namn="Hundramp för bil 155 cm", matt="155 x 38,5 x 15,5 cm",
        hopfalld="78 x 48,5 x 17,5 cm", rampbredd="33 cm", last=90,
        material="polypropen", yta="konstgräs", montering="krävs"),
    "hopfallbar-hundramp-bil-158-cm": dict(
        namn="Hopfällbar hundramp till bil 158 cm", matt="158 x 43,5 x 2,5 cm",
        hopfalld="45 x 43,5 x 13 cm", gangyta="152 cm", lasthojd="80 cm",
        lutning="30°", last=60, hundvikt=40, montering="krävs inte"),
    "hundtrappa-med-forvaring": dict(
        namn="Hundtrappa med förvaring 3 steg", matt="40,5 x 44,5 x 38 cm",
        stegmatt="40,5 x 16,5 x 12,6 cm", steg=3, last=30),
    "hopfallbar-hundtrappa-3-steg": dict(
        namn="Hopfällbar hundtrappa 3 steg", matt="53 x 30,5 x 36,5 cm",
        hopfalld="63 x 30,5 x 11,3 cm", steg=3, last=10),
    "vikbar-husdjurstrappa-4-steg": dict(
        namn="Vikbar husdjurstrappa 4 steg", matt="67 x 38 x 49,5 cm",
        hopfalld="77,2 x 38 x 12,6 cm", stegmatt="33 x 16 x 12,5 cm",
        steg=4, last=20),
    "hundtrappa-sma-hundar-katter-4-steg": dict(
        namn="Hundtrappa för små hundar och katter", matt="60 x 35 x 44 cm",
        stegmatt="34 x 15 cm", steghojder="10/20/30/40 cm", steg=4, last=4.5),
}

# Trapporna ligger kvar till nästa runda. `59d83c24` är BEVISAD dubblett och
# redan pensionerad; `a6412efa` är trolig och avgörs på bilden.
TRAPPOR = {
    "8f6147b5": dict(steg=3, farg_de="Grau", farg_spec="Beige",
                     material="Spanplatte, Plüsch", matt="46L x 35,5B x 34H cm",
                     steghojd="10 cm", last=50, pris=849,
                     anm="TYSKAN säger Grau, SVENSKA spec-tabellen Beige — bilden avgör"),
    "4c25eb86": dict(steg=4, farg_de="Grau", material="Spanplatte, Plüsch",
                     matt="60L x 40,5B x 59H cm", stegmatt="40,5B x 15L cm",
                     steghojder="15/29,5/45/59,5 cm", last=50, pris=799),
    "762cc411": dict(steg=3, farg_de="Beige", material="Spanplatte und Plüsch",
                     matt="45L x 35B x 34H cm", last=10, pris=849,
                     anm="Säljs som KATTtrappa — 10 kg"),
    "a6412efa": dict(steg=4, farg_de="Braun", material="Spanplatte, Polyester",
                     matt="60L x 35B x 44H cm", stegmatt="34L x 15B cm",
                     bas="60L x 34B cm", last=5, pris=819,
                     anm="TROLIG dubblett av publicerade hundtrappa-sma-hundar-"
                         "katter-4-steg: stegyta och bottenplatta identiska, "
                         "5 kg mot 4,5. Avgörs på bilderna."),
    "f384c51d": dict(steg=4, farg_de="Natur", material="MDF, Kurzplüsch",
                     matt="40L x 59B x 54,2H cm", stegmatt="40L x 17B cm",
                     steghojder="14,3/27,6/40,9/54,2 cm", last=30, pris=819),
    "3ff2bc32": dict(steg=4, farg_de="Dunkelbraun", material="MDF, Kurzplüsch",
                     matt="40L x 59B x 54,2H cm", stegmatt="40L x 17B cm",
                     steghojder="14,3/27,6/40,9/54,2 cm", last=30, pris=799),
    "03715963": dict(steg=3, farg_de="Weiß",
                     material="MDF der Klasse P2, Wildleder, Vlies",
                     matt="B40 x T54 x H48 cm", stegmatt="B40 x T18 x H16 cm",
                     vikt="4,2 kg", last=None, pris=759,
                     anm="INGEN maxlast i Technische Daten"),
    "c38f929e": dict(steg=3, farg_de="Schwarz",
                     material="MDF der Klasse P2, Wildleder, Vlies",
                     matt="B40 x T54 x H48 cm", stegmatt="B40 x T18 x H16 cm",
                     vikt="4,2 kg", last=None, pris=749,
                     anm="INGEN maxlast i Technische Daten"),
    "96d2803c": dict(steg=2, farg_de="Grau", farg_spec="Dunkelgrau, Kohlegrau",
                     material="PU-Leder, Schaumstoff",
                     matt="L45 x B39 x H20 cm", utfalld="L67 x B39 x H10 cm",
                     vikt="0,81 kg", last=None, pris=619,
                     anm="TITELN säger 'bis 7 kg'; Technische Daten anger INGEN last"),
    "11436227": dict(steg=2, farg_de="Schwarz",
                     material="PU-Leder, Schaumstoff",
                     matt="L45 x B39 x H20 cm", utfalld="L67 x B39 x H10 cm",
                     vikt="0,81 kg", last=None, pris=569,
                     anm="Syskon till 96d2803c — samma mått, ingen last i titeln"),
    "71e8e879": dict(steg=3, farg_de="Beige", material="Plüsch, Schaumstoff",
                     matt="L54 x B40 x H39 cm", andra_steget="26 cm",
                     last=15, pris=749),
}

# ☠️ INTE TRAPPOR. Titelns kategoriord är en HYPOTES: båda heter
#    "Katzentreppe"/"Kletterstufen" men Lieferumfang säger `Katzenregal-Set`
#    respektive `Kletterstufen-Set`, och båda bär en KLÖSSTAM. De hör till
#    kattklätterväggs-familjen (publicerade `kattklattervagg-*`), inte hit.
EJ_TRAPPOR = {
    "5121ffc8": "Katzenregal-Set 8 delar med klösstolpar, 1 279 kr",
    "b04b5375": "Kletterstufen-Set 4 delar med klösstam och hängmatta, 799 kr",
}
