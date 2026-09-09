# -*- coding: utf-8 -*-
"""Runda 107 — förbehandlar hjältebilderna till kortpanelens 1,83.

☠️ Ett KVADRATISKT foto i en 1,83-panel med `object-fit: contain` krymper till
   ~55 % av panelens bredd. Stallen är LÅNGA och LÅGA — de fyller alltså panelen
   bra om luften ovanför och under beskärs bort, men inte varan. Runda 93:s regel
   gäller: fyll ut med vitt i sidled, kapa aldrig varan.

⚠️ Galvat nät i studioljus är den högfrekventaste ytan huset stött på, och hela
   den här familjen är nät. Runda 106 fick sänka fyllnaden på alla sex kort.
   Talen här är MÄTTA mot 215 kB-taket, inte gissade — se `kort.py`:s utskrift.
"""
import os
from PIL import Image

RATIO = 1.83
FYLL = 0.90
# ☠️ MÄTT med `sok-fyllnad.py`, inte gissat: den största fyllnad som ryms under
#    215 kB vid q >= 85. Vid 0,90 sprängde ALLA SJU taket, med +9 000 till
#    +113 000 byte. Nät i studioljus komprimeras inte.
# ⚠️ Modell S (525e6acf/079f2901) är HÖGRE än panelen, så fyllnaden biter först
#    under 0,80 — talen 0,90 och 0,80 gav identisk filstorlek.
FYLL_UNDANTAG = {
    "a75fcfde": 0.70, "c0770388": 0.70, "079f2901": 0.70,
    "2435c4d1": 0.60,
    "2253c509": 0.50, "dcdf889d": 0.50, "525e6acf": 0.50,
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
    for k in ["a75fcfde", "c0770388", "2253c509", "2435c4d1",
              "dcdf889d", "525e6acf", "079f2901"]:
        s, storlek, andel = panel(k)
        print("%-10s %-12s fyllnad %.0f %%" % (k, "%d×%d" % storlek, andel * 100))
