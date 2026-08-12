#!/usr/bin/env python3
"""Vit hjälte för bilbanan — Metod G på leverantörens skarpaste bild.

Gamla hjälten var en 990×390-remsa (2,5:1) ur en rumsbild: i en kvadratisk
galleriruta blev produkten ett streck.

Leverantörens a4 är den skarpaste och bäst komponerade bilden av hela setet
— startbox, ramp med de fem numrerade banorna, målbåge och den hopfällda
förvaringslådan — men den ligger i ett rum, med rubriktext, en inzoomad cirkel
och fem lösa golvbilar runt omkring. Maskar man BARA banan och lådan försvinner
allt det andra av sig självt, inklusive dubbelräkningen av bilarna (leverantören
visar samma fem bilar både på banan och på golvet; vi säljer fem).

u2net klarar inte hela scenen i ett svep: kör man på helbilden blir startboxen
genomskinlig (mörk plast mot mörkblå vägg), kör man på en utsnittad ramp tappas
målbågen i stället. Lösningen är att köra båda och slå ihop maskerna — helbilden
ger ramp, båge och låda, utsnittet ger startboxen.
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from rembg import remove

SRC = "ae/a4.webp"
UT = "hero_bilbana.png"
SIDA = 2000
SKALA = 2                                   # a4 är 1000² → arbetsyta 2000²
BANA_RUTA = (0, 210, 730, 900)              # a4-koordinater, rampen dominerar
STARTBOX = (20, 480, 640, 1420)             # arbetsytans koordinater
HUS_RUTA = (0, 330, 230, 730)               # a4: det svarta huset, tätt inpå
HUS_OMR = (0, 700, 460, 1460)               # arbetsytan: bara husets del


def alfa(im: Image.Image) -> np.ndarray:
    return np.asarray(remove(im))[:, :, 3].astype(float) / 255.0


def main() -> None:
    a4 = Image.open(SRC).convert("RGB")
    bas = a4.resize((a4.width * SKALA, a4.height * SKALA), Image.LANCZOS)

    # --- helbilden: ramp, målbåge och låda blir bra, startboxen spökar ---
    hel = alfa(bas)
    m = hel > 0.5
    lab, n = ndimage.label(m)
    sz = ndimage.sum(m, lab, range(1, n + 1))
    tva_storsta = [int(k) + 1 for k in np.argsort(sz)[::-1][:2]]
    mask_a = np.isin(lab, tva_storsta)

    # --- utsnittet: startboxen blir solid ---
    c = a4.crop(BANA_RUTA)
    c = c.resize((c.width * SKALA, c.height * SKALA), Image.LANCZOS)
    delalfa = alfa(c)
    lager = np.zeros_like(hel)
    ox, oy = BANA_RUTA[0] * SKALA, BANA_RUTA[1] * SKALA
    lager[oy:oy + delalfa.shape[0], ox:ox + delalfa.shape[1]] = delalfa

    ruta = np.zeros_like(m)
    sx0, sy0, sx1, sy1 = STARTBOX
    ruta[sy0:sy1, sx0:sx1] = True
    mask_b = (lager > 0.5) & ruta
    mask_b = ndimage.binary_opening(mask_b, iterations=3)

    # --- huset som banan viks ut ur: mörk plast, kräver egen tät beskärning ---
    hc = a4.crop(HUS_RUTA)
    hc = hc.resize((hc.width * SKALA, hc.height * SKALA), Image.LANCZOS)
    husalfa = alfa(hc)
    lager_h = np.zeros_like(hel)
    hx, hy = HUS_RUTA[0] * SKALA, HUS_RUTA[1] * SKALA
    lager_h[hy:hy + husalfa.shape[0], hx:hx + husalfa.shape[1]] = husalfa
    hruta = np.zeros_like(m)
    hx0, hy0, hx1, hy1 = HUS_OMR
    hruta[hy0:hy1, hx0:hx1] = True
    mask_c = ndimage.binary_opening((lager_h > 0.5) & hruta, iterations=3)

    mask = mask_a | mask_b | mask_c
    mask = ndimage.binary_closing(mask, iterations=4)
    mask = ndimage.binary_fill_holes(mask)
    lab, n = ndimage.label(mask)
    sz = ndimage.sum(mask, lab, range(1, n + 1))
    mask = np.isin(lab, [k + 1 for k in range(n) if sz[k] > 20000])

    mjuk = ndimage.gaussian_filter(mask.astype(float), 1.2)[:, :, None]
    rgb = np.asarray(bas).astype(float)
    ren = rgb * mjuk + 255.0 * (1 - mjuk)

    ys, xs = np.where(mask)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    vara = Image.fromarray(np.clip(ren, 0, 255).astype(np.uint8)).crop(box)

    andel = 0.94
    if vara.width >= vara.height:
        mal_b = int(SIDA * andel)
        mal_h = int(round(vara.height * mal_b / vara.width))
    else:
        mal_h = int(SIDA * andel)
        mal_b = int(round(vara.width * mal_h / vara.height))
    vara = vara.resize((mal_b, mal_h), Image.LANCZOS)

    duk = Image.new("RGB", (SIDA, SIDA), (255, 255, 255))
    duk.paste(vara, ((SIDA - mal_b) // 2, (SIDA - mal_h) // 2))
    duk = duk.filter(ImageFilter.UnsharpMask(radius=1.2, percent=50, threshold=3))
    duk.save(UT)
    print(UT, duk.size, "vara", mal_b, "x", mal_h, "källbox", box)


if __name__ == "__main__":
    main()
