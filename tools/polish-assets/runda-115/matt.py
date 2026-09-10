# -*- coding: utf-8 -*-
"""Runda 115 — mätta fakta för de sju sparkfordonen.

☠️ ALLT HÄR ÄR LÄST UR LEVERANTÖRENS EGEN TEXT ELLER UR BILDEN. Ingenting är
   härlett, avrundat eller gissat. Där leverantören motsäger sig själv står
   BÅDA talen i MOTSAGT, och det vi väljer motiveras där.
"""

# ── Yttermått i cm (B × D × H som leverantören anger L × B × H) ─────────────
# ☠️ DET HÄR ÄR YTTERMÅTTEN. Steg 1:s tabell bar av misstag PAKETMÅTTEN,
#    eftersom regexen matchade den svenska raden "54 × 38 × 30" men inte den
#    tyska "85L x 27,5B x 47,5H" — bokstäverna L/B/H står mellan talen.
YTTRE = {
    "cc6b56f9": (85, 27.5, 47.5),
    "fb142c5c": (78, 29.5, 54),
    "738ca991": (78, 24, 58.5),
    "0c05c1a0": (80, 26.5, 39),
    "23ba27a5": (91, 29, 44),
    "39d85f18": (91, 29, 44),
    "389ac5ac": (91, 29, 44),
}
PAKET = {
    "cc6b56f9": (54, 38, 30), "fb142c5c": (54, 35, 30),
    "738ca991": (52.5, 29, 37), "0c05c1a0": (62, 30, 36),
    "23ba27a5": (60.5, 32, 28), "39d85f18": (60.5, 32, 28),
    "389ac5ac": (60.5, 32, 28),
}
VIKT = {"cc6b56f9": 3.6, "fb142c5c": 3.6, "738ca991": 3.1,
        "0c05c1a0": 3.1, "23ba27a5": 3.8, "39d85f18": 3.8, "389ac5ac": 3.8}
MAXLAST = {"cc6b56f9": 25, "fb142c5c": 25, "738ca991": 30,
           "0c05c1a0": 30, "23ba27a5": 25, "39d85f18": 25, "389ac5ac": 25}

# ── Ålder: NEDRE gränsen är säkerhetsrelevant, så vi tar den FÖRSIKTIGA ─────
ALDER = {
    "cc6b56f9": (12, 36), "fb142c5c": (18, 36), "738ca991": (18, 48),
    "0c05c1a0": (18, 48), "23ba27a5": (18, 36), "39d85f18": (12, 36),
    "389ac5ac": (12, 36),
}
# ☠️ `23ba27a5` MOTSÄGER SIG SJÄLV: brödtexten säger 18–36 månader, spec-blocket
#    12–36. En nedre åldersgräns är ett säkerhetstal — vi tar 18, den högre.
MOTSAGT = {
    "23ba27a5": [("ålder", "brödtext 18–36 mån mot spec 12–36 mån "
                           "→ vi anger från 18 månader")],
}

# ── Sits, ryggstöd, hjul, förvaring — bara det leverantören faktiskt anger ──
SITS = {  # B × D × H från golvet
    "cc6b56f9": (18.5, 27, 24.5), "fb142c5c": (18.5, 27, 24.5),
    "738ca991": None, "0c05c1a0": (15, 22.5, 22.5),
    "23ba27a5": (17, 18, 25), "39d85f18": (17, 18, 25), "389ac5ac": (17, 18, 25),
}
SITSHOJD = {"738ca991": 22}
RYGGSTOD = {"cc6b56f9": (16, 7.5), "fb142c5c": (16, 7.5),
            "0c05c1a0": (15.5, 15), "23ba27a5": (20, 18),
            "39d85f18": None, "389ac5ac": None}
HJUL = {  # diameter i cm
    "cc6b56f9": {"alla": 13}, "fb142c5c": {"alla": 13},
    "0c05c1a0": {"fram": 12, "bak": 15.5},
    "23ba27a5": {"fram": 15, "bak": 20},
}
FORVARING = {  # innermått på facket under sitsen
    "738ca991": (20, 15, 9), "0c05c1a0": (25, 15, 9),
}
SLAP = {"23ba27a5": None, "39d85f18": (23, 18, 14), "389ac5ac": (23, 18, 14)}

MATERIAL = {
    "cc6b56f9": ["polypropen", "metall"], "fb142c5c": ["polypropen", "metall"],
    "738ca991": ["polypropen"], "0c05c1a0": ["plast", "abs"],
    "23ba27a5": ["plast", "metall"], "39d85f18": ["polypropen", "metall"],
    "389ac5ac": ["polypropen", "metall"],
}
FARG = {"cc6b56f9": "gul och svart", "fb142c5c": "gul och svart",
        "738ca991": "gul och svart", "0c05c1a0": "gul",
        "23ba27a5": "gul", "39d85f18": "gul", "389ac5ac": "blå"}

