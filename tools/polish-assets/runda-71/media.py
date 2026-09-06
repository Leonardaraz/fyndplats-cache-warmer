# -*- coding: utf-8 -*-
"""Runda 71 Steg 9 — bildplanen och alt-texterna, byggda ur den grindade texten.

Steg 4 granskade alla 40 källbilder: ingen bär leverantörens logotyp och ingen
bär inbränd tysk text. Alla fem följer därför med på varenda produkt — till
skillnad från runda 70, där familj J tappade två tyska paneler.

Ordningen är husets: hjältebild, livsstilsbild, KORTET på position 3, resten,
och måttritningen SIST. Måttritningen är källbild 3 hos den här leverantören.

☠️ POSITION 4 OCH 5 SKRIVS PER PRODUKT, aldrig per familj. Kvartetten R är
   ett skolexempel: 79eaab59 har två LIVSSTILSBILDER där syskonen 4b2a7407
   och 1a1d04f7 har två NÄRBILDER (utfällt fotstöd, en hand i dynan), och
   d760fffc har två närbilder på vredet i stället. Fyra produkter med
   byte-identisk tysk text har alltså tre olika bildserier. Granskat i
   kontaktark.jpg.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from texter import PRODUKTER, R_FARG, S_FARG, T_FARG, U_FARG, V_FARG  # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))

# Källbildernas positioner (1-indexerade som i bilder.json). 3 är måttritningen
# och läggs sist; kortet skjuts in på position 3 i den färdiga listan.
ORDNING = [1, 2, 4, 5, 3]

FARG = {}
for d in (R_FARG, S_FARG, T_FARG, U_FARG, V_FARG):
    FARG.update(d)

# Position 1–3 är samma slags motiv inom en familj.
GEMENSAM = {
    "d760fffc": {1: "sedd snett framifrån på det runda underredet",
                 2: "i ett vardagsrum bredvid ett sidobord",
                 3: "måttskiss med mått i centimeter"},
    "79eaab59": {1: "sedd snett framifrån på det runda underredet",
                 2: "i ett vardagsrum på en matta",
                 3: "måttskiss med mått i centimeter och maxlast"},
    "4b2a7407": {1: "sedd snett framifrån på det runda underredet",
                 2: "i ett vardagsrum mot en panelklädd vägg",
                 3: "måttskiss med mått i centimeter"},
    "1a1d04f7": {1: "sedd snett framifrån på det runda underredet",
                 2: "i ett vardagsrum med sidobord och krukväxt",
                 3: "måttskiss med mått i centimeter"},
    "99492092": {1: "sedd snett framifrån i upprätt läge",
                 2: "tillbakalutad med fotstödet utfällt vid ett fönster",
                 3: "måttskiss med mått i centimeter och maxlast"},
    "79690bf4": {1: "sedd snett framifrån i upprätt läge",
                 2: "tillbakalutad med fotstödet utfällt i ett vardagsrum",
                 3: "måttskiss med mått i centimeter och maxlast"},
    "89273d39": {1: "med den lösa fotpallen bredvid",
                 2: "med fotpallen framför, i ett vardagsrum vid ett fönster",
                 3: "måttskiss med mått i centimeter, fåtölj och fotpall"},
    "9c1889f1": {1: "med den lösa fotpallen framför sig",
                 2: "tillbakalutad med fötterna på fotpallen",
                 3: "måttskiss med mått i centimeter, fåtölj och fotpall"},
}

DETALJ = {
    "d760fffc": {4: "närbild på vredet och spaken på sidan av sitsen",
                 5: "närbild på vredet med ryggen tillbakalutad"},
    "79eaab59": {4: "tillbakalutad med fotstödet utfällt, någon läser i den",
                 5: "tillbakalutad med fotstödet utfällt i ett vardagsrum"},
    "4b2a7407": {4: "närbild på det utfällda fotstödet, sett från sidan",
                 5: "en hand trycker ned sitsens stoppning"},
    "1a1d04f7": {4: "närbild på det utfällda fotstödet, sett från sidan",
                 5: "en hand trycker ned sitsens stoppning"},
    "99492092": {4: "någon sitter upprätt i den i ett vardagsrum",
                 5: "upprätt i ett vardagsrum bredvid en hylla"},
    "79690bf4": {4: "upprätt i ett vardagsrum bredvid en lampa och ett sidobord",
                 5: "närbild på klädseln och det svarta benet"},
    "89273d39": {4: "närbild på armstöd, rygg och underredet",
                 5: "en hand trycker ned sitsens stoppning"},
    "9c1889f1": {4: "med fotpallen framför, i ett vardagsrum vid en bokhylla",
                 5: "någon läser i den med fötterna på fotpallen"},
}

KORTTEXT = {
    "d760fffc": "Faktakort med mått, ryggvinkel, vridfot och maxlast",
    "79eaab59": "Faktakort med mått, ryggvinkel, vridfot och maxlast",
    "4b2a7407": "Faktakort med mått, ryggvinkel, vridfot och maxlast",
    "1a1d04f7": "Faktakort med mått, ryggvinkel, vridfot och maxlast",
    "99492092": "Faktakort med mått, ryggvinkel, kroppslängd och maxlast",
    "79690bf4": "Faktakort med mått, armstöd, ryggvinkel och maxlast",
    "89273d39": "Faktakort med mått, fotpallens mått, ryggvinkel och maxlast",
    "9c1889f1": "Faktakort med mått, fotpallens mått, ryggvinkel och maxlast",
}

# Ord som aldrig får stå i en alt-text — samma husregler som brödtexten.
FORBJUDET = re.compile(
    r"tyskland|kina|spanien|polen|homcom|outsunny|pawhut|aiyaplay|aosom|"
    r"aliexpress|artikelnummer|modellreferens|\b\d{3}-\d{3}", re.I)

RAW = ("https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/"
       "claude/seo-polering-runbook-review-bz3j9l/tools/polish-assets/"
       "runda-71/kort/%s_spec.jpg")

if __name__ == "__main__":
    plan, fel = {}, []
    for p in PRODUKTER:
        k = p["kort"]
        stam = p["name"].split(" – ")[0]
        poster = []
        for i, n in enumerate(ORDNING):
            if i == 2:                       # KORTET på position 3
                poster.append({"kalla": "kort", "url": RAW % k,
                               "altText": "%s – %s" % (stam, KORTTEXT[k])})
            vad = DETALJ[k].get(n) or GEMENSAM[k][n]
            poster.append({"kalla": BILDER[k]["bilder"][n - 1],
                           "altText": "%s i %s, %s" % (stam, FARG[k], vad)})
        plan[k] = {"id": BILDER[k]["id"], "poster": poster}
        for post in poster:
            if FORBJUDET.search(post["altText"]):
                fel.append("%s  förbjudet ord i alt-text: %s" % (k, post["altText"]))
            if not post["altText"].strip():
                fel.append("%s  tom alt-text" % k)
            if len(post["altText"]) > 250:
                fel.append("%s  alt-text över 250 tecken" % k)
        if len(poster) != 6:
            fel.append("%s  %d bilder, väntade 6" % (k, len(poster)))
    for f in fel:
        print("FEL  " + f)
    json.dump(plan, open(os.path.join(HAR, "media-plan.json"), "w"),
              ensure_ascii=False, indent=1)
    for k, v in plan.items():
        print("%s  %d bilder" % (k, len(v["poster"])))
        for i, post in enumerate(v["poster"], 1):
            print("   %d %-14s %s" % (i, post["kalla"][:14], post["altText"]))
    sys.exit(1 if fel else 0)
