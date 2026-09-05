# -*- coding: utf-8 -*-
"""Runda 70 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda bygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN. Varje rad är vald mot bild 1 och granskad på kontaktarket.

☠️ Familj P:s tre syskon skiljer sig på TVÅ punkter — klädseln (mikrofibertyg
   mot sammetslook) och foten (`266c5e75` står på en blank förkromad fot, de
   andra på matt svart). Deras gemensamma rubrik får därför handla om VARKEN
   klädsel eller fot. Den handlar om den lösa fotpallen, som alla tre har och
   som syns bredvid stolen på alla tre hjältebilder. Samma lärdom som runda
   69:s familj K och runda 68:s familj I, en gång till.

⚠️ Familj J och Q har BÅDA en rund träfot, och rubrikerna ligger nära varandra.
   Skillnaden som fotot faktiskt visar: J har träklädda armstödsfronter, Q har
   BÖJDA träarmstöd i samma körsbärston som foten. Rubrikerna säger det.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER, J_FARG, L_FARG, P_FARG, Q_FARG          # noqa: E402

# Fotot: böjd träfot under stolen och fotstödet utfällt ur framkanten.
J_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Ryggvinkel", 5), ("Vridfot", 6), ("Maxlast", 7)]
# Fotot: smal stomme, hög rak rygg, mörka fötter.
L_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Ryggvinkel", 6), ("Vägg", 9), ("Maxlast", 7)]
# Fotot: stolen och den lösa pallen bredvid varandra, båda på rund fot.
P_RADER = [("Golvyta", 0), ("Tillbakalutad", 2), ("Sits", 4),
           ("Fotpall", 8), ("Stålfot", 10), ("Maxlast", 11)]
# Fotot: rund träfot, böjda träarmstöd och fotstödet utfällt.
Q_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Ryggvinkel", 8), ("Vridfot", 10), ("Maxlast", 11)]

KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    if _k in J_FARG:
        KORT[_k] = ("Fåtölj i konstläder, %s" % J_FARG[_k],
                    "Böjd träfot och utfällt fotstöd", J_RADER)
    elif _k in L_FARG:
        KORT[_k] = ("Biofåtölj 64 cm bred, %s" % L_FARG[_k],
                    "Smal stomme med hög, rak rygg", L_RADER)
    elif _k in P_FARG:
        KORT[_k] = ("Fåtölj med lös fotpall, %s" % P_FARG[_k],
                    "Stolen och pallen står var för sig", P_RADER)
    else:
        KORT[_k] = ("Fåtölj på vridbar träfot, %s" % Q_FARG[_k],
                    "Böjda träarmstöd och utfällt fotstöd", Q_RADER)

# Radien följer överskottet, ~0,5 px per 15 kB. Fylls i när bygget mätt korten.
MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