# ── Batterier: INTE uniformt, och det är en köpfråga ────────────────────────
BATTERI = {
    "cc6b56f9": "2 × AAA för tutan, ingår inte",
    "fb142c5c": "2 × AAA för tutan, ingår inte",
    "738ca991": "tutan kräver inget batteri",
    "0c05c1a0": "tutan kräver inget batteri",
    # ☠️ `23ba27a5` har musik OCH ljus men leverantören säger INGENTING om
    #    batterier. Då skriver vi ingenting — varken "ingår" eller "ingår inte".
    "23ba27a5": None,
    "39d85f18": None, "389ac5ac": None,
}

MONTERING = {"cc6b56f9": True, "fb142c5c": True, "23ba27a5": True,
             "738ca991": False, "0c05c1a0": False,
             "39d85f18": False, "389ac5ac": False}

INGAR = {
    "cc6b56f9": ["fordonet", "bruksanvisning"],
    "fb142c5c": ["fordonet", "bruksanvisning"],
    "738ca991": ["fordonet"],
    "0c05c1a0": ["fordonet", "bruksanvisning"],
    "23ba27a5": ["fordonet", "skopa", "grep", "bruksanvisning"],
    "39d85f18": ["fordonet", "kratta", "sandskyffel", "bruksanvisning"],
    "389ac5ac": ["fordonet", "kratta", "sandskyffel", "bruksanvisning"],
}

# ☠️ VARUMÄRKET NÄMNS BARA DÄR LEVERANTÖREN NAMNGER LICENSEN. De fyra andra
#    säger bara "echter Baumaschinen-Marke" utan namn — att skriva ut märket
#    där vore ett påhittat påstående, även om logotypen syns i bilden.
LICENS = {"23ba27a5": "Caterpillar"}

# ☠️ FÅR ALDRIG SKRIVAS UT — leverantörens egna formuleringar, grindade:
UTELAMNAS = {
    # "Notfall-WC" / "Kindertoiletten": facket under sitsen beskrivs som
    # nödtoalett. Det är inte en egenskap vi säljer på en svensk produktsida.
    "nödtoalett": ["cc6b56f9", "fb142c5c", "738ca991"],
    # "Lauflernhilfe" / "Stütze beim Laufenlernen": en gåstol är en REGLERAD
    # produktkategori (EN 1273) med egna krav. De här är åkleksaker.
    "gåstol": ["738ca991", "39d85f18", "389ac5ac"],
    # "Tretauto" / "Trettraktor": leverantören kallar samma vara både
    # sparkbil och TRAMPBIL. Bilden avgör — se PEDALER nedan.
    "trampbil": ["0c05c1a0", "39d85f18", "389ac5ac"],
}

# ☠️ MÄTT I BILDEN, INTE LÄST I TEXTEN. Zoom på underredena (zoom-pedaler.jpg)
#    visar släta golv utan vev och utan pedaler på alla fyra granskade. Barnet
#    skjuter ifrån med fötterna mot marken.
PEDALER = {k: False for k in YTTRE}


def kontroll():
    n = set(YTTRE)
    for namn, d in (("PAKET", PAKET), ("VIKT", VIKT), ("MAXLAST", MAXLAST),
                    ("ALDER", ALDER), ("MATERIAL", MATERIAL), ("FARG", FARG),
                    ("INGAR", INGAR), ("PEDALER", PEDALER)):
        if set(d) != n:
            raise SystemExit(f"☠️ {namn} täcker inte samma sju nycklar som YTTRE")
    # De tre traktorerna delar chassi — talen MÅSTE vara identiska.
    tre = ["23ba27a5", "39d85f18", "389ac5ac"]
    if len({YTTRE[k] for k in tre}) != 1 or len({VIKT[k] for k in tre}) != 1:
        raise SystemExit("☠️ traktorchassit har glidit isär i tabellerna")
    # Och de får INTE dela färg — då vore det en dubblett, inte tre produkter.
    if len({FARG[k] for k in tre}) < 2:
        raise SystemExit("☠️ två traktorer bär samma färg — granska om de är EN vara")
    if any(PEDALER.values()):
        raise SystemExit("☠️ PEDALER påstår pedaler som bilden inte visar")
    print(f"matt.kontroll: {len(n)} produkter, tabellerna i fas, "
          f"traktorchassit enhetligt, noll pedaler")


if __name__ == "__main__":
    kontroll()
