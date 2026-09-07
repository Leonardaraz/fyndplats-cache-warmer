# -*- coding: utf-8 -*-
"""Runda 91 — Fyndplats eget faktakort, ett per sparkcykel.

☠️ HJÄLTEBILDEN ÄR `<id>-0.jpg`, produktbilden mot vit botten. Tre av fyra bär
   dessutom ett barn i bild; bottnen är ändå vit, så 215 kB-taket klaras utan
   uppmjukning — det är lövverket i runda 88:s livsstilsbilder som sprängde det,
   inte att en människa syns.

☠️ RUBRIKERNA ÄR VALDA MOT HJÄLTEBILDEN, inte mot texten. De fyra är samma
   sparkcykel i fyra lackeringar, och i en miniatyr är RANDNINGEN det enda som
   skiljer dem åt utöver grundfärgen. Mätt i 2x zoom (Steg 4):
   · `369b4b2c` svart ram, guld- och VITRANDNING.
   · `feac1d03` TURKOS ram (källan säger "Hellblau"), guld- och svartrandning.
   · `c851d101` vit ram, SVARTA ränder — ingen guldrand alls.
   · `1b1d4842` gräddbeige ram, guld- och svartrandning.

⚠️ ORDET SCOOTER står tryckt i guld på ramen på samtliga fyra. Det är fysiskt
   på varan och rörs inte — men det namnges heller aldrig, varken i rubriken
   eller i alt-texten.
"""
import json
import os
import shutil
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
import texter                                                         # noqa: E402

ETIKETTER = ["Mått", "Hjul", "Broms", "Maxlast", "Vikt", "Färg"]

# ☠️ KORTPLAN BOR I texter.py (`KORT`) och lintas där. En rubrik som bara fanns
#    här var ogranskad — och rubriken är precis den plats där runda 90 och 91
#    båda skrev fel färg.
KORTPLAN = texter.KORT


def specrader(pid):
    """Spec-tabellen som `Etikett: värde`-strängar, samma form kortbygget tar."""
    return ["%s: %s" % (k, v) for k, v in texter.P[pid]["spec"]]


def index_for(spec, etikett):
    """Radens index, uppslaget på HELA etiketten. Kastar hellre än gissar."""
    traff = [i for i, r in enumerate(spec)
             if ": " in r and r.split(": ", 1)[0].lower() == etikett.lower()]
    if len(traff) != 1:
        raise SystemExit("%r matchar %d rader i specen för produkten — tvetydigt"
                         % (etikett, len(traff)))
    return traff[0]


PRODUKTER, kortdata = [], {}
for pid in texter.P:
    spec = specrader(pid)
    kicker, rubrik = KORTPLAN[pid]
    PRODUKTER.append({"kort": pid, "spec": spec})
    kortdata[pid] = (kicker, rubrik, [(e, index_for(spec, e)) for e in ETIKETTER])

KALLA = os.path.join(HAR, "kortkalla")
os.makedirs(os.path.join(KALLA, "rawbilder"), exist_ok=True)
for p in PRODUKTER:
    shutil.copyfile(os.path.join(HAR, "rawbilder", p["kort"] + "-0.jpg"),
                    os.path.join(KALLA, "rawbilder", p["kort"] + "-1.jpg"))

namn, facit = bygg(KALLA, PRODUKTER, kortdata)
json.dump(facit, open(os.path.join(HAR, "kort-facit.json"), "w",
                      encoding="utf-8"), ensure_ascii=False, indent=1)
print("kort-facit.json skriven,", len(namn), "kort")
