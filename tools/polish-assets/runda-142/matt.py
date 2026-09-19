# -*- coding: utf-8 -*-
"""Runda 142 — måtten, med TRE källor per fält (#447).

En läsning av en leverantörsrad är ett antagande. Fälten här är lästa ur:

  1. **katalogsvepet** — den råa raden som den lästes när familjen grupperades
  2. **spec-blocket** — tyska `Technische Daten` + den svenska spec-kolumnen
  3. **MÅTTRITNINGEN** (bild 03), zoomad — `RITNING` nedan

☠️ Regel 7: stämmer inte (1) och (2) om ett fält är fältet `None` tills det
gått att läsa om — aldrig det tal som råkade skrivas sist.

☠️ Regel 8: varje mått i `P` måste stämma med `RITNING` där ritningen bär det.

⚠️ Bara GEOMETRI. En lastsiffra i en ritning är text som råkat ritas och
vinner ingenting över spec-raden (regel 12).

☠️ DECIMALKOMMA SKRIVS SOM STRÄNG. `(74, 26, 4)` var "74 × 26,4" i runda 141
— kommat blev en tupelavskiljare och talet blev tre tal (#553). Varje mått med
decimal står därför som en STRÄNG här, aldrig som en tupel.
"""

# Ritningens tal, zoomade ur bild 03. Geometri, inget annat.
RITNING = {
    "56cca82a": ["24", "30", "125-145", "43"],
    "ce8813ce": ["18", "26", "133-151", "13,5", "43"],
    "93073695": ["125-145", "43"],
    "4fe5959f": ["136-154", "23", "48"],
    "136a4671": ["25", "147-165", "48"],
    "95f6280b": ["24", "135", "103", "38"],
    "2730de6f": ["25", "145-180", "48"],
    "2a13cbbe": ["160-205", "48", "76"],
    "c8f6b93f": ["18", "24", "60", "155-205", "48", "88"],
    "a8daef42": ["18", "24", "6", "60", "25", "60", "155-205", "31", "48"],
    "f0430bc5": ["14", "16", "8", "50", "35", "53", "160-230", "90-158",
                 "15", "27", "50", "88"],
}

