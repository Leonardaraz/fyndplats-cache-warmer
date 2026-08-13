#!/usr/bin/env python3
"""Vit hjälte för mattan.

Gamla hjälten var en närbild av mattan i ett rum, beskuren på alla fyra
kanter — man såg luggen men aldrig varan. En 160 × 120-matta måste visa sin
form, annars säger bilden ingenting om vad man köper.

Mattan är en fylld rektangel, så ingen maskering behövs: den enda uppgiften
är att hitta rektangeln i leverantörens måttbild och beskära på den. Kanten
mot bakgrunden syns inte i luminans (matta ~199, botten ~227 — för nära) men
väl i TEXTUR: luggen ger lokal standardavvikelse ~7,9 medan bottnen ligger på
exakt 0. Rad- och kolumnprofil på den masken ger rektangeln.

Kontroll: 1550 × 1143 px = kvot 1,356 mot måttets 160/120 = 1,333. Två
procents skillnad är luggens mjuka kant, inte fel rektangel.
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = "ae/a2.webp"
UT = "hero_matta.png"
SIDA = 2000
BREDD_ANDEL = 0.90
GROVT = (150, 600, 1760, 1760)     # grovt område så måttpilar och soffskiss inte stör


def hitta_mattan(a: np.ndarray) -> tuple:
    lum = a.mean(axis=2)
    lok = ndimage.uniform_filter(lum, 9)
    std = np.sqrt(np.clip(ndimage.uniform_filter(lum * lum, 9) - lok * lok, 0, None))
    m = ndimage.binary_opening(std > 3.0, iterations=4)

    gx0, gy0, gx1, gy1 = GROVT
    sub = m[gy0:gy1, gx0:gx1]
    kol, rad = sub.sum(axis=0), sub.sum(axis=1)
    kx = np.where(kol > 0.6 * np.median(kol[kol > 0]))[0]
    ry = np.where(rad > 0.6 * np.median(rad[rad > 0]))[0]
    return gx0 + kx.min(), gy0 + ry.min(), gx0 + kx.max(), gy0 + ry.max()


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    box = hitta_mattan(np.asarray(im).astype(float))
    matta = im.crop(box)
    kvot = matta.width / matta.height
    print("mattans ruta", box, matta.size, "kvot %.3f (mått 1.333)" % kvot)

    mal_b = int(SIDA * BREDD_ANDEL)
    mal_h = int(round(matta.height * mal_b / matta.width))
    matta = matta.resize((mal_b, mal_h), Image.LANCZOS)

    ox, oy = (SIDA - mal_b) // 2, (SIDA - mal_h) // 2

    # mjuk kontaktskugga så mattan ligger på ytan i stället för att sväva
    skugga = np.zeros((SIDA, SIDA))
    skugga[oy + 16:oy + mal_h + 16, ox + 4:ox + mal_b + 4] = 1.0
    skugga = ndimage.gaussian_filter(skugga, 26) * 0.17

    duk = np.full((SIDA, SIDA, 3), 255.0)
    duk *= (1 - skugga)[:, :, None] * 0.16 + 0.84      # skuggan mörkar mot ~215 som mest
    duk = Image.fromarray(np.clip(duk, 0, 255).astype(np.uint8))
    duk.paste(matta, (ox, oy))
    duk = duk.filter(ImageFilter.UnsharpMask(radius=1.1, percent=35, threshold=3))
    duk.save(UT)
    print(UT, duk.size, "matta", mal_b, "x", mal_h)


if __name__ == "__main__":
    main()
