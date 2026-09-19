# -*- coding: utf-8 -*-
"""Runda 71 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda bygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN. Varje rad är vald mot bild 1 och granskad på kontaktarket.

⚠️ Kvartetten delar rubrik, och det går: alla fyra står på samma blanka
   underrede och alla fyra har fotstödet inbyggt. Det som skiljer dem är
   BARA färgen, och den står i kickern.

☠️ V:s rubrik säger "träkryss", inte "medar". Fotot visar ett fyrarmat kryss
   i mörkrött trä under BÅDE stolen och pallen; källan säger att stolen gungar
   men inte hur. Ett påstående om medar hade varit påhittat.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER, R_FARG, S_FARG, T_FARG, U_FARG, V_FARG  # noqa: E402

# Fotot: blank rund fot under stolen, fotstödet tuckat i framkanten.
R_RADER = [("Golvyta", 0), ("Tillbakalutad", 2), ("Sits", 4),
           ("Ryggvinkel", 9), ("Vridfot", 10), ("Maxlast", 11)]
# Fotot: bred stoppad fåtölj med tjock rygg, upprätt.
S_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Ryggvinkel", 6), ("Passar", 8), ("Maxlast", 7)]
# Fotot: smal stomme, raka sidor, låga svarta fötter.
T_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Armstöd", 3), ("Ryggvinkel", 5), ("Maxlast", 6)]
# Fotot: stolen och den lösa pallen bredvid varandra på stjärnfot.
U_RADER = [("Golvyta", 0), ("Tillbakalutad", 2), ("Sits", 4),
           ("Fotpall", 11), ("Ryggvinkel", 12), ("Maxlast", 14)]
# Fotot: mörkrött träkryss under både stol och pall.
V_RADER = [("Golvyta", 0), ("Tillbakalutad", 2), ("Sits", 4),
           ("Fotpall", 11), ("Ryggvinkel", 12), ("Maxlast", 14)]

KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    if _k in R_FARG:
        KORT[_k] = ("Fåtölj i konstläder, %s" % R_FARG[_k],
                    "Blankt underrede som snurrar hela varvet", R_RADER)
    elif _k in S_FARG:
        KORT[_k] = ("Fåtölj med fjäderkärna, %s" % S_FARG[_k],
                    "73 cm bred med 25 cm tjock rygg", S_RADER)
    elif _k in T_FARG:
        KORT[_k] = ("Smal fåtölj 69 cm, %s" % T_FARG[_k],
                    "Bara 69 cm bred på golvet", T_RADER)
    elif _k in U_FARG:
        KORT[_k] = ("Fåtölj med lös fotpall, %s" % U_FARG[_k],
                    "Fotpallen står fritt bredvid stolen", U_RADER)
    else:
        KORT[_k] = ("Gungande fåtölj med fotpall, %s" % V_FARG[_k],
                    "Mörkrött träkryss under stol och pall", V_RADER)

# Radien följer överskottet, ~0,5 px per 15 kB. Fylls i när bygget mätt korten.
MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
