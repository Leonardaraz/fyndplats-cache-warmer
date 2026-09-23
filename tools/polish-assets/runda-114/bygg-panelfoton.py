# -*- coding: utf-8 -*-
"""Runda 114 — förbehandlar de nio hjältebilderna till kortpanelens 1,83.

Metoden är husets: rita vid varans GEOMETRISKA maxstorlek och klara byte-taket
med OSKÄRPA, inte med krympning. Radien MÄTS med `sok-oskarpa.py` och ärvs
aldrig — en vit plåtdörr, en khakifärgad plastbox och ett svart glasskåp
komprimerar inte alls lika.
"""
import os

from PIL import Image, ImageDraw, ImageFilter

RATIO = 1.83
FYLL = 1.0
# ☠️ MÄTT av `sok-oskarpa.py`, inte gissat. Åtta av nio klarar taket vid r=0;
#    `b815de72` ligger 47 598 byte över och behöver 1,5. Det är den enda
#    hjältebilden med GROV plastyta över hela ytan — och den var inte den man
#    hade gissat på, för den är varken störst eller mörkast.
MJUKA = {"b815de72": 1.5}
HAR = os.path.dirname(os.path.abspath(__file__))


def bbox(im, tolerans=246):
    g = im.convert("L").point(lambda v: 0 if v > tolerans else 255)
    b = g.getbbox()
    if not b:
        raise SystemExit("hittar ingen produkt i bilden")
    return b


def vitgor_bakgrund(im, troskel=14):
    """Fyller sammanhängande nästan-vit bakgrund till ren vit, från HÖRNEN.

    ⚠️ Ett rakt "lyft allt över 244 till vitt" hade platt ut vita och
       crèmevita produkters egna högdagrar — fem av rundans nio är vita,
       crèmevita eller khakifärgade mot vit botten.
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
