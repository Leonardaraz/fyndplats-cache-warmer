# -*- coding: utf-8 -*-
"""Runda 72 Steg 9 — bildplanen och alt-texterna, byggda ur den grindade texten.

Steg 4 granskade alla 40 källbilder. Ingen bär leverantörens logotyp. EN bär
inbränd tysk text: `b8001a1b` bild 4 har fyra tyska etiketter inritade över
fotot ("Gepolsterte Armlehne", "Robuster Stahlrahmen", "Schützendes
Fußpolster", "Passender Hocker"). Den plockas bort, så den produkten får fyra
källbilder plus kortet i stället för fem plus kortet.

☠️ Det går inte att polera bort text som ligger i PIXLARNA. En grep över
   källkoden svarar grönt medan kundens öga läser tyska — samma klass som
   logotypen i runda 64.

Ordningen är husets: hjältebild, livsstilsbild, KORTET på position 3, resten,
och måttritningen SIST. Måttritningen är källbild 3 hos den här leverantören.

⚠️ POSITION 4 OCH 5 SKRIVS PER PRODUKT. Trion delar tysk text ord för ord men
   har olika detaljbilder: `64856235` visar sockeln på trägolv och den
   rutstickade klädseln, `35872574` visar sitsen framåtfälld och sockeln
   underifrån, `4f6bef7d` visar vridlagret från sidan och klädseln.
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
# ☠️ b8001a1b bild 4 bär fyra tyska etiketter inbrända i pixlarna.
UTAN = {"b8001a1b": [1, 2, 5, 3]}

# Kort stam i alt-texten — hela produktnamnet blir för långt och upprepar sig.
STAM = {
    "64856235": "Golvfåtölj i grå linnelook",
    "35872574": "Golvfåtölj i petrolblå sammetslook",
    "4f6bef7d": "Golvfåtölj i beige linnelook",
    "f192540f": "Fåtölj i svart konstläder med fotpall",
    "78cb09ba": "Fåtölj i grått konstläder med fotpall",
    "8f6636e4": "Fåtölj i ljusgrått konstläder med fotpall",
    "b8001a1b": "Fåtölj i svart konstläder med fotpall",
    "dbbe7253": "Liten fåtölj i beige linne",
}

MOTIV = {
    "64856235": {
        1: "sedd snett framifrån på den tygklädda sockeln",
        2: "i ett rum med sidobord och krukväxt",
        3: "måttskiss med mått i centimeter och sitthöjd",
        4: "närbild på sitsens undersida och sockeln mot ett trägolv",
        5: "närbild på den rutstickade klädseln"},
    "35872574": {
        1: "sedd snett framifrån på den tygklädda sockeln",
        2: "i ett rum framför en gardin",
        3: "måttskiss med mått i centimeter och sitthöjd",
        4: "med ryggen fälld framåt, sedd ovanifrån på en matta",
        5: "närbild på sockeln och sitsens undersida"},
    "4f6bef7d": {
        1: "sedd snett framifrån på den tygklädda sockeln",
        2: "i ett vardagsrum framför en öppen spis",
        3: "måttskiss med mått i centimeter och sitthöjd",
        4: "sedd från sidan med sockeln och vridlagret synligt",
        5: "närbild på den rutstickade klädseln"},
    "f192540f": {
        1: "med den lösa fotpallen framför sig",
        2: "med fotpallen i ett vardagsrum bredvid ett sidobord",
        3: "måttskiss med mått i centimeter, upprätt, tillbakalutad och fotpall",
        4: "närbild på konstlädret över ryggstödet",
        5: "närbild på armstödet och den svarta stålramen"},
    "78cb09ba": {
        1: "med den lösa fotpallen bredvid",
        2: "med fotpallen i ett vardagsrum bredvid ett sidobord",
        3: "måttskiss med mått i centimeter, fåtölj och fotpall",
        4: "närbild på armstödet och spaken på sidan",
        5: "närbild på vippmekanismen under sitsen"},
    "8f6636e4": {
        1: "med den lösa fotpallen framför sig",
        2: "med fotpallen i ett vardagsrum vid ett träbord",
        3: "måttskiss med mått i centimeter, fåtölj och fotpall",
        4: "tillbakalutad med träfoten synlig underifrån",
        5: "en hand trycker ned sitsens stoppning"},
    "b8001a1b": {
        1: "med den lösa fotpallen framför sig",
        2: "med fotpallen i ett vardagsrum bredvid ett sidobord",
        3: "måttskiss med mått i centimeter, fåtölj och fotpall",
        5: "närbild på nackstödets spak i träramen"},
    "dbbe7253": {
        1: "sedd snett framifrån med den knappade ryggen",
        2: "i ett rum mot en mörk vägg",
        3: "måttskiss med mått i centimeter och sitthöjd",
        4: "en hand trycker ned sitsens stoppning",
        5: "närbild på sidan och de svarvade benen"},
}

KORTTEXT = {
    "64856235": "Faktakort med mått, sitthöjd, ryggvinklar, rotation och maxlast",
    "35872574": "Faktakort med mått, sitthöjd, ryggvinklar, rotation och maxlast",
    "4f6bef7d": "Faktakort med mått, sitthöjd, ryggvinklar, rotation och maxlast",
    "f192540f": "Faktakort med mått, fotpallens mått, ryggvinkel och maxlast",
    "78cb09ba": "Faktakort med mått, fotpallens mått, ryggvinkel och maxlast",
    "8f6636e4": "Faktakort med mått, fotpallens höjd, ryggvinkel och maxlast",
    "b8001a1b": "Faktakort med mått, nackstödets justering, ryggvinkel och maxlast",
    "dbbe7253": "Faktakort med mått, sitthöjd, klädsel, ben och maxlast",
}

# Ord som aldrig får stå i en alt-text — samma husregler som brödtexten.
FORBJUDET = re.compile(
    r"tyskland|kina|spanien|polen|homcom|outsunny|pawhut|aiyaplay|aosom|"
    r"aliexpress|artikelnummer|modellreferens|\b\d{3}-\d{3}", re.I)

RAW = ("https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/"
       "claude/seo-polering-runbook-review-bz3j9l/tools/polish-assets/"
       "runda-72/kort/%s_spec.jpg")

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
    for f in fel:
        print("FEL  " + f)
    json.dump(plan, open(os.path.join(HAR, "media-plan.json"), "w"),
              ensure_ascii=False, indent=1)
    for k, v in plan.items():
        print("%s  %d bilder" % (k, len(v["poster"])))
        for i, post in enumerate(v["poster"], 1):
            print("   %d %-14s %s" % (i, post["kalla"][:14], post["altText"]))
    sys.exit(1 if fel else 0)
