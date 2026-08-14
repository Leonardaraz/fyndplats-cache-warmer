#!/usr/bin/env python3
"""Metod G — vit hjälte ur en bokeh-bild (rembg + separat mask för mörka delar).

Källa: leverantörens a4, undre halvan — hela ekipaget (släde, personvagn,
kolvagn, lok) på svängd räls, störst och skarpast av alla bilder i setet.
Bakgrunden där är bokeh, inte vit, så den måste bort.

Två masker läggs ihop:
  1. rembg/u2net tar de färgstarka vagnarna och loket.
  2. Rälsen är nästan svart (lum < 130) medan bokehn aldrig går under 181.
     Ett luminansfilter tar den solid — rembg gav den alpha ~0,5, vilket mot
     vit botten blev GRÅ räls i stället för svart.

Rälsen får blöda ut ur vänsterkanten och nederkanten, precis som i källan.
Klipper man av den mitt i den vita ytan hänger den i luften.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter
from rembg import remove
from scipy import ndimage

SRC = "ae/a4.webp"
BOX = (0, 395, 1000, 1000)     # undre halvan; 395 skär bort ringens nederkant
SIDA = 2000
MORK = 130                     # rälsen ligger under, bokehn aldrig under 181


def mask(im: Image.Image) -> np.ndarray:
    a = np.asarray(im).astype(float)
    lum = a.mean(axis=2)

    alfa = np.asarray(remove(im))[:, :, 3].astype(float) / 255.0

    # rälsen: solid, inte halvgenomskinlig
    rals = lum < MORK
    rals = ndimage.binary_opening(rals, iterations=2)
    lab, n = ndimage.label(ndimage.binary_dilation(rals, iterations=3))
    sz = ndimage.sum(rals, lab, range(1, n + 1))
    behall = [k + 1 for k in range(n) if sz[k] > 500]
    rals = np.isin(lab, behall) & ndimage.binary_closing(rals, iterations=4)

    ihop = np.maximum(alfa, ndimage.gaussian_filter(rals.astype(float), 0.6))
    ihop = np.clip(ihop, 0, 1)

    # bara den sammanhängande vagnsraden – lösa fragment ur grannbilden bort
    fast = ndimage.binary_dilation(ihop > 0.4, iterations=3)
    lab, n = ndimage.label(fast)
    sz = ndimage.sum(fast, lab, range(1, n + 1))
    huvud = ndimage.binary_dilation(lab == (int(np.argmax(sz)) + 1), iterations=2)
    return ihop * huvud


def bygg(ut_fil: str, botten_ankrad: bool) -> None:
    im = Image.open(SRC).convert("RGB").crop(BOX)
    im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    rgb = np.asarray(im).astype(float)
    alfa = mask(im)

    ys, xs = np.where(alfa > 0.4)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgb, alfa = rgb[y0:y1, x0:x1], alfa[y0:y1, x0:x1]

    mal_b = SIDA
    mal_h = int(round(alfa.shape[0] * mal_b / alfa.shape[1]))
    rgb = np.asarray(Image.fromarray(rgb.astype(np.uint8)).resize((mal_b, mal_h), Image.LANCZOS)).astype(float)
    alfa = np.asarray(Image.fromarray((alfa * 255).astype(np.uint8)).resize((mal_b, mal_h), Image.LANCZOS)).astype(float) / 255.0

    duk_rgb = np.full((SIDA, SIDA, 3), 255.0)
    lager_a = np.zeros((SIDA, SIDA))
    lager_rgb = np.zeros((SIDA, SIDA, 3))
    oy = SIDA - mal_h if botten_ankrad else (SIDA - mal_h) // 2
    lager_a[oy:oy + mal_h, :] = alfa
    lager_rgb[oy:oy + mal_h, :] = rgb

    b = np.clip(lager_a, 0, 1)[:, :, None]
    bild = duk_rgb * (1 - b) + lager_rgb * b

    out = Image.fromarray(np.clip(bild, 0, 255).astype(np.uint8))
    out = out.filter(ImageFilter.UnsharpMask(radius=1.1, percent=35, threshold=3))
    out.save(ut_fil)
    print(ut_fil, out.size, "vara", mal_b, "x", mal_h)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("anrop: bokeh-hero.py <hjalte.png>")
    bygg(sys.argv[1], True)
