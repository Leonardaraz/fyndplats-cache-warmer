# -*- coding: utf-8 -*-
"""Runda 131 — ALLT uppmätt ur leverantörens `Technische Daten`, inget härlett.

☠️ `Technische Daten` är auktoritativt; TITELN är marknadsföring. Två av
   rundans produkter bevisar det i samma batch:
   - `15e4c7a7` heter "Haustiertreppe, Hundetreppe" men `Lieferumfang` säger
     `1 x Haustier-Rampe` och specen har "Anti-Rutsch-Abstand" — det är en RAMP.
   - `96d2803c` bär "bis 7 kg" i TITELN medan `Technische Daten` inte anger
     någon maxlast alls — och syskonet `11436227` (samma mått, samma 0,81 kg)
     saknar talet i titeln. Ett tal som bara står i marknadsföringen är inget
     mått.

⚠️ MAXLASTEN ÄR RUNDANS VIKTIGASTE SIFFRA. Den spänner 5–90 kg på produkter
   som ser likadana ut, och den avgör om kunden kan använda varan alls.
"""

# id8 -> uppmätt. `last` = kg, None när leverantören inte anger någon.
RAMPER = {
    # ☠️ FÄLLD AV DUBBLETTGRINDEN — ÄR publicerade `hundramp-bil-155-cm`
    #    (911818e3). Sex mått identiska. Ligger kvar som mätning, poleras inte.
    "11c2b7e8": dict(
        typ="bilramp", fälld="dubblett av hundramp-bil-155-cm", farg_de="Schwarz+Grün", material="Kunststoff",
        matt="155L x 38,5B x 15,5H cm", hopfalld="78L x 48,5B x 17,5H cm",
        rampbredd="33 cm", last=90, pris=829,
        leverans=["1 x Hunderampe für Autos", "1 x Bedienungsanleitung"]),
    "2166c50f": dict(
        typ="biltrappa", farg_de="Grau", material="Kunststoff, TPR",
        matt="154L x 40B x 7,5H cm", hopfalld="79L x 40B x 13H cm",
        halkleist="22,8L x 5B cm", steg="34,5L x 8B cm",
        maxhojd="82H cm", last=25, pris=759,
        leverans=["1 x Hunderampe", "1 x Bedienungsanleitung"]),
    "9a513e9a": dict(
        typ="biltrappa", farg_de="Braun", material="Kunststoff, TPR",
        matt="154L x 40B x 7,5H cm", hopfalld="79L x 40B x 13H cm",
        halkleist="22,8L x 5B cm", steg="34,5L x 8B cm",
        maxhojd="82H cm", last=25, pris=759,
        leverans=["1 x Hunderampe", "1 x Bedienungsanleitung"]),
    "c2be0f30": dict(
        typ="biltrappa", farg_de="Schwarz", material="Kunststoff, TPR",
        matt="154L x 40B x 7,5H cm", hopfalld="79L x 40B x 13H cm",
        halkleist="22,8L x 5B cm", steg="34,5L x 8B cm",
        maxhojd="82H cm", last=25, pris=839,
        leverans=["1 x Hunderampe", "1 x Bedienungsanleitung"]),
    "ed1ea8dc": dict(
        typ="mobelramp", farg_de="Naturholz+Schwarz",
        material="Kiefernholz, Teppich",
        matt="83,5L x 35B x 47,5H cm", hopfalld="80L x 35B x 5H cm",
        hojder="24/32,5/40/47,5H cm", lutning="15°/22°/28°/35°",
        last=15, pris=799,
        leverans=["1 x Haustier-Rampe", "1 x Anleitung"]),
    "15e4c7a7": dict(
        typ="mobeltrappa", farg_de="Natur+Grau",
        material="Mehrschichtenplatte, Tannenholz, Polyester",
        matt="90L x 40B x 45H cm", halkavstand="10 cm",
        last=40, pris=979,
        leverans=["1 x Haustier-Rampe", "1 x Handbuch"],
        anm="BILDEN visar SEX STEG. Titeln sa Treppe, Lieferumfang sa Rampe — titeln hade rätt. Produkttypen avgörs av bilden, aldrig av en text."),
    "935cd17b": dict(
        typ="mobelramp", farg_de="Schwarz+Naturholz",
        material="Kiefernholz, Polyester",
        matt="90B x 40T x 61H cm", transport="100B x 40T x 7H cm",
        hojder="26/39/50/61 cm",
        last=40, last_angiven_hog=75, pris=959,
        leverans=["1 x Haustierrampe", "1 x Anleitung"],
        anm="TVÅ laster: Belastbarkeit 75 kg OCH Empfohlenes Gewicht <= 40 kg. "
            "Den konservativa gäller (runda 66:s regel)."),
    "1b64abde": dict(
        typ="mobelramp", farg_de="Weiß+Grau",
        material="Kiefernholz, Polyester",
        matt="125L x 40B x 35,5H cm", ramp="89L x 40B cm",
        plattform="29,5L x 30B cm", last=50, pris=1149,
        leverans=["1 x Haustierrampe", "1 x Anleitung"]),
}

TRAPPOR = {
    "8f6147b5": dict(steg=3, farg_de="Grau", farg_spec="Beige",
                     material="Spanplatte, Plüsch", matt="46L x 35,5B x 34H cm",
                     steghojd="10 cm", last=50, pris=849,
                     anm="TYSKAN säger Grau, SVENSKA spec-tabellen Beige — bilden avgör"),
    "59d83c24": dict(steg=3, farg_de="Weiß", material="Tannenholz, Nadelfilz",
                     matt="B40,5 x T44,5 x H38 cm",
                     stegmatt="L40,5 x B16,5 x H12,6 cm",
                     vikt="4,6 kg", last=30, pris=799),
    "4c25eb86": dict(steg=4, farg_de="Grau", material="Spanplatte, Plüsch",
                     matt="60L x 40,5B x 59H cm", stegmatt="40,5B x 15L cm",
                     steghojder="15/29,5/45/59,5 cm", last=50, pris=799),
    "762cc411": dict(steg=3, farg_de="Beige", material="Spanplatte und Plüsch",
                     matt="45L x 35B x 34H cm", last=10, pris=849,
                     anm="Säljs som KATTtrappa — 10 kg"),
    "a6412efa": dict(steg=4, farg_de="Braun", material="Spanplatte, Polyester",
                     matt="60L x 35B x 44H cm", stegmatt="34L x 15B cm",
                     bas="60L x 34B cm", last=5, pris=819,
                     anm="FEM kilo på en fyrstegstrappa — rundans lägsta"),
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
