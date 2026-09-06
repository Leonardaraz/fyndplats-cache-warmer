# -*- coding: utf-8 -*-
"""Runda 76, Steg 9 — bildplanen och alt-texterna, byggda ur den grindade texten.

Steg 4 granskade alla 40 källbilder på kontaktarken.

✅ INGEN av de fyrtio bilderna bär inbränd tysk text. Första gången i den här
familjen; runda 75 fick plocka bort tre. Alla åtta produkter behåller därför
sina fem källbilder, och med kortet blir det sex.

⚠️ Måttritningarna (bild 3) bär `cm` och siffror. Det är internationellt och
   stannar. Det är också de ritningarna som avgjorde måtten i texten: källans
   bokstäver L/B/T betyder olika saker i samma spec-block (se `texter.py`).

Ordningen är husets: hjältebild, livsstilsbild, KORTET på position 3, resten,
och måttritningen SIST.

☠️ ALT-TEXTEN BÄR FÄRGORDET i varje bild. Åtta stolar i tre modeller och sex
   kulörer är omöjliga att skilja på en miniatyr utan det — och färgorden är
   MÄTTA, inte hämtade ur källan, som kallar en turkos stol för grön.
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

# Källbildernas positioner (1-indexerade). 3 är måttritningen och läggs sist;
# kortet skjuts in på position 3 i den färdiga listan.
ORDNING = [1, 2, 4, 5, 3]

STAM = {
    "10235819": "Chefsstol i ljusgrå mikrofibertyg med fotstöd",
    "4fa0ae0a": "Chefsstol i grå mikrofibertyg med fotstöd",
    "143f9b2d": "Skrivbordsstol i turkos med nätrygg",
    "6e05f8b7": "Skrivbordsstol i rosa med nätrygg",
    "4293c5ce": "Skrivbordsstol i ljusgrå med nätrygg",
    "a5454821": "Sminkstol i rosa teddytyg",
    "0f7021fb": "Sminkstol i grå teddytyg",
    "ce10bfe8": "Sminkstol i gräddvit teddytyg",
}

FARG = {
    "10235819": "ljusgrå", "4fa0ae0a": "grå",
    "143f9b2d": "turkos", "6e05f8b7": "rosa", "4293c5ce": "ljusgrå",
    "a5454821": "rosa", "0f7021fb": "grå", "ce10bfe8": "gräddvit",
}

MOTIV = {
    "10235819": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "vid ett skrivbord med skärm och hurts",
        3: "måttskiss med mått i centimeter, framifrån och från sidan",
        4: "i ett rum med tavla och fönster bakom",
        5: "närbild på armstödet och sitsens främre kant"},
    "4fa0ae0a": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "vid ett skrivbord med skärm och hurts",
        3: "måttskiss med mått i centimeter, framifrån och från sidan",
        4: "i ett rum med tavla och fönster bakom",
        5: "närbild på armstödet och sitsens främre kant"},
    "143f9b2d": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "vid ett skrivbord i ett ljust rum med anslagstavla",
        3: "måttskiss med mått i centimeter, framifrån och från sidan",
        4: "vid en arbetsbänk med krukväxter och pegboard",
        5: "närbild på sitsen och den femarmade foten"},
    "6e05f8b7": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "vid ett skrivbord med skärm och fönster bakom",
        3: "måttskiss med mått i centimeter, framifrån och från sidan",
        4: "närbild på sitsen och armstödets fäste",
        5: "närbild på armstödet ovanför sitsen"},
    "4293c5ce": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "vid ett skrivbord med skärm och fönster bakom",
        3: "måttskiss med mått i centimeter, framifrån och från sidan",
        4: "närbild på sitsdynan sedd från sidan",
        5: "närbild på armstödet och nätryggens väv"},
    "a5454821": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "framför ett sminkbord med belyst spegel",
        3: "måttskiss med mått i centimeter, framifrån och från sidan",
        4: "vid ett sminkbord med lampor runt spegeln",
        5: "sedd uppifrån, med sitsen och den karformade ryggen"},
    "0f7021fb": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "vid ett bord med en klocka i bakgrunden",
        3: "måttskiss med mått i centimeter, framifrån och från sidan",
        4: "närbild på ryggens tuftning",
        5: "närbild på gaslyftet och spaken under sitsen"},
    "ce10bfe8": {
        1: "sedd snett framifrån mot vit bakgrund",
        2: "vid ett skrivbord med bärbar dator",
        3: "måttskiss med mått i centimeter, framifrån och från sidan",
        4: "vid ett skrivbord med dator och kaffekopp",
        5: "närbild på sitsen och armstödets insida"},
}

KORTTEXT = {
    "10235819": "Faktakort med mått, nedfällda mått, sits, sitthöjd, fotstöd och maxlast",
    "4fa0ae0a": "Faktakort med mått, nedfällda mått, sits, sitthöjd, fotstöd och maxlast",
    "143f9b2d": "Faktakort med mått, sits, sitthöjd, armstöd, maxlast och längdgräns",
    "6e05f8b7": "Faktakort med mått, sits, sitthöjd, armstöd, maxlast och längdgräns",
    "4293c5ce": "Faktakort med mått, sits, sitthöjd, armstöd, maxlast och längdgräns",
    "a5454821": "Faktakort med mått, sits, sitthöjd, ryggstöd, maxlast och vikt",
    "0f7021fb": "Faktakort med mått, sits, sitthöjd, ryggstöd, maxlast och vikt",
    "ce10bfe8": "Faktakort med mått, sits, sitthöjd, ryggstöd, maxlast och vikt",
}

# Ord som aldrig får stå i en alt-text — samma husregler som brödtexten.
FORBJUDET = re.compile(
    r"tyskland|kina|spanien|polen|homcom|outsunny|pawhut|aiyaplay|aosom|"
    r"aliexpress|artikelnummer|modellreferens|\b\d{3}-\d{3}", re.I)

# ⚠️ Adressen används INTE av skrivvägen — `mediagen.py` tar kortets Wix-id ur
#    `kort-ids.json`. Den står här för att visa var filen kom ifrån, pinnad på
#    den commit importen faktiskt läste. Runda 75 hade en död sträng som pekade
#    på FEL RUNDA i hela rundan utan att något gick sönder.
RAW = ("https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/"
       "09fe6cc/tools/polish-assets/runda-76/kort/%s_spec.jpg")

if __name__ == "__main__":
    plan, fel = {}, []
    for p in PRODUKTER:
        k = p["kort"]
        stam = STAM[k]
        poster = []
        for i, n in enumerate(ORDNING):
            if i == 2:                       # KORTET på position 3
                poster.append({"kalla": "kort", "url": RAW % k,
                               "altText": "%s – %s" % (stam, KORTTEXT[k])})
            poster.append({"kalla": BILDER[k]["bilder"][n - 1],
                           "altText": "%s, %s" % (stam, MOTIV[k][n])})
        plan[k] = {"id": BILDER[k]["id"], "poster": poster}
        for post in poster:
            if FORBJUDET.search(post["altText"]):
                fel.append("%s  förbjudet ord i alt-text: %s" % (k, post["altText"]))
            if not post["altText"].strip():
                fel.append("%s  tom alt-text" % k)
            if len(post["altText"]) > 250:
                fel.append("%s  alt-text över 250 tecken" % k)
            # ☠️ Färgordet MÅSTE stå i varje alt-text. Talet läses ur FARG,
            #    aldrig ur en parsning av STAM — runda 74:s grind plockade
            #    "böjd björk" ur stammen och grindade alltså på ett
            #    materialord medan meddelandet påstod att den grindade på
            #    färgen. Den gick igenom, av fel skäl.
            if FARG[k] not in post["altText"]:
                fel.append("%s  alt-text utan färgordet '%s': %s"
                           % (k, FARG[k], post["altText"][:60]))
        if len(poster) != len(ORDNING) + 1:
            fel.append("%s  %d bilder, väntade %d" % (k, len(poster), len(ORDNING) + 1))
        if len({x["kalla"] for x in poster}) != len(poster):
            fel.append("%s  samma källbild två gånger" % k)
        if poster[2]["kalla"] != "kort":
            fel.append("%s  kortet ligger inte på position 3" % k)
        if poster[-1]["kalla"] != BILDER[k]["bilder"][2]:
            fel.append("%s  måttritningen ligger inte sist" % k)
    for f in fel:
        print("FEL  " + f)
    json.dump(plan, open(os.path.join(HAR, "media-plan.json"), "w"),
              ensure_ascii=False, indent=1)
    for k, v in plan.items():
        print("%s  %d bilder" % (k, len(v["poster"])))
    print("\n%d fel" % len(fel))
    sys.exit(1 if fel else 0)
