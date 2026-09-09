# -*- coding: utf-8 -*-
"""Runda 111 — förbehandlar de sju hjältebilderna till panelens 1,83.

Metoden är runda 108–110:s: rita vid varans GEOMETRISKA maxstorlek och klara
byte-taket med OSKÄRPA, inte med krympning.

☠️ RADIEN ÄRVS INTE. Rundan har SEX konstruktioner — trägaller med tyg, tryckt
duk, flätat pappersrep, flätad pappersfiber med hyllor, och två släta tygdukar
— och de komprimerar helt olika. En slät grå duk kostar nästan ingenting i
byte; en handflätad väv kostar mycket. Talen nedan mäts med `sok-oskarpa.py`.

☠️ Runda 93:s regel gäller: fyll ut med vitt i sidled, kapa ALDRIG varan.
23d20823:s bågformade toppar är produktens signatur och det första en
beskärning hade tagit.
"""
import os
from PIL import Image, ImageFilter

RATIO = 1.83
FYLL = 1.0
FYLL_UNDANTAG = {}
# ☠️ MÄTT med `sok-oskarpa.py`, inte gissat och inte ärvt. Fyra av sju kort
#    klarar taket helt utan oskärpa — en slät polyesterduk kostar nästan
#    ingenting i byte.
#
#      r=0,0  e858810e  f641d190  79b349f7  99040238   ← redan under taket
#      r=0,5  db70e38c
#      r=1,5  23d20823
#      r=5,0  1c1eb875   ← 212 344 byte
#
# ☠️ OCH PALMBLADSKORTET KRÄVDE EN EGEN MÄTNING (`sok-1c1eb875.py`). Det låg
#    kvar över taket vid r=4,0, alltså långt bortom vad någon väv har behövt i
#    tre rundor. Skälet är att trycket inte ÄR en väv: kostnaden ligger i stora
#    högkontrastytor med skarpa konturer, och en gaussisk oskärpa mjukar
#    konturen utan att ta bort ytan. Den behövde helt enkelt mer.
#
# ☠️ ⚠️ OCH DEN ANDRA SPAKEN ÄR INERT, inte sämre. Runda 108 avvisade
#    KRYMPNING med motiveringen att den "lämnar en liten vara i ett stort vitt
#    fält". Uppmätt här gör den ingenting alls: fyll 0,90, 0,85 och 0,80 gav
#    ALLA exakt 248 423 byte. Orsaken står i `panel()` nedan — för en STÅENDE
#    vara går grenen `if hojd < vara.height` in och skriver över den bredd
#    fyllnadsgraden just räknat fram. Parametern finns, den tas emot, och den
#    påverkar ingenting. Mät innan du väljer spak.
MJUKA = {"1c1eb875": 5.0, "23d20823": 1.5, "db70e38c": 0.5}
HAR = os.path.dirname(os.path.abspath(__file__))


def bbox(im, tolerans=246):
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
    duk = Image.new("RGB", (bredd, hojd), "white")
    duk.paste(vara, ((bredd - vara.width) // 2, (hojd - vara.height) // 2))
    os.makedirs(os.path.join(HAR, "panelfoton"), exist_ok=True)
    ut = os.path.join(HAR, "panelfoton", "%s.jpg" % kort)
    r = MJUKA.get(kort, 0.0)
    if r:
        duk = duk.filter(ImageFilter.GaussianBlur(r))
    duk.save(ut, "JPEG", quality=94)
    return ut, bredd, hojd


if __name__ == "__main__":
    import matt
    for k in matt.RUNDAN:
        p, b, h = panel(k)
        print("%s  %d×%d  r=%.1f" % (k, b, h, MJUKA.get(k, 0.0)))
