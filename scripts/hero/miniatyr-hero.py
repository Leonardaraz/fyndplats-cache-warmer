#!/usr/bin/env python3
"""Vit hjälte för paviljongen.

Gamla hjälten var redan vit — men den var en dålig beskärning av
leverantörens a0: paviljongens högra sida och möblernas underkant kapades av
bildkanten, och uppe i högra hörnet låg ett löst fragment kvar av den
inzoomade miniatyren som ligger där i originalet.

a0 har hela paviljongen mot exakt 255-vitt. Arbetet är därför bara att
radera miniatyren och beskära på varans egen ruta. Komponentmärkning skiljer
dem åt utan risk: paviljongen är 1,26 Mpx, miniatyren 0,15 Mpx, och de
överlappar inte i x-led trots att deras y-intervall snuddar vid varandra.
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = "ae/a0.webp"
UT = "hero_paviljong.png"
SIDA = 2000
BREDD_ANDEL = 0.96


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    a = np.asarray(im).astype(float)

    m = ndimage.binary_opening(ndimage.binary_closing(a.min(axis=2) < 247, iterations=3), iterations=2)
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=3))
    sz = ndimage.sum(m, lab, range(1, n + 1))
    ordning = np.argsort(sz)[::-1]
    vara = lab == (int(ordning[0]) + 1)
    mini = lab == (int(ordning[1]) + 1)

    ys, xs = np.where(mini)
    mx0, mx1, my0, my1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    overlapp = int((vara[my0:my1, mx0:mx1]).sum())
    print("miniatyrens ruta x %d-%d y %d-%d, paviljongpixlar där: %d" % (mx0, mx1, my0, my1, overlapp))
    if overlapp:
        raise SystemExit("paviljongen ligger i miniatyrens ruta – radera inte blint")

    ren = a.copy()
    ren[my0 - 6:my1 + 6, mx0 - 6:mx1 + 6] = 255.0

    ys, xs = np.where(vara)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    bild = Image.fromarray(np.clip(ren, 0, 255).astype(np.uint8)).crop(box)
    print("paviljongens ruta", box, bild.size, "kvot %.2f" % (bild.width / bild.height))

    mal_b = int(SIDA * BREDD_ANDEL)
    mal_h = int(round(bild.height * mal_b / bild.width))
    if mal_h > int(SIDA * BREDD_ANDEL):
        mal_h = int(SIDA * BREDD_ANDEL)
        mal_b = int(round(bild.width * mal_h / bild.height))
    bild = bild.resize((mal_b, mal_h), Image.LANCZOS)

    duk = Image.new("RGB", (SIDA, SIDA), (255, 255, 255))
    duk.paste(bild, ((SIDA - mal_b) // 2, (SIDA - mal_h) // 2))
    duk = duk.filter(ImageFilter.UnsharpMask(radius=1.1, percent=35, threshold=3))
    duk.save(UT)
    print(UT, duk.size, "vara", mal_b, "x", mal_h)


if __name__ == "__main__":
    main()
