# -*- coding: utf-8 -*-
"""Runda 72 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda bygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN. Varje rad är vald mot bild 1 och granskad på kontaktarket.

☠️ Trions rubrik säger SOCKEL, inte fot. Hjältebilden visar en tygklädd
   fyrsidig sockel som smalnar av mot golvet — den publicerade syskonsidan
   kallar samma sak "rund stålbas" och har fel (uppgift #298). Kortet får
   inte ärva det felet.

⚠️ Trion delar rubrik, och det går: alla tre är samma modell och det som
   skiljer dem är BARA färgen, som står i kickern.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER, W_FARG, W_VAV                           # noqa: E402

# Fotot: skålen direkt på golvet på en tygklädd, avsmalnande sockel.
W_RADER = [("Mått", 0), ("Sittyta", 1), ("Sitthöjd", 2),
           ("Ryggvinklar", 4), ("Rotation", 6), ("Maxlast", 7)]
# Fotot: smal stol med lös pall, båda på svart stålkryss.
X_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Fotpall", 5), ("Ryggvinkel", 6), ("Maxlast", 8)]
# Fotot: stol och pall på rund stålfot, tjock rygg.
Y_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Fotpall", 6), ("Ryggvinkel", 7), ("Maxlast", 9)]
# Fotot: stol och pall på mörk träfot.
Z_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
           ("Fotpall", 6), ("Ryggvinkel", 7), ("Maxlast", 9)]
# Fotot: träsidor och blankt stålkryss, pallen bredvid.
AA_RADER = [("Mått", 0), ("Tillbakalutad", 1), ("Sits", 2),
            ("Nackstöd", 6), ("Ryggvinkel", 8), ("Maxlast", 10)]
# Fotot: liten knappad stol på fyra svarta svarvade ben.
AE_RADER = [("Mått", 0), ("Sittyta", 1), ("Sitthöjd", 2),
            ("Klädsel", 4), ("Ben", 6), ("Maxlast", 3)]

KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    if _k in W_FARG:
        KORT[_k] = ("Golvfåtölj i %s, %s" % (W_VAV[_k], W_FARG[_k]),
                    "Tygklädd sockel som vrider hela varvet", W_RADER)
    elif _k == "f192540f":
        KORT[_k] = ("Fåtölj med fotpall, svart",
                    "Bara 75 cm bred på golvet", X_RADER)
    elif _k == "78cb09ba":
        KORT[_k] = ("Fåtölj med fotpall, grå",
                    "Vippar mjukt utöver att ryggen fälls", Y_RADER)
    elif _k == "8f6636e4":
        KORT[_k] = ("Fåtölj med fotpall, ljusgrå",
                    "Fot av massivt trä under stol och pall", Z_RADER)
    elif _k == "b8001a1b":
        KORT[_k] = ("Fåtölj med fotpall, svart",
                    "Nackstödet skjuts 10 cm i höjd", AA_RADER)
    else:
        KORT[_k] = ("Liten fåtölj 67 cm, beige",
                    "Knappad rygg på svarvade träben", AE_RADER)

# Radien följer överskottet, ~0,5 px per 15 kB. Fylls i när bygget mätt korten.
MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
