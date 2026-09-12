# -*- coding: utf-8 -*-
"""Runda 136 Steg 4 — hämta galleriet och bygg ett kontaktark per produkt.

☠️ POSITIONERNA I WIX ÄR INTE LEVERANTÖRENS. Importen tar hem `RENA_BILD-
   POSITIONER = [1, 2, 3, 8, 9]`, så Wix-plats 1–5 motsvarar källans 1, 2, 3,
   8 och 9. De som ska granskas för TYSK TEXT är källans 3, 8 och 9 — alltså
   Wix-plats 3, 4 och 5. Plats 1 och 2 är huvudbild och livsstilsbild och är
   mätt rena (30/30 i husets bildmätning).

☠️ OCH VARJE BILDS ÖVRE VÄNSTRA HÖRN SKA LÄSAS. Uppgift #282: en bild bar
   `HOMCOM by Aosom` inbränt där. En grep över källkoden svarar grönt medan
   kundens öga läser leverantörens namn.
"""
import json
import os
import subprocess

from PIL import Image, ImageDraw

HAR = os.path.dirname(os.path.abspath(__file__))
BAS = "https://static.wixstatic.com/media/"

GALLERI = json.load(open(os.path.join(HAR, "galleri.json"), encoding="utf-8"))


def hamta():
    n = 0
    for pid, filer in GALLERI.items():
        for i, f in enumerate(filer, 1):
            ut = os.path.join(HAR, "raw", "%s-%d.jpg" % (pid, i))
            if os.path.exists(ut):
                continue
            url = BAS + f + "/v1/fit/w_900,h_900,q_85/f.jpg"
            r = subprocess.run(["curl", "-sS", "-o", ut, url])
            if r.returncode or not os.path.exists(ut):
                raise SystemExit("HÄMTNING FÖLL: %s bild %d" % (pid, i))
            n += 1
    return n


def ark():
    """Ett kontaktark per produkt: fem bilder i rad, numrerade med KÄLLANS
    position — inte Wix — så granskningen frågar rätt bild rätt fråga."""
    RUTA = 430
    KALLA = [1, 2, 3, 8, 9]          # importens RENA_BILDPOSITIONER
    gjorda = []
    for pid, filer in GALLERI.items():
        ark = Image.new("RGB", (RUTA * len(filer), RUTA + 30), "white")
        d = ImageDraw.Draw(ark)
        for i in range(1, len(filer) + 1):
            b = Image.open(os.path.join(HAR, "raw", "%s-%d.jpg" % (pid, i)))
            b.thumbnail((RUTA - 10, RUTA - 10))
            x = (i - 1) * RUTA + (RUTA - b.width) // 2
            ark.paste(b, (x, (RUTA - b.height) // 2))
            d.text(((i - 1) * RUTA + 8, RUTA + 8),
                   "wix %d  =  kalla %d" % (i, KALLA[i - 1]), fill="black")
        ut = os.path.join(HAR, "ark-%s.jpg" % pid)
        ark.save(ut, quality=88)
        gjorda.append(ut)
    return gjorda


if __name__ == "__main__":
    print("hamtade %d bilder" % hamta())
    for a in ark():
        print("ark:", os.path.basename(a))
