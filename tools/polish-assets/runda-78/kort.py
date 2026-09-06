# -*- coding: utf-8 -*-
"""Runda 78 — Fyndplats eget faktakort, ett per produkt.

⚠️ RADERNA SLÅS UPP PÅ ETIKETT, aldrig på position. De åtta pallarna har
   åtta olika spec-listor: bara tre har ryggstödsmått, bara en har fotring,
   bara en har vikt och bara en har fack- och lådmått. Ett fast index hade
   pekat på fel rad — samma tanke som att SKU:n matchas på wixVariantId.

☠️ KORTET FÅR BARA BÄRA TAL SOM STÅR I SPECEN. Det byggs ur `p["spec"]`,
   som linten redan har grindat, så ett påhittat tal kan inte ta sig in.

⚠️ Underrubriken bär EN siffra ur specen, vald för att skilja pallen från de
   sju andra. På färgparet är den siffran identisk med flit — det är färgen
   som skiljer dem, och kortet ska inte låtsas något annat.
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
    "5646a8ff": ("Verkstadspall med lådor", "Fast sitthöjd 35 cm",
                 ["Mått", "Sits", "Verktygsfack", "Låda", "Hjul", "Maxlast"]),
    "f18dfc3b": ("Pendelpall med vippande sits", "Vippar upp till 5°",
                 ["Mått", "Sits", "Stoppningens tjocklek", "Fotens diameter",
                  "Vippfunktion", "Maxlast"]),
    "239e68b8": ("Salongspall utan rygg", "9 cm formgjutet skum",
                 ["Mått", "Sits", "Skummets tjocklek", "Sitthöjd",
                  "Vridning", "Maxlast"]),
    "15ff0d64": ("Arbetspall med rygg och fotring", "Sitthöjd 49–65 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Fotring", "Maxlast"]),
    "d348bf64": ("Rullpall med rygg, svart", "Sitthöjd 43–55 cm",
                 ["Total höjd", "Sitsens diameter", "Sitthöjd", "Ryggstöd",
                  "Vridning", "Maxlast"]),
    "fa078e03": ("Rullpall med rygg, beige", "Sitthöjd 43–55 cm",
                 ["Total höjd", "Sitsens diameter", "Sitthöjd", "Ryggstöd",
                  "Fotens diameter", "Maxlast"]),
    "87de04ad": ("Rullpall med ringrygg", "Bred fot 50 × 54 cm",
                 ["Mått", "Sitthöjd", "Ryggstöd", "Stativ", "Vikt", "Maxlast"]),
    "28532aab": ("Rullpallar 2-pack", "Sitthöjd 48–63 cm",
                 ["Antal", "Mått per pall", "Sitsens diameter", "Sitthöjd",
                  "Klädsel", "Maxlast"]),
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
