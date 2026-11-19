#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""twin.py <arbetskatalog> <kandidat-id8> <publicerad-id8>=<fil-id,fil-id,...> [...]: tvillingkontroll mot publicerade sidor. Hämtar den publicerade sidans bilder
(Wix-fil-id, en i taget) till <arbetskatalog>/pub/<id8>/ och räknar dHash 16 x 16 mellan varje kandidatbild (cand/<id8>/d1..d6.jpg) och varje publicerad bild,
rak och spegelvänd. Samma foto ger högst 5 (`vevor.md`). Skriver det lägsta avståndet per kandidatbild. Kör med /usr/bin/python3 (PIL)."""
import os, subprocess, sys
from PIL import Image, ImageOps


def dh(im):
    g = im.convert('L').resize((17, 16), Image.LANCZOS)
    p = list(g.getdata())
    return [1 if p[y * 17 + x] > p[y * 17 + x + 1] else 0 for y in range(16) for x in range(16)]


def av(a, b):
    return sum(x != y for x, y in zip(a, b))


rot, k = sys.argv[1], sys.argv[2]
cand = {}
for i in range(1, 7):
    f = f'{rot}/cand/{k}/d{i}.jpg'
    if os.path.exists(f):
        im = Image.open(f)
        cand[i] = (dh(im), dh(ImageOps.mirror(im)))
for a in sys.argv[3:]:
    pid, ids = a.split('=')
    mapp = f'{rot}/pub/{pid}'
    os.makedirs(mapp, exist_ok=True)
    lo = {}
    for n, fid in enumerate(ids.split(','), 1):
        f = f'{mapp}/p{n}.jpg'
        if not os.path.exists(f) or os.path.getsize(f) < 2000:
            subprocess.run(['curl', '-sS', '-L', '--max-time', '40', '-o', f, f'https://static.wixstatic.com/media/{fid}'], capture_output=True)
        try:
            h = dh(Image.open(f))
        except Exception:
            print(pid, 'bild', n, 'gick inte att läsa')
            continue
        for i, (c, cm) in cand.items():
            d = min(av(c, h), av(cm, h))
            if i not in lo or d < lo[i][0]:
                lo[i] = (d, n)
    print(k, 'mot', pid, '| lägsta avstånd per kandidatbild:', ', '.join(f'd{i}: {d} (p{n})' for i, (d, n) in sorted(lo.items())))
