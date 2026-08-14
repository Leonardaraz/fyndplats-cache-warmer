#!/usr/bin/env python3
"""Vit hjälte för pop-up-tältet.

Gamla hjälten var en hårt inzoomad beskärning av leverantörens collage a0:
taket kapat upptill, högra sidan ut ur bild, och nere till höger låg ett
löst fragment av den gula infällda cirkeln kvar.

Man kan INTE bara radera cirkeln ur a0. Mätning: cirkeln har centrum
(1510, 1630) och radie 284, medan väggens underkant ligger på y ≈ 1447 —
cirkelns övre båge skär alltså in i tältväggen mellan x 1293 och 1727 och
döljer en lins som är 434 px bred och upp till 101 px djup. Att radera den
lämnar ett vitt bett i väggen, och att fylla igen betyder att man hittar på
produktpixlar.

Måttbilden a2 duger inte heller: måttstapeln "1,82 m" ligger tvärs över
dörröppningen.

Kvar står miljöbilden a1, där tältet är helt och oskymt. Bakgrunden är
gräs och himmel — hög kontrast, tacksam för u2net. Enda efterarbetet är
grässtrimman längs nederkanten: ärver man leverantörens yttersta pixlar
syns en grön brätte mot vitt. Den tas på FÄRG i en smal remsa längs
alfakanten, så att den grå duken inte rörs.
"""
import numpy as np
from PIL import Image, ImageFilter
from rembg import remove
from scipy import ndimage

SRC = "ae/a1.webp"
UT = "hero_talt.png"
SIDA = 2000
BREDD_ANDEL = 0.95
EROSION = 2            # hur långt in i duken kanten byggs om


def main() -> None:
    im = Image.open(SRC).convert("RGB")
    ut = remove(im)
    alfa = np.asarray(ut)[:, :, 3].astype(float) / 255.0

    kropp = alfa > 0.5
    lab, n = ndimage.label(kropp)
    sz = ndimage.sum(kropp, lab, range(1, n + 1))
    kropp = lab == (int(np.argmax(sz)) + 1)
    alfa = alfa * ndimage.binary_dilation(kropp, iterations=2)

    # Bygg om kanten, ärv den inte. Originalets yttersta pixlar är halvt gräs;
    # behåller man dem mot vitt syns en grön brätte. Ett färgfilter på samma
    # pixlar gav i stället en sågtandad vägg — det åt upp antialiasingen där
    # duken möter gräset. Erodera in i duken och gör en egen mjuk kant.
    inre = ndimage.binary_erosion(kropp, iterations=EROSION)
    inre = ndimage.binary_fill_holes(inre) & kropp
    alfa = np.clip(ndimage.gaussian_filter(inre.astype(float), 0.9) * 1.18, 0, 1)

    rgb = np.asarray(im).astype(float)
    b = np.clip(alfa, 0, 1)[:, :, None]
    ren = rgb * b + 255.0 * (1 - b)

    ys, xs = np.where(alfa > 0.5)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    vara = Image.fromarray(np.clip(ren, 0, 255).astype(np.uint8)).crop(box)
    print("tältets ruta", box, vara.size, "kvot %.2f" % (vara.width / vara.height))

    mal_b = int(SIDA * BREDD_ANDEL)
    mal_h = int(round(vara.height * mal_b / vara.width))
    vara = vara.resize((mal_b, mal_h), Image.LANCZOS)

    duk = Image.new("RGB", (SIDA, SIDA), (255, 255, 255))
    duk.paste(vara, ((SIDA - mal_b) // 2, (SIDA - mal_h) // 2))
    duk = duk.filter(ImageFilter.UnsharpMask(radius=1.1, percent=40, threshold=3))
    duk.save(UT)
    print(UT, duk.size, "tält", mal_b, "x", mal_h)


if __name__ == "__main__":
    main()
