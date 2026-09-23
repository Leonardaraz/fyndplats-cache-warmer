# -*- coding: utf-8 -*-
"""Runda 69 — DATAN till de nio egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda bygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN. Varje rad är vald mot bild 1 och granskad på kontaktarket.

⚠️ Familj K:s två syskon står på OLIKA fot — den bruna på ett ljust träkryss,
   den ljusgrå på en svart fot. Deras gemensamma rubrik får därför inte handla
   om foten. Den handlar om den lösa fotpallen i stället, som båda har.
   Samma lärdom som runda 68:s familj I.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                        # noqa: E402
from texter import PRODUKTER, J_FARG, K_FARG, L_FARG, N_FARG      # noqa: E402

# Fotot: böjd träfot under stolen och fotstödet utfällt ur framkanten.
J_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Ryggvinkel", 5), ("Vridfot", 6), ("Maxlast", 7)]
# Fotot: hög stol med den lösa fotpallen bredvid — foten skiljer syskonen åt.
K_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Fotpall", 3),
           ("Ryggvinkel", 6), ("Vridfot", 7), ("Maxlast", 8)]
# Fotot: smal stomme, hög rak rygg, mörka fötter.
L_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Ryggvinkel", 6), ("Vägg", 9), ("Maxlast", 7)]
# Fotot: hög rygg med nackdel överst och knappad sits.
N_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Ryggvinkel", 6), ("Maxlast", 7), ("Passar", 8)]

KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    if _k in J_FARG:
        KORT[_k] = ("Fåtölj i konstläder, %s" % J_FARG[_k],
                    "Böjd träfot och utfällt fotstöd", J_RADER)
    elif _k in K_FARG:
        KORT[_k] = ("TV-fåtölj med fotpall, %s" % K_FARG[_k],
                    "Fotpallen står fritt bredvid stolen", K_RADER)
    elif _k in L_FARG:
        KORT[_k] = ("Biofåtölj 64 cm bred, %s" % L_FARG[_k],
                    "Smal stomme med hög, rak rygg", L_RADER)
    else:
        KORT[_k] = ("Vilfåtölj som bär 150 kg, %s" % N_FARG[_k],
                    "Hög rygg med nackdel överst", N_RADER)

# Radien följer överskottet, ~0,5 px per 15 kB. Fylls i när bygget mätt korten.
MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
