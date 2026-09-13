# -*- coding: utf-8 -*-
"""Runda 143 — FACIT. Varje tal ar hamtat ur utkastets EGEN tyska
`Technische Daten` eller `Lieferumfang`, last ur Wix 2026-09-13.

☠️ INGET TAL HAR HARLETTS, AVRUNDATS ELLER GISSATS. Star det inte i
leverantorens text star det inte har heller — da skrivs det inte pa sidan.

☠️ `Beschreibung:`-blocket och TITELN ar marknadsforing och far aldrig avgora.
`Lieferumfang` ar kontraktet. Tva produkter i rundan sager emot sig sjalva och
de motsagelserna bars hit MED FLIT, som `motsagelse`-falt — en spec man tystar
ar en spec ingen upptacker.
"""

P = {}

# ---------------------------------------------------------------- Grupp A
# Stall UTAN sack. `Lieferumfang` listar ingen sack pa nagondera.
P["f8d974b3"] = {
    "pris": 1479,
    "typ": "stall_utan_sack",
    "matt": (170, 90, None),           # 170L x 90B
    "hojd": (182, 225),                # 182-225H cm
    "hopfallt": (182, 43, 25),         # Klappmass
    "upphangningshojd": (162, 205),    # Aufhaengehoehe
    "hojdlagen": 10,                   # "10 verschiedene Hoehen"
    "maxlast": 60,                     # Tragfaehigkeit
    "viktstang": (2.5, 12),            # OE2,5 x 12L cm
    "viktstang_max": 25,               # 25 kg pro Stange
    "viktstang_antal": 3,              # "drei Roehren an der Basis"
    "vikt": 17.0,
    "paket": (122, 27, 13),
    "farg": "svart",
    "material": "stal",
    "ingar": ["stall", "anvisning"],
    "ingar_inte": ["boxsack", "viktskivor"],
    "hopfallbar": True,
}

P["d307632a"] = {
    "pris": 1899,
    "typ": "stall_utan_sack",
    "matt": (160, 145, None),
    "hojd": (175, 220),
    "krokhojd": (165, 210),            # Hakenhoehe
    "speedball": (25, 25),             # 25L x 25B cm
    "stravor": 6,                      # sechs Verstaerkungsstreben
    "maxlast": 60,
    "vikt": 25.0,
    "paket": (145, 25, 20),
    "farg": "svart",
    "material": "stal",
    "ingar": ["stall", "speedball", "anvisning"],
    "ingar_inte": ["boxsack"],
}

# ---------------------------------------------------------------- Grupp B
# Stall DAR sacken ingar enligt `Lieferumfang`.
P["49d6d56f"] = {
    "pris": 1659,
    "typ": "stall_med_sack",
    "matt": (175, 91, None),
    "hojd": (185, 231),
    "hojd_andra_laget": (175, 220),    # "zwei Positionen"
    "stanglagen": 17,                  # 17-fach verstellbare obere Stange
    "sack": (29, 97),                  # OE29 x 97H
    "sack_material": "segelduk",       # Canvas / Segeltuch
    "viktstang": (2.5, 15),
    "viktstang_antal": 3,
    "maxlast": 25,                     # Belastbarkeit
    "vikt": 22.0,
    "paket": (182.5, 10.5, 33),
    "farg": "rod",
    "material": "stal, segelduk",
    "ingar": ["stall", "sack_ofylld", "anvisning"],
}

P["6f603856"] = {
    "pris": 3449,
    "typ": "stall_med_sack",
    "matt": (123, 141, 220),
    "sack": (30, 90),                  # OE30 x 90H
    "sack_vikt": 20,                   # 20-kg-Boxsack
    "maxlast": 120,
    "viktstang_antal": 3,              # drei Hantelscheibenhalter
    "vikt": 46.9,
    "paket": (155.5, 49, 35),
    "farg": "svart",
    "material": "stal, PVC, EPE, PU-fiber",
    "stal": "Q195",
    "ingar": ["stall", "sack", "gummirep", "anvisning"],
    "roterande_kedja": 360,
}

