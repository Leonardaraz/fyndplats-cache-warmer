#!/usr/bin/env python3
"""Metod H — hjälten fanns redan, fel bild var vald.

Gamla hjälten var beskuren ur måttskissen (a2): sitsen kapad av bildkanten,
två tredjedelar rep och tomrum, och en kvarglömd streckad måttlinje uppe till
höger. Måttskissen visar dessutom en BRUN sitsduk (RGB ≈ 50,33,26) medan alla
övriga leverantörsbilder — och vårt eget materialkort — visar en SVART
(RGB ≈ 37,37,37). Hjälten ska inte leda med undantaget.

Källan här är a1: hela gungan mot ren vit botten (bakgrunden är exakt 255,
så ingen maskering behövs), svart sits, repen blöder ut ur överkanten precis
som i originalet.
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "ae/a1.webp"
UT = sys.argv[2] if len(sys.argv) > 2 else "hero.png"
SIDA = 2000
HOJD_ANDEL = 0.94      # varans höjd av duken; resten blir marginal nedtill


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(float)

    icke_vit = ndimage.binary_opening(a.min(axis=2) < 235, iterations=2)
    lab, n = ndimage.label(icke_vit)
    sz = ndimage.sum(icke_vit, lab, range(1, n + 1))
    behall = np.isin(lab, [k + 1 for k in range(n) if sz[k] > 300])
    ys, xs = np.where(behall)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)

    vara = im.crop(box)
    mal_h = int(SIDA * HOJD_ANDEL)
    mal_b = int(round(vara.width * mal_h / vara.height))
    vara = vara.resize((mal_b, mal_h), Image.LANCZOS)

    duk = Image.new("RGB", (SIDA, SIDA), (255, 255, 255))
    duk.paste(vara, ((SIDA - mal_b) // 2, 0))          # repen blöder ut upptill

    duk = duk.filter(ImageFilter.UnsharpMask(radius=1.1, percent=40, threshold=3))
    duk.save(UT)
    print(UT, duk.size, "vara", mal_b, "x", mal_h, "källbox", box)


if __name__ == "__main__":
    main()
