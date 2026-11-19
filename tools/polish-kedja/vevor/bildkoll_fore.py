#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""bildkoll_fore.py <arbetskatalog> [id8 ...]: räknar hur många OLIKA foton varje utkast har, FÖRE att texten skrivs.

`gate-bilddubblett.py` och `gate-bildspegel.py` körs från rundans katalog efter bygget, och då är texterna redan skrivna.
Runda vevor-383 (2026-11-19): två fristående kajakställ hade bara tre olika renderingar, resten var byte-identiska eller
spegelvända kopior, och strandbilden bar ett annat märke på kajakerna och låg på båda sidorna. Texterna, omdömena och
alt-texterna för båda hade hunnit skrivas när grinden fällde dem, och sidorna hölls. Den här kontrollen körs direkt efter
`ingest.py` och mäter som grinden gör (varan beskärs till sin ruta, 96 × 96 gråskala, medelavvikelse), på utkastets egna
bilder `cand/<id8>/d<n>.jpg`:

  under 0,02  = samma foto (fynd)        0,02-0,04 = misstänkt, se med ögonen
  spegelvänt  = samma mått efter en vänstervänd spegling (samma foto spegelvänt är samma foto)

Skriver för varje utkast ett antal OLIKA foton (samma foto och spegelvänd kopia räknas som ett) och varnar när det är under
fem (runbookens *Minst fem bilder*; strykningar av en dubblett fyller inte upp). Jämför också bilderna mellan utkasten du
anger (två syskonsidor får inte dela foto). Utan id8 tas alla kataloger under `cand/`.
Kör med /usr/bin/python3 (PIL och numpy)."""
import itertools
import os
import sys

import numpy as np
from PIL import Image

SAMMA = 0.02
MISSTANKT = 0.04


def laddas(fn):
    im = Image.open(fn).convert("L")
    a = np.asarray(im, dtype=np.float32)
    ej_vit = a < 245
    if ej_vit.mean() > 0.002:
        ys, xs = np.where(ej_vit)
        im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    return np.asarray(im.resize((96, 96)), dtype=np.float32) / 255.0


def avstand(a, b):
    return float(np.abs(a - b).mean())


def main():
    arb = sys.argv[1]
    cand = os.path.join(arb, "cand")
    kort = sys.argv[2:] or sorted(os.listdir(cand))
    bild = {}
    for k in kort:
        d = os.path.join(cand, k)
        fil = sorted((f for f in os.listdir(d) if f.startswith("d") and f.endswith(".jpg") and f[1:-4].isdigit()), key=lambda f: int(f[1:-4]))
        bild[k] = [(int(f[1:-4]), laddas(os.path.join(d, f))) for f in fil]
    for k in kort:
        par = list(itertools.combinations(bild[k], 2))
        grupp = list(range(len(bild[k])))   # union-find på 'samma foto' eller spegelvänd kopia

        def rot(i):
            while grupp[i] != i:
                grupp[i] = grupp[grupp[i]]
                i = grupp[i]
            return i
        for (i, (p, a)), (j, (q, b)) in itertools.combinations(list(enumerate(bild[k])), 2):
            d_rakt = avstand(a, b)
            d_spegel = avstand(a, b[:, ::-1])
            tag = None
            if d_rakt < SAMMA:
                tag = "SAMMA"
            elif d_spegel < SAMMA:
                tag = "SPEGELVÄND KOPIA"
            elif d_rakt < MISSTANKT or d_spegel < MISSTANKT:
                tag = "misstänkt (se med ögonen)"
            if tag:
                print(f"  {k}: position {p} och {q}: {tag} (rakt {d_rakt:.3f}, spegelvänt {d_spegel:.3f})")
            if tag in ("SAMMA", "SPEGELVÄND KOPIA"):
                grupp[rot(i)] = rot(j)
        olika = len({rot(i) for i in range(len(bild[k]))})
        print(f"{k}: {len(bild[k])} bilder, {olika} olika foton" + ("  ⚠️ UNDER FEM" if olika < 5 else ""))
    # mellan utkasten
    if len(kort) > 1:
        for k1, k2 in itertools.combinations(kort, 2):
            for p, a in bild[k1]:
                for q, b in bild[k2]:
                    d = min(avstand(a, b), avstand(a, b[:, ::-1]))
                    if d < SAMMA:
                        print(f"  MELLAN SIDOR: {k1} position {p} och {k2} position {q} är samma foto ({d:.3f})")


main()
