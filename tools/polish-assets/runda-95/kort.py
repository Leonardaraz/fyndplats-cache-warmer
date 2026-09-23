# -*- coding: utf-8 -*-
"""Runda 95 — fyra spec-kort, ett per dubbeltak.

Hjaltebilden ar bild 1 i bada grupperna: en ren render pa vit botten som visar
TVA takniváer — den stora duken och det lilla taket hojt over den. Rubriken
namnger darfor just det, plus stommens storlek, som ar det kunden matar.

☠️ Vardena haerleds ur spec-tabellen i texter.py via radindex. Kortet skriver
   aldrig om ett tal; det pekar pa en rad och tar det som star efter kolonet.
   Och de tva 3 x 3-taken har OLIKA rader — b6ebc5ba bar 88 x 88 cm och en
   snedstalld kant, 271327e1 bar 86 x 86 cm och en oppning. Radindexen ar
   darfor per PRODUKT, inte per grupp.
"""
import json
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import kortbygge                                                  # noqa: E402
import texter as T                                                # noqa: E402


def specrader(pid):
    return ["%s: %s" % (k, v) for k, v in T.spec(pid)]


KORTDATA = {
    "b6ebc5ba": ("Reservduk", "Dubbeltak till 3 × 3 m",
                 [("Lilla taket", 1), ("Snedställd kant", 2), ("Kanthöjd", 3),
                  ("Material", 4), ("Infästning", 5), ("Ingår", 9)]),
    "271327e1": ("Reservduk", "Dubbeltak till 3 × 3 m",
                 [("Stora duken", 0), ("Lilla taket", 1),
                  ("Öppning i stora taket", 2), ("Kanthöjd", 3),
                  ("Infästning", 6), ("Ingår", 10)]),
    "ef0a812d": ("Reservduk", "Dubbeltak till 3 × 4 m",
                 [("Passar", 0), ("Lilla taket", 1), ("Kanthöjd", 2),
                  ("Material", 3), ("Vikt", 5), ("Ingår", 7)]),
    "dc7d2513": ("Reservduk", "Dubbeltak till 3 × 4 m",
                 [("Passar", 0), ("Lilla taket", 1), ("Kanthöjd", 2),
                  ("Material", 3), ("Vikt", 5), ("Ingår", 7)]),
}

if __name__ == "__main__":
    produkter = [{"kort": p, "spec": specrader(p)} for p in T.PRODUKTER]
    namn, facit = kortbygge.bygg(".", produkter, KORTDATA)
    json.dump(facit, open("kort-facit.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\n".join(namn))
