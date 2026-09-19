# -*- coding: utf-8 -*-
"""Förbehandlar hjältebilderna till kortpanelens 1,83 (samma krok som runda 104/105).

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
#    Runda 106 behövde inget undantag — mät ändå varje kort mot taket, det är
#    galvat nät i studioljus och nät är högfrekvent.
# ☠️ HELA FAMILJEN ÄR ETT UNDANTAG, och det är mätt. Galvat nät i studioljus är
#    den högfrekventaste ytan huset stött på: vid husets normala 0,90 sprängde
#    ALLA SEX kort taket, med +21 000 till +95 000 byte. Talen nedan är den
#    STÖRSTA fyllnad som ryms under 215 kB vid q >= 85, hittad genom att mäta
#    varje kort — inte genom att gissa en gemensam siffra.
#
#    ⚠️ Oskärpa är fel lever här. Runda 104 mätte r=1,3 till 243k -> 222k, alltså
#    ~9 %; det som behövdes var upp till 31 %. Att rita varan mindre tar bort
#    nätrutorna helt i stället för att sudda dem.
FYLL_UNDANTAG = {
    "a4c0595f": 0.60, "7eebd0eb": 0.80, "b54e7a23": 0.66,
    "1f7ebf33": 0.60, "edc81021": 0.55, "117691b5": 0.55,
}
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
    for k in ["a4c0595f", "7eebd0eb", "b54e7a23", "1f7ebf33",
              "edc81021", "117691b5"]:
        s, storlek, andel = panel(k)
        print("%-10s %-12s fyllnad %.0f %%" % (k, "%d×%d" % storlek, andel * 100))
