# -*- coding: utf-8 -*-
"""Runda 76 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda bygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN. Varje rad nedan är vald mot bild 1 på kontaktarket.

⚠️ SYSKON DELAR RUBRIK, och det är rätt: de är samma modell fotograferad i
   olika färger, och det enda som skiljer dem står i kickern. En påhittad
   variation mellan rubrikerna hade antytt en skillnad som inte finns.

☠️ MODELL E:S KORT BÄR 170 CM-GRÄNSEN. Det är rundans Steg 2-fynd och den
   enskilt viktigaste upplysningen på den sidan — en stol som inte passar
   den som är längre än 170 cm. Ett faktakort som utelämnade den hade sagt
   allt utom det som avgör köpet.

☠️ MODELL F:S RUBRIK SÄGER ATT RYGGEN ÄR LÅG. 37 cm är halva höjden mot
   modell D:s 80, och det är hela skillnaden mellan en sminkstol och en
   kontorsstol. Ordet "nackstöd" hör till modell D och får inte glida hit.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER, D, E, F                                 # noqa: E402

# Fotot: hög stoppad rygg med inbyggt nackparti, fotstödet framme, kromad fot.
D_RADER = [("Mått", 0), ("Nedfälld", 1), ("Sits", 2),
           ("Sitthöjd", 3), ("Fotstöd", 6), ("Maxlast", 7)]
# Fotot: nätrygg, liten stol, vit femarmad plastfot. Kortet bär längdgränsen.
E_RADER = [("Mått", 0), ("Sits", 1), ("Sitthöjd", 2),
           ("Armstöd", 3), ("Maxlast", 4), ("Längd", 5)]
# Fotot: låg kar-formad rygg, kromad fot. Ryggens 37 cm är hela poängen.
F_RADER = [("Mått", 0), ("Sits", 1), ("Sitthöjd", 2),
           ("Ryggstöd", 3), ("Maxlast", 5), ("Vikt", 10)]

FARG = {k: f for k, _, f, _ in D + E + F}
GRUPP = ({k: "D" for k, *_ in D} | {k: "E" for k, *_ in E}
         | {k: "F" for k, *_ in F})

KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    if GRUPP[_k] == "D":
        KORT[_k] = ("Chefsstol med fotstöd, %s" % FARG[_k],
                    "Ryggen fälls — 148 cm djup nedfälld", D_RADER)
    elif GRUPP[_k] == "E":
        KORT[_k] = ("Skrivbordsstol med nätrygg, %s" % FARG[_k],
                    "55 cm bred och väger 8,5 kg", E_RADER)
    else:
        KORT[_k] = ("Sminkstol i teddytyg, %s" % FARG[_k],
                    "Låg rygg på 37 cm — går in under bordet", F_RADER)

# Radien följer överskottet, ~0,5 px per 15 kB. Fylls i när bygget mätt korten.
MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
