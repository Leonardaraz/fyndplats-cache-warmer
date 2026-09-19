# -*- coding: utf-8 -*-
"""Runda 70 Steg 9 — bildplanen och alt-texterna, byggda ur den grindade texten.

☠️ FAMILJ J TAPPAR TVÅ BILDER. Bild 4 och 5 på båda J-syskonen är tyska
   paneler med inbränd text ("Ausziehbare Fußstütze:", "Dick gepolstertes
   Design:", "Überfüllte Polsterung") — granskat i kolla-tyska.jpg. De kan
   inte poleras bort och får inte visas för en svensk kund. J får därför
   TRE källbilder plus kortet, mot de publicerade J-syskonens sex.

⚠️ Bildserierna är alltså inte identiska ens inom en familj. Runda 69 mätte
   samma sak åt andra hållet: 7702de01 hade en tysk panel som syskonet
   e818cf7e saknade. Granska varje produkt, inte en per familj.

Ordningen är husets: hjältebild, livsstilsbild, KORTET på position 3, resten,
och måttritningen SIST. Måttritningen är källbild 3 hos den här leverantören.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from texter import PRODUKTER, J_FARG, L_FARG, P_FARG, Q_FARG      # noqa: E402

BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))

# ☠️ Källbilder som INTE får följa med: tysk text inbränd i pixlarna.
TYSK_PANEL = {"73112149": [4, 5], "5c0e83d1": [4, 5]}

# Ordningen ur källbildernas positioner (1-indexerade som i bilder.json).
# 3 är måttritningen hos den här leverantören och läggs sist.
def ordning(kort):
    bort = set(TYSK_PANEL.get(kort, []))
    mitten = [n for n in (4, 5) if n not in bort]
    return [1, 2] + mitten + [3]


def sort(kort):
    if kort in J_FARG:
        return "J"
    if kort in L_FARG:
        return "L"
    if kort in P_FARG:
        return "P"
    return "Q"


VAD = {                       # position 1–3 är samma motiv inom en familj
    "J": {1: "sedd snett framifrån med fotstödet utfällt",
          2: "i ett vardagsrum bredvid ett sidobord",
          3: "måttskiss med mått i centimeter"},
    "L": {1: "sedd snett framifrån i upprätt läge",
          2: "i ett vardagsrum på en matta",
          3: "måttskiss med mått i centimeter"},
    "P": {1: "med den lösa fotpallen bredvid",
          2: "i ett vardagsrum med fotpallen framför",
          3: "måttskiss med mått i centimeter"},
    "Q": {1: "sedd snett framifrån med fotstödet utfällt",
          2: "i ett vardagsrum",
          3: "måttskiss med mått i centimeter"},
}

# ☠️ POSITION 4 OCH 5 SKRIVS PER PRODUKT, inte per familj. Detaljbilderna är
#    OLIKA MOTIV mellan syskon — 266c5e75 bild 4 visar den förkromade foten
#    medan d2409a95 bild 4 visar armstödet, och 566c7702 bild 5 visar det
#    utfällda fotstödet där syskonet visar mekanismen. En familjegemensam
#    alt-text hade beskrivit fel bild på fyra av sex produkter. Granskat i
#    detaljer.jpg. Samma lärdom som de tyska panelerna: syskonens bildserier
#    är inte identiska.
DETALJ = {
    "84e3794d": {4: "med fotstödet utfällt i ett rum",
                 5: "upprätt sedd snett från sidan i ett rum"},
    "021a268e": {4: "närbild på sits och armstöd med den runda foten",
                 5: "närbild på ryggens sömmar"},
    "266c5e75": {4: "närbild på den förkromade foten och vredet",
                 5: "en hand trycker ned sitsens stoppning"},
    "d2409a95": {4: "närbild på armstöd och rygg",
                 5: "närbild på armstöd, fot och vred"},
    "9bd6d1d4": {4: "närbild på det böjda träarmstödet",
                 5: "närbild på träfotens ring och mekanismen"},
    "566c7702": {4: "närbild på klädseln med en fot mot ytan",
                 5: "med fotstödet helt utfällt, sett från sidan"},
}

KORTTEXT = {
    "J": "Faktakort med mått, ryggvinkel, vridfot och maxlast",
    "L": "Faktakort med mått, ryggvinkel, väggavstånd och maxlast",
    "P": "Faktakort med mått, fotpallens mått, fotens diameter och maxlast",
    "Q": "Faktakort med mått, ryggvinkel, vridfot och maxlast",
}
FARG = {}
FARG.update(J_FARG)
FARG.update(L_FARG)
FARG.update(P_FARG)
FARG.update(Q_FARG)

# Ord som aldrig får stå i en alt-text — samma husregler som brödtexten.
FORBJUDET = re.compile(
    r"tyskland|kina|spanien|polen|homcom|outsunny|pawhut|aiyaplay|aosom|"
    r"aliexpress|artikelnummer|modellreferens|\b\d{3}-\d{3}", re.I)

RAW = ("https://raw.githubusercontent.com/Leonardaraz/fyndplats-cache-warmer/"
       "claude/seo-polering-runbook-review-bz3j9l/tools/polish-assets/"
       "runda-70/kort/%s_spec.jpg")

if __name__ == "__main__":
    plan, fel = {}, []
    for p in PRODUKTER:
        k = p["kort"]
        s = sort(k)
        stam = p["name"].split(" – ")[0]
        poster = []
        for i, n in enumerate(ordning(k)):
            if i == 2:                       # KORTET på position 3
                poster.append({"kalla": "kort", "url": RAW % k,
                               "altText": "%s – %s" % (stam, KORTTEXT[s])})
            poster.append({"kalla": BILDER[k]["bilder"][n - 1],
                           "altText": "%s i %s, %s"
                                      % (stam, FARG[k], (DETALJ.get(k) or {}).get(n) or VAD[s][n])})
        if len(ordning(k)) < 3:
            poster.append({"kalla": "kort", "url": RAW % k,
                           "altText": "%s – %s" % (stam, KORTTEXT[s])})
        plan[k] = {"id": BILDER[k]["id"], "poster": poster}
        for post in poster:
            if FORBJUDET.search(post["altText"]):
                fel.append("%s  förbjudet ord i alt-text: %s" % (k, post["altText"]))
            if not post["altText"].strip():
                fel.append("%s  tom alt-text" % k)
    for f in fel:
        print("FEL  " + f)
    json.dump(plan, open(os.path.join(HAR, "media-plan.json"), "w"),
              ensure_ascii=False, indent=1)
    for k, v in plan.items():
        print("%s  %d bilder" % (k, len(v["poster"])))
        for i, post in enumerate(v["poster"], 1):
            print("   %d %-14s %s" % (i, post["kalla"][:14], post["altText"]))
    sys.exit(1 if fel else 0)
