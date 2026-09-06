# -*- coding: utf-8 -*-
"""Runda 75 Steg 9 — bildplanen och alt-texterna, byggda ur den grindade texten.

Steg 4 granskade alla 35 källbilder på `ark-alla.jpg`.

☠️ TRE AV SJU HAR TYSK TEXT INBRÄND I BILD 4, och de plockas bort:

    75f6c433   "BODENSCHONEND — Geeigneter Boden: Holzboden, Teppich…"
    cc81673d   "LEICHTE MOBILITÄT — Das Ein- und Aussteigen ist problemlos."
    0945e4dd   "EINFACHE MOBILITÄT — Leichtes Ein- und Aussteigen aus dem Sitz"

  Det är inte en poleringsfråga: texten ligger i PIXLARNA och går inte att
  skriva om. `UTAN` ger de tre en egen ordning, alltså fem bilder i stället
  för sex. Hellre en bild färre än en tysk mening på en svensk sida.

  ⚠️ Måttritningarna (bild 3) bär `cm` och på tre av dem en viktikon
  (`120 KG`). Siffror och enheter är internationella och stannar kvar.

Ordningen är husets: hjältebild, livsstilsbild, KORTET på position 3, resten,
och måttritningen SIST.

☠️ ALT-TEXTEN SÄGER "UTAN HJUL" PÅ MODELL C, i varje bild. De två stolarna är
   annars svåra att skilja från de fem andra på en miniatyr, och foten är hela
   skillnaden — den som söker en stol som INTE rullar ska se det utan att
   öppna sidan.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from texter import PRODUKTER                                          # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))

# Källbildernas positioner (1-indexerade som i bilder.json). 3 är måttritningen
# och läggs sist; kortet skjuts in på position 3 i den färdiga listan.
ORDNING = [1, 2, 4, 5, 3]
# ☠️ De tre med tysk text i bild 4 — se docstringen.
UTAN = {"75f6c433": [1, 2, 5, 3],
        "cc81673d": [1, 2, 5, 3],
        "0945e4dd": [1, 2, 5, 3]}

STAM = {
    "75f6c433": "Kontorsstol i benvit bouclé med nackstöd",
    "7ab2f8aa": "Kontorsstol i ljusgrå bouclé med nackstöd",
    "60c803f0": "Kontorsstol i ljusbrun bouclé med nackstöd",
    "cc81673d": "Kontorsstol i gräddvit snöflanell med fotstöd",
    "0945e4dd": "Kontorsstol i brun snöflanell med fotstöd",
    "348ee535": "Snurrstol i grå väv på fast fot utan hjul",
    "4d83eca6": "Snurrstol i benvit väv på fast fot utan hjul",
}

FARG = {
    "75f6c433": "benvit", "7ab2f8aa": "ljusgrå", "60c803f0": "ljusbrun",
    "cc81673d": "gräddvit", "0945e4dd": "brun",
    "348ee535": "grå", "4d83eca6": "benvit",
}

MOTIV = {
    "75f6c433": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "vid ett skrivbord i ett rum med hyllor och gardin",
        3: "måttskiss med mått i centimeter, sedd framifrån och från sidan",
        5: "närbild på sitsen och armstödets bouclé"},
    "7ab2f8aa": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "i ett arbetsrum med skärm, hylla och krukväxt",
        3: "måttskiss med mått i centimeter, sedd framifrån och från sidan",
        4: "vid ett höj- och sänkbart skrivbord med en sittande person",
        5: "vid ett skrivbord med bordslampa och fönster bakom"},
    "60c803f0": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "vid ett skrivbord i ett rum med tavlor och torkade strån",
        3: "måttskiss med mått i centimeter och maxlast 120 kg",
        4: "vid ett skrivbord med en sittande person och bärbar dator",
        5: "vid ett skrivbord med en läsande person och krukväxt"},
    "cc81673d": {
        1: "sedd snett framifrån med fotstödet utdraget",
        2: "vid ett skrivbord framför ett fönster",
        3: "måttskiss med mått i centimeter, upprätt och nedfälld",
        5: "med en läsande person och fotstödet ute"},
    "0945e4dd": {
        1: "sedd snett framifrån med fotstödet utdraget",
        2: "helt nedfälld med en vilande person och fotstödet ute",
        3: "måttskiss med mått i centimeter, upprätt och nedfälld",
        5: "vid ett skrivbord med en person som sträcker på sig"},
    "348ee535": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "framför en bokhylla med en filt över ryggen",
        3: "måttskiss med mått i centimeter och maxlast 120 kg",
        4: "framför en bokhylla med krukväxt och bordslampa",
        5: "vid ett skrivbord med en läsande person"},
    "4d83eca6": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "vid en hylla med kaffekopp och böcker",
        3: "måttskiss med mått i centimeter och maxlast 120 kg",
        4: "framför en gardin med krukväxt bredvid",
        5: "framför en hylla med tavlor och dekoration"},
}

KORTTEXT = {
    "75f6c433": "Faktakort med mått, sits, sitthöjd, ryggstöd, nackstöd och maxlast",
    "7ab2f8aa": "Faktakort med mått, sits, sitthöjd, ryggstöd, nackstöd och maxlast",
    "60c803f0": "Faktakort med mått, sits, sitthöjd, ryggstöd, nackstöd och maxlast",
    "cc81673d": "Faktakort med mått, nedfällda mått, sits, sitthöjd, fotstöd och maxlast",
    "0945e4dd": "Faktakort med mått, nedfällda mått, sits, sitthöjd, fotstöd och maxlast",
    "348ee535": "Faktakort med mått, sits, sitthöjd, foten, maxlast och vikt",
    "4d83eca6": "Faktakort med mått, sits, sitthöjd, foten, maxlast och vikt",
}

# Ord som aldrig får stå i en alt-text — samma husregler som brödtexten.
FORBJUDET = re.compile(
    r"tyskland|kina|spanien|polen|homcom|outsunny|pawhut|aiyaplay|aosom|"
    r"aliexpress|artikelnummer|modellreferens|\b\d{3}-\d{3}", re.I)

# ⚠️ Bara kosmetisk: skrivvägen tar kortets Wix-id ur `kort-ids.json`
#    (`mediagen.py`), aldrig den här adressen. Den stod på "runda-74"
#    i hela rundan utan att något gick sönder — en död sträng som ljuger
#    är ändå en lögn nästa läsare tror på.
RAW = ("https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/"
       "claude/seo-polering-runbook-review-bz3j9l/tools/polish-assets/"
       "runda-75/kort/%s_spec.jpg")

if __name__ == "__main__":
    plan, fel = {}, []
    for p in PRODUKTER:
        k = p["kort"]
        stam = STAM[k]
        ordning = UTAN.get(k, ORDNING)
        poster = []
        for i, n in enumerate(ordning):
            if i == 2:                       # KORTET på position 3
                poster.append({"kalla": "kort", "url": RAW % k,
                               "altText": "%s – %s" % (stam, KORTTEXT[k])})
            poster.append({"kalla": BILDER[k]["bilder"][n - 1],
                           "altText": "%s, %s" % (stam, MOTIV[k][n])})
        plan[k] = {"id": BILDER[k]["id"], "poster": poster}
        vantat = len(ordning) + 1
        for post in poster:
            if FORBJUDET.search(post["altText"]):
                fel.append("%s  förbjudet ord i alt-text: %s" % (k, post["altText"]))
            if not post["altText"].strip():
                fel.append("%s  tom alt-text" % k)
            if len(post["altText"]) > 250:
                fel.append("%s  alt-text över 250 tecken" % k)
        if len(poster) != vantat:
            fel.append("%s  %d bilder, väntade %d" % (k, len(poster), vantat))
        if len({x["kalla"] for x in poster}) != len(poster):
            fel.append("%s  samma källbild två gånger" % k)
        if poster[2]["kalla"] != "kort":
            fel.append("%s  kortet ligger inte på position 3" % k)
        if poster[-1]["kalla"] != BILDER[k]["bilder"][2]:
            fel.append("%s  måttritningen ligger inte sist" % k)
        # ☠️ Färgordet MÅSTE stå i varje alt-text: sex kulörer av samma möbel.
        #    Talet läses ur FARG, aldrig ur en parsning av STAM — den gamla
        #    raden plockade "böjd björk" ur björkstammen och grindade alltså
        #    på ett materialord medan meddelandet påstod att den grindade på
        #    färgen. Den gick igenom, av fel skäl. Husets vanligaste bugg.
        for post in poster:
            if FARG[k] not in post["altText"]:
                fel.append("%s  alt-text utan färgordet '%s': %s"
                           % (k, FARG[k], post["altText"][:60]))
        # ☠️ Modell C måste bära "utan hjul" i VARJE alt-text. De två stolarna
        #    är svåra att skilja från de fem andra på en miniatyr, och foten är
        #    hela skillnaden — den som söker en stol som INTE rullar ska se det
        #    utan att öppna sidan.
        if k in ("348ee535", "4d83eca6"):
            for post in poster:
                if "utan hjul" not in post["altText"]:
                    fel.append("%s  alt-text utan 'utan hjul': %s"
                               % (k, post["altText"][:60]))
    for f in fel:
        print("FEL  " + f)
    json.dump(plan, open(os.path.join(HAR, "media-plan.json"), "w"),
              ensure_ascii=False, indent=1)
    for k, v in plan.items():
        print("%s  %d bilder" % (k, len(v["poster"])))
        for i, post in enumerate(v["poster"], 1):
            print("   %d %-14s %s" % (i, post["kalla"][:14], post["altText"]))
    sys.exit(1 if fel else 0)
