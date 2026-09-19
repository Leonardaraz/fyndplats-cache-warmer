# -*- coding: utf-8 -*-
"""Runda 77, Steg 9 — bildplanen och alt-texterna.

Steg 4 granskade alla 35 källbilder på kontaktarken.

☠️ FYRA BILDER BÄR INBRÄND TYSK TEXT och plockas bort — se STEG2-5.md.
   `3033003c` tappar två och får därför tre källbilder plus kortet.

☠️ EN VINSETTO-ETIKETT sitter insydd under sitsen på `83fd57c9` och syns i
   bild 5. Bilden STANNAR — märket sitter fysiskt på varan, och Leonards
   regel är att vi då inte gör något åt det. Men alt-texten beskriver
   sitskanten och fotringen, ALDRIG etiketten: märket får inte nämnas i text.

Ordningen är husets: hjältebild, livsstilsbild, KORTET på position 3, resten,
och måttritningen SIST.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from texter import PRODUKTER                                          # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))

# Källbildernas positioner i ordning. Kortet skjuts in på plats 3 i den
# färdiga listan; måttritningen (3) ligger alltid sist.
ORDNING = {
    "d739872f": [1, 2, 5, 3],      # 4 är tysk
    "795c5ee2": [1, 2, 5, 3],      # 4 är tysk
    "3033003c": [1, 2, 3],         # 4 och 5 är tyska
    "83fd57c9": [1, 2, 4, 5, 3],
    "f1f861ea": [1, 2, 4, 5, 3],
    "df0d351f": [1, 2, 4, 5, 3],
    "cc0ec7ba": [1, 2, 4, 5, 3],
}

STAM = {
    "d739872f": "Ritstol med uppfällbara armstöd i svart nätväv",
    "795c5ee2": "Ritstol utan armstöd i svart nätväv",
    "3033003c": "Ritstol med svankstöd i svart nätväv",
    "83fd57c9": "Ritstol med armstöd i svart nätväv",
    "f1f861ea": "Ritstol för höga arbetsbänkar i svart nätväv",
    "df0d351f": "Skrivbordsstol i vitt teddytyg med hjärtformad rygg",
    "cc0ec7ba": "Skrivbordsstol i rosa teddytyg med hjärtformad rygg",
}

MOTIV = {
    "d739872f": {1: "sedd snett framifrån mot vit bakgrund",
                 2: "vid ett höj- och sänkbart skrivbord med skärm",
                 3: "måttskiss med mått i centimeter, framifrån och från sidan",
                 5: "vid skrivbordet sedd från andra hållet"},
    "795c5ee2": {1: "sedd snett framifrån mot vit bakgrund",
                 2: "vid ett vitt skrivbord i ett ljust rum",
                 3: "måttskiss med mått i centimeter, framifrån och från sidan",
                 5: "närbild på nätryggen och sitsen bakifrån"},
    "3033003c": {1: "sedd snett framifrån mot vit bakgrund",
                 2: "vid ett skrivbord med skärm och bokhylla",
                 3: "måttskiss med mått i centimeter, framifrån och från sidan"},
    "83fd57c9": {1: "sedd snett framifrån mot vit bakgrund",
                 2: "vid ett vitt skrivbord med hyllor bakom",
                 3: "måttskiss med mått i centimeter, framifrån och från sidan",
                 4: "närbild på nätvävens struktur i ryggen",
                 5: "närbild på sitsens framkant och fotringen underifrån"},
    "f1f861ea": {1: "sedd snett framifrån mot vit bakgrund",
                 2: "vid ett skrivbord med krukväxt och skärm",
                 3: "måttskiss med mått i centimeter, framifrån och från sidan",
                 4: "närbild på nätvävens struktur i ryggen",
                 5: "närbild på ryggens nedre del och sitsens kant"},
    "df0d351f": {1: "sedd snett framifrån mot vit bakgrund",
                 2: "vid ett skrivbord med bärbar dator",
                 3: "måttskiss med mått i centimeter, framifrån och från sidan",
                 4: "en person sitter på stolen vid ett skrivbord",
                 5: "vid ett sminkbord med rund spegel"},
    "cc0ec7ba": {1: "sedd snett framifrån mot vit bakgrund",
                 2: "vid ett bord i ett ljust rum",
                 3: "måttskiss med mått i centimeter, framifrån och från sidan",
                 4: "en person sitter på stolen vid ett skrivbord",
                 5: "vid ett sminkbord med rund spegel"},
}

KORTTEXT = {
    "d739872f": "Faktakort med mått, sits, sitthöjd, armstöd, fotring och maxlast",
    "795c5ee2": "Faktakort med mått, sits, sitthöjd, ryggstöd, fotring och maxlast",
    "3033003c": "Faktakort med mått, sits, sitthöjd, svankstöd, armstöd och maxlast",
    "83fd57c9": "Faktakort med mått, sits, sitthöjd, ryggstöd, armstöd och maxlast",
    "f1f861ea": "Faktakort med mått, sits, sitthöjd, ryggstöd, fotring och maxlast",
    "df0d351f": "Faktakort med mått, sits, sitthöjd, ryggstöd, klädsel och maxlast",
    "cc0ec7ba": "Faktakort med mått, sits, sitthöjd, ryggstöd, klädsel och maxlast",
}

FEL = []
plan = {}
for p in PRODUKTER:
    k = p["kort"]
    poster = []
    for pos in ORDNING[k]:
        if pos not in MOTIV[k]:
            FEL.append("%s: saknar motivtext för källbild %d" % (k, pos))
            continue
        poster.append({"kalla": BILDER[k]["bilder"][pos - 1],
                       "altText": "%s, %s" % (STAM[k], MOTIV[k][pos])})
    poster.insert(2, {"kalla": "kort",
                      "altText": "%s – %s" % (STAM[k], KORTTEXT[k])})
    for post in poster:
        if not post["altText"].strip():
            FEL.append("%s: tom alt-text" % k)
        if len(post["altText"]) > 160:
            FEL.append("%s: alt-text %d tecken" % (k, len(post["altText"])))
    # ☠️ kortet MÅSTE ligga på position 3, ritningen SIST
    if poster[2]["kalla"] != "kort":
        FEL.append("%s: kortet ligger inte på position 3" % k)
    if "måttskiss" not in poster[-1]["altText"]:
        FEL.append("%s: måttritningen ligger inte sist" % k)
    plan[k] = {"id": BILDER[k]["id"], "poster": poster}

json.dump(plan, open(os.path.join(HAR, "media-plan.json"), "w"),
          ensure_ascii=False, indent=1)
for f in FEL:
    print("FEL:", f)
print("%d fel | %s" % (len(FEL), "  ".join("%s:%d" % (k, len(v["poster"]))
                                           for k, v in plan.items())))
raise SystemExit(1 if FEL else 0)
