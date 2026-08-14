#!/usr/bin/env python3
"""Vit hjältebild för hudvårdssetet — utan generativ AI.

Wix Generate Image testades först och underkändes: den ritade OM etiketterna
(finstilt blev nonsens, "100g/3.53oz" blev "100g/2.53oz"). Faktatrohet går före
vit bakgrund, så resultatet slängdes.

Den här rutinen rör inte en enda produktpixel. Källan är leverantörens bild 2,
där alla fem produkter ligger i en solfjäder mot en orange gradient — och där
varje produkt redan har en VIT klisterkontur runt sig. Konturen är nyckeln:

  1. Maska allt som är ljust och färglöst → konturerna blir slutna ringar.
  2. binary_fill_holes → varje produkt fylls solid. Klotter (hjärtan, bågar,
     rosa slingor) är öppna streck utan insida och blir egna småkomponenter.
  3. Behåll största komponenten → de fem produkterna, klottret bort.
  4. En triangel bakgrund blir instängd mellan burken och tonern (konturerna
     omsluter den tillsammans). Den hittas som en liten INRE komponent —
     2 769 px, mot produkternas 110 868–367 798 px — och tas bort tillsammans
     med ett trettiotal enpixelsdamm av samma sort.

Konturen får sitta kvar: vit på vitt syns den inte, och att erodera bort den
riskerar att äta produktens egna kanter — precis den fällan runbooken varnar för.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

HAR = Path(__file__).resolve().parent
SIDA = 1600
FYLLNAD = 0.80          # största utsträckningen som andel av rutan
INRE_MIN = 20_000       # px: mindre inre yta = instängd bakgrund, inte produkt


def produktmask(im):
    a = np.asarray(im.convert("RGB")).astype(float)
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    lum = 0.299 * a[:, :, 0] + 0.587 * a[:, :, 1] + 0.114 * a[:, :, 2]

    vit = (lum > 225) & (sat < 0.10)
    kontur = ndimage.binary_closing(vit, iterations=3)
    fyllt = ndimage.binary_fill_holes(kontur)

    lab, _ = ndimage.label(fyllt)
    sz = np.bincount(lab.ravel()); sz[0] = 0
    m = lab == sz.argmax()

    # Instängd bakgrund mellan två produkter. Testet görs mot den RÅA vit-masken,
    # inte mot den slutna: slutningen bryggar över smala springor och sväljer då
    # just de orange fransar vi vill bli av med, så de aldrig dyker upp som egen
    # inre komponent. (Det var precis felet första gången — tre små orange pilar
    # låg kvar längs sömmen mellan burken och tonern.)
    il, n = ndimage.label(m & ~vit)
    isz = np.bincount(il.ravel()); isz[0] = 0
    bort = np.zeros_like(m)
    smulor = 0
    for k in range(1, n + 1):
        if isz[k] < INRE_MIN:
            bort |= (il == k)
            smulor += 1
    if bort.any():
        # Några pixlars utvidgning tar antialias-fransen runt varje smula.
        # Konturerna är ~6–8 px breda på var sida, så den stannar inuti det vita
        # strecket. Kontrollerat: alla fem produktytor är intakta efteråt
        # (110 868 / 118 338 / 210 684 / 262 980 / 367 798 px) och varje bortagen
        # smula har bakgrundens varma ton.
        m &= ~ndimage.binary_dilation(bort, iterations=3)
    return m, smulor, int(bort.sum())


def bygg(kalla, ut, skugga=True):
    im = Image.open(kalla).convert("RGB")
    m, smulor, bortpx = produktmask(im)

    rgba = np.dstack([np.asarray(im), (m * 255).astype(np.uint8)])
    p = Image.fromarray(rgba, "RGBA")
    p = p.crop(p.getbbox())

    skala = (SIDA * FYLLNAD) / max(p.width, p.height)
    p = p.resize((round(p.width * skala), round(p.height * skala)), Image.LANCZOS)

    duk = Image.new("RGBA", (SIDA, SIDA), (255, 255, 255, 255))
    x = (SIDA - p.width) // 2
    y = (SIDA - p.height) // 2

    if skugga:
        # Mjuk slagskugga: setet ligger i en solfjäder, det står inte på ett
        # golv, så markskuggan vore fel. Skuggan finns för att skilja den
        # ljusgula rengöringstuben och den vita konturen från vit bakgrund.
        sh = Image.new("RGBA", (SIDA, SIDA), (0, 0, 0, 0))
        silu = Image.new("RGBA", p.size, (0, 0, 0, 0)); silu.putalpha(p.split()[3])
        sh.paste(silu, (x + 8, y + 20), silu)
        sh = sh.filter(ImageFilter.GaussianBlur(26))
        r, g, b, al = sh.split()
        sh = Image.merge("RGBA", (r, g, b, al.point(lambda v: int(v * 0.22))))
        duk.alpha_composite(sh)

    duk.alpha_composite(p, (x, y))
    duk.convert("RGB").save(ut, quality=96)

    b = np.asarray(Image.open(ut).convert("RGB")).astype(int)
    syns = b.sum(axis=2) < 735
    ys, xs = np.nonzero(syns)
    return {"fil": Path(ut).name,
            "instangda_ytor": smulor, "borttagna_px": bortpx,
            "fyllnad_bredd": round((xs.max() - xs.min()) / SIDA, 3),
            "fyllnad_hojd": round((ys.max() - ys.min()) / SIDA, 3)}


if __name__ == "__main__":
    # Utan slagskugga: produkterna bär redan leverantörens egen 3D-skuggning och
    # de står inte på något underlag. Med skugga blir den vita klisterkonturen
    # synlig som en dekal-kant — utan skugga försvinner den helt mot vitt.
    print(bygg(HAR / "h1.img", HAR / "hud_hero.jpg", skugga=False))
