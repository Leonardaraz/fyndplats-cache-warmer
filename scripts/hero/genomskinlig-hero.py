#!/usr/bin/env python3
"""Vit hjälte för skärmtaket — genomskinlig produkt.

Varan är en KLAR polykarbonatskiva. Normalt är genomskinligt det svåraste
som finns att flytta till vitt: skivan visar det som ligger bakom, så mot
vit botten försvinner den. Men här går det, av ett skäl som är värt att mäta
INNAN man börjar: väggen bakom ligger redan på ~244 och skivan på ~223 med
räfflor ned mot 184. Skillnaden mellan vägg och vitt är alltså elva nivåer.
Skivans utseende ändras knappt av bytet, och räfflorna, reflexerna och den
svarta ramen bär bilden.

Därför behövs ingen rekonstruktion: hämta silhuetten med rembg, behåll
originalpixlarna innanför och lägg vitt utanför.
"""
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove
from scipy import ndimage

SRC = "ae/a0.webp"
UT = "hero_skarmtak.png"
RUTA = (120, 300, 1850, 1180)     # generöst runt skärmtaket i a0
SIDA = 2000
BREDD_ANDEL = 0.95


def main() -> None:
    c = Image.open(SRC).convert("RGB").crop(RUTA)
    ut = remove(c)
    alfa = np.asarray(ut)[:, :, 3].astype(float) / 255.0

    kropp = alfa > 0.43
    lab, n = ndimage.label(ndimage.binary_closing(kropp, iterations=3))
    sz = ndimage.sum(kropp, lab, range(1, n + 1))
    kropp = lab == (int(np.argmax(sz)) + 1)          # bara skärmtaket
    alfa = alfa * ndimage.binary_dilation(kropp, iterations=3)

    rgb = np.asarray(c).astype(float)
    b = np.clip(alfa, 0, 1)[:, :, None]
    ren = rgb * b + 255.0 * (1 - b)

    ys, xs = np.where(kropp)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    vara = Image.fromarray(np.clip(ren, 0, 255).astype(np.uint8)).crop(box)

    mal_b = int(SIDA * BREDD_ANDEL)
    mal_h = int(round(vara.height * mal_b / vara.width))
    vara = vara.resize((mal_b, mal_h), Image.LANCZOS)

    duk = Image.new("RGB", (SIDA, SIDA), (255, 255, 255))
    duk.paste(vara, ((SIDA - mal_b) // 2, (SIDA - mal_h) // 2))
    duk = duk.filter(ImageFilter.UnsharpMask(radius=1.1, percent=40, threshold=3))
    duk.save(UT)
    print(UT, duk.size, "vara", mal_b, "x", mal_h, "källbox", box)


if __name__ == "__main__":
    main()
