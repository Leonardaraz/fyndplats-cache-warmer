#!/usr/bin/env python3
"""kropp.py <ut.jpg> <src.jpg>:x,y,w,h ...: förhandsgranskning av utsnitt med butikens kvadratiska mittbeskärning inritad."""
import sys
from PIL import Image, ImageDraw
ut = sys.argv[1]
S = 560
tiles = []
for a in sys.argv[2:]:
    src, box = a.rsplit(':', 1)
    x, y, w, h = [int(v) for v in box.split(',')]
    im = Image.open(src).convert('RGB').crop((x, y, x + w, y + h))
    sc = S / max(im.size)
    t = im.resize((max(1, int(im.size[0] * sc)), max(1, int(im.size[1] * sc))), Image.LANCZOS)
    d = ImageDraw.Draw(t)
    m = min(t.size)
    x0 = (t.size[0] - m) // 2; y0 = (t.size[1] - m) // 2
    d.rectangle((x0, y0, x0 + m - 1, y0 + m - 1), outline=(255, 0, 0), width=2)
    d.text((4, 4), f'{src.split("/")[-1]} {x},{y} {w}x{h}', fill=(255, 0, 0))
    tiles.append(t)
W = sum(t.size[0] + 8 for t in tiles); H = max(t.size[1] for t in tiles) + 8
sheet = Image.new('RGB', (W, H), (255, 255, 255)); cx = 4
for t in tiles:
    sheet.paste(t, (cx, 4)); cx += t.size[0] + 8
sheet.save(ut, quality=88); print(ut, sheet.size)
