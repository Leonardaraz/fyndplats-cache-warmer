# -*- coding: utf-8 -*-
"""Runda 113 — åtta kylapparater i TRE grupper. Allt här är MÄTT, inget antaget.

☠️ FAMILJEN VALDES EFTER ATT SVEPET LAGATS. Förra rundans svep läste samma sida
   trettio gånger (`filter`/`cursorPaging` låg utanför `search`). Det här svepet
   gick klart: 3 134 utkast över 32 sidor, 2 446 publicerade över 25, båda med
   `cursor === null` OCH unika id == radantal. Först då blev "18 i familjen mot
   fyra publicerade syskon" ett tal och inte en gissning.

☠️ EN BEVISAD DUBBLETT FÄLLDES OCH LIGGER UTANFÖR RUNDAN.
   `da0e9379` (Mini-Gefrierschrank 35 L, Weiß, 45 W) delar hjältebild
   BYTE-IDENTISKT med den publicerade sidan `minifrys-35-liter-vandbar-dorr`:
   abs(gray(a)-gray(b)).mean() = **0,00**. Den poleras inte. Se `dubblettgrind.py`.

☠️ OCH MÅTTGRINDEN GAV 3/3 PÅ FYRA RADER DÄR BARA EN VAR DUBBLETT.
   Alla fem 35 L-frysutkasten har exakt 47 × 44,2 × 48,8 cm, samma innermått,
   samma −14…−24 ℃ och samma 15 kg. Kabinettet delas alltså av TVÅ modeller,
   och skillnaden syns bara i två fält och i pixlarna:

     modell   effekt   dörr    dörrfront                    utkast
     med lås   161 W   135°   nyckellås, ingen logga        8cfe5171 · a33ece7a
     utan lås   45 W   180°   HOMCOM-logga, inget lås       9a33e15f · b2c76518
                                                            (+ publicerade d4e79563)

   Runbookens regel höll ordagrant: en måttmatchning är ett SÅLL, inte en dom.
   Bilderna avgjorde — se `zoom-las.jpg`, där nyckeln sitter i låset.

☠️ LÅSET STÅR INTE I DEN TYSKA TEXTEN MED ETT ORD. Det är grundat på BILDEN,
   som är ett giltigt underlag — men bara för den som faktiskt tittar. En
   silvrig detalj mitt på dörren kan lika gärna vara ett handtag; zoomen finns
   för att det skulle vara mätt och inte förmodat.
"""

WIX = {
    "8cfe5171": "8cfe5171-0d05-4f95-addd-2263613d710e",
    "a33ece7a": "a33ece7a-75eb-433e-927d-0ce183162d19",
    "9a33e15f": "9a33e15f-c7fa-43af-953d-4509127bddae",
    "b2c76518": "b2c76518-ea78-4d02-9951-d663a8a20558",
    "47a91a17": "47a91a17-cabc-4f3d-ac39-3f6d80f1f77e",
    "15d30e23": "15d30e23-a459-4ddf-991b-37e07df5728a",
    "480849a7": "480849a7-71e2-4f64-89d1-f0817eb78b8c",
    "fdbfcea0": "fdbfcea0-e364-4ab1-8057-9a729a64d732",
}

# Variant-id (för Steg 8:s SKU-skrivning) och revision vid Steg 3-läsningen.
VARIANT = {
    "8cfe5171": "5b761798", "a33ece7a": "d37ca289",
    "9a33e15f": "c950f9db", "b2c76518": "0424d814",
    "47a91a17": "e4df8518", "15d30e23": "a1676148",
    "480849a7": "480ac1fa", "fdbfcea0": "bffed11e",
}

GRUPPER = {
    "8cfe5171": "A", "a33ece7a": "A",   # minifrys 35 L MED LÅS, 161 W, 135°
    "9a33e15f": "B", "b2c76518": "B",   # minifrys 35 L utan lås, 45 W, 180°
    "47a91a17": "C", "15d30e23": "C",   # vinkyl med kompressor
    "480849a7": "C", "fdbfcea0": "C",
}
KONSTRUKTION = {"A": "minifrys med lås", "B": "minifrys", "C": "vinkyl"}

# ── PUBLICERAT SYSKON ───────────────────────────────────────────────────────
# Grupp B är FÄRGSYSKON till en sida som redan ligger live. Den ska korslänkas,
# inte konkurreras ut. Grupp A delar kabinettmått med den men är en annan
# modell, så korslänken därifrån måste säga VAD som skiljer.
SYSKON = {
    "slug": "minifrys-35-liter-vandbar-dorr",
    "namn": "Minifrys 35 liter med vändbar dörr och termostat",
    "farg": "vit",
    "id": "d4e79563",
}

