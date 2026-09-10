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
# ☠️ FÖRVARINGSMÅTTEN MOTSÄGS AV MÅTTRITNINGEN — därför skrivs de INTE ut.
#    Leverantörens text och leverantörens EGEN bild 3 ger olika tal för samma
#    fack. Yttermåtten stämmer på alla sju; bara det här fältet spretar.
#      738ca991: text 20 × 15 × 9   ritning 22 × 16
#      0c05c1a0: text 25 × 15 × 9   ritning 22,5 × 15
#    Facket är verkligt och nämns — måttet gissas inte. Samma riktning som
#    batterifrågan på 23ba27a5: ett okänt är inget nej, men det är inget tal.
FORVARING_MOTSAGT = {
    "738ca991": {"text": (20, 15, 9), "ritning": (22, 16)},
    "0c05c1a0": {"text": (25, 15, 9), "ritning": (22.5, 15)},
}
FORVARING = {}          # tomt med flit — se FORVARING_MOTSAGT

# ── Steg 3: läst ur mappningsraden via polish-mapping.yml (läge `las`) ──────
# ☠️ PRISET RÖRS ALDRIG. Talen står här bara för att prisgrinden ska kunna
#    kontrollmätas, och för att lagret avgör om sidan får publiceras.
PRIS = {"cc6b56f9": 949, "fb142c5c": 839, "738ca991": 799, "0c05c1a0": 779,
        "23ba27a5": 929, "39d85f18": 799, "389ac5ac": 879}
PRISGRIND_STAMMER = {k: True for k in PRIS}
LAGER = {"cc6b56f9": 197, "fb142c5c": 22, "738ca991": 197, "0c05c1a0": 197,
         "23ba27a5": 197, "39d85f18": 46, "389ac5ac": 25}
EU_LAGER = {k: True for k in PRIS}
FRAKTANDEL = {"cc6b56f9": 0.381, "fb142c5c": 0.430, "738ca991": 0.443,
              "0c05c1a0": 0.461, "23ba27a5": 0.353, "39d85f18": 0.446,
              "389ac5ac": 0.408}

# ☠️ IMPORTENS SKU-KROCK ÄR TRE-VÄGS. Sju produkter delar bara TRE SKU:er.
#    Det är importen som skapar det (uppgift #272), inte poleringen — men det
#    ligger LIVE i mappningen just nu, och Steg 8 måste ge alla sju var sin.
IMPORT_SKU = {
    "cc6b56f9": "FP-kinderbagger-rutscher",
    "fb142c5c": "FP-kinderbagger-rutscher",
    "738ca991": "FP-sitzbagger-aufsitzbagger",
    "0c05c1a0": "FP-sitzbagger-aufsitzbagger",
    "23ba27a5": "FP-sitzbagger-aufsitzbagger",
    "39d85f18": "FP-rutsch-traktor-mit",
    "389ac5ac": "FP-rutsch-traktor-mit",
}
WIX_VARIANT = {
    "cc6b56f9": "90717640-45ae-433a-be5d-ce9890d2987a",
    "fb142c5c": "0cb65928-9f02-4487-b140-ee954d7b3240",
    "738ca991": "dd75f102-7390-432c-ac6d-cfbf5dce0333",
    "0c05c1a0": "870a2990-b9c9-4159-8154-8d8ce9377f10",
    "23ba27a5": "26f1dd4f-0a1d-4ce1-9ebe-2eb7621ec6ed",
    "39d85f18": "12f3db52-94cc-4a88-bf0b-fe8330139756",
    "389ac5ac": "23a350a2-1884-4a6d-bcfc-91b07bcc0672",
}

# ── Steg 4: bildgranskningen, mätt på alla 35 bilder ────────────────────────
# ✅ NOLL tyska ord i pixlarna. Måttritningen (bild 3) bär rena siffror + "cm".
# ☠️ Tre olika VARUMÄRKEN sitter fysiskt på varorna. Leonards linje: rör dem
#    inte. Men bara det som leverantören UTTRYCKLIGEN licensierat får skrivas.
MARKE_I_BILD = {
    "cc6b56f9": "CAT", "fb142c5c": "CAT", "23ba27a5": "CAT",
    "39d85f18": "New Holland", "389ac5ac": "New Holland",
    "738ca991": None,      # generiskt "TRUCK"-tryck, inget märke
    "0c05c1a0": None,      # generiskt "TRUCK / NOTICE SAFETY"-tryck
}
# ⚠️ Kontaktarkets etiketter kallade 738ca991 och 0c05c1a0 "CAT-" — fel.
#    Zoomen visar generiska tryck. Rättat här.
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
    if FORVARING:
        raise SystemExit("☠️ FORVARING fylldes trots att ritningen motsäger texten")
    for d in (PRIS, LAGER, FRAKTANDEL, IMPORT_SKU, WIX_VARIANT, MARKE_I_BILD):
        if set(d) != n:
            raise SystemExit("☠️ ett Steg 3/4-fält täcker inte samma sju nycklar")
    # ☠️ SKU-KROCKEN SKA SYNAS, INTE TIGAS IHJÄL.
    krockar = {v for v in IMPORT_SKU.values()
               if list(IMPORT_SKU.values()).count(v) > 1}
    if len(set(IMPORT_SKU.values())) == len(n):
        raise SystemExit("☠️ SKU-krocken är borta ur tabellen — mät om innan du "
                         "tror att importen lagat sig")
    # Ett märke får bara skrivas ut där LICENS namnger det.
    for k, m in MARKE_I_BILD.items():
        if m and k not in LICENS:
            pass  # tillåtet i BILDEN, förbjudet i texten — grinden sitter i grind.py
    if len(set(WIX_VARIANT.values())) != len(n):
        raise SystemExit("☠️ två produkter delar wixVariantId — det kan inte stämma")
    print(f"matt.kontroll: {len(n)} produkter, tabellerna i fas, "
          f"traktorchassit enhetligt, noll pedaler, "
          f"{len(set(IMPORT_SKU.values()))} SKU på {len(n)} produkter "
          f"({len(krockar)} krockande)")


if __name__ == "__main__":
    kontroll()
