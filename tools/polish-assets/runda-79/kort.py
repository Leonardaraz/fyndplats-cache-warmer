# -*- coding: utf-8 -*-
"""Runda 79 — Fyndplats eget faktakort, ett per produkt.

⚠️ RADERNA SLÅS UPP PÅ ETIKETT, aldrig på position. De åtta pallarna har åtta
   olika spec-listor: bara fyra har ryggstödsmått, bara tre har fotring, en är
   ett tvåpack med en egen "Antal"-rad, och två saknar rygg helt. Ett fast
   index hade pekat på fel rad — samma tanke som att SKU:n matchas på
   wixVariantId och aldrig på position.

☠️ KORTET FÅR BARA BÄRA TAL SOM STÅR I SPECEN. Det byggs ur `p["spec"]`, som
   linten redan har grindat, så ett påhittat tal kan inte ta sig in.

⚠️ Underrubriken bär EN siffra ur specen, vald för att skilja pallen från de
   sju andra. På färgparet 983fe163/98c1b3cb är siffran identisk med flit —
   det är färgen som skiljer dem, och kortet ska inte låtsas något annat.

⚠️ `1d0ba82d` får sin maxlast i underrubriken. Den är seriens enda på 110 kg
   och det är precis den skillnad en kund riskerar att läsa förbi.
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
    "983fe163": ("Rullpall med oval rygg, vit", "Sitthöjd 48–64 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Fotring", "Maxlast"]),
    "98c1b3cb": ("Rullpall med oval rygg, svart", "Sitthöjd 48–64 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Fotring", "Maxlast"]),
    "711f7859": ("Salongspall med kupad rygg", "Sitthöjd 53–73 cm",
                 ["Mått", "Sits", "Sitthöjd", "Skummets tjocklek",
                  "Ryggstöd", "Maxlast"]),
    "93b7d87b": ("Salongspall med hög rygg", "Ryggstöd 38 × 28 cm",
                 ["Mått", "Sits", "Sitthöjd", "Sittdynans tjocklek",
                  "Ryggstöd", "Maxlast"]),
    "c328a7c0": ("Rullpallar 2-pack med låg rygg", "Sitthöjd 47–62 cm",
                 ["Antal", "Mått per pall", "Sits", "Sitthöjd",
                  "Ryggstöd", "Maxlast"]),
    "12ce97db": ("Sadelpall med svart fot", "Sitthöjd 45–59 cm",
                 ["Mått", "Sits", "Sitthöjd", "Ryggstöd", "Fot", "Maxlast"]),
    "20782c24": ("Sadelpall på hjul, rosa", "Sitthöjd 49–61 cm",
                 ["Mått", "Sits", "Sitthöjd", "Stoppningens tjocklek",
                  "Ryggstöd", "Maxlast"]),
    "1d0ba82d": ("Salongspall med fotring, vit", "Bär 110 kg",
                 ["Mått", "Sits", "Sitthöjd", "Stoppningens tjocklek",
                  "Fotring", "Maxlast"]),
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