# ── MÅTT OCH SPECAR ─────────────────────────────────────────────────────────
# nyckel -> (bredd, djup, höjd) i cm, exakt som leverantören anger dem.
YTTRE = {
    "8cfe5171": (47, 44.2, 48.8), "a33ece7a": (47, 44.2, 48.8),
    "9a33e15f": (47, 44.2, 48.8), "b2c76518": (47, 44.2, 48.8),
    "47a91a17": (26.5, 51.5, 65), "15d30e23": (43, 45, 56.5),
    "480849a7": (34.5, 45, 78),   "fdbfcea0": (43, 45, 64),
}

VIKT = {
    "8cfe5171": 15, "a33ece7a": 15, "9a33e15f": 15, "b2c76518": 15,
    "47a91a17": 16.4, "15d30e23": 23.5, "480849a7": 24.5, "fdbfcea0": 25.7,
}

PAKET = {
    "8cfe5171": (51, 46.5, 53), "a33ece7a": (51, 46.5, 53),
    "9a33e15f": (51, 46.5, 53), "b2c76518": (51, 46.5, 53),
    "47a91a17": (60, 36, 72), "15d30e23": (54, 55, 62),
    "480849a7": (55, 45, 84), "fdbfcea0": (55, 53, 70),
}

VOLYM = {                       # liter
    "8cfe5171": 35, "a33ece7a": 35, "9a33e15f": 35, "b2c76518": 35,
    "47a91a17": 30, "15d30e23": 42, "480849a7": 50, "fdbfcea0": 53,
}

FARG = {
    "8cfe5171": "vit", "a33ece7a": "grå",
    "9a33e15f": "silver", "b2c76518": "svart",
    "47a91a17": "svart", "15d30e23": "svart",
    "480849a7": "svart", "fdbfcea0": "svart",
}

EFFEKT = {                      # watt, leverantörens tal
    "8cfe5171": 161, "a33ece7a": 161, "9a33e15f": 45, "b2c76518": 45,
    "47a91a17": 65, "15d30e23": 50, "480849a7": 80, "fdbfcea0": 42,
}

DORRVINKEL = {
    "8cfe5171": 135, "a33ece7a": 135, "9a33e15f": 180, "b2c76518": 180,
}

# ☠️ `480849a7` ÄR 43 dB, INTE 41. Tre källor från samma leverantör, två tal:
#    EU-energietiketten (bild 5) säger 43 dB och ljudklass D, spec-blocket
#    säger 41, och marknadsbilden säger "41dB Unser Weinkühlschrank".
#    Etiketten vinner — den är den deklaration som lämnas under (EU) 2019/2016
#    och den enda av de tre som är ett rättsligt dokument.
#
# ⚠️ De sex utan etikettbild har bara spec-blocket som källa, alltså samma
#    källa som här visade sig vara två decibel fel. Talen skrivs som de står.
LJUD = {                        # dB
    "8cfe5171": 41, "a33ece7a": 41, "9a33e15f": 41, "b2c76518": 41,
    "47a91a17": 37, "15d30e23": 41, "480849a7": 43, "fdbfcea0": 39,
}

# Ljudklass finns bara där en etikettbild finns att läsa den ur.
LJUDKLASS = {"b2c76518": "C", "480849a7": "D"}

ENERGIKLASS = {
    "8cfe5171": "E", "a33ece7a": "E", "9a33e15f": "E", "b2c76518": "E",
    "47a91a17": "E", "15d30e23": "G", "480849a7": "G", "fdbfcea0": "G",
}

# kWh per år.
#
# ☠️ FRYSARNAS TAL FINNS INTE I SPEC-BLOCKET — men `b2c76518` bär den riktiga
#    EU-etiketten som bild 5, och den säger 148 kWh/annum. Det är alltså mätt
#    för EN av de fyra och får därför bara skrivas på den. De tre andra saknar
#    etikettbild; att anta att silverversionen drar lika mycket som den svarta
#    vore rimligt och ändå ett påhitt.
ARSFORBRUKNING = {
    "b2c76518": 148,
    "47a91a17": 75, "15d30e23": 133, "480849a7": 120, "fdbfcea0": 132,
}

