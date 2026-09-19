# -*- coding: utf-8 -*-
"""Runda 77 — Fyndplats eget faktakort, ett per produkt.

⚠️ RADERNA VÄLJS PER PRODUKT, INTE PER GRUPP. De fem ritstolarna har olika
   spec-listor: bara tre av dem har ett ryggstödsmått, bara fyra har fotring
   med tal, och `d739872f`:s ryggstöd är medvetet utelämnat. Ett fast index
   som i runda 76 hade därför pekat på fel rad.

   Raderna slås därför upp på ETIKETT och inte på position — samma tanke som
   att SKU:n matchas på wixVariantId och aldrig på ordning.

☠️ KORTET FÅR BARA BÄRA TAL SOM STÅR I SPECEN. Det byggs ur `p["spec"]`,
   som linten redan har grindat, så ett påhittat tal kan inte ta sig in.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER                                          # noqa: E402

# (rubrik, underrubrik, etiketterna som ska stå på kortet)
KORTPLAN = {
    "d739872f": ("Ritstol med uppfällbara armstöd", "Sitthöjd 53–78 cm",
                 ["Mått", "Sits", "Sitthöjd", "Armstöd", "Fotring", "Maxlast"]),
    "795c5ee2": ("Ritstol utan armstöd", "Sitthöjd 50–70 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Fotring", "Maxlast"]),
    "3033003c": ("Ritstol med svankstöd", "53 cm bred sits",
                 ["Mått", "Sits", "Sitthöjd", "Svankstöd", "Armstöd", "Maxlast"]),
    "83fd57c9": ("Ritstol 95–115 cm med armstöd", "Sitthöjd 52–72 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Armstöd", "Maxlast"]),
    "f1f861ea": ("Ritstol för höga arbetsbänkar", "Sitthöjd upp till 87 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Fotring", "Maxlast"]),
    "df0d351f": ("Skrivbordsstol med hjärtformad rygg, vit", "45 cm bred, utan armstöd",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Klädsel", "Maxlast"]),
    "cc0ec7ba": ("Skrivbordsstol med hjärtformad rygg, rosa", "45 cm bred, utan armstöd",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Klädsel", "Maxlast"]),
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

# Radien följer överskottet, ~0,5 px per 15 kB. Fylls i när bygget mätt korten.
MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-22s %7d byte" % (n, os.path.getsize(os.path.join(HAR, "jpg/%s.jpg" % n))))
