# -*- coding: utf-8 -*-
"""Runda 68 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda bygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN. Varje rad är vald mot bild 1 och granskad på kontaktarket.

⚠️ Familj I:s två syskon har OLIKA träfot (ljus respektive mörk), så deras
   gemensamma rubrik får inte handla om foten. Den handlar om sitsen i stället.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                        # noqa: E402
from texter import PRODUKTER, F_FARG, G_FARG, H_FARG, I_FARG      # noqa: E402

# Fotot: stol och fotpall står bredvid varandra, var och en på en svart stjärnfot.
F_RADER = [("Mått", 0), ("Fotpall", 1), ("Sits", 2),
           ("Stoppning", 4), ("Maxlast", 6), ("Vikt", 10)]
# Fotot: hög rygg med utsvängda sidor, inga hjul och ingen lös pall.
G_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Ryggvinkel", 6), ("Maxlast", 7), ("Passar", 8)]
# Fotot: ljus honungsfärgad träfot under både stol och pall.
H_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Fotpall", 2),
           ("Ryggvinkel", 7), ("Vägg", 8), ("Maxlast", 9)]
# Fotot: bred sits och hög rygg — foten skiljer sig mellan syskonen.
I_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Fotpall", 2),
           ("Ryggvinkel", 7), ("Vägg", 8), ("Maxlast", 9)]

KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    if _k in F_FARG:
        KORT[_k] = ("Loungefåtölj i chenille, %s" % F_FARG[_k],
                    "Fotpallen har en egen stjärnfot", F_RADER)
    elif _k in G_FARG:
        KORT[_k] = ("Läsfåtölj med inbyggt fotstöd, %s" % G_FARG[_k],
                    "Hög rygg med utsvängda sidor", G_RADER)
    elif _k in H_FARG:
        KORT[_k] = ("Gungfåtölj med fotpall, %s" % H_FARG[_k],
                    "Ljus träfot under båda delarna", H_RADER)
    else:
        KORT[_k] = ("Biofåtölj med fotpall, %s" % I_FARG[_k],
                    "Bred sits med hög rygg", I_RADER)

# Radien följer överskottet, ~0,5 px per 15 kB. Fylls i när bygget mätt korten.
MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