TEMPERATUR = {
    "8cfe5171": "−14 till −24 °C", "a33ece7a": "−14 till −24 °C",
    "9a33e15f": "−14 till −24 °C", "b2c76518": "−14 till −24 °C",
    "47a91a17": "8–18 °C", "15d30e23": "5–18 °C",
    "480849a7": "5–18 °C", "fdbfcea0": "5–18 °C",
}

FLASKOR = {"47a91a17": 12, "15d30e23": 16, "480849a7": 18, "fdbfcea0": 20}

SLADD = {
    "8cfe5171": 1.5, "a33ece7a": 1.5, "9a33e15f": 1.5, "b2c76518": 1.5,
    "47a91a17": 1.7, "15d30e23": 1.7, "480849a7": 1.7, "fdbfcea0": 1.6,
}

HYLLAST = {                     # kg per hyllplan
    "8cfe5171": 4, "a33ece7a": 4, "9a33e15f": 4, "b2c76518": 4,
    "47a91a17": 10, "15d30e23": 10, "480849a7": 10, "fdbfcea0": 10,
}

MATERIAL = {
    "8cfe5171": ["stål", "plast"], "a33ece7a": ["stål", "plast"],
    "9a33e15f": ["stål", "plast"], "b2c76518": ["stål", "plast"],
    "47a91a17": ["metall", "härdat glas"], "15d30e23": ["metall", "härdat glas"],
    "480849a7": ["metall", "härdat glas"], "fdbfcea0": ["metall", "härdat glas"],
}

# Innermått på frysarnas två fack (B × D × H i cm).
INNERFACK = {
    "8cfe5171": ((36, 33.3, 15), (36, 19, 20)),
    "a33ece7a": ((36, 33.3, 15), (36, 19, 20)),
    "9a33e15f": ((36, 33.3, 15), (36, 19, 20)),
    "b2c76518": ((36, 33.3, 15), (36, 19, 20)),
}

# Ingår i kartongen, ordagrant ur Lieferumfang.
INGAR = {
    "8cfe5171": ["isskopa", "istärningsform"], "a33ece7a": ["isskopa", "istärningsform"],
    "9a33e15f": ["isskopa", "istärningsform"], "b2c76518": ["isskopa", "istärningsform"],
}

# ── PER PRODUKT: unika, grundade leverantörspåståenden ──────────────────────
# Textgrinden slår upp sina tal här. Står ett tal inte här och inte i en
# måttabell ovan finns det ingen källa till det, och då får det inte skrivas.
UNIKT = {
    "8cfe5171": "nyckellås på dörren (syns i bild 1), dörren öppnar 135 grader, "
                "5-stegs termostatvred, dörren kan hängas om",
    "a33ece7a": "nyckellås på dörren (syns i bild 1), dörren öppnar 135 grader, "
                "5-stegs termostatvred, dörren kan hängas om",
    "9a33e15f": "dörren öppnar 180 grader, 5-stegs termostatvred, dörren kan hängas om",
    "b2c76518": "dörren öppnar 180 grader, 5-stegs termostatvred, dörren kan hängas om",
    "47a91a17": "12 flaskor, 8–18 grader, 37 dB, 75 kWh per år, dubbelglasad UV-dörr, "
                "touchpanel, blå LED, uttagbara trådhyllor, 0,3 A",
    "15d30e23": "16 flaskor, 5–18 grader, 41 dB, 133 kWh per år, dubbelglasad UV-dörr, "
                "touchpanel, blå LED, uttagbara trådhyllor, 0,5 A",
    "480849a7": "18 flaskor, 5–18 grader, 41 dB, 120 kWh per år, dubbelglasad UV-dörr, "
                "touchpanel, blå LED, uttagbara trådhyllor, 0,5 A",
    "fdbfcea0": "20 flaskor, 5–18 grader, 39 dB, 132 kWh per år, dubbelglasad UV-dörr, "
                "touchpanel, blå LED, uttagbara trådhyllor, 0,6 A",
}

# Flaskmåttet kapaciteten är räknad på. Samma för alla fyra.
FLASKMATT = "Ø 7 × 31,5 cm"
FLASKVOLYM_ML = 750