P["c00988e3"] = {
    "pris": 2979,
    "typ": "stall_med_sack",
    "matt": (115, 157, 221),
    "sack": (26, 86),
    "sack_vikt": 20,
    "boll_skiva": (60, 1.5),           # Punchingball-Scheibe OE60 x 1,5H
    "maxlast": 100,
    "vikt": 49.0,
    "paket": (130, 68, 28),
    "farg": "svart",                   # spec-raden
    "material": "stalror, PVC, MDF",   # spec-raden
    "ingar": ["sack", "punchingboll", "pump", "anvisning"],
    # ☠️ TVA MOTSAGELSER I SAMMA TEXT — ingendera far skrivas som ett faktum.
    "motsagelse": {
        "bollens_hojdlagen": "ingressen sager 'vier verschiedene Hoehen', "
                             "punktlistan sager '5-stufig hoehenverstellbar'",
        "material": "Technische Daten sager 'Stahlrohr, Kunststoff, MDF', "
                    "spec-raden sager 'Stahlrohr, PVC, MDF'",
        "farg": "Technische Daten sager 'Schwarz+Grau', spec-raden 'Schwarz'",
    },
}

# ---------------------------------------------------------------- Grupp C
# Fristaende sack med fyllbar fot.
P["74602345"] = {
    "pris": 2199,
    "typ": "fristaende_sack",
    "matt": (60, 60, 180),             # OE60 x 180H
    "rund_fot": True,
    "fot": (60, 40),                   # OE60 x 40H
    "sack": (25, 110),                 # OE25 x 110H
    "fyllning": {"vatten": 50, "sand": 60},
    "sugproppar": 10,
    "sugpropp_diameter": 8,
    "fjadrar": 3,                      # drei Stossdaempfungsfedern
    "vikt": 24.0,
    "paket": (148, 58, 39),
    "farg": "svart",                   # spec-raden
    "material": "PU, EPE, HDPE",       # spec-raden
    "ingar": ["sack", "sugproppar"],
    "motsagelse": {
        "farg": "Technische Daten sager 'Schwarz+Rot', spec-raden 'Schwarz'",
    },
    # ⚠️ Leverantorens text beskriver ett KINESISKT SKRIFTTECKEN pa sacken.
    # Det ar en egenskap hos varan, inte en palagd bild — kontrolleras i Steg 4.
    "tecken_pa_varan": "kinesiskt skrifttecken enligt leverantorens text",
}

P["702c7795"] = {
    "pris": 3059,
    "typ": "fristaende_sack",
    "matt": (60, 60, 180),
    "fot": (60, 60, 40),
    "sack": (32, 115),
    "fyllning": {"vatten": 70, "sand": 120},
    "sugproppar": 20,
    "vikt": 32.9,
    "paket": (146, 58.5, 41),
    "farg": "svart",
    "material": "Q195-stal, EPE, PU, PVC",
    "stal": "Q195",
    # ☠️ `Beschreibung` lovar boxhandskar. `Lieferumfang` listar dem INTE.
    # #468 ordagrant: leveranslistan ar kontraktet. Handskarna far darfor
    # ALDRIG namnas pa sidan.
    "ingar": ["sack", "anvisning"],
    "motsagelse": {
        "handskar": "Beschreibung sager 'Inklusive einem Paar PU-Boxhandschuhe', "
                    "Lieferumfang listar bara sack och anvisning",
    },
}

P["1409d762"] = {
    "pris": 2329,
    "typ": "fristaende_sack",
    "matt": (50, 50, 170),             # OE50 x 170H
    "rund_fot": True,
    "fot": (48, 30),                   # OE48 x 30H
    "sack": (28, 110),
    "sugproppar": 12,
    "vikt": 20.8,
    "paket": (140, 49, 32),
    "farg": "svart",
    "material": "stal, PU, HDPE",      # Technische Daten
    "ingar": ["sack", "anvisning"],
    # ☠☠☠ TVA ALLVARLIGA FYND I SAMMA PRODUKT:
    #
    # 1. Leverantorens text bar `Artikelnummern: A91-122` — det ar #470
    #    ordagrant. Numret far ALDRIG na var text, var spec-tabell eller
    #    det publika repot. Det star har som ett FAKTUM OM TEXTEN, utan
    #    numret sjalvt.
    # 2. Spec-raden sager `Samt (Polyester), Schaumstoff, Gummiholz` —
    #    sammet, skum och gummitra. Det ar en MOBELSPEC, kopierad fran en
    #    annan produkt. Technische Daten sager stal, PU och HDPE, vilket ar
    #    vad en boxsack ar gjord av. Spec-raden ar alltsa inte bara oense,
    #    den ar omojlig.
    "artikelnummer_i_texten": True,
    "motsagelse": {
        "material": "spec-raden sager sammet, skum och gummitra — omojligt "
                    "for en boxsack, och Technische Daten sager stal, PU, HDPE",
    },
}

