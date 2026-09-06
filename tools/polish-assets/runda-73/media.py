# -*- coding: utf-8 -*-
"""Runda 73 Steg 9 — bildplanen och alt-texterna, byggda ur den grindade texten.

Steg 4 granskade alla 40 källbilder. **Ingen bär leverantörens logotyp och
ingen bär inbränd tysk text** — till skillnad från runda 72, där en bild hade
fyra tyska etiketter inritade över fotot. Alla fem positionerna används alltså
på alla åtta produkterna.

Ordningen är husets: hjältebild, livsstilsbild, KORTET på position 3, resten,
och måttritningen SIST. Måttritningen är källbild 3 hos den här leverantören.

⚠️ POSITION 4 OCH 5 SKRIVS PER PRODUKT. Fyra av åtta har en detaljbild som är
   hela produktens säljargument — mugghållaren (`b72f093d`), draghandtaget
   (`54cf1f44`), sidofickan (`acb1f904`) och den knappade ryggen (`b67fdc2b`)
   — och en generisk alt-text hade slängt bort just den upplysningen.

☠️ `b1e98da4` och `b67fdc2b` ser ut som samma modell på miniatyren och är det
   INTE (833-360 mot 833-359). Alt-texterna säger därför RUNDA FÖTTER
   respektive KRYSSFOT AV TRÄ redan i hjältebilden, så en kund som får de två
   sidorna sida vid sida kan se skillnaden utan att öppna dem.
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

# Kort stam i alt-texten — hela produktnamnet blir för långt och upprepar sig.
STAM = {
    "969d9ec9": "Fåtölj i ljusgrå möbelväv",
    "b72f093d": "Gungande tv-fåtölj i gråbrun linnelook",
    "54cf1f44": "Reclinerfåtölj i grå linnelook",
    "acb1f904": "Tv-fåtölj i gräddvitt konstläder",
    "e57125fb": "Väggnära fåtölj i brun linnelook",
    "b1e98da4": "Snurrfåtölj i ljusgrått konstläder med fotpall",
    "b67fdc2b": "Vilfåtölj i gråbrunt konstläder med fotpall",
    "7eee41b6": "Bäddfåtölj i grå väv",
}

MOTIV = {
    "969d9ec9": {
        1: "sedd snett framifrån med fotstödet infällt",
        2: "med ryggen fälld och fotstödet ute, i ett vardagsrum",
        3: "måttskiss med mått i centimeter och ryggvinkel 135°",
        4: "med fotstödet utfällt, vid ett sidobord i ett vardagsrum",
        5: "i upprätt läge, i ett ljust vardagsrum"},
    "b72f093d": {
        1: "sedd snett framifrån med fotstödet utfällt",
        2: "med fotstödet utfällt, i ett arbetsrum",
        3: "måttskiss med mått i centimeter i sitt- och liggläge",
        4: "i upprätt läge, i ett vardagsrum med hylla och krukväxt",
        5: "närbild på mugghållaren i armstödet"},
    "54cf1f44": {
        1: "sedd snett framifrån med fotdelen utfälld",
        2: "i ett vardagsrum med golvlampa",
        3: "måttskiss med mått i centimeter upprätt och utfälld",
        4: "närbild på draghandtaget i sitsens framkant",
        5: "närbild på mekanismen under sitsen"},
    "acb1f904": {
        1: "sedd snett framifrån med fotstödet utfällt",
        2: "i ett vardagsrum med sidobord och krukväxt",
        3: "måttskiss med mått i centimeter upprätt och tillbakalutad",
        4: "närbild på en hand i sidofickan",
        5: "närbild på ett glas som ställs i mugghållaren"},
    "e57125fb": {
        1: "sedd snett framifrån i upprätt läge",
        2: "med ryggen fälld och fotstödet ute, i ett vardagsrum",
        3: "måttskiss med mått i centimeter och ryggvinkel 150°",
        4: "i upprätt läge i ett vardagsrum med krukväxt",
        5: "vid ett sidobord med bordslampa"},
    "b1e98da4": {
        1: "båda på var sin rund fot, sedda snett framifrån",
        2: "i ett vardagsrum med sidobord och krukväxt",
        3: "måttskiss med mått i centimeter för fåtölj och fotpall",
        4: "närbild på vridfästet under sitsen",
        5: "närbild på ryggens övre kant och sömmar"},
    "b67fdc2b": {
        1: "båda på kryssfot av trä, sedda snett framifrån",
        2: "i ett vardagsrum med sidobord och krukväxt",
        3: "måttskiss med mått i centimeter för fåtölj och fotpall",
        4: "närbild på den knappade ryggen",
        5: "närbild på armstödet och kryssfoten av trä"},
    "7eee41b6": {
        1: "med bädden hoprullad bakom ryggen",
        2: "som fåtölj i ett vardagsrum med tavlor",
        3: "måttskiss med mått i centimeter som fåtölj och som bädd",
        4: "närbild på klädselns sömmar",
        5: "närbild på det lackerade metallarmstödet"},
}

KORTTEXT = {
    "969d9ec9": "Faktakort med mått, sittyta, ryggvinkel, rotation och maxlast",
    "b72f093d": "Faktakort med mått, sittyta, sitthöjd, ryggvinkel och maxlast",
    "54cf1f44": "Faktakort med mått, sittyta, sitthöjd, stomme och maxlast",
    "acb1f904": "Faktakort med mått, sittyta, ryggvinkel, rotation och maxlast",
    "e57125fb": "Faktakort med mått, sittyta, ryggvinkel, väggavstånd och maxlast",
    "b1e98da4": "Faktakort med mått, sittyta, fotpallens mått, rotation och maxlast",
    "b67fdc2b": "Faktakort med mått, sittyta, förvaringsfacket, ryggvinkel och maxlast",
    "7eee41b6": "Faktakort med mått, sittyta, sitthöjd, ryggens lägen och maxlast",
}

# Ord som aldrig får stå i en alt-text — samma husregler som brödtexten.
FORBJUDET = re.compile(
    r"tyskland|kina|spanien|polen|homcom|outsunny|pawhut|aiyaplay|aosom|"
    r"aliexpress|artikelnummer|modellreferens|\b\d{3}-\d{3}", re.I)

RAW = ("https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/"
       "claude/seo-polering-runbook-review-bz3j9l/tools/polish-assets/"
       "runda-73/kort/%s_spec.jpg")

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
