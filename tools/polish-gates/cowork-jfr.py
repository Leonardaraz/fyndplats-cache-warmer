#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# cowork-jfr.py (2026-10-23): jämförelseark för en Cowork-rad, bara läsning av lokala filer.
#
#   cowork-jfr.py <ut-katalog> <utfil.jpg> <rad> <k> [<k> ...]
#
# <ut-katalog> är den som cowork-granska.py skrev (nu_<rad>.jpg = färgens nuvarande bilder, svar/<rad>/<NN>.img = kandidaterna).
# Arket har färgens nuvarande bilder överst (bredd 1000) och de valda kandidaterna under, var och en större än på kontaktarket
# (330 px). Avståndet i `FINNS?` och `liknar annan färgs vy` räcker inte för att kalla en kandidat ny: dHash är gråskala, och två
# skott av samma scen ligger nära varandra. Ögat avgör mot färgens egna bilder. Omgång 3 (rad 55–159): av 27 kandidater som dHash
# klassade som FINNS eller FINNS? valdes 11 (samma pose i en annan färg är en ny bild för den här färgen), och fyra av de 127
# förvalda föll när de lades bredvid vyn (samma bild i en annan beskärning, eller en scen som färgen redan visade).
# Kräver PIL (använd venven med OCR om systempythons saknar den).
import os
import sys

from PIL import Image, ImageDraw

if len(sys.argv) < 5:
    sys.exit(__doc__)
ut, utfil, rad = sys.argv[1], sys.argv[2], sys.argv[3]
ks = [int(x) for x in sys.argv[4:]]
nu = Image.open(os.path.join(ut, "nu_%s.jpg" % rad)).convert("RGB")
W = 1000
nu = nu.resize((W, int(nu.height * W / nu.width)))
S = 330
tiles = []
for k in ks:
    im = Image.open(os.path.join(ut, "svar", rad, "%02d.img" % k)).convert("RGB")
    im.thumbnail((S, S))
    c = Image.new("RGB", (S, S + 18), "white")
    c.paste(im, ((S - im.width) // 2, 18))
    ImageDraw.Draw(c).text((4, 3), "rad %s k%d" % (rad, k), fill="black")
    tiles.append(c)
cols = 3
rows = (len(tiles) + cols - 1) // cols
ark = Image.new("RGB", (W, nu.height + 8 + rows * (S + 18)), "white")
ark.paste(nu, (0, 0))
ImageDraw.Draw(ark).rectangle((0, nu.height, W, nu.height + 6), fill=(200, 0, 0))
for i, c in enumerate(tiles):
    ark.paste(c, ((i % cols) * S, nu.height + 8 + (i // cols) * (S + 18)))
ark.save(utfil, quality=88)
print(utfil, ark.size)
