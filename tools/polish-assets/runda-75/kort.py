# -*- coding: utf-8 -*-
"""Runda 75 — DATAN till de sju egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda bygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN. Varje rad nedan är vald mot bild 1 på kontaktarket.

⚠️ SYSKON DELAR RUBRIK, och det är rätt: de är samma modell fotograferad i
   olika färger, och det enda som skiljer dem står i kickern. En påhittad
   variation mellan rubrikerna hade antytt en skillnad som inte finns.

☠️ MODELL C:S RUBRIK SÄGER ATT STOLEN INTE RULLAR. Det är det fotot faktiskt
   visar — en svart fyrstjärnig fot utan hjul — och det är hela skillnaden mot
   de fem andra. Ordet "hjul" hör till modell A och B och får inte glida hit.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER, A, B, C                                 # noqa: E402

# Fotot: hög rygg med lös nackkudde överst, krommad femarmad fot med hjul.
A_RADER = [("Mått", 0), ("Sits", 1), ("Sitthöjd", 2),
           ("Ryggstöd", 3), ("Nackstödet", 5), ("Maxlast", 6)]
# Fotot: fotstödet utdraget ur sitsens framkant, ryggen tillbakalutad.
B_RADER = [("Mått", 0), ("Nedfälld", 1), ("Sits", 2),
           ("Sitthöjd", 3), ("Fotstöd", 7), ("Maxlast", 8)]
# Fotot: svart fyrstjärnig fot UTAN hjul — kortets viktigaste upplysning.
C_RADER = [("Mått", 0), ("Sits", 1), ("Sitthöjd", 2),
           ("Fot", 7), ("Maxlast", 4), ("Vikt", 9)]

FARG = {k: f for k, _, f, _ in A + B + C}
GRUPP = ({k: "A" for k, *_ in A} | {k: "B" for k, *_ in B}
         | {k: "C" for k, *_ in C})

KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    if GRUPP[_k] == "A":
        KORT[_k] = ("Kontorsstol i bouclé, %s" % FARG[_k],
                    "Nackstödet flyttas 6,5 cm i höjd", A_RADER)
    elif GRUPP[_k] == "B":
        KORT[_k] = ("Kontorsstol med fotstöd, %s" % FARG[_k],
                    "Fotstödet dras ut ur sitsens framkant", B_RADER)
    else:
        KORT[_k] = ("Snurrstol med fast fot, %s" % FARG[_k],
                    "Fyrstjärnig fot — stolen rullar inte", C_RADER)

# Radien följer överskottet, ~0,5 px per 15 kB. Fylls i när bygget mätt korten.
MJUKA = {"60c803f0": 1.1, "348ee535": 0.6}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
