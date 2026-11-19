#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""horn.py <arbetskatalog> <ut.jpg> id8:pos [id8:pos ...]: hörnkontroll av miljöbilder. Ritar för varje angiven utkastbild (cand/<id8>/d<pos>.jpg)
bildens översta och understa remsa i full bredd (märkningen om AI-genererade personer och scener, `AI-Generated Character and Scene`, sitter
längst ned i ett hörn och syns inte på kontaktarket). En bild som bär märkningen stryks. Kör med /usr/bin/python3 (PIL)."""
import sys
from PIL import Image, ImageDraw, ImageFont

rot, ut = sys.argv[1], sys.argv[2]
poster = [a.split(':') for a in sys.argv[3:]]
W = 1600
try:
    f = ImageFont.load_default(size=26)
except TypeError:
    f = ImageFont.load_default()
rader = []
for k, p in poster:
    im = Image.open(f'{rot}/cand/{k}/d{p}.jpg').convert('RGB')
    im = im.resize((W, int(im.height * W / im.width)))
    h = im.height
    topp = im.crop((0, 0, W, int(h * 0.07)))
    botten = im.crop((0, int(h * 0.92), W, h))
    r = Image.new('RGB', (W, topp.height + botten.height + 34), 'white')
    r.paste(topp, (0, 34))
    r.paste(botten, (0, 34 + topp.height))
    d = ImageDraw.Draw(r)
    d.rectangle([0, 0, 330, 32], fill='black')
    d.text((6, 2), f'{k} bild {p}', fill='yellow', font=f)
    rader.append(r)
S = Image.new('RGB', (W, sum(r.height + 6 for r in rader)), '#bbbbbb')
y = 0
for r in rader:
    S.paste(r, (0, y))
    y += r.height + 6
S.save(ut, quality=90)
print('skrev', ut, S.size)
