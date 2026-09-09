# -*- coding: utf-8 -*-
"""Runda 111 Steg 4 — zoomar de bilder som avgör FAKTA, inte intryck.

Kontaktarket räcker för färg och komposition. Det räcker INTE för:
  · text inbränd i pixlarna (99040238-4 bär två tyska bildtexter)
  · måttritningarnas siffror
  · hur hyllorna på db70e38c sitter fast
  · vad som sitter BAKOM gallret på shoji-skärmarna (tyg? papper?)
  · antalet hjul på 79b349f7

☠️ Runda 110:s dyraste lärdom om bilder: miljöbilderna lästes i 640 px och en
   BORDSDUK blev "en ljus pläd". Det som ska beskrivas i text måste läsas i
   full upplösning.
"""
import os, sys
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HAR, "rawbilder")


def bit(namn, l, o, r, n, bredd=1000):
    """Beskär (andelar av bilden) och skala till `bredd`."""
    im = Image.open(os.path.join(RAW, namn + ".jpg")).convert("RGB")
    w, h = im.size
    c = im.crop((int(w * l), int(h * o), int(w * r), int(h * n)))
    return c.resize((bredd, int(bredd * c.size[1] / c.size[0])), Image.LANCZOS)


def ark(namn, rutor, kol=2):
    b = max(r.size[0] for r in rutor)
    hh = max(r.size[1] for r in rutor)
    rad = (len(rutor) + kol - 1) // kol
    ut = Image.new("RGB", (kol * b, rad * hh), "white")
    for i, r in enumerate(rutor):
        ut.paste(r, ((i % kol) * b, (i // kol) * hh))
    ut.save(namn, "JPEG", quality=92)
    return namn


if __name__ == "__main__":
    vilket = sys.argv[1]
    if vilket == "text":
        print(ark("zoom-text.jpg", [
            bit("99040238-4", 0.0, 0.55, 1.0, 1.0, 1400),   # tyska bildtexterna
            bit("99040238-3", 0.0, 0.0, 1.0, 1.0, 1400),    # måttritningen
        ], kol=1))
    elif vilket == "hylla":
        print(ark("zoom-hylla.jpg", [
            bit("db70e38c-1", 0.0, 0.0, 1.0, 1.0, 1000),
            bit("db70e38c-3", 0.0, 0.0, 1.0, 1.0, 1000),
            bit("db70e38c-2", 0.25, 0.2, 0.85, 0.8, 1000),
            bit("db70e38c-4", 0.1, 0.1, 0.9, 0.9, 1000),
        ], kol=2))
    elif vilket == "shoji":
        print(ark("zoom-shoji.jpg", [
            bit("e858810e-4", 0.0, 0.0, 1.0, 1.0, 1000),
            bit("f641d190-4", 0.0, 0.0, 1.0, 1.0, 1000),
            bit("e858810e-1", 0.0, 0.0, 1.0, 1.0, 1000),
            bit("f641d190-1", 0.0, 0.0, 1.0, 1.0, 1000),
        ], kol=2))
    elif vilket == "hjul":
        print(ark("zoom-hjul.jpg", [
            bit("79b349f7-1", 0.0, 0.55, 1.0, 1.0, 1400),
            bit("79b349f7-3", 0.0, 0.0, 1.0, 1.0, 1400),
        ], kol=1))
    elif vilket == "collage":
        print(ark("zoom-collage.jpg", [
            bit("1c1eb875-4", 0.0, 0.0, 1.0, 1.0, 1100),
            bit("23d20823-4", 0.0, 0.0, 1.0, 1.0, 1100),
        ], kol=2))
