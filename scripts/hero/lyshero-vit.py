#!/usr/bin/env python3
"""Metod F — vit hjälte för en produkt som SJÄLV lyser.

Problemet
---------
En tänd LED-produkt fotad mot mörk botten går inte att flytta till vitt.
Glöden finns bara som ljus tillagt i mörker; klipper man ut den försvinner
den. Samma sak gäller leverantörens 3D-render: rören är rent vita rör mot
marinblå botten, och mot vit botten blir de osynliga. Första försöket på
hexagonlampan blev ett spöke av exakt det skälet.

Lösningen
---------
Bygg om ljuset i stället för att flytta det. Mät hur produkten FAKTISKT ser
ut mot ett ljust underlag i något av leverantörens egna foton, och återskapa
den profilen. På hexagonlampan (a3, tvärsnitt vid x=700/780/860) mättes:

    tak ~190  ->  ljusspill upp mot 235  ->  MÖRK kåpkant ned till ~90-165
    ->  mättad vit rörkärna 255 i ~15 px  ->  spill faller av mot ~155

Nyckeln är den mörka kåpkanten. Ett lysande vitt rör syns mot ljus botten
tack vare plastkåpans skuggade fläns, inte tack vare glöden. Utan den kanten
finns ingen bild. Med den kanten läser ögat röret som ett fysiskt föremål,
och det breda spillet gör att det ändå läser som tänt.

Bakgrunden får inte vara 255. Ljus kan bara visas som något ljusare än sin
omgivning, så botten läggs runt 218 i hörnen och lyfts mot 255 närmast röret.
Det uppfattas som vitt av kunden och är fysiskt sammanhängande.

Vad som INTE görs
-----------------
Geometrin, rörens skuggning och kopplingsnoderna tas pixel för pixel ur
leverantörens egen render. Inget ritas om och ingen generativ AI används —
antalet hexagoner, antalet rör och måtten är sådant vi säljer på, och en
generativ omritning räknar fel på precis den sortens saker.

Anrop
-----
    python3 lyshero-vit.py render.webp hjalte.png
"""
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SIDA = 2000
BREDD_ANDEL = 0.86
HORN = 218.0                                  # bakgrund längst ut
NARA = 255.0                                  # bakgrund tätt intill röret
KANT = np.array([132.0, 140.0, 154.0])        # kåpans mörka kontur (mätt ~90-165)
KANT_PX = 3
LJUS_TROSKEL = 120                            # skiljer struktur från mörk botten


def bygg(src: str, ut: str) -> None:
    a = np.asarray(Image.open(src).convert("RGB")).astype(float)
    lum = a.mean(axis=2)

    # största ljusa komponenten = lampan. Måttpilar och text ligger som egna
    # komponenter och faller bort av sig själva.
    kropp = lum > LJUS_TROSKEL
    lab, n = ndimage.label(kropp)
    sz = ndimage.sum(kropp, lab, range(1, n + 1))
    struktur = lab == (int(np.argmax(sz)) + 1)

    mjuk = np.clip((lum - 70.0) / (200.0 - 70.0), 0, 1)
    mjuk = mjuk * ndimage.binary_dilation(struktur, iterations=3)

    ys, xs = np.where(struktur)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    alpha, rgb = mjuk[y0:y1, x0:x1], a[y0:y1, x0:x1]

    mal_b = int(SIDA * BREDD_ANDEL)
    mal_h = int(round(alpha.shape[0] * mal_b / alpha.shape[1]))
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8))
                       .resize((mal_b, mal_h), Image.LANCZOS)).astype(float) / 255.0
    rgb = np.asarray(Image.fromarray(rgb.astype(np.uint8))
                     .resize((mal_b, mal_h), Image.LANCZOS)).astype(float)

    # rendern är nedtonad mot sin mörka botten — lyft rören till den vithet de
    # har när de lyser, men behåll silverdetaljen i kopplingsnoderna
    rgb = 255.0 - (255.0 - rgb) * 0.5

    lager_a = np.zeros((SIDA, SIDA))
    lager_rgb = np.zeros((SIDA, SIDA, 3))
    ox, oy = (SIDA - mal_b) // 2, (SIDA - mal_h) // 2
    lager_a[oy:oy + mal_h, ox:ox + mal_b] = alpha
    lager_rgb[oy:oy + mal_h, ox:ox + mal_b] = rgb
    kok = lager_a > 0.45

    brett = ndimage.gaussian_filter(lager_a, 110)
    tajt = ndimage.gaussian_filter(lager_a, 22)
    spill = np.clip(brett / max(brett.max(), 1e-6) * 0.55
                    + tajt / max(tajt.max(), 1e-6) * 1.45, 0, 1)

    grund = HORN + (NARA - HORN) * spill
    bild = np.dstack([grund * 0.998, grund * 0.999, grund])   # en aning svalt, 6500 K

    kant = ndimage.binary_dilation(kok, iterations=KANT_PX) & ~kok
    kant_mjuk = ndimage.gaussian_filter(kant.astype(float), 1.2)[:, :, None]
    bild = bild * (1 - kant_mjuk) + KANT * kant_mjuk

    blandning = np.clip(lager_a, 0, 1)[:, :, None]
    bild = bild * (1 - blandning) + lager_rgb * blandning

    out = Image.fromarray(np.clip(bild, 0, 255).astype(np.uint8))
    out = out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=45, threshold=3))
    out.save(ut)
    print(ut, out.size, "lampa", mal_b, "x", mal_h)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("anrop: lyshero-vit.py <leverantorsrender> <hjalte.png>")
    bygg(sys.argv[1], sys.argv[2])
