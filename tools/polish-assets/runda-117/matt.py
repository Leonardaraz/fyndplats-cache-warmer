# -*- coding: utf-8 -*-
"""Runda 117 — ENDA SANNINGSKÄLLAN för köksvagnarnas tal.

Varje siffra här är läst ur leverantörens egen beskrivning ELLER ur
måttritningen på bildposition 3. Ingenting är uppskattat, härlett eller
avrundat. Texterna importerar härifrån; ingen siffra får skrivas för hand.

☠️ HÖJDEN PÅ `6cf7cfcf` MOTSADE SIG SJÄLV och produkten lyftes ur rundan —
   se STEG2-5.md. Den ligger inte i den här tabellen med flit.
"""

# ── Modellgrupperna ────────────────────────────────────────────────────────
A = ["63235957", "37fb1ce1", "4d044b44"]   # 106 × 42 × 87, klaffskiva, 50 kg
B = ["e16c1515", "d4db4bbc"]               # 80 × 40 × 82, öppna hyllor, 40 kg
C = ["4ab392f7", "0af14e23"]               # 109 × 40 × 89, gummiträskiva, 40 kg
D = ["41d31478"]                           # 82 × 38 × 86,5, kryddhylla, 35 kg

GRUPP = {p: g for g, ids in (("A", A), ("B", B), ("C", C), ("D", D)) for p in ids}

# ── Färg per produkt ───────────────────────────────────────────────────────
# Leverantörens `Farbe:`-rad, översatt. FARG_BEST är bestämd form — den kan
# inte härledas mekaniskt (runda 116: `FARG[k] + "a"` gav "dammrosaa").
FARG = {
    "63235957": "vit med ekfärgad skiva",
    "37fb1ce1": "grå med ekfärgad skiva",
    "4d044b44": "svart med ekfärgad skiva",
    "e16c1515": "vit med ljus träfärgad skiva",
    "d4db4bbc": "svart med ekfärgad skiva",
    "4ab392f7": "vit med gummiträskiva",
    "0af14e23": "svart med gummiträskiva",
    "41d31478": "vit med ekfärgad skiva",
}
FARG_KORT = {
    "63235957": "vit", "37fb1ce1": "grå", "4d044b44": "svart",
    "e16c1515": "vit", "d4db4bbc": "svart",
    "4ab392f7": "vit", "0af14e23": "svart", "41d31478": "vit",
}
FARG_BEST = {  # bestämd form, för "Den … köksvagnen"
    "63235957": "vita", "37fb1ce1": "grå", "4d044b44": "svarta",
    "e16c1515": "vita", "d4db4bbc": "svarta",
    "4ab392f7": "vita", "0af14e23": "svarta", "41d31478": "vita",
}

PRIS = {"63235957": 1799, "37fb1ce1": 1849, "4d044b44": 1849,
        "e16c1515": 1599, "d4db4bbc": 1549,
        "4ab392f7": 2099, "0af14e23": 1799, "41d31478": 1299}

