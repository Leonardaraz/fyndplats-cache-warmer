# -*- coding: utf-8 -*-
"""Förbehandlar hjältebilderna till kortpanelens 1,83 (samma krok som runda 104).

☠️ Ett KVADRATISKT foto i en 1,83-panel med `object-fit: contain` krymper till
   ~55 % av panelens bredd. Sköldpaddshusen är LÅGA och BREDA — de fyller alltså
   panelen bra om man beskär bort den tomma luften ovanför och under, men inte
   varan. Runda 93:s regel gäller: fyll ut med vitt i sidled, kapa aldrig varan.
"""
import os
from PIL import Image

RATIO = 1.83
FYLL = 0.90          # produktens bredd som andel av panelbredden

# ☠️ Per-produkt-undantag, MÄTT och inte gissat. Byte-budgeten styrs av hur STORT
#    varan ritas, inte av skärpan (runda 104: oskärpa r=1,3 gav bara 243k -> 222k).
#    Obehandlad furu är rå träfiber i skarpt studioljus — den högfrekventaste ytan
#    i familjen. Vid 0,90 landade kortet på 255 313 byte, 40 313 över taket.
FYLL_UNDANTAG = {"d4787641": 0.68}
HAR = os.path.dirname(os.path.abspath(__file__))


def bbox(im, tolerans=246):
    """Produktens låda: allt som inte är nära-vit botten."""
    g = im.convert("L").point(lambda v: 0 if v > tolerans else 255)
    b = g.getbbox()
    if not b:
        raise SystemExit("hittar ingen produkt i bilden")
    return b


def panel(kort, fyll=None):
    fyll = fyll or FYLL_UNDANTAG.get(kort, FYLL)
    im = Image.open(os.path.join(HAR, "rawbilder", "%s-1.jpg" % kort)).convert("RGB")
    x0, y0, x1, y1 = bbox(im)
    vara = im.crop((x0, y0, x1, y1))
    bredd = int(vara.width / fyll)
    hojd = int(bredd / RATIO)
    if hojd < vara.height:                      # varan är högre än panelen
        hojd = vara.height + 2                  # ...då styr HÖJDEN, aldrig beskär
        bredd = int(hojd * RATIO)
    ut = Image.new("RGB", (bredd, hojd), "white")
    ut.paste(vara, ((bredd - vara.width) // 2, (hojd - vara.height) // 2))
    sokvag = os.path.join(HAR, "panelfoton", "%s.jpg" % kort)
    os.makedirs(os.path.dirname(sokvag), exist_ok=True)
    ut.save(sokvag, "JPEG", quality=94)
    return sokvag, ut.size, vara.width / bredd


if __name__ == "__main__":
    for k in ["a0bb5be8", "4b089c02", "27aa4c23", "d4787641",
              "f55d9635", "1f9fe2c2", "1f6de209", "609bec0f"]:
        s, storlek, andel = panel(k)
        print("%-10s %-12s fyllnad %.0f %%" % (k, "%d×%d" % storlek, andel * 100))
