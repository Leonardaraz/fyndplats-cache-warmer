# -*- coding: utf-8 -*-
"""Runda 67 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

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
from texter import PRODUKTER, B_FARG, C_FARG, D_FARG, E_FARG      # noqa: E402

# Fotot: stolen och den LÖSA fotpallen står bredvid varandra på mörk träfot.
B_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Fotpall", 6), ("Vägg", 8), ("Maxlast", 9)]
# Fotot: tuftad rygg med knappar och tjocka rullade armstöd, ficka på sidan.
C_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Sidofickor", 6), ("Maxlast", 9), ("Passar", 10)]
# Fotot: ljus honungsfärgad träfot under både stol och pall.
D_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Förvaringsfack", 6), ("Ryggvinkel", 7), ("Maxlast", 8)]
# Fotot: hög rygg med eget nackparti och vingar ut mot sidorna.
E_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Fotpall", 5), ("Ryggvinkel", 6), ("Maxlast", 7)]

KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    if _k in B_FARG:
        KORT[_k] = ("Reclinerfåtölj med fotpall, %s" % B_FARG[_k],
                    "Fotpallen står fritt bredvid", B_RADER)
    elif _k in C_FARG:
        KORT[_k] = ("Tv-fåtölj i chenille, %s" % C_FARG[_k],
                    "Tuftad rygg och tjocka armstöd", C_RADER)
    elif _k in D_FARG:
        KORT[_k] = ("Vilfåtölj med förvaring, %s" % D_FARG[_k],
                    "Ljus träfot under båda delarna", D_RADER)
    else:
        KORT[_k] = ("Relaxfåtölj för 160 kg, %s" % E_FARG[_k],
                    "Hög rygg med eget nackparti", E_RADER)

# Radien följer överskottet, ~0,5 px per 15 kB. Mätt vid q=85 utan mjukning:
#   ceae31c1 +52,2 kB. Chenillens väv är brus för en JPEG-kvantiserare.
# ⚠️ Bara den GRÅ chenillen sprängde taket — den gräddvita systerbilden
#    (1b39b14e) rymdes med marginal. Ljusare tyg ger mindre kontrast per
#    trådkorsning, alltså färre bitar. Mjuka därför per KORT, inte per familj.
MJUKA = {"ceae31c1": 2.0}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
