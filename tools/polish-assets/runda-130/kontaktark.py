# -*- coding: utf-8 -*-
"""Kontaktark för Steg 4 — tre ark om tre produkter, fem bilder per rad.

☠️ ETT ENDA 9x5-ARK GÖR VARJE BILD OLÄSLIG. Runbookens regel efter runda 104:
   kontaktarket duger för att se VAD en bild föreställer och om den bär tysk
   text; en SIFFRA måste läsas i förstoring. Rutan är därför 460 px, inte 300.
"""
import os
import sys

from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
RUTA, MARG, TEXT = 460, 8, 26

grupper = [
    ["65e3c24f", "4e23a904", "66a26135"],
    ["5ffb91a2", "ef0c374b", "a8cf27cd"],
]

par = [r.split() for r in open(os.path.join(HAR, "bilder.txt"), encoding="utf-8")]
filer = {}
for i, (pid, _) in enumerate(par, 1):
    filer.setdefault(pid, []).append("%s-%02d.jpg" % (pid, i))

for nr, grupp in enumerate(grupper, 1):
    b = (RUTA + MARG) * 5 + MARG
    h = (RUTA + MARG + TEXT) * len(grupp) + MARG
    ark = Image.new("RGB", (b, h), "white")
    d = ImageDraw.Draw(ark)
    for rad, pid in enumerate(grupp):
        y = MARG + rad * (RUTA + MARG + TEXT)
        for kol, namn in enumerate(filer[pid]):
            x = MARG + kol * (RUTA + MARG)
            im = Image.open(os.path.join(HAR, "rawbilder", namn)).convert("RGB")
            im.thumbnail((RUTA, RUTA), Image.LANCZOS)
            ark.paste(im, (x + (RUTA - im.width) // 2, y + (RUTA - im.height) // 2))
            d.text((x + 4, y + RUTA + 4), "%s  bild %d" % (pid, kol + 1), fill="black")
    ut = os.path.join(HAR, "kontaktark-%d.jpg" % nr)
    ark.save(ut, quality=88)
    print("%s  %dx%d  %d byte" % (os.path.basename(ut), ark.width, ark.height,
                                  os.path.getsize(ut)))