P["7eeb7497"] = {
    "pris": 2059,
    "typ": "fristaende_sack",
    "matt": (50, 50, 165),             # OE50 x H165
    "rund_fot": True,
    "vikt": 22.0,
    "paket": (122, 50, 49),
    "farg": "svart",
    "material": "HDPE, PVC, EPE",
    "ingar": ["sack"],
    "egenvikt": (4.65, 15.5),          # Eigengewicht 4,65/15,5 kg
    "siffror_pa_sacken": "vita siffror pa rod botten",
}

P["0deb6901"] = {
    "pris": 2619,
    "typ": "fristaende_sack",
    "matt": (57, 57, 175),
    "fot": (58, 38),                   # OE58 x 38H
    "sack": (32, 120),
    "slagdyna_hojd": (65, 175),        # Hoehe Schlagpolster
    "fyllning": {"vatten": 30, "sand": 45, "blandning": 50},
    "vikt": 25.6,
    "paket": (150, 58, 39),
    "farg": "svart",
    "material": "plast, stal",
    "ingar": ["sack", "handlindor", "anvisning"],
}

# ---------------------------------------------------------------- Grupp D
# Boxdockor — formad kropp, inte sack.
P["9119599f"] = {
    "pris": 2879,
    "typ": "boxdocka",
    "matt": (55, 55, None),
    "hojd": (178, 207),
    "fot": (53, 60),                   # OE53 x 60H
    "fyllning": {"vatten": 40, "sand": 50, "blandning": 55},
    "vikt": 22.3,
    "paket": (56, 56, 97),
    "farg": "svart, gra och bla",
    "material": "HDPE, PVC, PU",
    "ingar": ["docka", "anvisning"],
    "fargmarkerade_traffytor": True,
}

P["c5c228ab"] = {
    "pris": 2399,
    "typ": "boxdocka",
    "matt": (58, 58, None),
    "hojd": (158, 186),
    "slagyta": (36, 80),               # OE36 x H80
    "fot": (55, 60),                   # OE55 x H60
    "kopplingsstang": 26,
    "vikt": 15.6,
    "paket": (56, 56, 88),
    "farg": "svart och brun",
    "material": "konstlader, plast",
    "ingar": ["docka"],
}

# ---------------------------------------------------------------- Grupp E
# ☠️ FARGSYSKON, INTE DUBBLETTER (#420). De tre delar VARJE matt och vikten
# exakt; det enda som skiljer ar fargen — och fargfaltet SKILJER, vilket ar
# den egenskap som avgor. Se STEG1.md for talen sida vid sida.
_STAND = {
    "typ": "boxstall_speedball",
    "matt": (107, 36, None),
    "hojd": (140, 205),
    "fot": (34, 34),
    "kickdyna": (15, 53),              # OE15 x 53H
    "speedball": (15, 17),             # OE15 x 17L, tva stycken
    "speedball_antal": 2,
    "boxstang": (6, 50),               # OE6 x 50L
    "vikt": 13.5,
    "material": "stal, konstlader",
    "ingar": ["stall", "luftpump", "anvisning"],
}

P["86f2cb63"] = dict(_STAND, pris=1399, farg="svart, rott och vitt",
                     paket=(100, 35, 21.5))
P["57986794"] = dict(_STAND, pris=1479, farg="bla", paket=(100, 35, 18))
P["438295ae"] = dict(_STAND, pris=1479, farg="svart", paket=(100, 35, 18))

P["87ec8a16"] = {
    "pris": 1859,
    "typ": "boxstall_speedball",
    "matt": (80.5, 48, None),
    "hojd": (163, 205),
    "speedball": (15, 17),
    "speedball_antal": 1,
    "reflexstang": (6, 45),
    "pratze": (18, 7),                 # Pratze OE18 x 7T — slagdyna
    "fyllning": {"vatten": 30, "sand": 35, "blandning": 40},
    "vikt": 12.5,
    "paket": (85.5, 50, 35),
    "farg": "svart, rott och blatt",
    "material": "stal, HDPE, konstlader",
    "ingar": ["stall", "luftpump", "handlindor", "anvisning"],
}

# ---------------------------------------------------------------- Grupp F
P["b6c4c619"] = {
    "pris": 949,
    "typ": "vaggfaste",
    "matt": (80, 17, 48),
    "stodstang": (80, 5, 5),
    "maxlast": 100,
    "vinklar": 9,
    "vikt": 7.0,
    "paket": (80, 18, 16),
    "farg": "svart",
    "material": "stal",
    "ingar": ["faste", "skruvar", "vridkrok", "karbinhake", "anvisning"],
    "underlag": ["betong", "tegel", "massivt tra"],
}

BATCH = list(P.keys())

if __name__ == "__main__":
    print("produkter:", len(P))
    for k, v in P.items():
        print(" ", k, v["typ"], v["pris"], "kr")
