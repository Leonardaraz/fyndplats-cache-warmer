# -*- coding: utf-8 -*-
"""Runda 96 — fyra spec-kort.

☠️ KALLBILDEN AR INTE ALLTID `raw/<id>-1.jpg`. Tva av fyra behovde en annan:

   · `2bfaf6dd` har INGEN ren render — dess bild 1 ar en miljobild MED tysk
     banderoll. Kortet byggs pa RITNINGEN (bild 2), som ar ren, har vit botten
     och visar just tva taknivaer.
   · `22dbd372`:s kort byggs pa linjeritningen (bild 1) av samma skal.

☠️ Vardena haerleds ur spec-tabellen i texter.py via radindex. Kortet skriver
   aldrig om ett tal.

☠️ OCH DET VAR MILJOFOTONA SOM SPRANGDE 215 kB-TAKET: 396 kB och 300 kB vid
   q=85, samma sak som runda 63:s vavda korgar — gras och lovverk ar hogfrekvent
   och komprimerar inte. Bygget sager "mjuka upp FOTOT", och det gick: 4,0 px
   gaussisk oskarpa tog dem till 237 och 223 kB. Men da var de grotiga, och ett
   suddigt foto i VART EGET kort ar ett samre kort an ett skarpt.
   BATTRE VAG: byt kallbild. Ritningarna ar rena, har vit botten, komprimerar
   till en tredjedel — och bar rubriken lika bra. Noll mjukning behovs.
"""
import json
import sys

sys.path.insert(0, "/home/user/fyndplats-cache-warmer/tools/polish-assets")
import kortbygge                                                  # noqa: E402
import texter as T                                                # noqa: E402


def specrader(pid):
    return ["%s: %s" % (k, v) for k, v in T.spec(pid)]


RADER_A = [("Stora duken", 0), ("Lilla taket", 1), ("Öppning i stora taket", 2),
           ("Snedställd kant", 3), ("Kanthöjd", 4), ("Ingår", 12)]

KORTDATA = {
    "3f9fda98": ("Reservduk", "Dubbeltak till 3 × 3 m", RADER_A),
    "2bfaf6dd": ("Reservduk", "Dubbeltak till 3 × 3 m", RADER_A),
    "9a3600f8": ("Pergolamarkis", "Veckad duk, 286 cm",
                 [("Passar", 0), ("Dukens längd", 1), ("Utförande", 2),
                  ("Dränering", 3), ("Solskydd", 4), ("Ingår", 10)]),
    "22dbd372": ("Pergolatak", "Fast tak, 298 × 293 cm",
                 [("Mått", 0), ("Passar", 1), ("Dränering", 2),
                  ("Material", 3), ("Infästning", 4), ("Ingår", 8)]),
}

if __name__ == "__main__":
    produkter = [{"kort": p, "spec": specrader(p)} for p in T.PRODUKTER]
    namn, facit = kortbygge.bygg(".", produkter, KORTDATA)
    json.dump(facit, open("kort-facit.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\n".join(namn))
