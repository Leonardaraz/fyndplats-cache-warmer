# -*- coding: utf-8 -*-
"""Runda 113 — förbehandlar de åtta hjältebilderna till panelens 1,83.

Metoden är runda 108–112:s: rita vid varans GEOMETRISKA maxstorlek och klara
byte-taket med OSKÄRPA, inte med krympning. Radien MÄTS med `sok-oskarpa.py`
och ärvs aldrig — en vit plåtdörr och ett svart glasskåp med belysta flaskor
komprimerar inte alls lika.

☠️ ALLA ÅTTA HJÄLTAR STÅR PÅ VIT BOTTEN, så `bbox()` duger rakt av. Det är
   inte en självklarhet: runda 112 hade en produkt vars enda användbara bild
   var ett livsstilsfoto utan vit botten, och den behövde ett eget band.
"""
import os
from PIL import Image, ImageDraw, ImageFilter

RATIO = 1.83
FYLL = 1.0
# ☠️ MÄTT med `sok-oskarpa.py`, inte gissat. Fylls i av mätningen.
MJUKA = {}
HAR = os.path.dirname(os.path.abspath(__file__))


def bbox(im, tolerans=246):
    g = im.convert("L").point(lambda v: 0 if v > tolerans else 255)
    b = g.getbbox()
    if not b:
        raise SystemExit("hittar ingen produkt i bilden")
    return b


def vitgor_bakgrund(im, troskel=14):
    """☠️ `15d30e23`:s botten är 249-GRÅ, inte vit — och det syns.

    Panelen fylls ut med vit, kortet är vitt, och en 249-grå produktbild mot
    det blir en RUTA med hård kant mitt på kortet. Det ser ut som ett
    renderingsfel, och en kund läser det som ett fel även när bilden är hel.

    Fyllningen går från de fyra HÖRNEN och bara genom sammanhängande
    bakgrund. Ett rakt "lyft allt över 244 till vitt" hade platt ut vita
    dörrars egna högdagrar — fyra av rundans åtta produkter ÄR vita eller
    silverfärgade, så det är inte ett teoretiskt fall.
    """
    kopia = im.copy()
    for hörn in [(1, 1), (im.width - 2, 1), (1, im.height - 2),
                 (im.width - 2, im.height - 2)]:
        if min(kopia.getpixel(hörn)) >= 235:
            ImageDraw.floodfill(kopia, hörn, (255, 255, 255), thresh=troskel)
    return kopia


def panel(kort, fyll=FYLL):
    im = Image.open(os.path.join(HAR, "rawbilder", "%s-1.jpg" % kort)).convert("RGB")
    im = vitgor_bakgrund(im)
    x0, y0, x1, y1 = bbox(im)
    vara = im.crop((x0, y0, x1, y1))
    bredd = int(vara.width / fyll)
    hojd = int(bredd / RATIO)
    if hojd < vara.height:
        hojd = vara.height + 2
        bredd = int(hojd * RATIO)
    duk = Image.new("RGB", (bredd, hojd), "white")
    duk.paste(vara, ((bredd - vara.width) // 2, (hojd - vara.height) // 2))
    os.makedirs(os.path.join(HAR, "panelfoton"), exist_ok=True)
    ut = os.path.join(HAR, "panelfoton", "%s.jpg" % kort)
    r = MJUKA.get(kort, 0.0)
    if r:
        duk = duk.filter(ImageFilter.GaussianBlur(r))
    duk.save(ut, "JPEG", quality=94)
    return ut, duk.width, duk.height


if __name__ == "__main__":
    import matt
    for k in matt.WIX:
        p, b, h = panel(k)
        print("%s  %d×%d  %.2f  r=%.1f" % (k, b, h, b / h, MJUKA.get(k, 0.0)))
