# -*- coding: utf-8 -*-
"""Runda 74 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda bygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN. Varje rad nedan är vald mot bild 1 på kontaktarket.

⚠️ DE SEX MANCHESTERFÅTÖLJERNA DELAR RUBRIK, och det är rätt: de är samma
   modell fotograferad i sex färger, och det enda som skiljer dem står i
   kickern. Runda 72:s trio gjorde likadant av samma skäl. En påhittad
   variation mellan rubrikerna hade antytt en skillnad som inte finns.

☠️ Rubriken säger PALLEN STÅR LÖST — det som fotot faktiskt visar, och det
   som är hela skillnaden mot en fåtölj med utfällbart fotstöd. Ordet
   "fotstöd" hör till björkvilstolen och får inte glida över hit.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER, CORD_FARG                               # noqa: E402

# Fotot: stol och pall bredvid varandra, båda på utåtlutande ben av ljus bok.
CORD_RADER = [("Mått", 0), ("Sittyta", 1), ("Sitthöjd", 2),
              ("Sitsdynan", 3), ("Fotpall", 4), ("Maxlast", 5)]
# Fotot: böjd ljus björkram, fotdelen utfälld framåt.
BJORK_RADER = [("Mått", 0), ("Sits", 3), ("Fotdel", 4),
               ("Ramprofil", 5), ("Maxlast", 6), ("Vikt", 10)]

KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    if _k in CORD_FARG:
        KORT[_k] = ("Manchesterfåtölj med fotpall, %s" % CORD_FARG[_k],
                    "Pallen står löst på egna ben av bok", CORD_RADER)
    else:
        farg = "gråbrun" if _k == "84082d41" else "grå"
        KORT[_k] = ("Vilstol i böjd björk, %s" % farg,
                    "Böjd björkram med fotdelen utfälld", BJORK_RADER)

# Radien följer överskottet, ~0,5 px per 15 kB. Fylls i när bygget mätt korten.
MJUKA = {"7e00970f": 0.9}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
