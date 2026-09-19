# -*- coding: utf-8 -*-
"""Runda 81 — Fyndplats eget faktakort, ett per produkt.

⚠️ RADERNA SLÅS UPP PÅ ETIKETT, aldrig på position. De åtta stolarnas
   spec-listor är olika långa: dubbelstolen har ingen `Antal:`-rad utan en
   `Antal sitsar:`, tvåpacken har ingen `Antal sitsar:` alls, och bara två
   av åtta har en `Nackstöd`-rad. Ett fast index hade pekat på fel rad.

☠️ KORTETS FÖRSTA RAD ÄR ANTALET, på alla åtta. Det är rundans hela poäng:
   den som bara tittar på bilden ser inte skillnaden mellan ett tvåpack och
   en dubbelstol, och kortet är det enda i galleriet som är VÅRT. Raden är
   `Antal: 2 stolar` eller `Antal sitsar: 2 i samma stol` — och den kommer
   ur specen, som linten redan har grindat.

☠️ KORTET FÅR BARA BÄRA TAL SOM STÅR I SPECEN. Det byggs ur `p["spec"]`, så
   ett påhittat tal kan inte ta sig in.
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
    "6307893c": ("Campingstolar med fotstöd, grå", "Två stolar i paketet",
                 ["Antal", "Mått utfälld", "Hopfälld", "Sits", "Sitthöjd", "Maxlast"]),
    "46d2c85a": ("Campingstolar med nackstöd", "Två stolar i paketet",
                 ["Antal", "Mått utfälld", "Hopfälld", "Sits", "Nackstöd", "Maxlast"]),
    "4401be4f": ("Dubbel campingstol, blå", "EN stol med två sitsar",
                 ["Antal sitsar", "Mått utfälld", "Hopfälld", "Sitthöjd",
                  "Vikt", "Maxlast"]),
    "8b66533f": ("Dubbel campingstol, khaki", "EN stol med två sitsar",
                 ["Antal sitsar", "Mått utfälld", "Hopfälld", "Sitthöjd",
                  "Vikt", "Maxlast"]),
    "65c84a9b": ("Dubbel campingstol, grön", "EN stol med två sitsar",
                 ["Antal sitsar", "Mått utfälld", "Hopfälld", "Sitthöjd",
                  "Vikt", "Maxlast"]),
    "bdb600fe": ("Fällstolar i textilen", "Sitthöjd 37 cm",
                 ["Antal", "Mått utfälld", "Hopfälld", "Sits", "Sitthöjd", "Maxlast"]),
    "cce86277": ("Trädgårdsstolar med hög rygg", "Sitthöjd 44 cm",
                 ["Antal", "Mått utfälld", "Hopfälld", "Sitthöjd",
                  "Ryggstöd", "Maxlast"]),
    "e39db7dd": ("Trädgårdsstolar i akacia", "Bär 160 kg per stol",
                 ["Antal", "Mått utfälld", "Hopfälld", "Sitthöjd",
                  "Material", "Maxlast"]),
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

# ☠️ FOTOT MJUKAS UPP, ALDRIG KORTET. `e39db7dd` är flätad konstrotting —
#    högfrekvent textur i varenda pixel, och det är precis vad JPEG inte
#    komprimerar. Kortet låg 3 437 byte över taket vid q=85. Samma sak som
#    runda 63:s vävda korgar. Talet är den minsta oskärpa som räcker.
MJUKA = {"e39db7dd": 0.6}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-24s %7d byte" % (n, os.path.getsize(os.path.join(HAR, "jpg/%s.jpg" % n))))