# ── ☠️ TVÅ SPEC-FÄLT SOM INTE FÅR SKRIVAS UT ────────────────────────────────
#
# 1. `47a91a17` anger `AC 230V 60Hz`. Det svenska elnätet är 50 Hz, och de sju
#    andra raderna i samma familj säger 50 Hz. Det är med all sannolikhet ett
#    fel i leverantörens datablad — men "sannolikt" är inte en källa, och att
#    skriva 50 Hz vore att hitta på. Frekvensen utelämnas på den sidan.
#
# 2. `fdbfcea0` anger köldmediet `R600` (n-butan). De sju andra säger `R600a`
#    (isobutan), som är standard i kylskåp. Samma resonemang: köldmediet
#    utelämnas på den sidan hellre än gissas åt något håll.
#
# Grinden fäller om något av de utelämnade fälten dyker upp i texten ändå.
UTELAMNAS = {
    "47a91a17": ["Hz", "hertz", "frekvens"],
    "fdbfcea0": ["R600", "köldmedium", "koldmedium"],
}

KOLDMEDIUM = {
    "8cfe5171": "R600a", "a33ece7a": "R600a", "9a33e15f": "R600a", "b2c76518": "R600a",
    "47a91a17": "R600a", "15d30e23": "R600a", "480849a7": "R600a",
}

SPANNING = {
    "8cfe5171": "220–240 V / 50 Hz", "a33ece7a": "220–240 V / 50 Hz",
    "9a33e15f": "220–240 V / 50 Hz", "b2c76518": "220–240 V / 50 Hz",
    "15d30e23": "220–240 V / 50 Hz", "480849a7": "220–240 V / 50 Hz",
    "fdbfcea0": "230 V / 50 Hz",
    # 47a91a17 saknas med flit — se UTELAMNAS.
}


def kontroll():
    """Varje tabell ska täcka precis rundans åtta nycklar, varken mer eller mindre."""
    n = set(WIX)
    if len(n) != 8:
        raise SystemExit("☠️ rundan ska ha åtta produkter, har %d" % len(n))
    for namn, tab in [("VARIANT", VARIANT), ("GRUPPER", GRUPPER), ("YTTRE", YTTRE),
                      ("VIKT", VIKT), ("PAKET", PAKET), ("VOLYM", VOLYM), ("FARG", FARG),
                      ("EFFEKT", EFFEKT), ("LJUD", LJUD), ("ENERGIKLASS", ENERGIKLASS),
                      ("TEMPERATUR", TEMPERATUR), ("SLADD", SLADD), ("HYLLAST", HYLLAST),
                      ("MATERIAL", MATERIAL), ("UNIKT", UNIKT)]:
        if set(tab) != n:
            raise SystemExit("☠️ %s täcker inte rundan: %s" % (namn, set(tab) ^ n))
    for k in "AB":
        pass
    frys = {k for k, g in GRUPPER.items() if g in ("A", "B")}
    vin = {k for k, g in GRUPPER.items() if g == "C"}
    if set(DORRVINKEL) != frys or set(INNERFACK) != frys or set(INGAR) != frys:
        raise SystemExit("☠️ frysspecifika tabeller täcker inte grupp A+B")
    if set(FLASKOR) != vin:
        raise SystemExit("☠️ FLASKOR täcker inte grupp C")
    if not vin <= set(ARSFORBRUKNING):
        raise SystemExit("☠️ alla vinkylar ska ha en årsförbrukning")
    # ☠️ Etikettburna tal får bara stå där en etikett faktiskt lästs.
    if set(LJUDKLASS) != {"b2c76518", "480849a7"}:
        raise SystemExit("☠️ ljudklass utan etikettbild — talet har ingen källa")
    if LJUD["480849a7"] != 43:
        raise SystemExit("☠️ 480849a7 tillbaka på spec-blockets 41 dB — etiketten säger 43")
    # de två utelämnade fälten får inte smyga tillbaka via en annan tabell
    if "47a91a17" in SPANNING:
        raise SystemExit("☠️ 47a91a17 har fått en spänningsrad — 60 Hz-felet är tillbaka")
    if "fdbfcea0" in KOLDMEDIUM:
        raise SystemExit("☠️ fdbfcea0 har fått ett köldmedium — R600-felet är tillbaka")
    # grupp A och B får inte råka få samma effekt/dörrvinkel — det är enda skillnaden
    if EFFEKT["8cfe5171"] == EFFEKT["9a33e15f"] or DORRVINKEL["8cfe5171"] == DORRVINKEL["9a33e15f"]:
        raise SystemExit("☠️ grupp A och B skiljer sig inte längre — då är de samma modell")
    print("✅ matt.py: åtta produkter, alla tabeller täcker rundan, båda utelämningarna håller")


if __name__ == "__main__":
    kontroll()
