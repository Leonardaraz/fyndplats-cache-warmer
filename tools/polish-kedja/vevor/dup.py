#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""dup.py <arbetskatalog> id8 [id8 ...]: dHash 16 x 16 (256 bitar) mellan varje par av utkastets bilder, rak och spegelvänd. Samma foto ger högst 5
(`vevor.md`, tvillingkontrollen). Listar par med avstånd under 60 så att de kan ses med ögonen; fäller inte. Kör med /usr/bin/python3 (PIL)."""
import sys
from PIL import Image, ImageOps


def dh(im):
    g = im.convert('L').resize((17, 16), Image.LANCZOS)
    p = list(g.getdata())
    return [1 if p[y * 17 + x] > p[y * 17 + x + 1] else 0 for y in range(16) for x in range(16)]


def av(a, b):
    return sum(x != y for x, y in zip(a, b))


rot = sys.argv[1]
for k in sys.argv[2:]:
    ims = {}
    for i in range(1, 7):
        try:
            ims[i] = Image.open(f'{rot}/cand/{k}/d{i}.jpg')
        except Exception:
            pass
    h = {i: dh(im) for i, im in ims.items()}
    hs = {i: dh(ImageOps.mirror(im)) for i, im in ims.items()}
    rader = []
    for i in h:
        for j in h:
            if j <= i:
                continue
            d1, d2 = av(h[i], h[j]), av(h[i], hs[j])
            if min(d1, d2) < 60:
                rader.append(f'{i}-{j}: rak {d1}, spegel {d2}')
    print(k, '|', '; '.join(rader) if rader else 'inga par under 60')