# ---------------------------------------------------------------- produkterna
# `vikt` = varans vikt när leverantören anger den separat.
# `fraktvikt` = feedens `Weight (incl. Package)` (#488) — ALDRIG kallad "vikt".
P = {
    "56cca82a": dict(
        typ="boll", hojder=["125", "131", "138", "145"], hojd="125-145",
        fot="Ø43 × 12 cm", boll="Ø24 × 30 cm", bredd="43", djup="43",
        vatten="15", sand="20", blandning=None,
        vikt="3", fraktvikt="3,5", paket="43 × 13 × 50 cm",
        ingar=["punchingbollen med ställ", "ett par boxhandskar",
               "en luftpump", "monteringsanvisning"],
        # ☠️ Stod som farg=None med kommentaren "leverantoren skickar
        #    rod/svart/rod+svart SLUMPMASSIGT" — ett pastaende som inte
        #    finns i Steg 1, Steg 4 eller nagon annan av rundans kallor.
        #    Samma kommaseparerade fargkolumn last som PRODUKTENS farger
        #    pa 4fe5959f ("Schwarz, Rot") och 136a4671 ("Rot, Schwarz").
        #    Tva kallor sager rott och svart: hjaltebilden (rod-svart boll,
        #    svart fot, roda handskar) och leverantorens eget produktnamn,
        #    som slutar "… Anfanger Rot". Regel 16: bilden vinner over
        #    texten om en SYNLIG egenskap.
        farg="röd och svart",
        sugproppar=None, fjader=True, reflexstang=None, speedball=None),
    "ce8813ce": dict(
        typ="boll", hojder=None, hojd="133-151",
        fot="Ø43 × 13,5 cm", boll="Ø18 × 26 cm", bredd="45", djup="45",
        vatten="16,5", sand="33", blandning="25",
        vikt=None, fraktvikt="3,6", paket="45 × 14 × 55 cm",
        ingar=["punchingbollen med ställ", "ett par boxhandskar",
               "en luftpump", "monteringsanvisning"],
        farg="svart", sugproppar="en", fjader=True,
        reflexstang=None, speedball=None),
    "93073695": dict(
        typ="boll", hojder=["125", "132", "139", "145"], hojd="125-145",
        fot="Ø43 × 12 cm", boll="Ø20 × 28 cm", bredd="43", djup="43",
        vatten="12", sand="20", blandning=None,
        vikt=None, fraktvikt="4,2", paket="43 × 15 × 51 cm",
        ingar=["punchingbollen med ställ", "en viktsäck på 15 kg",
               "ett par boxhandskar", "en luftpump", "monteringsanvisning"],
        farg="röd och svart", sugproppar=None, fjader=True,
        reflexstang=None, speedball=None, viktsack="15"),
    "4fe5959f": dict(
        typ="boll", hojder=["136", "142", "148", "154"], hojd="136-154",
        fot="Ø48 × 23 cm", boll="18 × 18 × 24 cm", bredd="48", djup="48",
        vatten=None, sand=None, blandning=None,
        vikt=None, fraktvikt="5", paket="48 × 24 × 50 cm",
        ingar=["punchingbollen med ställ", "ett par boxhandskar"],
        farg="svart och röd", sugproppar="flera", fjader=True,
        reflexstang=None, speedball=None),
    "136a4671": dict(
        typ="boll", hojder=None, hojd="147-165",
        fot="Ø48 × 23 cm", boll="Ø25 cm", bredd="48", djup="48",
        vatten="15", sand="25", blandning="20",
        vikt=None, fraktvikt="7", paket="48 × 25 × 60 cm",
        ingar=["punchingbollen med ställ", "monteringsanvisning"],
        farg="vit, röd och blå",  # ☠️ MATT I ZOOM — specen sager rod+svart
        sugproppar="flera", fjader=True, reflexstang=None, speedball=None),
    "2730de6f": dict(
        typ="boll", hojder=None, hojd="145-180",
        fot="Ø48 × 23 cm", boll="Ø25 cm", bredd="48", djup="48",
        vatten="15", sand="25", blandning="20",
        vikt=None, fraktvikt="7", paket="50 × 26 × 58 cm",
        ingar=["punchingbollen med ställ", "monteringsanvisning"],
        farg="svart", sugproppar="flera", fjader=True,
        reflexstang=None, speedball=None, stang="Ø2,5 cm"),
    "2a13cbbe": dict(
        typ="boll", hojder=None, hojd="160-205",
        fot="Ø48 × 32 cm", boll=None, bredd="76", djup="48",
        vatten="15", sand="25", blandning="ja",
        vikt=None, fraktvikt="10", paket="53 × 48 × 43 cm",
        ingar=["punchingbollen med ställ och reflexstång", "en luftpump",
               "en skruvsats", "monteringsanvisning"],
        farg="svart", sugproppar="12", fjader=None,
        reflexstang="Ø5,5 × 50 cm", reflexhojd="95-140", speedball=None),
    "95f6280b": dict(
        typ="sack", hojder=None, hojd="135",
        fot="Ø38 × 3 cm", sack="Ø24 × 103 cm", bredd="38", djup="38",
        vatten=None, sand=None, blandning=None,
        vikt=None, fraktvikt="15", paket="120 × 35 × 27 cm",
        ingar=["den fristående boxningssäcken", "monteringsanvisning"],
        farg="röd och svart", sugproppar="10", fjader=None,
        reflexstang=None, speedball=None, forfylld=True),
    "c8f6b93f": dict(
        typ="sack", hojder=None, hojd="155-205",
        fot="Ø48 × 31 cm", sack="Ø25 × 60 cm", bredd="88", djup="48",
        vatten="30", sand="35", blandning="40",
        vikt=None, fraktvikt="16", paket="88 × 49 × 32 cm",
        ingar=["säcken med ställ, roterande arm och boll", "en luftpump",
               "ett par innerhandskar"],
        farg="röd och svart", sugproppar=None, fjader=None,
        reflexstang="Ø6 × 60 cm", speedball="Ø18 × 24 cm"),
    "a8daef42": dict(
        typ="sack", hojder=None, hojd="155-205",
        fot="Ø48 × 31 cm", sack="Ø25 × 60 cm", bredd="88", djup="48",
        vatten="30", sand="35", blandning="40",
        vikt=None, fraktvikt="16", paket="88 × 49 × 32 cm",
        ingar=["säcken med ställ, roterande arm och boll", "en luftpump",
               "ett par innerhandskar"],
        farg="svart", sugproppar=None, fjader=None,
        reflexstang="Ø6 × 60 cm", speedball="Ø18 × 24 cm"),
    "f0430bc5": dict(
        typ="sack", hojder=None, hojd="160-230",
        fot="Ø50 × 27 cm", sack="Ø15 × 53 cm", bredd="88", djup="50",
        vatten="30", sand="45", blandning="40",
        vikt=None, fraktvikt="13,3", paket="49 × 49 × 98 cm",
        ingar=["boxningsstationen", "monteringsanvisning"],
        farg="svart", sugproppar=None, fjader=None,
        # ☠️ Ø8 och sidoarmens 35 cm star BARA i mattritningen —
        #    tyska Technische Daten ger enbart stangens langd, 50 cm.
        reflexstang="Ø8 × 50 cm", sidoarm="35", speedball="Ø14 × 16 cm",
        bollhojd="90-158"),
}


def _tal(s):
    """Plocka ut talen ur en måttsträng. Decimalkomma bevaras."""
    import re
    return re.findall(r"\d+(?:,\d+)?", s or "")


def granska():
    """Regel 8: varje mått måste stämma med RITNINGEN där den bär talet."""
    fel = []
    for pid, d in P.items():
        rit = set(RITNING.get(pid, []))
        rittal = set()
        for r in rit:
            rittal.update(_tal(r))
        egna = set()
        for nyckel in ("hojd", "fot", "boll", "sack", "bredd", "djup",
                       "reflexstang", "speedball", "stang", "reflexhojd",
                       "sidoarm",
                       "bollhojd"):
            v = d.get(nyckel)
            if isinstance(v, str):
                egna.update(_tal(v))
        # Hojdintervallet ska sta ordagrant i ritningen nar ritningen har ett.
        intervall = [r for r in rit if "-" in r]
        if intervall and d["hojd"] not in intervall and "-" in d["hojd"]:
            fel.append("%s: hojd %r finns inte i ritningen %r"
                       % (pid, d["hojd"], sorted(intervall)))
        # Varje RITNINGSTAL ska ga att peka pa i ett av produktens falt.
        saknas = sorted(rittal - egna)
        if saknas:
            fel.append("%s: ritningen bar %s som inget falt forklarar"
                       % (pid, ", ".join(saknas)))
        if d.get("vikt") and d.get("fraktvikt") == d.get("vikt"):
            fel.append("%s: vikt och fraktvikt ar samma tal — ett av dem ar fel"
                       % pid)
    return fel


if __name__ == "__main__":
    f = granska()
    print("matt.granska(): %d produkter, %d fel" % (len(P), len(f)))
    for r in f:
        print("  ☠️", r)
