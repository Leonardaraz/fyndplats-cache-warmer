# -*- coding: utf-8 -*-
"""Runda 110 — förbehandlar de sex hjältebilderna till panelens 1,83.

Metoden är runda 108/109:s, uppmätt där: rita vid varans GEOMETRISKA
maxstorlek och klara byte-taket med OSKÄRPA, inte med krympning. Det är
vävens mönster som kostar byte, inte varans storlek.

☠️ RADIEN ÄRVS INTE. Rundan har TRE olika vävar — plastband, spjälvävd bambu
och bred korgflätad bambu — och de komprimerar olika. Talen nedan är mätta med
`sok-oskarpa.py` per kort.

☠️ Runda 93:s regel gäller: fyll ut med vitt i sidled, kapa ALDRIG varan.
Bågen på grupp A:s ovankant är produktens signatur och det första en
beskärning hade tagit.
"""
import os
from PIL import Image, ImageFilter

RATIO = 1.83
FYLL = 1.0
FYLL_UNDANTAG = {}
# ☠️ MÄTT med `sok-oskarpa.py` vid varans MAXSTORLEK, inte gissat och inte
#    ärvt. Tre vävar gav tre svar — och det är precis vad som väntas när det
#    är mönstret och inte modellen som kostar byte:
#
#      r=0  309076e2 205 903  ← enda kortet som klarar taket utan oskärpa
#           a999f2b1 230 801   f8fd1b62 235 600   d72bde5e 255 661
#           c35f9d4f 294 380   316f9945 337 876
#      r=1  a999f2b1 212 370   f8fd1b62 213 886   ← båda under
#           c35f9d4f 255 502   d72bde5e 223 398   316f9945 271 565
#      r=2  c35f9d4f 210 945   d72bde5e 186 761   316f9945 213 830
#
#    ⚠️ `316f9945` ligger 1 170 byte under taket vid r=2. Det är UNDER, och
#    det är just därför radien mäts per kort i stället för att avrundas uppåt
#    för hela rundan: "nästan" är över taket, och "med marginal" är slöseri
#    med skärpa.
MJUKA = {"a999f2b1": 1.0, "c35f9d4f": 2.0, "d72bde5e": 2.0,
         "316f9945": 2.0, "f8fd1b62": 1.0}
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
    if hojd < vara.height:
        hojd = vara.height + 2
        bredd = int(hojd * RATIO)
    # ☠️ Oskärpan läggs på VARAN, inte på den färdiga panelen. Läggs den efter
    #    inklistringen suddas kanten mot det vita fältet till en grå gloria.
    r = MJUKA.get(kort, 0.0)
    if r:
        vara = vara.filter(ImageFilter.GaussianBlur(r))
    ut = Image.new("RGB", (bredd, hojd), "white")
    ut.paste(vara, ((bredd - vara.width) // 2, (hojd - vara.height) // 2))
    sokvag = os.path.join(HAR, "panelfoton", "%s.jpg" % kort)
    os.makedirs(os.path.dirname(sokvag), exist_ok=True)
    ut.save(sokvag, "JPEG", quality=94)
    return sokvag, ut.size, vara.width / bredd


if __name__ == "__main__":
    import sys
    sys.path.insert(0, HAR)
    import matt
    for k in matt.RUNDAN:
        s, storlek, andel = panel(k)
        print("%-10s %-12s fyllnad %.0f %%" % (k, "%d\u00d7%d" % storlek, andel * 100))