# ── Måtten per grupp ───────────────────────────────────────────────────────
MATT = {
    "A": {
        "yttermatt": "106 × 42 × 87 cm",
        "skiva_fald": "80 × 39 cm",
        "skiva_utfalld": "80 × 68 cm",
        "lada_inuti": "69 × 28 × 9 cm",
        "skap_inuti": "73 × 28 × 60 cm",
        "kryddhylla": "31 × 16 × 10 cm",
        "maxlast": "50 kg totalt",
        "material": "spånskiva, MDF och stål",
        "yta": "melaminbelagd",
        "hjul": "fyra, varav två med broms",
        "hjul_punkt": "Fyra hjul, varav två med broms",
        "hjul_svar": "Två av de fyra hjulen har broms.",
        "hyllplan": "ett, i tre höjdlägen",
        "dorrar": "två, med magnetstängning",
        "vikt": "29 kg",
    },
    "B": {
        "yttermatt": "80 × 40 × 82 cm",
        "hylla_hoger": "52,3 × 35 cm",
        "hylla_vanster": "20,5 × 38 cm",
        "skap_inuti": "54,5 × 36,5 cm",
        "maxlast": "40 kg totalt, 10 kg på skivan, 10 kg på understa hyllan "
                   "och 5 kg på den mellersta",
        "material": "MDF",
        "hjul": "fyra, varav två med broms",
        "hjul_punkt": "Fyra hjul, varav två med broms",
        "hjul_svar": "Två av de fyra hjulen har broms.",
        "hyllplan": "ett i skåpet, i tre höjdlägen",
        "dorrar": "två, med urskurna grepp",
        "vikt": "28 kg",
    },
    "C": {
        "yttermatt": "109 × 40 × 89 cm",
        "skiva": "85 × 40 cm",
        "lada_inuti": "73,5 × 29,5 × 8 cm",
        "skap_inuti": "78 × 35 × 60,5 cm",
        "golvfritt": "9,5 cm",
        "maxlast": "40 kg totalt, 20 kg på skivan, 8 kg i lådan "
                   "och 8 kg på hyllplanet",
        "material": "gummiträ och MDF",
        "hjul": "fyra länkhjul, varav två med broms",
        "hjul_punkt": "Fyra länkhjul, varav två med broms",
        "hjul_svar": "Två av de fyra länkhjulen har broms.",
        "hyllplan": "ett, höjdjusterbart",
        "dorrar": "två, med stålhandtag",
        "vikt": "29,5 kg",
    },
    "D": {
        "yttermatt": "82 × 38 × 86,5 cm",
        "skiva": "60 × 38 cm",
        "lada_inuti": "51 × 23,5 × 8,5 cm",
        "skap_inuti": "56 × 32,5 × 64 cm",
        "kryddhylla": "34 × 12 cm",
        "kryddhylla_spec": "34 × 12 cm, tre plan",
        "maxlast": "35 kg totalt",
        "material": "spånskiva och MDF",
        "yta": "melaminbelagd",
        "hjul": "fyra, varav två med broms",
        "hjul_punkt": "Fyra hjul, varav två med broms",
        "hjul_svar": "Två av de fyra hjulen har broms.",
        "hyllplan": "ett, i tre höjdlägen",
        "dorrar": "två, med magnetstängning",
        "vikt": "21 kg",
    },
}


# ── Härledda tal ───────────────────────────────────────────────────────────
# ☠️ Ett tal som INTE står i leverantörens underlag får bara stå i texten om
#    det är ren aritmetik ur två tal som gör det, och då ska räkningen skrivas
#    ned här. Runda 88 lät ett ohärlett tal stå i två produktnamn (uppgift
#    #326); grinden nedan känner bara igen tal den kan spåra hit.
HARLEDDA = {
    "A": {"29": "68 − 39 cm, hur mycket djupare skivan blir när klaffen fälls ut"},
    "B": {},
    "C": {},
    "D": {"34": "kryddhyllans bredd, samma tal som i kryddhylla",
          "12": "kryddhyllans djup, samma tal som i kryddhylla"},
}


def kontroll():
    """Fäller på de fel som faktiskt inträffat i tidigare rundor."""
    fel = []
    for p in GRUPP:
        for tabell, namn in ((FARG, "FARG"), (FARG_KORT, "FARG_KORT"),
                             (FARG_BEST, "FARG_BEST"), (PRIS, "PRIS")):
            if p not in tabell:
                fel.append(f"{p} saknas i {namn}")
    # Runda 116: en HÖJD är ETT tal, aldrig en volym.
    for g, m in MATT.items():
        for nyckel in ("golvfritt",):
            if nyckel in m and "×" in m[nyckel]:
                fel.append(f"{g}.{nyckel} är en höjd men innehåller ×")
    # Runda 116: bestämd form får inte vara grundformen + "a".
    for p, b in FARG_BEST.items():
        if b == FARG_KORT[p] + "a" and FARG_KORT[p].endswith("a"):
            fel.append(f"{p}: FARG_BEST '{b}' ser ut som påklistrat a")
    # Grupperna får inte dela yttermått — då är de inte olika modeller.
    ytter = [(g, MATT[g]["yttermatt"]) for g in MATT]
    if len({y for _, y in ytter}) != len(ytter):
        fel.append(f"två grupper delar yttermått: {ytter}")
    return fel


if __name__ == "__main__":
    f = kontroll()
    print(f"{len(GRUPP)} produkter i {len(MATT)} grupper")
    for g, ids in (("A", A), ("B", B), ("C", C), ("D", D)):
        print(f"  {g}: {' '.join(ids)}  {MATT[g]['yttermatt']}  {MATT[g]['maxlast'][:14]}")
    print("kontroll:", "; ".join(f) if f else "0 fel")
