#!/usr/bin/env python3
"""stampelskan.py <bild>...: letar efter VEVOR:s inbrända text "AI-Generated Character and Scene" nere till höger i varje bild.

Mallen (stampel-mall.png, 540 x 45 px) är de ljusa pixlarna (över 205) i det nedre högra hörnet av en 1600 px bred bild som bär
märkningen. En bild räknas efter att ha skalats till 1600 px bredd: samma hörn tröskelsätts på samma sätt och jämförs med mallen
(snittet delat med unionen, bästa värdet över små förskjutningar). En bild med märkningen ger 0,8 till 1,0 och en utan ger under 0,1
(mätt 2026-11-05 på 2 849 bilder: träff på tio produkter, och på de sju som redan är polerade är bilden struken medan de tre andra är utkast).
Bilden stryks hel, den beskärs inte (FLAGGADE-VEVOR.md (fl))."""
import os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
MALL = np.asarray(Image.open(os.path.join(HERE, 'stampel-mall.png'))) > 127


def hornet(path):
    im = Image.open(path).convert('L')
    w, h = im.size
    if w != 1600:
        im = im.resize((1600, int(round(h * 1600 / w))), Image.LANCZOS)
        w, h = im.size
    return np.asarray(im.crop((1060, h - 45, 1600, h))) > 205


def poang(path):
    a = hornet(path)
    basta = 0.0
    for dx in range(-8, 9, 4):
        for dy in range(-6, 7, 3):
            b = np.roll(np.roll(a, dx, axis=1), dy, axis=0)
            u = (MALL | b).sum()
            if u:
                basta = max(basta, (MALL & b).sum() / u)
    return basta


if __name__ == '__main__':
    for p in sys.argv[1:]:
        s = poang(p)
        print(f'{os.path.basename(p)}\t{s:.3f}\t{"MÄRKNING" if s > 0.5 else "-"}')
