# -*- coding: utf-8 -*-
"""Runda 66 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda bygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN. Varje rad är vald mot bild 1 och granskad på kontaktarket.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                        # noqa: E402
from texter import PRODUKTER, A_FARG, T_FARG                      # noqa: E402

# Fotot: en rund träsockel under stolen, med fotstödet utfällt ur ramen.
A_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Vägg", 7), ("Maxlast", 8), ("Vikt", 12)]
# Fotot: genomgående tjock stoppning, rygg som sits.
T_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Stoppning", 5), ("Mugghållare", 7), ("Maxlast", 8)]

KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    if _k in A_FARG:
        KORT[_k] = ("Reclinerfåtölj i konstläder, %s" % A_FARG[_k],
                    "Träsockeln snurrar hela varvet", A_RADER)
    elif _k in T_FARG:
        KORT[_k] = ("Gungande tv-fåtölj, %s" % T_FARG[_k],
                    "Djup stoppning hela vägen upp", T_RADER)
    else:
        KORT[_k] = ("Reclinerfåtölj i sammetslook, beige",
                    "Rundade armstöd sluter om sitsen",
                    [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
                     ("Armstöd", 5), ("Maxlast", 7), ("Passar", 8)])

# Radien följer överskottet, ~0,5 px per 15 kB. Mätt vid q=85 utan mjukning:
#   5b16fea8 +42,8 kB (chenilleliknande väv), da6d086a +33,4 kB (sammetslugg).
MJUKA = {"5b16fea8": 1.9, "da6d086a": 1.5}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
