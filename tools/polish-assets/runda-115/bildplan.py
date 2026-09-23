# -*- coding: utf-8 -*-
"""Runda 115 Steg 9 — galleriordning per produkt.

☠️ MÅTTRITNINGEN SIST. Runda 104 lade den på plats 3 på alla sju sidor; den
   hör sist, efter livsstil och detaljer.
☠️ VÅRT EGET KORT PÅ PLATS 3, efter hjälte och livsstil.

Ingen bild tas bort den här rundan — Steg 4 mätte noll tyska ord och noll
främmande text i 35 bilder. Måttritningen (position 3 i leverantörens ordning)
flyttas dock sist på alla sju.
"""
# Leverantörens ordning: 1 hjälte · 2 livsstil · 3 MÅTTRITNING · 4–5 detalj
# None = vårt eget Fyndplats-kort skjuts in där.
GALLERI = {
    "cc6b56f9": [1, 2, None, 4, 5, 3],
    "fb142c5c": [1, 2, None, 4, 5, 3],
    "738ca991": [1, 2, None, 4, 5, 3],
    "0c05c1a0": [1, 2, None, 4, 5, 3],
    "23ba27a5": [1, 2, None, 4, 5, 3],
    "39d85f18": [1, 2, None, 4, 5, 3],
    "389ac5ac": [1, 2, None, 4, 5, 3],
}
BORTTAGNA = {}      # ✅ noll — Steg 4 hittade ingen text i pixlarna
BESKARNING = {}     # ✅ noll — inget behöver kapas


def kontroll():
    for k, g in GALLERI.items():
        if g.count(None) != 1:
            raise SystemExit(f"☠️ {k}: vårt kort ska ligga EXAKT en gång")
        if g.index(None) != 2:
            raise SystemExit(f"☠️ {k}: kortet ska ligga på plats 3")
        if g[-1] != 3:
            raise SystemExit(f"☠️ {k}: måttritningen ska ligga SIST, inte på "
                             f"plats {g.index(3) + 1}")
        if sorted(x for x in g if x) != [1, 2, 3, 4, 5]:
            raise SystemExit(f"☠️ {k}: alla fem leverantörsbilder ska vara med")
    print(f"bildplan.kontroll: {len(GALLERI)} produkter, "
          f"kort på plats 3, måttritning sist, noll borttagna")


if __name__ == "__main__":
    kontroll()
