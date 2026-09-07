# -*- coding: utf-8 -*-
"""Runda 94 — fyra spec-kort, ett per reservtak.

Hjaltebilden ar bild 1 i bada modellerna: en ren render pa vit botten. Rubriken
maste baras av DEN bilden — darfor namnger den takets FORM och storlek, det som
syns, inte tyget eller solskyddet, som inte gar att se pa ett foto.

☠️ Vardena haerleds ur spec-tabellen i texter.py via radindex. Kortet skriver
   aldrig om ett tal; det pekar pa en rad och tar det som star efter kolonet.
"""
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import kortbygge                                                  # noqa: E402
import texter as T                                                # noqa: E402


def specrader(pid):
    duk, topp = T.FARG[pid]
    spec = T.spec_c(duk, topp) if T.GRUPP[pid] == "C" else T.spec_b(duk)
    return ["%s: %s" % (k, v) for k, v in spec]


# (etikett, radindex i spec-tabellen ovan)
RADER_C = [("Stora duken", 0), ("Lilla taket", 1), ("Snedställd kant, stora taket", 3),
           ("Material", 6), ("Öljetter", 8), ("Ingår", 13)]
RADER_B = [("Mått", 0), ("Snedställd kant", 1), ("Material", 3),
           ("Solskydd", 4), ("Infästning", 6), ("Ingår", 10)]

KORTDATA = {
    "df5a7190": ("Reservduk", "Dubbeltak 300 × 300 cm", RADER_C),
    "60eaf40e": ("Reservduk", "Dubbeltak 300 × 300 cm", RADER_C),
    "d52c6d1d": ("Reservduk", "Enkelt tak 298 × 298 cm", RADER_B),
    "d01a6d2b": ("Reservduk", "Enkelt tak 298 × 298 cm", RADER_B),
}

if __name__ == "__main__":
    produkter = [{"kort": p, "spec": specrader(p)} for p in T.PRODUKTER]
    namn, facit = kortbygge.bygg(".", produkter, KORTDATA)
    import json
    json.dump(facit, open("kort-facit.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\n".join(namn))
