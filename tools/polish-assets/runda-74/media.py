# -*- coding: utf-8 -*-
"""Runda 74 Steg 9 — bildplanen och alt-texterna, byggda ur den grindade texten.

Steg 4 granskade alla 40 källbilder på kontaktarken `ark-cord.jpg` och
`ark-bjork.jpg`. **Ingen bär leverantörens logotyp och ingen bär inbränd tysk
text.** Måttritningarna bär siffror med `cm` och tre av dem en viktikon
(`150KG` respektive `120 KG`) — internationella symboler, inte tyska ord.
Alla fem positionerna används alltså på alla åtta produkterna.

Ordningen är husets: hjältebild, livsstilsbild, KORTET på position 3, resten,
och måttritningen SIST. Måttritningen är källbild 3 hos den här leverantören.

⚠️ POSITION 4 OCH 5 SKRIVS PER PRODUKT, och de sex manchesterfåtöljerna delar
   INTE bilduppsättning trots att de är samma modell. Tre av dem (`e1c41327`,
   `791e7292`, `bc220489`) har en bild BAKIFRÅN som fjärde bild; de andra tre
   har en tyg- eller detaljnärbild där. En generisk alt-text hade beskrivit
   fel motiv på hälften av familjen.

☠️ ALT-TEXTEN NÄMNER FÄRGEN I VARJE BILD, och det är inte en upprepning här:
   sex sidor visar samma möbel i sex kulörer, och `gul` och `senapsgul` ligger
   nära nog att en kund som får två flikar uppe behöver ordet för att veta
   vilken sida hen tittar på. Samma skäl som runda 73:s RUNDA FÖTTER mot
   KRYSSFOT AV TRÄ, fast på färgen i stället för på foten.
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
UTAN = {}          # ingen bild plockas bort den här rundan

STAM = {
    "e1c41327": "Manchesterfåtölj i petrolblå med fotpall",
    "58fb3025": "Manchesterfåtölj i ljusgrå med fotpall",
    "66adcdff": "Manchesterfåtölj i gul med fotpall",
    "4a9c33d2": "Manchesterfåtölj i gråbeige med fotpall",
    "791e7292": "Manchesterfåtölj i senapsgul med fotpall",
    "bc220489": "Manchesterfåtölj i orange med fotpall",
    "84082d41": "Vilstol i böjd björk med gråbrun dyna",
    "7e00970f": "Vilstol i böjd björk med grå dyna",
}

FARG = {
    "e1c41327": "petrolblå", "58fb3025": "ljusgrå",  "66adcdff": "gul",
    "4a9c33d2": "gråbeige",  "791e7292": "senapsgul", "bc220489": "orange",
    "84082d41": "gråbrun",   "7e00970f": "grå",
}

MOTIV = {
    "e1c41327": {
        1: "sedda snett framifrån mot vit bakgrund",
        2: "i ett vardagsrum med rutig matta och runt sidobord",
        3: "måttskiss med mått i centimeter för fåtölj och fotpall",
        4: "sedda snett bakifrån i ett rum med hyllnischer",
        5: "närbild på ryggens ribbor och den vingformade sidan"},
    "58fb3025": {
        1: "sedda snett framifrån mot vit bakgrund",
        2: "i ett vardagsrum med bokhylla, bordslampa och blommor",
        3: "måttskiss med mått i centimeter för fåtölj och fotpall",
        4: "närbild på ryggens rutmönstrade sömmar",
        5: "en hand som trycker ned i sitsdynan"},
    "66adcdff": {
        1: "sedda snett framifrån mot vit bakgrund",
        2: "i ett vardagsrum med sidobord, skåp och krukväxt",
        3: "måttskiss med mått i centimeter för fåtölj och fotpall",
        4: "närbild på det vingformade armstödet och ett ben av bok",
        5: "närbild på manchesterns ribbor och sömmen i vingen"},
    "4a9c33d2": {
        1: "sedda snett framifrån mot vit bakgrund",
        2: "i ett rum med avlastningsbord i mörkt trä och golvlampa",
        3: "måttskiss med mått i centimeter för fåtölj och fotpall",
        4: "en hand som trycker ned i den räfflade sitsen",
        5: "närbild på ryggen och armstödet i motljus vid ett fönster"},
    "791e7292": {
        1: "sedda snett framifrån mot vit bakgrund",
        2: "i ett vardagsrum med rutig matta och runt sidobord",
        3: "måttskiss med mått i centimeter för fåtölj och fotpall",
        4: "sedda snett bakifrån i ett rum med hyllnischer",
        5: "närbild på ryggens övre kant och den vingformade sidan"},
    "bc220489": {
        1: "sedda snett framifrån mot vit bakgrund",
        2: "i ett vardagsrum med rutig matta och krukväxt",
        3: "måttskiss med mått i centimeter för fåtölj och fotpall",
        4: "sedda snett bakifrån i ett rum med hyllnischer",
        5: "närbild på ryggens ribbor och den vingformade sidan"},
    "84082d41": {
        1: "med fotdelen utfälld, mot vit bakgrund",
        2: "vid en byrå i mörkt trä med bordslampa och rund matta",
        3: "måttskiss med mått i centimeter och fotdelen utfälld",
        4: "framför en hylla med böcker och torkade strån",
        5: "framför en vit spiselkrans med krukväxt och sidobord"},
    "7e00970f": {
        1: "med fotdelen utfälld, mot vit bakgrund",
        2: "i ett sovrum med sängbord, läslampa och mönstrad matta",
        3: "måttskiss med mått i centimeter och fotdelen utfälld",
        4: "närbild på den grovvävda klädseln",
        5: "närbild på den böjda björkarmen där den möter dynan"},
}

KORTTEXT = {k: "Faktakort med mått, sittyta, sitthöjd, sitsdynans tjocklek, "
               "fotpallens mått och maxlast"
            for k in ("e1c41327", "58fb3025", "66adcdff",
                      "4a9c33d2", "791e7292", "bc220489")}
KORTTEXT.update({k: "Faktakort med mått, sits, fotdel, ramprofil, maxlast "
                    "och vikt"
                 for k in ("84082d41", "7e00970f")})

# Ord som aldrig får stå i en alt-text — samma husregler som brödtexten.
FORBJUDET = re.compile(
    r"tyskland|kina|spanien|polen|homcom|outsunny|pawhut|aiyaplay|aosom|"
    r"aliexpress|artikelnummer|modellreferens|\b\d{3}-\d{3}", re.I)

RAW = ("https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/"
       "claude/seo-polering-runbook-review-bz3j9l/tools/polish-assets/"
       "runda-74/kort/%s_spec.jpg")

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
    for f in fel:
        print("FEL  " + f)
    json.dump(plan, open(os.path.join(HAR, "media-plan.json"), "w"),
              ensure_ascii=False, indent=1)
    for k, v in plan.items():
        print("%s  %d bilder" % (k, len(v["poster"])))
        for i, post in enumerate(v["poster"], 1):
            print("   %d %-14s %s" % (i, post["kalla"][:14], post["altText"]))
    sys.exit(1 if fel else 0)
