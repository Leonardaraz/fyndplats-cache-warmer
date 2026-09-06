# -*- coding: utf-8 -*-
"""Runda 80 — Fyndplats eget faktakort, ett per produkt.

⚠️ RADERNA SLÅS UPP PÅ ETIKETT, aldrig på position. De åtta stolarna har åtta
   olika spec-listor: reclinern har TVÅ måttrader (upprätt och tillbakalutad)
   och en egen fotpallsrad, hjärtstolen mäter ryggen över sitsen i stället för
   som B × H, och bara två av åtta har en `Vikt`-rad. Ett fast index hade
   pekat på fel rad.

☠️ KORTET FÅR BARA BÄRA TAL SOM STÅR I SPECEN. Det byggs ur `p["spec"]`, som
   linten redan har grindat, så ett påhittat tal kan inte ta sig in.

⚠️ Underrubriken bär EN uppgift ur specen, vald för att skilja stolen från de
   sju andra. På trion b9ab45db/0fe80797/57ae1ddf är den identisk med flit —
   det är kulören som skiljer dem, och kortet ska inte låtsas något annat.

☠️ `Fot`-raden är med på sex av åtta kort, och det är rundans egen poäng: fyra
   av stolarna har INGA hjul trots att de ser ut som kontorsstolar. Den som
   läser kortet i stället för brödtexten ska ändå få veta det.
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
    "b9ab45db": ("Snurrfåtölj med fast fot, ljusgrå", "Sitthöjd 45–57 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Fot", "Maxlast"]),
    "0fe80797": ("Snurrfåtölj med fast fot, mörkgrå", "Sitthöjd 45–57 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Fot", "Maxlast"]),
    "57ae1ddf": ("Snurrfåtölj med fast fot, svart", "Sitthöjd 45–57 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Fot", "Maxlast"]),
    "558eb67a": ("Reclinerfåtölj med fotpall", "Ryggen fälls till 130°",
                 ["Mått upprätt", "Mått tillbakalutad", "Fotpall",
                  "Sits", "Ryggens lutning", "Maxlast"]),
    "7046314f": ("Skrivbordsstol med hel hjärtrygg", "Sitthöjd 43–53 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstödets höjd över sitsen",
                  "Fot", "Maxlast"]),
    "2cae1147": ("Kontorsstol i bouclé, gräddvit", "Vippfunktion",
                 ["Mått", "Sits", "Sitthöjd", "Sitsens och ryggens tjocklek",
                  "Vippfunktion", "Maxlast"]),
    "5302daf2": ("Kontorsstol big and tall", "56 cm bred sits",
                 ["Mått", "Sits", "Sitthöjd", "Sitsens tjocklek",
                  "Ryggstöd", "Maxlast"]),
    "bd554433": ("Kontorsstol med dubbel stoppning", "Sitthöjd 50–60 cm",
                 ["Mått", "Sits", "Sitthöjd", "Sitsens tjocklek",
                  "Ryggstöd", "Maxlast"]),
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

MJUKA = {}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-24s %7d byte" % (n, os.path.getsize(os.path.join(HAR, "jpg/%s.jpg" % n))))
