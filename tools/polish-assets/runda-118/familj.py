# -*- coding: utf-8 -*-
"""Runda 118 pixelgrind — BEVISAR en dubblett, utesluter ingen.

Runda 117 mätte upp varför måttet bara får bära ETT påstående: gråskala mäter
LJUSHET, så två färgsyskon av samma möbel ligger längre isär än två helt olika
möbler. Tröskeln under 1,0 betyder "samma bildfil", alltså samma foto — och det
är samma fysiska produkt. Ett HÖGT tal betyder ingenting alls; där avgör måtten.
"""
import itertools
import pathlib

import numpy as np
from PIL import Image

HAR = pathlib.Path(__file__).parent
TROSKEL = 1.0
STORLEK = (320, 320)

BATCH = ["820d076b", "15d6fcef", "0fd65541", "2e292a70",
         "a4ee97c1", "8a73caf4", "fcb86875", "ca20d60e"]
# Utanför batchen men i mätningen: dubblettmisstanken och dess två publicerade
# referenssidor, plus den publicerade serveringsvagn som delar 66 x 40 cm.
MISSTANKE = ["764a3efc"]
PUBLICERADE = ["0910f983", "fba157f2", "306a7d49"]


def bilder(pid):
    for p in sorted((HAR / "rawbilder").glob(f"{pid}-*.jpg")):
        if p.stat().st_size < 2000:      # 63-bytes "bad file" är inte en bild
            continue
        yield p


def gra(p):
    return np.asarray(Image.open(p).convert("L").resize(STORLEK), dtype=np.float64)


def avstand(a, b):
    ga = [gra(p) for p in bilder(a)]
    gb = [gra(p) for p in bilder(b)]
    if not ga or not gb:
        raise SystemExit(f"saknar bilder: {a} {len(ga)} / {b} {len(gb)}")
    return min(float(np.abs(x - y).mean()) for x in ga for y in gb)


def kontroll():
    """Självtest: måttet MÅSTE bottna på en produkt mot sig själv."""
    fel = []
    egen = avstand("820d076b", "820d076b")
    if egen > 0.001:
        fel.append(f"produkt mot sig själv gav {egen:.2f}, ska vara 0")
    # Och det ska INTE bottna mellan två produkter vi vet är olika möbler.
    olika = avstand("fcb86875", "ca20d60e")
    if olika < TROSKEL:
        fel.append(f"rund rattanvagn ~ industrivagn gav {olika:.2f}, under tröskeln")
    return fel, egen, olika


if __name__ == "__main__":
    fel, egen, olika = kontroll()
    print(f"självtest: eget {egen:.2f} · två olika {olika:.2f} · {len(fel)} fel")
    for f in fel:
        print("  ✗", f)

    alla = BATCH + MISSTANKE + PUBLICERADE
    par = []
    for a, b in itertools.combinations(alla, 2):
        par.append((avstand(a, b), a, b))
    par.sort()
    print(f"\n{len(par)} par, de tio närmaste:")
    for d, a, b in par[:10]:
        flagga = "  ☠️ SAMMA BILDFIL" if d < TROSKEL else ""
        print(f"  {d:7.2f}  {a} ~ {b}{flagga}")
    under = [p for p in par if p[0] < TROSKEL]
    print(f"\n{len(under)} par under tröskeln {TROSKEL}")
