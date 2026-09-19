# -*- coding: utf-8 -*-
"""Runda 82 — Fyndplats eget faktakort, ett per produkt.

⚠️ RADERNA SLÅS UPP PÅ ETIKETT, aldrig på position. Rundans spec-listor är
   olika långa och olika uppbyggda: de tre solsängarna har ingen `Antal:`-rad
   alls, `2a16c507` saknar dessutom liggläges-raden MED FLIT, och bara
   flerpacken har `Antal:`. Ett fast index hade pekat på fel rad — och på
   `2a16c507` hade det pekat på raden efter den utelämnade.

☠️ KORTETS UNDERRUBRIK BÄR DET KUNDEN INTE SER PÅ BILDEN. På solsängarna är
   det skillnaden mellan modellen MED dyna och de två bara — och på
   `2a16c507` är det att liggmåttet medvetet saknas, sagt rakt ut i stället
   för att bara utebli.

☠️ KORTET FÅR BARA BÄRA TAL SOM STÅR I SPECEN. Det byggs ur `p["spec"]`, så
   ett påhittat tal kan inte ta sig in — och det utelämnade liggmåttet kan
   inte smyga in via kortet heller, eftersom raden inte finns att slå upp.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER                                          # noqa: E402

KORTPLAN = {
    "d6a11ae3": ("Solsäng med dyna", "Sittdyna och huvudkudde ingår",
                 ["Mått sittläge", "Mått liggläge", "Hopfälld", "Liggyta",
                  "Sitthöjd", "Maxlast"]),
    "f5d857b6": ("Solsäng i textilen, grå", "180 cm i liggläget",
                 ["Mått sittläge", "Mått liggläge", "Hopfälld", "Liggyta",
                  "Sitthöjd", "Maxlast"]),
    # ☠️ Ingen `Mått liggläge`-rad — källan motsäger sig själv om den, och
    #    raden finns därför inte att slå upp. Att göra AVSAKNADEN till kortets
    #    rubrik vore fel: ett faktakort i galleriet ska bära det produkten ÄR.
    #    Förklaringen står som sidans FÖRSTA vanliga fråga, där den som söker
    #    liggmåttet faktiskt letar.
    "2a16c507": ("Solsäng i textilen, svart", "Sitthöjd 33 cm",
                 ["Mått sittläge", "Hopfälld", "Liggyta", "Sitthöjd",
                  "Vikt", "Maxlast"]),
    "9ed7ad7a": ("Solstolar med nackstöd, grå", "Två stolar i paketet",
                 ["Antal", "Mått utfälld", "Hopfälld", "Sits",
                  "Ryggstödets lägen", "Maxlast"]),
    "85ffb47b": ("Solstolar med nackstöd, svart", "Två stolar i paketet",
                 ["Antal", "Mått utfälld", "Hopfälld", "Sits",
                  "Ryggstödets lägen", "Maxlast"]),
    "1628620b": ("Fällstolar i linnelookat tyg", "Fyra stolar i paketet",
                 ["Antal", "Mått", "Hopfälld", "Sits", "Sitthöjd", "Maxlast"]),
    "4ca8a6c0": ("Fällstolar i konstläder", "Fyra stolar i paketet",
                 ["Antal", "Mått", "Hopfälld", "Sits", "Sitthöjd", "Maxlast"]),
}


def index_for(spec, etikett):
    """Radens plats i spec-listan, uppslagen på etikett — aldrig gissad."""
    for i, rad in enumerate(spec):
        if rad.split(":")[0].split("(")[0].strip() == etikett:
            return i
    raise SystemExit("saknar spec-raden %r i %s" % (etikett, spec))


KORT = {}
for _p in PRODUKTER:
    _k = _p["kort"]
    _rub, _und, _etiketter = KORTPLAN[_k]
    KORT[_k] = (_rub, _und,
                [(e, index_for(_p["spec"], e)) for e in _etiketter])

# ☠️ FOTOT MJUKAS UPP, ALDRIG KORTET — husets regel sedan runda 63. Fylls i
#    först när ett kort faktiskt spränger 215 kB-taket, inte i förväg.
MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-26s %7d byte" % (n, os.path.getsize(os.path.join(HAR, "jpg/%s.jpg" % n))))
