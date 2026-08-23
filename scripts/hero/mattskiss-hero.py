#!/usr/bin/env python3
"""Vit hjältebild för barnens musikbord.

Den gamla hjälten var en NÄRBILD: bordsskivan i utsnitt, benen bortklippta,
vindspelet kapat i vänsterkant och guiron kapad i högerkant. Man såg aldrig vad
man köpte. Enda bilden i galleriet som visar HELA produkten rakt framifrån är
måttskissen — samma studiofoto som de andra, fast med orange måttpilar pålagda.

Pilarna är overlay-grafik och ska bort enligt T-metoderna (docs/polish/bildmetoder.md). De är lätta att skilja
från varan trots att varan själv har orange delar (benens fötter, xylofonens
röda tangent, guirons band): overlayen är EN platt vektorfärg, medel (254,155,87)
i varje komponent, medan varans orange sitter inbäddat i den stora
produktkomponenten och aldrig blir en egen komponent. Vi klassar alltså per
komponent, inte per pixel — då kan fötterna aldrig råka följa med.

Vindspelets rör hänger i tunna snören som inte överlever bakgrundströskeln, så
rören blir egna komponenter (tre stycken, ~10 000 px, gråa). Därför får man INTE
"behåll största komponenten" här — då tappar man vindspelet. Vi behåller allt
utom det som är overlay-orange.
"""
from pathlib import Path
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

HAR = Path(__file__).resolve().parent
sys.path.insert(0, str(HAR.parent / "batch2" / "rollator"))
from cardkit import ground  # noqa: E402  husets kontaktskugga

SIDA = 1600
FYLLNAD = 0.86              # bred, låg produkt → styr på bredden
BAKGRUND = np.array([250, 244, 230])   # leverantörens gräddvita papper
OVERLAY = np.array([254, 155, 87])     # måttpilarnas platta orange


def produktmask(im):
    a = np.asarray(im.convert("RGB")).astype(int)
    fg = ndimage.binary_closing(np.abs(a - BAKGRUND).max(axis=2) > 10, iterations=2)

    lab, n = ndimage.label(fg)
    overlay = np.zeros_like(fg)
    antal = 0
    for k in range(1, n + 1):
        sel = lab == k
        if np.abs(a[sel].mean(axis=0) - OVERLAY).max() < 40:
            overlay |= sel
            antal += 1
    # Utvidga overlayen så antialias-brämen runt siffror och pilspetsar följer med.
    m = fg & ~ndimage.binary_dilation(overlay, iterations=4)
    m = ndimage.binary_opening(m, iterations=1)   # lösryckta enstaka pixlar
    return m, antal, int(overlay.sum())


def bygg(kalla, ut_fil):
    im = Image.open(kalla).convert("RGB")
    m, antal, overlaypx = produktmask(im)

    rgba = np.dstack([np.asarray(im), (m * 255).astype(np.uint8)])
    p = Image.fromarray(rgba, "RGBA")
    p = p.crop(p.getbbox())
    p.save(HAR / "musik_cut.png")

    # Husets kontaktskugga — bordet står på ben på ett golv, alltså markskugga
    # och inte slagskugga.
    ground(HAR / "musik_cut.png", HAR / "musik_ground.png",
           pad=90, opacity=0.26, blur=26, drop=0.030)

    g = Image.open(HAR / "musik_ground.png").convert("RGBA")
    ga = np.asarray(g)
    ys, xs = np.nonzero(ga[:, :, 3] > 200)          # produkten, inte skuggan
    prod_b, prod_h = xs.max() - xs.min(), ys.max() - ys.min()

    skala = (SIDA * FYLLNAD) / prod_b
    if prod_h * skala > SIDA * 0.78:
        skala = (SIDA * 0.78) / prod_h
    g = g.resize((round(g.width * skala), round(g.height * skala)), Image.LANCZOS)

    duk = Image.new("RGBA", (SIDA, SIDA), (255, 255, 255, 255))
    duk.alpha_composite(g, ((SIDA - g.width) // 2, int(SIDA * 0.5 - g.height * 0.47)))
    duk.convert("RGB").save(ut_fil, quality=96)

    b = np.asarray(Image.open(ut_fil).convert("RGB")).astype(int)
    ys2, xs2 = np.nonzero(b.sum(axis=2) < 735)
    return {"overlay_komponenter": antal, "overlay_px": overlaypx,
            "fyllnad_bredd": round((xs2.max() - xs2.min()) / SIDA, 3),
            "fyllnad_hojd": round((ys2.max() - ys2.min()) / SIDA, 3),
            "ror_kant": bool(xs2.min() < 2 or xs2.max() > SIDA - 3 or ys2.min() < 2 or ys2.max() > SIDA - 3)}


if __name__ == "__main__":
    print(bygg(HAR / "m5.img", HAR / "musik_hero.jpg"))
